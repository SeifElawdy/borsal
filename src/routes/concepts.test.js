import {describe,it,expect,beforeAll,afterAll,vi} from 'vitest';
const mongoose=require('mongoose'),request=require('supertest'),{randomUUID}=require('crypto');
require('dotenv').config({quiet:true});
const dbName='borsal-concepts-'+randomUUID()+'-test',uri=new URL(process.env.MONGODB_URI);uri.pathname='/'+dbName;
process.env.BORSAL_MVP_DESIGN_FLOW='1';delete process.env.BORSAL_CONCEPT_LIVE;delete process.env.BORSAL_WORKERS_FREE_CONFIRMED;
const app=require('../app'),Fabric=require('../models/FabricPiece'),Run=require('../models/ConceptRun');
const fixture=require('../../experiments/pattern-feasibility/synthetic-fabric.json');
const {batchMessages,assessBatch}=require('../services/conceptFlow');
const brief=require('../../experiments/technical-drafting/examples').examples().complete.sourceConcept.data;
beforeAll(async()=>{await mongoose.connect(uri.toString());await Run.init();vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('External calls forbidden in API tests'));});
afterAll(async()=>{vi.restoreAllMocks();if(mongoose.connection.name===dbName&&dbName.endsWith('-test'))await mongoose.connection.dropDatabase();await mongoose.disconnect();delete process.env.BORSAL_MVP_DESIGN_FLOW;delete app.locals.conceptMockProvider;});
async function fabric(){return Fabric.create({name:'Synthetic burgundy test only',analysis:{analysisId:randomUUID(),photoPath:'test-only-original.png',suggestedPolygonCm:fixture.polygonCm,calibrationSource:'auto-marker',calibrationEvidence:{synthetic:true}}});}
async function generated(){const f=await fabric(),r=await request(app).post('/api/fabrics/'+f.id+'/concepts').send({});expect(r.status,JSON.stringify(r.body)).toBe(201);return {f,run:r.body.run,concept:r.body.run.concepts[0]};}
function review(c,value='APPROVED_FOR_DRAFTING'){return {decision:value,reviewer:'OFFLINE_API_TEST',rationale:'Test-only review; not manufacturing approval',proposalSha256:c.assessment.provenance.proposalSha256,sourceHashes:Object.fromEntries(c.assessment.provenance.sources.map(s=>[s.id,s.sha256])),...(value==='APPROVED_FOR_DRAFTING'?{draftingBrief:brief}:{})};}
const reviewUrl=(r,c)=>'/api/concept-runs/'+r._id+'/concepts/'+c.id+'/review';
const handoffUrl=(r,c)=>'/api/concept-runs/'+r._id+'/concepts/'+c.id+'/handoff';
describe('Local persistent MVP concept flow: offline',()=>{
  it('is disabled by default and ignores forwarded claims of locality',async()=>{
    delete process.env.BORSAL_MVP_DESIGN_FLOW;expect((await request(app).get('/api/concept-runs/'+new mongoose.Types.ObjectId())).status).toBe(404);process.env.BORSAL_MVP_DESIGN_FLOW='1';
    const r=await request(app).post('/api/fabrics/bad/concepts').set('X-Forwarded-For','203.0.113.1').send({});expect(r.status).toBe(400);
  });
  it('generates, lists and retrieves two schema-valid pending mock concepts with original-photo provenance',async()=>{
    const {f,run}=await generated();expect(run.mode).toBe('MOCK');expect(run.state).toBe('RECEIVED');expect(run.concepts).toHaveLength(2);
    expect(run.concepts.every(c=>c.assessment.schemaValid&&c.assessment.reviewGate==='PENDING_REVIEW'&&c.reviewVersion===0)).toBe(true);
    expect(run.sourceSnapshot.selectedPhoto.photoPath).toBe('test-only-original.png');expect(run.sourceSnapshot.selectedPhoto.analysisId).toBe(f.analysis.analysisId);
    expect(JSON.parse(run.rawText).concepts).toHaveLength(2);expect(run.concepts[0].assessment.provenance.sources[0].data.evidenceSha256).toBe(run.sourceSnapshot.hash);
    const listed=await request(app).get('/api/fabrics/'+f.id+'/concepts');expect(listed.body.runs.map(r=>r._id)).toContain(run._id);
    expect((await request(app).get('/api/concept-runs/'+run._id)).body.run.rawText).toBe(run.rawText);expect(await Run.countDocuments({fabricId:f._id})).toBe(1);expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it('keeps photo paths out of cloud prompt context while preserving evidence hashes',async()=>{
    const {run}=await generated(),m=batchMessages(run.sources),s=JSON.stringify(m);expect(s).not.toContain('test-only-original.png');expect(s).toContain(run.sourceSnapshot.hash);expect(s).toContain('2 or 3 distinct');expect(s).not.toContain('fiber":"COTTON');
  });
  it('preserves old confirmed photo basis rather than silently linking confirmed geometry to a new photo',async()=>{
    const f=await fabric();f.geometry={polygonCm:fixture.polygonCm,confirmed:true,version:2,basis:{analysisId:'older-analysis',photoPath:'older-original.png'}};f.status='CONFIRMED';await f.save();
    const r=await request(app).post('/api/fabrics/'+f.id+'/concepts').send({});expect(r.status).toBe(201);expect(r.body.run.sourceSnapshot.selectedPhoto).toEqual({analysisId:'older-analysis',photoPath:'older-original.png'});expect(r.body.run.sourceSnapshot.currentAnalysis.analysisId).toBe(f.analysis.analysisId);
  });
  it('requires explicit review before handoff and preserves CONCEPT_ONLY without fabricated geometry',async()=>{
    const {run,concept}=await generated();expect((await request(app).post(handoffUrl(run,concept)).send({expectedVersion:1})).status).toBe(409);
    const approved=await request(app).post(reviewUrl(run,concept)).send({expectedVersion:0,review:review(concept)});expect(approved.status).toBe(200);expect(approved.body.concept.reviewVersion).toBe(1);
    const hand=await request(app).post(handoffUrl(run,concept)).send({expectedVersion:1});expect(hand.status,JSON.stringify(hand.body)).toBe(200);expect(hand.body.result.reviewGate).toBe('APPROVED_FOR_DRAFTING');expect(hand.body.result.handoff.drafting.status).toBe('CONCEPT_ONLY');expect(hand.body.result.handoff.drafting.cuttingPieces).toEqual([]);expect(hand.body.manufacturingVerified).toBe(false);
    const saved=await Run.findById(run._id).lean();expect(saved.concepts[0].reviews).toHaveLength(1);expect(saved.concepts[0].handoffs).toHaveLength(1);
  });
  it('archives review versions and blocks drafting after REVISE or REJECTED',async()=>{
    const {run,concept}=await generated();
    for(const [i,value]of ['APPROVED_FOR_DRAFTING','REVISE','REJECTED'].entries()){const r=await request(app).post(reviewUrl(run,concept)).send({expectedVersion:i,review:review(concept,value)});expect(r.status).toBe(200);}
    const saved=await Run.findById(run._id).lean();expect(saved.concepts[0].reviews.map(r=>r.version)).toEqual([1,2,3]);expect(saved.concepts[0].reviews.map(r=>r.review.decision)).toEqual(['APPROVED_FOR_DRAFTING','REVISE','REJECTED']);
    expect((await request(app).post(handoffUrl(run,concept)).send({expectedVersion:3})).status).toBe(409);expect(saved.rawText).toBe(run.rawText);
  });
  it('rejects stale review hashes and versions without creating history',async()=>{
    const {run,concept}=await generated(),bad=review(concept);bad.proposalSha256='0'.repeat(64);
    expect((await request(app).post(reviewUrl(run,concept)).send({expectedVersion:0,review:bad})).status).toBe(400);
    expect((await request(app).post(reviewUrl(run,concept)).send({expectedVersion:9,review:review(concept)})).status).toBe(409);expect((await Run.findById(run._id)).concepts[0].reviews).toEqual([]);
  });
  it('blocks stale photo/geometry sources while preserving generation snapshots',async()=>{
    const {f,run,concept}=await generated();await Fabric.updateOne({_id:f._id},{$set:{'analysis.analysisId':randomUUID()}});
    const r=await request(app).post(reviewUrl(run,concept)).send({expectedVersion:0,review:review(concept)});expect(r.status).toBe(409);expect(r.body.error).toBe('FABRIC_SOURCE_CHANGED');expect((await Run.findById(run._id)).sourceSnapshot.hash).toBe(run.sourceSnapshot.hash);
  });
  it('rechecks fabric provenance again before an approved handoff',async()=>{
    const {f,run,concept}=await generated();await request(app).post(reviewUrl(run,concept)).send({expectedVersion:0,review:review(concept)});
    await Fabric.updateOne({_id:f._id},{$set:{'analysis.photoPath':'replacement-test-only.png'}});expect((await request(app).post(handoffUrl(run,concept)).send({expectedVersion:1})).status).toBe(409);expect((await Run.findById(run._id)).concepts[0].handoffs).toEqual([]);
  });
  it('resolves simultaneous review updates deterministically with one history entry',async()=>{
    const {run,concept}=await generated(),body={expectedVersion:0,review:review(concept)};
    const r=await Promise.all([request(app).post(reviewUrl(run,concept)).send(body),request(app).post(reviewUrl(run,concept)).send(body)]);expect(r.map(x=>x.status).sort()).toEqual([200,409]);const saved=await Run.findById(run._id);expect(saved.concepts[0].reviews).toHaveLength(1);expect(saved.concepts[0].reviewVersion).toBe(1);
  });
  it('rejects client-set server fields, fabricated fabric overrides and malformed IDs',async()=>{
    const {f,run,concept}=await generated();expect((await request(app).post('/api/fabrics/'+f.id+'/concepts').send({state:'APPROVED'})).status).toBe(400);
    expect((await request(app).post(reviewUrl(run,concept)).send({expectedVersion:0,review:review(concept),status:'CONFIRMED'})).status).toBe(400);
    expect((await request(app).post(handoffUrl(run,concept)).send({expectedVersion:1,context:{fabric:{confirmed:true}}})).status).toBe(400);
    expect((await request(app).get('/api/concept-runs/invalid')).status).toBe(400);expect((await request(app).get('/api/concept-runs/'+new mongoose.Types.ObjectId())).status).toBe(404);
  });
  it('does not permit live calls without both server-side and explicit Free confirmation',async()=>{
    const f=await fabric();const r=await request(app).post('/api/fabrics/'+f.id+'/concepts').send({mode:'LIVE',campaignId:'not-dispatched',freeTierConfirmed:true});expect(r.status).toBe(403);expect(globalThis.fetch).not.toHaveBeenCalled();expect(await Run.countDocuments({fabricId:f._id})).toBe(0);
  });
  it('persists malformed/incomplete raw outputs and refuses their approval without repair',async()=>{
    const f=await fabric();app.locals.conceptMockProvider={mode:'MOCK',model:'invalid-offline',generate:async()=>({text:'{"concepts":[{},{}]}',usage:null})};
    try{const r=await request(app).post('/api/fabrics/'+f.id+'/concepts').send({});expect(r.status).toBe(201);expect(r.body.run.state).toBe('INVALID_OUTPUT');expect(r.body.run.rawText).toBe('{"concepts":[{},{}]}');const concept=r.body.run.concepts[0],body={decision:'APPROVED_FOR_DRAFTING',reviewer:'test',rationale:'invalid attempt',proposalSha256:concept.assessment.provenance.proposalSha256,sourceHashes:Object.fromEntries(concept.assessment.provenance.sources.map(s=>[s.id,s.sha256]))};expect((await request(app).post(reviewUrl(r.body.run,concept)).send({expectedVersion:0,review:body})).status).toBe(400);}finally{delete app.locals.conceptMockProvider;}
  });
  it('records a mock transport failure once without leaking exception text',async()=>{
    const f=await fabric(),generate=vi.fn(async()=>{throw Error('secret remote detail');});app.locals.conceptMockProvider={mode:'MOCK',generate};
    try{const r=await request(app).post('/api/fabrics/'+f.id+'/concepts').send({});expect(r.status).toBe(502);expect(r.body.run.state).toBe('FAILED');expect(JSON.stringify(r.body)).not.toContain('secret remote detail');expect(generate).toHaveBeenCalledTimes(1);expect(await Run.countDocuments({fabricId:f._id})).toBe(1);}finally{delete app.locals.conceptMockProvider;}
  });
  it('leaves FabricPiece and inventory fields unchanged through generation, review and handoff',async()=>{
    const {f,run,concept}=await generated(),before=JSON.stringify(await Fabric.findById(f._id).lean());
    await request(app).post(reviewUrl(run,concept)).send({expectedVersion:0,review:review(concept)});await request(app).post(handoffUrl(run,concept)).send({expectedVersion:1});expect(JSON.stringify(await Fabric.findById(f._id).lean())).toBe(before);
  });
  it('does not dispatch a provider call when initial persistence fails',async()=>{
    const f=await fabric(),generate=vi.fn();app.locals.conceptMockProvider={mode:'MOCK',generate};const spy=vi.spyOn(Run,'create').mockRejectedValueOnce(Error('private database failure'));
    try{const r=await request(app).post('/api/fabrics/'+f.id+'/concepts').send({});expect(r.status).toBe(500);expect(r.body.error).toBe('Internal server error');expect(generate).not.toHaveBeenCalled();}finally{spy.mockRestore();delete app.locals.conceptMockProvider;}
  });
  it('preserves received raw text and failure state after a final save fails, without inference retry',async()=>{
    const f=await fabric();let saveSpy;const generate=vi.fn(async()=>{saveSpy=vi.spyOn(Run.prototype,'save').mockRejectedValueOnce(Error('private save failure'));return {text:'{"concepts":[{},{}]}',usage:null};});app.locals.conceptMockProvider={mode:'MOCK',generate};
    try{const r=await request(app).post('/api/fabrics/'+f.id+'/concepts').send({});expect(r.status).toBe(502);expect(r.body.run.state).toBe('FAILED');expect(r.body.run.rawText).toBe('{"concepts":[{},{}]}');expect(generate).toHaveBeenCalledTimes(1);expect(await Run.countDocuments({fabricId:f._id})).toBe(1);}finally{saveSpy?.mockRestore();delete app.locals.conceptMockProvider;}
  });
  it('fails safely for absent geometry and rejects duplicate batch IDs before review',async()=>{
    const f=await Fabric.create({name:'No geometry test'});expect((await request(app).post('/api/fabrics/'+f.id+'/concepts').send({})).status).toBe(422);expect(await Run.countDocuments({fabricId:f._id})).toBe(0);
    const p=require('../../experiments/staged-concept/examples').concepts().petal;const batch=assessBatch(JSON.stringify({concepts:[p,p]}),require('../../experiments/staged-concept/workflow').sourceRecords());expect(batch.errors[0].code).toBe('DUPLICATE_CONCEPT');expect(batch.concepts.every(c=>!c.assessment.schemaValid)).toBe(true);
  });
});
