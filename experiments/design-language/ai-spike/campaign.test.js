import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Worker } = require('worker_threads');
const { executeCampaign, openBudget, legacyAccounting, validateCampaignId } = require('./campaign');
const { main } = require('./run');
const fixture = require('../examples/01-shoulder-01.json');
const { cloudflareProvider } = require('./provider');
let root;
const provider = (texts = []) => ({ mode: 'LIVE', name: 'mock live transport', model: 'test', generate: vi.fn(async () => ({ text: texts.shift() ?? '{}', usage: null })) });
const run = (campaignId, fake, extra = {}) => executeCampaign({ root, campaignId, briefId: 'simple-shoulder', provider: fake, ...extra });
const seedSmoke = () => {
  fs.writeFileSync(path.join(root, 'live-campaign.json'), JSON.stringify({ scope: 'ONE_APPROVED_LIVE_SMOKE_TEST', requestsAttempted: 1, approvedRequests: 1 }));
  fs.writeFileSync(path.join(root, 'live-smoke.json'), JSON.stringify({ requestsAttempted: 1 }));
};
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'borsal-campaign-'));
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('No network in campaign tests'));
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  const resolved = path.resolve(root);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('borsal-campaign-')) throw new Error('Unsafe cleanup');
  fs.rmSync(resolved, { recursive: true, force: true });
});

