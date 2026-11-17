import {it,expect} from 'vitest';
import {journey,designState,resultStage,resolveContext,previewsFor} from './designFlow.mjs';
const unsupported=require('../../src/services/fixtures/unsupported-construction-intent.json');
it('keeps incomplete saved model output on Generate Design, including the exact live failure',()=>{
 const p={status:'CONCEPT_ONLY',verdict:'UNVERIFIED',originalInput:{rawProposalText:JSON.stringify(unsupported)}};
 expect(designState(p).kind).toBe('INCOMPLETE');expect(resultStage(p)).toBe(4);
 for(const originalInput of [{},{rawProposalText:'not json'},{proposal:{}}])expect(resultStage({...p,originalInput})).toBe(4);
 expect(resultStage({...p,status:'REJECTED',previewSvg:'<svg/>',nestingSvg:'<svg/>'})).toBe(4);
});
it('opens patterns only when actual cutting and nesting outputs exist without failed geometry',()=>{
 const p={status:'CONCEPT_ONLY',verdict:'UNVERIFIED',previewSvg:'<svg/>',nestingSvg:'<svg/>'};
 expect(resultStage(p)).toBe(5);expect(resultStage({...p,nestingSvg:null})).toBe(4);
 expect(resultStage({...p,assessment:{preliminaryGeometry:{result:{reason:'AREA_PRECHECK_FAILED'}}}})).toBe(4);
 expect(resultStage({...p,assessment:{preliminaryGeometry:{result:{status:'NO_LAYOUT_FOUND'}}}})).toBe(4);
});
it('presents five steps while preserving every internal workflow stage',()=>{
 expect(journey.map(g=>g.label)).toEqual(['Upload Fabric','Analyze Fabric','Explore Ideas','Generate Design','Review Product']);
 expect(journey.flatMap(g=>g.stages)).toEqual([0,1,2,3,4,5,6,7]);
});
it('never falls back to another project concept or proposal when saved references are invalid',()=>{
 const data={workspaceKind:'USER',projects:[{_id:'p',fabricId:'f'}],fabrics:[{_id:'f'},{_id:'other'}],runs:[{_id:'r',fabricId:'f',concepts:[{id:'c'}]},{_id:'other-run',fabricId:'other',concepts:[{id:'other-c'}]}],proposals:[{_id:'q',fabricId:'f',runId:'r',conceptId:'c'},{_id:'bad',fabricId:'other',runId:'other-run',conceptId:'other-c'}]};
 expect(resolveContext(data,{projectId:'p',runId:'other-run'}).run).toBeUndefined();
 expect(resolveContext(data,{projectId:'p',runId:'r',conceptId:'other-c'}).concept).toBeUndefined();
 expect(resolveContext(data,{projectId:'p',runId:'r',conceptId:'c',proposalId:'bad'}).proposal).toBeUndefined();
 expect(resolveContext(data,{projectId:'p',runId:'r'}).concept).toBeUndefined();
 expect(resolveContext(data,{projectId:'p',runId:'r',conceptId:'c',proposalId:'q'}).proposal._id).toBe('q');
});
it('requires matching project, run and concept when showing saved images',()=>{
 const a={kind:'IMAGE',state:'SUCCEEDED',projectId:'p',runId:'r',conceptId:'c',result:{preview:{}}};
 expect(previewsFor([a,{...a,runId:'other'},{...a,projectId:'other'},{...a,conceptId:'other'}],'p','r','c')).toEqual([a]);
});
