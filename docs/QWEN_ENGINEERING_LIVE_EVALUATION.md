# Qwen engineering evaluation — November 16, 2026

## Recovery

Starting source: `6bb498cc8f7697139a253e20af8056fa57550260`, clean. Branch: `feature/qwen-engineering-evaluation`.
New recovery tag: `borsal-pre-qwen-20261116T073424780Z`.
Verified private backup: `E:/Borsal-Recovery/borsal-pre-model-upgrade-20261114T170313Z/pre-qwen-20261116T073424780Z/`.
Official MongoDB dump/isolated restore verified 87 owner-workspace documents across 10 collections with matching document/index hashes; 1,209 preserved files. Git bundle isolated clone and fsck passed. Earlier full backups, the approved Zipper Pouch test database, original photos, preview galleries and release ZIP remain preserved. Restore instructions are in the private backup's `RESTORE.txt`; never overwrite active databases or replace a newer usage ledger.

## Configuration and implementation

Qwen is a separate server-selected ENGINEERING profile. Set `BORSAL_ENGINEERING_MODEL=QWEN`; rollback is `GPT_OSS` or unset. GPT-OSS remains the default because this evaluation does not establish Qwen output quality. Concept Llama and FLUX providers, engineering primitives, compiler, design identity, nesting/assembly validators and production safeguards are unchanged.

Native request: `POST /client/v4/accounts/{account}/ai/run/@cf/qwen/qwen3.8-27b` with:

```json
{
  "messages": [{"role":"system","content":"engineering contract"},{"role":"user","content":"active design and compact source summary"}],
  "reasoning_effort":"xhigh",
  "max_completion_tokens":8192,
  "stream":false,
  "temperature":0.3,
  "response_format":{"type":"json_schema","json_schema":{"name":"borsal_engineering_plan","strict":true,"schema":{}}}
}
```

`schema` above is a placeholder for the generated existing engineering-contract schema, not the actual empty outgoing schema. Request artifacts contain the full schema. `max_tokens` is not sent. Client timeout remains bounded at 120 seconds. Strict extraction accepts only final assistant content from the documented Chat Completions result wrapper, never reasoning, refusal or tool output. Reasoning-token usage is retained when reported. No retry/fallback exists.

The strict generation subset derives from `borsal.engineering-plan/0.1`: required component purpose, shape, quantity and allowance; explicit material quantity or thread-estimate branch; complete operations/changes/unresolved arrays. Optional unknown source/grain fields are omitted, not replaced by invented values. Local Zod validation remains authoritative.

The prompt retains product name, function, zipper requirement and authoritative design provenance. Source context contains bounds, usable area, occupied fraction of bounding rectangle, vertex count and hole count. No exact source vertices are sent. The original polygon and holes remain unchanged in the deterministic host for independent containment/nesting.

