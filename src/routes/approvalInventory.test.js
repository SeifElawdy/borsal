import {describe,it,expect,beforeAll,afterAll,vi} from 'vitest';
const mongoose=require('mongoose'),request=require('supertest'),{randomUUID,randomBytes}=require('crypto');
require('dotenv').config({quiet:true});const databaseName='borsal-approval-'+randomUUID()+'-test',uri=new URL(process.env.MONGODB_URI);uri.pathname='/'+databaseName;
const token=randomBytes(32).toString('hex');process.env.BORSAL_MVP_DESIGN_FLOW='1';process.env.BORSAL_INVENTORY_TEST_FIXTURES='1';process.env.BORSAL_APPROVAL_TOKEN=token;process.env.BORSAL_OPERATOR_ID='TEST_OPERATOR';delete process.env.BORSAL_PRODUCTION_APPROVALS;
mongoose.set('autoIndex',false); // Production integrity must not depend on autoIndex.
const app=require('../app'),Fabric=require('../models/FabricPiece'),Run=require('../models/ConceptRun'),Proposal=require('../models/TechnicalProposal'),models=require('../models/ApprovalInventory'),service=require('../services/approvalInventory');
const {InventoryItem,AccessoryStock,DesignReview}=models,fixtures=require('../../experiments/mvp-design-flow/approval-fixtures');
const json=path=>request(app).post(path).set('Authorization','Bearer '+token);
let indexSpy;
beforeAll(async()=>{await mongoose.connect(uri.toString());await Promise.all([Run,Proposal].map(m=>m.createIndexes()));indexSpy=vi.spyOn(InventoryItem,'createIndexes');vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('Zero Cloudflare requests'));});
afterAll(async()=>{vi.restoreAllMocks();delete app.locals.conceptMockProvider;if(mongoose.connection.name===databaseName&&databaseName.endsWith('-test'))await mongoose.connection.dropDatabase();await mongoose.disconnect();for(const k of ['BORSAL_MVP_DESIGN_FLOW','BORSAL_INVENTORY_TEST_FIXTURES','BORSAL_APPROVAL_TOKEN','BORSAL_OPERATOR_ID','BORSAL_PRODUCTION_APPROVALS'])delete process.env[k];});
async function setup({ringQuantity=1,prepare=true}={}){
  const polygon=require('../../experiments/pattern-feasibility/synthetic-fabric.json').polygonCm,analysisId=randomUUID(),photoPath='data/test-mat40.png';
  const fabric=await Fabric.create({name:'TEST_FIXTURE synthetic calibration source - not real fabric',status:'CONFIRMED',grainDirectionDeg:90,availabilityStatus:'AVAILABLE',analysis:{analysisId,photoPath,suggestedPolygonCm:polygon},geometry:{polygonCm:polygon,confirmed:true,version:1,basis:{analysisId,photoPath}}});
  const concepts=require('../../experiments/mvp-design-flow/technical-fixture').concepts('fabric-'+fabric._id);app.locals.conceptMockProvider={mode:'MOCK',generate:async()=>({text:JSON.stringify({concepts})})};let generated;try{generated=await request(app).post('/api/fabrics/'+fabric._id+'/concepts').send({mode:'MOCK'});}finally{delete app.locals.conceptMockProvider;}
  expect(generated.status).toBe(201);const r=generated.body.run,c=r.concepts[0],prefix='/api/concept-runs/'+r._id+'/concepts/'+c.id;
  const review={decision:'APPROVED_FOR_DRAFTING',reviewer:'TEST_FIXTURE',rationale:'Fixture only',proposalSha256:c.assessment.provenance.proposalSha256,sourceHashes:Object.fromEntries(c.assessment.provenance.sources.map(s=>[s.id,s.sha256])),draftingBrief:require('../../experiments/mvp-design-flow/keychain-live').draftingBrief()};expect((await request(app).post(prefix+'/review').send({expectedVersion:0,review})).status).toBe(200);
  const proposal=require('../../experiments/mvp-design-flow/keychain-feasibility-demo').fixtureProposal();proposal.design.data.technical.scrapSources[0].id=r.sources[0].id;proposal.design.data.technical.bom[0].source.scrapId=r.sources[0].id;
  const submitted=await request(app).post(prefix+'/technical-proposals').send({expectedReviewVersion:1,expectedTechnicalVersion:0,origin:'AUTHORED',sourceLabel:'TEST_FIXTURE engineering draft',proposal});expect(submitted.status).toBe(201);const p=submitted.body.proposal;expect(p.status).toBe('CHECKED');
  const root='/api/technical-proposals/'+p._id,hashes=(await request(app).post(root+'/production-readiness').send({})).body;
  const prototype={expectedVersion:0,decision:'APPROVED_FOR_PROTOTYPE',reviewer:'TEST_OPERATOR',rationale:'Prototype only; never manufacturing proof',proposalHash:hashes.proposalHash,sourceHash:hashes.sourceHash};
  const result={p,root,hashes,prototype,fabric,run:r,conceptReview:review,prefix};if(!prepare)return result;
  expect((await json(root+'/design-review').send(prototype)).status).toBe(201);
  const stockBindings={};for(const entry of fixtures.stocks(p)){const b=structuredClone(entry.body);if(entry.bomId==='key-ring')b.quantity.value=ringQuantity;const out=await json('/api/accessory-stock').send(b);expect(out.status).toBe(201);stockBindings[entry.bomId]={stockId:out.body.stock._id,expectedVersion:0};}
  const evidenceBody=fixtures.evidence(p,hashes),ev=await json(root+'/verification-evidence').send(evidenceBody);expect(ev.status).toBe(201);
  return {...result,stockBindings,evidenceBody,evidenceId:ev.body.evidence._id,approval:{scope:'TEST_FIXTURE',stockBindings,evidenceId:ev.body.evidence._id,expectedReviewVersion:1,proposalHash:hashes.proposalHash,sourceHash:hashes.sourceHash,conceptReviewHash:hashes.conceptReviewHash,idempotencyKey:randomUUID(),rationale:'TEST_FIXTURE transaction only, no real-world approval'}};
}
describe('Approval and transactional inventory: isolated TEST_FIXTURE only',()=>{
  it('records distinct prototype/revise/reject decisions without any reservation',async()=>{
    const s=await setup({prepare:false});for(const [i,decision]of ['APPROVED_FOR_PROTOTYPE','REVISE','REJECTED'].entries()){const out=await json(s.root+'/design-review').send({...s.prototype,expectedVersion:i,decision});expect(out.status).toBe(201);expect(out.body.review.version).toBe(i+1);expect(out.body.manufacturingVerified).toBe(false);}
    const review=(await request(app).get(s.root+'/design-review')).body.review;expect(review.history.map(e=>e.decision)).toEqual(['APPROVED_FOR_PROTOTYPE','REVISE','REJECTED']);expect((await Fabric.findById(s.fabric._id)).availabilityStatus).toBe('AVAILABLE');expect(await InventoryItem.countDocuments({proposalId:s.p._id})).toBe(0);
    expect(indexSpy).toHaveBeenCalledTimes(1);expect((await InventoryItem.collection.indexes()).filter(i=>i.unique).map(i=>i.name)).toEqual(expect.arrayContaining(['proposalId_1','fabricId_1','idempotencyKey_1']));
    expect((await json(s.root+'/design-review').send({...s.prototype,expectedVersion:3,decision:'APPROVED_FOR_PRODUCTION'})).status).toBe(400);
  });
  it('never accepts TEST_FIXTURE evidence/stock/source as REAL verification, even with writes enabled',async()=>{
    const s=await setup();process.env.BORSAL_PRODUCTION_APPROVALS='1';try{
      const out=await json(s.root+'/approve-production').send({...s.approval,scope:'REAL'});expect(out.status).toBe(409);expect(out.body.readiness.reasons.map(r=>r.code)).toEqual(expect.arrayContaining(['TEST_FIXTURE_SOURCE_NOT_REAL_VERIFICATION','TEST_FIXTURE_REVIEW_NOT_REAL_VERIFICATION','EVIDENCE_SCOPE_OR_AUTHORITY_INVALID','TEST_FIXTURE_EVIDENCE_NOT_REAL_VERIFICATION','STOCK_SCOPE_INVALID']));expect(await InventoryItem.countDocuments({proposalId:s.p._id})).toBe(0);expect((await Fabric.findById(s.fabric._id)).availabilityStatus).toBe('AVAILABLE');
      expect((await json(s.root+'/verification-evidence').send({...s.evidenceBody,scope:'REAL'})).body.error).toBe('TEST_FIXTURE_NOT_REAL_VERIFICATION');
      const mislabeled={...fixtures.stocks(s.p)[0].body,scope:'REAL',sku:'incorrect-label-'+randomUUID()};expect((await json('/api/accessory-stock').send(mislabeled)).body.error).toBe('TEST_FIXTURE_NOT_REAL_STOCK');
    }finally{delete process.env.BORSAL_PRODUCTION_APPROVALS;}
  });
  it('atomically creates a labeled production-plan fixture and reserves whole fabric and exact accessories',async()=>{
    const s=await setup(),before=JSON.stringify(await Proposal.findById(s.p._id).lean()),f=await Fabric.findById(s.fabric._id).lean();const ready=await request(app).post(s.root+'/production-readiness').send({scope:'TEST_FIXTURE',stockBindings:s.stockBindings,evidenceId:s.evidenceId});expect(ready.body.ready,JSON.stringify(ready.body)).toBe(true);
    const out=await json(s.root+'/approve-production').send(s.approval);expect(out.status,JSON.stringify(out.body)).toBe(201);const item=out.body.item;expect(item.scope).toBe('TEST_FIXTURE');expect(item.productionAuthorized).toBe(false);expect(item.finishedProduct).toBe(false);expect(item.manufacturingVerified).toBe(false);expect(item.references.pattern.kind).toBe('FLAT_PATTERN_SVG');expect(item.references.fabricPhoto.kind).toBe('FABRIC_SOURCE_PHOTO');expect(item.references.finishedProductPhoto).toBe(null);expect(item.approvalVersion).toBe(2);expect(item.approvalHistory.at(-1).decision).toBe('APPROVED_FOR_PRODUCTION');
    const reserved=await Fabric.findById(s.fabric._id).lean();expect(reserved.availabilityStatus).toBe('RESERVED');expect(reserved.geometry).toEqual(f.geometry);expect(reserved.__v).toBe(f.__v+1);
    for(const b of Object.values(s.stockBindings)){const stock=await AccessoryStock.findById(b.stockId);expect(stock.availableQuantity).toBe(0);expect(stock.reservedQuantity).toBe(stock.receivedQuantity);expect(stock.__v).toBe(1);}
    expect(JSON.stringify(await Proposal.findById(s.p._id).lean())).toBe(before);expect((await request(app).get('/api/inventory/'+item._id)).body.item._id).toBe(item._id);
  });
  it('replays the same idempotent request without double reservation and rejects changed keys/payloads',async()=>{
    const s=await setup(),first=await json(s.root+'/approve-production').send(s.approval),again=await json(s.root+'/approve-production').send({...s.approval,stockBindings:Object.fromEntries(Object.entries(s.stockBindings).reverse())});expect(first.status).toBe(201);expect(again.status).toBe(200);expect(again.body.item._id).toBe(first.body.item._id);
    expect((await json(s.root+'/approve-production').send({...s.approval,rationale:'Different request'})).body.error).toBe('IDEMPOTENCY_KEY_REUSED');expect((await json(s.root+'/approve-production').send({...s.approval,idempotencyKey:randomUUID()})).body.error).toBe('DESIGN_ALREADY_RESERVED');expect(await InventoryItem.countDocuments({proposalId:s.p._id})).toBe(1);
  });
  it('handles concurrent identical approvals with 201/200 and one reservation',async()=>{
    const s=await setup(),out=await Promise.all([json(s.root+'/approve-production').send(s.approval),json(s.root+'/approve-production').send(s.approval)]);expect(out.map(o=>o.status).sort()).toEqual([200,201]);expect(await InventoryItem.countDocuments({proposalId:s.p._id})).toBe(1);
  });
  it('prevents double reservation across competing keys and across designs sharing accessory stock',async()=>{
    const a=await setup(),b=await setup();const competing=await Promise.all([json(a.root+'/approve-production').send(a.approval),json(a.root+'/approve-production').send({...a.approval,idempotencyKey:randomUUID()})]);expect(competing.map(o=>o.status).sort()).toEqual([201,409]);
    const c=await setup();c.approval.stockBindings=b.stockBindings;const out=await Promise.all([json(b.root+'/approve-production').send(b.approval),json(c.root+'/approve-production').send(c.approval)]);expect(out.map(o=>o.status).sort()).toEqual([201,409]);expect(await InventoryItem.countDocuments({proposalId:{$in:[b.p._id,c.p._id]}})).toBe(1);expect((await Fabric.find({_id:{$in:[b.fabric._id,c.fabric._id]},availabilityStatus:'RESERVED'})).length).toBe(1);
  });
  it('rolls back stock, fabric, review, run and inventory on final persistence failure',async()=>{
    const s=await setup(),fabric=JSON.stringify(await Fabric.findById(s.fabric._id).lean()),stock=JSON.stringify(await AccessoryStock.find({_id:{$in:Object.values(s.stockBindings).map(b=>b.stockId)}}).sort({_id:1}).lean()),review=JSON.stringify(await DesignReview.findOne({proposalId:s.p._id}).lean()),run=JSON.stringify(await Run.findById(s.run._id).lean()),spy=vi.spyOn(InventoryItem,'create').mockRejectedValueOnce(Error('private transaction error'));
    try{const out=await json(s.root+'/approve-production').send(s.approval);expect(out.status).toBe(500);expect(out.body.error).toBe('Internal server error');}finally{spy.mockRestore();}
    expect(JSON.stringify(await Fabric.findById(s.fabric._id).lean())).toBe(fabric);expect(JSON.stringify(await AccessoryStock.find({_id:{$in:Object.values(s.stockBindings).map(b=>b.stockId)}}).sort({_id:1}).lean())).toBe(stock);expect(JSON.stringify(await DesignReview.findOne({proposalId:s.p._id}).lean())).toBe(review);expect(JSON.stringify(await Run.findById(s.run._id).lean())).toBe(run);expect(await InventoryItem.countDocuments({proposalId:s.p._id})).toBe(0);expect((await json(s.root+'/approve-production').send(s.approval)).status).toBe(201);
  });
  it('rejects insufficient balances, stale stock versions and malformed stock units without partial writes',async()=>{
    const s=await setup({ringQuantity:0}),out=await json(s.root+'/approve-production').send(s.approval);expect(out.status).toBe(409);expect(out.body.readiness.reasons.some(r=>r.code==='INSUFFICIENT_STOCK')).toBe(true);expect((await Fabric.findById(s.fabric._id)).availabilityStatus).toBe('AVAILABLE');
    const t=await setup(),b=structuredClone(t.approval);b.stockBindings.thread.expectedVersion=99;expect((await json(t.root+'/approve-production').send(b)).body.readiness.reasons.some(r=>r.code==='STOCK_VERSION_CONFLICT')).toBe(true);
    const stock=fixtures.stocks(t.p)[0].body;stock.sku='bad-'+randomUUID();stock.quantity.value=-1;expect((await json('/api/accessory-stock').send(stock)).status).toBe(400);stock.quantity.value=1;stock.quantity.unit='piece';expect((await json('/api/accessory-stock').send(stock)).status).toBe(400);
  });
  it('rejects changed source, concept review or design review hashes and stale versions',async()=>{
    const s=await setup();expect((await json(s.root+'/approve-production').send({...s.approval,proposalHash:'0'.repeat(64)})).body.error).toBe('APPROVAL_HASH_CONFLICT');expect((await json(s.root+'/approve-production').send({...s.approval,expectedReviewVersion:0})).body.error).toBe('DESIGN_REVIEW_VERSION_CONFLICT');
    await Fabric.updateOne({_id:s.fabric._id},{$set:{'analysis.analysisId':randomUUID()},$inc:{__v:1}});const out=await json(s.root+'/approve-production').send(s.approval);expect(out.status).toBe(409);expect(out.body.readiness.reasons.some(r=>r.code==='CURRENT_SOURCE_REQUIRED')).toBe(true);
    const t=await setup();expect((await request(app).post(t.prefix+'/review').send({expectedVersion:1,review:{...t.conceptReview,decision:'REVISE'}})).status).toBe(200);expect((await json(t.root+'/approve-production').send(t.approval)).body.readiness.reasons.some(r=>r.code==='CURRENT_CONCEPT_REVIEW_REQUIRED')).toBe(true);
  });
  it('keeps failed/missing physical checks and unresolved construction blockers visible',async()=>{
    const s=await setup(),b=structuredClone(s.evidenceBody);b.construction.checks.RING_RETENTION='FAIL';b.construction.resolvedBlockerHashes=[];const ev=await json(s.root+'/verification-evidence').send(b);expect(ev.status).toBe(201);const out=await json(s.root+'/approve-production').send({...s.approval,evidenceId:ev.body.evidence._id});expect(out.status).toBe(409);expect(out.body.readiness.reasons.map(r=>r.code)).toEqual(expect.arrayContaining(['PHYSICAL_TESTS_NOT_PASS','UNRESOLVED_CONSTRUCTION_REQUIREMENT']));
    expect((await json(s.root+'/verification-evidence').send({...s.evidenceBody,observedBy:'TEST_OPERATOR'})).body.error).toBe('INDEPENDENT_OBSERVER_REQUIRED');
  });
  it('resolves concurrent technical revision versus final approval without partial reservations',async()=>{
    const s=await setup(),out=await Promise.all([json(s.root+'/approve-production').send(s.approval),json(s.root+'/design-review').send({...s.prototype,expectedVersion:1,decision:'REVISE'})]);expect(out.map(o=>o.status).sort()).toEqual([201,409]);const count=await InventoryItem.countDocuments({proposalId:s.p._id});expect((await Fabric.findById(s.fabric._id)).availabilityStatus).toBe(count?'RESERVED':'AVAILABLE');
  });
  it('rolls back all reservation writes if an independent source writer wins during approval',async()=>{
    const s=await setup(),update=AccessoryStock.updateOne;
    const spy=vi.spyOn(AccessoryStock,'updateOne').mockImplementationOnce(async function(...args){await Fabric.updateOne({_id:s.fabric._id},{$set:{'analysis.analysisId':randomUUID()},$inc:{__v:1}});return update.apply(this,args);});
    try{const out=await json(s.root+'/approve-production').send(s.approval);expect(out.status).toBe(409);expect(out.body.readiness.reasons.some(r=>r.code==='CURRENT_SOURCE_REQUIRED')).toBe(true);}finally{spy.mockRestore();}
    expect(await InventoryItem.countDocuments({proposalId:s.p._id})).toBe(0);expect((await Fabric.findById(s.fabric._id)).availabilityStatus).toBe('AVAILABLE');for(const b of Object.values(s.stockBindings)){const stock=await AccessoryStock.findById(b.stockId);expect(stock.reservedQuantity).toBe(0);expect(stock.availableQuantity).toBe(stock.receivedQuantity);}expect((await DesignReview.findOne({proposalId:s.p._id})).version).toBe(1);
  });
  it('requires operator authentication, isolates fixture mode and keeps public writes disabled',async()=>{
    const s=await setup();expect((await request(app).post(s.root+'/approve-production').send(s.approval)).status).toBe(403);expect((await request(app).post('/api/accessory-stock').send(fixtures.stocks(s.p)[0].body)).status).toBe(403);delete process.env.BORSAL_INVENTORY_TEST_FIXTURES;
    try{expect((await json(s.root+'/approve-production').send(s.approval)).status).toBe(409);}finally{process.env.BORSAL_INVENTORY_TEST_FIXTURES='1';}delete process.env.BORSAL_MVP_DESIGN_FLOW;try{expect((await request(app).get('/api/inventory')).status).toBe(404);}finally{process.env.BORSAL_MVP_DESIGN_FLOW='1';}expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it('reports uncertain commit outcomes safely and maps exhausted write conflicts to 409',async()=>{
    const s=await setup(),spy=vi.spyOn(mongoose.connection,'transaction').mockRejectedValueOnce(Object.assign(Error('private commit diagnostics'),{hasErrorLabel:label=>label==='UnknownTransactionCommitResult'}));
    try{const out=await json(s.root+'/approve-production').send(s.approval);expect(out.status).toBe(503);expect(out.body).toEqual({error:'COMMIT_OUTCOME_UNKNOWN',retrySameIdempotencyKey:true});
      spy.mockRejectedValueOnce(Object.assign(Error('private review commit'),{hasErrorLabel:label=>label==='UnknownTransactionCommitResult'}));const review=await json(s.root+'/design-review').send({...s.prototype,expectedVersion:1,decision:'REVISE'});expect(review.status).toBe(503);expect(review.body.checkCurrentStateBeforeRetry).toBe(true);
      spy.mockRejectedValueOnce(Object.assign(Error('private conflict'),{code:112}));expect((await json(s.root+'/approve-production').send(s.approval)).status).toBe(409);}finally{spy.mockRestore();}
    expect((await json(s.root+'/approve-production').send(s.approval)).status).toBe(201);
  });
});
