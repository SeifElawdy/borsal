// Reproducible local TEST_FIXTURE workflow. Never touches origin stock or calls AI.
const fs=require('fs'),path=require('path'),mongoose=require('mongoose'),{randomBytes,randomUUID}=require('crypto');
const fixtures=require('./approval-fixtures');
async function main(args){
  if(args.length!==1)throw Error('Use approval-inventory-demo.js <new-output-directory>');
  const dir=path.resolve(args[0]);fs.mkdirSync(dir);const save=(n,v)=>fs.writeFileSync(path.join(dir,n),JSON.stringify(v,null,2),{flag:'wx'});
  const initial=await require('./keychain-feasibility-demo').main([path.join(dir,'source-flow')]);
  const uri=new URL(process.env.MONGODB_URI);uri.pathname='/'+initial.databaseName;await mongoose.connect(uri.toString());
  const models=require('../../src/models/ApprovalInventory');await Promise.all(Object.values(models).map(m=>m.createIndexes()));
  const token=randomBytes(32).toString('hex');process.env.BORSAL_APPROVAL_TOKEN=token;process.env.BORSAL_OPERATOR_ID='TEST_FIXTURE_OPERATOR';process.env.BORSAL_INVENTORY_TEST_FIXTURES='1';delete process.env.BORSAL_PRODUCTION_APPROVALS;
  const app=require('../../src/app'),server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));}),base='http://127.0.0.1:'+server.address().port,calls=[];
  async function call(method,url,body){const res=await fetch(base+url,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},...(body?{body:JSON.stringify(body)}:{})});const response=await res.json();const entry={method,path:url,request:body??null,httpStatus:res.status,response};calls.push(entry);save('api-'+calls.length+'.json',entry);return {http:res.status,...response};}
  try{
    const root='/api/technical-proposals/'+initial.proposalId,p=(await call('GET',root)).proposal;
    const hashes=await call('POST',root+'/production-readiness',{});
    const prototype=await call('POST',root+'/design-review',{expectedVersion:0,decision:'APPROVED_FOR_PROTOTYPE',reviewer:'TEST_FIXTURE_OPERATOR',rationale:'Approve this synthetic draft for prototype review only, not manufacture or stock reservation',proposalHash:hashes.proposalHash,sourceHash:hashes.sourceHash});if(prototype.http!==201)throw Error('Prototype review failed');save('prototype-review.json',prototype);
    const inventoryBefore=await call('GET','/api/inventory');if(inventoryBefore.items.length)throw Error('Prototype unexpectedly reserved inventory');
    const stockBindings={};for(const entry of fixtures.stocks(p)){const result=await call('POST','/api/accessory-stock',entry.body);if(result.http!==201)throw Error('Fixture stock creation failed');stockBindings[entry.bomId]={stockId:result.stock._id,expectedVersion:0};}
    const evidence=await call('POST',root+'/verification-evidence',fixtures.evidence(p,hashes));if(evidence.http!==201)throw Error('Fixture evidence recording failed');
    const body={scope:'REAL',stockBindings,evidenceId:evidence.evidence._id,expectedReviewVersion:1,proposalHash:hashes.proposalHash,sourceHash:hashes.sourceHash,conceptReviewHash:hashes.conceptReviewHash,idempotencyKey:randomUUID(),rationale:'Must block production: current source and all physical/stock evidence are TEST_FIXTURE only'};
    const blocked=await call('POST',root+'/approve-production',body);save('blocked-production.json',blocked);if(blocked.http!==409||blocked.error!=='PRODUCTION_NOT_READY')throw Error('Real production was not safely blocked');
    const testBody={...body,scope:'TEST_FIXTURE',idempotencyKey:randomUUID(),rationale:'Exercise the same transactional reservation with isolated TEST_FIXTURE evidence only; not real production authorization'};
    const readiness=await call('POST',root+'/production-readiness',{scope:'TEST_FIXTURE',stockBindings,evidenceId:evidence.evidence._id});if(!readiness.ready)throw Error('Fixture readiness failed');
    const simultaneous=await Promise.all([call('POST',root+'/approve-production',testBody),call('POST',root+'/approve-production',testBody)]);if(simultaneous.map(v=>v.http).sort().join(',')!=='200,201')throw Error('Concurrent idempotency failed');const reserved=simultaneous[0].item;
    const inventory=await call('GET','/api/inventory'),stock=await call('GET','/api/accessory-stock'),review=await call('GET',root+'/design-review');
    save('inventory-test.json',inventory);save('stock-after.json',stock);save('test-evidence.json',evidence);save('transcript.json',calls);
    const fabric=await require('../../src/models/FabricPiece').findById(p.fabricId).lean();
    const budget=require('../design-language/ai-spike/campaign').openBudget(path.resolve(__dirname,'../design-language/ai-spike/results'));
    const summary={label:'TEST_FIXTURE',databaseName:initial.databaseName,proposalId:p._id,prototypeDecision:prototype.review.decision,prototypeHttp:prototype.http,prototypeReservedItems:inventoryBefore.items.length,
      realProductionHttp:blocked.http,realProductionReasons:blocked.readiness.reasons,fixtureConcurrentHttp:simultaneous.map(v=>v.http).sort(),inventoryId:reserved._id,inventoryCount:inventory.items.length,
      finalDecision:review.review.decision,approvalHistory:review.review.history.map(e=>({decision:e.decision,scope:e.scope,version:e.version})),scope:reserved.scope,productionAuthorized:reserved.productionAuthorized,finishedProduct:reserved.finishedProduct,
      fabricAvailability:fabric.availabilityStatus,stockBalances:stock.stock.map(s=>({sku:s.sku,scope:s.scope,received:s.receivedQuantity,available:s.availableQuantity,reserved:s.reservedQuantity,unit:s.unit,version:s.__v})),references:reserved.references,manufacturingVerified:false,inferenceRequests:0,budgetUsed:budget.used(),budgetLimit:budget.limit};
    save('summary.json',summary);console.log(JSON.stringify(summary));return summary;
  }finally{await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();for(const k of ['BORSAL_APPROVAL_TOKEN','BORSAL_OPERATOR_ID','BORSAL_INVENTORY_TEST_FIXTURES'])delete process.env[k];}
}
if(require.main===module)main(process.argv.slice(2)).catch(async()=>{console.error('Approval demo stopped safely; inspect local evidence. No Cloudflare inference or real stock mutation.');await mongoose.disconnect();process.exitCode=1;});
module.exports={main};
