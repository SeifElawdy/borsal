// Local E2E demo. Always selects a new test-suffixed DB; never connects to inventory.
const fs=require('fs'),path=require('path'),mongoose=require('mongoose');
const {randomUUID}=require('crypto');
async function main(args){
  if(args.length!==2||!['--mock','--live'].includes(args[0]))throw Error('Use demo.js --mock|--live <new-output-directory>');
  require('dotenv').config({quiet:true});
  const live=args[0]==='--live',dir=path.resolve(args[1]);fs.mkdirSync(dir);
  const databaseName='borsal-mvp-demo-'+randomUUID()+'-test',uri=new URL(process.env.MONGODB_URI);uri.pathname='/'+databaseName;
  if(!databaseName.endsWith('-test'))throw Error('Unsafe demo DB');
  process.env.BORSAL_MVP_DESIGN_FLOW='1';process.env.BORSAL_UPLOADS_DIR=path.join(dir,'uploads');
  if(live){process.env.BORSAL_CONCEPT_LIVE='1';process.env.BORSAL_WORKERS_FREE_CONFIRMED='1';}
  const app=require('../../src/app');await mongoose.connect(uri.toString());await require('../../src/models/ConceptRun').init();
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  const base='http://127.0.0.1:'+server.address().port;
  try{
    const form=new FormData();form.append('name','Synthetic burgundy calibration sample — physical accuracy UNVERIFIED');form.append('matPreset','large');
    form.append('photo',new Blob([fs.readFileSync(path.resolve(__dirname,'../../data/test-mat40.png'))],{type:'image/png'}),'test-mat40.png');
    const registration=await fetch(base+'/api/fabrics/from-photo',{method:'POST',body:form}),fabricResult=await registration.json();
    if(registration.status!==201)throw Error('Photo registration failed: '+registration.status);
    const campaignId=live?'phase6a-burgundy-concepts-001':undefined;
    const generation=await fetch(base+'/api/fabrics/'+fabricResult.fabric._id+'/concepts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:live?'LIVE':'MOCK',...(live?{campaignId,freeTierConfirmed:true}:{})}),signal:AbortSignal.timeout(150000)});
    const result=await generation.json();
    fs.writeFileSync(path.join(dir,'registration.json'),JSON.stringify(fabricResult,null,2),{flag:'wx'});
    fs.writeFileSync(path.join(dir,'concept-run.json'),JSON.stringify(result,null,2),{flag:'wx'});
    const listed=await (await fetch(base+'/api/fabrics/'+fabricResult.fabric._id+'/concepts')).json();
    const summary={databaseName,fabricId:fabricResult.fabric._id,runId:result.run?._id,registrationHttp:registration.status,generationHttp:generation.status,
      state:result.run?.state,model:result.run?.response?.model,usage:result.run?.response?.usage??null,globalUsed:result.run?.response?.globalUsed??result.run?.failure?.globalUsed??null,
      originalPhotoPath:fabricResult.fabric.analysis?.photoPath,analysisId:fabricResult.fabric.analysis?.analysisId,
      concepts:result.run?.concepts?.map(c=>({id:c.id,name:c.assessment.proposal?.productIdea?.name,intendedUse:c.assessment.proposal?.intendedUse,schemaValid:c.assessment.schemaValid,reviewGate:c.assessment.reviewGate})),listedRuns:listed.runs?.length,manufacturingVerified:false};
    fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(summary,null,2),{flag:'wx'});console.log(JSON.stringify(summary));return summary;
  }finally{await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();}
}
if(require.main===module)main(process.argv.slice(2)).catch(()=>{console.error('Local demo stopped; inspect saved artifacts. No inference retry.');process.exitCode=1;});
module.exports={main};
