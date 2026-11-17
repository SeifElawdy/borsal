// Human attestations supplement immutable engine evidence; no inference or truth fabrication.
const mongoose=require('mongoose'),{z}=require('zod'),{timingSafeEqual,createHash}=require('crypto');
const {DesignReview,ProductionEvidence,AccessoryStock,InventoryItem}=require('../models/ApprovalInventory');
const Proposal=require('../models/TechnicalProposal'),Run=require('../models/ConceptRun'),Fabric=require('../models/FabricPiece');
const {sourceFor,fail}=require('./conceptFlow'),{fingerprint}=require('../../experiments/ai-pattern-proposals/adapter');
const {dimensions,validateWithHoles}=require('../geometry/polygon');
const {designSchema}=require('../../experiments/design-language/schema');
const object=s=>z.object(s).strict(),text=z.string().trim().min(1),hash=z.string().regex(/^[a-f0-9]{64}$/),version=z.number().int().min(0),scope=z.enum(['REAL','TEST_FIXTURE']);
const id=z.string().regex(/^[a-f0-9]{24}$/i),num=z.number().finite(),positive=num.positive(),reference=object({reference:text,sha256:hash});
const material=designSchema.shape.technical.shape.bom.element.shape.material;
const bindings=z.record(z.string().regex(/^[a-z][a-z0-9-]*$/),object({stockId:id,expectedVersion:version}));
const intakeSchema=object({scope:scope.default('REAL'),evidenceId:id.optional(),stockBindings:bindings.default({})});
const reviewSchema=object({expectedVersion:version,decision:z.enum(['APPROVED_FOR_PROTOTYPE','REVISE','REJECTED']),proposalHash:hash,sourceHash:hash,reviewer:text,rationale:text});
const stockSchema=object({scope,sku:text,material,quantity:object({value:num.min(0).max(Number.MAX_SAFE_INTEGER),unit:z.enum(['cm','cm2','piece'])}),availability:z.enum(['AVAILABLE','UNAVAILABLE','UNKNOWN']),receipt:reference});
const result=z.enum(['PASS','FAIL','UNVERIFIED']);
const evidenceSchema=object({scope,proposalHash:hash,sourceHash:hash,conceptReviewHash:hash,observedBy:text,
  measurements:object({method:z.enum(['RULER','CALIBRATED_SCANNER','TEST_FIXTURE']),widthCm:positive,heightCm:positive,areaCm2:positive,grainDirectionDeg:num.min(0).lt(180),maxErrorCm:positive,maxAreaErrorCm2:positive,maxGrainErrorDeg:num.min(0).max(90),report:reference}),
  materials:object({method:z.enum(['LAB_REPORT','INDEPENDENT_INSPECTION','TEST_FIXTURE']),material,report:reference}),
  construction:object({method:z.enum(['PHYSICAL_SAMPLE_TEST','TEST_FIXTURE']),sampleReport:reference,checks:object({DIMENSIONS:result,FOLD_FIT:result,RING_RETENTION:result,SEAM_STRENGTH:result,ABRASION:result}),resolvedBlockerHashes:z.array(hash)}),
  photos:z.array(object({kind:z.literal('PHYSICAL_PROTOTYPE'),reference:text,sha256:hash})).default([])});
