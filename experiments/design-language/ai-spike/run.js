// CLI only. Default is a mock; importing modules never loads credentials or calls a network.
const fs = require('fs');
const path = require('path');
const { cloudflareProvider, MODEL, COMPARISON_MODEL, APPROVED_MODELS } = require('./provider');

function reserveCampaign(outputDir) {
  // An existing marker, including one left after a crash, prohibits a new campaign.
  fs.writeFileSync(path.join(outputDir, 'live-campaign.json'), JSON.stringify({ maxRequests: 12, maxInitialRequests: 6, maxRepairsPerBrief: 1 }), { flag: 'wx' });
}

function parseOptions(args) {
  const allowed = ['--mock', '--live', '--free-tier-confirmed'];
  if (args.some((arg) => !allowed.includes(arg) && !/^--(campaign|brief|model|max-requests)=/.test(arg)) || (args.includes('--mock') && args.includes('--live'))) throw new Error('Invalid CLI options');
  const option = (name, fallback) => {
    const matches = args.filter((arg) => arg.startsWith('--' + name + '='));
    if (!matches.length && fallback !== undefined) return fallback;
    if (matches.length !== 1) throw new Error('Provide one --' + name + '= value');
    return matches[0].slice(name.length + 3);
  };
  const campaignId = option('campaign');
  const briefId = option('brief');
  const model = option('model', MODEL);
  const maxRequests = Number(option('max-requests', '2'));
  if (!APPROVED_MODELS.includes(model)) throw new Error('MODEL_NOT_APPROVED');
  if (![1, 2].includes(maxRequests)) throw new Error('CAMPAIGN_REQUEST_LIMIT_IS_TWO');
  if (model === COMPARISON_MODEL && maxRequests !== 1) throw new Error('COMPARISON_REQUIRES_ONE_REQUEST');
  require('./campaign').validateCampaignId(campaignId);
  return { campaignId, briefId, model, maxRequests };
}

async function main(args = process.argv.slice(2)) {
  const { campaignId, briefId, model, maxRequests } = parseOptions(args);
  const { executeCampaign } = require('./campaign');
  let provider; let secrets = [];
  if (args.includes('--live')) {
    require('dotenv').config({ quiet: true });
    secrets = [process.env.CF_API_TOKEN, process.env.CF_ACCOUNT_ID, process.env.MONGODB_URI];
    provider = cloudflareProvider({ accountId: process.env.CF_ACCOUNT_ID, apiToken: process.env.CF_API_TOKEN, freeTierConfirmed: args.includes('--free-tier-confirmed'), model });
  } else {
    provider = { mode: 'MOCK', name: 'offline mock', model: 'none', generate: async () => ({ text: '{"mockOnly":true}', usage: null }) };
  }
  const report = await executeCampaign({ root: path.join(__dirname, 'results'), campaignId, briefId, provider, maxRequests, secrets });
  console.log(JSON.stringify({ campaignId, status: report.status, requests: report.requestsDispatched, repairs: report.repairRequests, globalUsed: report.globalUsed, schemaValid: report.results[0]?.automated?.schemaValid ?? null }));
  return report;
}
if (require.main === module) main().catch(() => { console.error('Experiment stopped; check configuration, campaign marker, and saved results. No automatic retry.'); process.exitCode = 1; });
module.exports = { main, reserveCampaign, parseOptions };
