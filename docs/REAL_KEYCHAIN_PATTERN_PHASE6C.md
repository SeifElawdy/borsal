# Phase 6C: approved Burgundy Keychain technical attempt

## Audit and implementation

Phase 6B passed the source/security/diff audit and **616/616 baseline tests**, 32 files, 118.55s. Its eight intended files were committed as **14d730e**, `feat: integrate MVP technical design flow`. Work continued on **feature/real-keychain-pattern-mvp**. Phase 6C is uncommitted; no push or merge.

The existing local concept router now provides POST `/api/concept-runs/:runId/concepts/:conceptId/technical-proposals/generate`. It reuses the existing compact technical contract, Cloudflare provider, atomic shared request ledger, technical-proposal transaction, 5E review handoff, 5B drafting and existing bridge/feasibility engines. The only contract adaptation is the API envelope and selected concept/source, not a new design schema or engine. Imported raw output is never repaired.

The route retains the default-disabled MVP/loopback gate. LIVE additionally requires `BORSAL_TECHNICAL_LIVE=1`, `BORSAL_WORKERS_FREE_CONFIRMED=1` and body `freeTierConfirmed:true`. MOCK requires a server-injected mock provider; tests use temporary evidence directories and isolated test databases. Provider execution is outside database transactions: only deterministic persistence/validation may be retried by the transaction driver. There is one inference call, no repair, retry or fallback. Approval, source hash and technical version are rechecked after the response; a conflict preserves raw campaign evidence without silently rebasing it.

Source changes: `src/services/technicalGeneration.js`, small additions to `src/routes/concepts.js` and `src/services/technicalFlow.js`, export of the existing safe file writer from `src/services/conceptFlow.js`, focused tests in `src/routes/technicalProposals.test.js`, and `experiments/mvp-design-flow/keychain-live.js`. No dependency, design-schema, geometry, nesting, inventory or FabricPiece changes.

## Human decision and saved source

- Concept: **Burgundy Keychain**, API ID **a96f954a-3083-491b-9976-93d3bdbb7111**, model ID `burgundy-keychain`.
- Original concept run: `6af715ab702bbc870df35fbc`; fabric: `6af715aa702bbc870df35fba`.
- Isolated retained database: `borsal-mvp-demo-e5712b74-6cfb-4f15-b228-52d20925c41b-test`. The production database was not used.
- Explicit user approval persisted through the review API: **HTTP 200**, review version **1**, `APPROVED_FOR_DRAFTING`, reviewer `USER_EXPLICIT_PHASE6C`. This is not manufacturing approval. Cuff/brooch review versions remain 0.
- Reviewer-authored brief preserves all seven supplied requirements, including a simple small burgundy fabric key fob, **one metal key ring**, simple construction, proposed geometry only, and explicit uncertainty. Exact request is saved in `data/mvp-keychain-phase6c-001/api-2.json`; reusable brief is in `keychain-live.js`.
- Concept raw SHA-256: `064d87839e18a1c0f113f4602c43cfe75601f0ff89b84c24a8b9d8c78f3c1a5b`; review SHA-256: `54e2d6d12144ef701fb724574e6739e33948b62237d811ba0ed1bffc97c7f45e`.
- Source hash remained `e292c567c497217d083a5d78a3263d066c800cc9bf0445e4c09614f7d723cff1`; original analysis `445d047f-3437-4dd1-b8e3-a1bd40abfb77` and photo links are preserved. Saved source remains **DRAFT / AVAILABLE**, not geometrically confirmed or physically verified. No source confirmation or source mutation was performed.

## Actual single inference

Campaign: **phase6c-burgundy-keychain-001**. Model: **@cf/meta/llama-3.3-70b-instruct-fp8-fast**. Workers Free was explicitly confirmed by the user; no account-plan/usage-read probe, paid service or billing change was made.

Parameters: JSON Mode `response_format:{type:"json_object"}`, `stream:false`, `temperature:0.7`, `max_tokens:6144`. Only the allowed timeout override is 120,000ms. Prompt size: **11,361 UTF-8 bytes**; existing conservative preflight ceiling: **1,898.35392 Neurons**, below 2,000. The estimate is not actual usage or proof of remaining daily allocation.

**One request dispatched**, checkpoint/global slot **12** recorded before inference. Provider **HTTP 200**; prompt **3,395 tokens**, completion **793**, total **4,188**; reported **252.94735717773438 Neurons**. Finish reason **stop**, truncation **false**. Raw JSON parses successfully, 2,175 UTF-8 bytes; no whitespace loop was observed. Technical JSON is invalid despite valid JSON syntax.

Generation API returned **HTTP 201** with persisted proposal **6af7226d97539c233b2f5329**, version **1**, status **REJECTED**, verdict **FAIL**, manufacturingVerified **false**. GET report returned **200**, sourceStale **false**. Proposal insertion and technical-history append both persisted; raw bytes match the campaign artifact exactly. The fabric record is unchanged. Shared ledger is now **12/12**; no requests remain under this authorization/cap.

## Exact validation result

The existing drafting validator produced **five technical errors**, all under `design.data.technical.bom`:

