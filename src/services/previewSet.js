// One explicit four-call authorization. Sequential views, no retries or startup resume.
const preview=require('./productPreview');
const ROLES=['HERO','ALTERNATE','DETAIL','IN_USE'];
function initial(prepared,input){return {id:null,status:'QUEUED',authorizedCalls:4,sourceHash:prepared.provenance.sourceHash,reviewVersion:input.expectedReviewVersion,proposalId:input.proposalId||null,
  technicalImageBriefHash:prepared.provenance.technicalImageBriefHash,designFingerprint:prepared.provenance.designFingerprint,designVersion:prepared.provenance.designVersion,designSpecification:prepared.provenance.designSpecification,imageCategory:prepared.provenance.imageCategory,fingerprint:prepared.fingerprint,visualSpecification:prepared.visualSpecification,startedAt:new Date().toISOString(),views:ROLES.map(viewRole=>({viewRole,status:'QUEUED'}))};}
async function run({op,runId,conceptId,projectId,input,runtime,canContinue,onProviderFailure}){
 const set=op.result.previewSet;let hero,stop;
 const save=async()=>{op.markModified('result');await op.save();};
 set.status='IN_PROGRESS';await save();
 for(const row of set.views){
  if(stop){row.status='FAILED';row.failure={code:stop,outcome:'NOT_DISPATCHED'};await save();continue;}
  let phase='PREPARING';
  try{
   await canContinue();
   const prepared=await preview.prepare(runId,conceptId,input.proposalId,input.visualNotes,{viewRole:row.viewRole,previewSetId:String(op._id),reference:hero,visualSpecification:set.visualSpecification,designSpecification:set.designSpecification});
   if(prepared.provenance.sourceHash!==set.sourceHash||prepared.provenance.reviewVersion!==set.reviewVersion)throw Object.assign(Error(),{code:'CURRENT_SOURCE_AND_REVIEW_REQUIRED',status:409});
   if(Buffer.byteLength(prepared.prompt)>12000)throw Object.assign(Error(),{code:'IMAGE_PROMPT_TOO_LARGE',status:400});
   row.status='GENERATING';row.startedAt=new Date().toISOString();await save();phase='GENERATING';
   const image=await preview.generate(prepared,projectId,op.campaignId+'-'+row.viewRole.toLowerCase().replaceAll('_','-'),runtime);
   row.preview=image;row.status='SUCCEEDED';row.completedAt=new Date().toISOString();
   if(row.viewRole==='HERO')hero={designFingerprint:image.designFingerprint,operationId:String(op._id),imageSha256:image.imageSha256,filePath:image.filePath,visualSpecification:image.visualSpecification};
   if(image.stale)stop='SOURCE_CHANGED_DURING_PREVIEW';
  }catch(e){
   row.status='FAILED';row.failure={code:typeof e.code==='string'?e.code:'PREVIEW_VIEW_FAILED',httpStatus:Number.isInteger(e.status)?e.status:null,outcome:phase==='PREPARING'?'NOT_DISPATCHED':'MAY_HAVE_EXECUTED',diagnostics:e.diagnostics||null};row.completedAt=new Date().toISOString();
   await onProviderFailure(row.failure);
   if(row.viewRole==='HERO')stop='HERO_REFERENCE_UNAVAILABLE';
   else if(phase==='PREPARING'||[400,401,403,429].includes(e.status))stop='PREVIEW_SET_STOPPED_SAFELY';
  }
  await save();
 }
 const success=set.views.filter(v=>v.status==='SUCCEEDED').length;
 set.status=success===4&&!stop?'SUCCEEDED':success?'PARTIAL':'FAILED';set.completedAt=new Date().toISOString();
 op.state=set.status==='SUCCEEDED'?'SUCCEEDED':'FAILED';op.httpStatus=op.state==='SUCCEEDED'?201:502;
 if(op.state==='FAILED')op.failure=set.views.find(v=>v.failure)?.failure||{code:stop||'PREVIEW_SET_INCOMPLETE'};
 await save();return op;
}
module.exports={ROLES,initial,run};
