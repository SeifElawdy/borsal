import {describe,it,expect,vi} from 'vitest';
const {draft}=require('./draft');
const {examples}=require('./examples');
const {bridge}=require('../design-feasibility/bridge');
const input=()=>structuredClone(examples().complete);
describe('Offline authored technical drafting',()=>{
  it('passes an explicitly authored accessory through the original bridge and pipeline',()=>{
    const r=input(),out=draft(r);expect(out.status).toBe('CHECKED');expect(out.verdict).toBe('UNVERIFIED');
    expect(out.bridge).toEqual(bridge({schemaVersion:'borsal.design-bridge/0.1',source:{kind:'DESIGN',path:r.design.path,data:r.design.data},context:r.context}));
    expect(out.bridge.pipeline.layers.geometry.status).toBe('PASS');expect(out.bridge.pipeline.layers.materials.status).toBe('PASS');
    expect(out.bridge.pipeline.layers.construction.status).toBe('UNVERIFIED');expect(out.manufacturingVerified).toBe(false);
  });
  it('preserves supplied cutting and stitching geometry, dimensions, seam and grain metadata',()=>{
    const r=input(),out=draft(r);expect(out.cuttingPieces).toHaveLength(2);
    expect(out.cuttingPieces[0]).toMatchObject({unit:'cm',dimensions:{widthCm:6,heightCm:4},areaCm2:24,seamAllowanceCm:0.5,grainDirectionDeg:0,grainToleranceDeg:5});
    expect(out.cuttingPieces[0].polygonCm).toEqual(r.context.instances[0].cuttingPolygonCm);
    expect(out.cuttingPieces[0].stitchingOutline).toEqual(r.design.data.technical.patternPieces[0].outline);
    expect(out.technicalMetadata.authoredDimensions).toEqual({width:5,height:3,depth:0.2});expect(out.technicalMetadata.bom).toEqual(r.design.data.technical.bom);
    expect(out.bridge.pipeline.utilization.utilizedAreaCm2).toBeCloseTo(48,8);
  });
  it('keeps manual concept authorship, source snapshots, hashes and unresolved creative review',()=>{
    const r=input(),out=draft(r);expect(out.provenance.concept.snapshot.authorship).toBe('HUMAN');expect(out.provenance.concept.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(out.technicalMetadata.sourceConceptSha256).toBe(out.provenance.concept.sha256);expect(out.creativeReview.status).toBe('UNVERIFIED');
    expect(out.creativeReview.requirements).toEqual(r.sourceConcept.data.brief.requirements);
    r.context.instances[0].cuttingPolygonCm[0][0]=9;expect(out.provenance.context.snapshot.instances[0].cuttingPolygonCm[0][0]).toBe(0);
  });
  it('accepts existing source-linked concept contracts without changing their provenance',()=>{
    const r=input();r.sourceConcept={path:'experiments/design-language/concept-spike/cases.json#concept-eight-b',data:require('../design-language/concept-spike/cases.json')[0]};
    const out=draft(r);expect(out.status).toBe('CHECKED');expect(out.provenance.concept.snapshot).toEqual(r.sourceConcept.data);expect(out.creativeReview.status).toBe('UNVERIFIED');
    expect(out.creativeReview.requirements).toEqual(r.sourceConcept.data.originalBrief.requirements);
  });
  it('reports missing authored dimensions, allowance and grain without filling them in',()=>{
    const r=examples().incomplete,before=JSON.stringify(r),out=draft(r);expect(out.status).toBe('CONCEPT_ONLY');expect(out.verdict).toBe('UNVERIFIED');expect(out.bridge).toBe(null);
    expect(out.unresolved.some(i=>i.path?.includes('overallDimensions'))).toBe(true);expect(out.unresolved.some(i=>i.path?.includes('seamAllowanceCm'))).toBe(true);
    expect(out.unresolved.some(i=>i.code==='GRAIN_TOLERANCE_REQUIRED')).toBe(true);expect(JSON.stringify(r)).toBe(before);expect(out.previewSvg).toBe(null);
  });
  it('reports absent design and context as incomplete rather than generating technical data',()=>{
    const r=input();delete r.design;delete r.context;const out=draft(r);expect(out.status).toBe('CONCEPT_ONLY');expect(out.unresolved[0].code).toBe('EXPLICIT_TECHNICAL_DESIGN_REQUIRED');expect(out.cuttingPieces).toEqual([]);
  });
  it('never offsets missing cutting geometry from nominal seam allowance',()=>{
    const r=input();r.context.instances=[];const out=draft(r);expect(out.status).toBe('CONCEPT_ONLY');expect(out.bridge.pipeline).toBe(null);expect(out.cuttingPieces).toEqual([]);
    expect(out.unresolved.some(i=>i.code==='EXPLICIT_CUTTING_INSTANCE_REQUIRED')).toBe(true);
  });
  it('can preview supplied valid outlines while grain or stock remains unresolved',()=>{
    const r=input();delete r.context.instances[0].grainToleranceDeg;delete r.context.stock;const out=draft(r);
    expect(out.status).toBe('CONCEPT_ONLY');expect(out.cuttingPieces).toHaveLength(2);expect(out.previewSvg).toContain('UNRESOLVED');expect(out.bridge.pipeline).toBe(null);
  });
  it('reports missing attachment coordinates and quantities as explicit requirements',()=>{
    const a=input();a.design.data.technical.assembly.push({id:'attach',type:'ATTACH',threadBomId:'thread',from:{pieceId:'pocket-panel',copy:1},to:{pieceId:'pocket-panel',copy:2,point:[1,1]}});
    expect(draft(a).unresolved.some(i=>i.path?.includes('point'))).toBe(true);
    const b=input();delete b.design.data.technical.bom[1].quantity;const out=draft(b);expect(out.status).toBe('CONCEPT_ONLY');expect(out.unresolved.some(i=>i.path?.includes('quantity'))).toBe(true);
  });
  it('rejects self-intersections even when other technical fields are missing',()=>{
    const r=examples().incomplete;r.context.instances[0].cuttingPolygonCm=[[0,0],[6,4],[0,4],[6,0]];const out=draft(r);expect(out.status).toBe('REJECTED');expect(out.errors.some(e=>e.code==='INVALID_CUTTING_POLYGON')).toBe(true);expect(out.previewSvg).toBe(null);
  });
  it('rejects malformed numbers, units and unknown fields instead of treating them as unresolved',()=>{
    for(const change of [r=>r.context.instances[0].cuttingPolygonCm[0][0]=Infinity,r=>r.design.data.technical.dimensionUnit='inch',r=>r.design.data.technical.overallDimensions.width=-1,r=>r.design.data.technical.patternPieces[0].seamAllowanceCm=-1,r=>r.extra=true,r=>r.sourceConcept.data.authorship='AI']){
      const r=input();change(r);const out=draft(r);expect(out.status).toBe('REJECTED');expect(out.verdict).toBe('FAIL');expect(out.errors.length).toBeGreaterThan(0);expect(out.previewSvg).toBe(null);
    }
  });
  it('preserves bridge rejection for invalid references and anchors',()=>{
    const a=input();a.design.data.technical.assembly[0].threadBomId='missing';expect(draft(a).status).toBe('REJECTED');
    const b=input();b.design.data.technical.assembly.push({id:'attach',type:'ATTACH',threadBomId:'thread',from:{pieceId:'pocket-panel',copy:1,point:[20,20]},to:{pieceId:'pocket-panel',copy:2,point:[1,1]}});const out=draft(b);expect(out.status).toBe('REJECTED');expect(out.errors.some(e=>e.code==='ANCHOR_OUTSIDE_PATTERN')).toBe(true);
  });
  it('passes stock shortages through as checked feasibility FAIL without consuming stock',()=>{
    const r=input();r.context.stock.items[0].quantity.value=10;const before=JSON.stringify(r.context.stock),out=draft(r);expect(out.status).toBe('CHECKED');expect(out.verdict).toBe('FAIL');expect(out.bridge.pipeline.layers.materials.status).toBe('FAIL');expect(JSON.stringify(r.context.stock)).toBe(before);
  });
  it('preserves bounded NO_LAYOUT_FOUND as UNVERIFIED and keeps the local pattern preview',()=>{
    const r=input();r.context.search.maxCandidates=1;const out=draft(r);expect(out.verdict).toBe('UNVERIFIED');expect(out.bridge.pipeline.evidence.nesting.status).toBe('NO_LAYOUT_FOUND');expect(out.previewSvg).toContain('Not a nesting layout');
  });
  it('supports explicitly authored concave outlines without a rectangular template',()=>{
    const r=input(),cut=[[0,0],[6,0],[6,2],[4,2],[4,4],[0,4]],seam=[[0.5,0.5],[5.5,0.5],[5.5,1.5],[3.5,1.5],[3.5,3.5],[0.5,3.5]];
    r.context.instances.forEach(i=>i.cuttingPolygonCm=structuredClone(cut));r.design.data.technical.assembly=[];
    r.design.data.technical.patternPieces[0].outline={start:seam[0],segments:seam.slice(1).concat([seam[0]]).map((to,i)=>({id:'edge-'+i,type:'LINE',to}))};
    const out=draft(r);expect(out.status).toBe('CHECKED');expect(out.bridge.pipeline.layers.geometry.status).toBe('PASS');expect(out.cuttingPieces[0].polygonCm).toEqual(cut);expect(out.cuttingPieces[0].areaCm2).toBe(20);
  });
  it('handles clockwise and translated local geometry without silently changing it',()=>{
    const r=input();r.context.instances.forEach(i=>i.cuttingPolygonCm=i.cuttingPolygonCm.map(([x,y])=>[x-10,y-10]).reverse());
    const p=r.design.data.technical.patternPieces[0];p.outline.start=p.outline.start.map(v=>v-10);p.outline.segments.forEach(s=>s.to=s.to.map(v=>v-10));
    const out=draft(r);expect(out.status).toBe('CHECKED');expect(out.cuttingPieces[0].polygonCm).toEqual(r.context.instances[0].cuttingPolygonCm);expect(out.previewSvg).toContain('translate(12 16)');
  });
  it('does not flatten Bezier seams merely to pass the bridge',()=>{
    const r=input(),p=r.design.data.technical.patternPieces[0];p.outline.segments[0]={id:'top',type:'CUBIC_BEZIER',control1:[1,0.5],control2:[4,0.5],to:[5.5,0.5]};
    const out=draft(r);expect(out.status).toBe('CONCEPT_ONLY');expect(out.unresolved.some(i=>i.code==='EXPLICIT_CURVE_REPRESENTATION_REQUIRED')).toBe(true);expect(out.bridge.pipeline).toBe(null);expect(out.previewSvg).toContain('C 1 0.5 4 0.5 5.5 0.5');
  });
  it('generates an openable SVG with centimeter sizing, labels and distinct cut/stitch styles',async()=>{
    const out=draft(input()),svg=out.previewSvg;expect(svg).toContain('width="26cm"');expect(svg).toContain('6 × 4 cm');expect(svg).toContain('pocket-panel-1');expect(svg).toContain('stroke-dasharray');expect(svg).toContain('NOT manufacturing approval');
    const sharp=require('sharp'),meta=await sharp(Buffer.from(svg)).metadata();expect(meta.format).toBe('svg');expect(meta.width).toBeGreaterThan(0);expect(meta.height).toBeGreaterThan(0);
    const raster=await sharp(Buffer.from(svg)).resize({width:400}).png().toBuffer();expect(raster.length).toBeGreaterThan(1000);
  });
  it('escapes SVG text and metadata rather than producing executable markup',()=>{
    const out=draft(input());out.cuttingPieces[0].id='bad</text><script>alert(1)</script>';const svg=require('./preview').renderPreview(out);
    expect(svg).not.toContain('<script>');expect(svg).toContain('&lt;script&gt;');expect(svg).not.toContain('href=');
  });
  it('is deterministic, preserves inputs and makes no network requests',()=>{
    const r=input(),before=JSON.stringify(r),spy=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('Network forbidden'));
    try{expect(draft(r)).toEqual(draft(r));expect(JSON.stringify(r)).toBe(before);expect(spy).not.toHaveBeenCalled();}finally{spy.mockRestore();}
  });
  it('writes reproducible CLI artifacts only into a fresh directory and refuses overwrites',()=>{
    const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');const root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-drafting-'));
    try{const dir=path.join(root,'demo'),result=cp.spawnSync(process.execPath,[path.join(__dirname,'run.js'),'--demo',dir],{encoding:'utf8'});expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout).results.complete.status).toBe('CHECKED');expect(fs.existsSync(path.join(dir,'complete-preview.svg'))).toBe(true);expect(fs.existsSync(path.join(dir,'invalid-preview.svg'))).toBe(false);
      const before=fs.readFileSync(path.join(dir,'complete-preview.svg'),'utf8'),again=cp.spawnSync(process.execPath,[path.join(__dirname,'run.js'),'--demo',dir],{encoding:'utf8'});expect(again.status).toBe(1);expect(fs.readFileSync(path.join(dir,'complete-preview.svg'),'utf8')).toBe(before);
      const request=path.join(root,'input.json');fs.writeFileSync(request,JSON.stringify(examples().invalid));const bad=cp.spawnSync(process.execPath,[path.join(__dirname,'run.js'),request],{encoding:'utf8'});expect(bad.status).toBe(2);
    }finally{if(path.dirname(root)!==os.tmpdir()||!path.basename(root).startsWith('borsal-drafting-'))throw Error('Unsafe cleanup');fs.rmSync(root,{recursive:true,force:true});}
  });
});
