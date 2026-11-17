// Single-call adapter into the existing technical proposal transaction, not a new engine.
const fs=require('fs'),path=require('path'),{z}=require('zod');
const Run=require('../models/ConceptRun');
const {ensureCurrent,fail,writeNew}=require('./conceptFlow');
const technical=require('./technicalFlow');
const {messages:legacyMessages}=require('../../experiments/live-pattern-generation/prompt');
const {fingerprint}=require('../../experiments/ai-pattern-proposals/adapter');
const {diagnoseOutput}=require('../../experiments/design-language/ai-spike/harness');
const {openBudget,validateCampaignId}=require('../../experiments/design-language/ai-spike/campaign');
const {cloudflareProvider,COMPARISON_MODEL,CONSTRUCTION_POLICY,constructionMaxNeurons}=require('../../experiments/design-language/ai-spike/provider');
const ROOT=path.resolve(__dirname,'../../experiments/design-language/ai-spike/results');
const inputSchema=z.object({mode:z.enum(['MOCK','LIVE']).default('MOCK'),campaignId:z.string(),freeTierConfirmed:z.boolean().default(false),
  strategy:z.enum(['LEGACY','CANDIDATE','CONSTRUCTION','ENGINEERING']).default('LEGACY'),normalizeEquivalent:z.boolean().default(false),revisionApproach:z.enum(['SMALLER_SAME_INTENT','DIFFERENT_CONSTRUCTION_SAME_INTENT']).optional(),feedbackFromProposalId:z.string().regex(/^[a-f0-9]{24}$/).optional(),expectedReviewVersion:z.number().int().positive(),expectedTechnicalVersion:z.number().int().min(0)}).strict();
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
function applyDesign(prompt,d,blueprint=false){const u=JSON.parse(prompt[1].content);u.concept={activeDesign:require('./designIdentity').promptRequirements(d)};prompt[1].content=JSON.stringify(u);if(blueprint)return require('./blueprintProvider').bindDesign(prompt,d);prompt[0].content+=' Follow activeDesign closure and silhouette exactly. If unsupported, declare UNSUPPORTED; do not substitute another closure. Changes require separate explicit human selection.';return prompt;}
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
  const engineering=input.strategy==='ENGINEERING'?require('./localAI').engineeringSettings(runtime?.engineeringSelection):null;
  let blueprintCompatibility;if(engineering?.selection==='LLAMA_BLUEPRINT'){if(!runtime?.designSpecification)throw fail(409,'AUTHORITATIVE_CONTEXT_REQUIRED');blueprintCompatibility=require('./blueprint').compatibility(runtime.designSpecification);if(blueprintCompatibility.status==='BLOCKED')throw Object.assign(fail(409,'BLUEPRINT_REQUIREMENT_CLARIFICATION_REQUIRED'),{blueprintCompatibility});}
  const live=input.mode==='LIVE';let provider,budget,secrets=[];
  if(live){
    if(!runtime&&(root!==ROOT||process.env.BORSAL_TECHNICAL_LIVE!=='1'||process.env.BORSAL_WORKERS_FREE_CONFIRMED!=='1'||!input.freeTierConfirmed))throw fail(403,'LIVE_GENERATION_DISABLED');
    provider=runtime?require('./localAI').textProvider(runtime,{construction:['CONSTRUCTION','ENGINEERING'].includes(input.strategy),engineering:!!engineering}):cloudflareProvider({accountId:process.env.CF_ACCOUNT_ID,apiToken:process.env.CF_API_TOKEN,freeTierConfirmed:true,model:COMPARISON_MODEL,timeoutMs:120000});
    budget=openBudget(root);
    secrets=[process.env.CF_ACCOUNT_ID,process.env.CF_API_TOKEN,process.env.MONGODB_URI];
  }else{provider=mockProvider;if(!provider||provider.mode!=='MOCK')throw fail(403,'MOCK_PROVIDER_REQUIRED');}
  let feedback;if(input.feedbackFromProposalId){const previous=await require('../models/TechnicalProposal').findById(input.feedbackFromProposalId).lean();if(!previous||String(previous.runId)!==run.id||previous.conceptId!==conceptId||previous.reviewVersion!==concept.reviewVersion||previous.provenance.fabricSourceHash!==run.sourceSnapshot.hash)throw fail(409,'FEEDBACK_SOURCE_MISMATCH');feedback=require('./candidatePrompt').revisionFeedback(previous);}
  const prompt=engineering?engineering.messages(run,concept):input.strategy==='CONSTRUCTION'?require('./constructionPlanner').messages(run,concept):input.strategy==='CANDIDATE'?require('./candidatePrompt').messages(run,concept,feedback,runtime?.userObservations,input.revisionApproach):messages(run,concept);
  if(engineering?.selection==='LLAMA_BLUEPRINT'&&!runtime?.designSpecification)throw fail(409,'AUTHORITATIVE_CONTEXT_REQUIRED');
  if(runtime?.designSpecification){await require('./designIdentity').assertActive(runtime.designSpecification);applyDesign(prompt,runtime.designSpecification,engineering?.selection==='LLAMA_BLUEPRINT');}
  const promptBytes=Buffer.byteLength(JSON.stringify(prompt)),requestInputBytes=engineering?engineering.inputBytes(prompt):promptBytes;
  const conservativeMaxNeurons=engineering?engineering.maxNeurons(requestInputBytes):input.strategy==='CONSTRUCTION'?constructionMaxNeurons(promptBytes):(24000*26668+6144*204805)/1000000;
  if(engineering&&(!runtime||requestInputBytes>engineering.maxInputBytes||conservativeMaxNeurons>engineering.freeTierHoldNeurons)||input.strategy==='CONSTRUCTION'&&(!runtime||promptBytes>CONSTRUCTION_POLICY.maxPromptBytes||conservativeMaxNeurons>CONSTRUCTION_POLICY.freeTierHoldNeurons))throw fail(422,'CONSTRUCTION_PREFLIGHT_LIMIT_EXCEEDED');
  if(engineering?.selection!=='QWEN'&&(promptBytes+512+6144>24000||conservativeMaxNeurons>2000))throw fail(422,'PREFLIGHT_LIMIT_EXCEEDED');
  const parent=path.join(root,'campaigns');fs.mkdirSync(parent,{recursive:true});if(fs.lstatSync(parent).isSymbolicLink())throw fail(409,'INVALID_CAMPAIGN_PATH');
  const directory=path.join(parent,input.campaignId);try{fs.mkdirSync(directory);}catch(e){if(e.code==='EEXIST')throw fail(409,'CAMPAIGN_ALREADY_EXISTS');throw e;}
  const save=(name,value,raw=false)=>writeNew(path.join(directory,name),value,secrets,raw);
  const provenance={strategy:input.strategy,...(blueprintCompatibility?{blueprintCompatibility}:{}),...(runtime?.designSpecification?{designSpecification:runtime.designSpecification}:{}),...(feedback?{feedbackFromProposalId:input.feedbackFromProposalId,revisionApproach:input.revisionApproach||'SMALLER_SAME_INTENT'}:{}),execution:runtime?.testing||!live?'TEST_FIXTURE':'LIVE',campaignId:input.campaignId,mode:input.mode,model:provider.model,sourceHash:run.sourceSnapshot.hash,conceptSha256:concept.assessment.provenance.proposalSha256,reviewSha256:fingerprint(review),generationParameters:provider.generationParameters??null};
  save('lock.json',{...provenance,maxRequests:1,maxRepairs:0});
  save('request.json',{...provenance,messages:prompt,promptBytes,requestInputBytes,conservativeMaxNeurons});
  const slot=budget?budget.reserve(input.campaignId,1):null;
  save('attempt-1.json',{state:'RESERVED_BEFORE_INFERENCE',globalSlot:slot,requestsDispatched:1});
  let response;
  try{response=await provider.generate(prompt,{captureEnvelope:envelope=>save('provider-envelope.json',envelope)});}catch(error){
    const failure={...provenance,status:'PROVIDER_FAILED',requestsDispatched:1,globalUsed:budget?.used()??null,code:typeof error.code==='string'?error.code:'PROVIDER_FAILURE',httpStatus:Number.isInteger(error.status)?error.status:null,...(error.diagnostics?{diagnostics:error.diagnostics}:{})};
    save('failure.json',failure);return {failure,manufacturingVerified:false};
  }
  save('response.json',response);if(typeof response.text==='string')save('raw-response.txt',response.text,true);
  const generation={...provenance,httpStatus:response.httpStatus??null,usage:response.usage??null,finishReason:response.finishReason??null,truncated:response.truncated??null,diagnostics:typeof response.text==='string'?diagnoseOutput(response.text,response):{finalContentPresent:false},globalUsed:budget?.used()??null};
  if(engineering?.selection==='LLAMA_BLUEPRINT'){
    const checked=require('./blueprint').parse(response,runtime.designSpecification);
    generation.blueprint={...checked,provenance:runtime.testing||!live?'MOCK':'LIVE_AI'};
    save('blueprint-validation.json',generation.blueprint);
    if(checked.status==='FAIL'){const failure={...generation,status:'PROVIDER_FAILED',code:'BLUEPRINT_TRANSPORT_FAILED',requestsDispatched:1,manufacturingVerified:false};save('failure.json',failure);return {failure,manufacturingVerified:false};}
  }
  // Recheck review/source/version in the existing transaction AFTER inference, never retry inference.
  try{
    if(runtime?.designSpecification)await require('./designIdentity').assertActive(runtime.designSpecification);
    const proposal=await technical.create(runId,conceptId,{expectedReviewVersion:input.expectedReviewVersion,expectedTechnicalVersion:input.expectedTechnicalVersion,origin:'MODEL_OUTPUT',sourceLabel:'campaign:'+input.campaignId,rawProposalText:response.text},generation);
    save('proposal.json',proposal.toObject());let derived,recoverable=false;if(input.normalizeEquivalent&&proposal.status==='REJECTED')try{const c=require('./designCandidate');recoverable=c.candidateSchema.safeParse(c.normalizeCandidate(JSON.parse(response.text)).candidate).success;}catch{/* Raw invalid JSON stays rejected; no recovery data is invented. */}if((input.strategy==='CANDIDATE'&&(proposal.status!=='REJECTED'||recoverable))||(input.strategy==='ENGINEERING'&&proposal.status!=='REJECTED'&&!proposal.assessment.identityConflicts?.length&&(generation.blueprint?.status==='VALID'||JSON.parse(response.text).changes.length===0))){derived=await require('./designConstruction').create(runId,conceptId,proposal.id,{expectedReviewVersion:input.expectedReviewVersion,expectedTechnicalVersion:proposal.version,allowancePolicy:'EXPLICIT_ONLY',normalizeEquivalent:input.normalizeEquivalent});save('derived-proposal.json',derived.proposal.toObject());}
    const final=derived?.proposal||proposal;if(final.previewSvg)save('preview.svg',final.previewSvg,true);
    save('result.json',{...generation,requestsDispatched:1,proposalId:String(final._id),rawProposalId:String(proposal._id),status:final.status,verdict:final.verdict,manufacturingVerified:false});
    return {proposal:final,rawProposal:proposal,generation,manufacturingVerified:false};
  }catch(error){save('persistence-failure.json',{...generation,code:error.status?error.code:'PERSISTENCE_FAILED',rawResponsePreserved:true});throw error;}
}
module.exports={generate,messages,inputSchema,applyDesign};
