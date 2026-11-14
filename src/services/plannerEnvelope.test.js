import {it,expect,vi} from 'vitest';
const {createHash}=require('crypto'),{cloudflareProvider,CONSTRUCTION_MODEL}=require('../../experiments/design-language/ai-spike/provider');
const fixture=require('./fixtures/gpt-oss-chat-envelope.json'),planner=require('./constructionPlanner');
const run=async(body=fixture.body)=>{const fetchImpl=vi.fn(async()=>({ok:true,status:200,json:async()=>structuredClone(body)})),p=cloudflareProvider({accountId:'TEST',apiToken:'TEST',freeTierConfirmed:true,model:CONSTRUCTION_MODEL,profile:'CONSTRUCTION',fetchImpl});return {result:await p.generate([{role:'user',content:'MOCK / no inference'}]),fetchImpl};};
it('replays the actual sanitized HTTP-200 GPT-OSS failure as exact final content with original usage',async()=>{
 const before=JSON.stringify(fixture),{result,fetchImpl}=await run();
 expect(result.text).toBe(fixture.body.result.choices[0].message.content);expect(createHash('sha256').update(result.text).digest('hex')).toBe(fixture._fixture.contentSha256);
 expect(result.usage).toEqual({prompt_tokens:1680,completion_tokens:872,total_tokens:2552,neurons:112.90876770019531});expect(result.finishReason).toBe('stop');expect(result.truncated).toBe(false);
 expect(result.text).not.toContain('REDACTED_PROVIDER_REASONING');expect(fetchImpl.mock.calls[0][0]).toContain('/ai/run/@cf/openai/gpt-oss-120b');expect(fetchImpl).toHaveBeenCalledTimes(1);expect(JSON.stringify(fixture)).toBe(before);
});
it('validates the actual final JSON without manufacturing geometry for an UNSUPPORTED construction',async()=>{
 const {result}=await run(),intent=planner.intentSchema.parse(JSON.parse(result.text)),compiled=planner.compile(intent);expect(intent.method).toBe('UNSUPPORTED');expect(compiled.candidate).toBeNull();expect(compiled.reason).toBe('CONSTRUCTION_METHOD_UNSUPPORTED');expect(intent.cutWidthCm).toBeUndefined();expect(intent.creativeChanges.length).toBeGreaterThan(0);
});
it.each([
 ['success:false',b=>{b.success=false;}],
 ['root errors',b=>{b.errors=[{code:123,message:'Do not expose arbitrary remote text'}];}],
 ['nested inference error',b=>{b.result.error={message:'failure'};}],
 ['reasoning only',b=>{b.result.choices[0].message.content=null;}],
 ['empty final text',b=>{b.result.choices[0].message.content=' ';}],
 ['refusal',b=>{b.result.choices[0].message.refusal='not a proposal';}],
 ['tool call',b=>{b.result.choices[0].message.tool_calls=[{id:'tool'}];}],
 ['multiple choices',b=>{b.result.choices.push(structuredClone(b.result.choices[0]));}],
 ['wrong role',b=>{b.result.choices[0].message.role='tool';}],
 ['Responses API output',b=>{b.result={object:'response',output:[{type:'reasoning',content:'not final'},{type:'message',content:[{type:'output_text',text:'{}'}]}]};}],
])('rejects %s without treating it as a product or retrying',async(_name,change)=>{
 const body=structuredClone(fixture.body);change(body);const fetchImpl=vi.fn(async()=>({ok:true,status:200,json:async()=>body})),p=cloudflareProvider({accountId:'TEST',apiToken:'TEST',freeTierConfirmed:true,model:CONSTRUCTION_MODEL,profile:'CONSTRUCTION',fetchImpl});
 await expect(p.generate([])).rejects.toBeDefined();expect(fetchImpl).toHaveBeenCalledTimes(1);
});
it('preserves malformed model JSON for downstream validation instead of repairing it',async()=>{const body=structuredClone(fixture.body);body.result.choices[0].message.content='{"incomplete":';const {result}=await run(body);expect(result.text).toBe('{"incomplete":');expect(()=>JSON.parse(result.text)).toThrow();});
it('retains truncation and captures safe content type for future envelopes',async()=>{const body=structuredClone(fixture.body);body.result.choices[0].finish_reason='length';const captureEnvelope=vi.fn(),fetchImpl=vi.fn(async()=>({ok:true,status:200,headers:new Map([['content-type','application/json; charset=utf-8']]),json:async()=>body})),p=cloudflareProvider({accountId:'TEST',apiToken:'TEST',freeTierConfirmed:true,model:CONSTRUCTION_MODEL,profile:'CONSTRUCTION',fetchImpl});const result=await p.generate([],{captureEnvelope});expect(result.truncated).toBe(true);expect(captureEnvelope.mock.calls[0][0].contentType).toBe('application/json');});
