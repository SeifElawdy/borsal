// Local-only project association and request receipts. Existing business engines remain authoritative.
const express=require('express'),mongoose=require('mongoose'),fs=require('fs'),path=require('path'),{randomUUID}=require('crypto'),{z}=require('zod');
const {Project,Operation,Settings}=require('../models/CreationProject');
const Fabric=require('../models/FabricPiece'),Run=require('../models/ConceptRun'),Proposal=require('../models/TechnicalProposal');
const conceptService=require('../services/conceptFlow'),technicalGeneration=require('../services/technicalGeneration'),previewService=require('../services/productPreview');
const {fingerprint}=require('../../experiments/ai-pattern-proposals/adapter'),{openBudget}=require('../../experiments/design-language/ai-spike/campaign');
const {ROOT}=require('../services/localAI'),{imageProvider,MODEL:IMAGE_MODEL}=require('../services/imageProvider'),{COMPARISON_MODEL}=require('../../experiments/design-language/ai-spike/provider');
const fail=conceptService.fail,object=s=>z.object(s).strict(),id=z.string().regex(/^[a-f0-9]{24}$/i),hash=z.string().regex(/^[a-f0-9]{64}$/),text=z.string().trim().min(1),version=z.number().int().min(0);
const selection=object({stage:z.number().int().min(0).max(7),showUpload:z.boolean().optional(),runId:id.nullable().optional(),conceptId:z.string().nullable().optional(),proposalId:id.nullable().optional(),previewId:id.nullable().optional()});
const imageInput=object({proposalId:id.optional(),visualNotes:z.string().max(1000).default(''),expectedReviewVersion:version,expectedSourceHash:hash,freeTierConfirmed:z.literal(true),regenerate:z.boolean().default(false)});
const estimates={CONCEPTS:1900,TECHNICAL:1900,IMAGE:150}; // 1024 input/output: 4*(5.37+26.05)=125.68 Neurons, rounded conservatively.
function publicOperation(op){if(!op)return null;const o=op.toObject?op.toObject():op;return {...o,result:o.result?.preview?{...o.result,preview:{...o.result.preview,filePath:undefined,assetUrl:'/api/previews/'+o._id+'/image'}}:o.result};}
function createStudioRouter({operatorToken,simulatedProviders,generationRoot=ROOT}={}){
  const router=express.Router(),testing=!!simulatedProviders;
  const safeTesting=()=>{if(testing&&(!/^borsal-[a-z0-9-]+-test$/.test(mongoose.connection.name||'')||path.resolve(generationRoot)===ROOT))throw fail(503,'UNSAFE_PROVIDER_TEST_CONFIGURATION');};
  const wrap=fn=>async(req,res)=>{try{safeTesting();await fn(req,res);}catch(e){if(e instanceof z.ZodError)return res.status(400).json({error:'INVALID_INPUT',issues:e.issues});if(e.code===11000)return res.status(409).json({error:'PROJECT_OR_REQUEST_CONFLICT'});if(e.name==='VersionError')return res.status(409).json({error:'PROJECT_VERSION_CONFLICT'});res.status(e.status||500).json({error:e.status?e.code:'LOCAL_STUDIO_REQUEST_FAILED'});}};
  let indexedDatabase;async function indexes(){if(indexedDatabase===mongoose.connection.name)return;await Promise.all([Project.createIndexes(),Operation.createIndexes()]);indexedDatabase=mongoose.connection.name;}
  async function project(value){const key=id.parse(value),p=await Project.findById(key);if(!p)throw fail(404,'PROJECT_NOT_FOUND');return p;}
  async function ownedRun(p,runId){const r=await Run.findById(id.parse(runId));if(!r||String(r.fabricId)!==String(p.fabricId))throw fail(409,'PROJECT_SOURCE_MISMATCH');return r;}
  async function capabilities(){safeTesting();const proof=await Settings.findById('workers-free').lean(),budget=openBudget(generationRoot),credentials=testing||!!(process.env.CF_ACCOUNT_ID&&process.env.CF_API_TOKEN);
    const verified=!!proof&&proof.method===(testing?'TEST_FIXTURE':'OWNER_DASHBOARD_ATTESTATION')&&!proof.blockedReason&&!proof.paidPlan&&new Date(proof.expiresAt)>new Date();
    return {conceptGeneration:credentials&&verified&&proof.remainingNeurons>=estimates.CONCEPTS&&budget.used()<budget.limit,technicalGeneration:credentials&&verified&&proof.remainingNeurons>=estimates.TECHNICAL&&budget.used()<budget.limit,imagePreview:credentials&&verified&&proof.remainingNeurons>=estimates.IMAGE&&budget.used()<budget.limit,
      reason:!credentials?'CLOUDFLARE_CREDENTIALS_NOT_CONFIGURED':!verified?(proof?.blockedReason||'CURRENT_OWNER_FREE_TIER_VERIFICATION_REQUIRED'):budget.used()>=budget.limit?'GLOBAL_REQUEST_LIMIT_REACHED':null,
      execution:testing?'TEST_FIXTURE':'LIVE',textModel:COMPARISON_MODEL,imageModel:IMAGE_MODEL,estimates,proof:proof?{...proof,_id:undefined}:null,budget:{used:budget.used(),limit:budget.limit}};}
  router.post('/ui/projects',wrap(async(req,res)=>{const b=object({name:text.max(100)}).parse(req.body);await indexes();const p=await Project.create({name:b.name,scope:testing?'TEST_FIXTURE':'USER'});res.status(201).json({project:p,manufacturingVerified:false});}));
  router.get('/ui/projects',wrap(async(_req,res)=>res.json({projects:await Project.find().sort({updatedAt:-1}).lean()})));
  router.post('/ui/projects/:id/observations',wrap(async(req,res)=>{const p=await project(req.params.id),b=object({expectedVersion:version,runId:id,conceptId:text.max(100),stretch:z.enum(['UNKNOWN','YES','NO']),accessory:z.enum(['UNKNOWN','YES','NO'])}).parse(req.body);
    const r=await ownedRun(p,b.runId);if(!r.concepts.some(c=>c.id===b.conceptId))throw fail(409,'PROJECT_CONCEPT_MISMATCH');const f=await Fabric.findById(p.fabricId).lean();if(!f)throw fail(409,'PROJECT_SOURCE_REQUIRED');
    const record={runId:b.runId,conceptId:b.conceptId,stretch:b.stretch,accessory:b.accessory,sourceHash:conceptService.sourceFor(f).snapshot.hash,basis:'USER_DECLARED_UNVERIFIED',createdAt:new Date()};
    const updated=await Project.findOneAndUpdate({_id:p._id,__v:b.expectedVersion},{$push:{observations:record},$inc:{__v:1}},{new:true});if(!updated)throw fail(409,'PROJECT_VERSION_CONFLICT');res.json({project:updated,manufacturingVerified:false,inventoryMutated:false});
  }));
  router.patch('/ui/projects/:id',wrap(async(req,res)=>{const p=await project(req.params.id),b=object({expectedVersion:version,selection}).parse(req.body),s=b.selection;
    if(s.conceptId&&!s.runId)throw fail(409,'PROJECT_RUN_REQUIRED');
    if(s.runId){const r=await ownedRun(p,s.runId);if(s.conceptId&&!r.concepts.some(c=>c.id===s.conceptId))throw fail(409,'PROJECT_CONCEPT_MISMATCH');}
    if(s.proposalId){const q=await Proposal.findById(s.proposalId).lean();if(!q||String(q.fabricId)!==String(p.fabricId)||String(q.runId)!==s.runId||q.conceptId!==s.conceptId)throw fail(409,'PROJECT_PROPOSAL_MISMATCH');}
    if(s.previewId&&!await Operation.exists({_id:s.previewId,projectId:p._id,kind:'IMAGE'}))throw fail(409,'PROJECT_PREVIEW_MISMATCH');
    const updated=await Project.findOneAndUpdate({_id:p._id,__v:b.expectedVersion},{$set:{selection:s},$inc:{__v:1}},{new:true});if(!updated)throw fail(409,'PROJECT_VERSION_CONFLICT');res.json({project:updated});
  }));
  router.post('/ui/projects/:id/source',wrap(async(req,res)=>{const p=await project(req.params.id),b=object({expectedVersion:version,fabricId:id}).parse(req.body);await indexes();
    const f=await Fabric.findById(b.fabricId).lean();if(!f||f.registrationSource!=='photo'||new Date(f.createdAt)<p.createdAt)throw fail(409,'NEW_PROJECT_PHOTO_REQUIRED');
    const updated=await Project.findOneAndUpdate({_id:p._id,__v:b.expectedVersion,fabricId:{$exists:false}},{$set:{fabricId:f._id,selection:{stage:1,showUpload:true}},$inc:{__v:1}},{new:true});if(!updated)throw fail(409,'PROJECT_VERSION_CONFLICT');res.json({project:updated});
  }));
  router.get('/ui/ai-settings',wrap(async(_req,res)=>res.json(await capabilities())));
  router.post('/ui/ai-settings',wrap(async(req,res)=>{
    if(!operatorToken)throw fail(403,'LOCAL_OPERATOR_REQUIRED');
    const b=object({expectedVersion:version,workersFree:z.literal(true),paidBilling:z.literal(false),verifiedAt:z.string().datetime(),remainingNeurons:z.number().finite().min(0).max(10000),attestation:z.literal('I_CHECKED_THE_CURRENT_WORKERS_FREE_DASHBOARD')}).parse(req.body);
    const now=new Date(),checked=new Date(b.verifiedAt);if(Math.abs(now-checked)>5*60*1000)throw fail(400,'CURRENT_DASHBOARD_CHECK_REQUIRED');
    const expires=new Date(now);expires.setUTCHours(24,0,0,0);const current=await Settings.findById('workers-free');if((current?.revision||0)!==b.expectedVersion)throw fail(409,'SETTINGS_VERSION_CONFLICT');
    const updated=await Settings.findOneAndUpdate({_id:'workers-free',revision:current?b.expectedVersion:{$exists:false}},{$set:{verifiedAt:checked,expiresAt:expires,remainingNeurons:b.remainingNeurons,paidPlan:false,method:testing?'TEST_FIXTURE':'OWNER_DASHBOARD_ATTESTATION',blockedReason:null},$inc:{revision:1}},{new:true,upsert:!current});if(!updated)throw fail(409,'SETTINGS_VERSION_CONFLICT');res.json(await capabilities());
  }));
  async function reply(op,res,replayed=false){const body={operation:publicOperation(op),replayed,manufacturingVerified:false};if(op.result?.runId)body.run=await Run.findById(op.result.runId).lean();if(op.result?.proposalId)body.proposal=await Proposal.findById(op.result.proposalId).lean();if(op.result?.preview)body.preview=publicOperation(op).result.preview;if(op.failure)body.error=op.failure.code;return res.status(op.state==='PENDING'?202:op.httpStatus||200).json(body);}
  function generation(kind){return wrap(async(req,res)=>{
    if(!operatorToken)throw fail(403,'LOCAL_OPERATOR_REQUIRED');
    if(req.get('X-Borsal-Calls')!=='1')throw fail(400,'ONE_EXPLICIT_CALL_CONFIRMATION_REQUIRED');
    const p=await project(req.get('X-Borsal-Project')),key=z.string().uuid().parse(req.get('Idempotency-Key')),requestHash=fingerprint({kind,path:req.path,body:req.body,source:req.get('X-Borsal-Source')});await indexes();
    const existing=await Operation.findOne({projectId:p._id,requestKey:key});if(existing){if(existing.requestHash!==requestHash)throw fail(409,'IDEMPOTENCY_PAYLOAD_CONFLICT');return reply(existing,res,true);}
    const campaignId='mvp-'+kind.toLowerCase()+'-'+key;let input,run,prepared;
    if(kind==='CONCEPTS'){
      input=require('./concepts').generationSchema.parse(req.body);if(input.mode!=='LIVE'||input.campaignId!==campaignId||!input.freeTierConfirmed)throw fail(400,'EXPLICIT_LIVE_REQUEST_REQUIRED');
      if(String(p.fabricId)!==req.params.fabricId)throw fail(409,'PROJECT_SOURCE_MISMATCH');const f=await Fabric.findById(p.fabricId).lean();if(!f?.geometry?.confirmed||f.status!=='CONFIRMED'||(f.availabilityStatus||'AVAILABLE')!=='AVAILABLE')throw fail(409,'CONFIRMED_AVAILABLE_FABRIC_REQUIRED');
      if(f.analysis?.analysisId&&f.geometry.basis?.analysisId!==f.analysis.analysisId)throw fail(409,'CURRENT_PHOTO_BASIS_REQUIRED');
      if(conceptService.sourceFor(f).snapshot.hash!==req.get('X-Borsal-Source'))throw fail(409,'FABRIC_SOURCE_CHANGED');
    }else{run=await ownedRun(p,req.params.id);await conceptService.ensureCurrent(run);if(run.sourceSnapshot.hash!==req.get('X-Borsal-Source'))throw fail(409,'FABRIC_SOURCE_CHANGED');const c=run.concepts.find(c=>c.id===req.params.conceptId);if(!c)throw fail(404,'CONCEPT_NOT_FOUND');
      if(kind==='TECHNICAL'){input=technicalGeneration.inputSchema.parse(req.body);if(input.mode!=='LIVE'||input.campaignId!==campaignId||!input.freeTierConfirmed)throw fail(400,'EXPLICIT_LIVE_REQUEST_REQUIRED');if(c.reviewVersion!==input.expectedReviewVersion||(c.technicalVersion||0)!==input.expectedTechnicalVersion)throw fail(409,'CONCEPT_VERSION_CONFLICT');if(c.reviews.at(-1)?.review.decision!=='APPROVED_FOR_DRAFTING')throw fail(409,'CONCEPT_APPROVAL_REQUIRED');}
      else{input=imageInput.parse(req.body);if(c.reviewVersion!==input.expectedReviewVersion||run.sourceSnapshot.hash!==input.expectedSourceHash)throw fail(409,'CURRENT_SOURCE_AND_REVIEW_REQUIRED');prepared=await previewService.prepare(run.id,c.id,input.proposalId,input.visualNotes);if(Buffer.byteLength(prepared.prompt)>12000)throw fail(400,'IMAGE_PROMPT_TOO_LARGE');
        if(!input.regenerate){const cached=await Operation.findOne({projectId:p._id,kind:'IMAGE',state:'SUCCEEDED','result.preview.fingerprint':prepared.fingerprint}).sort({createdAt:-1});if(cached)return reply(cached,res,true);}}
    }
    const config=await capabilities();if(config.reason)throw fail(403,config.reason);
    const op=await Operation.create({projectId:p._id,requestKey:key,requestHash,kind,campaignId,execution:testing?'TEST_FIXTURE':'LIVE',runId:run?._id,conceptId:req.params.conceptId,sourceHash:run?.sourceSnapshot.hash});
    try{
      const reserved=await Settings.findOneAndUpdate({_id:'workers-free',method:testing?'TEST_FIXTURE':'OWNER_DASHBOARD_ATTESTATION',paidPlan:false,expiresAt:{$gt:new Date()},blockedReason:null,remainingNeurons:{$gte:estimates[kind]}},{$inc:{remainingNeurons:-estimates[kind],revision:1}},{new:true});if(!reserved)throw fail(403,'FREE_ALLOCATION_INSUFFICIENT_OR_EXPIRED');
      const observation=p.observations?.at(-1);
      const runtime={authorized:true,freeTierConfirmed:true,root:generationRoot,testing,userObservations:observation&&observation.conceptId===req.params.conceptId&&observation.sourceHash===run?.sourceSnapshot.hash?observation:null,textProvider:simulatedProviders?.text,imageProvider:testing?simulatedProviders.image:imageProvider({accountId:process.env.CF_ACCOUNT_ID,apiToken:process.env.CF_API_TOKEN,freeTierConfirmed:true})};
      if(kind==='CONCEPTS'){const r=await conceptService.generate(p.fabricId,input,null,runtime);op.result={runId:r._id};op.state=r.state==='FAILED'?'FAILED':'SUCCEEDED';op.httpStatus=r.state==='FAILED'?502:201;if(r.failure)op.failure=r.failure;}
      else if(kind==='TECHNICAL'){const r=await technicalGeneration.generate(run.id,req.params.conceptId,input,{runtime});if(r.failure){op.failure=r.failure;op.state='FAILED';op.httpStatus=502;}else{op.result={proposalId:r.proposal._id,generation:r.generation};op.proposalId=r.proposal._id;op.state='SUCCEEDED';op.httpStatus=201;}}
      else{const preview=await previewService.generate(prepared,p.id,campaignId,runtime);op.result={preview};op.state='SUCCEEDED';op.httpStatus=201;}
    }catch(e){op.state='FAILED';op.httpStatus=e.status||502;op.failure={code:e.code&&typeof e.code==='string'?e.code:'GENERATION_FAILED',httpStatus:Number.isInteger(e.status)?e.status:null,diagnostics:e.diagnostics||null,outcome:'REQUEST_MAY_HAVE_EXECUTED_NO_AUTOMATIC_RETRY'};}
    await op.save();if(op.state==='FAILED'&&['PROVIDER_HTTP_ERROR','AUTHENTICATION_OR_PERMISSION','QUOTA_OR_RATE_LIMIT'].includes(op.failure?.code)&&[401,403,429].includes(op.failure?.httpStatus))await Settings.updateOne({_id:'workers-free'},{$set:{blockedReason:'PROVIDER_AUTH_OR_QUOTA_REQUIRES_REVIEW'}});return reply(op,res);
  });}
  router.post('/api/fabrics/:fabricId/concepts',generation('CONCEPTS'));
  router.post('/api/concept-runs/:id/concepts/:conceptId/technical-proposals/generate',generation('TECHNICAL'));
  router.post('/api/concept-runs/:id/concepts/:conceptId/previews',generation('IMAGE'));
  router.post('/ui/projects/:projectId/runs/:id/concepts/:conceptId/proposals/:proposalId/construct',wrap(async(req,res)=>{
    if(!operatorToken)throw fail(403,'LOCAL_OPERATOR_REQUIRED');const p=await project(req.params.projectId);await ownedRun(p,req.params.id);
    const result=await require('../services/designConstruction').create(req.params.id,req.params.conceptId,id.parse(req.params.proposalId),req.body);
    res.status(result.replayed?200:201).json({...result,manufacturingVerified:false});
  }));
  router.post('/ui/projects/:projectId/runs/:id/concepts/:conceptId/assisted-draft',wrap(async(req,res)=>{
    if(!operatorToken)throw fail(403,'LOCAL_OPERATOR_REQUIRED');const p=await project(req.params.projectId);await ownedRun(p,req.params.id);
    const proposal=await require('../services/assistedDraft').create(req.params.id,req.params.conceptId,req.body);res.status(201).json({proposal,manufacturingVerified:false});
  }));
  router.get('/ui/operations/:id',wrap(async(req,res)=>{const op=await Operation.findById(id.parse(req.params.id));if(!op)throw fail(404,'OPERATION_NOT_FOUND');return reply(op,res,true);}));
  router.get('/api/previews/:id/image',wrap(async(req,res)=>{const op=await Operation.findById(id.parse(req.params.id)).lean(),file=op?.result?.preview?.filePath;if(op?.state!=='SUCCEEDED'||!file)throw fail(404,'PREVIEW_NOT_AVAILABLE');
    const root=path.resolve(__dirname,'../../data/creation-previews'),resolved=fs.realpathSync(file);if(!resolved.toLowerCase().startsWith((root+path.sep).toLowerCase()))throw fail(403,'INVALID_PREVIEW_PATH');res.type(op.result.preview.contentType).sendFile(resolved);
  }));
  return {router,capabilities,publicOperation};
}
module.exports={createStudioRouter,publicOperation};
