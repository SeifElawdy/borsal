import {describe,it,expect,vi,afterEach} from 'vitest';
const {cloudflareProvider,COMPARISON_MODEL,GENERATION_PARAMETERS}=require('./provider');
const {execute}=require('../../live-pattern-generation/campaign');
const {runExperiment}=require('./harness');
const fs=require('fs'),os=require('os'),path=require('path');
const secret='SECRET_MUST_NEVER_APPEAR';
const provider=fetchImpl=>cloudflareProvider({accountId:secret,apiToken:secret,freeTierConfirmed:true,model:COMPARISON_MODEL,fetchImpl});
const failure=async p=>{try{await p.generate([]);}catch(e){return e;}throw Error('Expected failure');};
afterEach(()=>vi.restoreAllMocks());
describe('Safe Cloudflare transport diagnostics: no network',()=>{
  it('overrides only the approved campaign deadline while retaining defaults elsewhere',()=>{
    const {timeoutForCampaign}=require('../../live-pattern-generation/run');
    expect(timeoutForCampaign('phase5d-burgundy-accessory-002')).toBe(120000);
    expect(timeoutForCampaign('phase5d-burgundy-accessory-001')).toBe(60000);expect(timeoutForCampaign('another-campaign')).toBe(60000);
    expect(provider(async()=>{}).generationParameters.timeoutMs).toBe(60000);
  });
  it('keeps the HTTP payload identical under the 120-second local timeout',async()=>{
    const signalSpy=vi.spyOn(AbortSignal,'timeout'),fetchImpl=vi.fn(async()=>new Response(JSON.stringify({success:true,result:{response:'{}'}})));
    const p=cloudflareProvider({accountId:'mock',apiToken:'mock',freeTierConfirmed:true,model:COMPARISON_MODEL,timeoutMs:120000,fetchImpl});await p.generate([]);
    expect(signalSpy).toHaveBeenCalledWith(120000);expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({messages:[],...GENERATION_PARAMETERS});expect(p.generationParameters.max_tokens).toBe(6144);expect(p.generationParameters.timeoutMs).toBe(120000);expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('records a 120-second deadline diagnostic without waiting or sending requests',async()=>{
    vi.spyOn(AbortSignal,'timeout').mockReturnValue(AbortSignal.abort(new DOMException('mock deadline','TimeoutError')));
    const p=cloudflareProvider({accountId:'mock',apiToken:'mock',freeTierConfirmed:true,timeoutMs:120000,fetchImpl:async()=>{throw new DOMException('mock deadline','TimeoutError');}});
    const e=await failure(p);expect(e.diagnostics).toMatchObject({kind:'TIMEOUT',timeoutMs:120000,deadlineExpired:true,cloudflareExecution:'UNKNOWN'});
  });
  it('rejects unapproved timeout values before any transport call',()=>{
    for(const timeoutMs of [0,60001,180000,Infinity,'120000'])expect(()=>cloudflareProvider({accountId:'mock',apiToken:'mock',freeTierConfirmed:true,timeoutMs})).toThrow('TIMEOUT_NOT_APPROVED');
  });
  it('identifies an expired local deadline without exposing its reason or changing legacy codes',async()=>{
    vi.spyOn(AbortSignal,'timeout').mockReturnValue(AbortSignal.abort(new DOMException(secret,'TimeoutError')));
    const fetchImpl=vi.fn(async()=>{throw new DOMException(secret,'TimeoutError');});
    const e=await failure(provider(fetchImpl));expect(e.code).toBe('NETWORK_OR_TIMEOUT');expect(e.status).toBe(null);
    expect(e.diagnostics).toMatchObject({kind:'TIMEOUT',phase:'AWAITING_RESPONSE_HEADERS',timeoutMs:60000,deadlineExpired:true,timeoutScope:'CLIENT_DEADLINE',cloudflareExecution:'UNKNOWN'});
    expect(e.diagnostics.elapsedMs).toBeGreaterThanOrEqual(0);expect(JSON.stringify(e)).not.toContain(secret);expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it.each(['ENOTFOUND','EAI_AGAIN'])('records safe DNS cause %s without claiming Cloudflare execution',async code=>{
    const e=await failure(provider(async()=>{throw Object.assign(new TypeError(secret),{cause:{code,hostname:secret,message:secret}});}));
    expect(e.diagnostics).toMatchObject({kind:'NETWORK_ERROR',transportCode:code,transportCategory:'DNS',deadlineExpired:false,cloudflareExecution:'UNKNOWN'});expect(JSON.stringify(e)).not.toContain(secret);
  });
  it.each(['CERT_HAS_EXPIRED','ERR_TLS_CERT_ALTNAME_INVALID','UNABLE_TO_VERIFY_LEAF_SIGNATURE'])('records allowlisted TLS cause %s',async code=>{
    const e=await failure(provider(async()=>{throw Object.assign(new TypeError(secret),{cause:{code,certificate:secret}});}));expect(e.diagnostics).toMatchObject({kind:'NETWORK_ERROR',transportCategory:'TLS',transportCode:code});expect(JSON.stringify(e)).not.toContain(secret);
  });
  it.each(['ECONNRESET','ECONNREFUSED'])('records transport failure %s without raw addresses',async code=>{
    const e=await failure(provider(async()=>{throw Object.assign(Error(secret),{code,address:secret,stack:secret});}));expect(e.diagnostics).toMatchObject({kind:'NETWORK_ERROR',transportCode:code,transportCategory:'NETWORK_TRANSPORT'});expect(JSON.stringify(e)).not.toContain(secret);
  });
  it('distinguishes a transport timeout from expiration of its own deadline',async()=>{
    const e=await failure(provider(async()=>{throw Object.assign(new TypeError(secret),{cause:{code:'UND_ERR_CONNECT_TIMEOUT'}});}));
    expect(e.diagnostics).toMatchObject({kind:'TIMEOUT',deadlineExpired:false,timeoutScope:'TRANSPORT_OR_UNATTRIBUTED',transportCode:'UND_ERR_CONNECT_TIMEOUT'});
  });
  it('does not turn an arbitrary AbortError or unknown network code into a proven timeout/DNS failure',async()=>{
    const abort=await failure(provider(async()=>{throw new DOMException(secret,'AbortError');}));expect(abort.diagnostics).toMatchObject({kind:'ABORTED',deadlineExpired:false,transportCode:null});
    const unknown=await failure(provider(async()=>{throw Object.assign(Error(secret),{code:secret,cause:{code:secret}});}));expect(unknown.diagnostics).toMatchObject({kind:'NETWORK_ERROR',transportCode:null,transportCategory:null});expect(JSON.stringify(unknown)).not.toContain(secret);
  });
  it('distinguishes body-read timeout/network failure from malformed response JSON',async()=>{
    const bodyTimeout=provider(async()=>({status:200,json:async()=>{throw Object.assign(new TypeError(secret),{cause:{code:'UND_ERR_BODY_TIMEOUT'}});}}));
    const timeout=await failure(bodyTimeout);expect(timeout.code).toBe('INVALID_PROVIDER_ENVELOPE');expect(timeout.status).toBe(200);expect(timeout.diagnostics).toMatchObject({kind:'TIMEOUT',phase:'RESPONSE_BODY'});
    const reset=await failure(provider(async()=>({status:200,json:async()=>{throw Object.assign(new TypeError(secret),{cause:{code:'ECONNRESET'}});}})));expect(reset.diagnostics).toMatchObject({kind:'NETWORK_ERROR',phase:'RESPONSE_BODY'});
    const syntax=await failure(provider(async()=>new Response('not json')));expect(syntax.diagnostics).toMatchObject({kind:'INVALID_RESPONSE_JSON',phase:'RESPONSE_BODY'});
    const unknown=await failure(provider(async()=>({status:200,json:async()=>{throw new TypeError(secret);}})));expect(unknown.diagnostics.kind).toBe('UNKNOWN_BODY_ERROR');
  });
  it('retains HTTP/provider codes while adding safe elapsed/phase diagnostics',async()=>{
    const e=await failure(provider(async()=>new Response(JSON.stringify({success:false,errors:[{code:10000,message:secret}]}),{status:403})));
    expect(e.code).toBe('AUTHENTICATION_OR_PERMISSION');expect(e.status).toBe(403);expect(e.providerCodes).toEqual([10000]);expect(e.diagnostics).toMatchObject({kind:'HTTP_OR_PROVIDER_ERROR',phase:'VALIDATING_RESPONSE'});expect(JSON.stringify(e)).not.toContain(secret);
    const nullBody=await failure(provider(async()=>new Response('null')));expect(nullBody.code).toBe('INVALID_PROVIDER_ENVELOPE');
  });
  it('preserves JSON mode, token limit, model routing and successful response compatibility',async()=>{
    const fetchImpl=vi.fn(async()=>new Response(JSON.stringify({success:true,result:{response:'{}',usage:{completion_tokens:2},finish_reason:'stop'}})));
    const p=provider(fetchImpl),r=await p.generate([]),options=fetchImpl.mock.calls[0][1];expect(JSON.parse(options.body)).toEqual({messages:[],...GENERATION_PARAMETERS});expect(fetchImpl.mock.calls[0][0]).toContain(COMPARISON_MODEL);
    expect(p.generationParameters.timeoutMs).toBe(60000);expect(r).toMatchObject({text:'{}',httpStatus:200,outputTokenLimit:6144,truncated:false});expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('persists diagnostics for future failures in both harnesses without touching real campaigns',async()=>{
    const p=provider(async()=>{throw Object.assign(new TypeError(secret),{cause:{code:'ENOTFOUND'}});});
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-diagnostics-'));
    try{
      const out=await execute({root,campaignId:'mock-transport-diagnostics',provider:p,freeTierConfirmed:true,secrets:[secret]});expect(out.failure.diagnostics.transportCategory).toBe('DNS');expect(out.globalUsed).toBe(1);
      const saved=fs.readFileSync(path.join(root,'campaigns/mock-transport-diagnostics/failure.json'),'utf8');expect(saved).toContain('NETWORK_ERROR');expect(saved).not.toContain(secret);
      const report=await runExperiment({provider:p,briefs:[require('./briefs.json')[0]],maxRequests:1});expect(report.results[0].attempts[0].failure.diagnostics.transportCode).toBe('ENOTFOUND');expect(report.requests).toBe(1);
    }finally{if(path.dirname(root)!==os.tmpdir()||!path.basename(root).startsWith('borsal-diagnostics-'))throw Error('Unsafe cleanup');fs.rmSync(root,{recursive:true,force:true});}
  });
});
