// TEST_FIXTURE evidence only. Reuse the prior exact-evidence clone and local API.
const fs=require('fs'),path=require('path'),mongoose=require('mongoose'),{createHash}=require('crypto');
const draft=require('./keychain-draft.json');
const {nest}=require('../pattern-feasibility/nesting'),{geometrySvg}=require('../live-pattern-generation/evaluate');
function fixtureProposal(){
  const proposal=structuredClone(draft.proposal),bom=proposal.design.data.technical.bom;
  proposal.fabricMaterialDeclaration={basis:'SYNTHETIC_FIXTURE',material:structuredClone(bom[0].material)};
  proposal.context.stockBindings={thread:'test-thread','key-ring':'test-ring'};
  proposal.context.stock={complete:true,items:bom.filter(b=>b.source.kind==='STOCK').map(b=>({id:proposal.context.stockBindings[b.id],material:structuredClone(b.material),quantity:structuredClone(b.quantity),availability:'AVAILABLE'}))};
  return proposal;
}
function preliminary(polygonCm){return nest({schemaVersion:'borsal.nesting/0.1',unit:'cm',fabric:{polygonCm},
  pieces:draft.proposal.context.instances.map(i=>({id:i.id,polygonCm:i.cuttingPolygonCm,outlineBasis:'CUTTING',seamAllowanceStatus:'INCLUDED',allowedRotationsDeg:i.allowedRotationsDeg})),search:draft.proposal.context.search});}
