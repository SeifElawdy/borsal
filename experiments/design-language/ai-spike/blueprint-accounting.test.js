import {it,expect} from 'vitest';
const fs=require('fs'),os=require('os'),path=require('path'),{Worker}=require('worker_threads'),{openBudget}=require('./campaign');
it('publishes a complete baseline across concurrent cold starts and never rewrites existing slots',async()=>{
 for(let round=0;round<3;round++){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-blueprint-accounting-'));
  try{
   const results=await Promise.all(Array.from({length:6},()=>new Promise((resolve,reject)=>{
    const worker=new Worker(`const {parentPort,workerData}=require('worker_threads');let n=0;try{const b=require(workerData.module).openBudget(workerData.root);for(;n<15;n++)b.reserve('mock-offline',n+1);parentPort.postMessage({n});}catch(e){parentPort.postMessage({n,error:e.message,code:e.code});}`,{eval:true,workerData:{root,module:require.resolve('./campaign')}});
    worker.on('message',resolve);worker.on('error',reject);worker.on('exit',code=>{if(code)reject(Error('Worker exit '+code));});
   })));
   expect(results).toEqual(Array.from({length:6},()=>({n:15})));expect(openBudget(root).used()).toBe(90);
   const dir=path.join(root,'request-budget'),before=Object.fromEntries(fs.readdirSync(dir).map(n=>[n,fs.readFileSync(path.join(dir,n),'utf8')]));expect(Object.keys(before)).toHaveLength(91);
   expect(openBudget(root).reserve('one-more-mock',1)).toBe(91);for(const [n,value]of Object.entries(before))expect(fs.readFileSync(path.join(dir,n),'utf8')).toBe(value);
   expect(fs.readdirSync(dir).some(n=>n.endsWith('.tmp'))).toBe(false);
  }finally{if(path.dirname(root)!==os.tmpdir()||!path.basename(root).startsWith('borsal-blueprint-accounting-'))throw Error('UNSAFE_TEMP_PATH');fs.rmSync(root,{recursive:true,force:true});}
 }
},30000);
it('still fails closed on an existing corrupt baseline and counts an unknown slot',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-blueprint-corrupt-'));
 try{openBudget(root);const directory=path.join(root,'request-budget');fs.writeFileSync(path.join(directory,'request-1.json'),'');expect(openBudget(root).used()).toBe(1);expect(openBudget(root).reserve('offline',1)).toBe(2);fs.writeFileSync(path.join(directory,'baseline.json'),'');expect(()=>openBudget(root)).toThrow('BUDGET_BASELINE_MISMATCH');expect(fs.readFileSync(path.join(directory,'baseline.json'),'utf8')).toBe('');expect(fs.readFileSync(path.join(directory,'request-1.json'),'utf8')).toBe('');}
 finally{if(path.dirname(root)!==os.tmpdir()||!path.basename(root).startsWith('borsal-blueprint-corrupt-'))throw Error('UNSAFE_TEMP_PATH');fs.rmSync(root,{recursive:true,force:true});}
});
