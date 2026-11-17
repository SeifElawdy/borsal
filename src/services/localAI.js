// Trusted server dependencies only. Request bodies can never select a provider/root.
const path=require('path'),mongoose=require('mongoose');
const {cloudflareProvider,COMPARISON_MODEL,CONSTRUCTION_MODEL,CONSTRUCTION_PARAMETERS,constructionMaxNeurons}=require('../../experiments/design-language/ai-spike/provider');
const ROOT=path.resolve(__dirname,'../../experiments/design-language/ai-spike/results');
function validateRuntime(runtime){
  if(!runtime?.authorized||runtime.freeTierConfirmed!==true)throw Object.assign(Error('LIVE_GENERATION_DISABLED'),{status:403,code:'LIVE_GENERATION_DISABLED'});
  if(runtime.testing&&(!/^borsal-[a-z0-9-]+-test$/.test(mongoose.connection.name||'')||path.resolve(runtime.root)===ROOT))throw Error('UNSAFE_PROVIDER_TEST_CONFIGURATION');
  if(!runtime.testing&&path.resolve(runtime.root)!==ROOT)throw Error('INVALID_LIVE_LEDGER');
  return runtime;
}
function engineeringSettings(selection=process.env.BORSAL_ENGINEERING_MODEL||'GPT_OSS'){
 if(selection==='LLAMA_BLUEPRINT'){const b=require('./blueprintProvider');return {selection,model:b.MODEL,profile:'LLAMA_BLUEPRINT',parameters:b.PARAMETERS,maxInputBytes:b.POLICY.maxInputBytes,freeTierHoldNeurons:b.POLICY.freeTierHoldNeurons,inputBytes:b.inputBytes,maxNeurons:b.maxNeurons,messages:b.messages};}
 if(selection==='QWEN'){const q=require('./qwenEngineering');return {selection,model:q.MODEL,profile:'QWEN_ENGINEERING',parameters:q.PARAMETERS,maxInputBytes:q.POLICY.maxInputBytes,freeTierHoldNeurons:q.POLICY.freeTierHoldNeurons,inputBytes:q.inputBytes,maxNeurons:q.maxNeurons,messages:q.messages};}
 if(selection!=='GPT_OSS')throw Error('ENGINEERING_MODEL_NOT_APPROVED');
 const e=require('./productEngineering');return {selection,model:CONSTRUCTION_MODEL,profile:'CONSTRUCTION',parameters:CONSTRUCTION_PARAMETERS,maxInputBytes:e.LIMITS.maxPromptBytes,freeTierHoldNeurons:e.LIMITS.freeTierHoldNeurons,inputBytes:m=>Buffer.byteLength(JSON.stringify(m)),maxNeurons:constructionMaxNeurons,messages:e.messages};
}
function textProvider(runtime,{construction=false,engineering=false}={}){validateRuntime(runtime);const config=engineering?engineeringSettings(runtime.engineeringSelection):null;return runtime.testing?runtime.textProvider:cloudflareProvider({accountId:process.env.CF_ACCOUNT_ID,apiToken:process.env.CF_API_TOKEN,freeTierConfirmed:true,model:config?.model||(construction?CONSTRUCTION_MODEL:COMPARISON_MODEL),profile:config?.profile||(construction?'CONSTRUCTION':'DEFAULT'),timeoutMs:120000});}
module.exports={ROOT,validateRuntime,textProvider,engineeringSettings};
