const fs=require('fs'),path=require('path');
const {assess,handoff}=require('./workflow');
async function main(args){
  let reports,dir;
  if(args[0]==='--demo'&&args.length<=2){reports=await require('./examples').demos();dir=args[1];}
  else if(args[0]==='--review'&&args.length>=3&&args.length<=4){const raw=fs.readFileSync(args[1],'utf8'),review=JSON.parse(fs.readFileSync(args[2],'utf8'));reports={reviewed:{review,result:handoff(raw,review)}};dir=args[3];}
  else if(args[0]==='--assess'&&args.length>=2&&args.length<=3){reports={concept:{result:assess(fs.readFileSync(args[1],'utf8'))}};dir=args[2];}
  else throw Error('Use --demo [new-dir], --assess <raw-file> [new-dir], or --review <raw-file> <review.json> [new-dir]. No live option.');
  if(dir){fs.mkdirSync(path.resolve(dir));for(const [id,r]of Object.entries(reports)){
    fs.writeFileSync(path.join(dir,id+'-raw.txt'),r.result.rawText,{flag:'wx'});
    if(r.review)fs.writeFileSync(path.join(dir,id+'-review.json'),JSON.stringify(r.review,null,2)+'\n',{flag:'wx'});
    fs.writeFileSync(path.join(dir,id+'-report.json'),JSON.stringify(r,null,2)+'\n',{flag:'wx'});
  }}
  return reports;
}
if(require.main===module)main(process.argv.slice(2)).then(reports=>{
  console.log(JSON.stringify(Object.fromEntries(Object.entries(reports).map(([id,r])=>[id,{idea:r.result.proposal?.productIdea?.name,status:r.result.status,reviewGate:r.result.reviewGate,handoff:r.result.handoff?.drafting.status??null,verdict:r.result.verdict}]))));
  if(process.argv[2]!=='--demo'){const r=Object.values(reports)[0].result;process.exitCode=r.verdict==='FAIL'?2:r.verdict==='UNVERIFIED'?3:0;}
}).catch(()=>{console.error('Offline concept operation failed; no live request or overwrite was attempted.');process.exitCode=1;});
module.exports={main};
