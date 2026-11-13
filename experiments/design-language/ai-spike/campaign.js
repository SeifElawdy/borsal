// Named, append-only experiment artifacts and atomic shared request reservations.
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { runExperiment, redact } = require('./harness');
const briefs = require('./briefs.json');
// Owner-approved project cap. This is a ceiling, not inference authorization.
// Raising it beyond 20 requires another explicit owner decision.
const LIMIT = 20;
// Historical accounting is immutable: never rewrite an existing 12-slot baseline.
const LEGACY_LIMIT = 12;

function validateCampaignId(id) {
  if (typeof id !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(id) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(id)) throw new Error('INVALID_CAMPAIGN_ID');
  return id;
}
function writeNew(file, value, secrets = []) {
  const fd = fs.openSync(file, 'wx');
  try { fs.writeFileSync(fd, redact(value, secrets)); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
}
function legacyAccounting(root) {
  const names = ['live-campaign.json', 'live-smoke.json', 'live-run.json'];
  const data = {}; const hashes = {};
  for (const name of names) if (fs.existsSync(path.join(root, name))) {
    const bytes = fs.readFileSync(path.join(root, name));
    data[name] = JSON.parse(bytes.toString('utf8'));
    hashes[name] = createHash('sha256').update(bytes).digest('hex');
  }
  const counter = (value) => {
    if (value === undefined) return 0;
    if (!Number.isInteger(value) || value < 0 || value > LEGACY_LIMIT) throw new Error('INVALID_LEGACY_COUNTER');
    return value;
  };
  const lock = data['live-campaign.json'];
  const run = data['live-run.json'];
  const design = run?.mode === 'LIVE' ? (run.requests === undefined ? LEGACY_LIMIT : counter(run.requests)) : 0;
  const smoke = counter(data['live-smoke.json']?.requestsAttempted);
  // Smoke lock/result refer to the same request: count it once, conservatively inside the cap.
  let requests = Math.max(smoke + design, counter(lock?.requestsAttempted));
  if (lock && lock.requestsAttempted === undefined && run?.mode !== 'LIVE') requests = LEGACY_LIMIT;
  if (requests > LEGACY_LIMIT) throw new Error('LEGACY_BUDGET_EXCEEDED');
  return { maxRequests: LEGACY_LIMIT, legacyRequests: requests, hashes };
}
function openBudget(root) {
  const directory = path.join(root, 'request-budget');
  const baseline = legacyAccounting(root);
  fs.mkdirSync(directory, { recursive: true });
  if (fs.lstatSync(directory).isSymbolicLink()) throw new Error('INVALID_BUDGET_PATH');
  const file = path.join(directory, 'baseline.json');
  try { writeNew(file, baseline); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  // A partial/corrupt baseline or changed legacy counters fails closed; never reset it.
  if (fs.readFileSync(file, 'utf8') !== redact(baseline)) throw new Error('BUDGET_BASELINE_MISMATCH');
  const used = () => baseline.legacyRequests + Array.from({ length: LIMIT - baseline.legacyRequests }, (_, i) => i + baseline.legacyRequests + 1)
    .filter((slot) => fs.existsSync(path.join(directory, 'request-' + slot + '.json'))).length;
  return {
    limit: LIMIT,
    used,
    reserve(campaignId, sequence) {
      // Each exclusive file consumes one slot, even if a process crashes leaving it empty.
      for (let slot = baseline.legacyRequests + 1; slot <= LIMIT; slot++) {
        try {
          writeNew(path.join(directory, 'request-' + slot + '.json'), { campaignId, sequence, slot, reservedAt: new Date().toISOString() });
          return slot;
        } catch (error) { if (error.code !== 'EEXIST') throw error; }
      }
      throw new Error('GLOBAL_REQUEST_LIMIT_REACHED');
    },
  };
}
async function executeCampaign({ root, campaignId, briefId, provider, maxRequests = 2, secrets = [] }) {
  validateCampaignId(campaignId);
  if (![1, 2].includes(maxRequests)) throw new Error('CAMPAIGN_REQUEST_LIMIT_IS_TWO');
  const brief = briefs.find((item) => item.id === briefId);
  if (!brief) throw new Error('UNKNOWN_BRIEF');
  const parent = path.resolve(root, 'campaigns');
  fs.mkdirSync(parent, { recursive: true });
  if (fs.lstatSync(parent).isSymbolicLink()) throw new Error('INVALID_CAMPAIGN_PATH');
  const directory = path.join(parent, campaignId);
  if (fs.existsSync(directory)) throw new Error('CAMPAIGN_ALREADY_EXISTS');
  const budget = provider.mode === 'LIVE' ? openBudget(root) : null;
  if (budget && budget.used() >= LIMIT) throw new Error('GLOBAL_REQUEST_LIMIT_REACHED');
  fs.mkdirSync(directory); // Atomic ID reservation: concurrent starts of the same ID cannot both win.
  writeNew(path.join(directory, 'lock.json'), { campaignId, briefId, mode: provider.mode, maxRequests, maxRepairs: 1, startedAt: new Date().toISOString() });
  let checkpoints = 0; let dispatched = 0;
  const bounded = { ...provider, async generate(messages) {
    if (dispatched >= maxRequests) throw new Error('CAMPAIGN_REQUEST_LIMIT_REACHED');
    const sequence = dispatched + 1;
    const slot = budget ? budget.reserve(campaignId, sequence) : null;
    writeNew(path.join(directory, 'attempt-' + sequence + '.json'), { sequence, globalSlot: slot, state: 'RESERVED_BEFORE_INFERENCE' });
    dispatched++;
    console.log(JSON.stringify({ campaignId, phase: sequence === 1 ? 'initial' : 'repair', reservedRequests: dispatched, globalUsed: budget?.used() ?? null }));
    return provider.generate(messages);
  } };
  try {
    const report = await runExperiment({ provider: bounded, briefs: [brief], maxRequests,
      onCheckpoint: (value) => writeNew(path.join(directory, 'checkpoint-' + (++checkpoints) + '.json'), { ...value, campaignId, requestsDispatched: dispatched }, secrets),
    });
    const final = { ...report, campaignId, requestsDispatched: dispatched, globalUsed: budget?.used() ?? null };
    writeNew(path.join(directory, 'result.json'), final, secrets);
    return final;
  } catch (error) {
    writeNew(path.join(directory, 'failure.json'), { campaignId, code: 'CAMPAIGN_STOPPED', requestsDispatched: dispatched }, secrets);
    throw error;
  }
}
module.exports = { LIMIT, validateCampaignId, legacyAccounting, openBudget, executeCampaign };
