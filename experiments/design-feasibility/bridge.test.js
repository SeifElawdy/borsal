import {describe,it,expect,vi} from 'vitest';
const {bridge}=require('./bridge');
const {examples}=require('./examples');
const {designSchema}=require('../design-language/schema');
const {runPipeline}=require('../pattern-feasibility/pipeline');
const {createHash}=require('crypto');
const input=(name='synthetic')=>structuredClone(examples()[name]);
const codes=out=>out.errors.map(e=>e.code);
const missing=out=>out.missingRequirements.map(e=>e.code);
describe('Offline design-to-feasibility bridge',()=>{
  for(const name of ['concept-eight-b','concept-seventy-b'])it('keeps '+name+' concept-only with original brief and source linkage',()=>{
    const r=input(name),out=bridge(r);expect(out.status).toBe('CONCEPT_ONLY');expect(out.verdict).toBe('UNVERIFIED');expect(out.pipeline).toBe(null);
    expect(out.source.snapshot).toEqual(r.source.data);expect(out.source.snapshot.provenance.responseSha256).toBe(r.source.data.provenance.responseSha256);
    expect(out.missingRequirements.filter(m=>m.code==='CREATIVE_REQUIREMENT_UNVERIFIED')).toHaveLength(r.source.data.requirements.length);
    expect(out.review.checks.every(c=>c.status==='UNVERIFIED')).toBe(true);expect(out.manufacturingVerified).toBe(false);
  });
  for(const name of ['eight-b-original','seventy-b-original'])it('rejects saved malformed '+name+' without repair or pipeline execution',()=>{
    const r=input(name),out=bridge(r);expect(out.status).toBe('REJECTED');expect(out.verdict).toBe('FAIL');expect(codes(out)).toContain('INVALID_SOURCE');
    expect(out.pipeline).toBe(null);expect(out.errors[0].issues.length).toBeGreaterThan(0);expect(out.source.snapshot).toEqual(r.source.data);
  });
  it('maps explicit cut instances, seam edges, copy references, BOM and grain without inferring data',()=>{
    const r=input();expect(designSchema.safeParse(r.source.data).success).toBe(true);const out=bridge(r);
    expect(out.status).toBe('CHECKED');expect(out.verdict).toBe('UNVERIFIED');expect(out.pipeline.structuralStatus).toBe('PASS');
    expect(out.pipeline.layers.geometry.status).toBe('PASS');expect(out.pipeline.layers.physicalEvidence.status).toBe('UNVERIFIED');
    expect(out.pipelineInput.pieces.map(p=>p.polygonCm)).toEqual(r.context.instances.map(i=>i.cuttingPolygonCm));
    expect(out.pipelineInput.pattern.assembly[0].sides.map(s=>[s.pieceId,s.copy,s.edgeIds])).toEqual([['triangle-a',1,['bottom']],['triangle-b',1,['bottom']]]);
    expect(out.pipelineInput.pattern.pieces[0].edges).toEqual([{id:'bottom',basis:'STITCHING',segmentIndex:0},{id:'diagonal',basis:'STITCHING',segmentIndex:1},{id:'left',basis:'STITCHING',segmentIndex:2}]);
    expect(out.pipelineInput.bom.find(b=>b.id==='thread').quantity.value).toBe(100);expect(out.pipelineInput.pieces[0].grain).toEqual({localDirectionDeg:0,toleranceDeg:0});
    expect(out.pipeline).toEqual(runPipeline(out.pipelineInput));
  });
  it('snapshots original source/context and records reproducible hashes and instance lineage',()=>{
    const r=input(),out=bridge(r);expect(out.source.sha256).toBe(createHash('sha256').update(JSON.stringify(r.source.data)).digest('hex'));
    expect(out.contextEvidence.snapshot).toEqual(r.context);expect(out.contextEvidence.sha256).toBe(createHash('sha256').update(JSON.stringify(r.context)).digest('hex'));
    expect(out.mapping.map(i=>[i.sourcePieceId,i.sourceCopy,i.instanceId])).toEqual([['panel',1,'triangle-a'],['panel',2,'triangle-b']]);
    r.source.data.name='Changed later';r.context.instances[0].cuttingPolygonCm[0][0]=99;expect(out.source.snapshot.name).not.toBe('Changed later');expect(out.contextEvidence.snapshot.instances[0].cuttingPolygonCm[0][0]).toBe(0);
  });
  it('reports missing cutting instances instead of offsetting seam lines',()=>{
    const r=input('incomplete'),out=bridge(r);expect(out.status).toBe('CONCEPT_ONLY');expect(missing(out)).toContain('EXPLICIT_CUTTING_INSTANCE_REQUIRED');expect(out.pipeline).toBe(null);expect(out.pipelineInput).toBe(null);
  });
  it('does not infer missing fabric, stock, stock bindings or grain tolerance',()=>{
    for(const [remove,code]of [[r=>delete r.context.fabric,'CONFIRMED_FABRIC_REQUIRED'],[r=>delete r.context.stock,'EXPLICIT_STOCK_SNAPSHOT_REQUIRED'],[r=>delete r.context.stockBindings,'STOCK_BINDING_REQUIRED'],[r=>delete r.context.instances[0].grainToleranceDeg,'GRAIN_TOLERANCE_REQUIRED'],[r=>delete r.context.fabric.grainDirectionDeg,'FABRIC_GRAIN_REQUIRED']]){
      const r=input();remove(r);const out=bridge(r);expect(out.status).toBe('CONCEPT_ONLY');expect(missing(out)).toContain(code);expect(out.pipeline).toBe(null);
    }
  });
  it('preserves failed stock feasibility without treating a valid BOM as available inventory',()=>{
    const out=bridge(input('shortage'));expect(out.status).toBe('CHECKED');expect(out.verdict).toBe('FAIL');expect(out.pipeline.layers.materials.status).toBe('FAIL');
    expect(out.pipeline.evidence.precheck.stockChecks.find(s=>s.stockId==='thread-stock')).toMatchObject({required:100,available:10,unit:'cm'});
  });
  it('preserves incomplete stock availability and bounded search as UNVERIFIED',()=>{
    const a=input();a.context.stock.items=[];a.context.stock.complete=false;expect(bridge(a).pipeline.layers.materials.status).toBe('UNVERIFIED');
    const b=input();b.context.search.maxCandidates=1;const out=bridge(b);expect(out.status).toBe('CHECKED');expect(out.pipeline.evidence.nesting.status).toBe('NO_LAYOUT_FOUND');expect(out.verdict).toBe('UNVERIFIED');
  });
  it('rejects wrong versions, units, reference types, stock quantities and nonfinite coordinates',()=>{
    for(const change of [r=>r.schemaVersion='bad',r=>r.source.data.technical.dimensionUnit='mm',r=>r.context.instances[0].cuttingPolygonCm[0][0]=Infinity,r=>r.context.stock.items[0].quantity.value=-1,r=>r.context.instances[0].allowancesIncluded=false,r=>r.context.fabric.geometry.polygonCm[0][0]=NaN]){
      const r=input();change(r);expect(bridge(r).status).toBe('REJECTED');expect(bridge(r).pipeline).toBe(null);
    }
  });
  it('rejects original source BOM units and broken piece, edge, thread and copy references',()=>{
    for(const change of [r=>r.source.data.technical.bom[1].quantity.unit='piece',r=>r.source.data.technical.assembly[0].sides[0].pieceId='missing',r=>r.source.data.technical.assembly[0].sides[0].edgeIds=['missing'],r=>r.source.data.technical.assembly[0].threadBomId='outer',r=>r.source.data.technical.assembly[0].sides[0].copy=3]){
      const r=input();change(r);expect(codes(bridge(r))).toContain('INVALID_SOURCE');
    }
  });
  it('rejects self-intersecting source seam polygons even if original structural schema parses',()=>{
    const r=input(),p=r.source.data.technical.patternPieces[0];p.outline.start=[0,0];p.outline.segments=[{id:'one',type:'LINE',to:[2,2]},{id:'two',type:'LINE',to:[0,2]},{id:'three',type:'LINE',to:[2,0]},{id:'four',type:'LINE',to:[0,0]}];r.source.data.technical.assembly=[];
    expect(designSchema.safeParse(r.source.data).success).toBe(true);delete r.context;const out=bridge(r);expect(codes(out)).toContain('INVALID_SOURCE_SEAM_POLYGON');expect(out.status).toBe('REJECTED');
  });
  it('rejects malformed cut polygons, duplicate mappings and unknown copies without dropping them',()=>{
    for(const change of [r=>r.context.instances[0].cuttingPolygonCm=[[0,0],[2,2],[0,2],[2,0]],r=>r.context.instances.push(r.context.instances[0]),r=>r.context.instances[0].copy=3,r=>r.context.instances[0].pieceId='unknown',r=>r.context.instances[1].id=r.context.instances[0].id]){
      const r=input();change(r);expect(bridge(r).status).toBe('REJECTED');expect(bridge(r).pipeline).toBe(null);
    }
  });
  it('rejects incompatible fabric identities, confirmation and geometry',()=>{
    const a=input();a.context.fabric.id='wrong';expect(codes(bridge(a))).toContain('SCRAP_ID_MISMATCH');
    const b=input();b.context.fabric.geometry.confirmed=false;expect(codes(bridge(b))).toContain('FABRIC_NOT_CONFIRMED');
    const c=input();c.context.fabric.geometry.polygonCm=[[0,0],[2,2],[0,2],[2,0]];delete c.context.instances;expect(codes(bridge(c))).toContain('INVALID_FABRIC_GEOMETRY');
  });
  it('rejects contradictory stitching geometry and out-of-piece anchors before 4D runs',()=>{
    const a=input();a.context.instances[0].cuttingPolygonCm=[[0,0],[0.5,0],[0,0.5]];const first=bridge(a);expect(first.status).toBe('REJECTED');expect(codes(first)).toContain('STITCHING_LINE_OUTSIDE_CUTTING_OUTLINE');
    const b=input();b.source.data.technical.assembly.push({id:'attach',type:'ATTACH',threadBomId:'thread',from:{pieceId:'panel',copy:1,point:[20,20]},to:{pieceId:'panel',copy:2,point:[0.4,0.4]}});delete b.context.stock;
    const second=bridge(b);expect(second.status).toBe('REJECTED');expect(codes(second)).toContain('ANCHOR_OUTSIDE_PATTERN');expect(second.pipeline).toBe(null);
  });
  it('rejects disconnected source edge chains instead of regenerating them',()=>{
    const r=input();r.source.data.technical.assembly[0].sides[0].edgeIds=['bottom','left'];const out=bridge(r);expect(out.status).toBe('REJECTED');expect(codes(out)).toContain('DISCONNECTED_EDGE_CHAIN');
  });
  it('keeps Bezier outlines unsupported without speculative flattening',()=>{
    const r=input();r.source.data.technical.patternPieces[0].outline.segments[0]={id:'bottom',type:'CUBIC_BEZIER',control1:[0.4,0.1],control2:[1,0.1],to:[1.4,0.2]};const out=bridge(r);
    expect(out.status).toBe('CONCEPT_ONLY');expect(missing(out)).toContain('EXPLICIT_CURVE_REPRESENTATION_REQUIRED');expect(out.pipeline).toBe(null);
  });
  it('retains source features, folds and informative limitations as unresolved physical claims',()=>{
    const r=input();r.source.data.technical.features.push({id:'closure',kind:'CLOSURE',intent:'Original wooden closure intent',componentIds:['body'],bomIds:[]});
    r.source.data.limitations.push({id:'closure-limit',featureId:'closure',status:'UNSUPPORTED',reason:'No assembled alignment model',missingInformation:['Closure alignment']});
    r.source.data.technical.patternPieces[0].folds.push({id:'fold',type:'PLEAT',from:[0.4,0.4],to:[0.5,0.5],allowanceCm:0.1});
    const out=bridge(r);expect(out.status).toBe('CHECKED');expect(out.pipeline.layers.construction.status).toBe('UNVERIFIED');expect(out.pipelineInput.pattern.physicalClaims.join(' ')).toContain('PLEAT');
    expect(out.pipelineInput.pattern.unsupportedClaims[0].missingInformation).toEqual(['Closure alignment']);expect(out.source.snapshot).toEqual(r.source.data);
  });
  it('keeps stock cutting pieces unsupported rather than nesting them on the scrap',()=>{
    const r=input();const extra=structuredClone(r.source.data.technical.patternPieces[0]);extra.id='lining';extra.cutCount=1;extra.bomId='lining-material';
    r.source.data.technical.bom.push({id:'lining-material',source:{kind:'STOCK',availability:'NOT_CHECKED'},material:{type:'LINING_FABRIC',specs:{fiber:'COTTON',weightGsm:100}},quantity:{value:10,unit:'cm2'}});
    r.source.data.technical.patternPieces.push(extra);r.source.data.technical.components.push({id:'lining-component',role:'LINING',pieceIds:['lining']});const out=bridge(r);expect(out.status).toBe('CONCEPT_ONLY');expect(missing(out)).toContain('STOCK_CUTTING_NOT_SUPPORTED');
  });
  it('bounds cut-count expansion and never invents missing copies',()=>{
    const r=input();r.source.data.technical.patternPieces[0].cutCount=100000000;const out=bridge(r);expect(out.status).toBe('CONCEPT_ONLY');expect(missing(out)).toContain('INSTANCE_LIMIT_EXCEEDED');
  });
  it('rejects unknown binding BOM IDs and incompatible stock material specifications',()=>{
    const a=input();a.context.stockBindings.wrong='thread-stock';expect(codes(bridge(a))).toContain('INVALID_STOCK_BINDING');
    const b=input();b.context.stock.items[0].material.specs.tex=30;expect(codes(bridge(b))).toContain('STOCK_SPECIFICATIONS_MISMATCH');
  });
  it('remains pure, deterministic and network-free',()=>{
    const r=input(),before=JSON.stringify(r),spy=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('Network forbidden'));
    try{expect(bridge(r)).toEqual(bridge(r));expect(JSON.stringify(r)).toBe(before);expect(spy).not.toHaveBeenCalled();}finally{spy.mockRestore();}
  });
  it('supports demo and request-file CLI results without modifying source files',()=>{
    const {main}=require('./run');const demo=main(['--demo']);expect(demo.results.synthetic.status).toBe('CHECKED');expect(demo.results['concept-eight-b'].status).toBe('CONCEPT_ONLY');
    const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-bridge-'));
    try{for(const [name,exit]of [['synthetic',3],['invalid',2],['concept-eight-b',3]]){const file=path.join(root,name+'.json');fs.writeFileSync(file,JSON.stringify(input(name)));const r=cp.spawnSync(process.execPath,[path.join(__dirname,'run.js'),file],{encoding:'utf8'});expect(r.status).toBe(exit);expect(JSON.parse(r.stdout).manufacturingVerified).toBe(false);}}
    finally{if(path.dirname(root)!==os.tmpdir()||!path.basename(root).startsWith('borsal-bridge-'))throw Error('Unsafe cleanup');fs.rmSync(root,{recursive:true,force:true});}
  });
});
