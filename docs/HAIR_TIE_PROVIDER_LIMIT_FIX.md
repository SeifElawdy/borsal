# Hair Tie provider diagnosis and narrow fix

## Recovery

Pre-edit commit: `a1b0534a9824386ca859eae9677751d59aa7ed40`, clean branch `feature/simple-product-journey`.

Recovery tag: `borsal-pre-hair-tie-provider-20261115T182519339Z`.

Verified private backup: `E:/Borsal-Recovery/borsal-pre-model-upgrade-20261114T170313Z/pre-hair-tie-provider-20261115T182519339Z/`. Git bundle integrity passed; the official MongoDB archive restored into an isolated database with **85 documents / 10 collections**, matching source hashes/indexes. **829 artifacts** were copied and hashed. Existing recovery backups and submission ZIP remain preserved. `RESTORE.txt` describes restoration into NEW directories/databases only. Source rollback: `git worktree add ../borsal-before-hair-tie borsal-pre-hair-tie-provider-20261115T182519339Z`.

## Exact evidence

Latest failed campaign: `mvp-technical-94d99048-26dd-47ed-8106-76909d149888`, Hair Tie **Design Version 6**. Its original `request.json`, `provider-envelope.json`, `failure.json`, lock and attempt reservation remain unchanged under `experiments/design-language/ai-spike/results/campaigns/`. The immediately preceding Hair Tie campaign `mvp-technical-c60d9bde-7c36-4e87-b7c5-fda83f106232` has the same failure characteristics; neither was retried by this task.

Request: POST `/client/v4/accounts/[REDACTED]/ai/run/@cf/openai/gpt-oss-120b`, construction profile, JSON Mode, `stream:false`, temperature 0.3, `max_tokens:1536`, timeout 120 seconds.

Response: HTTP **200**, `application/json`, `success:true`, no provider errors. The saved parsed envelope is the existing `result.object="chat.completion"` structure with one choice, index 0 and assistant role. `result.choices[0].message.content` is **null**; `finish_reason` is **length**. Only reasoning fields contain text. Usage: **1,732 prompt + 1,536 completion = 3,268 tokens; 159.8360137939453 Neurons**. The provider did not supply a separate reasoning-token breakdown.

The original parser rejected missing final text as `INVALID_PROVIDER_ENVELOPE`, after 14,336 ms in `VALIDATING_RESPONSE`, with no timeout/deadline expiration. This is **not a new response format or a failure to read nested choices**. The completion exhausted its configured output budget before returning a final answer. There is no final construction JSON to validate or recover. Reasoning is not a substitute for assistant output, geometry or assembly instructions.

## Fix and offline recovery result

The shared adapter now distinguishes a recognized, otherwise valid assistant completion with missing/empty final content and `finish_reason:"length"` as **MODEL_OUTPUT_TOKEN_LIMIT_REACHED**. Safe diagnostics retain finish reason, output limit, truncation, final-content absence, reasoning-presence flag and numeric usage. Existing service error handling persists these diagnostics in future receipts. The normal UI error text explains the limit without suggesting successful generation.

The adapter still rejects other malformed/unsupported envelopes, tool calls and refusals. Nonempty final content is still passed unchanged to existing JSON/schema validation, including truncated malformed text. No reasoning extraction, schema relaxation, repair, automatic retry, model substitution, endpoint change or token-limit increase was introduced.

Exact saved response replay: `node data/hair-tie-provider/replay.cjs`. Report: `data/hair-tie-provider/offline-replay.json`. Result: **NO_FINAL_ASSISTANT_CONTENT**; no proposal/version was created and construction validation was not run without final JSON. Original raw bytes and the old failure record remain intact. The committed fixture redacts only the provider-generated ID and reasoning text, retaining their hashes and the actual response shape/null content/finish reason/usage.

## Legacy pathway

The local legacy “Generate technical pattern” action uses the same protected technical-generation endpoint and `technicalGeneration.generate` service. `localAI.textProvider` calls the same `cloudflareProvider` adapter. The legacy/default profile normally selects Llama 3.3 70B with its existing 6,144-token defaults; the construction profile selects GPT-OSS with the existing 1,536-token limit. The non-local legacy route in `src/routes/concepts.js` also uses that service/provider. No legacy workflow or generation settings were redesigned or changed.

## Verification and next action

**94 focused tests / 7 files passed**, including the actual sanitized Hair Tie response, previous GPT-OSS envelope extraction, truncation/refusal/tool guards, transport diagnostics, protected creation flow and legacy technical APIs. Log: `data/hair-tie-provider/focused.log`. React production build passed (1.21 s); existing chunk-size warning remains. Full regression was not run for this narrow task.

Shared usage: **65**, informational, unchanged by this task. ZERO Cloudflare calls; all test fetches are mocked. No original projects, design versions, images, proposals, inventory or request history were changed.

Reload after restarting `npm run mvp` to use the corrected adapter. The retained historical receipt keeps its original error; it is not rewritten as a successful design. **Do not blindly repeat the same 1,536-token request.** The next generation needs a separately reviewed, bounded reasoning/output-budget configuration (including the corresponding Free-tier preflight estimate), then explicit browser confirmation. That configuration change and inference were not performed here. This fix cannot produce a Hair Tie pattern from null final output. Fix 2 has not begun.
