import {it,expect} from 'vitest';
const {build}=require('./designConstruction'),planner=require('./constructionPlanner');
const actual=require('./fixtures/unsupported-construction-intent.json');
const parent=raw=>({origin:'MODEL_OUTPUT',originalInput:{rawProposalText:JSON.stringify(raw)}});
it('rejects the exact saved unsupported intent before parsing undefined design.data',()=>{
 const p=parent(actual),before=JSON.stringify(p);
 expect(()=>build(p,{},{})).toThrow('CONSTRUCTION_METHOD_UNSUPPORTED');expect(JSON.stringify(p)).toBe(before);
});
it('reports missing technical geometry explicitly without fabricating an object',()=>{
 for(const raw of [{},{design:{}},{schemaVersion:'other'}])expect(()=>build(parent(raw),{},{})).toThrow('CUTTING_GEOMETRY_REQUIRED');
});
it('preserves the explicit human gate for supported alternatives',()=>{
 expect(()=>build(parent({...actual,method:'TWO_PANEL_OPEN_SLEEVE',cutWidthCm:3,cutHeightCm:4,seamAllowanceCm:.3,hemTurnCm:.2}),{},{})).toThrow('EXPLICIT_CONSTRUCTION_SELECTION_REQUIRED');
});
it('rejects malformed construction intents without weakening their strict contract',()=>{
 expect(()=>build(parent({...actual,cutWidthCm:-1}),{},{})).toThrow('INVALID_CONSTRUCTION_INTENT');
});
it('grounds planner instructions in the selected product rather than hardcoding Woven Wrap',()=>{
 const concept={productIdea:{name:'Fabric Keychain',description:'A decorative key fob'},distinctiveFeatures:['textured fabric']},m=planner.messages({sourceSnapshot:{polygonCm:[[0,0],[1,0],[0,1]]}},{assessment:{proposal:concept}}),user=JSON.parse(m[1].content);
 expect(user.concept).toEqual(concept);expect(user.task).not.toContain('original wrap/weaving');expect(user.task).toContain('only the selected concept');
});
