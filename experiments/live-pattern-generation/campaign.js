const fs=require('fs'),path=require('path');
const {COMPARISON_MODEL,GENERATION_PARAMETERS}=require('../design-language/ai-spike/provider');
const {openBudget,validateCampaignId}=require('../design-language/ai-spike/campaign');
const {redact}=require('../design-language/ai-spike/harness');
const {messages,fabric,sourceConcept}=require('./prompt');
const {evaluate}=require('./evaluate');
const conservativeMaxNeurons=(24000*26668+GENERATION_PARAMETERS.max_tokens*204805)/1000000;
function writeNew(file,value,secrets=[],raw=false){
  const fd=fs.openSync(file,'wx');
  try{fs.writeFileSync(fd,raw?JSON.parse(redact(value,secrets)):redact(value,secrets));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
}
async function execute({root,campaignId,provider,freeTierConfirmed=false,secrets=[]}){
  validateCampaignId(campaignId);
  if(provider.mode==='LIVE'&&(provider.model!==COMPARISON_MODEL||freeTierConfirmed!==true))throw Error('LIVE_SAFETY_GATE_FAILED');
  if(!['MOCK','LIVE'].includes(provider.mode))throw Error('INVALID_PROVIDER_MODE');
  const prompt=messages(),promptBytes=Buffer.byteLength(JSON.stringify(prompt),'utf8');
  if(promptBytes+512+GENERATION_PARAMETERS.max_tokens>24000||conservativeMaxNeurons>2000)throw Error('PREFLIGHT_LIMIT_EXCEEDED');
  const parent=path.resolve(root,'campaigns');fs.mkdirSync(parent,{recursive:true});
  if(fs.lstatSync(parent).isSymbolicLink())throw Error('INVALID_CAMPAIGN_PATH');
  const directory=path.join(parent,campaignId);if(fs.existsSync(directory))throw Error('CAMPAIGN_ALREADY_EXISTS');
  const budget=provider.mode==='LIVE'?openBudget(root):null;
  if(budget&&budget.used()>=12)throw Error('GLOBAL_REQUEST_LIMIT_REACHED');
  fs.mkdirSync(directory);
  writeNew(path.join(directory,'lock.json'),{campaignId,mode:provider.mode,maxRequests:1,maxRepairs:0,model:provider.model,startedAt:new Date().toISOString()},secrets);
  writeNew(path.join(directory,'request.json'),{messages:prompt,promptBytes,conservativeMaxNeurons,generationParameters:provider.generationParameters??GENERATION_PARAMETERS,fabric:fabric(),sourceConcept:sourceConcept(),physicalAccuracy:'UNVERIFIED'},secrets);
  const slot=budget?budget.reserve(campaignId,1):null;
  writeNew(path.join(directory,'attempt-1.json'),{state:'RESERVED_BEFORE_INFERENCE',globalSlot:slot,requestsDispatched:1},secrets);
  // One direct call. Failure, invalid JSON and schema errors never initiate a retry.
  let response;
  try{response=await provider.generate(prompt);}catch(error){
    const failure={campaignId,status:'PROVIDER_FAILED',requestsDispatched:1,repairs:0,globalUsed:budget?.used()??null,failure:{code:typeof error.code==='string'?error.code:'PROVIDER_FAILURE',httpStatus:Number.isInteger(error.status)?error.status:null,...(error.diagnostics?{diagnostics:error.diagnostics}:{})},physicalAccuracy:'UNVERIFIED'};
    writeNew(path.join(directory,'failure.json'),failure,secrets);return failure;
  }
  writeNew(path.join(directory,'response.json'),response,secrets);
  writeNew(path.join(directory,'raw-response.txt'),response.text,secrets,true);
  const evaluation=evaluate(response.text,{campaignId,model:provider.model,mode:provider.mode,sourcePath:path.join(directory,'raw-response.txt')});
  const {previewSvg,...evidence}=evaluation;
  writeNew(path.join(directory,'validation-errors.json'),evaluation.errors,secrets);
  const result={campaignId,mode:provider.mode,model:provider.model,requestsDispatched:1,repairs:0,liveInferencePerformed:provider.mode==='LIVE',globalUsed:budget?.used()??null,httpStatus:response.httpStatus??null,usage:response.usage??null,finishReason:response.finishReason??null,truncated:response.truncated??null,outputTokenLimit:response.outputTokenLimit??null,...evidence};
  writeNew(path.join(directory,'result.json'),result,secrets);
  if(previewSvg)writeNew(path.join(directory,'preview.svg'),previewSvg,secrets,true);
  return result;
}
module.exports={execute,conservativeMaxNeurons};