const approveSchema=intakeSchema.extend({evidenceId:id,expectedReviewVersion:version,proposalHash:hash,sourceHash:hash,conceptReviewHash:hash,idempotencyKey:z.string().uuid(),rationale:text});
const bytes=s=>createHash('sha256').update(s).digest('hex');
const explicitlyTest=value=>/TEST_FIXTURE|SYNTHETIC_FIXTURE|NOT-REAL/i.test(JSON.stringify(value));
let indexedDb,indexes;
async function ensureIndexes(){
  // Unique reservation/idempotency constraints must exist even with autoIndex off.
  // Cache per actual DB handle; reconnecting an isolated demo cannot reuse it.
  const db=mongoose.connection.db;if(!db)throw fail(503,'DATABASE_NOT_READY');
  if(indexedDb!==db){indexedDb=db;indexes=Promise.all([DesignReview,ProductionEvidence,AccessoryStock,InventoryItem].map(m=>m.createIndexes()));}
  try{await indexes;}catch{indexedDb=null;throw fail(503,'INVENTORY_INDEXES_NOT_READY');}
}
const digest=p=>fingerprint({proposalId:String(p._id),version:p.version,originalInput:p.originalInput,provenance:p.provenance,feasibility:p.feasibility,svgSha256:p.svgSha256,nestingSvgSha256:p.nestingSvgSha256});
const unitFor=m=>['WOVEN_FABRIC','LINING_FABRIC','INTERFACING'].includes(m.type)?'cm2':['THREAD','WEBBING'].includes(m.type)?'cm':'piece';
const canonical=m=>JSON.stringify({type:m.type,specs:Object.fromEntries(Object.entries(m.specs).sort(([a],[b])=>a.localeCompare(b)))});
function operator(req){
  const expected=process.env.BORSAL_APPROVAL_TOKEN,received=/^Bearer (\S+)$/.exec(req.get('authorization')||'')?.[1];
  if(!expected||expected.length<32||!received||Buffer.byteLength(expected)!==Buffer.byteLength(received)||!timingSafeEqual(Buffer.from(expected),Buffer.from(received)))return null;
  const name=process.env.BORSAL_OPERATOR_ID;return name?{id:name,authority:'OPERATOR_AUTHENTICATED'}:null;
}
function fixtureEnabled(){return process.env.BORSAL_INVENTORY_TEST_FIXTURES==='1'&&/^borsal-[a-z0-9-]+-test$/.test(mongoose.connection.name||'');}
function writeAllowed(s,actor){if(!actor)throw fail(403,'OPERATOR_AUTHENTICATION_REQUIRED');if(s==='TEST_FIXTURE'?!fixtureEnabled():process.env.BORSAL_PRODUCTION_APPROVALS!=='1')throw fail(403,'WRITE_SCOPE_DISABLED');}
const get=(Model,key,session)=>Model.findById(key).session(session||null).lean();
function fixtureSource(p,r,f){let raw=p.originalInput?.proposal;try{if(p.originalInput?.rawProposalText)raw=JSON.parse(p.originalInput.rawProposalText);}catch{/* Invalid proposals are blocked separately. */}
  return /TEST_FIXTURE|SYNTHETIC/i.test(p.sourceLabel||'')||raw?.fabricMaterialDeclaration?.basis==='SYNTHETIC_FIXTURE'||r?.mode==='MOCK'||/TEST_FIXTURE|synthetic calibration/i.test(f?.name||'')||/TEST_FIXTURE/i.test(r?.sourceRefresh?.reviewer||'');}
