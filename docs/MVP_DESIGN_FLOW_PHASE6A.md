# Phase 6A: local persistent concept MVP

Phase 5E audit passed security/diff/isolation checks and **587/587 baseline tests** (30 files, 93.59s). Only its six intended files were committed as **82e7898**, `feat: add staged creative concept review`. Current branch: **feature/mvp-design-flow**. Phase 6A is uncommitted.

## What runs

The local Express backend now registers a photo through the existing fabric API, generates 2–3 alternative creative concepts in one provider request, stores the complete raw response and per-concept validation/provenance, accepts explicit versioned reviews, and hands only an approved concept to existing 5B/5A/4D drafting/feasibility. It never generates missing technical geometry, auto-approves, confirms fabric geometry, reserves stock or grants manufacturing approval.

Files: `src/models/ConceptRun.js`, `src/services/conceptFlow.js`, `src/routes/concepts.js`, `src/routes/concepts.test.js`, small mounts/binding changes in `src/app.js` / `src/server.js`, and `experiments/mvp-design-flow/{demo,serve}.js`. Existing FabricPiece models and fabric routes are unchanged. No dependency was added.

## Local enablement and endpoints

**Disabled by default.** Set `BORSAL_MVP_DESIGN_FLOW=1` only for local development. Requests require a loopback socket address; forwarded headers do not grant locality. With the feature enabled, `src/server.js` binds to 127.0.0.1. There is no new authentication: do not deploy publicly, reverse-proxy this port or connect these demos to real inventory. Existing fabric endpoints retain their validation and behavior.

| Method/path | Body / result |
| --- | --- |
| POST `/api/fabrics/:fabricId/concepts` | Strict `{mode:"MOCK"}` by default. LIVE additionally needs a fresh campaignId and freeTierConfirmed:true plus server flags below. Returns 201 with persistent run, raw text, concepts, source snapshots, errors and provider usage; provider failure returns 502 with persisted failure run. |
| GET `/api/fabrics/:fabricId/concepts` | Persistent runs and their individual concepts, newest first |
| GET `/api/concept-runs/:runId` | Full saved run, raw output, per-concept validation and histories |
| POST `/api/concept-runs/:runId/concepts/:conceptId/review` | `{expectedVersion:0,review:<existing Phase 5E review>}`; explicit APPROVED_FOR_DRAFTING / REVISE / REJECTED. Returns incremented reviewVersion and append-only history. |
| POST `/api/concept-runs/:runId/concepts/:conceptId/handoff` | `{expectedVersion:1,design?:<existing 5B design wrapper>,context?:<explicit 5A context without fabric>}`; requires latest approval/current source. Missing technical data remains CONCEPT_ONLY. |

Reviews use the proposal/source hashes returned in each concept's assessment, reviewer/rationale and optional explicitly reviewer-authored draftingBrief. No review is synthesized from the model. Approval without that brief cannot invent one at handoff. Client-controlled server fields and fabric overrides are rejected. The server supplies only actual fabric geometry/revision/grain declarations; unknown fabric material/stock is not filled.

## Persistence and safety boundaries

`ConceptRun` stores fabric reference, campaign/mode, immutable source snapshot, source hashes, complete raw batch output, normalized provider metadata, batch/per-concept validation errors, individual IDs, reviewVersion/review history and handoff history. Per-concept raw text is JSON.stringify of the original parsed child (hash basis stated in assessment); the full original batch text is separately preserved byte-for-byte in run.rawText and live artifacts. No model field controls server approval/history.

Source snapshot records current analysis/photo evidence and stored geometry/basis. Confirmed geometry linked to an older photo retains that exact older basis; a later photo is not silently substituted. The Cloudflare prompt includes geometry, reference IDs and an evidence hash, **not local photo paths or database credentials**. Appearance labels are user declarations, not inferred image/color/material facts.

Review and handoff recheck the current source hash. Changed analysis/photo/geometry/status rejects with 409 FABRIC_SOURCE_CHANGED. ConceptRun optimistic concurrency and expectedVersion return deterministic 409 conflicts instead of lost review/history updates. This is snapshot-based MVP coordination, not an atomic cross-document manufacturing/inventory transaction: a later fabric change makes the saved review stale, and handoff checks again. No manufacturing/inventory operation depends on these approvals.

The human reviewer identity is declared and unauthenticated. Semantic originality, completeness, realistic construction and honesty inside free text still require human review. Exact duplicate concept IDs/names are rejected, but semantic diversity is not automatically proven. Raw/invalid output is preserved without repair; failed saves do not trigger another inference. REQUESTED/FAILED runs remain evidence after interruption.

## Offline tests and demo

```powershell
npx vitest run src/routes/concepts.test.js --reporter=dot
node experiments/mvp-design-flow/demo.js --mock data/my-new-mvp-demo
npm test -- --reporter=dot
```

The demo starts an actual HTTP server on ephemeral loopback, uses multipart `data/test-mat40.png` / matPreset=large, and chooses a unique **borsal-mvp-demo-UUID-test** database and upload directory. It never uses the real inventory DB. Demo databases/uploads are intentionally retained for human selection; integration tests use different UUID databases and drop only their own database afterward.

Actual offline demo: `data/mvp-design-flow-6a-mock-001/summary.json`. Registration 201, generation 201, GET list 200, two mock pending concepts. Mock names and review decisions are not live AI results. **18/18 new integration tests passed**, covering persistence/listing, photo provenance, approval/history gates, concurrent review 200/409, stale hash/version/source rejection, strict server-field protection, disabled/live guards, invalid output, one-shot transport and database failures, no inventory mutation, geometry absence and duplicate concepts.

