import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
const fs=require('fs'),path=require('path'),os=require('os');
const {execute,conservativeMaxNeurons}=require('./campaign');
const {evaluate}=require('./evaluate');
const {messages,fabric,sourceConcept}=require('./prompt');
const {options}=require('./run');
const {openBudget}=require('../design-language/ai-spike/campaign');
const {COMPARISON_MODEL,GENERATION_PARAMETERS}=require('../design-language/ai-spike/provider');
let root;
const authored=()=>{const r=require('../technical-drafting/examples').examples().complete;return {design:r.design.data,instances:r.context.instances};};
const fake=(text=JSON.stringify(authored()),mode='MOCK')=>({mode,model:mode==='LIVE'?COMPARISON_MODEL:'offline-mock',generate:vi.fn(async()=>({text,httpStatus:mode==='LIVE'?200:null,usage:{prompt_tokens:100,completion_tokens:200,total_tokens:300,neurons:5},finishReason:'stop',truncated:false,outputTokenLimit:6144}))});
const run=(id,provider,extra={})=>execute({root,campaignId:id,provider,freeTierConfirmed:true,...extra});
function seed(used){fs.writeFileSync(path.join(root,'live-campaign.json'),JSON.stringify({requestsAttempted:1}));fs.writeFileSync(path.join(root,'live-smoke.json'),JSON.stringify({requestsAttempted:1}));const budget=openBudget(root);for(let i=1;i<used;i++)budget.reserve('prior-'+i,1);}
const assess=text=>evaluate(text,{campaignId:'offline',model:COMPARISON_MODEL,sourcePath:'offline/raw-response.txt'});
beforeEach(()=>{root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-live-pattern-'));vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('No network in offline tests'));});
afterEach(()=>{vi.restoreAllMocks();const resolved=path.resolve(root);if(path.dirname(resolved)!==path.resolve(os.tmpdir())||!path.basename(resolved).startsWith('borsal-live-pattern-'))throw Error('Unsafe cleanup');fs.rmSync(resolved,{recursive:true,force:true});});
describe('One-request live pattern experiment: offline safety',()=>{
  it('uses a compact schema-derived contract without fixed templates or invented source properties',()=>{
    const prompt=JSON.stringify(messages());expect(prompt).toContain('borsal.design/0.1');expect(prompt).toContain('CuttingInstance=');expect(prompt).toContain('P=[N,N]');expect(prompt).toContain('seamAllowanceCm');expect(prompt).toContain('OMIT that field');expect(prompt).not.toContain('superRefine');
    expect(prompt).not.toContain('01-shoulder-01');expect(Buffer.byteLength(prompt)).toBeLessThan(17000);
    expect(fabric()).toEqual({id:'synthetic-scrap',geometry:{polygonCm:require('../pattern-feasibility/synthetic-fabric.json').polygonCm}});
    expect(sourceConcept().data.authorship).toBe('HUMAN');expect(conservativeMaxNeurons).toBeCloseTo(1898.35392,5);expect(conservativeMaxNeurons).toBeLessThan(2000);expect(GENERATION_PARAMETERS.max_tokens).toBe(6144);
  });
  it('passes raw model data through 5C and screens geometry without promoting unknown properties',()=>{
    const raw=authored(),out=assess(JSON.stringify(raw));expect(out.rawParsed).toEqual(raw);expect(out.adapter.sourceSnapshot.proposal.design.data).toEqual(raw.design);
    expect(out.status).toBe('CONCEPT_ONLY');expect(out.verdict).toBe('UNVERIFIED');expect(out.adapter.draft.bridge.missingRequirements.map(m=>m.code)).toContain('CONFIRMED_FABRIC_REQUIRED');
    expect(out.geometryScreening.status).toBe('LAYOUT_FOUND');expect(out.geometryScreening.validationStatus).toBe('UNVERIFIED');expect(out.geometryScreening.validatorEvidence.geometryStatus).toBe('PASS');expect(out.previewSvg).toContain('Geometry screening ONLY');
  });
  it('does not fill missing properties or treat invalid JSON as a repair opportunity',()=>{
    const raw=authored();delete raw.design.technical.bom[0].material.specs;const out=assess(JSON.stringify(raw));expect(out.status).toBe('CONCEPT_ONLY');expect(out.geometryScreening.status).toBe('LAYOUT_FOUND');
    expect(out.adapter.draft.unresolved.some(m=>m.path?.includes('specs'))).toBe(true);
    const bad=assess('```json\n{}\n```');expect(bad.status).toBe('REJECTED');expect(bad.errors[0].code).toBe('INVALID_JSON');expect(bad.adapter).toBe(null);
  });
  it('rejects root-level fabricated stock/fabric/approval fields rather than accepting an override',()=>{
    for(const extra of [{stock:{available:true}},{fabric:{confirmed:true}},{manufacturingVerified:true}]){const out=assess(JSON.stringify({...authored(),...extra}));expect(out.status).toBe('REJECTED');expect(out.adapter).toBe(null);}
  });
  it('keeps missing proposal geometry concept-only and invalid cutting polygons rejected',()=>{
    const empty=assess('{}');expect(empty.status).toBe('CONCEPT_ONLY');expect(empty.geometryScreening).toBe(null);expect(empty.previewSvg).toBe(null);
    const raw=authored();raw.instances[0].cuttingPolygonCm=[[0,0],[6,4],[0,4],[6,0]];const bad=assess(JSON.stringify(raw));expect(bad.status).toBe('REJECTED');expect(bad.geometryScreening.status).toBe('NO_LAYOUT_FOUND');expect(bad.previewSvg).toBe(null);
  });
  it('never upgrades insufficient geometry or disconnected references into a complete proposal',()=>{
    const raw=authored();raw.instances[0].cuttingPolygonCm=[[0,0],[50,0],[0,50]];const out=assess(JSON.stringify(raw));expect(out.geometryScreening.reason).toBe('AREA_PRECHECK_FAILED');expect(out.verdict).toBe('FAIL');expect(out.adapter.verdict).toBe('UNVERIFIED');expect(out.manufacturingVerified).toBe(false);
    const r=authored();r.design.technical.assembly[0].threadBomId='missing';const bad=assess(JSON.stringify(r));expect(bad.status).toBe('REJECTED');expect(bad.previewSvg).toContain('Geometry screening ONLY');
  });
  it('records incomplete JSON, whitespace and provider finish/truncation metadata',async()=>{
    const p=fake('{"design":'+ ' '.repeat(2000));p.generate.mockResolvedValue({text:'{"design":'+ ' '.repeat(2000),httpStatus:200,usage:{completion_tokens:6144},finishReason:'length',truncated:true,outputTokenLimit:6144});
    const r=await run('truncated',p);expect(r.status).toBe('REJECTED');expect(r.diagnostics.incompleteJson).toBe(true);expect(r.diagnostics.excessiveWhitespace).toBe(true);expect(r.truncated).toBe(true);expect(r.finishReason).toBe('length');expect(p.generate).toHaveBeenCalledTimes(1);
  });
  it('saves raw response, errors, provenance, full evidence and openable geometry SVG',async()=>{
    const p=fake(),r=await run('artifacts',p),dir=path.join(root,'campaigns/artifacts');expect(r.mode).toBe('MOCK');expect(r.liveInferencePerformed).toBe(false);expect(r.repairs).toBe(0);expect(r.requestsDispatched).toBe(1);
    for(const file of ['lock.json','request.json','attempt-1.json','response.json','raw-response.txt','validation-errors.json','result.json','preview.svg'])expect(fs.existsSync(path.join(dir,file))).toBe(true);
    expect(fs.readFileSync(path.join(dir,'raw-response.txt'),'utf8')).toBe(JSON.stringify(authored()));const sharp=require('sharp'),meta=await sharp(path.join(dir,'preview.svg')).metadata();expect(meta.format).toBe('svg');expect(meta.width).toBeGreaterThan(0);expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it('reserves global slot and checkpoint BEFORE the one live transport call',async()=>{
    seed(8);const prior=fs.readFileSync(path.join(root,'request-budget/request-8.json'),'utf8'),p=fake('{}','LIVE');
    p.generate.mockImplementation(async()=>{expect(openBudget(root).used()).toBe(9);expect(JSON.parse(fs.readFileSync(path.join(root,'campaigns/one/attempt-1.json'),'utf8')).state).toBe('RESERVED_BEFORE_INFERENCE');return {text:'{}',httpStatus:200,usage:{neurons:5}};});
    const out=await run('one',p);expect(out.globalUsed).toBe(9);expect(p.generate).toHaveBeenCalledTimes(1);expect(out.liveInferencePerformed).toBe(true);expect(out.adapter.provenance.origin).toBe('SAVED_AI_OUTPUT');expect(fs.readFileSync(path.join(root,'request-budget/request-8.json'),'utf8')).toBe(prior);
  });
  it('never retries on provider authentication/quota/network failure; uncertainty consumes a slot',async()=>{
    seed(8);const p=fake('{}','LIVE');p.generate.mockRejectedValue(Object.assign(Error('SECRET_DETAIL'),{code:'QUOTA_OR_RATE_LIMIT',status:429}));const out=await run('quota',p);
    expect(out.status).toBe('PROVIDER_FAILED');expect(out.failure).toEqual({code:'QUOTA_OR_RATE_LIMIT',httpStatus:429});expect(out.globalUsed).toBe(9);expect(p.generate).toHaveBeenCalledTimes(1);expect(fs.readFileSync(path.join(root,'campaigns/quota/failure.json'),'utf8')).not.toContain('SECRET_DETAIL');
  });
  it('refuses duplicate campaigns without overwriting prior outputs',async()=>{
    const p=fake();await run('same',p);const file=path.join(root,'campaigns/same/result.json'),before=fs.readFileSync(file,'utf8');await expect(run('same',p)).rejects.toThrow('CAMPAIGN_ALREADY_EXISTS');expect(p.generate).toHaveBeenCalledTimes(1);expect(fs.readFileSync(file,'utf8')).toBe(before);
  });
  it('refuses a full shared budget and protects it across concurrent campaigns',async()=>{
    seed(29);const p=fake('{}','LIVE'),outcomes=await Promise.allSettled([run('last-a',p),run('last-b',p)]);expect(outcomes.filter(x=>x.status==='fulfilled')).toHaveLength(1);expect(p.generate).toHaveBeenCalledTimes(1);expect(openBudget(root).used()).toBe(30);
    await expect(run('over-cap',p)).rejects.toThrow('GLOBAL_REQUEST_LIMIT_REACHED');expect(p.generate).toHaveBeenCalledTimes(1);
  });
  it('keeps crash-reserved slots consumed and all old smoke locks unchanged',async()=>{
    seed(8);const lock=fs.readFileSync(path.join(root,'live-campaign.json'),'utf8');fs.writeFileSync(path.join(root,'request-budget/request-9.json'),'');const out=await run('after-crash',fake('{}','LIVE'));
    expect(out.globalUsed).toBe(10);expect(fs.readFileSync(path.join(root,'request-budget/request-9.json'),'utf8')).toBe('');expect(fs.readFileSync(path.join(root,'live-campaign.json'),'utf8')).toBe(lock);
  });
  it('rejects missing free confirmation, wrong model, unsafe IDs and reset/retry CLI flags',async()=>{
    const p=fake('{}','LIVE');await expect(run('no-free',p,{freeTierConfirmed:false})).rejects.toThrow('LIVE_SAFETY_GATE_FAILED');
    await expect(run('wrong',{...p,model:'unapproved'})).rejects.toThrow('LIVE_SAFETY_GATE_FAILED');await expect(run('../escape',p)).rejects.toThrow('INVALID_CAMPAIGN_ID');expect(p.generate).not.toHaveBeenCalled();
    for(const arg of ['--retry','--repair','--force-reset','--max-requests=2','--model=other'])expect(()=>options(['--campaign=safe',arg])).toThrow();expect(options(['--campaign=safe','--live','--free-tier-confirmed'])).toEqual({campaignId:'safe',live:true,freeTierConfirmed:true});
  });
  it('redacts configured secrets from every saved artifact without printing credentials',async()=>{
    const secret='TOKEN_REDACTION_TEST_12345',p=fake(JSON.stringify({design:{name:secret}}));await run('redaction',p,{secrets:[secret]});
    for(const name of fs.readdirSync(path.join(root,'campaigns/redaction')))expect(fs.readFileSync(path.join(root,'campaigns/redaction',name),'utf8')).not.toContain(secret);
  });
});
