// Presentation state only. The backend independently enforces every write gate.
export const steps=['Your fabric','Measure & inspect','Explore ideas','Choose a direction','Technical draft','Pattern & nesting','Product preview','Review & inventory'];
export function stepStates({fabric,run,concept,proposal,sourceStale,comparison,busy,stage,failedStage}){
  const approved=concept?.reviews?.at(-1)?.review?.decision==='APPROVED_FOR_DRAFTING';
  const ready=[!!fabric,!!fabric?.geometry?.confirmed,!!run?.concepts?.length,approved,!!proposal,!!proposal?.nestingSvg,false,false];
  const available=[true,!!fabric,!!fabric?.geometry?.confirmed,!!run?.concepts?.length,approved&&!comparison?.refreshRequired,!!proposal,!!concept,!!proposal];
  return steps.map((_,i)=>busy&&i===stage?'IN_PROGRESS':i===failedStage?'FAILED':i===2&&run?.state==='FAILED'?'FAILED':i>=4&&sourceStale?'UNVERIFIED':i>=3&&comparison?.refreshRequired?'BLOCKED':!available[i]?'BLOCKED':i===4&&proposal?.status==='REJECTED'?'FAILED':i===5&&proposal?.verdict==='FAIL'?'FAILED':ready[i]?'COMPLETED':i===6?'UNVERIFIED':'NEEDS_ACTION');
}
export function reviewBody(concept,{decision,reviewer,rationale,brief,prefilled=false}){
  const review={decision,reviewer,rationale,proposalSha256:concept.assessment.provenance.proposalSha256,sourceHashes:Object.fromEntries(concept.assessment.provenance.sources.map(s=>[s.id,s.sha256]))};
  if(decision==='APPROVED_FOR_DRAFTING')review.draftingBrief={schemaVersion:'borsal.manual-concept/0.1',id:'reviewed-concept-brief',authorship:'HUMAN',brief:{id:'local-reviewed-brief',text:brief,requirements:brief.split('\n').filter(s=>s.trim())},creative:{shapeIntent:brief,visualIntent:concept.assessment.proposal.distinctiveFeatures.map(f=>f.description),modelDescription:prefilled?'Prefilled from the original concept and explicitly adopted by the reviewer. Not independently engineered. Original AI output remains preserved.':'Explicit human drafting brief. Original model output remains preserved; no physical evidence asserted.'}};
  return {expectedVersion:concept.reviewVersion,review};
}

export function routineReview(concept){const p=concept.assessment.proposal;return {rationale:'I select '+p.productIdea.name+' for an unverified design proposal, not manufacturing approval.',brief:[p.productIdea.description,'Propose cutting geometry, allowances, construction and required materials appropriate to the supplied scrap.',...p.distinctiveFeatures.map(f=>f.description),'Do not invent source material properties, available stock or physical tests.',...p.unresolvedRequirements.map(r=>r.description)].join('\n')};}
