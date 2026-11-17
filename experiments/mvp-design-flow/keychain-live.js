// Explicitly authorized Phase 6C only. Reopens the saved isolated demo; never inventory.
const fs=require('fs'),path=require('path'),mongoose=require('mongoose');
const CONCEPT='a96f954a-3083-491b-9976-93d3bdbb7111',CAMPAIGN='phase6c-burgundy-keychain-001';
function draftingBrief(){return {schemaVersion:'borsal.manual-concept/0.1',id:'approved-burgundy-keychain-brief',authorship:'HUMAN',
  brief:{id:'approved-keychain-mvp',text:'Small fabric keychain / key fob: a simple small burgundy fabric keychain made from the approved scrap.',requirements:[
    'Product type: small fabric keychain / key fob',
    'Intended form: a simple small burgundy fabric keychain made from the approved scrap',
    'Accessory: one metal key ring',
    'Keep the construction simple and realistic for a first MVP',
    'Favor a technically simple shape appropriate for a small fabric accessory',
    'The AI may propose technical geometry, seams and BOM, but must not invent source measurements or claim manufacturing proof',
    'If required information is still missing, preserve that uncertainty instead of fabricating it']},
  creative:{shapeIntent:'Technically simple small fabric keychain; no supplied cutting geometry',visualIntent:['Burgundy fabric appearance; one metal key ring'],modelDescription:'Reviewer-authored drafting brief supplied explicitly by the user; not AI technical output'}};}
async function main(args){
  if(args.length!==3||args[0]!=='--live'||args[1]!=='--free-tier-confirmed')throw Error('Use keychain-live.js --live --free-tier-confirmed <new-output-directory>');
  require('dotenv').config({quiet:true});
  const saved=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../data/mvp-design-flow-6a-live-001/summary.json')));
  if(!/^borsal-mvp-demo-[a-f0-9-]{36}-test$/.test(saved.databaseName))throw Error('Unsafe database');
  const uri=new URL(process.env.MONGODB_URI);uri.pathname='/'+saved.databaseName;
  const root=path.resolve(__dirname,'../design-language/ai-spike/results'),budget=require('../design-language/ai-spike/campaign').openBudget(root);
  if(budget.used()!==11||fs.existsSync(path.join(root,'campaigns',CAMPAIGN)))throw Error('Budget/campaign precondition failed');
  const dir=path.resolve(args[2]);fs.mkdirSync(dir);const save=(name,value)=>fs.writeFileSync(path.join(dir,name),typeof value==='string'?value:JSON.stringify(value,null,2),{flag:'wx'});
  process.env.BORSAL_MVP_DESIGN_FLOW='1';process.env.BORSAL_TECHNICAL_LIVE='1';process.env.BORSAL_WORKERS_FREE_CONFIRMED='1';delete process.env.BORSAL_CONCEPT_LIVE;
  await mongoose.connect(uri.toString());const app=require('../../src/app');await require('../../src/models/TechnicalProposal').init();
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));}),base='http://127.0.0.1:'+server.address().port,transcript=[];
  async function call(method,url,body){const res=await fetch(base+url,{method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(150000)});const response=await res.json();const entry={method,path:url,request:body??null,httpStatus:res.status,response};transcript.push(entry);save('api-'+transcript.length+'.json',entry);return {http:res.status,...response};}
  try{
    const before=await call('GET','/api/concept-runs/'+saved.runId),run=before.run,c=run?.concepts.find(c=>c.id===CONCEPT);
    if(!c||c.assessment.proposal.id!=='burgundy-keychain'||c.reviewVersion!==0||(c.technicalVersion||0)!==0)throw Error('Saved concept precondition failed');
    await require('../../src/services/conceptFlow').ensureCurrent(run);
    const fabricBefore=await require('../../src/models/FabricPiece').findById(saved.fabricId).lean();save('fabric-before.json',fabricBefore);
    const review={decision:'APPROVED_FOR_DRAFTING',reviewer:'USER_EXPLICIT_PHASE6C',rationale:'User selected Burgundy Keychain for technical drafting only. No manufacturing approval.',proposalSha256:c.assessment.provenance.proposalSha256,
      sourceHashes:Object.fromEntries(c.assessment.provenance.sources.map(s=>[s.id,s.sha256])),draftingBrief:draftingBrief()};
    const prefix='/api/concept-runs/'+saved.runId+'/concepts/'+CONCEPT;
    const approved=await call('POST',prefix+'/review',{expectedVersion:0,review});if(approved.http!==200)throw Error('Review failed; no inference');
    const generated=await call('POST',prefix+'/technical-proposals/generate',{mode:'LIVE',campaignId:CAMPAIGN,freeTierConfirmed:true,expectedReviewVersion:1,expectedTechnicalVersion:0});
    const proposal=generated.proposal;let previewHttp=null,svgPath=null;
    if(proposal){save('technical-proposal.json',proposal);await call('GET','/api/technical-proposals/'+proposal._id);
      if(proposal.previewSvg){const res=await fetch(base+'/api/technical-proposals/'+proposal._id+'/preview.svg');previewHttp=res.status;if(res.status===200){save('preview.svg',await res.text());svgPath=path.join(dir,'preview.svg');}}}
    const fabricAfter=await require('../../src/models/FabricPiece').findById(saved.fabricId).lean();
    const summary={databaseName:saved.databaseName,campaignId:CAMPAIGN,runId:saved.runId,conceptId:CONCEPT,reviewHttp:approved.http,reviewDecision:review.decision,apiHttp:generated.http,providerHttp:generated.generation?.httpStatus??generated.failure?.httpStatus??null,
      model:generated.generation?.model??generated.failure?.model??null,usage:generated.generation?.usage??null,finishReason:generated.generation?.finishReason??null,truncated:generated.generation?.truncated??null,
      proposalId:proposal?._id??null,status:proposal?.status??'PROVIDER_FAILED',verdict:proposal?.verdict??null,feasibility:proposal?.feasibility??null,previewHttp,svgPath,
      fabricUnchanged:JSON.stringify(fabricBefore)===JSON.stringify(fabricAfter),globalUsed:budget.used(),manufacturingVerified:false};
    save('summary.json',summary);console.log(JSON.stringify(summary));return summary;
  }finally{await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();}
}
if(require.main===module)main(process.argv.slice(2)).catch(()=>{console.error('Keychain workflow stopped; inspect append-only evidence. No retry, repair or fallback.');process.exitCode=1;});
module.exports={main,draftingBrief};
