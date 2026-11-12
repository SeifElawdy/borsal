import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
const { assess, runExperiment, redact } = require('./harness');
const { initialMessages, repairMessages } = require('./prompt');
const { cloudflareProvider, ProviderError, MODEL } = require('./provider');
const briefs = require('./briefs.json');
const { reserveCampaign } = require('./run');
const fs = require('fs');
const path = require('path');
const os = require('os');
// Existing manually authored JSON is a TEST FIXTURE ONLY, never a live prompt or claimed AI output.
const fixture = require('../examples/01-shoulder-01.json');
const validText = JSON.stringify(fixture);
const fakeProvider = (texts) => ({ mode: 'MOCK', name: 'test mock', model: 'none', generate: vi.fn(async () => ({ text: texts.shift() ?? '{}', usage: null })) });
const configured = (fetchImpl) => cloudflareProvider({ accountId: 'fake-account', apiToken: 'fake-secret', freeTierConfirmed: true, fetchImpl });
const envelope = (response, usage) => new Response(JSON.stringify({ success: true, result: { response, usage } }), { status: 200 });

beforeEach(() => { vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected network access in offline tests')); });
afterEach(() => { vi.restoreAllMocks(); });

describe('AI structural spike offline harness', () => {
  it('uses six distinct briefs balanced across simple, complex and new creative concepts', () => {
    expect(briefs).toHaveLength(6);
    expect(new Set(briefs.map((b) => b.id)).size).toBe(6);
    for (const difficulty of ['simple', 'complex', 'creative']) expect(briefs.filter((b) => b.difficulty === difficulty)).toHaveLength(2);
    expect(new Set(briefs.map((b) => b.category)).size).toBe(2);
    expect(briefs.every((b) => b.requirements.length > 0)).toBe(true);
  });
  it('parses valid JSON against the unchanged schema and preserves unsupported intent', () => {
    const result = assess(validText, briefs[0]);
    expect(result.validJson).toBe(true);
    expect(result.schemaValid).toBe(true);
    expect(result.referencesValid).toBe(true);
    expect(result.scrapStockValid).toBe(true);
    expect(result.proposal).toEqual(fixture);
    expect(result.declaredUnsupported).toEqual(fixture.limitations.filter((l) => l.status === 'UNSUPPORTED'));
  });
  it.each(['not json', '\x60\x60\x60json\n{}\n\x60\x60\x60'])('records invalid JSON without stripping fences or repairing locally', (text) => {
    const result = assess(text, briefs[0]);
    expect(result.validJson).toBe(false);
    expect(result.errors[0].code).toBe('invalid_json');
    expect(result.proposal).toBeUndefined();
  });
  it('records schema errors without changing the proposal', () => {
    const proposal = structuredClone(fixture);
    proposal.technical.overallDimensions.width = -3;
    const result = assess(JSON.stringify(proposal), briefs[0]);
    expect(result.validJson).toBe(true);
    expect(result.schemaValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.proposal.technical.overallDimensions.width).toBe(-3);
  });
  it('detects broken references', () => {
    const proposal = structuredClone(fixture);
    proposal.technical.assembly[0].sides[0].pieceId = 'missing-piece';
    const result = assess(JSON.stringify(proposal), briefs[0]);
    expect(result.schemaValid).toBe(false);
    expect(result.referencesValid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('missing-piece'))).toBe(true);
  });
  it('detects an invalid SCRAP/STOCK source', () => {
    const proposal = structuredClone(fixture);
    proposal.technical.bom[0].source.scrapId = 'other-scrap';
    const result = assess(JSON.stringify(proposal), briefs[0]);
    expect(result.schemaValid).toBe(false);
    expect(result.scrapStockValid).toBe(false);
  });
  it('reports absent limitations as a schema failure instead of filling them in', () => {
    const proposal = structuredClone(fixture); delete proposal.limitations;
    const result = assess(JSON.stringify(proposal), briefs[0]);
    expect(result.schemaValid).toBe(false);
    expect(result.limitationsRecorded).toBeNull();
    expect(result.proposal.limitations).toBeUndefined();
  });
  it('does not replace original text values with Zod-trimmed values', () => {
    const proposal = structuredClone(fixture); proposal.name = '  Untrimmed name  ';
    expect(assess(JSON.stringify(proposal), briefs[0]).proposal.name).toBe(proposal.name);
  });
  it('supplies the actual grammar and conventions without completed example answers', () => {
    const messages = initialMessages(briefs[4]);
    expect(messages[0].content).toContain('const designSchema');
    expect(messages[0].content).toContain('NOT_CHECKED');
    expect(messages[0].content).toContain('EVERY brief requirement');
    expect(JSON.stringify(messages)).not.toContain(fixture.name);
    expect(messages[1].content).toContain(briefs[4].requirements[0]);
  });
  it('constructs repair feedback with errors, previous output and original requirements intact', () => {
    const initial = initialMessages(briefs[0]);
    const errors = [{ code: 'custom', path: ['technical'], message: 'Unknown reference: lost' }];
    const repair = repairMessages(initial, 'original response', errors);
    expect(repair.slice(0, 2)).toEqual(initial);
    expect(repair[2]).toEqual({ role: 'assistant', content: 'original response' });
    expect(repair[3].content).toContain(JSON.stringify(errors));
    expect(repair[3].content).toContain('do not remove intent');
  });
  it('supports exactly one repair and keeps separate human-review fields pending', async () => {
    const provider = fakeProvider(['not-json', validText]);
    const report = await runExperiment({ provider, briefs: [briefs[0]] });
    expect(provider.generate).toHaveBeenCalledTimes(2);
    expect(report.requests).toBe(2);
    expect(report.initialRequests).toBe(1);
    expect(report.repairRequests).toBe(1);
    expect(report.results[0].status).toBe('SCHEMA_VALID');
    expect(report.results[0].humanReview.status).toBe('PENDING');
    expect(report.results[0].humanReview.creativeIntentPreserved).toBeNull();
    expect(report.humanDiversityReview.status).toBe('PENDING');
    expect(report.liveInferencePerformed).toBe(false);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it('never requests a third attempt for a brief', async () => {
    const provider = fakeProvider(['{}', '{}', validText]);
    const report = await runExperiment({ provider, briefs: [briefs[0]] });
    expect(provider.generate).toHaveBeenCalledTimes(2);
    expect(report.results[0].status).toBe('INVALID_OUTPUT');
  });
  it('caps the campaign at six initial requests and six repairs (twelve overall)', async () => {
    const provider = fakeProvider([]);
    const report = await runExperiment({ provider, briefs });
    expect(provider.generate).toHaveBeenCalledTimes(12);
    expect(report.initialRequests).toBe(6);
    expect(report.repairRequests).toBe(6);
    expect(report.results.every((r) => r.attempts.length === 2)).toBe(true);
  });
  it('enforces a smaller request budget before sending a repair', async () => {
    const provider = fakeProvider([]);
    const report = await runExperiment({ provider, briefs, maxRequests: 1 });
    expect(report.status).toBe('REQUEST_LIMIT_REACHED');
    expect(provider.generate).toHaveBeenCalledTimes(1);
    expect(report.repairRequests).toBe(0);
  });
  it('rejects more than six briefs or a budget over twelve before any call', async () => {
    const provider = fakeProvider([]);
    await expect(runExperiment({ provider, briefs: [...briefs, { ...briefs[0], id: 'seventh' }] })).rejects.toThrow();
    await expect(runExperiment({ provider, briefs, maxRequests: 13 })).rejects.toThrow();
    expect(provider.generate).not.toHaveBeenCalled();
  });
  it.each([['AUTHENTICATION_OR_PERMISSION', 403], ['QUOTA_OR_RATE_LIMIT', 429], ['PROVIDER_ERROR', 500]])('stops the entire campaign on %s without retry', async (code, status) => {
    const provider = fakeProvider([]);
    provider.generate.mockRejectedValueOnce(new ProviderError(code, status));
    const report = await runExperiment({ provider, briefs });
    expect(report.status).toBe('STOPPED_PROVIDER_ERROR');
    expect(report.requests).toBe(1);
    expect(report.repairRequests).toBe(0);
    expect(report.results[0].attempts[0].failure.code).toBe(code);
    expect(report.results[1].status).toBe('NOT_RUN');
    expect(provider.generate).toHaveBeenCalledTimes(1);
  });
  it('checkpoints the consumed request budget before invoking the provider', async () => {
    const snapshots = [];
    const provider = fakeProvider([validText]);
    provider.generate.mockImplementation(async () => { expect(snapshots[0]).toBe(1); return { text: validText, usage: { total_tokens: 42 } }; });
    const report = await runExperiment({ provider, briefs: [briefs[0]], onCheckpoint: (r) => snapshots.push(r.requests) });
    expect(report.results[0].attempts[0].usage).toEqual({ total_tokens: 42 });
  });
  it('redacts secrets containing JSON escape characters without corrupting saved JSON', () => {
    const secret = 'key-with-"quote';
    const saved = redact({ nested: [secret], [secret]: 'value' }, [secret]);
    expect(JSON.parse(saved)).toEqual({ nested: ['[REDACTED]'], '[REDACTED]': 'value' });
  });
  it('prevents campaign reruns from resetting the live request budget', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'borsal-ai-lock-'));
    const file = path.join(dir, 'live-campaign.json');
    try {
      reserveCampaign(dir);
      const before = fs.readFileSync(file, 'utf8');
      expect(() => reserveCampaign(dir)).toThrow();
      expect(fs.readFileSync(file, 'utf8')).toBe(before);
      expect(JSON.parse(before).maxRequests).toBe(12);
    } finally {
      const resolved = path.resolve(dir);
      if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('borsal-ai-lock-')) throw new Error('Unsafe cleanup path');
      fs.unlinkSync(file); fs.rmdirSync(resolved);
    }
  });
  it('redacts credentials recursively from saved results', () => {
    const saved = redact({ text: 'secret-token', nested: { key: 'account-id' }, failures: ['secret-token'] }, ['secret-token', 'account-id']);
    expect(saved).not.toContain('secret-token');
    expect(saved).not.toContain('account-id');
    expect(saved).toContain('[REDACTED]');
  });
});

