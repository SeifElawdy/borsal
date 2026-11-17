const fs=require('fs');
const {precheck}=require('./precheck');
function main(args){
  if(args.length!==1)throw Error('Use precheck-run.js <request.json> or precheck-run.js --demo');
  if(args[0]==='--demo'){
    const {provenance,assumptions,requests}=require('./precheck-examples').examples();
    return {provenance,assumptions,results:Object.fromEntries(Object.entries(requests).map(([id,r])=>[id,precheck(r)]))};
  }
  return precheck(JSON.parse(fs.readFileSync(args[0],'utf8')));
}
if(require.main===module){
  try{const r=main(process.argv.slice(2));console.log(JSON.stringify(r,null,2));if(r.status)process.exitCode=r.status==='PASS'?0:r.status==='FAIL'?2:3;}
  catch(error){console.error(JSON.stringify({status:'FAIL',reason:'CLI_INPUT_ERROR',error:error.message}));process.exitCode=1;}
}
module.exports={main};