| Path suffix | Actual | Required |
| --- | --- | --- |
| `[0].material.specs.fiber` | `"UNKNOWN"` | COTTON / POLYESTER / BLEND |
| `[0].material.specs.weave` | `"UNKNOWN"` | PLAIN / TWILL / SATIN |
| `[0].material.specs.weightGsm` | `0` | finite positive number |
| `[1].material.specs.finish` | `"UNKNOWN"` | BRASS / NICKEL / BLACK |
| `[1].material.specs.sizeCm` | `0` | finite positive number |

The model encoded unknown facts with invalid enum/zero placeholders rather than omitting unknown required fields and retaining an incomplete proposal. None was substituted with invented properties. The outer assessment's `schemaValid:true` refers to the **already-valid creative concept**, not the rejected technical design; the nested drafting errors above are authoritative for this proposal.

The response describes the selected keychain and one stock accessory, with NOT_CHECKED availability. Its technical hypotheses include overall dimensions **10 x 5 x 1 cm**, one **5 x 5 cm seam-line square**, scalar allowance **0.5 cm**, and proposed local grain direction **0 degrees**. These are model hypotheses, not measured fabric/finished-product facts. The explicitly closed square passes a standalone polygon-shape check; this does not establish a cutting pattern or fit.

Independent read-only observations, **not extra reported Zod issues**: the response omits `context.instances` and hence supplies no explicit cutting outline/allowance geometry; ATTACH references absent THREAD BOM ID `thread`; it attaches the same body anchor to itself instead of connecting the accessory; no INSTALL links the ring; hardware kind D_RING is not an independently verified key-ring specification. Fabric BOM demand is 10 cm2 while the proposed seam square alone is 25 cm2; overall dimensions and construction are not reconciled. These defects are not fixed or hidden by the five base errors. Cross-field/engineering checks were not established after base validation failed.

Existing drafting stopped safely at rejection. **No bridge/pipeline execution, nesting placement, feasibility PASS or SVG was produced.** Persisted feasibility and SVG fields are null. Root limitations retain fabric durability and ring-specification uncertainty, but do not resolve the missing cutting/attachment/thread information.

## Evidence and local API inspection

All generated files remain ignored/local:

- `experiments/design-language/ai-spike/results/campaigns/phase6c-burgundy-keychain-001/`: lock, request, pre-inference checkpoint, provider response, `raw-response.txt`, persisted `proposal.json`, result.
- `data/mvp-keychain-phase6c-001/summary.json`: actual outcome/usage.
- `data/mvp-keychain-phase6c-001/api-1.json` through `api-4.json`: exact executed GET/review/generation/report HTTP requests and responses.
- `data/mvp-keychain-phase6c-001/technical-proposal.json`: full immutable version-1 report, raw text, errors and generation/source provenance.
- `data/mvp-keychain-phase6c-001/technical-errors.json`: exact nested drafting error objects.
- Raw proposal SHA-256: `c1b07d8a351408fcc4b7a5fc8e9fe653182321b38d92537499a3277550c39459`.
- **SVG path: none**, because technical validation failed. No illustrative replacement SVG was fabricated.

The exact executed generation request body was:

```json
{"mode":"LIVE","campaignId":"phase6c-burgundy-keychain-001","freeTierConfirmed":true,"expectedReviewVersion":1,"expectedTechnicalVersion":0}
```

It was POSTed to `/api/concept-runs/6af715ab702bbc870df35fbc/concepts/a96f954a-3083-491b-9976-93d3bdbb7111/technical-proposals/generate`. **Do not replay**: campaign IDs are exclusive, technical versions advance, and the shared budget is exhausted. Reopen saved read-only results through the local server:

```powershell
node experiments/mvp-design-flow/serve.js borsal-mvp-demo-e5712b74-6cfb-4f15-b228-52d20925c41b-test
curl.exe http://127.0.0.1:3001/api/technical-proposals/6af7226d97539c233b2f5329
```

## Tests, preservation and next action

Full regression **626/626 passed**, **32 files**, **138.56s**, before inference. Final focused API run **21/21 passed**, **42.42s**. Ten new tests cover single dispatch/persistence, invalid/incomplete output, approval/brief gating, duplicate/unsafe campaigns, timeout diagnostics, source change during inference, compact prompt/source preservation, concurrent campaign starts and the explicit human brief. All 616 previous tests remain passing and unchanged in behavior; no thresholds were loosened.

All **73 prior artifact hashes** match the pre-phase manifest; prior locks/results/ledger slots were not changed. Only a new campaign and request slot 12 were added. No inventory reservation, public deployment or manufacturing approval occurred.

Final `git diff --check` and intended source/documentation secret/whitespace scans passed. Generated evidence remains Git-ignored; the new campaign has exactly one inference checkpoint. Phase 6C changes remain uncommitted.

**MVP status:** live approved concept -> inference -> raw persistence -> technical validation -> persisted rejection works end-to-end. A successful real concept -> valid cutting pattern -> nesting -> SVG/feasibility has **not** been achieved. The synthetic authored case remains the successful technical-flow proof from Phase 6B.

Next action: review the saved rejected proposal and provide an explicitly authored, source-linked technical draft with cutting/stitching outlines, actual ring/thread requirements and assembly connections. Leave material/grain/stock/physical evidence unresolved until independently supplied. Source confirmation/refresh must be an explicit reviewed action because the original source is DRAFT and changing it changes its hash. No additional inference is authorized or available in the exhausted shared budget; do not reset it or silently repair this version.