describe('Native-fetch Cloudflare text adapter (mock HTTP only)', () => {
  it('requires both credentials and explicit free-tier confirmation before network access', () => {
    expect(() => cloudflareProvider({})).toThrow('LIVE_TEST_BLOCKED_MISSING_CREDENTIALS');
    expect(() => cloudflareProvider({ accountId: 'a', apiToken: 'k' })).toThrow('LIVE_TEST_BLOCKED_FREE_TIER_UNVERIFIED');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it('uses the fixed text model, JSON mode and records only supplied numeric usage', async () => {
    const fetchImpl = vi.fn(async () => envelope(validText, { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30, sensitiveExtra: 'do not save' }));
    const result = await configured(fetchImpl).generate(initialMessages(briefs[0]));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toContain(MODEL);
    expect(url).not.toContain('flux');
    expect(JSON.parse(options.body).response_format).toEqual({ type: 'json_object' });
    expect(result.text).toBe(validText);
    expect(result.usage).toEqual({ prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 });
  });
  it('accepts a provider structured-object response and leaves missing usage unknown', async () => {
    const result = await configured(vi.fn(async () => envelope(fixture))).generate([]);
    expect(JSON.parse(result.text)).toEqual(fixture);
    expect(result.usage).toBeNull();
  });
  it.each([401, 403, 429, 500])('handles HTTP %s without exposing remote text or retrying', async (status) => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ success: false, errors: [{ code: 10000, message: 'fake-secret sensitive error' }] }), { status }));
    try { await configured(fetchImpl).generate([]); throw new Error('Expected failure'); }
    catch (error) { expect(error).toBeInstanceOf(ProviderError); expect(error.message).not.toContain('fake-secret'); expect(error.status).toBe(status); }
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('stops on provider quota-like errors in an HTTP 200 envelope', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ success: false, errors: [{ code: 3036 }] }), { status: 200 }));
    await expect(configured(fetchImpl).generate([])).rejects.toMatchObject({ code: 'PROVIDER_ERROR', providerCodes: [3036] });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('handles malformed provider envelopes', async () => {
    await expect(configured(vi.fn(async () => new Response('not-json'))).generate([])).rejects.toMatchObject({ code: 'INVALID_PROVIDER_ENVELOPE' });
    await expect(configured(vi.fn(async () => envelope(null))).generate([])).rejects.toMatchObject({ code: 'INVALID_PROVIDER_ENVELOPE' });
  });
  it('handles network failures without exposing details or retrying', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('fake-secret network details'); });
    await expect(configured(fetchImpl).generate([])).rejects.toMatchObject({ code: 'NETWORK_OR_TIMEOUT' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
