// Single-call adapter into the existing technical proposal transaction, not a new engine.
const fs=require('fs'),path=require('path'),{z}=require('zod');
const Run=require('../models/ConceptRun');
const {ensureCurrent,fail,writeNew}=require('./conceptFlow');
const technical=require('./technicalFlow');
const {messages:legacyMessages}=require('../../experiments/live-pattern-generation/prompt');
const {fingerprint}=require('../../experiments/ai-pattern-proposals/adapter');
const {diagnoseOutput}=require('../../experiments/design-language/ai-spike/harness');
const {openBudget,validateCampaignId}=require('../../experiments/design-language/ai-spike/campaign');
const {cloudflareProvider,COMPARISON_MODEL}=require('../../experiments/design-language/ai-spike/provider');
const ROOT=path.resolve(__dirname,'../../experiments/design-language/ai-spike/results');
const inputSchema=z.object({mode:z.enum(['MOCK','LIVE']).default('MOCK'),campaignId:z.string(),freeTierConfirmed:z.boolean().default(false),
  strategy:z.enum(['LEGACY','CANDIDATE','CONSTRUCTION']).default('LEGACY'),normalizeEquivalent:z.boolean().default(false),revisionApproach:z.enum(['SMALLER_SAME_INTENT','DIFFERENT_CONSTRUCTION_SAME_INTENT']).optional(),feedbackFromProposalId:z.string().regex(/^[a-f0-9]{24}$/).optional(),expectedReviewVersion:z.number().int().positive(),expectedTechnicalVersion:z.number().int().min(0)}).strict();
