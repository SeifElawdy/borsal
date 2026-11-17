# GPT-OSS construction reasoning/output budget

## Recovery and scope

Started from clean commit `dca3fe8e082a05010b94ee11e8297ef52776cd9c`. Its private `hair-tie-provider-fixed.bundle` was hash-checked and verified. The restore-verified MongoDB/data backup at `E:/Borsal-Recovery/borsal-pre-model-upgrade-20261114T170313Z/pre-hair-tie-provider-20261115T182519339Z/` still matches the **85 original documents and indexes**. Original artifacts, receipts and release ZIP are preserved; the previous server log only appended entries. The new pre-edit tag is recorded in `data/reasoning-budget/checkpoint.json`. No original project, design revision, stock, request counter or stored response was edited.

## Endpoint-specific documentation

The existing request remains native Workers AI `POST /client/v4/accounts/[ACCOUNT]/ai/run/@cf/openai/gpt-oss-120b`, using `messages`. Cloudflare's [model catalog](https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/) lists low/medium/high reasoning, default medium. Its generated model schema exposes nested `reasoning.effort` under the **Responses** input branch; that is not the messages payload used here.

Cloudflare's [official adapter documentation](https://github.com/cloudflare/ai/blob/main/packages/tanstack-ai/README.md#reasoning-controls) identifies GPT-OSS support for top-level `reasoning_effort`. Its [native binding-input implementation](https://github.com/cloudflare/ai/blob/main/packages/tanstack-ai/src/utils/create-fetcher.ts#L416) forwards that field on the same Workers AI input object as messages/max_tokens. This is the evidence used for the native input configuration. No `/ai/v1/responses` migration, nested Responses reasoning object, thinking-disable flag, SDK, gateway or fallback was added. Provider acceptance/effectiveness has not been verified live; a parameter rejection remains an error with no retry or silent parameter removal.

## Exact configuration

Only the GPT-OSS **CONSTRUCTION** profile changes:

| Parameter | Before | Now |
|---|---|---|
| `reasoning_effort` | omitted (provider default) | `low` |
| `max_tokens` | 1,536 | 2,048 |
| temperature | 0.3 | 0.3 |
| JSON Mode | `json_object` | unchanged |
| stream | false | false |
| timeout | 120 seconds in local workflow | unchanged |
| maximum serialized prompt | 5,500 bytes | unchanged |
| conservative Free-tier reservation | 300 Neurons | 350 Neurons |

The 512-token increase gives modest additional headroom after the observed 1,536-token exhaustion; low effort and added headroom reduce risk but do not guarantee an answer. Reasoning is not disabled or accepted as final output. Legacy Llama/default generation retains its existing 6,144-token parameters and does not receive GPT-OSS reasoning settings.

## Compact engineering intent

The prompt supplies width, height and net area computed by existing polygon utilities, alongside the exact original polygon/holes. These are calculations from supplied geometry, never independent physical measurements. The model is told to use the summary rather than enumerate vertices, return compact final JSON with at most four short entries per list, and identify missing operations instead of inventing dimensions for unsupported functions. The schema still permits its existing one-to-eight list entries; validation was not weakened or silently transformed.

Active design identity, closure/selection rules, source hashes, assembly contracts, construction methods, polygon validation and bounded nesting remain unchanged. This task adds no generalized Hair Tie construction or Fix 2 functionality. A valid final `UNSUPPORTED` answer remains an honest incomplete design, not a working pattern.

## Free-tier preflight

The shared construction policy is consumed by the provider, service guard, capabilities/confirmation estimate and atomic Free-tier hold. [Cloudflare's published model rates](https://developers.cloudflare.com/workers-ai/platform/pricing/) are 31,818 input and 68,182 output Neurons per million tokens.

Conservative estimate:

`ceil(((serializedPromptBytes + 512) * 31818 + 2048 * 68182) / 1000000)`

All completion tokens, including reasoning, count toward the output bound. One input token per serialized byte plus a 512-token framing margin is an intentionally conservative estimate, not tokenization or a billing guarantee. At the maximum allowed prompt, the estimate is **331 Neurons**; the **350-Neuron** hold adds margin. Actual returned usage remains authoritative when supplied. Prior holds/outcomes are retained, not recalculated or refunded.

Read-only preflight of the saved Hair Tie Design Version 6: **5,424 bytes, 329 estimated maximum Neurons**, current source/review identity, configured credentials and sufficient unexpired owner Free-tier attestation. Details: `data/reasoning-budget/hair-tie-preflight.json`. No account usage API or inference call was made. These stored checks are repeated by the real endpoint before any dispatch.

## Verification and readiness

**84 focused tests / 8 files passed** (`data/reasoning-budget/focused.log`), covering exact native request fields, valid final JSON, new-budget exhaustion with no final content, unsupported parameters/no retries, unchanged legacy defaults, strict client parameter rejection, computed summary, and 349-vs-350 Neuron headroom through the protected API. The headroom failure dispatched no provider call and consumed no request slot. Previous envelope, construction, identity-aware API and legacy technical guards also passed.

Two existing tests now expect the new configured 2,048-token profile. The historical Hair Tie fixture and its actual 1,536-token usage remain unchanged; replaying that fixture is not evidence it used the new settings. The new current-budget exhaustion test separately mocks 2,048 completion tokens.

React production build passed; its existing chunk-size warning remains. Full regression was not run for this bounded task. Shared real usage remains **65**, informational only; **ZERO live calls** and no automatic retries, repairs, paid activation or stock mutations occurred.

After loading the checkpoint, reopen the Hair Tie project, review the same current design, then explicitly confirm **one new** Create Product Design request. The dialog shows the **350-Neuron** hold. Never reuse/reset the old campaign or interpret its null final content as recovered geometry. The request is **technically ready subject to the normal fresh guards**, not live-tested or guaranteed to produce supported construction. A live response may still be incomplete, unsupported or token-limited; it will remain subject to strict final-text/schema checks.
