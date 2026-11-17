// Complete local API transcript. New isolated DB only; no inference or real approvals.
const fs=require('fs'),path=require('path'),mongoose=require('mongoose'),{randomUUID}=require('crypto');
const fixture=require('./technical-fixture');
async function main(args){
  if(args.length!==1)throw Error('Use technical-demo.js <new-output-directory>');
  require('dotenv').config({quiet:true});const dir=path.resolve(args[0]);fs.mkdirSync(dir);
  const databaseName='borsal-mvp-demo-'+randomUUID()+'-test',uri=new URL(process.env.MONGODB_URI);uri.pathname='/'+databaseName;
  process.env.BORSAL_MVP_DESIGN_FLOW='1';delete process.env.BORSAL_CONCEPT_LIVE;process.env.BORSAL_UPLOADS_DIR=path.join(dir,'uploads');
  const app=require('../../src/app');await mongoose.connect(uri.toString());await Promise.all([require('../../src/models/ConceptRun').init(),require('../../src/models/TechnicalProposal').init()]);
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));}),base='http://127.0.0.1:'+server.address().port,transcript=[];
  const save=(name,value)=>fs.writeFileSync(path.join(dir,name),typeof value==='string'?value:JSON.stringify(value,null,2),{flag:'wx'});
  async function call(method,url,body){const response=await fetch(base+url,{method,...(body!==undefined?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const result=await response.json();transcript.push({method,path:url,request:body??null,httpStatus:response.status,response:result});return {http:response.status,...result};}
  try{
    const form=new FormData();form.append('name','Phase 6B synthetic authored pocket, physically UNVERIFIED');form.append('matPreset','large');form.append('grainDirectionDeg','0');form.append('photo',new Blob([fs.readFileSync(path.resolve(__dirname,'../../data/test-mat40.png'))],{type:'image/png'}),'test-mat40.png');
    const upload=await fetch(base+'/api/fabrics/from-photo',{method:'POST',body:form}),registered=await upload.json();if(upload.status!==201)throw Error('Registration failed');save('registration.json',registered);
    const fabricId=registered.fabric._id;const confirmation=await call('POST','/api/fabrics/'+fabricId+'/confirm-geometry',{polygonCm:registered.suggestedPolygonCm,source:'suggested',basedOnAnalysisId:registered.fabric.analysis.analysisId,expectedGeometryVersion:0});if(confirmation.http!==200)throw Error('Synthetic geometry confirmation failed');
    app.locals.conceptMockProvider={mode:'MOCK',model:'authored-technical-fixture',generate:async()=>({text:JSON.stringify({concepts:fixture.concepts('fabric-'+fabricId)}),usage:null})};
    const generated=await call('POST','/api/fabrics/'+fabricId+'/concepts',{mode:'MOCK'}),run=generated.run,c=run.concepts[0];delete app.locals.conceptMockProvider;
    const root='/api/concept-runs/'+run._id+'/concepts/'+c.id,proposalRoot=root+'/technical-proposals';
    const input={expectedReviewVersion:1,expectedTechnicalVersion:0,origin:'AUTHORED',sourceLabel:'Explicit synthetic authored pocket, not AI output',proposal:fixture.proposal(run.sources[0].id)};
    const blocked=await call('POST',proposalRoot,input);if(blocked.http!==409)throw Error('Approval gate failed');
    const review={decision:'APPROVED_FOR_DRAFTING',reviewer:'SYNTHETIC_DEMO_ONLY',rationale:'Explicit approval of a synthetic authored test concept only, not a saved live concept or manufacturing approval',proposalSha256:c.assessment.provenance.proposalSha256,sourceHashes:Object.fromEntries(c.assessment.provenance.sources.map(s=>[s.id,s.sha256])),draftingBrief:require('../technical-drafting/examples').examples().complete.sourceConcept.data};
    await call('POST',root+'/review',{expectedVersion:0,review});save('authored-request.json',input);
    const complete=await call('POST',proposalRoot,input);if(complete.http!==201||complete.proposal.feasibility?.layers.geometry.status!=='PASS')throw Error('Complete technical flow failed');
    const svgResponse=await fetch(base+'/api/technical-proposals/'+complete.proposal._id+'/preview.svg');if(svgResponse.status!==200)throw Error('Preview unavailable');save('preview.svg',await svgResponse.text());save('complete-proposal.json',complete.proposal);
    const missing={...input,expectedTechnicalVersion:1,proposal:{}};const incomplete=await call('POST',proposalRoot,missing);
    const bad={expectedReviewVersion:1,expectedTechnicalVersion:2,origin:'MODEL_OUTPUT',sourceLabel:'Malformed offline import test, not a new model response',rawProposalText:'{"design":'};const invalid=await call('POST',proposalRoot,bad);
    const listed=await call('GET',proposalRoot),persisted=await call('GET','/api/technical-proposals/'+complete.proposal._id);
    const f=await require('../../src/models/FabricPiece').findById(fabricId).lean();
    const summary={databaseName,fabricId,runId:run._id,conceptId:c.id,proposalId:complete.proposal._id,registrationHttp:upload.status,confirmationHttp:confirmation.http,approvalGateHttp:blocked.http,technicalHttp:complete.http,previewHttp:svgResponse.status,
      completeStatus:complete.proposal.status,verdict:complete.proposal.verdict,geometry:complete.proposal.feasibility.layers.geometry.status,nesting:complete.proposal.feasibility.evidence.nesting.status,
      incompleteStatus:incomplete.proposal.status,invalidStatus:invalid.proposal.status,persistedVersions:listed.proposals.map(p=>p.version),reportSourceStale:persisted.sourceStale,
      availabilityStatus:f.availabilityStatus,originalPhotoExists:fs.existsSync(f.analysis.photoPath),liveRequests:0,manufacturingVerified:false};
    save('transcript.json',transcript);save('summary.json',summary);console.log(JSON.stringify(summary));return summary;
  }finally{await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();}
}
if(require.main===module)main(process.argv.slice(2)).catch(()=>{console.error('Isolated technical API demo stopped; inspect artifacts. No inference was made.');process.exitCode=1;});
module.exports={main};