function messages(run,concept){
  // Reuse the current compact technical types/rules; adapt only the API envelope/source/selected product.
  const system=legacyMessages()[0].content
    .replace('Return exactly ONE JSON object: {"design": Root, "instances": CuttingInstance[]}.','Return exactly ONE JSON object: {"design":{"path":TEXT,"data":Root},"context":{"instances":CuttingInstance[]}}.')
    .replace('Root below describes ONLY the design member, not the response envelope.','Root describes design.data; path is a descriptive proposal source label.')
    .replaceAll('synthetic-scrap',run.sources[0].id)
    .replace(/Known: ONLY[^\n]+/, 'Known: ONLY the selected source snapshot, polygon and declared label. This text request cannot inspect the photograph. Source fiber, weave, weight, grain, stock and strength are not supplied. BOM specifications may be explicit unverified design requirements, never claims about source properties or stock. Missing source facts remain absent; document limitations. Proposed dimensions are hypotheses, not source measurements.')
    .replace('One original small fabric-based accessory, not a full invented parent bag','Only the approved selected concept; never introduce an unrequested parent bag')
    .replace('Choose your own small accessory and outline, keeping output concise.','Draft only the selected approved concept; arbitrary supported polygonal outlines are allowed.')+
    '\nUse the approved reviewer brief below. Proposed geometry, dimensions, seams and BOM are design hypotheses, not source measurements. Do not add context.fabric, stock, stockBindings or fabricMaterialDeclaration: source material, grain and stock remain unknown. Missing required source facts must remain missing; retain explicit limitations. Accessories must come from the selected brief, not a fixed keychain template. Required BOM specifications are proposed design targets, never facts about the source or available stock. Never use UNKNOWN enums, zero placeholders, or guessed source measurements. Supply context.instances for every physical cutting copy and reconcile SCRAP quantity with their total area. If required information cannot be proposed honestly, omit it and record a precise limitation; an incomplete result is allowed. No repair will be performed.';
  return [{role:'system',content:system},{role:'user',content:JSON.stringify({concept:concept.assessment.proposal,
    reviewerBrief:concept.reviews.at(-1).review.draftingBrief,sources:run.sources,
    sourceSnapshotHash:run.sourceSnapshot.hash,sourceGeometryStatus:run.sourceSnapshot.status,physicalAccuracy:'UNVERIFIED',sourceMaterialEvidence:'NOT_SUPPLIED',sourceGrainEvidence:'NOT_SUPPLIED',stockEvidence:'NOT_SUPPLIED'})}];
}
async function generate(runId,conceptId,body,{mockProvider,root=ROOT,runtime}={}){
  if(runtime)root=require('./localAI').validateRuntime(runtime).root;
  const input=inputSchema.parse(body);try{validateCampaignId(input.campaignId);}catch{throw fail(400,'INVALID_CAMPAIGN_ID');}
  const run=await Run.findById(runId);if(!run)throw fail(404,'CONCEPT_RUN_NOT_FOUND');
  const concept=run.concepts.find(c=>c.id===conceptId);if(!concept)throw fail(404,'CONCEPT_NOT_FOUND');
  await ensureCurrent(run);
  if(concept.reviewVersion!==input.expectedReviewVersion)throw fail(409,'CONCEPT_VERSION_CONFLICT');
  if((concept.technicalVersion||0)!==input.expectedTechnicalVersion)throw fail(409,'TECHNICAL_VERSION_CONFLICT');
  const review=concept.reviews.at(-1)?.review;
  if(review?.decision!=='APPROVED_FOR_DRAFTING')throw fail(409,'CONCEPT_APPROVAL_REQUIRED');
  if(!review.draftingBrief)throw fail(409,'DRAFTING_BRIEF_REQUIRED');
  const live=input.mode==='LIVE';let provider,budget,secrets=[];
  if(live){
    if(!runtime&&(root!==ROOT||process.env.BORSAL_TECHNICAL_LIVE!=='1'||process.env.BORSAL_WORKERS_FREE_CONFIRMED!=='1'||!input.freeTierConfirmed))throw fail(403,'LIVE_GENERATION_DISABLED');
    provider=runtime?require('./localAI').textProvider(runtime,{construction:input.strategy==='CONSTRUCTION'}):cloudflareProvider({accountId:process.env.CF_ACCOUNT_ID,apiToken:process.env.CF_API_TOKEN,freeTierConfirmed:true,model:COMPARISON_MODEL,timeoutMs:120000});
    budget=openBudget(root);
    secrets=[process.env.CF_ACCOUNT_ID,process.env.CF_API_TOKEN,process.env.MONGODB_URI];
  }else{provider=mockProvider;if(!provider||provider.mode!=='MOCK')throw fail(403,'MOCK_PROVIDER_REQUIRED');}
  let feedback;if(input.feedbackFromProposalId){const previous=await require('../models/TechnicalProposal').findById(input.feedbackFromProposalId).lean();if(!previous||String(previous.runId)!==run.id||previous.conceptId!==conceptId||previous.reviewVersion!==concept.reviewVersion||previous.provenance.fabricSourceHash!==run.sourceSnapshot.hash)throw fail(409,'FEEDBACK_SOURCE_MISMATCH');feedback=require('./candidatePrompt').revisionFeedback(previous);}
  const prompt=input.strategy==='CONSTRUCTION'?require('./constructionPlanner').messages(run,concept):input.strategy==='CANDIDATE'?require('./candidatePrompt').messages(run,concept,feedback,runtime?.userObservations,input.revisionApproach):messages(run,concept),promptBytes=Buffer.byteLength(JSON.stringify(prompt));
  const conservativeMaxNeurons=input.strategy==='CONSTRUCTION'?Math.ceil(((promptBytes+512)*31818+1536*68182)/1000000):(24000*26668+6144*204805)/1000000;
  if(input.strategy==='CONSTRUCTION'&&(!runtime||promptBytes>5500||conservativeMaxNeurons>300))throw fail(422,'CONSTRUCTION_PREFLIGHT_LIMIT_EXCEEDED');
  if(promptBytes+512+6144>24000||conservativeMaxNeurons>2000)throw fail(422,'PREFLIGHT_LIMIT_EXCEEDED');
  const parent=path.join(root,'campaigns');fs.mkdirSync(parent,{recursive:true});if(fs.lstatSync(parent).isSymbolicLink())throw fail(409,'INVALID_CAMPAIGN_PATH');
  const directory=path.join(parent,input.campaignId);try{fs.mkdirSync(directory);}catch(e){if(e.code==='EEXIST')throw fail(409,'CAMPAIGN_ALREADY_EXISTS');throw e;}
  const save=(name,value,raw=false)=>writeNew(path.join(directory,name),value,secrets,raw);
  const provenance={strategy:input.strategy,...(feedback?{feedbackFromProposalId:input.feedbackFromProposalId,revisionApproach:input.revisionApproach||'SMALLER_SAME_INTENT'}:{}),execution:runtime?.testing||!live?'TEST_FIXTURE':'LIVE',campaignId:input.campaignId,mode:input.mode,model:provider.model,sourceHash:run.sourceSnapshot.hash,conceptSha256:concept.assessment.provenance.proposalSha256,reviewSha256:fingerprint(review),generationParameters:provider.generationParameters??null};
  save('lock.json',{...provenance,maxRequests:1,maxRepairs:0});
  save('request.json',{...provenance,messages:prompt,promptBytes,conservativeMaxNeurons});
  const slot=budget?budget.reserve(input.campaignId,1):null;
  save('attempt-1.json',{state:'RESERVED_BEFORE_INFERENCE',globalSlot:slot,requestsDispatched:1});
  let response;
  try{response=await provider.generate(prompt,{captureEnvelope:envelope=>save('provider-envelope.json',envelope)});}catch(error){
    const failure={...provenance,status:'PROVIDER_FAILED',requestsDispatched:1,globalUsed:budget?.used()??null,code:typeof error.code==='string'?error.code:'PROVIDER_FAILURE',httpStatus:Number.isInteger(error.status)?error.status:null,...(error.diagnostics?{diagnostics:error.diagnostics}:{})};
    save('failure.json',failure);return {failure,manufacturingVerified:false};
  }
  save('response.json',response);save('raw-response.txt',response.text,true);
  const generation={...provenance,httpStatus:response.httpStatus??null,usage:response.usage??null,finishReason:response.finishReason??null,truncated:response.truncated??null,diagnostics:diagnoseOutput(response.text,response),globalUsed:budget?.used()??null};
  // Recheck review/source/version in the existing transaction AFTER inference, never retry inference.
  try{
    const proposal=await technical.create(runId,conceptId,{expectedReviewVersion:input.expectedReviewVersion,expectedTechnicalVersion:input.expectedTechnicalVersion,origin:'MODEL_OUTPUT',sourceLabel:'campaign:'+input.campaignId,rawProposalText:response.text},generation);
    save('proposal.json',proposal.toObject());let derived,recoverable=false;if(input.normalizeEquivalent&&proposal.status==='REJECTED')try{const c=require('./designCandidate');recoverable=c.candidateSchema.safeParse(c.normalizeCandidate(JSON.parse(response.text)).candidate).success;}catch{/* Raw invalid JSON stays rejected; no recovery data is invented. */}if(input.strategy==='CANDIDATE'&&(proposal.status!=='REJECTED'||recoverable)){derived=await require('./designConstruction').create(runId,conceptId,proposal.id,{expectedReviewVersion:input.expectedReviewVersion,expectedTechnicalVersion:proposal.version,allowancePolicy:'EXPLICIT_ONLY',normalizeEquivalent:input.normalizeEquivalent});save('derived-proposal.json',derived.proposal.toObject());}
    const final=derived?.proposal||proposal;if(final.previewSvg)save('preview.svg',final.previewSvg,true);
    save('result.json',{...generation,requestsDispatched:1,proposalId:String(final._id),rawProposalId:String(proposal._id),status:final.status,verdict:final.verdict,manufacturingVerified:false});
    return {proposal:final,rawProposal:proposal,generation,manufacturingVerified:false};
  }catch(error){save('persistence-failure.json',{...generation,code:error.status?error.code:'PERSISTENCE_FAILED',rawResponsePreserved:true});throw error;}
}
module.exports={generate,messages,inputSchema};
