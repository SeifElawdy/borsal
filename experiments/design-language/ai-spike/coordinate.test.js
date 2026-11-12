import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { z } = require('zod');
const { designSchema } = require('../schema');
const { contractText, initialMessages, repairMessages } = require('./prompt');
const { diagnoseOutput, assess, runExperiment } = require('./harness');
const { executeCampaign, openBudget } = require('./campaign');
const briefs = require('./briefs.json');
const old = require('./fixtures/shoulder-002.json');
const fixture = require('../examples/01-shoulder-01.json');
const pointSchema = designSchema.shape.technical.shape.patternPieces.element.shape.outline.shape.start;
const temporary = [];
beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network forbidden in offline tests'));
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  for (const directory of temporary.splice(0)) {
    const resolved = path.resolve(directory);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('borsal-coordinate-')) throw new Error('Unsafe cleanup');
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

describe('Explicit coordinate instructions and repair', () => {
  it('distinguishes the required numeric array from the forbidden coordinate object', () => {
    const text = contractText();
    expect(text).toContain('JSON array of exactly two finite numbers');
    expect(text).toContain('Correct: [12.5, 8.0]');
    expect(text).toContain('Incorrect: {"x":12.5,"y":8.0}');
    expect(pointSchema.safeParse([12.5, 8]).success).toBe(true);
    expect(pointSchema.safeParse({ x: 12.5, y: 8 }).success).toBe(false);
  });
  it('covers every actual coordinate field discovered from the unchanged Zod schema', () => {
    const found = new Set();
    function visit(node, location = '') {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'array' && Array.isArray(node.items)) {
        if (node.items.length === 2 && node.items.every((item) => item.type === 'number')) found.add(location);
        else node.items.forEach((item) => visit(item, location + '[]'));
      } else if (node.type === 'array') visit(node.items, location + '[]');
      if (node.properties) for (const [key, value] of Object.entries(node.properties)) visit(value, location ? location + '.' + key : key);
      for (const option of node.oneOf || node.anyOf || []) visit(option, location);
    }
    visit(z.toJSONSchema(designSchema, { target: 'draft-7' }));
    expect(found.size).toBe(9);
    const text = contractText();
    for (const location of found) expect(text).toContain(location);
  });
  it.each([[1], [1, 2, 3], ['1', 2], [Infinity, 2], [1, NaN]])('does not weaken the actual point schema for %j', (...values) => {
    expect(pointSchema.safeParse(values).success).toBe(false);
  });
  it('preserves original brief, raw output and exact failing paths in concise actionable repair', () => {
    const first = old.results[0].attempts[0];
    const initial = initialMessages(old.results[0].brief);
    const messages = repairMessages(initial, first.text, first.automated.errors);
    expect(messages.slice(0, 2)).toEqual(initial);
    expect(messages[1].content).toContain(JSON.stringify(old.results[0].brief));
    expect(messages[2].content).toBe(first.text);
    expect(messages).toHaveLength(4);
    expect(messages[3].content).toContain('every point must be [x,y], exactly two finite numbers');
    expect(messages[3].content).toContain('without explanatory text or Markdown');
    expect(messages[3].content).toContain('unsupported feature; do not remove intent');
    expect(messages[3].content).toContain('Close outlines and the root JSON object');
    for (const error of first.automated.errors) expect(messages[3].content).toContain(JSON.stringify(error.path));
    expect(messages.filter((m) => m.content === initial[0].content)).toHaveLength(1);
  });
  it('retains closure/reference and technical creative-coverage guidance', () => {
    const text = contractText();
    expect(text).toContain('final segment.to equals outline.start');
    expect(text).toContain('Every edgeId must match a segment.id');
    expect(text).toContain('SEAM/ATTACH require threadBomId pointing to a THREAD BOM entry');
    expect(text).toContain('Requested external straps/buttons need linked BOM materials and body-mounted assembly');
    expect(text).toContain('honest PARTIAL/UNSUPPORTED limitation');
  });
});

