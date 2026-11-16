# Final Qwen engineering verification — November 16, 2026

## Outcome

Exactly **one** new Qwen request was confirmed through the protected Creation Studio. It timed out at the **120-second client deadline, before response headers**. No final assistant content, HTTP status, provider finish reason or usage was received. Cloudflare-side execution remains **UNKNOWN**. There was no retry, fallback, concept request or image request. Global usage advanced **69 → 70**.

The corrected schema passed complete offline structural checks, but this timeout does **not** establish remote acceptance or model engineering quality. No new technical proposal, cutting pattern, nesting, assembly SVG or BOM was produced. The historical GPT-OSS proposal, prior Qwen HTTP 400 receipt, reviews and source identity remain preserved. GPT-OSS stays the default; Qwen remains opt-in.

## Recovery

Starting checkpoint: `e5455bc30f504c6599fdaf983c1b6aa19f3db408`, clean working tree. Branch: `feature/qwen-engineering-evaluation`.

- Verified pre-test live-workspace backup: `E:/Borsal-Recovery/borsal-pre-model-upgrade-20261114T170313Z/pre-qwen-final-20261116T091951759Z/` — 10 collections, nine documents, 494 copied files; isolated official MongoDB restore/hash verification passed.
- Verified fresh owner-workspace backup: `E:/Borsal-Recovery/borsal-pre-model-upgrade-20261114T170313Z/owner-qwen-final-20261116T092757254Z/` — source/database bundle and 1,206 preserved artifacts. Original owner database was subsequently compared with this snapshot and is unchanged.
- Prior full backups, source bundles, photographs, generated images, inventories and original submission ZIP remain untouched.

Each private backup contains `VERIFIED-DELIVERY-ADDENDUM.json` and `RESTORE.txt`. Restore only into new directories/databases; never replace a newer ledger or active owner namespace. Final source/data checkpoint locations are recorded in `data/qwen-final/final-checkpoint.json` and `data/qwen-final/final-backup.json`.

## Source changes

Production code remains at the already corrected integration. This task adds one complete-schema regression test in `src/services/qwenEngineering.test.js` and this report. No compiler, primitive, local engineering schema, design-identity logic, validator, model default, timeout or production/inventory gate was changed.

## Exact provider configuration

Model: `@cf/qwen/qwen3.8-27b`; native `POST /client/v4/accounts/{account}/ai/run/{model}`.

```json
{
  "messages": [{"role":"system","content":"contract"},{"role":"user","content":"active requirements and compact source statistics"}],
  "reasoning_effort":"xhigh",
  "max_completion_tokens":8192,
  "temperature":0.3,
  "stream":false,
  "response_format":{"type":"json_schema","json_schema":{"name":"borsal_engineering_plan","strict":true,"schema":"FULL_SCHEMA_IN_SAVED_REQUEST"}}
}
```

The schema string above is a documentation placeholder, not the actual request value. The saved request contains the complete schema object. `max_tokens` is not sent. Timeout is 120,000 ms. Only final assistant `message.content` from the documented native Chat Completions wrapper can become a plan; reasoning/refusal/tool output is never accepted instead.

