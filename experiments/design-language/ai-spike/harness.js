const { designSchema, VERSION } = require('../schema');
const { initialMessages, repairMessages } = require('./prompt');

function assess(text, brief) {
  let proposal;
  try { proposal = JSON.parse(text); } catch {
    return { validJson: false, schemaValid: false, referencesValid: null, scrapStockValid: null, categoryMatchesBrief: null, limitationsRecorded: null, errors: [{ code: 'invalid_json', path: [], message: 'Return exactly one valid JSON object; no fences or commentary' }] };
  }
  const parsed = designSchema.safeParse(proposal);
  const errors = parsed.success ? [] : parsed.error.issues.map(({ code, path, message }) => ({ code, path, message }));
  const categoryMatchesBrief = proposal?.category === brief.category;
  if (parsed.success && !categoryMatchesBrief) errors.push({ code: 'brief_category_mismatch', path: ['category'], message: 'Required category: ' + brief.category });
  const limitations = Array.isArray(proposal?.limitations) ? proposal.limitations : null;
  return {
    validJson: true, schemaValid: parsed.success,
    referencesValid: parsed.success ? true : errors.some((e) => /reference|belong to exactly one/.test(e.message)) ? false : null,
    scrapStockValid: parsed.success ? true : errors.some((e) => /SCRAP|scrap|STOCK/.test(e.message) || e.path.includes('source')) ? false : null,
    categoryMatchesBrief,
    limitationsRecorded: limitations ? limitations.length : null,
    declaredPartial: limitations?.filter((item) => item?.status === 'PARTIAL') || [],
    declaredUnsupported: limitations?.filter((item) => item?.status === 'UNSUPPORTED') || [],
    // Retain the exact parsed input; do not substitute Zod's trimmed/transformed output.
    proposal, errors,
  };
}
// Observation only: never trim, coerce, complete or otherwise repair the response.
function diagnoseOutput(text) {
  const whitespaceCharacters = (text.match(/\s/g) || []).length;
  const trailingWhitespaceCharacters = text.length - text.trimEnd().length;
  let validJson = true;
  try { JSON.parse(text); } catch { validJson = false; }
  let inString = false; let escaped = false; let mismatched = false;
  const stack = [];
  for (const char of text) {
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === '{' || char === '[') stack.push(char);
    else if (char === '}' || char === ']') {
      if (stack.pop() !== (char === '}' ? '{' : '[')) mismatched = true;
    }
  }
  const whitespaceFraction = text.length ? whitespaceCharacters / text.length : 0;
  return {
    characters: text.length, utf8Bytes: Buffer.byteLength(text, 'utf8'), validJson,
    whitespaceCharacters, trailingWhitespaceCharacters, whitespaceFraction,
    // Conservative reporting heuristic, not proof of a model loop.
    excessiveWhitespace: whitespaceCharacters >= 1024 && whitespaceFraction >= 0.8,
    incompleteJson: !validJson && !mismatched && (stack.length > 0 || inString || !text.trim()),
    unclosedContainers: stack.length, unterminatedString: inString, mismatchedDelimiters: mismatched,
  };
}

function humanReview() {
  return { status: 'PENDING', creativeIntentPreserved: null, missingSimplifiedOrHallucinatedFeatures: null, diversityAssessment: null, reviewer: null, notes: null };
}
async function runExperiment({ provider, briefs, maxRequests = 12, onCheckpoint = () => {} }) {
  if (!Array.isArray(briefs) || briefs.length > 6 || new Set(briefs.map((b) => b.id)).size !== briefs.length) throw new Error('Use at most six unique briefs');
  if (!Number.isInteger(maxRequests) || maxRequests < 1 || maxRequests > 12) throw new Error('Maximum request budget is twelve');
  const report = {
    mode: provider.mode, provider: provider.name, model: provider.model, schemaVersion: VERSION,
    generationParameters: provider.generationParameters || null,
    status: 'RUNNING', liveInferencePerformed: false, requests: 0, initialRequests: 0, repairRequests: 0,
    results: briefs.map((brief) => ({ brief, status: 'NOT_RUN', attempts: [], automated: null, humanReview: humanReview() })),
    humanDiversityReview: { status: 'PENDING', assessment: null }, manufacturingVerified: false,
  };
  for (const result of report.results) {
    let messages = initialMessages(result.brief);
    for (let attempt = 0; attempt < 2; attempt++) {
      if (report.requests >= maxRequests) { report.status = 'REQUEST_LIMIT_REACHED'; onCheckpoint(report); return report; }
      report.requests++;
      if (attempt === 0) report.initialRequests++; else report.repairRequests++;
      const record = { phase: attempt === 0 ? 'initial' : 'repair', usage: null };
      result.attempts.push(record);
      result.status = 'REQUESTED';
      // Count and persist BEFORE invoking the provider: uncertain/network failures consume budget too.
      onCheckpoint(report);
      try {
        const response = await provider.generate(messages);
        if (typeof response.text !== 'string') throw new Error('Invalid response');
        if (provider.mode === 'LIVE') report.liveInferencePerformed = true;
        record.httpStatus = response.httpStatus ?? null;
        record.finishReason = response.finishReason ?? null;
        record.outputTokenLimit = response.outputTokenLimit ?? null;
        record.truncated = response.truncated ?? null;
        record.text = response.text;
        record.outputDiagnostics = diagnoseOutput(response.text);
        record.usage = response.usage || null;
        record.automated = assess(response.text, result.brief);
        result.automated = record.automated;
        if (record.automated.schemaValid && record.automated.categoryMatchesBrief) { result.status = 'SCHEMA_VALID'; break; }
        result.status = 'INVALID_OUTPUT';
        if (attempt === 0) messages = repairMessages(messages, response.text, record.automated.errors);
      } catch (error) {
        record.failure = { code: typeof error.code === 'string' ? error.code : 'PROVIDER_FAILURE', status: error.status || null, providerCodes: error.providerCodes || [], ...(error.diagnostics ? { diagnostics: error.diagnostics } : {}) };
        result.status = 'PROVIDER_FAILED';
        report.status = 'STOPPED_PROVIDER_ERROR';
        // Stop on ALL provider failures, including authentication/quota; never auto-retry.
        onCheckpoint(report); return report;
      }
      onCheckpoint(report);
    }
  }
  report.status = 'COMPLETED'; onCheckpoint(report); return report;
}
function redact(value, secrets = []) {
  const active = secrets.filter((s) => typeof s === 'string' && s.length);
  const scrub = (item) => {
    if (typeof item === 'string') return active.reduce((text, secret) => text.replaceAll(secret, '[REDACTED]'), item);
    if (Array.isArray(item)) return item.map(scrub);
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([key, val]) => [scrub(key), scrub(val)]));
    return item;
  };
  return JSON.stringify(scrub(value), null, 2) + '\n';
}
module.exports = { assess, humanReview, runExperiment, redact, diagnoseOutput };
