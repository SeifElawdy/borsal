const {fingerprint}=require('../../experiments/ai-pattern-proposals/adapter');
const {fail}=require('./conceptFlow');
const VERSION='borsal.technical-image-brief/0.1';
function build(proposal,design){
 if(!design||design.conflicts?.length||proposal.status==='REJECTED'||!proposal.previewSvg||proposal.assessment?.identityConflicts?.length||proposal.assessment?.errors?.length)throw fail(409,'TECHNICAL_IMAGE_DESIGN_NOT_SUPPORTED');
 if(String(proposal._id)!==design.proposalId||proposal.version!==design.proposalVersion||proposal.provenance.fabricSourceHash!==design.sourceHash)throw fail(409,'DESIGN_PROPOSAL_VERSION_MISMATCH');
 let data=proposal.originalInput?.proposal;
 if(!data&&proposal.originalInput?.rawProposalText)try{data=JSON.parse(proposal.originalInput.rawProposalText);}catch{}
 const derivation=proposal.provenance.derivation||{},plan=derivation.engineering?.plan||(data?.schemaVersion==='borsal.engineering-plan/0.1'?data:null),candidate=derivation.candidate,technical=data?.design?.data?.technical;
 const components=plan?.components||candidate?.pieces||technical?.patternPieces;
 const instructions=proposal.assessment?.constructionPlan?.instructions||candidate?.instructions||technical?.assembly;
 if(!components?.length||!instructions?.length||!design.product.intendedFunction)throw fail(409,'TECHNICAL_IMAGE_DETAILS_REQUIRED');
 const closure=design.product.closure,materials=plan?.materials||candidate?.materials||technical?.bom||[],operations=plan?.operations||candidate?.assembly||technical?.assembly||[];
 const forbidden=['No extra panels, pockets, compartments, carrying straps or unsupported hardware.','No gusset, boxed base or three-dimensional depth unless explicitly described by the selected construction evidence.','Never present cutting dimensions as verified finished dimensions or capacity.'];
 for(const [kind,label]of [['ZIPPER','zipper'],['SNAP','snap'],['DRAWSTRING','drawstring'],['BUTTON','button'],['VELCRO','hook-and-loop closure']])if(closure.kind!==kind)forbidden.push('No '+label+'.');
 if(closure.kind==='NONE')forbidden.push('Open top; no closure of any kind.');
 const brief={schemaVersion:VERSION,projectId:design.projectId,conceptId:design.conceptId,proposalId:design.proposalId,proposalVersion:proposal.version,proposalHash:proposal.provenance.inputSha256,designFingerprint:design.fingerprint,sourceHash:design.sourceHash,alternative:derivation.explicitlySelected===true,product:design.product,constructionMethod:design.construction.method,components,...(!candidate&&!plan&&data?.context?.instances?{cuttingInstances:data.context.instances}:{}),materials,operations,instructions,forbidden,unresolved:[...(design.unresolved||[]),...(proposal.assessment?.constructionPlan?.unresolved||[])],dimensionBasis:'Proposed cutting geometry only. Finished depth, capacity, strength and physical assembly are not verified.',manufacturingVerified:false};
 return {...brief,hash:fingerprint(brief)};
}
module.exports={VERSION,build};
