// Clone the saved isolated evidence, then submit one authored version via HTTP.
// No source confirmation, review rewriting, inventory mutation or inference.
const fs=require('fs'),path=require('path'),mongoose=require('mongoose'),{randomUUID,createHash}=require('crypto');
const sha=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
async function main(args){
  if(args.length!==1)throw Error('Use keychain-authored-demo.js <new-output-directory>');
  require('dotenv').config({quiet:true});
  mongoose.set('autoIndex',false); // Reading the origin must not create indexes there.
  const saved=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../data/mvp-keychain-phase6c-001/summary.json'))),originName=saved.databaseName;
  if(!/^borsal-mvp-demo-[a-f0-9-]{36}-test$/.test(originName))throw Error('Unsafe source database');
  const uriFor=name=>{const u=new URL(process.env.MONGODB_URI);u.pathname='/'+name;return u.toString();};
  const Run=require('../../src/models/ConceptRun'),Fabric=require('../../src/models/FabricPiece'),Proposal=require('../../src/models/TechnicalProposal');
  let server;
  try{
    await mongoose.connect(uriFor(originName));
    const originalRun=await Run.findById(saved.runId).lean();if(!originalRun)throw Error('Saved run unavailable');
    const originalFabric=await Fabric.findById(originalRun.fabricId).lean(),originalProposals=await Proposal.find({runId:saved.runId}).sort({version:1}).lean();
    const selected=originalRun.concepts.find(c=>c.id===saved.conceptId);
    if(selected?.reviews.at(-1)?.review.decision!=='APPROVED_FOR_DRAFTING'||selected.reviewVersion!==1||selected.technicalVersion!==1||originalFabric.status!=='DRAFT')throw Error('Saved review/source precondition failed');
    await require('../../src/services/conceptFlow').ensureCurrent(originalRun);
    const originalHashes={fabric:sha(originalFabric),run:sha(originalRun),proposals:sha(originalProposals)};
    await mongoose.disconnect();
    const directory=path.resolve(args[0]);fs.mkdirSync(directory);const save=(name,value)=>fs.writeFileSync(path.join(directory,name),typeof value==='string'?value:JSON.stringify(value,null,2),{flag:'wx'});
    const databaseName='borsal-mvp-demo-'+randomUUID()+'-test';await mongoose.connect(uriFor(databaseName));
    if(await Fabric.countDocuments()||await Run.countDocuments()||await Proposal.countDocuments())throw Error('Target is not empty');
    // Retain IDs, timestamps, review hashes, DRAFT status and rejection exactly.
    await Fabric.collection.insertOne(originalFabric);await Run.collection.insertOne(originalRun);if(originalProposals.length)await Proposal.collection.insertMany(originalProposals);
    await Promise.all([Run.createIndexes(),Proposal.createIndexes()]);
    process.env.BORSAL_MVP_DESIGN_FLOW='1';delete process.env.BORSAL_CONCEPT_LIVE;delete process.env.BORSAL_TECHNICAL_LIVE;delete process.env.BORSAL_WORKERS_FREE_CONFIRMED;
    const app=require('../../src/app');server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});const base='http://127.0.0.1:'+server.address().port;
    const calls=[];async function call(method,url,body){const res=await fetch(base+url,{method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const response=await res.json();calls.push({method,path:url,request:body??null,httpStatus:res.status,response});return {http:res.status,...response};}
    const file=path.join(__dirname,'keychain-draft.json'),bytes=fs.readFileSync(file,'utf8'),draft=JSON.parse(bytes);
    const input={expectedReviewVersion:1,expectedTechnicalVersion:1,origin:'AUTHORED',sourceLabel:'experiments/mvp-design-flow/keychain-draft.json sha256:'+sha(bytes),proposal:draft.proposal};save('authored-draft.json',bytes);save('request.json',input);
    const created=await call('POST','/api/concept-runs/'+saved.runId+'/concepts/'+saved.conceptId+'/technical-proposals',input);
    if(created.http!==201)throw Error('Authored submission failed; inspect source/version gates');const p=created.proposal;save('technical-proposal.json',p);
    const report=await call('GET','/api/technical-proposals/'+p._id);let svgHttp=null;
    if(p.previewSvg){const res=await fetch(base+'/api/technical-proposals/'+p._id+'/preview.svg');svgHttp=res.status;if(res.status===200)save('preview.svg',await res.text());}
    const drafting=p.assessment.handoff?.drafting;
    save('feasibility-report.json',{status:p.verdict,pipelineExecuted:!!p.feasibility,pipeline:p.feasibility,
      nesting:p.feasibility?.evidence?.nesting??null,blockers:drafting?.unresolved??p.assessment.errors,bridge:drafting?.bridge??null,
      geometryScope:'Only explicit local outlines checked if full pipeline is blocked; no fabric fit established',manufacturingVerified:false});
    const cloneRun=await Run.findById(saved.runId).lean(),cloneFabric=await Fabric.findById(originalFabric._id).lean(),oldVersions=await Proposal.find({_id:{$in:originalProposals.map(p=>p._id)}}).sort({version:1}).lean();
    const preserved=sha(cloneFabric)===originalHashes.fabric&&sha(oldVersions)===originalHashes.proposals&&sha(cloneRun.concepts.find(c=>c.id===saved.conceptId).reviews)===sha(selected.reviews);
    save('transcript.json',calls);save('clone-provenance.json',{originDatabase:originName,databaseName,originalHashes,idsPreserved:true,sourceHash:originalRun.sourceSnapshot.hash});
    await new Promise(resolve=>server.close(resolve));server=null;await mongoose.disconnect();
    await mongoose.connect(uriFor(originName));const originalUnchanged=sha(await Fabric.findById(originalFabric._id).lean())===originalHashes.fabric&&sha(await Run.findById(saved.runId).lean())===originalHashes.run&&sha(await Proposal.find({runId:saved.runId}).sort({version:1}).lean())===originalHashes.proposals;
    const budget=require('../design-language/ai-spike/campaign').openBudget(path.resolve(__dirname,'../design-language/ai-spike/results'));
    const summary={databaseName,originDatabase:originName,conceptId:saved.conceptId,runId:saved.runId,proposalId:p._id,version:p.version,http:created.http,readHttp:report.http,sourceStale:report.sourceStale,status:p.status,verdict:p.verdict,
      svgHttp,svgPath:p.previewSvg?path.join(directory,'preview.svg'):null,cuttingPieces:drafting?.cuttingPieces?.map(c=>({id:c.id,dimensions:c.dimensions,areaCm2:c.areaCm2})),
      pipelineExecuted:!!p.feasibility,nestingStatus:p.feasibility?.evidence?.nesting?.status??'NOT_RUN',blockers:drafting?.unresolved,preserved,originalUnchanged,budgetLimit:budget.limit,budgetUsed:budget.used(),inferenceRequests:0,manufacturingVerified:false};
    save('summary.json',summary);if(!preserved||!originalUnchanged)throw Error('Evidence preservation check failed');console.log(JSON.stringify(summary));return summary;
  }finally{if(server)await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();}
}
if(require.main===module)main(process.argv.slice(2)).catch(()=>{console.error('Authored demo stopped safely; no inference or source confirmation performed.');process.exitCode=1;});
module.exports={main};