async function main(args){
  if(args.length!==1)throw Error('Use keychain-feasibility-demo.js <new-output-directory>');
  const dir=path.resolve(args[0]);fs.mkdirSync(dir);const save=(n,v)=>fs.writeFileSync(path.join(dir,n),typeof v==='string'?v:JSON.stringify(v,null,2),{flag:'wx'});
  const initial=await require('./keychain-authored-demo').main([path.join(dir,'initial')]);
  const uri=new URL(process.env.MONGODB_URI);uri.pathname='/'+initial.databaseName;
  await mongoose.connect(uri.toString());const Fabric=require('../../src/models/FabricPiece'),Run=require('../../src/models/ConceptRun'),Proposal=require('../../src/models/TechnicalProposal');
  const parent=await Run.findById(initial.runId).lean(),fabric=await Fabric.findById(parent.fabricId).lean(),oldProposals=await Proposal.find({runId:parent._id}).sort({version:1}).lean();
  const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),oldProposalHash=hash(oldProposals),oldReviews=hash(parent.concepts.map(c=>c.reviews));
  const screening=preliminary(fabric.analysis.suggestedPolygonCm);save('preliminary-geometry.json',{label:'PRELIMINARY GEOMETRY ONLY',sourceHash:parent.sourceSnapshot.hash,result:screening,fullReadinessUpgraded:false,manufacturingVerified:false});
  if(screening.status==='LAYOUT_FOUND')save('preliminary-nesting.svg',geometrySvg(screening.validatorEvidence).replace('Geometry screening ONLY','PRELIMINARY GEOMETRY ONLY'));
  const proposal=fixtureProposal();save('test-fixture-evidence.json',{label:'TEST_FIXTURE',geometryConfirmation:'Synthetic clone only, not physical validation',grainDirectionDeg:90,material:proposal.fabricMaterialDeclaration,stock:proposal.context.stock,stockBindings:proposal.context.stockBindings,realInventory:false});
  // Explicit direct test-fixture writer coordinates the FabricPiece revision.
  const changed=await Fabric.updateOne({_id:fabric._id,__v:fabric.__v},{$set:{grainDirectionDeg:90},$inc:{__v:1}});if(changed.modifiedCount!==1)throw Error('Fixture revision conflict');
  const app=require('../../src/app'),server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));}),base='http://127.0.0.1:'+server.address().port,calls=[];
  async function call(method,url,body){const res=await fetch(base+url,{method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const response=await res.json();calls.push({method,path:url,request:body??null,httpStatus:res.status,response});save('api-'+calls.length+'.json',calls.at(-1));return {http:res.status,...response};}
  try{
    const confirmed=await call('POST','/api/fabrics/'+fabric._id+'/confirm-geometry',{polygonCm:fabric.analysis.suggestedPolygonCm,source:'suggested',basedOnAnalysisId:fabric.analysis.analysisId,expectedGeometryVersion:fabric.geometry?.version||0});if(confirmed.http!==200)throw Error('TEST_FIXTURE confirmation failed');
    const stale=await call('POST','/api/concept-runs/'+parent._id+'/concepts/'+initial.conceptId+'/technical-proposals',{expectedReviewVersion:1,expectedTechnicalVersion:2,origin:'AUTHORED',sourceLabel:'TEST_FIXTURE stale request must fail',proposal});if(stale.http!==409)throw Error('Source guard not enforced');
    const comparison=await call('GET','/api/concept-runs/'+parent._id+'/source-comparison');
    const refreshed=await call('POST','/api/concept-runs/'+parent._id+'/refresh-source',{expectedRunVersion:comparison.runVersion,fromSourceHash:comparison.fromSourceHash,toSourceHash:comparison.toSourceHash,reviewer:'TEST_FIXTURE_REVIEWER',rationale:'Explicit synthetic-clone confirmation/grain source change; re-review required, no real approval'});if(refreshed.http!==201)throw Error('Explicit refresh failed');
    const run=refreshed.run,c=run.concepts.find(c=>c.id===initial.conceptId),root='/api/concept-runs/'+run._id+'/concepts/'+c.id;
    const body={expectedReviewVersion:1,expectedTechnicalVersion:0,origin:'AUTHORED',sourceLabel:'TEST_FIXTURE: confirmed synthetic clone, grain90, synthetic material/stock only; '+path.basename(__filename),proposal};
    const blocked=await call('POST',root+'/technical-proposals',body);if(blocked.http!==409)throw Error('New review gate not enforced');
    const previousReview=parent.concepts.find(item=>item.id===initial.conceptId).reviews.at(-1).review;
    const review={...previousReview,reviewer:'TEST_FIXTURE_REVIEWER',rationale:'Explicit re-review on new synthetic source hash, drafting only; physical/material/inventory evidence is not real',proposalSha256:c.assessment.provenance.proposalSha256,sourceHashes:Object.fromEntries(c.assessment.provenance.sources.map(s=>[s.id,s.sha256]))};
    const reviewed=await call('POST',root+'/review',{expectedVersion:0,review});if(reviewed.http!==200)throw Error('Re-review failed');
    const result=await call('POST',root+'/technical-proposals',body);if(result.http!==201||!result.proposal.feasibility)throw Error('Pipeline not reached');const p=result.proposal;save('technical-proposal.json',p);save('feasibility-report.json',p.feasibility);
    const svgResponses={};for(const [route,file]of [['preview.svg','pattern.svg'],['nesting.svg','nested.svg']]){const res=await fetch(base+'/api/technical-proposals/'+p._id+'/'+route);svgResponses[route]=res.status;if(res.status===200)save(file,await res.text());}
    const shortage=structuredClone(body);shortage.expectedTechnicalVersion=1;shortage.proposal.context.stock.items.find(s=>s.id==='test-ring').quantity.value=0;const insufficient=await call('POST',root+'/technical-proposals',shortage);save('insufficient-stock.json',insufficient);
    const preserved=hash(await Proposal.find({runId:parent._id}).sort({version:1}).lean())===oldProposalHash&&hash((await Run.findById(parent._id).lean()).concepts.map(c=>c.reviews))===oldReviews;
    const report=await call('GET','/api/technical-proposals/'+p._id),pipeline=p.feasibility;
    const summary={label:'TEST_FIXTURE',databaseName:initial.databaseName,parentRunId:String(parent._id),runId:run._id,conceptId:c.id,proposalId:p._id,sourceRefreshHttp:refreshed.http,staleSourceHttp:stale.http,unreviewedHttp:blocked.http,reviewHttp:reviewed.http,technicalHttp:result.http,svgResponses,
      preliminary:screening.status,nesting:pipeline.evidence.nesting.status,geometry:pipeline.layers.geometry.status,utilization:pipeline.utilization,layers:pipeline.layers,status:p.status,verdict:p.verdict,stockChecks:pipeline.evidence.precheck.stockChecks,shortageVerdict:insufficient.proposal?.verdict,sourceStale:report.sourceStale,preserved,originalUnchanged:initial.originalUnchanged,inferenceRequests:0,manufacturingVerified:false};
    save('transcript.json',calls);save('summary.json',summary);if(!preserved)throw Error('Historical evidence changed');console.log(JSON.stringify(summary));return summary;
  }finally{await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();}
}
if(require.main===module)main(process.argv.slice(2)).catch(async()=>{console.error('TEST_FIXTURE demo stopped; inspect saved API evidence. No Cloudflare inference.');await mongoose.disconnect();process.exitCode=1;});
module.exports={main,fixtureProposal,preliminary};
