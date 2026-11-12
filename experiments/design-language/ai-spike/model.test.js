import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
const { cloudflareProvider, MODEL, COMPARISON_MODEL, GENERATION_PARAMETERS } = require('./provider');
const { parseOptions } = require('./run');
const { runExperiment } = require('./harness');
const { initialMessages } = require('./prompt');
const briefs = require('./briefs.json');
const previous = require('./results/campaigns/phase2b-simple-shoulder-003/prompt-snapshot.json');
const firstBrief = briefs.find((b) => b.id === 'simple-shoulder');
const response = () => new Response(JSON.stringify({ success: true, result: { response: '{}', finish_reason: 'stop', usage: { prompt_tokens: 10, completion_tokens: 1, total_tokens: 11, neurons: 1 } } }), { status: 200 });
beforeEach(() => { vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network forbidden')); });
afterEach(() => { vi.restoreAllMocks(); });
const base = { accountId: 'fake-account', apiToken: 'fake-token', freeTierConfirmed: true };

describe('Allowlisted controlled model comparison', () => {
  it('preserves the existing default model and parameters', async () => {
    const fetchImpl = vi.fn(async () => response());
    const provider = cloudflareProvider({ ...base, fetchImpl });
    await provider.generate(initialMessages(firstBrief));
    expect(provider.model).toBe(MODEL);
    expect(fetchImpl.mock.calls[0][0]).toContain('/ai/run/' + MODEL);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toMatchObject({ response_format: { type: 'json_object' }, stream: false, temperature: 0.7, max_tokens: 6144 });
  });
  it('selects exactly the approved 70B endpoint and sends byte-identical message content', async () => {
    const fetchImpl = vi.fn(async () => response());
    const provider = cloudflareProvider({ ...base, model: COMPARISON_MODEL, fetchImpl });
    await provider.generate(initialMessages(firstBrief));
    expect(provider.model).toBe(COMPARISON_MODEL);
    expect(fetchImpl.mock.calls[0][0]).toContain('/ai/run/' + COMPARISON_MODEL);
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.messages).toEqual(previous.initialMessages);
    const { messages, ...parameters } = body;
    expect(parameters).toEqual(GENERATION_PARAMETERS);
  });
  it('rejects arbitrary models before any network call', () => {
    expect(() => cloudflareProvider({ ...base, model: '@cf/unapproved/model' })).toThrow('MODEL_NOT_APPROVED');
    expect(() => cloudflareProvider({ ...base, model: '../../other-endpoint' })).toThrow('MODEL_NOT_APPROVED');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it('requires explicit free-tier confirmation for the comparison model', () => {
    expect(() => cloudflareProvider({ ...base, model: COMPARISON_MODEL, freeTierConfirmed: false })).toThrow('LIVE_TEST_BLOCKED_FREE_TIER_UNVERIFIED');
  });
  it('keeps CLI defaults but permits an explicit single-request comparison', () => {
    const args = ['--campaign=safe', '--brief=simple-shoulder'];
    expect(parseOptions(args)).toMatchObject({ model: MODEL, maxRequests: 2 });
    expect(parseOptions([...args, '--model=' + COMPARISON_MODEL, '--max-requests=1'])).toMatchObject({ model: COMPARISON_MODEL, maxRequests: 1 });
    expect(() => parseOptions([...args, '--model=' + COMPARISON_MODEL])).toThrow('COMPARISON_REQUIRES_ONE_REQUEST');
    expect(() => parseOptions([...args, '--model=' + COMPARISON_MODEL, '--max-requests=2'])).toThrow();
  });
  it.each(['0', '3', 'NaN', '-1'])('rejects invalid request budget %s', (value) => {
    expect(() => parseOptions(['--campaign=safe', '--brief=simple-shoulder', '--max-requests=' + value])).toThrow();
  });
  it('rejects duplicate model/budget options rather than silently overriding them', () => {
    const args = ['--campaign=safe', '--brief=simple-shoulder'];
    expect(() => parseOptions([...args, '--model=' + MODEL, '--model=' + COMPARISON_MODEL])).toThrow();
    expect(() => parseOptions([...args, '--max-requests=1', '--max-requests=2'])).toThrow();
  });
  it('records exact model/parameters and sends no repair for an invalid response', async () => {
    const fetchImpl = vi.fn(async () => response());
    const provider = cloudflareProvider({ ...base, model: COMPARISON_MODEL, fetchImpl });
    const report = await runExperiment({ provider, briefs: [firstBrief], maxRequests: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(report.model).toBe(COMPARISON_MODEL);
    expect(report.requests).toBe(1); expect(report.initialRequests).toBe(1); expect(report.repairRequests).toBe(0);
    expect(report.generationParameters).toEqual({ ...GENERATION_PARAMETERS, timeoutMs: 60000 });
    expect(report.results[0].automated.schemaValid).toBe(false);
  });
  it('does not retry or fall back after a provider error', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ success: false, errors: [{ code: 10000 }] }), { status: 403 }));
    const provider = cloudflareProvider({ ...base, model: COMPARISON_MODEL, fetchImpl });
    const report = await runExperiment({ provider, briefs: [firstBrief], maxRequests: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toContain(COMPARISON_MODEL);
    expect(report.repairRequests).toBe(0); expect(report.status).toBe('STOPPED_PROVIDER_ERROR');
  });
});
