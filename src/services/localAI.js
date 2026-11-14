// Trusted server dependencies only. Request bodies can never select a provider/root.
const path=require('path'),mongoose=require('mongoose');
const {cloudflareProvider,COMPARISON_MODEL}=require('../../experiments/design-language/ai-spike/provider');
const ROOT=path.resolve(__dirname,'../../experiments/design-language/ai-spike/results');
function validateRuntime(runtime){
  if(!runtime?.authorized||runtime.freeTierConfirmed!==true)throw Object.assign(Error('LIVE_GENERATION_DISABLED'),{status:403,code:'LIVE_GENERATION_DISABLED'});
  if(runtime.testing&&(!/^borsal-[a-z0-9-]+-test$/.test(mongoose.connection.name||'')||path.resolve(runtime.root)===ROOT))throw Error('UNSAFE_PROVIDER_TEST_CONFIGURATION');
  if(!runtime.testing&&path.resolve(runtime.root)!==ROOT)throw Error('INVALID_LIVE_LEDGER');
  return runtime;
}
function textProvider(runtime){validateRuntime(runtime);return runtime.testing?runtime.textProvider:cloudflareProvider({accountId:process.env.CF_ACCOUNT_ID,apiToken:process.env.CF_API_TOKEN,freeTierConfirmed:true,model:COMPARISON_MODEL,timeoutMs:120000});}
module.exports={ROOT,validateRuntime,textProvider};
