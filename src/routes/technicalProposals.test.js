import {describe,it,expect,beforeAll,afterAll,vi} from 'vitest';
const mongoose=require('mongoose'),request=require('supertest'),fs=require('fs'),path=require('path'),os=require('os'),{randomUUID,createHash}=require('crypto');
require('dotenv').config({quiet:true});
const token=randomUUID(),dbName='borsal-technical-'+token+'-test',uri=new URL(process.env.MONGODB_URI);uri.pathname='/'+dbName;
const uploads=path.join(os.tmpdir(),'borsal-technical-'+token);process.env.BORSAL_UPLOADS_DIR=uploads;process.env.BORSAL_MVP_DESIGN_FLOW='1';delete process.env.BORSAL_CONCEPT_LIVE;
const app=require('../app'),Run=require('../models/ConceptRun'),Proposal=require('../models/TechnicalProposal'),Fabric=require('../models/FabricPiece');
const fixture=require('../../experiments/mvp-design-flow/technical-fixture');
const authored=require('../../experiments/technical-drafting/examples').examples().complete;
beforeAll(async()=>{await mongoose.connect(uri.toString());await Promise.all([Run.init(),Proposal.init()]);vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('Zero external requests'));});
afterAll(async()=>{vi.restoreAllMocks();if(mongoose.connection.name===dbName&&dbName.endsWith('-test'))await mongoose.connection.dropDatabase();await mongoose.disconnect();delete process.env.BORSAL_MVP_DESIGN_FLOW;delete process.env.BORSAL_UPLOADS_DIR;delete app.locals.conceptMockProvider;
  if(path.dirname(uploads)!==os.tmpdir()||path.basename(uploads)!=='borsal-technical-'+token)throw Error('Unsafe cleanup');fs.rmSync(uploads,{recursive:true,force:true});});
