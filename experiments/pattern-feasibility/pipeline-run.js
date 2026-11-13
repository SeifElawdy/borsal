const fs=require('fs');
const {runPipeline}=require('./pipeline');
function main(args){
  if(args.length!==1)throw Error('Use pipeline-run.js <request.json> or --demo');
  if(args[0]==='--demo'){
    const {sourceProvenance,requests}=require('./pipeline-examples').pipelineExamples();
    return {sourceProvenance,results:Object.fromEntries(Object.entries(requests).map(([id,r])=>[id,runPipeline(r)]))};
  }
  return runPipeline(JSON.parse(fs.readFileSync(args[0],'utf8')));
}
if(require.main===module){
  try{const r=main(process.argv.slice(2));console.log(JSON.stringify(r,null,2));if(r.status)process.exitCode=r.status==='PASS'?0:r.status==='FAIL'?2:3;}
  catch(error){console.error(JSON.stringify({status:'FAIL',reason:'CLI_INPUT_ERROR',error:error.message}));process.exitCode=1;}
}
module.exports={main};
