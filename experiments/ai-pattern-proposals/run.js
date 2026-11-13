const fs=require('fs');
const {evaluateProposal}=require('./adapter');
function main(args){
  if(args.length!==1)throw Error('Use run.js <proposal-request.json> or --demo');
  if(args[0]==='--demo')return {results:Object.fromEntries(Object.entries(require('./examples').examples()).map(([id,r])=>[id,evaluateProposal(r)]))};
  return evaluateProposal(JSON.parse(fs.readFileSync(args[0],'utf8')));
}
if(require.main===module){
  try{const out=main(process.argv.slice(2));console.log(JSON.stringify(out,null,2));if(out.verdict)process.exitCode=out.verdict==='PASS'?0:out.verdict==='FAIL'?2:3;}
  catch(error){console.error(JSON.stringify({status:'REJECTED',verdict:'FAIL',reason:'CLI_INPUT_ERROR',error:error.message}));process.exitCode=1;}
}
module.exports={main};
