const fs=require('fs');
const {evaluateLayout}=require('./engine');
function main(args){
  if(args.length!==1)throw Error('Use run.js <layout.json> or run.js --demo');
  if(args[0]==='--demo'){
    const {provenance,assumptions,layouts}=require('./examples').examples();
    return {provenance,assumptions,results:Object.fromEntries(Object.entries(layouts).map(([id,l])=>[id,evaluateLayout(l)]))};
  }
  return evaluateLayout(JSON.parse(fs.readFileSync(args[0],'utf8')));
}
if(require.main===module){
  try{const result=main(process.argv.slice(2));console.log(JSON.stringify(result,null,2));if(result.status)process.exitCode=result.status==='PASS'?0:result.status==='FAIL'?2:3;}
  catch(error){console.error(JSON.stringify({status:'FAIL',classification:'CLI_INPUT_ERROR',error:error.message}));process.exitCode=1;}
}
module.exports={main};
