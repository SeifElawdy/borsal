const MODEL = '@cf/meta/llama-3.1-8b-instruct';
const COMPARISON_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const APPROVED_MODELS = Object.freeze([MODEL, COMPARISON_MODEL]);
const GENERATION_PARAMETERS = Object.freeze({ response_format: Object.freeze({ type: 'json_object' }), stream: false, temperature: 0.7, max_tokens: 6144 });
const TIMEOUT_MS = 60000;
// Only enumerated codes may leave the transport. Never retain messages, URLs,
// stack traces, certificate details, headers or arbitrary exception properties.
const DNS_CODES = ['ENOTFOUND', 'EAI_AGAIN'];
const TLS_CODES = ['CERT_HAS_EXPIRED', 'ERR_TLS_CERT_ALTNAME_INVALID', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN'];
const TIMEOUT_CODES = ['ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT'];
const SAFE_CODES = new Set([...DNS_CODES, ...TLS_CODES, ...TIMEOUT_CODES, 'ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'ENETUNREACH', 'EHOSTUNREACH', 'UND_ERR_SOCKET', 'UND_ERR_ABORTED', 'ABORT_ERR']);
class ProviderError extends Error {
  constructor(code, status = null, providerCodes = [], diagnostics = null) {
    super(code); this.code = code; this.status = status; this.providerCodes = providerCodes;
    if (diagnostics) this.diagnostics = diagnostics;
  }
}
function cloudflareProvider({ accountId, apiToken, freeTierConfirmed = false, fetchImpl = globalThis.fetch, model = MODEL, timeoutMs = TIMEOUT_MS }) {
  if (!APPROVED_MODELS.includes(model)) throw new ProviderError('MODEL_NOT_APPROVED');
  if (![TIMEOUT_MS, 120000].includes(timeoutMs)) throw new ProviderError('TIMEOUT_NOT_APPROVED');
  if (!accountId || !apiToken) throw new ProviderError('LIVE_TEST_BLOCKED_MISSING_CREDENTIALS');
  // Presence of credentials or a prior image spike does not establish a free-only account.
  if (freeTierConfirmed !== true) throw new ProviderError('LIVE_TEST_BLOCKED_FREE_TIER_UNVERIFIED');
  return {
    mode: 'LIVE', name: 'Cloudflare Workers AI', model,
    generationParameters: Object.freeze({ ...GENERATION_PARAMETERS, timeoutMs }),
    async generate(messages) {
      const started = performance.now(), signal = AbortSignal.timeout(timeoutMs);
      let response, phase = 'AWAITING_RESPONSE_HEADERS';
      const diagnostics = (error, fallback) => {
        const transportCode = [error?.code, error?.cause?.code].find(code => SAFE_CODES.has(code)) || null;
        const deadlineExpired = signal.aborted && signal.reason?.name === 'TimeoutError';
        const timeout = error != null && (deadlineExpired || error?.name === 'TimeoutError' || TIMEOUT_CODES.includes(transportCode));
        return { kind: timeout ? 'TIMEOUT' : error?.name === 'AbortError' ? 'ABORTED' : fallback,
          phase, elapsedMs: Math.max(0, Math.round(performance.now() - started)), timeoutMs,
          deadlineExpired, timeoutScope: timeout ? deadlineExpired ? 'CLIENT_DEADLINE' : 'TRANSPORT_OR_UNATTRIBUTED' : null,
          transportCode, transportCategory: DNS_CODES.includes(transportCode) ? 'DNS' : TLS_CODES.includes(transportCode) ? 'TLS' : transportCode ? 'NETWORK_TRANSPORT' : null,
          cloudflareExecution: 'UNKNOWN' };
      };
      try {
        response = await fetchImpl('https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(accountId) + '/ai/run/' + model, {
          method: 'POST', headers: { Authorization: 'Bearer ' + apiToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, ...GENERATION_PARAMETERS }),
          signal,
        });
      } catch (error) { throw new ProviderError('NETWORK_OR_TIMEOUT', null, [], diagnostics(error, 'NETWORK_ERROR')); }
      phase = 'RESPONSE_BODY';
      let body;
      try { body = await response.json(); } catch (error) {
        const transport = [error?.code, error?.cause?.code].some(code => SAFE_CODES.has(code));
        throw new ProviderError('INVALID_PROVIDER_ENVELOPE', response.status, [], diagnostics(error, transport ? 'NETWORK_ERROR' : error?.name === 'SyntaxError' ? 'INVALID_RESPONSE_JSON' : 'UNKNOWN_BODY_ERROR'));
      }
      phase = 'VALIDATING_RESPONSE';
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ProviderError('INVALID_PROVIDER_ENVELOPE', response.status, [], diagnostics(null, 'INVALID_PROVIDER_ENVELOPE'));
      // Do not expose remote error strings, response headers, tokens or account identifiers.
      const codes = Array.isArray(body.errors) ? body.errors.map((item) => item.code).filter(Number.isFinite) : [];
      if (!response.ok || body.success === false) {
        const code = [401, 403].includes(response.status) ? 'AUTHENTICATION_OR_PERMISSION' : response.status === 429 ? 'QUOTA_OR_RATE_LIMIT' : 'PROVIDER_ERROR';
        throw new ProviderError(code, response.status, codes, diagnostics(null, 'HTTP_OR_PROVIDER_ERROR'));
      }
      const result = body.result;
      if (!result || !(typeof result.response === 'string' || (result.response && typeof result.response === 'object' && !Array.isArray(result.response)))) throw new ProviderError('INVALID_PROVIDER_ENVELOPE', response.status, [], diagnostics(null, 'INVALID_PROVIDER_ENVELOPE'));
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
