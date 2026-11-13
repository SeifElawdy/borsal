const fs=require('fs'),path=require('path');
const {draft}=require('./draft');
function main(args){
  if(args.length<1||args.length>2)throw Error('Use run.js <request.json>|--demo [new-output-directory]');
  const requests=args[0]==='--demo'?require('./examples').examples():{draft:JSON.parse(fs.readFileSync(args[0],'utf8'))};
  const results=Object.fromEntries(Object.entries(requests).map(([name,input])=>[name,draft(input)]));
  if(args[1]){
    // Only a new directory may be used. No existing artifact can be overwritten.
    const dir=path.resolve(args[1]);fs.mkdirSync(dir);
    for(const [name,result]of Object.entries(results)){
      fs.writeFileSync(path.join(dir,name+'-input.json'),JSON.stringify(requests[name],null,2)+'\n',{flag:'wx'});
      const {previewSvg,...report}=result;fs.writeFileSync(path.join(dir,name+'-report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
      if(previewSvg)fs.writeFileSync(path.join(dir,name+'-preview.svg'),previewSvg,{flag:'wx'});
    }
  }
  return args[0]==='--demo'?{results}:results.draft;
}
if(require.main===module){
  try{const out=main(process.argv.slice(2));const summary=r=>({status:r.status,verdict:r.verdict,pieces:r.cuttingPieces.length,previewAvailable:!!r.previewSvg,errors:r.errors,unresolved:r.unresolved});
    console.log(JSON.stringify(out.results?{results:Object.fromEntries(Object.entries(out.results).map(([k,r])=>[k,summary(r)]))}:summary(out),null,2));
    if(out.verdict)process.exitCode=out.verdict==='PASS'?0:out.verdict==='FAIL'?2:3;
  }catch(error){console.error(JSON.stringify({status:'REJECTED',verdict:'FAIL',reason:'CLI_ERROR',error:error.message}));process.exitCode=1;}
}
module.exports={main};
