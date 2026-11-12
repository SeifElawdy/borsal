const MODEL = '@cf/meta/llama-3.1-8b-instruct';
const COMPARISON_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const APPROVED_MODELS = Object.freeze([MODEL, COMPARISON_MODEL]);
const GENERATION_PARAMETERS = Object.freeze({ response_format: Object.freeze({ type: 'json_object' }), stream: false, temperature: 0.7, max_tokens: 6144 });
class ProviderError extends Error {
  constructor(code, status = null, providerCodes = []) {
    super(code); this.code = code; this.status = status; this.providerCodes = providerCodes;
  }
}
function cloudflareProvider({ accountId, apiToken, freeTierConfirmed = false, fetchImpl = globalThis.fetch, model = MODEL }) {
  if (!APPROVED_MODELS.includes(model)) throw new ProviderError('MODEL_NOT_APPROVED');
  if (!accountId || !apiToken) throw new ProviderError('LIVE_TEST_BLOCKED_MISSING_CREDENTIALS');
  // Presence of credentials or a prior image spike does not establish a free-only account.
  if (freeTierConfirmed !== true) throw new ProviderError('LIVE_TEST_BLOCKED_FREE_TIER_UNVERIFIED');
  return {
    mode: 'LIVE', name: 'Cloudflare Workers AI', model,
    generationParameters: Object.freeze({ ...GENERATION_PARAMETERS, timeoutMs: 60000 }),
    async generate(messages) {
      let response;
      try {
        response = await fetchImpl('https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(accountId) + '/ai/run/' + model, {
          method: 'POST', headers: { Authorization: 'Bearer ' + apiToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, ...GENERATION_PARAMETERS }),
          signal: AbortSignal.timeout(60000),
        });
      } catch { throw new ProviderError('NETWORK_OR_TIMEOUT'); }
      let body;
      try { body = await response.json(); } catch { throw new ProviderError('INVALID_PROVIDER_ENVELOPE', response.status); }
      // Do not expose remote error strings, response headers, tokens or account identifiers.
      const codes = Array.isArray(body.errors) ? body.errors.map((item) => item.code).filter(Number.isFinite) : [];
      if (!response.ok || body.success === false) {
        const code = [401, 403].includes(response.status) ? 'AUTHENTICATION_OR_PERMISSION' : response.status === 429 ? 'QUOTA_OR_RATE_LIMIT' : 'PROVIDER_ERROR';
        throw new ProviderError(code, response.status, codes);
      }
      const result = body.result;
      if (!result || !(typeof result.response === 'string' || (result.response && typeof result.response === 'object' && !Array.isArray(result.response)))) throw new ProviderError('INVALID_PROVIDER_ENVELOPE', response.status);
      const usage = {};
      for (const field of ['prompt_tokens', 'completion_tokens', 'total_tokens', 'neurons']) {
        if (Number.isFinite(result.usage?.[field]) && result.usage[field] >= 0) usage[field] = result.usage[field];
      }
      const finishReason = result.finish_reason || result.choices?.[0]?.finish_reason || null;
      const truncated = finishReason === 'length' || result.truncated === true ||
        (Number.isFinite(usage.completion_tokens) && usage.completion_tokens >= 6144) ? true : finishReason === 'stop' || result.truncated === false ? false : null;
      return { text: typeof result.response === 'string' ? result.response : JSON.stringify(result.response),
        usage: Object.keys(usage).length ? usage : null, httpStatus: response.status,
        finishReason, outputTokenLimit: 6144, truncated,
      };
    },
  };
}
module.exports = { MODEL, COMPARISON_MODEL, APPROVED_MODELS, GENERATION_PARAMETERS, ProviderError, cloudflareProvider };
