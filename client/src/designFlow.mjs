// Presentation and routing only; backend validation remains authoritative.
export const journey=[{label:'Upload Fabric',stages:[0],target:0},{label:'Analyze Fabric',stages:[1],target:1},{label:'Explore Ideas',stages:[2,3],target:2},{label:'Generate Design',stages:[4,5],target:4},{label:'Review Product',stages:[6,7],target:7}];
export function savedInput(p){if(p?.originalInput?.proposal)return p.originalInput.proposal;try{return JSON.parse(p?.originalInput?.rawProposalText||'null');}catch{return null;}}
export function designState(p){
 if(!p)return {kind:'EMPTY',label:'Ready to generate',message:'Select an idea, then ask Borsal to propose a product design.'};
 const raw=savedInput(p),geometry=p.assessment?.preliminaryGeometry?.result||p.feasibility?.evidence?.nesting;
 if(p.status==='REJECTED')return {kind:'FAILED',label:'Design needs revision',message:'The saved proposal did not pass design validation. Your idea and earlier results are preserved.'};
 if(geometry?.reason==='AREA_PRECHECK_FAILED')return {kind:'TOO_LARGE',label:'Design needs revision',message:'The proposed cutting pieces require more fabric than is available.'};
 if(geometry?.status==='NO_LAYOUT_FOUND')return {kind:'NO_FIT',label:'Design needs revision',message:'No cutting layout was found within the search limits. A smaller or different construction is needed; this does not prove that no layout exists.'};
 if(p.verdict!=='FAIL'&&p.previewSvg&&p.nestingSvg)return {kind:'READY',label:'Design ready for review',message:'A cutting pattern and fitted layout are available. Materials and physical construction still need verification.'};
 if(raw?.schemaVersion==='borsal.construction-intent/0.1')return {kind:raw.method==='UNSUPPORTED'?'INCOMPLETE':'INTENT',label:'Design needs more work',message:raw.method==='UNSUPPORTED'?'The AI described an idea but did not supply a supported construction or cutting dimensions. There is no usable cutting pattern yet.':'The proposed construction can be checked locally. Any changed product needs your explicit selection.'};
 return {kind:raw?.schemaVersion==='borsal.design-candidate/0.1'||raw?.design?.data?.technical?'SAVED_GEOMETRY':'INCOMPLETE',label:'Design needs more work',message:'The saved proposal needs assessment or additional cutting information. No completed pattern is assumed.'};
}
export const resultStage=p=>designState(p).kind==='READY'?5:4;
export function resolveContext(data,selection){
 const userMode=data?.workspaceKind==='USER',project=data?.projects?.find(p=>p._id===selection.projectId),fabric=userMode?data?.fabrics.find(f=>f._id===project?.fabricId):data?.fabrics.find(f=>f._id===selection.fabricId)||data?.fabrics[0];
 const runs=data?.runs.filter(r=>String(r.fabricId)===fabric?._id)||[],run=selection.runId?runs.find(r=>r._id===selection.runId):runs.find(r=>r._id===data?.preferredRunId)||runs[0];
 const concept=selection.conceptId?run?.concepts.find(c=>c.id===selection.conceptId):(!userMode?run?.concepts[0]:undefined),proposals=data?.proposals.filter(p=>String(p.fabricId)===fabric?._id&&String(p.runId)===run?._id&&p.conceptId===concept?.id)||[];
 const proposal=selection.proposalId?proposals.find(p=>p._id===selection.proposalId):proposals.find(p=>p._id===data?.preferredProposalId)||proposals[0];
 return {userMode,project,fabric,runs,run,concept,proposals,proposal};
}
export const previewsFor=(operations,projectId,runId,conceptId)=>(operations||[]).filter(o=>o.kind==='IMAGE'&&o.projectId===projectId&&String(o.runId)===runId&&o.conceptId===conceptId).flatMap(o=>{
 if(o.result?.previewSet)return o.result.previewSet.views.filter(v=>v.status==='SUCCEEDED'&&v.preview).map(v=>({...o,_id:v.viewRole==='HERO'?o._id:o._id+':'+v.viewRole,state:'SUCCEEDED',result:{preview:v.preview}}));
 return o.state==='SUCCEEDED'&&o.result?.preview?[o]:[];
});
export function stageForGroup(group,w){if(group===2&&w.concept)return 3;if(group===3)return resultStage(w.proposal);return journey[group].target;}
export const friendlyStatus=value=>({CONCEPT_ONLY:'Design needs more work',UNVERIFIED:'Needs verification',GEOMETRY_PASS:'Cutting layout fits the fabric',CONSTRUCTION_UNVERIFIED:'Assembly needs testing',CREATIVE_COVERAGE_PARTIAL:'Some idea details remain unresolved',PASS:'Check passed',FAIL:'Needs revision',REJECTED:'Not approved',FAILED:'Generation failed',DRAFT:'Awaiting confirmation',CONFIRMED:'Outline confirmed',APPROVED_FOR_DRAFTING:'Selected for design',APPROVED_FOR_PROTOTYPE:'Approved for prototype',PENDING_REVIEW:'Awaiting your review',NEEDS_ACTION:'Your next step',BLOCKED:'Not ready yet',IN_PROGRESS:'In progress',COMPLETED:'Done'}[value]||value?.replaceAll('_',' ')||'Needs verification');
