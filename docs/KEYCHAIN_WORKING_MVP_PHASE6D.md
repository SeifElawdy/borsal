# Phase 6D: authored keychain pattern and current MVP gate

## Result

Phase 6C passed the source/secret/diff audit and **626/626 baseline tests** (127.27s), then was committed as **12ba49a**, `feat: add real keychain technical generation`. Current branch: **feature/keychain-working-mvp**. Phase 6D remains uncommitted.

The approved saved Burgundy Keychain now has an explicitly authored, editable **14 x 4 cm / 56 cm2** engineering draft, complete local cutting/stitching outlines, fold axes, BOM requirements, ring/thread references and assembly sequence. Actual local API submission created **version 2**, **HTTP 201**, **CONCEPT_ONLY / UNVERIFIED**; its SVG was retrieved with **HTTP 200** and opened/rasterized successfully.

**The full manufacturing-readiness flow is still blocked.** Local polygon/schema/reference checks passed, but nesting and the full feasibility pipeline were **NOT_RUN**, because the preserved source is DRAFT and required evidence is absent. No fabric-fit PASS, physical accuracy, manufacturing approval or stock availability is asserted. The returned report records the blockers instead of bypassing them.

## AI budget: 20 total, 12 consumed, zero inference

The owner-approved shared cap is centralized as `LIMIT=20` in `experiments/design-language/ai-spike/campaign.js`; every active concept/technical/experiment caller now checks the ledger's `limit` instead of a hardcoded 12. Eight slots remain. A future increase beyond 20 requires explicit owner approval; the cap itself does not authorize inference.

Historical legacy accounting remains **12**. Its existing baseline bytes, legacy hashes/counters, reservation files and campaign locks/results were not rewritten. New reservations can use slots 13..20 **only when separately authorized**; none was reserved here. Tests exercise reopening a consumed 12-slot ledger, preservation of old files, global exhaustion at 20, crash counting and concurrent process/worker protection. Existing cap tests now use 20 rather than 12 and seed 19 rather than 11 for the last-slot race; no safety assertion was loosened. Tests of historical 12-slot metadata remain unchanged.

**ZERO Cloudflare inference requests in Phase 6D.** No paid service/billing change, repair, retry or new campaign was used. All 81 pre-existing inference/ledger artifact hashes are checked for preservation.

## What was authored

Editable source: **`experiments/mvp-design-flow/keychain-draft.json`**. This is an explicit engineering draft made for this task, **not the original AI output and not a silently repaired import**. It includes:

- One 14 x 4 cm rectangle, one cut only, fabric demand **56 cm2** including all turn-ins and allowances; no extra fabric reinforcement is assumed.
- Separate closed stitching reference with corners `[0.5,1.2]`, `[13.5,1.2]`, `[13.5,2.8]`, `[0.5,2.8]`. Long lines are topstitch intent; the whole perimeter is not sewn before assembly.
- Long-edge turn-ins 1 cm at y=1/3, short-end turn-ins 0.5 cm at x=0.5/13.5, scalar seam allowance 0.5 cm, return axis x=7. The 0.5 cm return bend allowance is a hypothesis inside the one cut, not a verified bend calculation or additional fabric.
- One explicitly **D-shaped metal key-ring** requirement, nominal size target 2 cm, using existing D_RING vocabulary; its opening/key retention suitability is unresolved. This does not stand in for a circular split ring or assume an additional ring. THREAD BOM demand **150 cm** is a trial allowance, not known consumption or available stock. Fabric cotton/plain/200gsm, thread polyester/Tex40 and nickel ring finish are **illustrative compatibility requirements only**, not measured/confirmed source properties. No `fabricMaterialDeclaration`, stock snapshot, stock binding or source grain was filled in.
- Ordered six-step assembly instructions; INSTALL references `key-ring` at `[7,2]`, SEAM joins the existing short edges with `thread`, ATTACH reinforces distinct end anchors `[0.5,2]` and `[13.5,2]`. These local flat references do not prove assembled contact, load capacity or retention.
- Proposed folded envelope 6.5 x 2 cm and thickness 0.4 cm are unverified design hypotheses. Actual thickness, ring clearance, corner bulk, bend uptake, stitch settings and durability require a physical sample.