describe('Non-mutating output diagnostics', () => {
  it('reports the actual historical whitespace-heavy, unclosed repair without correcting it', () => {
    const text = old.results[0].attempts[1].text;
    const diagnostics = diagnoseOutput(text);
    expect(diagnostics).toMatchObject({ validJson: false, excessiveWhitespace: true, incompleteJson: true, characters: 16813, utf8Bytes: 16813, trailingWhitespaceCharacters: 14653, unclosedContainers: 1 });
    expect(assess(text, briefs[0]).validJson).toBe(false);
    expect(text).toBe(old.results[0].attempts[1].text);
  });
  it('distinguishes complete JSON with excessive padding from incomplete JSON', () => {
    const text = '{"ok":true}' + ' '.repeat(2048);
    expect(diagnoseOutput(text)).toMatchObject({ validJson: true, incompleteJson: false, excessiveWhitespace: true, trailingWhitespaceCharacters: 2048 });
  });
  it('does not label normal pretty-printed valid JSON as excessive whitespace', () => {
    const text = JSON.stringify(fixture, null, 2);
    expect(diagnoseOutput(text)).toMatchObject({ validJson: true, incompleteJson: false, excessiveWhitespace: false });
  });
  it('handles quoted delimiters and escaped quotes/backslashes without false incompleteness', () => {
    const text = JSON.stringify({ label: 'braces } ] and quote " and slash ' + String.fromCharCode(92), values: [] });
    expect(diagnoseOutput(text)).toMatchObject({ validJson: true, incompleteJson: false, unclosedContainers: 0, unterminatedString: false });
  });
  it('detects an unterminated string and an unclosed container', () => {
    expect(diagnoseOutput('{"label":"unfinished')).toMatchObject({ validJson: false, incompleteJson: true, unterminatedString: true, unclosedContainers: 1 });
  });
  it('distinguishes malformed delimiters from merely unfinished JSON', () => {
    expect(diagnoseOutput('{"label":[}')).toMatchObject({ validJson: false, incompleteJson: false, mismatchedDelimiters: true });
  });
  it('records provider truncation/finish metadata and diagnostics with exact raw text', async () => {
    const text = old.results[0].attempts[1].text;
    const provider = { mode: 'MOCK', name: 'offline', model: 'none', generate: vi.fn(async () => ({ text, httpStatus: 200, finishReason: 'length', truncated: true, outputTokenLimit: 6144, usage: { completion_tokens: 6144 } })) };
    const report = await runExperiment({ provider, briefs: [briefs[0]], maxRequests: 1 });
    expect(report.results[0].attempts[0]).toMatchObject({ text, finishReason: 'length', truncated: true, outputTokenLimit: 6144, outputDiagnostics: { excessiveWhitespace: true, incompleteJson: true } });
    expect(provider.generate).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it('does not convert coordinate objects or replace existing validation results', async () => {
    const text = old.results[0].attempts[0].text;
    const provider = { mode: 'MOCK', name: 'offline', model: 'none', generate: async () => ({ text }) };
    const report = await runExperiment({ provider, briefs: [briefs[0]], maxRequests: 1 });
    const attempt = report.results[0].attempts[0];
    expect(attempt.text).toBe(text);
    expect(attempt.automated.errors).toEqual(old.results[0].attempts[0].automated.errors);
    expect(attempt.automated.proposal.technical.patternPieces[0].outline.start).toEqual({ x: 0, y: 0 });
  });
  it('keeps smoke locks, shared reservations and the one-repair cap intact with diagnostics', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'borsal-coordinate-')); temporary.push(root);
    const smoke = JSON.stringify({ scope: 'ONE_APPROVED_LIVE_SMOKE_TEST', requestsAttempted: 1 });
    fs.writeFileSync(path.join(root, 'live-campaign.json'), smoke);
    fs.writeFileSync(path.join(root, 'live-smoke.json'), JSON.stringify({ requestsAttempted: 1 }));
    const provider = { mode: 'LIVE', name: 'mock transport', model: 'none', generate: vi.fn(async () => ({ text: old.results[0].attempts[1].text, finishReason: 'length', truncated: true })) };
    const report = await executeCampaign({ root, campaignId: 'diagnostic-test', briefId: 'simple-shoulder', provider });
    expect(report.requestsDispatched).toBe(2);
    expect(provider.generate).toHaveBeenCalledTimes(2);
    expect(openBudget(root).used()).toBe(3);
    expect(fs.readFileSync(path.join(root, 'live-campaign.json'), 'utf8')).toBe(smoke);
    await expect(executeCampaign({ root, campaignId: 'diagnostic-test', briefId: 'simple-shoulder', provider })).rejects.toThrow('CAMPAIGN_ALREADY_EXISTS');
    expect(provider.generate).toHaveBeenCalledTimes(2);
    expect(report.results[0].attempts.every((a) => a.outputDiagnostics.excessiveWhitespace)).toBe(true);
  });
});
