import {it,expect,vi} from 'vitest';
const {cloudflareProvider,CONSTRUCTION_MODEL}=require('../../experiments/design-language/ai-spike/provider');
const fixture=require('./fixtures/gpt-oss-hair-tie-limit.json');
function provider(body=fixture.body){const fetchImpl=vi.fn(async()=>({ok:true,status:200,headers:new Map([['content-type','application/json']]),json:async()=>structuredClone(body)}));return {fetchImpl,p:cloudflareProvider({accountId:'TEST_ACCOUNT',apiToken:'PRIVATE_TEST_TOKEN',freeTierConfirmed:true,model:CONSTRUCTION_MODEL,profile:'CONSTRUCTION',timeoutMs:120000,fetchImpl})};}
it('classifies the actual Hair Tie response as exhausted output, retaining usage without accepting reasoning',async()=>{
 const before=JSON.stringify(fixture),{p,fetchImpl}=provider(),captureEnvelope=vi.fn();let failure;
 try{await p.generate([],{captureEnvelope});}catch(e){failure=e;}
 expect(failure).toMatchObject({code:'MODEL_OUTPUT_TOKEN_LIMIT_REACHED',status:200,diagnostics:{kind:'OUTPUT_TOKEN_LIMIT',phase:'VALIDATING_RESPONSE',finishReason:'length',outputTokenLimit:1536,truncated:true,finalContentPresent:false,reasoningPresent:true,usage:{prompt_tokens:1732,completion_tokens:1536,total_tokens:3268,neurons:159.8360137939453}}});
 expect(failure.diagnostics.elapsedMs).toBeGreaterThanOrEqual(0);expect(JSON.stringify(failure)).not.toContain('REDACTED_PROVIDER_REASONING');expect(JSON.stringify(failure)).not.toContain('PRIVATE_TEST_TOKEN');expect(captureEnvelope).toHaveBeenCalledWith({httpStatus:200,contentType:'application/json',body:fixture.body});expect(fetchImpl).toHaveBeenCalledTimes(1);expect(JSON.stringify(fixture)).toBe(before);expect(failure.text).toBeUndefined();
});
it.each(['stop','tool_calls',null])('keeps other missing-content responses invalid (%s)',async finish=>{const b=structuredClone(fixture.body);b.result.choices[0].finish_reason=finish;const {p,fetchImpl}=provider(b);await expect(p.generate([])).rejects.toMatchObject({code:'INVALID_PROVIDER_ENVELOPE'});expect(fetchImpl).toHaveBeenCalledTimes(1);});
it('never treats reasoning JSON, tool calls or refusal as recoverable construction output',async()=>{
 for(const extra of [{reasoning:'{"schemaVersion":"borsal.construction-intent/0.1"}',reasoning_content:'{}'},{tool_calls:[{id:'tool'}]},{refusal:'No final design'}]){const b=structuredClone(fixture.body);Object.assign(b.result.choices[0].message,extra);const {p,fetchImpl}=provider(b);await expect(p.generate([])).rejects.toBeDefined();expect(fetchImpl).toHaveBeenCalledTimes(1);}
});
it('preserves final text and strict downstream validation even when a completion is truncated',async()=>{const b=structuredClone(fixture.body);b.result.choices[0].message.content='{"schemaVersion":';const {p}=provider(b),r=await p.generate([]);expect(r.text).toBe('{"schemaVersion":');expect(r.truncated).toBe(true);expect(()=>JSON.parse(r.text)).toThrow();});