The original design schema/prompt are preserved **byte-for-byte**. An initial implementation added KEY_RING/RETURN enum entries, but two historical preservation tests correctly failed; those additions were reverted without changing the tests or their frozen fixtures. The final draft explicitly chooses a D-shaped ring requirement, and its center return remains UNSUPPORTED rather than being mislabeled as a pleat/box/hem. Its axis/allowance are retained in editable draft metadata and instructions; only the four supported hem axes are drawn. The legacy TOTE_BAG category is explicitly labeled accessory context; no parent tote is drafted or claimed.

The existing drafting report now carries its already-supplied fold data into the existing SVG renderer. Solid burgundy is cutting geometry, blue dashed is stitching, green dotted is supplied fold axes; hover titles identify fold type/allowance and UNVERIFIED status. No offset, geometry generation, stock inference or alternative feasibility algorithm was added.

## Original AI failure remains intact

Preserved rejection: proposal **6af7226d97539c233b2f5329**, version 1, status REJECTED. Its five exact base errors under `design.data.technical.bom` were:

| Path | Actual | Expected |
| --- | --- | --- |
| `[0].material.specs.fiber` | UNKNOWN | COTTON / POLYESTER / BLEND |
| `[0].material.specs.weave` | UNKNOWN | PLAIN / TWILL / SATIN |
| `[0].material.specs.weightGsm` | 0 | positive number |
| `[1].material.specs.finish` | UNKNOWN | BRASS / NICKEL / BLACK |
| `[1].material.specs.sizeCm` | 0 | positive number |

It also omitted explicit cutting instances/allowance geometry, demanded 10 cm2 of fabric for a 25 cm2 seam square, supplied inconsistent overall dimensions, referenced nonexistent THREAD BOM `thread`, and attached the same body anchor to itself without an installed ring connection. These are additional observations, not five more reported Zod issues. Raw response, provider usage, source/review hashes and version-1 errors are unchanged. The authored version is a new input, not a rewrite of that response.

## Actual isolated backend demonstration

```powershell
node experiments/mvp-design-flow/keychain-authored-demo.js data/my-new-keychain-demo
```

This command performs **no inference**. It reads only the original saved **test-suffixed** DB, verifies its current source/approval/version, and copies the exact fabric/run/proposal documents (same IDs/timestamps/hashes/review history) into a fresh UUID test DB. It disables live flags, posts the authored draft through the real local HTTP technical API, retrieves the persistent report/SVG, and checks both origin preservation and copied rejection/review preservation. It does not confirm geometry, refresh sources, create a review or reserve inventory. Origin auto-indexing is disabled; indexes are created only in the new target DB.

Final output: **`data/mvp-keychain-phase6d-002/`**. The earlier local `-001` scratch run is retained as superseded evidence from the subsequently reverted vocabulary change; use `-002` with the unchanged schema.

- Clone DB: `borsal-mvp-demo-d89fed04-90ee-4edf-905a-1f75326efcb8-test`.
- Original DB remains `borsal-mvp-demo-e5712b74-6cfb-4f15-b228-52d20925c41b-test`; original documents verified unchanged.
- Concept: **a96f954a-3083-491b-9976-93d3bdbb7111**; run: **6af715ab702bbc870df35fbc**; approval remains **APPROVED_FOR_DRAFTING**, review version **1**.
- New proposal: **6af73126673c0cb0c3e7f6d5**, technical version **2**. Source hash still `e292c567c497217d083a5d78a3263d066c800cc9bf0445e4c09614f7d723cff1`; sourceStale **false**.
- `authored-draft.json`: exact editable draft snapshot; `request.json`: exact POST body/source-file SHA-256.
- **`preview.svg`**: actual API SVG; `preview-check.png`: local inspection raster, not an AI image or product rendering.
- **`technical-proposal.json`**: persisted BOM, supported assembly, instructions/limitations, provenance and detailed bridge outcome.
- **`feasibility-report.json`**: UNVERIFIED readiness evidence, seven blockers, `pipeline:null`, no nesting result. This is not a fabricated full feasibility run.
- `transcript.json`: actual POST and GET responses; `summary.json` and `clone-provenance.json`: outcomes/source DB hashes.