Full regression **before live inference**: **605/605 passed**, 31 files, **97.66 seconds**, including all 587 baseline tests unchanged. No tolerance/test was weakened. An initial wrapped-Zod usage error and reserved Mongoose field name were corrected before this passing run.

## One authorized live request

Executed once through the local multipart/API demo:

```powershell
node experiments/mvp-design-flow/demo.js --live data/mvp-design-flow-6a-live-001
```

LIVE requires `BORSAL_CONCEPT_LIVE=1`, `BORSAL_WORKERS_FREE_CONFIRMED=1` and explicit request confirmation. The authorized demo sets these only in its own process; `.env` is unchanged. It reuses the existing approved Cloudflare provider, model **@cf/meta/llama-3.3-70b-instruct-fp8-fast**, JSON Mode, temperature 0.7, max_tokens=6144 and bounded 120-second timeout. Free-plan confirmation from the owner was reused; no paid billing, usage/account probe or fallback occurred. Remaining account-wide allocation was not invented; the retained conservative ceiling is 1,898.35392 Neurons.

Campaign **phase6a-burgundy-concepts-001** uses the original shared ledger and exclusive campaign directory. A checkpoint and **slot 11** were reserved before the sole provider call. One request, zero retries/repairs/fallbacks. All **66 prior campaign/budget artifact hashes remain unchanged**. Shared budget is now **11/12**, one slot remains. Reusing a campaign cannot reset/bypass limits; a losing concurrent campaign does not write into another campaign's artifact directory.

Provider HTTP **200**, API generation HTTP **201**, state **RECEIVED**. Three schema-valid concepts, all **PENDING_REVIEW**, zero reviews/handoffs:

| Actual live concept | Use / feature intent | Still unverified |
| --- | --- | --- |
| Burgundy Wrist Cuff | Fashion accessory with an elastic section | Sizing, fabric suitability, elasticity/comfort, elastic availability and assembly |
| Burgundy Keychain | Key holder with a key ring | Ring availability, attachments, strength, tear/abrasion resistance |
| Burgundy Brooch | Fashion accessory with a pin | Pin availability, safe attachment, retention, colorfastness/texture |

The model's phrase “synthetic burgundy fabric” is not a verified fiber/material specification; the source is a synthetic test image/geometry. Its adjectives “sturdy”/“secure” describe proposed intent, not tested hardware performance. These are commonplace concepts, not proof of creative novelty or technical feasibility. No measurements, stock availability or cutting geometry were produced. The human must select/revise/reject explicitly; **none was automatically approved**.

Usage: **1,701 prompt + 558 completion = 2,259 tokens**, **159.64308166503906 Neurons**. Finish reason **stop**, truncated=false. No manufacturing approval or output image generation occurred.

## Open the actual saved live result

Live evidence/artifacts: **`data/mvp-design-flow-6a-live-001/`** (`registration.json`, `concept-run.json`, `summary.json`, `persistence-check.json`, original photo under uploads/). Raw provider/provenance evidence is also preserved in ignored **`experiments/design-language/ai-spike/results/campaigns/phase6a-burgundy-concepts-001/`**.

Reopen the isolated demo for human selection (live generation disabled by this launcher):

```powershell
node experiments/mvp-design-flow/serve.js borsal-mvp-demo-e5712b74-6cfb-4f15-b228-52d20925c41b-test
curl.exe http://127.0.0.1:3001/api/fabrics/6af715aa702bbc870df35fba/concepts
curl.exe http://127.0.0.1:3001/api/concept-runs/6af715ab702bbc870df35fbc
```

Use the chosen concept ID from that response and its exact assessment hashes to author a review JSON file. Example request after authoring it:

```powershell
curl.exe -X POST http://127.0.0.1:3001/api/concept-runs/6af715ab702bbc870df35fbc/concepts/7588e40c-fc91-4921-9684-2dc22bdcef46/review -H "Content-Type: application/json" --data-binary "@data/my-explicit-review.json"
```

Do not copy a simulated demo approval for a real human decision. New review/handoff commands change only ConceptRun history, not fabric inventory. Source changes require a fresh generation/review; raw historical runs are not overwritten. A future live request needs separate authorization; the saved-demo server does not enable it.

Read-only re-open verification actually performed: GET list **200**, three persisted concepts all pending, unapproved handoff **409**, fabric **DRAFT/AVAILABLE**, geometry unconfirmed, original photo exists, analysis ID **445d047f-3437-4dd1-b8e3-a1bd40abfb77**. Raw provider text in MongoDB matches its artifact (SHA-256 **9f5e1b32a71085c7d7489d52d8c285e3b37af54933156cf7bea27c9c34be623a**).

Limits: local unauthenticated development only; no public deployment, pagination/retention hardening, reviewer authentication or atomic inventory transactions. Fabric physical accuracy and all manufacturing feasibility remain unverified. Technical drafting waits for explicit approval and independently supplied geometry/BOM/stock. No Phase 6A commit, push or merge was performed.

Final checks: the registered synthetic sample reports **11.3889 x 23.3611 cm**, **162.0459 cm2**, **74 points**, with the existing warning that physical print scale was not independently ruler-checked. Credential scans of new source, documentation and saved live artifacts passed. New-file whitespace and tracked `git diff --check` passed; preexisting app/server EOF formatting was retained. Live artifacts/demo uploads remain Git-ignored. Final source is the same as the passing 605-test run; only documentation and isolated demo evidence followed. Phase 5E commit **82e7898** is still HEAD; no Phase 6A commit/push/merge. No implementation blocker remains for local concept selection, while human review and technical/physical evidence remain outstanding.
