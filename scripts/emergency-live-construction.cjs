// Owner-authorized emergency evaluation: exactly one protected local API dispatch.
// This is never imported by startup/tests and has no retry, repair or fallback.
const fs=require('fs'),path=require('path'),{randomUUID,createHash}=require('crypto');
async function main(){
 if(!process.argv.includes('--authorize-one-free-request'))throw Error('Explicit one-request authorization flag required');
 const id=process.argv.find(a=>a.startsWith('--project='))?.slice(10);if(!/^[a-f0-9]{24}$/.test(id||''))throw Error('An explicit existing project ID is required');
 const base='http://127.0.0.1:5173',response=await fetch(base+'/ui/bootstrap'),cookie=response.headers.get('set-cookie')?.split(';')[0],before=await response.json();
 if(before.mode!=='USER'||!cookie)throw Error('Existing local USER session required');
 const config=await fetch(base+'/ui/ai-settings').then(r=>r.json());
 if(!config.constructionGeneration||config.proof?.method!=='OWNER_DASHBOARD_ATTESTATION'||config.proof.paidPlan!==false||new Date(config.proof.expiresAt)<=new Date()||config.estimates.CONSTRUCTION!==300)throw Error('Current Free-tier and shared-budget safeguards are not satisfied');
 const project=before.projects.find(p=>p._id===id),run=before.runs.find(r=>r._id===project?.selection?.runId),concept=run?.concepts.find(c=>c.id===project.selection.conceptId);
 if(!run||!concept||concept.reviews.at(-1)?.review.decision!=='APPROVED_FOR_DRAFTING')throw Error('Select an existing approved concept first; no source or approval is changed');
 const root=path.resolve('data/emergency-live-construction-20261114');fs.mkdirSync(root,{recursive:true});
 const key=randomUUID(),campaignId='mvp-technical-'+key,body={mode:'LIVE',campaignId,freeTierConfirmed:true,strategy:'CONSTRUCTION',expectedReviewVersion:concept.reviewVersion,expectedTechnicalVersion:concept.technicalVersion||0};
 const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
 const frozen={fabrics:sha(before.fabrics),inventory:sha(before.inventory),stock:sha(before.stock),proposals:Object.fromEntries(before.proposals.map(p=>[p._id,sha(p)])),reviews:sha(concept.reviews)};
 // Fixed wx marker prevents accidentally running this evaluation twice, including after a crash.
 fs.writeFileSync(path.join(root,'dispatch.json'),JSON.stringify({campaignId,projectId:id,runId:run._id,conceptId:concept.id,model:config.constructionModel,body,proof:config.proof,budgetBefore:config.budget,frozen,maxRequests:1,createdAt:new Date().toISOString()},null,2),{flag:'wx'});
 const started=performance.now();let result;
 try{const r=await fetch(base+`/api/concept-runs/${run._id}/concepts/${concept.id}/technical-proposals/generate`,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,Cookie:cookie,'X-Borsal-Calls':'1','X-Borsal-Project':id,'X-Borsal-Source':run.sourceSnapshot.hash,'Idempotency-Key':key},body:JSON.stringify(body)});result={httpStatus:r.status,elapsedMs:Math.round(performance.now()-started),response:await r.json()};}
 catch{result={httpStatus:null,elapsedMs:Math.round(performance.now()-started),error:'LOCAL_TRANSPORT_OUTCOME_UNKNOWN',notice:'Do not resend; inspect the immutable operation/campaign receipt.'};}
 fs.writeFileSync(path.join(root,'api-result.json'),JSON.stringify(result,null,2),{flag:'wx'});
 const after=await fetch(base+'/ui/bootstrap').then(r=>r.json()),settings=await fetch(base+'/ui/ai-settings').then(r=>r.json()),newRun=after.runs.find(r=>r._id===run._id),newConcept=newRun?.concepts.find(c=>c.id===concept.id);
 const preserved=frozen.fabrics===sha(after.fabrics)&&frozen.inventory===sha(after.inventory)&&frozen.stock===sha(after.stock)&&frozen.reviews===sha(newConcept?.reviews)&&before.proposals.every(p=>frozen.proposals[p._id]===sha(after.proposals.find(q=>q._id===p._id)));
 const proposal=result.response?.proposal;let assessment=null;
 if(proposal){try{const raw=JSON.parse(proposal.originalInput.rawProposalText);if(raw.schemaVersion===require('../src/services/constructionPlanner').VERSION)assessment=require('../src/services/constructionPlanner').plan(null,{id:run.sources[0].id,...run.sourceSnapshot},concept.assessment.proposal,{intent:raw});}catch{assessment={status:'RAW_OUTPUT_REMAINS_REJECTED',notice:'No silent correction performed'};}}
 if(assessment){fs.writeFileSync(path.join(root,'offline-assessment.json'),JSON.stringify(assessment,null,2),{flag:'wx'});for(const [i,a]of (assessment.alternatives||[]).entries()){fs.writeFileSync(path.join(root,`alternative-${i+1}-pattern.svg`),a.result.previewSvg,{flag:'wx'});fs.writeFileSync(path.join(root,`alternative-${i+1}-nesting.svg`),require('../experiments/live-pattern-generation/evaluate').geometrySvg(a.result.screening.validatorEvidence,{friendlyLabels:true}),{flag:'wx'});}}
 const summary={root,model:config.constructionModel,campaignId,httpStatus:result.httpStatus,operationState:result.response?.operation?.state,error:result.response?.error||result.error||null,proposalId:proposal?._id,status:proposal?.status,usage:result.response?.operation?.result?.generation?.usage||null,offlineAssessment:assessment?{status:assessment.status,attempts:assessment.attempts,alternatives:assessment.alternatives?.length}:null,budget:settings.budget,remainingConservativeNeurons:settings.proof?.remainingNeurons,preserved,manufacturingVerified:false};
 fs.writeFileSync(path.join(root,'summary.json'),JSON.stringify(summary,null,2),{flag:'wx'});console.log(JSON.stringify(summary));if(!preserved)throw Error('Source/history preservation verification failed');
}
if(require.main===module)main().catch(e=>{console.error(e.code==='EEXIST'?'One-shot evaluation marker already exists; no repeat permitted':e.message);process.exitCode=1;});
module.exports={main};
