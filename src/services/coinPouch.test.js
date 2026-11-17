import {it,expect} from 'vitest';
const planner=require('./constructionPlanner'),saved=require('./fixtures/coin-pouch-intents.json'),{construct}=require('./designCandidate');
const source={id:'test-scrap',polygonCm:require('../../experiments/pattern-feasibility/synthetic-fabric.json').polygonCm,geometry:{confirmed:true,version:1}},concept={productIdea:{name:'Coin Pouch',description:'Small pocket for coins'},intendedUse:'Store coins',distinctiveFeatures:[{description:'Secure closure'}],unresolvedRequirements:[{description:'Closure type undecided'}]};
it('preserves the exact saved unsupported and open-sleeve responses and does not invent their missing closure',()=>{
 const before=JSON.stringify(saved);expect(planner.compile(JSON.parse(saved[0].rawText)).reason).toBe('CONSTRUCTION_METHOD_UNSUPPORTED');const sleeve=planner.compile(JSON.parse(saved[1].rawText));expect(sleeve.candidate.assembly.some(a=>a.type==='INSTALL')).toBe(false);expect(JSON.stringify(saved)).toBe(before);
});
it('constructs a new purpose-specific snap-flap proposal and genuinely nests it using existing authorities',()=>{
 const raw=JSON.parse(saved[1].rawText),before=JSON.stringify(raw),r=planner.plan(raw,source,concept,{pouch:true}),a=r.alternatives[0];
 expect(r.attempts[0].demandCm2).toBe(111);expect(r.attempts[0].status).toBe('NO_LAYOUT_FOUND');expect(a.result.screening.validatorEvidence.geometryStatus).toBe('PASS');expect(a.result.screening.placements).toHaveLength(2);expect(a.result.screening.areaSummary.requestedPieceAreaCm2).toBe(69.75);expect(a.assemblyEvidence.status).toBe('PASS');expect(a.candidate.pieces.map(p=>p.role)).toEqual(['POCKET','FLAP']);expect(a.result.previewSvg).toContain('<svg');expect(JSON.stringify(raw)).toBe(before);
 const snap=a.candidate.assembly.find(a=>a.type==='INSTALL'),hinge=a.intent.cutHeightCm-2*a.intent.hemTurnCm;expect(snap.anchors[0].point[1]).toBeCloseTo(2*hinge-snap.anchors[1].point[1]);expect(a.candidate.materials.every(m=>!m.availability)).toBe(true);expect(planner.schematic(a.intent)).toContain('physical assembly UNVERIFIED');
});
it('rejects invalid seam paths, missing flap data, insufficient clearances and unrelated product intent',()=>{
 const a=planner.plan(JSON.parse(saved[1].rawText),source,concept,{pouch:true}).alternatives[0],c=structuredClone(a.candidate);c.assembly[0].sides[0].edges=[0,2];expect(construct(c,source,concept).errors.some(e=>e.code==='DISCONNECTED_EDGE_CHAIN')).toBe(true);
 const incomplete={...a.intent};delete incomplete.flapLengthCm;expect(planner.compile(incomplete).reason).toBe('EXPLICIT_FLAP_LENGTH_REQUIRED');expect(planner.compile({...a.intent,cutWidthCm:2}).reason).toBe('POUCH_CLOSURE_CLEARANCE_INSUFFICIENT');expect(planner.plan({},source,{productIdea:{name:'Hair accessory'}},{pouch:true}).alternatives).toEqual([]);
});
it('preserves grain, physical construction and material uncertainty independently from geometry success',()=>{
 const a=planner.plan({},source,concept,{pouch:true}).alternatives[0];expect(a.verdicts.physicalAssembly).toBe('UNVERIFIED');expect(a.verdicts.stock).toBe('UNVERIFIED');expect(a.result.screening.validatorEvidence.pieces.every(p=>p.grain.status==='UNVERIFIED')).toBe(true);expect(a.candidate.limitations.join(' ')).toContain('not a new validated folding operation');
});