Official references rechecked: [Qwen native input](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/sync-input.json), [native output](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/sync-output.json), [model documentation](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/), [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

## Full outbound schema audit

The **actual** `PARAMETERS.response_format.json_schema.schema` was recursively examined, not replaced with a simplified example. Audit artifact: `data/qwen-final/schema-audit.json`, containing the full schema, SHA-256 and counts.

- 39 objects: all closed with `additionalProperties:false`; their required lists match their generated properties.
- Eight fixed coordinate/reference tuples use Draft-2020-12 `prefixItems`, min/max length two; no legacy array-valued `items` remains.
- Three `oneOf` and two `anyOf` unions, including nested shapes/materials/operations, were retained.
- Seventeen enums plus literal `borsal.engineering-plan/0.1`, numeric constraints and nested arrays were checked.
- Optional unknown source/grain fields remain omitted, not filled with fabricated measurements. Material quantities/thread-estimate branches remain explicit.
- All six supported authored compositions still pass the unchanged local plan contract and independent geometry/nesting path.
- The exact historical error-8006 fixture remains tested, including error propagation and no retry.

These are standards/structure/local-compatibility findings. An absent response cannot prove Cloudflare's runtime acceptance of every schema keyword. No schema constraint was weakened.

The request supplies name, function, closure and source summary (bounds, usable area, area fraction, vertex count and hole count). The exact 74-point polygon stays in Borsal for deterministic validation and nesting.

## Free-tier reconciliation

Owner-provided current-day dashboard reading: **367.52 / 10,000 Neurons**, leaving **9,632.48**. The prior Qwen HTTP 400 request has no reported usage, so its **4,000-Neuron uncertain hold was retained**.

Conservative pre-request headroom: `9632.48 − 4000 = 5632.48`, rounded down to **5,632**. This was recorded through the normal authorized settings UI, preserving the prior proof and reconciliation evidence in `data/qwen-final/live-browser/reservation-reconciliation-before.json` and the before/after bootstrap snapshots. The increase from 3,650 reflects reconciling completed known-cost reservations with the owner's dashboard reading; it does not refund the uncertain 4,000 hold or reset request history.

The renewed proof is OWNER_DASHBOARD_ATTESTATION, paidPlan false, no block, valid until November 17 UTC. The confirmation displayed Qwen, xhigh, 8,192 completion tokens including reasoning, strict JSON Schema, 5,632 verified conservative headroom and the **4,000** new hold.

Rates remain 40,909 input / 290,909 output Neurons per million tokens. Worst-case reservation calculation includes up to 24,000 request bytes, 1,024 token overhead, all 8,192 reasoning/final tokens and 15% margin: **3,918**, rounded up to **4,000**. After dispatch, conservative headroom is **1,632**. Both uncertain holds remain retained. Actual usage of this timed-out request is **unreported**, never assumed zero. No paid plan, billing credentials or Gateway credits were activated.

## Offline verification

- Focused: **29 passed** across Qwen provider/API, generalized compiler and Fix 1 identity tests.
- Full regression: **890 passed**, 72 files (`data/qwen-final/regression-verified.log`).
- Production build passed (`data/qwen-final/build.log`).
- Edge at 1440/1920 passed actual guided upload, confirmation, mocked generation/compilation/nesting, SVG viewing, reload/resume, keyboard/reduced-motion checks; no console errors, no overflow, production blocked and inventory unchanged.
- Desktop evidence: `data/local-mvp/real-creation-check-1794821438258/`.
- All automated AI inference was mocked; the single real request occurred only after these gates passed.

One initial full run exposed an intermittent concurrent-accounting test failure (60 reservations versus 90 expected). No production ledger was changed. The unchanged isolated accounting suite subsequently passed all 31 tests, followed by the complete 890-test pass. No assertion or accounting guard was relaxed. The cause of that intermittent failure remains unresolved and should be investigated separately; it is not presented as a repaired defect.

## Actual live request and persistence

- Project `6afa552c54e64817d5ac7218`, **Zipper Pouch**.
- Concept `0fb37fcc-ceb2-4c68-ab0e-121ea1157314`, run `6afa560554e64817d5ac721c`.
- Function **Organization and storage**; mandatory **ZIPPER**. Concept review remains APPROVED_FOR_DRAFTING version 1.
- Original recorded source: 162.0459 cm²; bounds 11.3889 × 23.3611 cm, from the disclosed synthetic calibration photo. Physical accuracy, material and grain remain UNVERIFIED.
- Operation `6afad1b09e45fec0b6b68a7b`.
- Campaign `mvp-technical-b244e309-546e-4d10-ad1d-08b2e1abfc89`.
- Receipt directory: `experiments/design-language/ai-spike/results/campaigns/mvp-technical-b244e309-546e-4d10-ad1d-08b2e1abfc89/`.
- Failure: `NETWORK_OR_TIMEOUT`, diagnostic kind **TIMEOUT**, phase **AWAITING_RESPONSE_HEADERS**, elapsed **120,011 ms**, deadlineExpired true, timeoutScope **CLIENT_DEADLINE**, transportCode null, cloudflareExecution **UNKNOWN**.

No provider HTTP status, finish reason, final JSON, input/output/reasoning tokens or Neurons were returned. There is therefore no raw response/envelope to recover; the exact request, reservation and sanitized failure are preserved. This evidence does not distinguish queueing, model latency or other upstream transport/provider causes. It does not show that the model generated nothing or that it was uncharged.

No new technical version was persisted because no output existed. Historical proposal `6afa577c54e64817d5ac721e`, version 1, remains the unchanged rejected GPT-OSS output, with its existing REVISE review. Request failure is a separate preserved operation, not a replacement design.

Reload verification and read-only database checks are recorded in `data/qwen-final/persistence.json`; owner database unchanged, raw historical response unchanged, inventory count zero and production readiness false. Screenshots/bootstrap evidence: `data/qwen-final/live-browser/` (confirmation, failure, final review and reload). No images were generated or reassigned.

## Engineering and quality findings

Complete JSON, local plan schema, component roles/counts/dimensions, cutting allowance demand, utilization, polygon validity, nesting, connectivity, supported joins, zipper construction and proposed BOM are **not assessable**: there is no new plan. No new cutting, nesting or assembly SVG was produced. Offline authored successes are not substituted for live evidence.

The zipper requirement remains intact in the request/provenance, but no functional closure is established. Even a future valid INSTALL would verify references only, not zipper tape/seam behavior, strength or manufacturing success. Physical manufacturing readiness remains UNVERIFIED.

## Comparison and recommendation

| Criterion | Historical GPT-OSS | Prior Qwen | This Qwen request |
|---|---|---|---|
| Provider outcome | HTTP 200 | HTTP 400 / 8006 | Client timeout; HTTP unknown |
| Final output | Truncated JSON | None | None received |
| Schema | Invalid/incomplete | Tuple encoding rejected | Locally audited; remote acceptance unknown |
| Tokens | 2,048 completion, finish length | Unreported | Unreported |
| Source context | Dense polygon copied into parts | Compact summary | Compact summary |
| Live compilation/nesting | Not achieved | Not run | Not run |
| Engineering quality | Insufficient complete evidence | Not assessable | Not assessable |

**Keep GPT-OSS as the default rollback option; do not promote Qwen on this evidence.** Neither historical result proves a reliable live engineering workflow. Qwen remains opt-in, not automatically retried or substituted.

Next recommended step: investigate the timed-out execution and actual usage through Cloudflare's account evidence, resolve the uncertain holds conservatively, and investigate the intermittent concurrent-accounting test. Any later inference needs sufficient newly verified headroom and a separate explicit authorization. A longer bounded timeout or different reasoning effort would be a new controlled experiment, not a demonstrated fix. No further requests are authorized by this report.

Final source commit/tag/bundle and append-only verified data backup are identified in `data/qwen-final/final-checkpoint.json` and `data/qwen-final/final-backup.json`. Normal launch: `npm run mvp`, `http://127.0.0.1:5173`. Qwen remains an explicitly selected server configuration; normal launch preserves the default model and owner workspace.
