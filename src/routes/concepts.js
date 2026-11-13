const express=require('express'),mongoose=require('mongoose');
const {z}=require('zod');
const ConceptRun=require('../models/ConceptRun');
const {reviewSchema}=require('../../experiments/staged-concept/schema');
const {reviewConcept,handoff}=require('../../experiments/staged-concept/workflow');
const {requestSchema:bridgeSchema}=require('../../experiments/design-feasibility/bridge');
const {requestSchema:draftSchema}=require('../../experiments/technical-drafting/draft');
const service=require('../services/conceptFlow');
const technical=require('../services/technicalFlow');
const TechnicalProposal=require('../models/TechnicalProposal');
const technicalGeneration=require('../services/technicalGeneration');
const router=express.Router();
router.use((req,res,next)=>{
  if(process.env.BORSAL_MVP_DESIGN_FLOW!=='1')return res.status(404).json({error:'Not found'});
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))return res.status(403).json({error:'Local development endpoint only'});
  next();
});
const wrap=fn=>async(req,res)=>{try{await fn(req,res);}catch(e){if(e instanceof z.ZodError)return res.status(400).json({error:'Invalid input',issues:e.issues});if(e.name==='VersionError')return res.status(409).json({error:'CONCEPT_VERSION_CONFLICT'});if(e.code===11000||e.code==='EEXIST')return res.status(409).json({error:'CAMPAIGN_ALREADY_EXISTS'});return res.status(e.status||500).json({error:e.status?e.code:'Internal server error'});}};
const id=value=>{if(!mongoose.isObjectIdOrHexString(value))throw service.fail(400,'INVALID_ID');return value;};
const generation=z.object({mode:z.enum(['MOCK','LIVE']).default('MOCK'),campaignId:z.string().regex(/^[a-z][a-z0-9-]{0,63}$/).optional(),freeTierConfirmed:z.boolean().default(false)}).strict().superRefine((v,c)=>{if(v.mode==='LIVE'&&!v.campaignId)c.addIssue({code:'custom',path:['campaignId'],message:'Live generation needs a fresh campaign ID'});});
router.post('/fabrics/:fabricId/concepts',wrap(async(req,res)=>{const body=generation.parse(req.body);const run=await service.generate(id(req.params.fabricId),body,req.app.locals.conceptMockProvider);res.status(run.state==='FAILED'?502:201).json({run,manufacturingVerified:false});}));
router.get('/fabrics/:fabricId/concepts',wrap(async(req,res)=>res.json({runs:await ConceptRun.find({fabricId:id(req.params.fabricId)}).sort({createdAt:-1}).lean(),manufacturingVerified:false})));
router.get('/concept-runs/:id',wrap(async(req,res)=>{const run=await ConceptRun.findById(id(req.params.id)).lean();if(!run)throw service.fail(404,'CONCEPT_RUN_NOT_FOUND');res.json({run,manufacturingVerified:false});}));
router.post('/concept-runs/:id/refresh-source',wrap(async(req,res)=>{
  const run=await service.refreshSource(id(req.params.id),req.body);res.status(201).json({run,reviewRequired:true,manufacturingVerified:false});
}));
router.get('/concept-runs/:id/source-comparison',wrap(async(req,res)=>{
  const run=await ConceptRun.findById(id(req.params.id));if(!run)throw service.fail(404,'CONCEPT_RUN_NOT_FOUND');res.json(await service.sourceComparison(run));
}));
async function selected(req){const run=await ConceptRun.findById(id(req.params.id));if(!run)throw service.fail(404,'CONCEPT_RUN_NOT_FOUND');const concept=run.concepts.find(c=>c.id===req.params.conceptId);if(!concept)throw service.fail(404,'CONCEPT_NOT_FOUND');return {run,concept};}
const reviewInput=z.object({expectedVersion:z.number().int().min(0),review:reviewSchema}).strict();
router.post('/concept-runs/:id/concepts/:conceptId/review',wrap(async(req,res)=>{
  const body=reviewInput.parse(req.body),{run,concept}=await selected(req);await service.ensureCurrent(run);
  if(body.expectedVersion!==concept.reviewVersion)throw service.fail(409,'CONCEPT_VERSION_CONFLICT');
  const result=reviewConcept(concept.rawText,body.review,{sources:run.sources});if(result.reviewGate==='BLOCKED')return res.status(400).json({error:'REVIEW_BLOCKED',result});
  concept.reviewVersion++;concept.reviews.push({version:concept.reviewVersion,review:body.review,result,createdAt:new Date()});run.markModified('concepts');await run.save();res.json({runId:run.id,concept,manufacturingVerified:false});
}));
const handoffInput=z.object({expectedVersion:z.number().int().min(1),design:draftSchema.shape.design,context:bridgeSchema.shape.context.unwrap().omit({fabric:true}).optional()}).strict();
router.post('/concept-runs/:id/concepts/:conceptId/handoff',wrap(async(req,res)=>{
  const body=handoffInput.parse(req.body),{run,concept}=await selected(req),f=await service.ensureCurrent(run);
  if(body.expectedVersion!==concept.reviewVersion)throw service.fail(409,'CONCEPT_VERSION_CONFLICT');
  const latest=concept.reviews.at(-1);if(latest?.review.decision!=='APPROVED_FOR_DRAFTING')throw service.fail(409,'CONCEPT_APPROVAL_REQUIRED');
  const actualFabric=technical.technicalFabric(f,run);
  const result=handoff(concept.rawText,latest.review,{sources:run.sources,...(body.design?{design:body.design}:{}),context:{...(body.context||{}),fabric:actualFabric}});
  concept.handoffs.push({reviewVersion:concept.reviewVersion,result,createdAt:new Date()});run.markModified('concepts');await run.save();res.json({runId:run.id,result,manufacturingVerified:false});
}));
router.post('/concept-runs/:id/concepts/:conceptId/technical-proposals/generate',wrap(async(req,res)=>{
  const result=await technicalGeneration.generate(id(req.params.id),req.params.conceptId,req.body,{mockProvider:req.app.locals.technicalMockProvider,...(req.body.mode==='MOCK'&&req.app.locals.technicalGenerationRoot?{root:req.app.locals.technicalGenerationRoot}:{})});
  res.status(result.failure?502:201).json(result);
}));
router.post('/concept-runs/:id/concepts/:conceptId/technical-proposals',wrap(async(req,res)=>{
  const proposal=await technical.create(id(req.params.id),req.params.conceptId,req.body);res.status(201).json({proposal,manufacturingVerified:false});
}));
router.get('/concept-runs/:id/concepts/:conceptId/technical-proposals',wrap(async(req,res)=>{
  const {run,concept}=await selected(req);res.json({proposals:await TechnicalProposal.find({runId:run._id,conceptId:concept.id}).sort({version:1}).lean(),manufacturingVerified:false});
}));
async function technicalById(req){const p=await TechnicalProposal.findById(id(req.params.proposalId)).lean();if(!p)throw service.fail(404,'TECHNICAL_PROPOSAL_NOT_FOUND');return p;}
router.get('/technical-proposals/:proposalId',wrap(async(req,res)=>{
  const proposal=await technicalById(req),run=await ConceptRun.findById(proposal.runId);let sourceStale=false;try{await service.ensureCurrent(run);}catch{sourceStale=true;}
  res.json({proposal,sourceStale,manufacturingVerified:false});
}));
router.get('/technical-proposals/:proposalId/preview.svg',wrap(async(req,res)=>{
  const proposal=await technicalById(req);if(!proposal.previewSvg)throw service.fail(404,'PREVIEW_NOT_AVAILABLE');
  res.set({'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'",'X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Content-Disposition':'inline; filename="technical-proposal-v'+proposal.version+'.svg"'}).type('image/svg+xml').send(proposal.previewSvg);
}));
router.get('/technical-proposals/:proposalId/nesting.svg',wrap(async(req,res)=>{
  const proposal=await technicalById(req);if(!proposal.nestingSvg)throw service.fail(404,'NESTING_PREVIEW_NOT_AVAILABLE');
  res.set({'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'",'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}).type('image/svg+xml').send(proposal.nestingSvg);
}));
module.exports=router;
