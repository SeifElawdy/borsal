import {describe,it,expect,vi} from 'vitest';
const {nest}=require('./nesting');
const {evaluateLayout}=require('./engine');
const {main}=require('./nest-run');
const square=(w=2,h=w)=>[[0,0],[w,0],[w,h],[0,h]];
const piece=(id='a',polygonCm=square())=>({id,polygonCm,outlineBasis:'CUTTING',seamAllowanceStatus:'INCLUDED',grain:{localDirectionDeg:0,toleranceDeg:0}});
const request=(pieces=[piece()],fabric=square(10))=>({schemaVersion:'borsal.nesting/0.1',unit:'cm',fabric:{polygonCm:fabric,holes:[],grainDirectionDeg:0},pieces,search:{rotationsDeg:[0],gridStepsCm:[2,1],maxCandidates:500,maxBacktracks:20}});
function verify(r,input){
  expect(r.status,JSON.stringify(r)).toBe('LAYOUT_FOUND');
  const positions=new Map(r.placements.map(p=>[p.id,p]));
  const evidence=evaluateLayout({schemaVersion:'borsal.pattern-layout/0.1',unit:'cm',fabric:input.fabric,pieces:input.pieces.map(({allowedRotationsDeg,...p})=>{const {id,...placement}=positions.get(p.id);return {...p,placement};})});
  expect(evidence).toEqual(r.validatorEvidence);expect(evidence.geometryStatus).toBe('PASS');expect(evidence.status).not.toBe('FAIL');
  expect(r.manufacturingVerified).toBe(false);expect(r.globalImpossibilityClaimed).toBe(false);
}
describe('Bounded deterministic offline nesting',()=>{
  it('places multiple pieces and returns final Phase 4A evidence and area accounting',()=>{
    const l=request([piece('a'),piece('b'),piece('c')]),r=nest(l);verify(r,l);
    expect(r.validationStatus).toBe('PASS');expect(r.placements).toHaveLength(3);expect(r.bestPartial).toBe(null);
    expect(r.areaSummary.utilizedAreaCm2).toBeCloseTo(12,8);expect(r.areaSummary.remainingAreaCm2).toBeCloseTo(88,8);
  });
  it('finds valid placements in irregular concave fabric without a bag template',()=>{
    const f=[[0,0],[8,0],[8,3],[3,3],[3,8],[0,8]],l=request([piece('a'),piece('b')],f);verify(nest(l),l);
  });
  it('supports arbitrary concave cutting pieces',()=>{
    const l=request([piece('l',[[0,0],[4,0],[4,1],[1,1],[1,4],[0,4]])]);verify(nest(l),l);
  });
  it('keeps every accepted placement outside holes',()=>{
    const l=request([piece('a'),piece('b')]);l.fabric.holes=[[[3,3],[7,3],[7,7],[3,7]]];const r=nest(l);verify(r,l);expect(r.areaSummary.usableFabricAreaCm2).toBe(84);
  });
  it('does not place a piece across a hole just because area is sufficient',()=>{
    const l=request([piece('a',square(4))],square(8));l.fabric.holes=[[[2,2],[6,2],[6,6],[2,6]]];
    const r=nest(l);expect(r.status).toBe('NO_LAYOUT_FOUND');expect(r.placements).toEqual([]);expect(r.globalImpossibilityClaimed).toBe(false);
  });
  it('uses required rotations and respects per-piece choices over the default list',()=>{
    const p=piece('long',square(6,2));p.allowedRotationsDeg=[90];p.grain.localDirectionDeg=90;
    const l=request([p],square(3,8)),r=nest(l);verify(r,l);expect(r.placements[0].rotationDeg).toBe(90);expect(r.rotationChoices.long).toEqual([90]);
    l.pieces[0].allowedRotationsDeg=[0];expect(nest(l).status).toBe('NO_LAYOUT_FOUND');
  });
  it('does not bypass complete grain constraints to obtain a geometric layout',()=>{
    const p=piece('a');p.allowedRotationsDeg=[90];const r=nest(request([p]));
    expect(r.status).toBe('NO_LAYOUT_FOUND');expect(r.rejectionCounts.GRAIN_DIRECTION_MISMATCH).toBeGreaterThan(0);expect(r.globalImpossibilityClaimed).toBe(false);
  });
  it('retains UNVERIFIED grain/allowance information when geometry can be placed',()=>{
    const l=request();delete l.fabric.grainDirectionDeg;delete l.pieces[0].grain;delete l.pieces[0].outlineBasis;delete l.pieces[0].seamAllowanceStatus;
    const r=nest(l);verify(r,l);expect(r.validationStatus).toBe('UNVERIFIED');expect(r.unresolvedConstraints.map(x=>x.constraint)).toEqual(['grain','allowances']);
    expect(r.areaSummary.utilizedAreaCm2).toBeCloseTo(4,8);
  });
  it('retains partial grain uncertainty instead of assuming a tolerance',()=>{
    const l=request();l.pieces[0].grain={localDirectionDeg:0};const r=nest(l);verify(r,l);expect(r.validationStatus).toBe('UNVERIFIED');
  });
  it('fails the area necessary check without searching or asserting global impossibility',()=>{
    const r=nest(request([piece('a',square(8)),piece('b',square(8))]));
    expect(r.status).toBe('NO_LAYOUT_FOUND');expect(r.reason).toBe('AREA_PRECHECK_FAILED');expect(r.attemptedCandidates).toBe(0);expect(r.validatorCalls).toBe(1);expect(r.globalImpossibilityClaimed).toBe(false);
  });
  it('distinguishes an exhausted coarse grid from infeasibility: a finer grid finds the same pieces',()=>{
    const l=request([piece('a',square(3,2)),piece('b',square(3,2))],square(8,4));l.search.gridStepsCm=[100];
    const coarse=nest(l);expect(coarse.status).toBe('NO_LAYOUT_FOUND');expect(coarse.rejectionCounts.PIECE_OVERLAP_OR_CONTACT).toBeGreaterThan(0);expect(coarse.globalImpossibilityClaimed).toBe(false);
    l.search.gridStepsCm=[1];verify(nest(l),l);
  });
  it('sorts largest area first and resolves equal-area ties by ASCII identifier',()=>{
    const l=request([piece('z',square(1)),piece('b'),piece('a')]);const r=nest(l);verify(r,l);expect(r.pieceOrder).toEqual(['a','b','z']);
  });
  it('is deterministic and does not mutate the request or use the network',()=>{
    const l=request([piece('b'),piece('a')]),before=JSON.stringify(l),spy=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('No network'));
    try{expect(nest(l)).toEqual(nest(l));expect(JSON.stringify(l)).toBe(before);expect(spy).not.toHaveBeenCalled();}finally{spy.mockRestore();}
  });
  it('normalizes duplicate angles and coarse-to-fine levels explicitly',()=>{
    const l=request();l.search.rotationsDeg=[360,-180,0];l.search.gridStepsCm=[1,2,1];const r=nest(l);
    expect(r.searchLimits.rotationsDeg).toEqual([0,180]);expect(r.searchLimits.gridStepsCm).toEqual([2,1]);
  });
  it('stops at the global candidate cap and labels partial placement area honestly',()=>{
    const l=request([piece('a'),piece('b')]);l.search.maxCandidates=1;const r=nest(l);
    expect(r.status).toBe('NO_LAYOUT_FOUND');expect(r.reason).toBe('CANDIDATE_LIMIT');expect(r.generatedCandidates).toBe(1);expect(r.attemptedCandidates).toBe(1);
    expect(r.bestPartial.placements).toHaveLength(1);expect(r.areaSummary.basis).toBe('BEST_VALID_PARTIAL_LAYOUT');expect(r.areaSummary.utilizedAreaCm2).toBeCloseTo(4,8);
    expect(r.validatorCalls).toBeLessThanOrEqual(l.search.maxCandidates+2);expect(r.placements).toEqual([]);
  });
  it('counts duplicate grid visits toward the generation budget and bounds backtracking',()=>{
    const l=request([piece('a'),piece('b')],square(3));l.search.gridStepsCm=[2,1];l.search.maxBacktracks=0;
    const r=nest(l);expect(r.status).toBe('NO_LAYOUT_FOUND');expect(r.reason).toBe('BACKTRACK_LIMIT');expect(r.backtracks).toBe(0);expect(r.skippedDuplicateCandidates).toBeGreaterThan(0);
    expect(r.generatedCandidates).toBe(r.attemptedCandidates+r.skippedDuplicateCandidates);
  });
  it('backtracks from a locally valid large-piece placement to place all pieces',()=>{
    const f=[[0,0],[14,0],[14,2.2],[8,2.2],[8,1],[6,1],[6,4],[0,4]],l=request([piece('large',square(5,2)),piece('small',square(3))],f);
    l.search.gridStepsCm=[1];l.search.maxBacktracks=0;expect(nest(l).status).toBe('NO_LAYOUT_FOUND');
    l.search.maxBacktracks=20;const r=nest(l);verify(r,l);expect(r.backtracks).toBeGreaterThan(0);expect(r.backtracks).toBeLessThanOrEqual(20);
  });
  it('handles local polygons with negative/nonzero origins',()=>{
    const l=request([piece('offset',[[-5,-5],[-3,-5],[-3,-3],[-5,-3]])]),r=nest(l);verify(r,l);expect(r.placements[0].translationCm[0]).toBeGreaterThan(5);
  });
  it.each([
    ['zero candidates',{maxCandidates:0}],['negative step',{gridStepsCm:[-1]}],['too-small step',{gridStepsCm:[1e-9]}],['nonfinite angle',{rotationsDeg:[Infinity]}],['bypass',{skipValidation:true}],
  ])('rejects invalid search configuration: %s',(_name,search)=>{
    const l=request();l.search=search;const r=nest(l);expect(r.status).toBe('NO_LAYOUT_FOUND');expect(r.reason).toBe('INVALID_INPUT');expect(r.validatorCalls).toBe(0);expect(r.generatedCandidates).toBe(0);
  });
  it('rejects units, duplicate IDs, manual placements and oversized piece counts',()=>{
    const cases=[request(),request(),request(),request()];cases[0].unit='mm';cases[1].pieces.push(piece());cases[2].pieces[0].placement={translationCm:[0,0],rotationDeg:0};cases[3].pieces=Array.from({length:21},(_,i)=>piece('p-'+i));
    for(const l of cases)expect(nest(l).reason).toBe('INVALID_INPUT');
  });
  it('rejects invalid fabric/holes and cutting polygons through Phase 4A preflight',()=>{
    const cases=[request(),request(),request()];cases[0].fabric.polygonCm=[[0,0],[2,2],[0,2],[2,0]];
    cases[1].pieces[0].polygonCm=[[0,0],[2,2],[0,2],[2,0]];
    cases[2].fabric.holes=[[[2,2],[6,2],[6,6],[2,6]],[[3,3],[4,3],[4,4],[3,4]]];
    for(const l of cases){const r=nest(l);expect(r.reason).toBe('INVALID_FABRIC_OR_PIECE');expect(r.validatorCalls).toBe(1);expect(r.generatedCandidates).toBe(0);}
  });
  it('reproduces a found layout and a bounded failure using the committed synthetic fixture',()=>{
    const demo=main(['--demo']);expect(demo.provenance.label).toBe('SYNTHETIC_TEST_FIXTURE');expect(demo.assumptions).toContain('synthetic demonstration');
    expect(demo.results.synthetic.status).toBe('LAYOUT_FOUND');expect(demo.results.synthetic.validationStatus).toBe('PASS');
    expect(demo.results.bounded.status).toBe('NO_LAYOUT_FOUND');expect(demo.results.bounded.reason).toBe('CANDIDATE_LIMIT');
  });
  it('supports JSON CLI exit outcomes without any API/database use',()=>{
    const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');const root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-nest-'));
    try{
      for(const [kind,code]of [['pass',0],['unknown',3],['no-layout',2]]){
        const l=request();if(kind==='unknown')delete l.pieces[0].grain;if(kind==='no-layout')l.pieces[0].polygonCm=square(20);
        const file=path.join(root,kind+'.json');fs.writeFileSync(file,JSON.stringify(l));const r=cp.spawnSync(process.execPath,[path.join(__dirname,'nest-run.js'),file],{encoding:'utf8'});
        expect(r.status).toBe(code);expect(JSON.parse(r.stdout).status).toBe(kind==='no-layout'?'NO_LAYOUT_FOUND':'LAYOUT_FOUND');
      }
    }finally{if(path.dirname(root)!==os.tmpdir()||!path.basename(root).startsWith('borsal-nest-'))throw Error('Unsafe cleanup');fs.rmSync(root,{recursive:true,force:true});}
  });
});
