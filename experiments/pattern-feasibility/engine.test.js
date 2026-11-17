import {describe,it,expect,vi} from 'vitest';
const {evaluateLayout,VERSION}=require('./engine');
const {examples}=require('./examples');
const {main}=require('./run');
const square=(w=2,h=w)=>[[0,0],[w,0],[w,h],[0,h]];
const piece=(id='a',polygonCm=square(),translationCm=[1,1],rotationDeg=0)=>({id,polygonCm,placement:{translationCm,rotationDeg},outlineBasis:'CUTTING',seamAllowanceStatus:'INCLUDED',grain:{localDirectionDeg:0,toleranceDeg:0}});
const layout=(pieces=[piece()],fabric=square(10))=>({schemaVersion:VERSION,unit:'cm',fabric:{polygonCm:fabric,holes:[],grainDirectionDeg:0},pieces});
const has=(result,code)=>result.pieces.some(p=>p.reasons.some(r=>r.code===code));

describe('Supplied-layout geometry, not global nesting or manufacturing approval',()=>{
  it('passes multiple explicitly placed pieces in one scrap with declared cutting/grain data',()=>{
    const r=evaluateLayout(layout([piece('a'),piece('b',square(),[5,5])]));
    expect(r.status).toBe('PASS');expect(r.areaCheck.totalPieceAreaCm2).toBe(8);
    expect(r.pieces.every(p=>p.dimensions.widthCm===2&&p.areaCm2===4)).toBe(true);
    expect(r.globalFeasibility).toBe('NOT_ASSESSED');expect(r.manufacturingVerified).toBe(false);
  });
  it('accepts clockwise input and normalizes it without changing physical geometry',()=>{
    const r=evaluateLayout(layout([piece('a',square().reverse())]));
    expect(r.status).toBe('PASS');expect(r.pieces[0].inputOrientation).toBe('CW');expect(r.pieces[0].areaCm2).toBe(4);
  });
  it('supports nonrectangular/concave fabric',()=>{
    const f=[[0,0],[10,0],[10,3],[3,3],[3,10],[0,10]];
    expect(evaluateLayout(layout([piece('a',square(1),[1,5])],f)).status).toBe('PASS');
  });
  it('rejects a piece edge leaving a concavity even when every vertex is inside',()=>{
    const f=[[0,0],[10,0],[10,10],[7,10],[7,3],[3,3],[3,10],[0,10]];
    const r=evaluateLayout(layout([piece('bridge',[[1,8],[9,8],[5,1]],[0,0])],f));
    expect(r.status).toBe('FAIL');expect(has(r,'FABRIC_BOUNDARY_INTERSECTION_OR_CONTACT')).toBe(true);
  });
  it('allows an arbitrary concave cutting polygon',()=>{
    const p=[[0,0],[4,0],[4,1],[1,1],[1,4],[0,4]];
    expect(evaluateLayout(layout([piece('l',p)])).status).toBe('PASS');
  });
  it('supports valid negative coordinate frames',()=>{
    const f=[[-10,-10],[0,-10],[0,0],[-10,0]];
    expect(evaluateLayout(layout([piece('a',square(),[-8,-8])],f)).status).toBe('PASS');
  });
  it('checks holes and uses net fabric area',()=>{
    const l=layout();l.fabric.holes=[[[5,5],[7,5],[7,7],[5,7]]];
    const r=evaluateLayout(l);expect(r.status).toBe('PASS');expect(r.fabric.areaCm2).toBe(96);
  });
  it.each([
    ['inside',square(1),[5.5,5.5]],['crosses',square(3),[4,4]],['encloses',square(6),[3,3]],['touches',square(2),[3,5]],
  ])('rejects a piece that %s a fabric hole',(_name,p,t)=>{
    const l=layout([piece('a',p,t)]);l.fabric.holes=[[[5,5],[7,5],[7,7],[5,7]]];
    const r=evaluateLayout(l);expect(r.status).toBe('FAIL');expect(has(r,'FABRIC_HOLE_INTERSECTION_OR_COVERAGE')).toBe(true);
  });
  it.each([
    ['overlap',[[4,4],[8,4],[8,8],[4,8]]],['nest',[[3,3],[4,3],[4,4],[3,4]]],['touch',[[6,2],[8,2],[8,4],[6,4]]],
  ])('rejects %s between fabric holes rather than double-subtracting area',(_name,h)=>{
    const l=layout();l.fabric.holes=[[[2,2],[6,2],[6,6],[2,6]],h];
    const r=evaluateLayout(l);expect(r.status).toBe('FAIL');expect(r.classification).toBe('INVALID_INPUT');expect(r.diagnostics.some(d=>d.code==='INVALID_FABRIC')).toBe(true);
  });
  it('rejects a hole outside the fabric',()=>{
    const l=layout();l.fabric.holes=[[[9,9],[12,9],[12,12],[9,12]]];expect(evaluateLayout(l).status).toBe('FAIL');
  });
  it.each([
    ['crossing',square(3),[2,2]],['contained',square(1),[2,2]],['coincident',square(3),[1,1]],['shared edge',square(2),[4,1]],['shared vertex',square(2),[4,4]],
  ])('detects %s pieces on both per-piece reports',(_name,p,t)=>{
    const r=evaluateLayout(layout([piece('a',square(3)),piece('b',p,t)]));
    expect(r.status).toBe('FAIL');expect(r.pieces.every(p=>p.reasons.some(x=>x.code==='PIECE_OVERLAP_OR_CONTACT'))).toBe(true);
  });
  it('rejects a piece wholly outside the fabric',()=>{
    const r=evaluateLayout(layout([piece('a',square(),[20,20])]));expect(r.status).toBe('FAIL');expect(has(r,'OUTSIDE_FABRIC')).toBe(true);
  });
  it('rejects touching the outer fabric edge',()=>{
    const r=evaluateLayout(layout([piece('a',square(),[0,1])]));expect(r.status).toBe('FAIL');expect(has(r,'FABRIC_BOUNDARY_INTERSECTION_OR_CONTACT')).toBe(true);
  });
  it('fails insufficient total area but never claims a global nesting result',()=>{
    const r=evaluateLayout(layout([piece('a',square(8)),piece('b',square(8),[2,2])]));
    expect(r.areaCheck.status).toBe('FAIL');expect(r.status).toBe('FAIL');expect(r.diagnostics).toContainEqual({code:'TOTAL_AREA_EXCEEDS_USABLE_FABRIC'});
    expect(r.globalFeasibility).toBe('NOT_ASSESSED');
  });
  it('does not turn area sufficiency into proof of fit',()=>{
    const r=evaluateLayout(layout([piece('a',square(3),[1,0.5])],square(20,2)));
    expect(r.areaCheck.status).toBe('PASS');expect(r.status).toBe('FAIL');expect(r.areaCheck.necessaryOnly).toBe(true);
  });
  it('applies rotation about local origin, then translation; reports placed dimensions',()=>{
    const p=piece('a',square(2,1),[4,2],90);p.grain.localDirectionDeg=90;
    const r=evaluateLayout(layout([p]));expect(r.status).toBe('PASS');
    expect(r.pieces[0].dimensions.widthCm).toBeCloseTo(1,10);expect(r.pieces[0].dimensions.heightCm).toBeCloseTo(2,10);expect(r.pieces[0].areaCm2).toBeCloseTo(2,10);
  });
  it('normalizes full rotations without coordinate overflow',()=>{
    expect(evaluateLayout(layout([piece('a',square(),[1,1],360)])).pieces[0].placement.rotationDeg).toBe(0);
  });
  it('evaluates supplied grain constraints independently of geometric fit',()=>{
    const r=evaluateLayout(layout([piece('a',square(),[4,4],90)]));expect(r.geometryStatus).toBe('PASS');expect(r.status).toBe('FAIL');expect(r.pieces[0].grain.reason).toBe('GRAIN_DIRECTION_MISMATCH');
  });
  it('uses explicit undirected grain tolerance without conflating it with length tolerance',()=>{
    const good=layout([piece('a',square(),[4,4],5)]);good.pieces[0].grain.toleranceDeg=5;
    expect(evaluateLayout(good).status).toBe('PASS');
    good.pieces[0].placement.rotationDeg=5.0001;expect(evaluateLayout(good).status).toBe('FAIL');
    good.pieces[0].placement.rotationDeg=180;expect(evaluateLayout(good).status).toBe('PASS');
  });
  it('returns UNVERIFIED when fabric or piece grain information is missing',()=>{
    const a=layout();delete a.fabric.grainDirectionDeg;
    const b=layout();delete b.pieces[0].grain;
    for(const l of [a,b]){const r=evaluateLayout(l);expect(r.status).toBe('UNVERIFIED');expect(r.geometryStatus).toBe('PASS');expect(r.pieces[0].grain.status).toBe('UNVERIFIED');}
  });
  it('reports partial grain constraints as UNVERIFIED without guessing an angle or tolerance',()=>{
    for(const grain of [{},{localDirectionDeg:0},{toleranceDeg:5}]){
      const l=layout();l.pieces[0].grain=grain;
      const r=evaluateLayout(l);expect(r.geometryStatus).toBe('PASS');expect(r.status).toBe('UNVERIFIED');
      expect(r.pieces[0].grain).toEqual({status:'UNVERIFIED',reason:'GRAIN_INFORMATION_MISSING'});
    }
  });
  it.each(['UNKNOWN','NOT_INCLUDED'])('does not generate allowance offsets when status is %s',status=>{
    const l=layout();l.pieces[0].seamAllowanceStatus=status;
    const r=evaluateLayout(l);expect(r.status).toBe('UNVERIFIED');expect(r.pieces[0].areaCm2).toBe(4);expect(r.pieces[0].placedPolygonCm).toEqual([[1,1],[3,1],[3,3],[1,3]]);
  });
  it('does not confuse a seam-line outline with a complete cutting outline',()=>{
    const l=layout();l.pieces[0].outlineBasis='SEAM_LINE';expect(evaluateLayout(l).status).toBe('UNVERIFIED');
  });
  it('keeps omitted allowance information visible',()=>{
    const l=layout();delete l.pieces[0].outlineBasis;delete l.pieces[0].seamAllowanceStatus;
    expect(evaluateLayout(l).pieces[0].allowances.status).toBe('UNVERIFIED');
  });
  it.each([0.5e-6,1e-6])('rejects outer-edge clearance at or below tolerance %s cm',gap=>{
    expect(evaluateLayout(layout([piece('a',square(),[gap,1])])).status).toBe('FAIL');
  });
  it('accepts clearance demonstrably above the length tolerance',()=>{
    expect(evaluateLayout(layout([piece('a',square(),[2e-6,1])])).status).toBe('PASS');
  });
  it('uses the same distance tolerance between pieces',()=>{
    for(const [gap,status]of [[0.5e-6,'FAIL'],[2e-6,'PASS']])expect(evaluateLayout(layout([piece('a'),piece('b',square(),[3+gap,1])])).status).toBe(status);
  });
  it.each(['mm','inch'])('rejects incorrect units %s',unit=>{
    const l=layout();l.unit=unit;expect(evaluateLayout(l).classification).toBe('INVALID_INPUT');
  });
  it.each([NaN,Infinity,-Infinity])('rejects nonfinite coordinates/transforms %s',value=>{
    const l=layout();l.pieces[0].polygonCm[0][0]=value;expect(evaluateLayout(l).status).toBe('FAIL');
    const t=layout();t.pieces[0].placement.rotationDeg=value;expect(evaluateLayout(t).status).toBe('FAIL');
  });
  it('rejects malformed transforms, unsupported scaling, duplicate IDs and wrong version',()=>{
    const cases=[layout(),layout(),layout(),layout()];
    delete cases[0].pieces[0].placement.rotationDeg;cases[1].pieces[0].placement.scale=2;cases[2].pieces.push(piece());cases[3].schemaVersion='borsal.pattern-layout/9';
    for(const l of cases)expect(evaluateLayout(l).classification).toBe('INVALID_INPUT');
  });
  it('rejects point objects instead of silently translating them into coordinates',()=>{
    const l=layout();l.pieces[0].polygonCm[0]={x:0,y:0};expect(evaluateLayout(l).classification).toBe('INVALID_INPUT');
  });
  it('rejects self-intersecting and explicitly duplicated closing vertices',()=>{
    for(const p of [[[0,0],[2,2],[0,2],[2,0]],[...square(),[0,0]]]){const r=evaluateLayout(layout([piece('a',p)]));expect(r.status).toBe('FAIL');expect(r.pieces[0].areaCm2).toBe(null);}
  });
  it('rejects invalid fabric without deriving fake usable dimensions',()=>{
    const r=evaluateLayout(layout([piece()],[[0,0],[2,2],[0,2],[2,0]]));expect(r.status).toBe('FAIL');expect(r.fabric).toBe(null);
  });
  it('preserves the existing finite coordinate range after placement',()=>{
    const r=evaluateLayout(layout([piece('a',square(),[1e100,0])]));expect(r.status).toBe('FAIL');expect(r.pieces[0].areaCm2).toBe(null);
  });
  it('does not mutate input or use network requests',()=>{
    const l=layout(),before=JSON.stringify(l),spy=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('Network prohibited'));
    try{expect(evaluateLayout(l)).toEqual(evaluateLayout(l));expect(JSON.stringify(l)).toBe(before);expect(spy).not.toHaveBeenCalled();}finally{spy.mockRestore();}
  });
  it('reproduces passing/failing explicit layouts from the saved synthetic fabric',()=>{
    const demo=main(['--demo']);expect(demo.provenance.label).toBe('SYNTHETIC_TEST_FIXTURE');expect(demo.provenance.physicalAccuracy).toBe('UNVERIFIED');
    expect(demo.results.pass.status).toBe('PASS');expect(demo.results.fail.status).toBe('FAIL');
    expect(demo.results.pass.fabric.areaCm2).toBeCloseTo(162.0459,4);
    expect(demo.results.fail.globalFeasibility).toBe('NOT_ASSESSED');expect(examples().layouts.pass.fabric.polygonCm).toHaveLength(74);
  });
  it('runs JSON-file CLI inputs with distinct PASS, FAIL and UNVERIFIED exit codes',()=>{
    const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-layout-'));
    try{
      for(const [status,code]of [['PASS',0],['FAIL',2],['UNVERIFIED',3]]){
        const l=layout();if(status==='FAIL')l.pieces[0].placement.translationCm=[20,20];
        if(status==='UNVERIFIED')delete l.pieces[0].grain;
        const file=path.join(root,status+'.json');fs.writeFileSync(file,JSON.stringify(l));
        const run=require('child_process').spawnSync(process.execPath,[path.join(__dirname,'run.js'),file],{encoding:'utf8'});
        expect(run.status).toBe(code);expect(JSON.parse(run.stdout).status).toBe(status);
      }
      const missing=cp.spawnSync(process.execPath,[path.join(__dirname,'run.js'),path.join(root,'missing.json')],{encoding:'utf8'});
      expect(missing.status).toBe(1);expect(JSON.parse(missing.stderr).classification).toBe('CLI_INPUT_ERROR');
    }finally{
      if(path.dirname(root)!==os.tmpdir()||!path.basename(root).startsWith('borsal-layout-'))throw Error('Unsafe cleanup');
      fs.rmSync(root,{recursive:true,force:true});
    }
  });
});
