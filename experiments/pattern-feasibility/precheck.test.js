import {describe,it,expect,vi} from 'vitest';
const {precheck}=require('./precheck');
const {examples}=require('./precheck-examples');
const templates=examples();
const input=(name='valid')=>structuredClone(templates.requests[name]);
const codes=(r,layer)=>r.layers[layer].reasons.map(x=>x.code);
const stock=(r,id)=>r.stock.items.find(x=>x.id===id);
describe('Offline material and construction precheck',()=>{
  it('passes supported structural checks without manufacturing approval or stock mutation',()=>{
    const r=input('structural'),before=JSON.stringify(r),out=precheck(r);
    expect(out.status).toBe('PASS');expect(Object.values(out.layers).every(l=>l.status==='PASS')).toBe(true);
    expect(out.manufacturingVerified).toBe(false);expect(out.inventoryMutated).toBe(false);expect(JSON.stringify(r)).toBe(before);
  });
  it('keeps strap load and closure operation UNVERIFIED despite valid references and supplied stock',()=>{
    const r=precheck(input());expect(r.layers.geometry.status).toBe('PASS');expect(r.layers.assembly.status).toBe('PASS');expect(r.layers.materials.status).toBe('PASS');expect(r.status).toBe('UNVERIFIED');
    expect(codes(r,'construction')).toContain('STRAP_LOAD_PATH_UNVERIFIED');expect(codes(r,'construction')).toContain('CLOSURE_OPERATION_UNVERIFIED');
  });
  it('rejects explicitly unconfirmed fabric and keeps missing confirmation/revision unresolved',()=>{
    const a=input();a.fabric.geometry.confirmed=false;expect(precheck(a).layers.geometry.status).toBe('FAIL');
    const b=input();delete b.fabric.geometry.confirmed;delete b.fabric.geometry.version;expect(precheck(b).layers.geometry.status).toBe('UNVERIFIED');
  });
  it('accepts an offline original-record identifier without requiring a MongoDB lookup',()=>{
    const r=input('structural');r.fabric.id='1234567890abcdef12345678';r.bom[0].source.scrapId=r.fabric.id;expect(precheck(r).status).toBe('PASS');
  });
  it('rejects fabric mismatch and invalid geometry independently of a claimed nesting success',()=>{
    const a=input();a.fabric.geometry.polygonCm=a.fabric.geometry.polygonCm.map(([x,y])=>[x+1,y]);expect(codes(precheck(a),'geometry')).toContain('NESTING_FABRIC_MISMATCH');
    const b=input();b.fabric.geometry.polygonCm=[[0,0],[2,2],[0,2],[2,0]];expect(codes(precheck(b),'geometry')).toContain('INVALID_FABRIC_OR_PATTERN');
  });
  it('revalidates placements instead of trusting a supplied validator PASS claim',()=>{
    const r=input();r.nesting.result.placements[0].translationCm=[100,100];r.nesting.result.validationStatus='PASS';
    const out=precheck(r);expect(out.layers.geometry.status).toBe('FAIL');expect(codes(out,'geometry')).toContain('NESTING_REVALIDATION_FAILED');
  });
  it('rejects missing/duplicate nesting instances and disallowed rotations',()=>{
    const a=input();a.nesting.result.placements.pop();expect(codes(precheck(a),'geometry')).toContain('NESTING_INSTANCE_MISMATCH');
    const b=input();b.nesting.result.placements[1]=b.nesting.result.placements[0];expect(codes(precheck(b),'geometry')).toContain('NESTING_INSTANCE_MISMATCH');
    const c=input();c.nesting.result.placements[0].rotationDeg=90;expect(codes(precheck(c),'geometry')).toContain('ROTATION_NOT_ALLOWED');
  });
  it('keeps a no-layout result UNVERIFIED rather than inferring global impossibility',()=>{
    const r=input();r.nesting.result.status='NO_LAYOUT_FOUND';r.nesting.result.placements=[];
    const out=precheck(r);expect(out.layers.geometry.status).toBe('UNVERIFIED');expect(out.layers.grain.status).toBe('UNVERIFIED');expect(out.validatorEvidence).toBe(null);
  });
  it('never fills missing allowance geometry or promotes stitching lines to cutting outlines',()=>{
    const r=input(),before=JSON.stringify(r.nesting.request.pieces.map(p=>p.polygonCm));
    r.nesting.request.pieces[0].outlineBasis='SEAM_LINE';r.nesting.request.pieces[0].seamAllowanceStatus='NOT_INCLUDED';
    const out=precheck(r);expect(out.layers.allowances.status).toBe('UNVERIFIED');expect(out.layers.geometry.status).toBe('PASS');expect(JSON.stringify(r.nesting.request.pieces.map(p=>p.polygonCm))).toBe(before);
  });
  it('rejects explicitly supplied stitching geometry outside cutting geometry',()=>{
    const r=input();r.pattern.pieces[0].stitchingPolygonCm=[[0.2,0.2],[3,0.2],[0.2,1.4]];
    expect(codes(precheck(r),'allowances')).toContain('STITCHING_LINE_OUTSIDE_CUTTING_OUTLINE');expect(precheck(r).status).toBe('FAIL');
  });
  it('keeps zero-clearance stitching and missing stitching geometry UNVERIFIED',()=>{
    const a=input();a.pattern.pieces[0].stitchingPolygonCm=structuredClone(a.nesting.request.pieces[0].polygonCm);expect(precheck(a).layers.allowances.status).toBe('UNVERIFIED');
    const b=input();delete b.pattern.pieces[0].stitchingPolygonCm;const out=precheck(b);expect(out.layers.assembly.status).toBe('UNVERIFIED');expect(out.layers.construction.status).toBe('UNVERIFIED');
  });
  it('reports unequal seam lengths as unresolved easing/gathering rather than banning creative construction',()=>{
    const r=input();r.pattern.pieces[0].stitchingPolygonCm[1][0]=1.3;
    const out=precheck(r);expect(out.layers.assembly.status).toBe('PASS');expect(codes(out,'construction')).toContain('SEAM_EASING_OR_GATHERING_UNVERIFIED');
  });
  it('does not use claimed nesting grain as authoritative fabric grain',()=>{
    const r=input();delete r.fabric.grainDirectionDeg;const out=precheck(r);expect(out.layers.grain.status).toBe('UNVERIFIED');expect(out.layers.geometry.status).toBe('PASS');
  });
  it('fails known grain mismatches and preserves partial grain as UNVERIFIED',()=>{
    const a=input();a.fabric.grainDirectionDeg=90;expect(precheck(a).layers.grain.status).toBe('FAIL');
    const b=input();b.nesting.request.pieces[0].grain={localDirectionDeg:0};expect(precheck(b).layers.grain.status).toBe('UNVERIFIED');
  });
  it('fails insufficient stock with specific quantities and no consumption',()=>{
    const r=input('insufficient'),before=JSON.stringify(r.stock),out=precheck(r);
    expect(out.status).toBe('FAIL');expect(codes(out,'materials')).toContain('INSUFFICIENT_STOCK');
    expect(out.stockChecks.find(s=>s.stockId==='thread-stock')).toMatchObject({required:100,available:10,unit:'cm',status:'FAIL'});expect(JSON.stringify(r.stock)).toBe(before);
  });
  it('aggregates all BOM demands sharing one stock item before checking availability',()=>{
    const r=input(),extra=structuredClone(r.bom.find(b=>b.id==='thread'));extra.id='extra-thread';extra.quantity.value=450;r.bom.push(extra);
    const out=precheck(r);expect(out.stockChecks.find(s=>s.stockId==='thread-stock').required).toBe(550);expect(out.layers.materials.status).toBe('FAIL');
  });
  it('distinguishes unavailable stock, unknown availability and absent/incomplete snapshots',()=>{
    const a=input();stock(a,'thread-stock').availability='UNAVAILABLE';expect(codes(precheck(a),'materials')).toContain('STOCK_UNAVAILABLE');
    const b=input();stock(b,'thread-stock').availability='UNKNOWN';expect(precheck(b).layers.materials.status).toBe('UNVERIFIED');
    const c=input();delete c.stock;expect(precheck(c).layers.materials.status).toBe('UNVERIFIED');
  });
  it('fails a missing item in an explicitly complete snapshot, but leaves incomplete data UNVERIFIED',()=>{
    const r=input();r.stock.items=r.stock.items.filter(s=>s.id!=='thread-stock');expect(codes(precheck(r),'materials')).toContain('MATERIAL_STOCK_MISSING');
    r.stock.complete=false;expect(codes(precheck(r),'materials')).toContain('STOCK_DATA_MISSING');expect(precheck(r).layers.materials.status).toBe('UNVERIFIED');
  });
  it('never auto-selects a replacement stock item when its explicit reference is missing',()=>{
    const r=input();delete r.bom.find(b=>b.id==='thread').stockId;expect(codes(precheck(r),'materials')).toContain('STOCK_REFERENCE_MISSING');
  });
  it('rejects incorrect BOM and stock units instead of silently converting them',()=>{
    const a=input();a.bom.find(b=>b.id==='thread').quantity.unit='piece';expect(codes(precheck(a),'materials')).toContain('BOM_UNIT_INVALID');
    const b=input();stock(b,'thread-stock').quantity.unit='cm2';expect(codes(precheck(b),'materials')).toContain('STOCK_UNIT_INVALID');expect(precheck(b).status).toBe('FAIL');
  });
  it('rejects fractional piece counts and invalid material specifications',()=>{
    const a=input();a.bom.find(b=>b.id==='button').quantity.value=0.5;expect(codes(precheck(a),'materials')).toContain('BOM_PIECE_QUANTITY_NOT_INTEGER');
    const b=input();delete b.bom.find(b=>b.id==='thread').material.specs.tex;expect(codes(precheck(b),'materials')).toContain('INVALID_MATERIAL_SPECIFICATIONS');
  });
  it('matches stock specifications canonically and rejects actual mismatches',()=>{
    const a=input();stock(a,'strap-stock').material.specs={widthCm:0.5,fiber:'POLYESTER'};expect(precheck(a).layers.materials.status).toBe('PASS');
    stock(a,'strap-stock').material.specs.widthCm=0.7;expect(codes(precheck(a),'materials')).toContain('STOCK_SPECIFICATIONS_MISMATCH');
  });
  it('leaves new unsupported material types UNVERIFIED, without banning an arbitrary product category',()=>{
    const r=input(),custom={type:'RECYCLED_CORD',specs:{diameterCm:0.2}};
    r.bom.find(b=>b.id==='strap').material=custom;stock(r,'strap-stock').material=custom;r.pattern.components[0].role='SCULPTURAL_PANEL';
    const out=precheck(r);expect(out.layers.input.status).toBe('PASS');expect(out.layers.materials.status).toBe('UNVERIFIED');expect(codes(out,'materials')).toContain('UNSUPPORTED_MATERIAL_TYPE');
  });
  it('checks SCRAP identity, minimum pattern area and maximum available scrap allocation',()=>{
    const a=input();a.bom[0].source.scrapId='different';expect(codes(precheck(a),'materials')).toContain('SCRAP_REFERENCE_MISMATCH');
    const b=input();b.bom[0].quantity.value=1;expect(codes(precheck(b),'materials')).toContain('SCRAP_QUANTITY_BELOW_PATTERN_AREA');
    const c=input();c.bom[0].quantity.value=200;expect(codes(precheck(c),'materials')).toContain('SCRAP_QUANTITY_EXCEEDS_USABLE_AREA');
  });
  it('does not substitute STOCK cutting material for patterns nested on this one SCRAP',()=>{
    const r=input();r.pattern.pieces[0].bomId='strap';expect(codes(precheck(r),'materials')).toContain('NESTED_PATTERN_NOT_FROM_THIS_SCRAP');
  });
  it('flags unknown pattern BOM IDs and keeps absent allocation metadata unresolved',()=>{
    const a=input();a.pattern.pieces[0].bomId='missing';expect(codes(precheck(a),'materials')).toContain('UNKNOWN_PATTERN_BOM');
    const b=input();b.pattern.pieces.shift();expect(codes(precheck(b),'materials')).toContain('PATTERN_ALLOCATION_MISSING');
  });
  it('marks missing fabric specifications and external stock cutting layouts UNVERIFIED',()=>{
    const a=input();delete a.fabric.material;expect(codes(precheck(a),'materials')).toContain('FABRIC_SPECIFICATIONS_MISSING');
    const b=input();b.bom.push({id:'lining',source:{kind:'STOCK',availability:'NOT_CHECKED'},material:{type:'LINING_FABRIC',specs:{fiber:'COTTON',weightGsm:100}},quantity:{value:10,unit:'cm2'}});expect(codes(precheck(b),'construction')).toContain('EXTERNAL_STOCK_CUTTING_NOT_VERIFIED');
  });
  it('rejects invalid thread references, edge references, edge indices and copy numbers',()=>{
    const a=input();a.pattern.assembly[0].threadBomId='button';expect(codes(precheck(a),'assembly')).toContain('INVALID_THREAD_BOM');
    const b=input();b.pattern.assembly[0].sides[0].edgeIds=['unknown'];expect(codes(precheck(b),'assembly')).toContain('UNKNOWN_EDGE_REFERENCE');
    const c=input();c.pattern.pieces[0].edges[0].segmentIndex=99;expect(codes(precheck(c),'assembly')).toContain('EDGE_INDEX_INVALID');
    const d=input();d.pattern.assembly[0].sides[0].copy=2;expect(codes(precheck(d),'assembly')).toContain('INVALID_PATTERN_COPY');
  });
  it('rejects disconnected or repeated seam-edge chains',()=>{
    const a=input();a.pattern.assembly[0].sides[0].edgeIds=['bottom','left'];expect(codes(precheck(a),'assembly')).toContain('DISCONNECTED_EDGE_CHAIN');
    const b=input();b.pattern.assembly[0].sides[0].edgeIds=['bottom','bottom'];expect(codes(precheck(b),'assembly')).toContain('DUPLICATE_SEAM_EDGE');
  });
  it('does not equate cutting-edge references with known stitching geometry',()=>{
    const r=input();r.pattern.pieces[0].edges[0].basis='CUTTING';expect(codes(precheck(r),'construction')).toContain('STITCHING_LINE_NOT_ESTABLISHED');
  });
  it('rejects out-of-pattern accessory anchors in piece-local coordinates',()=>{
    const r=input();r.pattern.assembly.find(a=>a.id==='button-install').anchors[0].point=[20,15];
    const out=precheck(r);expect(out.layers.assembly.status).toBe('FAIL');expect(codes(out,'assembly')).toContain('ANCHOR_OUTSIDE_PATTERN');
  });
  it('checks ATTACH endpoints and their thread rather than only INSTALL references',()=>{
    const r=input();r.pattern.assembly.push({id:'attachment',type:'ATTACH',threadBomId:'thread',from:{pieceId:'triangle-a',copy:1,point:[0.5,0.5]},to:{pieceId:'missing',copy:1,point:[0.5,0.5]}});
    expect(codes(precheck(r),'assembly')).toContain('UNKNOWN_ANCHOR_PIECE');
    r.pattern.assembly.at(-1).to.pieceId='triangle-b';expect(precheck(r).layers.assembly.status).toBe('PASS');
  });
  it('rejects unknown components, operations and ambiguous pattern ownership',()=>{
    const a=input();a.pattern.connections[0].toComponentId='missing';expect(codes(precheck(a),'assembly')).toContain('UNKNOWN_CONNECTION_COMPONENT');
    const b=input();b.pattern.connections[0].assemblyIds=['missing'];expect(codes(precheck(b),'assembly')).toContain('UNKNOWN_CONNECTION_OPERATION');
    const c=input();c.pattern.components[1].pieceIds=['triangle-a'];expect(codes(precheck(c),'assembly')).toContain('AMBIGUOUS_PATTERN_OWNER');
  });
  it('fails impossible complete declared connection graphs and leaves partial graphs UNVERIFIED',()=>{
    const r=input();r.pattern.connections[1].assemblyIds=['strap-install'];expect(precheck(r).layers.assembly.status).toBe('FAIL');
    r.pattern.connections[1].complete=false;expect(precheck(r).layers.assembly.status).toBe('UNVERIFIED');
  });
  it('keeps unsupported operations and detailed creative claims visible',()=>{
    const r=input();r.pattern.assembly.push({id:'gathers',type:'DISTRIBUTED_GATHER',description:'Sculptural pleated surface'});
    const claim={id:'drape',description:'Free sculptural drape',reason:'3D deformation not modeled',missingInformation:['Material bending response']};r.pattern.unsupportedClaims.push(claim);
    const out=precheck(r);expect(out.layers.assembly.status).toBe('UNVERIFIED');expect(out.layers.construction.status).toBe('UNVERIFIED');
    expect(out.layers.construction.reasons.find(x=>x.code==='UNSUPPORTED_PHYSICAL_CLAIM')).toMatchObject(claim);
  });
  it('never turns invalid supported operation bodies into valid data',()=>{
    const r=input();r.pattern.assembly[0].sides[0].direction='SIDEWAYS';const out=precheck(r);expect(codes(out,'assembly')).toContain('INVALID_SUPPORTED_OPERATION');expect(out.status).toBe('FAIL');
  });
  it('lets proven failures dominate mixed PASS/UNVERIFIED layers',()=>{
    const r=input('incomplete');stock(r,'thread-stock').quantity.value=0;const out=precheck(r);
    expect(out.layers.geometry.status).toBe('PASS');expect(out.layers.grain.status).toBe('UNVERIFIED');expect(out.layers.materials.status).toBe('FAIL');expect(out.status).toBe('FAIL');
  });
  it('rejects malformed units, quantities, duplicate IDs and unknown approval fields',()=>{
    const cases=[input(),input(),input(),input()];cases[0].unit='mm';cases[1].bom[0].quantity.value=-1;cases[2].stock.items.push(cases[2].stock.items[0]);cases[3].manufacturingVerified=true;
    for(const r of cases){const out=precheck(r);expect(out.status).toBe('FAIL');expect(out.layers.input.status).toBe('FAIL');expect(out.manufacturingVerified).toBe(false);}
  });
  it('is deterministic, pure and independent of network or database connections',()=>{
    const r=input(),before=JSON.stringify(r),spy=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('Network forbidden'));
    try{expect(precheck(r)).toEqual(precheck(r));expect(JSON.stringify(r)).toBe(before);expect(spy).not.toHaveBeenCalled();}finally{spy.mockRestore();}
  });
  it('runs CLI examples with PASS / UNVERIFIED / FAIL outcomes and never manufacturing approval',()=>{
    const {main}=require('./precheck-run'),demo=main(['--demo']);
    expect(demo.results.structural.status).toBe('PASS');expect(demo.results.valid.status).toBe('UNVERIFIED');expect(demo.results.insufficient.status).toBe('FAIL');expect(demo.results.incomplete.status).toBe('UNVERIFIED');
    expect(Object.values(demo.results).every(r=>!r.manufacturingVerified&&!r.inventoryMutated)).toBe(true);
  });
  it('supports JSON-file CLI exit codes for structural PASS, FAIL and UNVERIFIED',()=>{
    const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');const root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-precheck-'));
    try{for(const [name,code]of [['structural',0],['valid',3],['insufficient',2]]){
      const file=path.join(root,name+'.json');fs.writeFileSync(file,JSON.stringify(input(name)));const r=cp.spawnSync(process.execPath,[path.join(__dirname,'precheck-run.js'),file],{encoding:'utf8'});
      expect(r.status).toBe(code);expect(JSON.parse(r.stdout).manufacturingVerified).toBe(false);
    }}finally{if(path.dirname(root)!==os.tmpdir()||!path.basename(root).startsWith('borsal-precheck-'))throw Error('Unsafe cleanup');fs.rmSync(root,{recursive:true,force:true});}
  });
});
