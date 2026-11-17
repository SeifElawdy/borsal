// Local React/Vite adapter only. Existing API handlers remain the write authorities.
const express=require('express'),mongoose=require('mongoose'),fs=require('fs'),path=require('path'),{randomBytes,timingSafeEqual}=require('crypto');
const Fabric=require('./models/FabricPiece'),Run=require('./models/ConceptRun'),Proposal=require('./models/TechnicalProposal');
const {AccessoryStock,InventoryItem,DesignReview}=require('./models/ApprovalInventory');
const DATA=path.resolve(__dirname,'../data');
const {dimensions,validateWithHoles}=require('./geometry/polygon');
function createLocalMvp({origins=['http://127.0.0.1:5173','http://localhost:5173'],operatorToken,referenceDatabase,preferredRunId,preferredProposalId,workspaceKind='DEMO',simulatedProviders,generationRoot,demoDatabase}={}){
  const studio=workspaceKind==='USER'?require('./routes/creationStudio').createStudioRouter({operatorToken,simulatedProviders,generationRoot}):null;
  const app=express(),session=randomBytes(32).toString('hex'),hosts=origins.map(o=>new URL(o).host);
  const validCookie=req=>{const value=/(?:^|;\s*)borsal_local=([a-f0-9]+)(?:;|$)/.exec(req.headers.cookie||'')?.[1];return value&&value.length===session.length&&timingSafeEqual(Buffer.from(value),Buffer.from(session));};
  app.use((req,res,next)=>{
    res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});
    if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||!hosts.includes(req.headers.host))return res.status(403).json({error:'LOCAL_HOST_REQUIRED'});
    if(!(workspaceKind==='USER'?/^borsal-local-user-[a-f0-9-]{36}$/.test(mongoose.connection.name||'')||/^borsal-[a-z0-9-]+-test$/.test(mongoose.connection.name||''):/^borsal-[a-z0-9-]+-test$/.test(mongoose.connection.name||'')))return res.status(503).json({error:'ISOLATED_TEST_DATABASE_REQUIRED'});
    if(!['GET','HEAD','OPTIONS'].includes(req.method)&&(!origins.includes(req.get('origin'))||!validCookie(req)))return res.status(403).json({error:'LOCAL_SESSION_AND_ORIGIN_REQUIRED'});
    next();
  });
  app.use(express.json({limit:'100kb'}));
  const wrap=fn=>async(req,res)=>{try{await fn(req,res);}catch{return res.status(500).json({error:'LOCAL_WORKSPACE_UNAVAILABLE'});}};
  const archive=()=>referenceDatabase&&/^borsal-mvp-demo-[a-f0-9-]{36}-test$/.test(referenceDatabase)?mongoose.connection.client.db(referenceDatabase):null;
  app.get('/ui/bootstrap',wrap(async(req,res)=>{
    if(!validCookie(req))res.cookie('borsal_local',session,{httpOnly:true,sameSite:'strict',path:'/',maxAge:8*60*60*1000});
    const projects=studio?await require('./models/CreationProject').Project.find().sort({updatedAt:-1}).lean():[];
    const sourceFilter=studio?{_id:{$in:projects.map(p=>p.fabricId).filter(Boolean)}}:{};const linkedFilter=studio?{fabricId:{$in:projects.map(p=>p.fabricId).filter(Boolean)}}:{};
    const [fabrics,runs,proposals,stock,inventory,reviews]=await Promise.all([Fabric.find(sourceFilter).lean(),Run.find(linkedFilter).sort({createdAt:-1}).lean(),Proposal.find(linkedFilter).sort({createdAt:-1}).lean(),AccessoryStock.find().lean(),InventoryItem.find().lean(),DesignReview.find().lean()]);
    if(studio)for(const p of projects){const r=runs.find(r=>String(r._id)===p.selection?.runId),c=r?.concepts.find(c=>c.id===p.selection?.conceptId),q=p.selection?.proposalId?proposals.find(q=>String(q._id)===p.selection.proposalId):null;if(c)try{p.currentDesign=require('./services/designIdentity').resolve(p,r,c,q);}catch{p.currentDesign=null;}}
    for(const f of fabrics){if(studio){try{f.uiSourceHash=require('./services/conceptFlow').sourceFor(f).snapshot.hash;}catch{f.uiSourceHash=null;}}const polygon=f.geometry?.polygonCm||f.analysis?.suggestedPolygonCm,holes=f.geometry?.polygonCm?f.geometry.holes||[]:[];if(polygon){const v=validateWithHoles(polygon,holes);if(v.valid)f.measurements={...dimensions(polygon),areaCm2:v.netAreaCm2,basis:'COMPUTED_CM_GEOMETRY_PHYSICAL_ACCURACY_UNVERIFIED'};}}
    const db=studio?null:archive();const referenceInventory=db?await db.collection(InventoryItem.collection.name).find().toArray():[],referenceStock=db?await db.collection(AccessoryStock.collection.name).find().toArray():[];
    const budget=require('../experiments/design-language/ai-spike/campaign').openBudget(generationRoot||path.resolve(__dirname,'../experiments/design-language/ai-spike/results'));
    if(studio){const capabilities=await studio.capabilities();return res.json({mode:simulatedProviders?'USER / TEST_FIXTURE PROVIDERS':'USER',workspaceKind,projects,fabrics,runs,proposals,stock,inventory,reviews,operations:(await require('./models/CreationProject').Operation.find().sort({createdAt:-1}).lean()).map(studio.publicOperation),archive:{readOnly:true,inventory:[],stock:[]},capabilities:{...capabilities,operator:!!operatorToken},budget:capabilities.budget,demoAvailable:!!demoDatabase,manufacturingVerified:false});}
    res.json({mode:'DEMO / TEST_FIXTURE',databaseName:mongoose.connection.name,preferredRunId,preferredProposalId,fabrics,runs,proposals,stock,inventory,reviews,
      archive:{readOnly:true,databaseName:referenceDatabase||null,inventory:referenceInventory,stock:referenceStock},
      capabilities:{operator:!!operatorToken,conceptGeneration:false,conceptReason:'TEXT_INFERENCE_NOT_AUTHORIZED',imagePreview:false,imageReason:process.env.BORSAL_WORKERS_FREE_CONFIRMED==='1'?'LIVE_PREVIEW_NOT_CONFIGURED':'FREE_TIER_NOT_VERIFIED',imageModel:'@cf/black-forest-labs/flux-2-klein-4b'},budget:{used:budget.used(),limit:budget.limit},manufacturingVerified:false});
  }));
  if(studio)app.use(studio.router);
  app.get('/ui/authored-draft',wrap(async(req,res)=>res.json(JSON.parse(fs.readFileSync(path.resolve(__dirname,'../experiments/mvp-design-flow/keychain-draft.json'),'utf8')))));
  // Explicit offline testing only: same concept service, never a live provider or budget slot.
  app.post('/ui/test-fixture/fabrics/:id/concepts',wrap(async(req,res)=>{
    if(workspaceKind==='USER'||process.env.BORSAL_INVENTORY_TEST_FIXTURES!=='1')return res.status(403).json({error:'TEST_FIXTURE_DISABLED'});
    if(!mongoose.isObjectIdOrHexString(req.params.id)||Object.keys(req.body||{}).length)return res.status(400).json({error:'INVALID_INPUT'});
    const fabric=await Fabric.findById(req.params.id).lean();if(!fabric?.geometry?.confirmed)return res.status(409).json({error:'CONFIRMED_FABRIC_REQUIRED'});
    const run=await require('./services/conceptFlow').generate(req.params.id,{mode:'MOCK'});
    res.status(run.state==='FAILED'?502:201).json({run,label:'TEST_FIXTURE / OFFLINE MOCK',manufacturingVerified:false});
  }));
  app.get('/ui/test-fixture/fabrics/:id/authored-draft',wrap(async(req,res)=>{
    if(process.env.BORSAL_INVENTORY_TEST_FIXTURES!=='1')return res.status(403).json({error:'TEST_FIXTURE_DISABLED'});
    if(!mongoose.isObjectIdOrHexString(req.params.id))return res.status(400).json({error:'INVALID_INPUT'});
    const fabric=await Fabric.findById(req.params.id).lean();if(!fabric?.geometry?.confirmed)return res.status(409).json({error:'CONFIRMED_FABRIC_REQUIRED'});
    // A user-requested fixture binding, not a geometric correction or a stock mutation.
    const proposal=require('../experiments/mvp-design-flow/keychain-feasibility-demo').fixtureProposal();
    proposal.design.data.limitations.push({id:'creative-coverage-test-only',featureId:'strip-body',status:'PARTIAL',reason:'This unchanged key-fob reference exercises the pipeline only; it is not a technical implementation of arbitrary selected concept features.',missingInformation:['Independent human review of every selected concept feature and unresolved requirement; a valid layout alone cannot establish creative fidelity']});
    proposal.design.data.technical.scrapSources[0].id='fabric-'+fabric._id;
    for(const item of proposal.design.data.technical.bom)if(item.source.kind==='SCRAP')item.source.scrapId='fabric-'+fabric._id;
    res.json({proposal,label:'EXPLICIT_TEST_FIXTURE',assumptions:['Unchanged authored 14 × 4 cm key-fob geometry; not AI-generated or tailored to the selected concept','Only the scrap references were explicitly bound to the selected confirmed fabric','Synthetic material and stock snapshot only; no inventory written','Physical construction and creative-intent coverage remain UNVERIFIED'],manufacturingVerified:false});
  }));
  app.get('/ui/fabrics/:id/photo',wrap(async(req,res)=>{
    if(!mongoose.isObjectIdOrHexString(req.params.id))return res.status(400).end();const f=await Fabric.findById(req.params.id).lean();
    const file=f?.geometry?.basis?.photoPath||f?.analysis?.photoPath;if(!file||!fs.existsSync(file))return res.status(404).json({error:'PHOTO_NOT_AVAILABLE'});
    const resolved=fs.realpathSync(file),root=fs.realpathSync(DATA);if(!resolved.toLowerCase().startsWith((root+path.sep).toLowerCase()))return res.status(403).end();res.sendFile(resolved);
  }));
  app.get('/ui/archive/:id/:kind.svg',wrap(async(req,res)=>{
    const db=archive();if(!db||!mongoose.isObjectIdOrHexString(req.params.id)||!['pattern','nesting'].includes(req.params.kind))return res.status(404).end();
    const p=await db.collection(Proposal.collection.name).findOne({_id:new mongoose.Types.ObjectId(req.params.id)}),svg=p?.[req.params.kind==='pattern'?'previewSvg':'nestingSvg'];
    if(!svg)return res.status(404).end();res.set('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'").type('image/svg+xml').send(svg);
  }));
  // Demo and unconfigured legacy paths remain blocked; USER requests were handled by the guarded studio router.
  app.post(/^\/api\/(fabrics\/[^/]+\/concepts|concept-runs\/.+\/technical-proposals\/generate)\/?$/i,(_req,res)=>res.status(403).json({error:'LIVE_GENERATION_DISABLED_FOR_THIS_PHASE'}));
  app.use('/ui/operator',(req,res,next)=>{
    if(!operatorToken||req.method!=='POST'||!/^\/(accessory-stock|technical-proposals\/[a-f0-9]{24}\/(design-review|approve-production|verification-evidence))$/.test(req.path))return res.status(403).json({error:'LOCAL_OPERATOR_ACTION_NOT_ALLOWED'});
    // The capability exists only in server memory; it is never sent to React/storage.
    req.headers.authorization='Bearer '+operatorToken;next();
  },require('./routes/approvalInventory'));
  app.use(require('./app'));
  return app;
}
module.exports={createLocalMvp};