async function load(proposalId,session){
  const p=await get(Proposal,proposalId,session);if(!p)throw fail(404,'TECHNICAL_PROPOSAL_NOT_FOUND');
  const f=await get(Fabric,p.fabricId,session),r=await get(Run,p.runId,session),c=r?.concepts.find(c=>c.id===p.conceptId),review=await DesignReview.findOne({proposalId}).session(session||null).lean();
  const reasons=[];let currentHash=null;try{currentHash=sourceFor(f).snapshot.hash;}catch{reasons.push({code:'FABRIC_GEOMETRY_UNAVAILABLE'});}
  if(currentHash!==p.provenance.fabricSourceHash||currentHash!==r?.sourceSnapshot.hash)reasons.push({code:'CURRENT_SOURCE_REQUIRED'});
  if(!c||c.reviewVersion!==p.reviewVersion||c.reviews.at(-1)?.review.decision!=='APPROVED_FOR_DRAFTING'||fingerprint(c.reviews.at(-1)?.review??null)!==p.provenance.reviewSha256)reasons.push({code:'CURRENT_CONCEPT_REVIEW_REQUIRED'});
  return {p,f,r,c,review,reasons,proposalHash:digest(p),sourceHash:p.provenance.fabricSourceHash,conceptReviewHash:p.provenance.reviewSha256};
}
async function readiness(proposalId,body={},session){
  const input=intakeSchema.parse(body),state=await load(proposalId,session),{p,f,review}=state,reasons=[...state.reasons];
  const add=(code,details={})=>reasons.push({code,...details});
  if(input.scope==='REAL'&&process.env.BORSAL_PRODUCTION_APPROVALS!=='1')add('PRODUCTION_WRITES_DISABLED');
  if(input.scope==='TEST_FIXTURE'&&!fixtureEnabled())add('TEST_FIXTURE_SCOPE_DISABLED');
  if(input.scope==='REAL'&&fixtureSource(p,state.r,f))add('TEST_FIXTURE_SOURCE_NOT_REAL_VERIFICATION');
  if(!f?.geometry?.confirmed||f.status!=='CONFIRMED')add('CONFIRMED_FABRIC_REQUIRED');
  if((f?.availabilityStatus||'AVAILABLE')!=='AVAILABLE')add('FABRIC_NOT_AVAILABLE');
  if(!f?.analysis?.analysisId||f.geometry?.basis?.analysisId!==f.analysis.analysisId)add('CURRENT_PHOTO_BASIS_REQUIRED');
  if(p.status!=='CHECKED'||p.verdict==='FAIL'||!p.feasibility)add('VALID_TECHNICAL_FEASIBILITY_REQUIRED');
  for(const layer of ['input','geometry','nesting','allowances','grain','materials','assembly'])if(p.feasibility?.layers[layer]?.status!=='PASS')add('ENGINE_LAYER_NOT_PASS',{layer});
  if(p.feasibility?.layers.construction?.status==='FAIL')add('CONSTRUCTION_INVALID');
  if(!p.previewSvg||bytes(p.previewSvg)!==p.svgSha256||!p.nestingSvg||bytes(p.nestingSvg)!==p.nestingSvgSha256)add('VALID_SVG_PROVENANCE_REQUIRED');
  const last=review?.history.at(-1);
  if(last?.decision!=='APPROVED_FOR_PROTOTYPE'||last.proposalHash!==state.proposalHash||last.sourceHash!==state.sourceHash||last.conceptReviewHash!==state.conceptReviewHash)add('CURRENT_HUMAN_TECHNICAL_REVIEW_REQUIRED');
  if(last?.authority!=='OPERATOR_AUTHENTICATED')add('AUTHENTICATED_TECHNICAL_REVIEW_REQUIRED');
  if(input.scope==='REAL'&&last?.scope==='TEST_FIXTURE')add('TEST_FIXTURE_REVIEW_NOT_REAL_VERIFICATION');
  const evidence=input.evidenceId?await get(ProductionEvidence,input.evidenceId,session):null;
  const matching=evidence&&String(evidence.proposalId)===String(p._id)&&evidence.proposalHash===state.proposalHash&&evidence.sourceHash===state.sourceHash&&evidence.conceptReviewHash===state.conceptReviewHash;
  if(!matching){add('INDEPENDENT_MEASUREMENTS_REQUIRED');add('VERIFIED_FABRIC_MATERIAL_REQUIRED');add('PHYSICAL_CONSTRUCTION_EVIDENCE_REQUIRED');}
  else{
    if(evidence.scope!==input.scope||evidence.attestation?.authority!=='OPERATOR_AUTHENTICATED')add('EVIDENCE_SCOPE_OR_AUTHORITY_INVALID');
    if(input.scope==='REAL'&&explicitlyTest(evidence.bundle))add('TEST_FIXTURE_EVIDENCE_NOT_REAL_VERIFICATION');
    const b=evidence.bundle,m=b.measurements,d=f?.geometry?.polygonCm?dimensions(f.geometry.polygonCm):null,v=d?validateWithHoles(f.geometry.polygonCm,f.geometry.holes||[]):null;
    if(input.scope==='REAL'&&[m.method,b.materials.method,b.construction.method].includes('TEST_FIXTURE'))add('TEST_FIXTURE_EVIDENCE_NOT_REAL_VERIFICATION');
    if(!d||!v.valid||Math.abs(d.widthCm-m.widthCm)>m.maxErrorCm||Math.abs(d.heightCm-m.heightCm)>m.maxErrorCm||Math.abs(v.netAreaCm2-m.areaCm2)>m.maxAreaErrorCm2)add('INDEPENDENT_MEASUREMENTS_MISMATCH');
    const delta=Math.abs((f?.grainDirectionDeg??NaN)-m.grainDirectionDeg);if(!Number.isFinite(delta)||Math.min(delta,180-delta)>m.maxGrainErrorDeg)add('INDEPENDENT_GRAIN_MISMATCH');
    const outer=p.assessment.handoff?.drafting.technicalMetadata?.bom.filter(b=>b.source.kind==='SCRAP')||[];
    if(!outer.length||outer.some(b=>canonical(b.material)!==canonical(evidence.bundle.materials.material)))add('VERIFIED_MATERIAL_MISMATCH');
    if(Object.values(b.construction.checks).some(v=>v!=='PASS'))add('PHYSICAL_TESTS_NOT_PASS');
    for(const reason of p.feasibility?.layers.construction?.reasons||[])if(!b.construction.resolvedBlockerHashes.includes(fingerprint(reason)))add('UNRESOLVED_CONSTRUCTION_REQUIREMENT',{requirementHash:fingerprint(reason)});
  }
  const demand=new Map(),bom=p.assessment.handoff?.drafting.technicalMetadata?.bom||[];
  for(const key of Object.keys(input.stockBindings))if(!bom.some(b=>b.id===key&&b.source.kind==='STOCK'))add('UNKNOWN_STOCK_BOM_BINDING',{bomId:key});
  for(const b of bom.filter(b=>b.source.kind==='STOCK')){
    if(!Number.isFinite(b.quantity.value)||b.quantity.value<=0||b.quantity.value>Number.MAX_SAFE_INTEGER||b.quantity.unit!==unitFor(b.material)||b.quantity.unit==='piece'&&!Number.isInteger(b.quantity.value)){add('INVALID_BOM_DEMAND',{bomId:b.id});continue;}
    const binding=input.stockBindings[b.id];if(!binding){add('GENUINE_STOCK_BINDING_REQUIRED',{bomId:b.id});continue;}
    const stock=await get(AccessoryStock,binding.stockId,session);if(!stock){add('STOCK_NOT_FOUND',{bomId:b.id});continue;}
    if(stock.scope!==input.scope)add('STOCK_SCOPE_INVALID',{stockId:binding.stockId});
    if(input.scope==='REAL'&&explicitlyTest(stock.receipt))add('TEST_FIXTURE_STOCK_NOT_REAL_VERIFICATION',{stockId:binding.stockId});
    if(stock.attestation?.authority!=='OPERATOR_AUTHENTICATED')add('STOCK_ATTESTATION_REQUIRED',{stockId:binding.stockId});
    if([stock.availableQuantity,stock.reservedQuantity,stock.receivedQuantity].some(v=>!Number.isFinite(v)||v<0)||Math.abs(stock.receivedQuantity-stock.availableQuantity-stock.reservedQuantity)>1e-8)add('INVALID_STOCK_BALANCE',{stockId:binding.stockId});
    if(stock.__v!==binding.expectedVersion)add('STOCK_VERSION_CONFLICT',{stockId:binding.stockId});
    if(stock.availability!=='AVAILABLE')add('STOCK_NOT_AVAILABLE',{stockId:binding.stockId});
    if(stock.unit!==b.quantity.unit||canonical(stock.material)!==canonical(b.material))add('STOCK_REQUIREMENTS_MISMATCH',{bomId:b.id});
    let item=demand.get(binding.stockId);if(!item){item={stock,expectedVersion:binding.expectedVersion,quantity:0,bomIds:[]};demand.set(binding.stockId,item);}
    if(item.expectedVersion!==binding.expectedVersion)add('STOCK_VERSION_CONFLICT',{stockId:binding.stockId});item.quantity+=b.quantity.value;item.bomIds.push(b.id);
  }
  for(const [stockId,d]of demand)if(!Number.isFinite(d.quantity)||d.quantity>Number.MAX_SAFE_INTEGER||d.stock.availableQuantity<d.quantity)add('INSUFFICIENT_STOCK',{stockId,required:d.quantity,available:d.stock.availableQuantity});
  const report={ready:reasons.length===0,scope:input.scope,proposalHash:state.proposalHash,sourceHash:state.sourceHash,conceptReviewHash:state.conceptReviewHash,reviewVersion:review?.version||0,reasons,engineVerdict:p.verdict,manufacturingVerified:false};
  return {state,input,evidence,demand,report};
}
async function reviewDesign(proposalId,body,actor){
  const b=reviewSchema.parse(body);await ensureIndexes();let saved;
  await mongoose.connection.transaction(async session=>{
    const s=await load(proposalId,session);if(s.reasons.length)throw fail(409,'CURRENT_SOURCE_AND_REVIEW_REQUIRED');
    if(b.proposalHash!==s.proposalHash||b.sourceHash!==s.sourceHash)throw fail(409,'DESIGN_HASH_CONFLICT');
    if((s.review?.version||0)!==b.expectedVersion)throw fail(409,'DESIGN_REVIEW_VERSION_CONFLICT');
    if(s.review?.decision==='APPROVED_FOR_PRODUCTION')throw fail(409,'PRODUCTION_APPROVAL_FINAL');
    const event={version:b.expectedVersion+1,decision:b.decision,reviewer:actor?.id||b.reviewer,authority:actor?.authority||'LOCAL_DECLARED',rationale:b.rationale,proposalHash:s.proposalHash,sourceHash:s.sourceHash,conceptReviewHash:s.conceptReviewHash,scope:fixtureSource(s.p,s.r,s.f)?'TEST_FIXTURE':'REAL',createdAt:new Date(),manufacturingVerified:false};
    const r=s.review?await DesignReview.findById(s.review._id).session(session):new DesignReview({proposalId});r.version=event.version;r.decision=b.decision;r.history.push(event);await r.save({session});saved=r;
    const locked=await Run.updateOne({_id:s.r._id,__v:s.r.__v},{$inc:{__v:1}},{session});if(locked.modifiedCount!==1)throw fail(409,'CONCEPT_VERSION_CONFLICT');
  });return saved;
}
async function createStock(body,actor){
  const b=stockSchema.parse(body);writeAllowed(b.scope,actor);
  if(b.scope==='REAL'&&explicitlyTest(b))throw fail(400,'TEST_FIXTURE_NOT_REAL_STOCK');
  if(b.quantity.unit!==unitFor(b.material)||b.quantity.unit==='piece'&&!Number.isInteger(b.quantity.value))throw fail(400,'INVALID_STOCK_UNIT_OR_QUANTITY');
  await ensureIndexes();return AccessoryStock.create({sku:b.sku,scope:b.scope,material:b.material,unit:b.quantity.unit,receivedQuantity:b.quantity.value,availableQuantity:b.quantity.value,reservedQuantity:0,availability:b.availability,receipt:b.receipt,attestation:actor});
}
async function recordEvidence(proposalId,body,actor){
  const b=evidenceSchema.parse(body);writeAllowed(b.scope,actor);const s=await load(proposalId);
  if(s.reasons.length||s.proposalHash!==b.proposalHash||s.sourceHash!==b.sourceHash||s.conceptReviewHash!==b.conceptReviewHash)throw fail(409,'EVIDENCE_HASH_CONFLICT');
  if(b.observedBy===actor.id)throw fail(400,'INDEPENDENT_OBSERVER_REQUIRED');
  if(b.scope==='REAL'&&(fixtureSource(s.p,s.r,s.f)||explicitlyTest(b)))throw fail(400,'TEST_FIXTURE_NOT_REAL_VERIFICATION');
  await ensureIndexes();return ProductionEvidence.create({proposalId,scope:b.scope,proposalHash:b.proposalHash,sourceHash:b.sourceHash,conceptReviewHash:b.conceptReviewHash,bundle:b,attestation:{...actor,attestedAt:new Date(),trustBasis:'Trusted operator attestation of independent reports; not automatic scientific verification'}});
}
async function approveProduction(proposalId,body,actor){
  const b=approveSchema.parse(body);if(!actor)throw fail(403,'OPERATOR_AUTHENTICATION_REQUIRED');await ensureIndexes();const requestHash=fingerprint({proposalId,...b,stockBindings:Object.fromEntries(Object.entries(b.stockBindings).sort(([a],[b])=>a.localeCompare(b)))});let item,replayed=false;
  await mongoose.connection.transaction(async session=>{
    const previous=await InventoryItem.findOne({idempotencyKey:b.idempotencyKey}).session(session).lean();
    if(previous){if(previous.requestHash!==requestHash)throw fail(409,'IDEMPOTENCY_KEY_REUSED');item=previous;replayed=true;return;}
    if(await InventoryItem.exists({proposalId}).session(session))throw fail(409,'DESIGN_ALREADY_RESERVED');
    const g=await readiness(proposalId,{scope:b.scope,evidenceId:b.evidenceId,stockBindings:b.stockBindings},session);
    if(b.proposalHash!==g.report.proposalHash||b.sourceHash!==g.report.sourceHash||b.conceptReviewHash!==g.report.conceptReviewHash)throw fail(409,'APPROVAL_HASH_CONFLICT');
    if(b.expectedReviewVersion!==g.report.reviewVersion)throw fail(409,'DESIGN_REVIEW_VERSION_CONFLICT');
    if(!g.report.ready){const error=fail(409,'PRODUCTION_NOT_READY');error.readiness=g.report;throw error;}
    writeAllowed(b.scope,actor);const {p,f,r,review}=g.state,_id=new mongoose.Types.ObjectId(),accessories=[];
    for(const [stockId,d]of [...g.demand].sort(([a],[b])=>a.localeCompare(b))){
      const updated=await AccessoryStock.updateOne({_id:stockId,__v:d.expectedVersion,scope:b.scope,availability:'AVAILABLE',availableQuantity:{$gte:d.quantity}},{$inc:{availableQuantity:-d.quantity,reservedQuantity:d.quantity,__v:1}},{session});if(updated.modifiedCount!==1)throw fail(409,'STOCK_RESERVATION_CONFLICT');
      accessories.push({stockId,bomIds:d.bomIds,quantity:d.quantity,unit:d.stock.unit,beforeVersion:d.expectedVersion,afterVersion:d.expectedVersion+1,availableBefore:d.stock.availableQuantity,availableAfter:d.stock.availableQuantity-d.quantity});
    }
    const reserved=await Fabric.updateOne({_id:f._id,__v:f.__v,status:'CONFIRMED','geometry.confirmed':true,'geometry.version':f.geometry.version,$or:[{availabilityStatus:'AVAILABLE'},{availabilityStatus:{$exists:false}}]},{$set:{availabilityStatus:'RESERVED'},$inc:{__v:1}},{session});if(reserved.modifiedCount!==1)throw fail(409,'FABRIC_RESERVATION_CONFLICT');
    const locked=await Run.updateOne({_id:r._id,__v:r.__v},{$inc:{__v:1}},{session});if(locked.modifiedCount!==1)throw fail(409,'CONCEPT_VERSION_CONFLICT');
    const event={version:review.version+1,decision:'APPROVED_FOR_PRODUCTION',scope:b.scope,reviewer:actor.id,authority:actor.authority,rationale:b.rationale,proposalHash:g.report.proposalHash,sourceHash:g.report.sourceHash,conceptReviewHash:g.report.conceptReviewHash,evidenceId:b.evidenceId,inventoryId:String(_id),createdAt:new Date(),manufacturingVerified:false};
    const approved=await DesignReview.updateOne({_id:review._id,version:b.expectedReviewVersion},{$set:{decision:event.decision},$inc:{version:1,__v:1},$push:{history:event}},{session});if(approved.modifiedCount!==1)throw fail(409,'DESIGN_REVIEW_VERSION_CONFLICT');
    [item]=await InventoryItem.create([{_id,proposalId,fabricId:f._id,scope:b.scope,idempotencyKey:b.idempotencyKey,requestHash,
      design:{runId:p.runId,conceptId:p.conceptId,proposalVersion:p.version,proposalHash:g.report.proposalHash,sourceHash:g.report.sourceHash,conceptReviewHash:g.report.conceptReviewHash},
      references:{pattern:{kind:'FLAT_PATTERN_SVG',api:'/api/technical-proposals/'+p._id+'/preview.svg',sha256:p.svgSha256},nesting:{kind:'NESTING_LAYOUT_SVG',api:'/api/technical-proposals/'+p._id+'/nesting.svg',sha256:p.nestingSvgSha256},fabricPhoto:{kind:'FABRIC_SOURCE_PHOTO',path:f.geometry.basis.photoPath,analysisId:f.geometry.basis.analysisId},prototypePhotos:g.evidence.bundle.photos,finishedProductPhoto:null},
      manufacturingDetails:{technicalMetadata:p.assessment.handoff.drafting.technicalMetadata,cuttingPieces:p.assessment.handoff.drafting.cuttingPieces,feasibility:p.feasibility,evidenceId:b.evidenceId},approvalHistory:[...review.history,event],approvalVersion:event.version,
      reservation:{fabric:{fabricId:f._id,geometryVersion:f.geometry.version,sourceVersionBefore:f.__v,sourceVersionAfter:f.__v+1,wholeScrap:true,cutAreaCm2:p.feasibility.utilization.utilizedAreaCm2},accessories,createdAt:new Date()},readiness:g.report,productionAuthorized:b.scope==='REAL',manufacturingVerified:false,finishedProduct:false}],{session});
  });return {item,replayed,manufacturingVerified:false};
}
module.exports={operator,load,readiness,reviewDesign,createStock,recordEvidence,approveProduction,digest,fixtureEnabled};
