const fs=require('fs'),path=require('path');
const {randomUUID}=require('crypto');
const mongoose=require('mongoose');
const {z}=require('zod');
const Fabric=require('../models/FabricPiece');
const ConceptRun=require('../models/ConceptRun');
const {validateWithHoles}=require('../geometry/polygon');
const {fingerprint}=require('../../experiments/ai-pattern-proposals/adapter');
const {assess,messages:conceptMessages}=require('../../experiments/staged-concept/workflow');
const {cloudflareProvider,COMPARISON_MODEL}=require('../../experiments/design-language/ai-spike/provider');
const {openBudget,validateCampaignId}=require('../../experiments/design-language/ai-spike/campaign');
const {redact}=require('../../experiments/design-language/ai-spike/harness');
const ROOT=path.resolve(__dirname,'../../experiments/design-language/ai-spike/results');
const fail=(status,code)=>Object.assign(Error(code),{status,code});
function sourceFor(f){
  const g=f.geometry,analysis=f.analysis;
  const polygon=g?.polygonCm||analysis?.suggestedPolygonCm;
  const holes=g?.polygonCm?(g.holes||[]):[];
  if(!polygon||!validateWithHoles(polygon,holes).valid)throw fail(422,'FABRIC_GEOMETRY_UNAVAILABLE');
  const snapshot=JSON.parse(JSON.stringify({fabricId:String(f._id),name:f.name,status:f.status,availabilityStatus:f.availabilityStatus||'AVAILABLE',
    geometry:g??null,currentAnalysis:analysis??null,polygonCm:polygon,holes,
    selectedBasis:g?.polygonCm?'STORED_GEOMETRY':'CURRENT_ANALYSIS_SUGGESTION',
    selectedPhoto:g?.polygonCm?(g.basis?{analysisId:g.basis.analysisId,photoPath:g.basis.photoPath}:null):{analysisId:analysis?.analysisId,photoPath:analysis?.photoPath},
    grainDirectionDeg:f.grainDirectionDeg??null}));
  const hash=fingerprint(snapshot);
  // Cloud prompt sees geometry/reference IDs and an evidence hash, never local photo paths.
  const sources=[{id:'fabric-'+f._id,path:'/api/fabrics/'+f._id,data:{polygonCm:polygon,holes,geometryBasis:snapshot.selectedBasis,
    geometryVersion:g?.version??null,analysisId:snapshot.selectedPhoto?.analysisId??null,declaredLabel:f.name,evidenceSha256:hash,physicalAccuracy:'UNVERIFIED'}}];
  return {snapshot:{...snapshot,hash},sources};
}
function batchMessages(sources){
  const m=conceptMessages(sources);
  m[0].content=m[0].content.replace('Return one JSON object, no Markdown: ','Return exactly one JSON object {"concepts":[Concept,Concept,...]} with 2 or 3 distinct realistic small-accessory ideas. Each Concept uses this contract: ')
    .replace('Propose ONE specific original useful small fabric-appropriate product','For each Concept propose a specific original useful small fabric-appropriate product')
    .replace('burgundy appearance label','any supplied appearance label (a user declaration, not image verification)');
  const data=JSON.parse(m[1].content);data.brief='Propose 2–3 distinct realistic small fabric-accessory concepts from this one supplied scrap. No fixed templates, measurements, stock, material-property guesses or feasibility claims. Each concept is an alternative use of the scrap, not a combined cutting layout.';
  m[1].content=JSON.stringify(data);return m;
}
function assessBatch(text,sources){
  let raw;try{raw=JSON.parse(text);}catch{return {errors:[{code:'INVALID_JSON'}],concepts:[]};}
  const shape=z.object({concepts:z.array(z.unknown()).min(2).max(3)}).strict().safeParse(raw);
  if(!shape.success)return {errors:shape.error.issues,concepts:[]};
  const concepts=raw.concepts.map(proposal=>{const rawText=JSON.stringify(proposal);return {id:randomUUID(),rawText,assessment:assess(rawText,{sources}),reviewVersion:0,reviews:[],handoffs:[]};});
  const ids=concepts.map(c=>c.assessment.proposal?.id),names=concepts.map(c=>c.assessment.proposal?.productIdea?.name);
  const duplicate=ids.some((id,i)=>id&&ids.indexOf(id)!==i)||names.some((n,i)=>n&&names.indexOf(n)!==i);
  const errors=duplicate?[{code:'DUPLICATE_CONCEPT'}]:[];
  if(duplicate)for(const c of concepts){c.assessment.schemaValid=false;c.assessment.status='REJECTED';c.assessment.errors.push({code:'DUPLICATE_CONCEPT'});}
  return {errors,concepts};
}
function writeNew(file,value,secrets=[],raw=false){
  const fd=fs.openSync(file,'wx');try{fs.writeFileSync(fd,raw?JSON.parse(redact(value,secrets)):redact(value,secrets));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
}
function mockProvider(sources){return {mode:'MOCK',model:'offline-fixtures',generate:async()=>{const {petal,leaf}=require('../../experiments/staged-concept/examples').concepts();for(const p of [petal,leaf])p.sourceReferences=[sources[0].id];return {text:JSON.stringify({concepts:[petal,leaf]}),usage:null,httpStatus:null};}};}
async function generate(fabricId,options,override,runtime){
  const root=runtime?require('./localAI').validateRuntime(runtime).root:ROOT;
  const f=await Fabric.findById(fabricId).lean();if(!f)throw fail(404,'FABRIC_NOT_FOUND');
  const source=sourceFor(f),mode=options.mode,campaignId=mode==='LIVE'?options.campaignId:'mock-'+randomUUID();
  let provider,dir,budget,secrets=[];
  if(mode==='LIVE'){
    if(!runtime&&(process.env.BORSAL_CONCEPT_LIVE!=='1'||process.env.BORSAL_WORKERS_FREE_CONFIRMED!=='1'||!options.freeTierConfirmed))throw fail(403,'LIVE_GENERATION_DISABLED');
    try{validateCampaignId(campaignId);}catch{throw fail(400,'INVALID_CAMPAIGN_ID');}dir=path.join(root,'campaigns',campaignId);fs.mkdirSync(path.dirname(dir),{recursive:true});
    if(fs.existsSync(dir))throw fail(409,'CAMPAIGN_ALREADY_EXISTS');
    budget=openBudget(root);
    provider=runtime?require('./localAI').textProvider(runtime):cloudflareProvider({accountId:process.env.CF_ACCOUNT_ID,apiToken:process.env.CF_API_TOKEN,freeTierConfirmed:true,model:COMPARISON_MODEL,timeoutMs:120000});
    secrets=[process.env.CF_API_TOKEN,process.env.CF_ACCOUNT_ID,process.env.MONGODB_URI];
  }else{provider=override||mockProvider(source.sources);if(provider.mode!=='MOCK')throw fail(403,'LIVE_GENERATION_DISABLED');}
  const prompt=batchMessages(source.sources),bytes=Buffer.byteLength(JSON.stringify(prompt));
  if(bytes+512+6144>24000)throw fail(422,'PROMPT_TOO_LARGE');
  const run=await ConceptRun.create({fabricId,campaignId,mode,sourceSnapshot:source.snapshot,sources:source.sources});
  let ownsDirectory=false;
  try{
    if(mode==='LIVE'){
      fs.mkdirSync(dir);ownsDirectory=true;writeNew(path.join(dir,'lock.json'),{campaignId,maxRequests:1,maxRepairs:0,model:provider.model,runId:String(run._id)},secrets);
      writeNew(path.join(dir,'request.json'),{messages:prompt,promptBytes:bytes,generationParameters:provider.generationParameters,sourceSnapshotHash:source.snapshot.hash,conservativeMaxNeurons:1898.35392},secrets);
      const slot=budget.reserve(campaignId,1);writeNew(path.join(dir,'attempt-1.json'),{state:'RESERVED_BEFORE_INFERENCE',globalSlot:slot,requestsDispatched:1},secrets);
    }
    const response=await provider.generate(prompt); // exactly one call, never repaired/retried
    if(mode==='LIVE'){writeNew(path.join(dir,'response.json'),response,secrets);writeNew(path.join(dir,'raw-response.txt'),response.text,secrets,true);}
    const result=assessBatch(response.text,source.sources);
    run.rawText=response.text;run.response={...response,text:undefined,execution:runtime?.testing?'TEST_FIXTURE':'LIVE',model:provider.model,mode,globalUsed:budget?.used()??null};run.validationErrors=result.errors;run.concepts=result.concepts;
    run.state=result.errors.length||result.concepts.some(c=>!c.assessment.schemaValid)?'INVALID_OUTPUT':'RECEIVED';
    if(mode==='LIVE')writeNew(path.join(dir,'result.json'),{runId:String(run._id),state:run.state,...result,globalUsed:budget.used(),manufacturingVerified:false},secrets);
    await run.save();return run;
  }catch(error){
    const failure={code:error.code&&typeof error.code==='string'?error.code:'GENERATION_OR_PERSISTENCE_FAILED',httpStatus:Number.isInteger(error.status)?error.status:null,...(error.diagnostics?{diagnostics:error.diagnostics}:{}),globalUsed:budget?.used()??null};
    if(mode==='LIVE'&&ownsDirectory)writeNew(path.join(dir,'failure.json'),failure,secrets);
    run.state='FAILED';run.failure=failure;await run.save();if(error.code==='EEXIST'&&!ownsDirectory)throw fail(409,'CAMPAIGN_ALREADY_EXISTS');return run;
  }
}
async function ensureCurrent(run){const f=await Fabric.findById(run.fabricId).lean();if(!f)throw fail(409,'FABRIC_SOURCE_CHANGED');let source;try{source=sourceFor(f);}catch{throw fail(409,'FABRIC_SOURCE_CHANGED');}if(source.snapshot.hash!==run.sourceSnapshot.hash)throw fail(409,'FABRIC_SOURCE_CHANGED');return f;}
const hash=z.string().regex(/^[a-f0-9]{64}$/);
const refreshSchema=z.object({expectedRunVersion:z.number().int().min(0),fromSourceHash:hash,toSourceHash:hash,reviewer:z.string().trim().min(1),rationale:z.string().trim().min(1)}).strict();
async function sourceComparison(run){
  const f=await Fabric.findById(run.fabricId).lean();if(!f)throw fail(409,'FABRIC_SOURCE_CHANGED');const current=sourceFor(f);
  return {runId:String(run._id),runVersion:run.__v,fromSourceHash:run.sourceSnapshot.hash,toSourceHash:current.snapshot.hash,
    previous:run.sourceSnapshot,current:current.snapshot,refreshRequired:run.sourceSnapshot.hash!==current.snapshot.hash};
}
async function refreshSource(runId,body){
  const input=refreshSchema.parse(body);let created;
  // A refresh is a new source-bound run, NEVER an edit to immutable source evidence
  // or inherited approval. Parent linkage and the new run commit atomically.
  await mongoose.connection.transaction(async session=>{
    const parent=await ConceptRun.findById(runId).session(session);if(!parent)throw fail(404,'CONCEPT_RUN_NOT_FOUND');
    if(parent.__v!==input.expectedRunVersion||parent.sourceSnapshot.hash!==input.fromSourceHash)throw fail(409,'SOURCE_REFRESH_VERSION_CONFLICT');
    const fabric=await Fabric.findById(parent.fabricId).session(session).lean();if(!fabric)throw fail(409,'FABRIC_SOURCE_CHANGED');
    const current=sourceFor(fabric);
    if(current.snapshot.hash!==input.toSourceHash)throw fail(409,'FABRIC_SOURCE_CHANGED');
    if(current.snapshot.hash===parent.sourceSnapshot.hash)throw fail(409,'SOURCE_UNCHANGED');
    if(parent.sourceRefreshes?.some(e=>e.toSourceHash===input.toSourceHash))throw fail(409,'SOURCE_REFRESH_ALREADY_EXISTS');
    const concepts=parent.concepts.map(c=>({id:c.id,rawText:c.rawText,assessment:assess(c.rawText,{sources:current.sources}),reviewVersion:0,reviews:[],handoffs:[],technicalVersion:0,
      refreshedFrom:{runId:String(parent._id),reviewVersion:c.reviewVersion,technicalVersion:c.technicalVersion||0}}));
    const sourceRefresh={parentRunId:String(parent._id),parentRunVersion:parent.__v,fromSourceHash:input.fromSourceHash,toSourceHash:input.toSourceHash,
      reviewer:input.reviewer,rationale:input.rationale,reviewerIdentity:'DECLARED_NOT_AUTHENTICATED',reviewRequired:true,inferenceRequests:0};
    [created]=await ConceptRun.create([{fabricId:parent.fabricId,campaignId:'source-refresh-'+randomUUID(),mode:parent.mode,
      sourceSnapshot:current.snapshot,sources:current.sources,rawText:parent.rawText,sourceRefresh,
      response:{operation:'EXPLICIT_SOURCE_REFRESH',inferenceRequests:0,originalGenerationRunId:String(parent._id)},
      concepts,state:concepts.some(c=>!c.assessment.schemaValid)?'INVALID_OUTPUT':'RECEIVED'}],{session});
    parent.sourceRefreshes=[...(parent.sourceRefreshes||[]),{runId:String(created._id),...sourceRefresh,createdAt:new Date()}];
    parent.markModified('sourceRefreshes');await parent.save({session});
  });
  return created;
}
module.exports={generate,sourceFor,batchMessages,assessBatch,ensureCurrent,fail,writeNew,refreshSource,sourceComparison};
