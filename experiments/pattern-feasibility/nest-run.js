const fs=require('fs');
const {nest}=require('./nesting');
function main(args){
  if(args.length!==1)throw Error('Use nest-run.js <request.json> or nest-run.js --demo');
  if(args[0]==='--demo'){
    const {provenance,assumptions,requests}=require('./nesting-examples').nestingExamples();
    return {provenance,assumptions,results:Object.fromEntries(Object.entries(requests).map(([id,r])=>[id,nest(r)]))};
  }
  return nest(JSON.parse(fs.readFileSync(args[0],'utf8')));
}
if(require.main===module){
  try{const result=main(process.argv.slice(2));console.log(JSON.stringify(result,null,2));if(result.status)process.exitCode=result.status==='LAYOUT_FOUND'?(result.validationStatus==='UNVERIFIED'?3:0):2;}
  catch(error){console.error(JSON.stringify({status:'NO_LAYOUT_FOUND',reason:'CLI_INPUT_ERROR',error:error.message}));process.exitCode=1;}
}
module.exports={main};