Official sources: [model](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/), [native input schema](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/sync-input.json), [native output schema](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/sync-output.json), [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

## Free-tier protection

Documented Qwen rates: 40,909 input and 290,909 output Neurons per million tokens. No cached-input discount is assumed. Input is conservatively bounded by 24,000 serialized request bytes (including JSON Schema) plus 1,024 overhead tokens. Completion ceiling includes both reasoning and final output.

`ceil(((24000+1024)*40909 + 8192*290909)/1000000 * 1.15) = 3918` Neurons. Reservation: **4,000**. Every request checks the current model-specific estimate atomically before dispatch. The dialog shows model, xhigh effort, 8,192 completion tokens, JSON Schema format, hold and verified remaining allowance.

The preserved Zipper Pouch workspace had a valid OWNER_DASHBOARD_ATTESTATION, paidPlan false, no block, expiry November 17 UTC and 7,650 reserved-headroom Neurons. After this request its conservative balance is 3,650; this is retained reservation accounting, not a report of actual billed usage. No billing configuration or Gateway credits were changed.

## The one real request

Existing project `6afa552c54e64817d5ac7218`; source fabric `6afa553154e64817d5ac7219`; run `6afa560554e64817d5ac721c`; selected concept `0fb37fcc-ceb2-4c68-ab0e-121ea1157314`. Name **Zipper Pouch**, function **Organization and storage**, closure **ZIPPER**, APPROVED_FOR_DRAFTING review version 1. The prior technical REVISE decision and rejected GPT-OSS raw proposal remain intact.

Source is the explicitly disclosed synthetic calibration photograph, not independently measured real fabric: 11.3889 × 23.3611 cm bounds, 162.0459 cm² recorded polygon area. Geometry confirmation is not independent physical verification.

The existing normal React confirmation was opened and inspected at 1440/1920 before dispatch. Exactly one confirmed Qwen request was made after offline verification. No concepts or images were generated.

- Operation receipt: `6afac1c8cd4aa98fdb1acbbe`.
- Campaign: `mvp-technical-43752d22-8a2e-440a-bdea-10140297f9c2`.
- Artifacts: `experiments/design-language/ai-spike/results/campaigns/mvp-technical-43752d22-8a2e-440a-bdea-10140297f9c2/`.
- HTTP **400**, provider code **8006**, approximately **498 ms**, no timeout.
- Exact provider error: unsupported JSON Schema at `/properties/components/items/properties/shape/oneOf/2/properties/vertices/items`; tuple `items` must not be an array and must instead use Draft-2020-12 `prefixItems`.

The adapter sent Draft-7 tuple representation generated by Zod. Cloudflare's native model input schema permits a JSON Schema object but does not specify this draft limitation. This live response conclusively demonstrates the serialization incompatibility. It is an **integration defect**, not evidence that Qwen failed to understand a product.

There was no final model content or usable engineering plan (`result` was empty). No tokens/Neurons were reported. Actual provider-side execution/billing is unknown; usage is never assumed zero. Global request accounting advanced **68 → 69** and the 4,000-Neuron hold is retained. No retry, repair or fallback request was made.

## Offline correction after the failure

The model-specific schema serializer now uses Draft-2020-12, with `prefixItems` for coordinate tuples. The local engineering contract and validators were not changed. The exact sanitized HTTP error is an offline regression fixture. Tests verify correct tuple encoding, preserve the provider error/code, and assert exactly one mocked dispatch without retry. The corrected schema has **not** received a live request; a further attempt requires new explicit authorization.

## Actual quality assessment

| Criterion | Result |
|---|---|
| Provider transport | Response received; HTTP 400 schema rejection |
| Complete final JSON / schema-valid engineering | Not assessable: no model output |
| Product/zipper identity | Preserved in request and saved provenance; no output to compare |
| Component roles/dimensions | Not assessable |
| Compiler, geometry and nesting | Not run: no construction proposal |
| Assembly / zipper installation | Not run; no functional zipper claim |
| Cutting/nesting/assembly SVGs | None produced by this live request |
| Physical readiness | UNVERIFIED; no manufacturing/inventory approval |
| Persistence | Failed receipt/envelope retained; previous proposal and review preserved |

No derived technical version was created. Existing version 1 remains unchanged. The failure is displayed honestly in the guided UI; no empty pattern is presented as successful. Screenshots and saved bootstrap evidence: `data/qwen-engineering/live-browser/`. Mocked offline generalization evidence is separate and does not substitute for this failed live evaluation.

## Comparison with GPT-OSS

| Evidence | GPT-OSS prior request | Qwen single request |
|---|---|---|
| HTTP | 200 | 400 |
| Final output | Truncated JSON, finish length | None; request schema rejected |
| Completion budget | 2,048 / 2,048 used | 8,192 configured; actual usage unreported |
| Source context | Dense 74-point polygon copied into components | Compact statistics; exact polygon retained only by host |
| Structured format | json_object | Strict json_schema; tuple draft incompatible in actual request |
| Geometry / assembly | No validated complete design | No plan to assess |

This is not a controlled model-quality ranking: input representation, output format and budgets differ, and Qwen produced no engineering output. **Do not replace GPT-OSS as the default on this evidence.** Keep Qwen opt-in after the offline serialization correction, pending a newly authorized evaluation. Even a future complete plan must pass independent geometry/nesting/assembly checks; INSTALL validates references, not physical zipper construction.

## Verification and recovery references

Pre-live: 888 tests across 72 files passed; production build and real Edge 1440/1920 workflow passed. Native provider tests cover exact fields, strict schema, final-only extraction, reasoning-only/null output, truncation, unsupported profiles and no fallback. API tests cover real compiler/nesting, identity/version preservation, idempotent accounting and insufficient Free-tier headroom. All automated inference is mocked.

Final verification results, final commit/tag/bundle and append-only live-database backup are recorded in `data/qwen-engineering/final-checkpoint.json` and `data/qwen-engineering/final-backup.json`. Earlier source/data backups and submission ZIP are never overwritten. `npm run mvp` starts the normal local workspace at `http://127.0.0.1:5173`; opting into Qwen requires `BORSAL_ENGINEERING_MODEL=QWEN` and current sufficient Free-tier verification. Every live request still requires separate confirmation.