describe('Named experiment campaigns and shared budget', () => {
  it('preserves historical reservations byte-for-byte when request counting becomes informational',()=>{
    const old=openBudget(root);for(let i=0;i<20;i++)old.reserve('previous-'+i,1);
    const dir=path.join(root,'request-budget'),before=Object.fromEntries(fs.readdirSync(dir).map(name=>[name,fs.readFileSync(path.join(dir,name),'utf8')]));
    const resumed=openBudget(root);expect(resumed.used()).toBe(20);expect(resumed.limit).toBeNull();expect(resumed.reserve('new-authorized-slot',1)).toBe(21);
    for(const [name,bytes]of Object.entries(before))expect(fs.readFileSync(path.join(dir,name),'utf8')).toBe(bytes);
  });
  it('isolates named results and locks while preserving the smoke files unchanged', async () => {
    seedSmoke();
    const before = fs.readFileSync(path.join(root, 'live-campaign.json'), 'utf8');
    const smoke = fs.readFileSync(path.join(root, 'live-smoke.json'), 'utf8');
    const a = await run('first', provider([JSON.stringify(fixture)]));
    const b = await run('second', provider([JSON.stringify(fixture)]));
    expect(a.requestsDispatched).toBe(1); expect(b.requestsDispatched).toBe(1);
    for (const id of ['first', 'second']) for (const file of ['lock.json', 'result.json', 'checkpoint-1.json', 'attempt-1.json']) expect(fs.existsSync(path.join(root, 'campaigns', id, file))).toBe(true);
    expect(fs.readFileSync(path.join(root, 'live-campaign.json'), 'utf8')).toBe(before);
    expect(fs.readFileSync(path.join(root, 'live-smoke.json'), 'utf8')).toBe(smoke);
    expect(openBudget(root).used()).toBe(3);
  });
  it('rejects duplicate IDs without overwriting any existing artifacts', async () => {
    const fake = provider([JSON.stringify(fixture)]);
    await run('same', fake);
    const before = fs.readFileSync(path.join(root, 'campaigns/same/result.json'), 'utf8');
    await expect(run('same', fake)).rejects.toThrow('CAMPAIGN_ALREADY_EXISTS');
    expect(fs.readFileSync(path.join(root, 'campaigns/same/result.json'), 'utf8')).toBe(before);
    expect(fake.generate).toHaveBeenCalledTimes(1);
  });
  it.each(['../escape', '..', '.', '/absolute', 'a/b', 'a\\b', 'C:drive', 'bad.id', '', 'UPPER', 'con', 'nul', 'com1', 'lpt1', 'x'.repeat(65)])('rejects unsafe campaign ID %s', (id) => expect(() => validateCampaignId(id)).toThrow());
  it('imports prior design attempts and counts the smoke only once', () => {
    seedSmoke();
    fs.writeFileSync(path.join(root, 'live-run.json'), JSON.stringify({ mode: 'LIVE', requests: 4 }));
    expect(legacyAccounting(root).legacyRequests).toBe(5);
    expect(openBudget(root).used()).toBe(5);
  });
  it('fails closed if an old lock has no recoverable attempted counter', () => {
    fs.writeFileSync(path.join(root, 'live-campaign.json'), JSON.stringify({ maxRequests: 12 }));
    expect(openBudget(root).used()).toBe(12);
  });
  it('continues recording requests beyond thirty across campaign IDs and process restarts', () => {
    seedSmoke();
    for (let i = 0; i < 29; i++) openBudget(root).reserve('campaign-' + i, 1);
    expect(openBudget(root).used()).toBe(30);
    expect(openBudget(root).reserve('new-name', 1)).toBe(31);expect(openBudget(root).used()).toBe(31);expect(openBudget(root).limit).toBeNull();
  });
  it('counts a crash-created empty reservation file and refuses to reset it', () => {
    openBudget(root);
    fs.writeFileSync(path.join(root, 'request-budget/request-1.json'), '');
    const next = openBudget(root).reserve('after-crash', 1);
    expect(next).toBe(2);
    expect(openBudget(root).used()).toBe(2);
    expect(fs.readFileSync(path.join(root, 'request-budget/request-1.json'), 'utf8')).toBe('');
  });
  it('checkpoints and reserves the global slot before calling inference', async () => {
    const fake = provider();
    fake.generate.mockImplementation(async () => {
      const p = path.join(root, 'campaigns/before-inference');
      const checkpoint = JSON.parse(fs.readFileSync(path.join(p, 'checkpoint-1.json'), 'utf8'));
      expect(checkpoint.requests).toBe(1);
      expect(JSON.parse(fs.readFileSync(path.join(p, 'attempt-1.json'), 'utf8')).globalSlot).toBe(1);
      expect(openBudget(root).used()).toBe(1);
      throw new Error('Simulated uncertain network/crash outcome');
    });
    const report = await run('before-inference', fake);
    expect(report.status).toBe('STOPPED_PROVIDER_ERROR');
    expect(openBudget(root).used()).toBe(1);
    await expect(run('before-inference', fake)).rejects.toThrow();
  });
  it('does not permit changed historical accounting to reset the budget', () => {
    seedSmoke(); openBudget(root);
    fs.writeFileSync(path.join(root, 'live-smoke.json'), JSON.stringify({ requestsAttempted: 0 }));
    expect(() => openBudget(root)).toThrow('BUDGET_BASELINE_MISMATCH');
  });
  it('selects only one brief and allows at most one repair', async () => {
    const fake = provider(['not-json', JSON.stringify(fixture)]);
    const result = await run('one-brief', fake);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].brief.id).toBe('simple-shoulder');
    expect(result.initialRequests).toBe(1); expect(result.repairRequests).toBe(1);
    expect(result.requestsDispatched).toBe(2);
    expect(fake.generate).toHaveBeenCalledTimes(2);
    const artifact = JSON.parse(fs.readFileSync(path.join(root, 'campaigns/one-brief/result.json'), 'utf8'));
    expect(artifact.results[0].attempts[0].text).toBe('not-json');
    expect(artifact.results[0].attempts[0].automated.errors[0].code).toBe('invalid_json');
  });
  it('never exceeds two requests even if both outputs fail', async () => {
    const fake = provider([]); const result = await run('two-invalid', fake);
    expect(result.results[0].status).toBe('INVALID_OUTPUT');
    expect(fake.generate).toHaveBeenCalledTimes(2);
    await expect(run('too-many', fake, { maxRequests: 3 })).rejects.toThrow();
  });
  it('records concurrent campaigns beyond the former shared ceiling', async () => {
    fs.writeFileSync(path.join(root, 'live-run.json'), JSON.stringify({ mode: 'LIVE', requests: 11 }));
    for(let i=11;i<29;i++)openBudget(root).reserve('existing-'+i,1);
    const fake = provider([JSON.stringify(fixture), JSON.stringify(fixture)]);
    const outcomes = await Promise.allSettled([run('concurrent-a', fake), run('concurrent-b', fake)]);
    expect(outcomes.filter((r) => r.status === 'fulfilled')).toHaveLength(2);
    expect(fake.generate).toHaveBeenCalledTimes(2);
    expect(openBudget(root).used()).toBe(31);
  });
  it('records every concurrent request exactly once across actual worker threads', async () => {
    const modulePath = require.resolve('./campaign');
    const tasks = Array.from({ length: 3 }, (_, worker) => new Promise((resolve, reject) => {
      const child = new Worker(
        "const {parentPort,workerData}=require('worker_threads'); const {openBudget}=require(workerData.modulePath); let reserved=0; for(let i=0;i<30;i++){try{openBudget(workerData.root).reserve('worker-'+workerData.worker,i+1);reserved++;}catch{break;}} parentPort.postMessage(reserved);",
        { eval: true, workerData: { modulePath, root, worker } });
      child.once('message', resolve); child.once('error', reject);
    }));
    const counts = await Promise.all(tasks);
    expect(counts.reduce((n, c) => n + c, 0)).toBe(90);
    expect(openBudget(root).used()).toBe(90);
  });
  it('extends an existing twelve-slot ledger without resetting baseline, reservations or artifacts',()=>{
    seedSmoke();const budget=openBudget(root);for(let i=1;i<12;i++)budget.reserve('old-'+i,1);
    const directory=path.join(root,'request-budget'),before=Object.fromEntries(fs.readdirSync(directory).map(f=>[f,fs.readFileSync(path.join(directory,f),'utf8')]));
    const reopened=openBudget(root);expect(reopened.limit).toBeNull();expect(reopened.used()).toBe(12);expect(reopened.reserve('explicit-future-authorization-needed',1)).toBe(13);
    for(const [f,bytes]of Object.entries(before))expect(fs.readFileSync(path.join(directory,f),'utf8')).toBe(bytes);
    expect(JSON.parse(before['baseline.json']).maxRequests).toBe(12);expect(reopened.used()).toBe(13);
  });
  it('rejects unnamed live CLI calls and any reset option before network access', async () => {
    await expect(main(['--live', '--free-tier-confirmed'])).rejects.toThrow();
    await expect(main(['--live', '--force-reset', '--campaign=safe', '--brief=simple-shoulder'])).rejects.toThrow();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it('retains HTTP, Neuron usage and truncation metadata from a mocked provider response', async () => {
    const adapter = cloudflareProvider({ accountId: 'test', apiToken: 'test', freeTierConfirmed: true,
      fetchImpl: async () => new Response(JSON.stringify({ success: true, result: { response: '{}', finish_reason: 'length', usage: { prompt_tokens: 10, completion_tokens: 6144, total_tokens: 6154, neurons: 42 } } }), { status: 200 }),
    });
    const result = await run('metadata', adapter);
    expect(result.results[0].attempts[0]).toMatchObject({ httpStatus: 200, finishReason: 'length', truncated: true, usage: { neurons: 42 } });
  });
});
