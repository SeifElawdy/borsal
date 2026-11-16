const MODEL = '@cf/meta/llama-3.1-8b-instruct';
const COMPARISON_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const CONSTRUCTION_MODEL = '@cf/openai/gpt-oss-120b';
const QWEN_MODEL = '@cf/qwen/qwen3.8-27b';
const APPROVED_MODELS = Object.freeze([MODEL, COMPARISON_MODEL, CONSTRUCTION_MODEL, QWEN_MODEL]);
const GENERATION_PARAMETERS = Object.freeze({ response_format: Object.freeze({ type: 'json_object' }), stream: false, temperature: 0.7, max_tokens: 6144 });
// Native Workers AI messages input; do not use Responses-only reasoning objects.
const CONSTRUCTION_PARAMETERS = Object.freeze({ ...GENERATION_PARAMETERS, temperature: 0.3, max_tokens: 2048, reasoning_effort: 'low' });
const CONSTRUCTION_POLICY = Object.freeze({maxPromptBytes:5500,promptOverheadTokens:512,inputNeuronsPerMillion:31818,outputNeuronsPerMillion:68182,freeTierHoldNeurons:350});
function constructionMaxNeurons(promptBytes) {
  if(!Number.isSafeInteger(promptBytes)||promptBytes<0)throw new ProviderError('INVALID_PROMPT_SIZE');
  return Math.ceil(((promptBytes+CONSTRUCTION_POLICY.promptOverheadTokens)*CONSTRUCTION_POLICY.inputNeuronsPerMillion+CONSTRUCTION_PARAMETERS.max_tokens*CONSTRUCTION_POLICY.outputNeuronsPerMillion)/1000000);
}
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
function cloudflareProvider({ accountId, apiToken, freeTierConfirmed = false, fetchImpl = globalThis.fetch, model = MODEL, timeoutMs = TIMEOUT_MS, profile = 'DEFAULT' }) {
  if (!APPROVED_MODELS.includes(model)) throw new ProviderError('MODEL_NOT_APPROVED');
  if (![TIMEOUT_MS, 120000].includes(timeoutMs)) throw new ProviderError('TIMEOUT_NOT_APPROVED');
  if (!accountId || !apiToken) throw new ProviderError('LIVE_TEST_BLOCKED_MISSING_CREDENTIALS');
  // Presence of credentials or a prior image spike does not establish a free-only account.
  if (freeTierConfirmed !== true) throw new ProviderError('LIVE_TEST_BLOCKED_FREE_TIER_UNVERIFIED');
  if (!['DEFAULT','CONSTRUCTION','QWEN_ENGINEERING'].includes(profile) || profile === 'CONSTRUCTION' && model !== CONSTRUCTION_MODEL || (profile==='QWEN_ENGINEERING')!==(model===QWEN_MODEL)) throw new ProviderError('PROFILE_NOT_APPROVED');
  const parameters=profile==='QWEN_ENGINEERING'?require('../../../src/services/qwenEngineering').PARAMETERS:profile==='CONSTRUCTION'?CONSTRUCTION_PARAMETERS:GENERATION_PARAMETERS;
  const outputLimit=parameters.max_completion_tokens??parameters.max_tokens;
  return {
    mode: 'LIVE', name: 'Cloudflare Workers AI', model,
    generationParameters: Object.freeze({ ...parameters, timeoutMs }),
    async generate(messages, {captureEnvelope} = {}) {
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
          body: JSON.stringify({ messages, ...parameters }),
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
      // Trusted server-only sink: retain unexpected model envelopes before rejecting
      // them. The caller redacts secrets and never exposes this artifact as an API error.
      const contentType=response.headers?.get?.('content-type')?.split(';')[0].trim().toLowerCase();
      if (typeof captureEnvelope === 'function') captureEnvelope({httpStatus:response.status,...(contentType&&/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(contentType)?{contentType}:{}),body});
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ProviderError('INVALID_PROVIDER_ENVELOPE', response.status, [], diagnostics(null, 'INVALID_PROVIDER_ENVELOPE'));
      // Do not expose remote error strings, response headers, tokens or account identifiers.
      const codes = Array.isArray(body.errors) ? body.errors.map((item) => item.code).filter(Number.isFinite) : [];
      if (!response.ok || body.success === false || body.error || (Array.isArray(body.errors) && body.errors.length)) {
        const code = [401, 403].includes(response.status) ? 'AUTHENTICATION_OR_PERMISSION' : response.status === 429 ? 'QUOTA_OR_RATE_LIMIT' : 'PROVIDER_ERROR';
        throw new ProviderError(code, response.status, codes, diagnostics(null, 'HTTP_OR_PROVIDER_ERROR'));
      }
      const result = body.result;
      if (result?.error) throw new ProviderError('PROVIDER_ERROR',response.status,codes,diagnostics(null,'HTTP_OR_PROVIDER_ERROR'));
      const usage = {};
      for (const field of ['prompt_tokens', 'completion_tokens', 'total_tokens', 'neurons']) {
        if (Number.isFinite(result?.usage?.[field]) && result.usage[field] >= 0) usage[field] = result.usage[field];
      }
      if(model===QWEN_MODEL&&Number.isSafeInteger(result?.usage?.completion_tokens_details?.reasoning_tokens)&&result.usage.completion_tokens_details.reasoning_tokens>=0)usage.completion_tokens_details={reasoning_tokens:result.usage.completion_tokens_details.reasoning_tokens};
      const finishReason = result?.finish_reason || result?.choices?.[0]?.finish_reason || null;
      let text;
      if (model!==QWEN_MODEL&&(typeof result?.response === 'string' || (result?.response && typeof result.response === 'object' && !Array.isArray(result.response)))) text=typeof result.response==='string'?result.response:JSON.stringify(result.response);
      else if (result?.object==='chat.completion' && Array.isArray(result.choices) && result.choices.length===1) {
        // GPT-OSS /ai/run returns a Chat Completions object inside Workers AI's
        // result wrapper. Extract final assistant content ONLY, never reasoning.
        const choice=result.choices[0],message=choice?.message;
        if(choice?.index===0 && message?.role==='assistant' && typeof message.content==='string' && message.content.trim() && !message.refusal && !message.function_call && (!message.tool_calls || Array.isArray(message.tool_calls)&&message.tool_calls.length===0)) text=message.content;
        // A valid completion can exhaust its budget before producing final text.
        // Never extract reasoning as a proposal or retry the consumed request.
        if(text===undefined && choice?.index===0 && message?.role==='assistant' &&
          (message.content==null || typeof message.content==='string'&&!message.content.trim()) &&
          !message.refusal && !message.function_call && (!message.tool_calls || Array.isArray(message.tool_calls)&&message.tool_calls.length===0) && finishReason==='length') {
          throw new ProviderError('MODEL_OUTPUT_TOKEN_LIMIT_REACHED',response.status,[],{
            ...diagnostics(null,'OUTPUT_TOKEN_LIMIT'),finishReason,outputTokenLimit:outputLimit,
            truncated:true,finalContentPresent:false,reasoningPresent:!!(message.reasoning||message.reasoning_content),
            usage:Object.keys(usage).length?usage:null,
          });
        }
      }
      if (text===undefined) throw new ProviderError('INVALID_PROVIDER_ENVELOPE', response.status, [], diagnostics(null, 'INVALID_PROVIDER_ENVELOPE'));
      const truncated = finishReason === 'length' || result.truncated === true ||
        (Number.isFinite(usage.completion_tokens) && usage.completion_tokens >= outputLimit) ? true : finishReason === 'stop' || result.truncated === false ? false : null;
      return { text,
        usage: Object.keys(usage).length ? usage : null, httpStatus: response.status,
        finishReason, outputTokenLimit: outputLimit, truncated,
      };
    },
  };
}
module.exports = { MODEL, COMPARISON_MODEL, CONSTRUCTION_MODEL, QWEN_MODEL, APPROVED_MODELS, GENERATION_PARAMETERS, CONSTRUCTION_PARAMETERS, CONSTRUCTION_POLICY, constructionMaxNeurons, ProviderError, cloudflareProvider };