async function approved(doApprove=true){
  const reg=await request(app).post('/api/fabrics/from-photo').field('name','Synthetic authored pocket test only').field('matPreset','large').field('grainDirectionDeg','0').attach('photo',path.resolve('data/test-mat40.png'));
  expect(reg.status,JSON.stringify(reg.body)).toBe(201);const f=reg.body.fabric;
  const confirmation=await request(app).post('/api/fabrics/'+f._id+'/confirm-geometry').send({polygonCm:reg.body.suggestedPolygonCm,source:'suggested',basedOnAnalysisId:f.analysis.analysisId,expectedGeometryVersion:0});expect(confirmation.status,JSON.stringify(confirmation.body)).toBe(200);
  app.locals.conceptMockProvider={mode:'MOCK',model:'authored-fixture',generate:async()=>({text:JSON.stringify({concepts:fixture.concepts('fabric-'+f._id)}),usage:null})};
  let generated;try{generated=await request(app).post('/api/fabrics/'+f._id+'/concepts').send({});}finally{delete app.locals.conceptMockProvider;}
  expect(generated.status).toBe(201);const run=generated.body.run,c=run.concepts[0],review={decision:'APPROVED_FOR_DRAFTING',reviewer:'SYNTHETIC_API_TEST_ONLY',rationale:'Explicit test review; no real/live concept approval',proposalSha256:c.assessment.provenance.proposalSha256,sourceHashes:Object.fromEntries(c.assessment.provenance.sources.map(s=>[s.id,s.sha256])),draftingBrief:authored.sourceConcept.data};
  if(doApprove)expect((await request(app).post('/api/concept-runs/'+run._id+'/concepts/'+c.id+'/review').send({expectedVersion:0,review})).status).toBe(200);
  return {run,c,f:f._id,review,url:'/api/concept-runs/'+run._id+'/concepts/'+c.id+'/technical-proposals'};
}
function body(r,version=0){return {expectedReviewVersion:1,expectedTechnicalVersion:version,origin:'AUTHORED',sourceLabel:'Explicit authored synthetic pocket',proposal:fixture.proposal(r.run.sources[0].id)};}
describe('Complete local technical proposal API: zero Cloudflare',()=>{
  it('persists approved authored geometry, validation/nesting evidence and an SVG retrievable through the API',async()=>{
    const r=await approved(),before=JSON.stringify(await Fabric.findById(r.f).lean()),response=await request(app).post(r.url).send(body(r));expect(response.status,JSON.stringify(response.body)).toBe(201);
    const p=response.body.proposal;expect(p.version).toBe(1);expect(p.status).toBe('CHECKED');expect(p.verdict).toBe('UNVERIFIED');expect(p.manufacturingVerified).toBe(false);expect(p.feasibility.layers.geometry.status).toBe('PASS');expect(p.feasibility.evidence.nesting.status).toBe('LAYOUT_FOUND');expect(p.feasibility.placements).toHaveLength(2);
    expect(p.feasibility.utilization.utilizedAreaCm2).toBeCloseTo(48,8);expect(p.provenance.fabricId).toBe(r.f);expect(p.provenance.fabricScrapId).toBe('fabric-'+r.f);expect(p.provenance.sourceSnapshot.selectedPhoto.analysisId).toBe(r.run.sourceSnapshot.selectedPhoto.analysisId);
    const svg=await request(app).get('/api/technical-proposals/'+p._id+'/preview.svg'),svgText=svg.text??svg.body.toString('utf8');expect(svg.status).toBe(200);expect(svg.headers['content-type']).toContain('image/svg+xml');expect(svg.headers['content-security-policy']).toContain("default-src 'none'");expect(svgText).toContain('borsal-proposal-provenance');expect(svgText).toContain(r.run.sourceSnapshot.hash);expect(createHash('sha256').update(svgText).digest('hex')).toBe(p.svgSha256);
    expect((await require('sharp')(Buffer.from(svgText)).metadata()).format).toBe('svg');
    const retrieved=await request(app).get('/api/technical-proposals/'+p._id);expect(retrieved.body.sourceStale).toBe(false);expect(retrieved.body.proposal.feasibility).toEqual(p.feasibility);
    expect(JSON.stringify(await Fabric.findById(r.f).lean())).toBe(before);expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it('retains immutable versions and raw imported model text without inference or repair',async()=>{
    const r=await approved(),first=await request(app).post(r.url).send(body(r)),raw=JSON.stringify(fixture.proposal(r.run.sources[0].id),null,2)+'\n';
    const second=await request(app).post(r.url).send({expectedReviewVersion:1,expectedTechnicalVersion:1,origin:'MODEL_OUTPUT',sourceLabel:'Imported offline proposal, not a live model request',rawProposalText:raw});expect(second.status).toBe(201);expect(second.body.proposal.version).toBe(2);expect(second.body.proposal.originalInput.rawProposalText).toBe(raw);expect(second.body.proposal.provenance.rawProposalSha256).toBe(createHash('sha256').update(raw).digest('hex'));expect(second.body.proposal.previewSvg).toContain('IMPORTED MODEL-PROPOSED DRAFT');
    const list=await request(app).get(r.url);expect(list.body.proposals.map(p=>p.version)).toEqual([1,2]);expect(list.body.proposals[0]).toEqual((await request(app).get('/api/technical-proposals/'+first.body.proposal._id)).body.proposal);
    const run=await Run.findById(r.run._id).lean();expect(run.concepts[0].technicalHistory).toHaveLength(2);expect(run.concepts[0].reviews).toHaveLength(1);expect(run.rawText).toBe(r.run.rawText);
  });
  it('keeps missing technical input and unknown source material CONCEPT_ONLY without filling them',async()=>{
    const r=await approved(),empty=body(r);delete empty.proposal;const first=await request(app).post(r.url).send(empty);expect(first.status).toBe(201);expect(first.body.proposal.status).toBe('CONCEPT_ONLY');expect(first.body.proposal.feasibility).toBe(null);expect(first.body.proposal.previewSvg).toBe(null);
    const b=body(r,1);delete b.proposal.fabricMaterialDeclaration;const second=await request(app).post(r.url).send(b);expect(second.body.proposal.status).toBe('CONCEPT_ONLY');expect(second.body.proposal.verdict).toBe('UNVERIFIED');expect(second.body.proposal.originalInput.proposal.fabricMaterialDeclaration).toBeUndefined();expect(second.body.proposal.previewSvg).toContain('<svg');
  });
  it('persists malformed JSON and invalid cut polygons as rejected versions without an SVG',async()=>{
    const r=await approved(),a=await request(app).post(r.url).send({expectedReviewVersion:1,expectedTechnicalVersion:0,origin:'MODEL_OUTPUT',sourceLabel:'Malformed import',rawProposalText:'{"design":'});expect(a.status).toBe(201);expect(a.body.proposal.status).toBe('REJECTED');expect(a.body.proposal.assessment.errors[0].code).toBe('INVALID_JSON');
    const b=body(r,1);b.proposal.context.instances[0].cuttingPolygonCm=[[0,0],[6,4],[0,4],[6,0]];const second=await request(app).post(r.url).send(b);expect(second.body.proposal.status).toBe('REJECTED');expect(second.body.proposal.previewSvg).toBe(null);expect((await request(app).get('/api/technical-proposals/'+second.body.proposal._id+'/preview.svg')).status).toBe(404);
  });
  it('enforces approval and revision versions before drafting',async()=>{
    const r=await approved(false),b=body(r);expect((await request(app).post(r.url).send(b)).status).toBe(409);expect(await Proposal.countDocuments({runId:r.run._id})).toBe(0);
    await request(app).post('/api/concept-runs/'+r.run._id+'/concepts/'+r.c.id+'/review').send({expectedVersion:0,review:r.review});const revised={...r.review,decision:'REVISE'};
    await request(app).post('/api/concept-runs/'+r.run._id+'/concepts/'+r.c.id+'/review').send({expectedVersion:1,review:revised});b.expectedReviewVersion=2;expect((await request(app).post(r.url).send(b)).body.error).toBe('CONCEPT_APPROVAL_REQUIRED');
  });
  it('rejects source changes and stale proposal versions without partial persistence',async()=>{
    const r=await approved(),b=body(r);b.expectedTechnicalVersion=9;expect((await request(app).post(r.url).send(b)).body.error).toBe('TECHNICAL_VERSION_CONFLICT');
    await Fabric.updateOne({_id:r.f},{$set:{'analysis.analysisId':randomUUID()}});expect((await request(app).post(r.url).send(body(r))).body.error).toBe('FABRIC_SOURCE_CHANGED');expect(await Proposal.countDocuments({runId:r.run._id})).toBe(0);
  });
  it('resolves simultaneous versions with 201/409 and exactly one history entry',async()=>{
    const r=await approved(),b=body(r),responses=await Promise.all([request(app).post(r.url).send(b),request(app).post(r.url).send(b)]);expect(responses.map(r=>r.status).sort()).toEqual([201,409]);expect(await Proposal.countDocuments({runId:r.run._id})).toBe(1);expect((await Run.findById(r.run._id)).concepts[0].technicalHistory).toHaveLength(1);
  });
  it('rolls back proposal/version history when persistence fails',async()=>{
    const r=await approved(),spy=vi.spyOn(Proposal,'create').mockRejectedValueOnce(Error('private persistence failure'));
    try{const response=await request(app).post(r.url).send(body(r));expect(response.status).toBe(500);expect(response.body.error).toBe('Internal server error');expect(await Proposal.countDocuments({runId:r.run._id})).toBe(0);expect((await Run.findById(r.run._id)).concepts[0].technicalVersion).toBeUndefined();}finally{spy.mockRestore();}
  });
  it('protects source geometry and server metadata, but retains imported technical errors',async()=>{
    const r=await approved(),outer=body(r);outer.status='PASS';expect((await request(app).post(r.url).send(outer)).status).toBe(400);
    const b=body(r);b.proposal.context.fabric={confirmed:true};const invalid=await request(app).post(r.url).send(b);expect(invalid.status).toBe(201);expect(invalid.body.proposal.status).toBe('REJECTED');expect(invalid.body.proposal.assessment.errors[0].code).toBe('INVALID_TECHNICAL_ENVELOPE');
    const c=body(r,1);c.proposal.design.data.technical.assembly[0].threadBomId='missing';expect((await request(app).post(r.url).send(c)).body.proposal.status).toBe('REJECTED');
  });
  it('reports declared stock shortage as feasibility FAIL and flags later source staleness',async()=>{
    const r=await approved(),b=body(r);b.proposal.context.stock.items[0].quantity.value=1;const response=await request(app).post(r.url).send(b);expect(response.body.proposal.status).toBe('CHECKED');expect(response.body.proposal.verdict).toBe('FAIL');expect(response.body.proposal.feasibility.layers.materials.status).toBe('FAIL');
    await Fabric.updateOne({_id:r.f},{$set:{'analysis.photoPath':'changed-test-only.png'}});expect((await request(app).get('/api/technical-proposals/'+response.body.proposal._id)).body.sourceStale).toBe(true);
  });
  it('keeps technical endpoints disabled unless local MVP mode is explicitly enabled',async()=>{
    delete process.env.BORSAL_MVP_DESIGN_FLOW;try{expect((await request(app).get('/api/technical-proposals/'+new mongoose.Types.ObjectId())).status).toBe(404);}finally{process.env.BORSAL_MVP_DESIGN_FLOW='1';}
  });
});