Exact executed POST: `/api/concept-runs/6af715ab702bbc870df35fbc/concepts/a96f954a-3083-491b-9976-93d3bdbb7111/technical-proposals`, with `origin:AUTHORED`, `expectedReviewVersion:1`, `expectedTechnicalVersion:1`, and the proposal from the editable draft. **201 CONCEPT_ONLY / UNVERIFIED**, zero technical errors. GET report **200**, GET SVG **200**. Local cut is **14 x 4 cm / 56 cm2**, but fit in the irregular scrap is not established.

To inspect the retained clone with live generation disabled:

```powershell
node experiments/mvp-design-flow/serve.js borsal-mvp-demo-d89fed04-90ee-4edf-905a-1f75326efcb8-test
curl.exe http://127.0.0.1:3001/api/technical-proposals/6af73126673c0cb0c3e7f6d5
curl.exe http://127.0.0.1:3001/api/technical-proposals/6af73126673c0cb0c3e7f6d5/preview.svg -o data/my-keychain-preview.svg
```

Do not reuse expectedTechnicalVersion 1 on an already-versioned clone; create a new demo directory/DB to reproduce. The actual JSON request/response bodies are in the transcript rather than substituted examples. All generated/private evidence remains Git-ignored under `data/`.

## Remaining gate and next steps

Existing readiness checks report: **CONFIRMED_FABRIC_REQUIRED**, **FABRIC_REVISION_REQUIRED**, **FABRIC_GRAIN_REQUIRED**, **FABRIC_MATERIAL_SPECIFICATIONS_REQUIRED**, **EXPLICIT_STOCK_SNAPSHOT_REQUIRED**, and **STOCK_BINDING_REQUIRED** for thread and key-ring. No gate was weakened to obtain a fit or approval. Overall **CONCEPT_ONLY / UNVERIFIED**; nesting **NOT_RUN**, no fabric-fit geometry verdict or global impossibility claim.

1. Human reviews the actual pattern SVG, six-step draft and BOM/engineering assumptions. A product-appearance preview would be illustrative until a folded physical sample or verified assembly geometry exists; the current SVG is a flat pattern, not a product photo.
2. Obtain independent print/scale checks, actual fabric/grain/material measurements and ring/thread specifications. Explicitly confirm the intended source geometry through the existing versioned API, then perform an explicitly reviewed source refresh/re-review: changing DRAFT/source geometry changes its hash, and the current API deliberately rejects silent rebasing. **That refresh workflow is still a blocker**, not something this demo bypasses.
3. Supply a genuine stock snapshot/bindings and rerun nesting/material/construction checks against the confirmed reviewed source. Make/test a physical sample for dimensions, fold clearance, seam/retention/load/abrasion; no structural PASS would replace that evidence.
4. Only after final human approval and separately scoped safety work, add conditional transactional inventory reservation with revision coordination, idempotency and concurrency tests. No inventory endpoint/state was changed here; local write routes remain disabled by default and unsuitable for public unauthenticated deployment.

## Verification

Initial focused tests: **71/71 passed**, four files, **19.23s**. The first full run exposed two historical schema/prompt preservation failures (630 passed, 2 failed); the enum changes were reverted, and those tests were not modified. Targeted contract/API recheck then passed **34/34**, three files, **11.40s**. New API tests cover authored references/area, DRAFT/unknown-stock gating with a readable persistent SVG, immutable rejected history, invalid cut/edge/thread rejection and mandatory approval. Existing tests changed only where the explicitly approved shared-cap value required new expectations; no tolerance/geometry safeguards were loosened. Final regression and preservation checks are recorded after execution below.

Final full regression: **632/632 passed**, **33/33 files**, **133.19s**. The original schema SHA-256 is restored exactly: `a5d1f33d02819c4cec7613b5b9819e965eb1e09eec24b8b16149f50f40276695`. `git diff --check`, intended source/documentation secret and whitespace scans passed. All **81/81** prior campaign/ledger files retain their hashes; no slots 13..20 exist, so usage remains **12/20**, eight remaining, **zero inference**. Final SVG was rasterized and visually inspected. Original saved DB records, cloned rejection/review history and DRAFT fabric were verified preserved. No Phase 6D commit, push, merge or inventory mutation occurred.
