import {describe,it,expect,vi} from 'vitest';
const {runPipeline}=require('./pipeline');
const {pipelineExamples}=require('./pipeline-examples');
const {evaluateLayout,VERSION}=require('./engine');
const input=(name='structural')=>structuredClone(pipelineExamples().requests[name]);
const codes=(out,layer)=>out.layers[layer].reasons.map(r=>r.code);
describe('Unified offline feasibility pipeline',()=>{
  it('finds geometry and preserves independent 4A and 4C evidence without physical approval',()=>{
    const r=input(),out=runPipeline(r);
    expect(out.structuralStatus).toBe('PASS');expect(out.status).toBe('UNVERIFIED');
    expect(out.layers.geometry.status).toBe('PASS');expect(out.layers.physicalEvidence.status).toBe('UNVERIFIED');
    expect(out.placements).toHaveLength(2);expect(out.evidence.nesting.status).toBe('LAYOUT_FOUND');
    expect(out.evidence.independentValidation).toEqual(out.evidence.precheck.validatorEvidence);
    const poses=new Map(out.placements.map(({id,...p})=>[id,p]));
    expect(out.evidence.independentValidation).toEqual(evaluateLayout({schemaVersion:VERSION,unit:'cm',fabric:r.fabric.geometry&&{polygonCm:r.fabric.geometry.polygonCm,holes:[],grainDirectionDeg:r.fabric.grainDirectionDeg},pieces:r.pieces.map(({allowedRotationsDeg,...p})=>({...p,placement:poses.get(p.id)}))}));
    expect(out.manufacturingVerified).toBe(false);expect(out.inventoryMutated).toBe(false);
  });
  it('reports saved synthetic provenance, dimensions, polygons and complete-layout utilization',()=>{
    const out=runPipeline(input());expect(out.provenance.supplied.label).toContain('SYNTHETIC_BURGUNDY');
    expect(out.provenance.physicalAccuracy).toBe('UNVERIFIED');expect(out.provenance.geometryVersion).toBe(1);
    expect(out.measurements.fabric.areaCm2).toBeCloseTo(162.045910493827,8);
    expect(out.measurements.pieces.every(p=>p.areaCm2>0&&p.dimensions&&p.placedPolygonCm.length===3)).toBe(true);
    expect(out.utilization.basis).toBe('COMPLETE_VALIDATED_LAYOUT');expect(out.utilization.utilizedAreaCm2).toBeCloseTo(4,8);
  });
  it('does not confuse bounded search exhaustion with invalid geometry or impossibility',()=>{
    const out=runPipeline(input('bounded'));expect(out.status).toBe('UNVERIFIED');
    expect(out.layers.nesting.status).toBe('UNVERIFIED');expect(codes(out,'nesting')).toContain('CANDIDATE_LIMIT');
    expect(out.layers.geometry.status).toBe('UNVERIFIED');expect(out.globalFeasibility).toBe('NOT_ASSESSED');
    expect(out.placements).toEqual([]);expect(out.measurements).toBe(null);
    expect(out.utilization.basis).toBe('BEST_VALID_PARTIAL_LAYOUT');expect(out.evidence.nesting.generatedCandidates).toBe(1);
  });
  it('fails invalid cutting geometry with no manufactured measurements',()=>{
    const out=runPipeline(input('invalid'));expect(out.status).toBe('FAIL');expect(out.layers.geometry.status).toBe('FAIL');
    expect(out.evidence.nesting.reason).toBe('INVALID_FABRIC_OR_PIECE');expect(out.measurements).toBe(null);expect(out.placements).toEqual([]);
  });
  it('fails invalid fabric, rather than attempting to repair it',()=>{
    const r=input();r.fabric.geometry.polygonCm=[[0,0],[2,2],[0,2],[2,0]];
    expect(runPipeline(r).layers.geometry.status).toBe('FAIL');
  });
  it('reports area necessary-condition failure without claiming search completeness',()=>{
    const r=input();r.pieces[0].polygonCm=[[0,0],[30,0],[0,30]];const out=runPipeline(r);
    expect(out.status).toBe('FAIL');expect(codes(out,'geometry')).toContain('AREA_PRECHECK_FAILED');
    expect(out.evidence.nesting.attemptedCandidates).toBe(0);expect(out.evidence.nesting.globalImpossibilityClaimed).toBe(false);
  });
  it('preserves missing allowances and grain as unresolved, without changing cutting geometry',()=>{
    const r=input('incomplete'),before=JSON.stringify(r.pieces);const out=runPipeline(r);
    expect(out.layers.geometry.status).toBe('PASS');expect(out.layers.allowances.status).toBe('UNVERIFIED');
    expect(out.layers.grain.status).toBe('UNVERIFIED');expect(out.layers.materials.status).toBe('UNVERIFIED');
    expect(JSON.stringify(r.pieces)).toBe(before);expect(out.blockers.some(b=>b.layer==='grain')).toBe(true);
  });
  it('checks available stock and fails shortages without consuming or reserving anything',()=>{
    const r=input('insufficient'),before=JSON.stringify(r.stock),out=runPipeline(r);
    expect(out.layers.geometry.status).toBe('PASS');expect(out.layers.materials.status).toBe('FAIL');expect(out.status).toBe('FAIL');
    expect(codes(out,'materials')).toContain('INSUFFICIENT_STOCK');expect(out.evidence.precheck.stockChecks.find(s=>s.stockId==='thread-stock')).toMatchObject({required:100,available:10,unit:'cm'});
    expect(JSON.stringify(r.stock)).toBe(before);
  });
  it('does not assume stock exists when the snapshot is omitted',()=>{
    const r=input();delete r.stock;const out=runPipeline(r);expect(out.layers.materials.status).toBe('UNVERIFIED');expect(out.status).toBe('UNVERIFIED');
  });
  it('fails inconsistent thread, pattern BOM and component references',()=>{
    expect(codes(runPipeline(input('references')),'assembly')).toContain('INVALID_THREAD_BOM');
    const a=input();a.pattern.pieces[0].bomId='missing';expect(runPipeline(a).layers.materials.status).toBe('FAIL');
    const b=input('valid');b.pattern.connections[0].toComponentId='missing';expect(runPipeline(b).layers.assembly.status).toBe('FAIL');
  });
  it('preserves unsupported construction and actual missing-information details',()=>{
    const r=input();r.pattern.assembly.push({id:'sculpture',type:'SCULPTURAL_FOLD'});
    r.pattern.unsupportedClaims.push({id:'drape',description:'Sculptural drape',reason:'3D response unknown',missingInformation:['Bending response']});
    const out=runPipeline(r);expect(out.layers.construction.status).toBe('UNVERIFIED');expect(out.layers.assembly.status).toBe('UNVERIFIED');
    expect(out.blockers.some(b=>b.code==='UNSUPPORTED_PHYSICAL_CLAIM'&&b.missingInformation.includes('Bending response'))).toBe(true);
  });
  it('never promotes unknown materials or unverifiable closures to PASS',()=>{
    const r=input();const custom={type:'NOVEL_FIBER',specs:{description:'Unknown response'}};
    r.fabric.material=custom;r.bom[0].material=custom;const out=runPipeline(r);
    expect(out.layers.materials.status).toBe('UNVERIFIED');expect(out.status).toBe('UNVERIFIED');
    const closure=runPipeline(input('valid'));expect(closure.layers.construction.status).toBe('UNVERIFIED');expect(closure.layers.assembly.status).toBe('PASS');
  });
  it('keeps missing confirmation unresolved and explicit unconfirmed fabric failed',()=>{
    const a=input();delete a.fabric.geometry.confirmed;delete a.fabric.geometry.version;expect(runPipeline(a).layers.geometry.status).toBe('UNVERIFIED');
    const b=input();b.fabric.geometry.confirmed=false;expect(runPipeline(b).status).toBe('FAIL');
  });
  it('enforces grain rotation choices without declaring global impossibility on search exhaustion',()=>{
    const r=input();r.pieces.forEach(p=>{p.allowedRotationsDeg=[90];p.grain={localDirectionDeg:0,toleranceDeg:0};});r.search.maxCandidates=20;
    const out=runPipeline(r);expect(out.evidence.nesting.status).toBe('NO_LAYOUT_FOUND');expect(out.status).toBe('UNVERIFIED');
    expect(out.evidence.nesting.rejectionCounts.GRAIN_DIRECTION_MISMATCH).toBeGreaterThan(0);
  });
  it('uses the existing hole-aware validation for the complete pipeline',()=>{
    const r=input();r.fabric.geometry.polygonCm=[[0,0],[10,0],[10,10],[0,10]];r.fabric.geometry.holes=[[[4,4],[6,4],[6,6],[4,6]]];
    const out=runPipeline(r);expect(out.layers.geometry.status).toBe('PASS');expect(out.evidence.independentValidation.fabric.holes).toHaveLength(1);expect(out.measurements.fabric.areaCm2).toBe(96);
  });
  it('rejects malformed contracts and preserves inherited duplicate-ID refinements before search',()=>{
    for(const edit of [r=>r.unit='mm',r=>r.pieces[0].polygonCm[0][0]=Infinity,r=>r.pieces.push(r.pieces[0]),r=>r.bom.push(r.bom[0]),r=>r.manufacturingVerified=true,r=>r.search.maxCandidates=100001]){
      const r=input();edit(r);const out=runPipeline(r);expect(out.status).toBe('FAIL');expect(out.layers.input.status).toBe('FAIL');expect(out.evidence.nesting).toBe(null);
    }
  });
  it('is deterministic, does not mutate input and makes no network requests',()=>{
    const r=input(),before=JSON.stringify(r),spy=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('Network prohibited'));
    try{expect(runPipeline(r)).toEqual(runPipeline(r));expect(JSON.stringify(r)).toBe(before);expect(spy).not.toHaveBeenCalled();}finally{spy.mockRestore();}
  });
  it('runs reproducible CLI demos and request-file exit codes without saved artifacts',()=>{
    const {main}=require('./pipeline-run');const demo=main(['--demo']);expect(demo.results.structural.structuralStatus).toBe('PASS');expect(demo.results.invalid.status).toBe('FAIL');expect(demo.results.references.status).toBe('FAIL');
    const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');const root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-pipeline-'));
    try{for(const [name,exit]of [['structural',3],['insufficient',2]]){const file=path.join(root,name+'.json');fs.writeFileSync(file,JSON.stringify(input(name)));const result=cp.spawnSync(process.execPath,[path.join(__dirname,'pipeline-run.js'),file],{encoding:'utf8'});expect(result.status).toBe(exit);expect(JSON.parse(result.stdout).manufacturingVerified).toBe(false);}}
    finally{if(path.dirname(root)!==os.tmpdir()||!path.basename(root).startsWith('borsal-pipeline-'))throw Error('Unsafe cleanup');fs.rmSync(root,{recursive:true,force:true});}
  });
});
