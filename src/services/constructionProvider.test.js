import {it,expect,vi} from 'vitest';
const {cloudflareProvider,CONSTRUCTION_MODEL,MODEL}=require('../../experiments/design-language/ai-spike/provider');
it('uses the approved compact planner profile without changing legacy defaults',async()=>{
 const fetchImpl=vi.fn(async(_url,req)=>({ok:true,status:200,json:async()=>({success:true,result:{response:{plan:'raw'},usage:{prompt_tokens:100,completion_tokens:1536,neurons:12},finish_reason:'length'}})}));
 const p=cloudflareProvider({accountId:'TEST_ACCOUNT',apiToken:'TEST_TOKEN',freeTierConfirmed:true,model:CONSTRUCTION_MODEL,profile:'CONSTRUCTION',timeoutMs:120000,fetchImpl}),r=await p.generate([{role:'user',content:'test'}]);
 const b=JSON.parse(fetchImpl.mock.calls[0][1].body);expect(b.max_tokens).toBe(2048);expect(b.response_format).toEqual({type:'json_object'});expect(b.temperature).toBe(.3);expect(r.truncated).toBe(true);expect(r.outputTokenLimit).toBe(2048);expect(r.usage.neurons).toBe(12);expect(fetchImpl).toHaveBeenCalledTimes(1);
 expect(cloudflareProvider({accountId:'TEST',apiToken:'TEST',freeTierConfirmed:true}).generationParameters.max_tokens).toBe(6144);
 expect(()=>cloudflareProvider({accountId:'TEST',apiToken:'TEST',freeTierConfirmed:true,model:MODEL,profile:'CONSTRUCTION'})).toThrow('PROFILE_NOT_APPROVED');
});
it('does not retry planner transport or quota failures and never exposes credentials',async()=>{
 const fetchImpl=vi.fn(async()=>{throw Object.assign(Error('secret request'),{code:'ECONNRESET'});}),p=cloudflareProvider({accountId:'TEST',apiToken:'DO_NOT_EXPOSE',freeTierConfirmed:true,model:CONSTRUCTION_MODEL,profile:'CONSTRUCTION',fetchImpl});
 try{await p.generate([]);throw Error('Expected failure');}catch(e){expect(e.code).toBe('NETWORK_OR_TIMEOUT');expect(JSON.stringify(e)).not.toContain('DO_NOT_EXPOSE');expect(e.diagnostics.cloudflareExecution).toBe('UNKNOWN');}expect(fetchImpl).toHaveBeenCalledTimes(1);
});
it('captures an unknown successful HTTP envelope privately before rejecting it without inventing model output',async()=>{
 const captureEnvelope=vi.fn(),body={success:true,result:{unexpected:{text:'unchanged response'}}},fetchImpl=vi.fn(async()=>({ok:true,status:200,json:async()=>body}));
 const p=cloudflareProvider({accountId:'TEST',apiToken:'TEST',freeTierConfirmed:true,model:CONSTRUCTION_MODEL,profile:'CONSTRUCTION',fetchImpl});
 await expect(p.generate([],{captureEnvelope})).rejects.toMatchObject({code:'INVALID_PROVIDER_ENVELOPE',status:200});expect(captureEnvelope).toHaveBeenCalledWith({httpStatus:200,body});expect(fetchImpl).toHaveBeenCalledTimes(1);
});
