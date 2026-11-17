const path=require('path');
const {cloudflareProvider,COMPARISON_MODEL}=require('../design-language/ai-spike/provider');
const {execute}=require('./campaign');
// Only this explicitly approved campaign gets the longer local deadline.
const timeoutForCampaign=id=>id==='phase5d-burgundy-accessory-002'?120000:60000;
function options(args){
  if(args.some(a=>!['--live','--mock','--free-tier-confirmed'].includes(a)&&!a.startsWith('--campaign='))||args.includes('--live')&&args.includes('--mock'))throw Error('INVALID_OPTIONS');
  const ids=args.filter(a=>a.startsWith('--campaign='));if(ids.length!==1)throw Error('ONE_CAMPAIGN_REQUIRED');
  return {campaignId:ids[0].slice(11),live:args.includes('--live'),freeTierConfirmed:args.includes('--free-tier-confirmed')};
}
async function main(args){
  const o=options(args);let provider,secrets=[];
  if(o.live){
    require('dotenv').config({quiet:true});secrets=[process.env.CF_API_TOKEN,process.env.CF_ACCOUNT_ID,process.env.MONGODB_URI];
    provider=cloudflareProvider({accountId:process.env.CF_ACCOUNT_ID,apiToken:process.env.CF_API_TOKEN,freeTierConfirmed:o.freeTierConfirmed,model:COMPARISON_MODEL,timeoutMs:timeoutForCampaign(o.campaignId)});
  }else provider={mode:'MOCK',model:'none',generate:async()=>({text:'{}',httpStatus:null,usage:null})};
  const result=await execute({root:path.resolve(__dirname,'../design-language/ai-spike/results'),campaignId:o.campaignId,provider,freeTierConfirmed:o.freeTierConfirmed,secrets});
  console.log(JSON.stringify({campaignId:result.campaignId,status:result.status,verdict:result.verdict,requests:result.requestsDispatched,globalUsed:result.globalUsed,httpStatus:result.httpStatus,usage:result.usage}));return result;
}
if(require.main===module)main(process.argv.slice(2)).catch(()=>{console.error('Experiment stopped safely. No retry, fallback or lock reset.');process.exitCode=1;});
module.exports={main,options,timeoutForCampaign};
