# Phase 6E: keychain geometry and synthetic feasibility

Phase 6D audit/secret/diff checks and **632/632 baseline tests** passed (130.39s); intended files were committed as **1d5c996**, `feat: add editable keychain engineering draft`. Branch: **feature/keychain-feasibility-mvp**. Phase 6E remains uncommitted. **Zero Cloudflare requests; budget unchanged at 12/20.**

## Actual result

The existing **14 x 4 cm** cut genuinely fits the **original irregular synthetic burgundy polygon**. The existing bounded engine found a layout in **16 attempted candidates**, rotation **90 degrees**, translation **[27.051666666666666, 14.579444444444443] cm**. Its complete-layout validator returned geometry **PASS**. No dimensions, contour or search tolerances were changed to force this result; no new editable pattern was needed.

Cut area **56 cm2**, source usable area **162.045910493827 cm2**, remaining area **106.04591049382711 cm2**, utilization **34.558107532206535%**. These are mathematical results on supplied synthetic centimeter geometry, not independently measured physical facts. The preliminary run is labeled **PRELIMINARY GEOMETRY ONLY** and never upgrades readiness. Search remains bounded at the draft's 2,000 candidates/20 backtracks and grid [2,1,0.5] cm; NO_LAYOUT_FOUND would not prove impossibility.

The full existing pipeline was then reached through the actual local API using explicit **TEST_FIXTURE** evidence in a new isolated clone:

| Check | Actual verdict | Scope |
| --- | --- | --- |
| Nesting + independently revalidated geometry | PASS / LAYOUT_FOUND | Original irregular polygon; unchanged cutting geometry |
| Allowances / grain | PASS | Declared cutting outlines; synthetic grain 90 degrees only |
| Material specifications | PASS | SYNTHETIC_FIXTURE declaration matches draft requirements; no claim about real fabric |
| Stock | PASS | Supplied test snapshots: 150 cm thread, one D-shaped ring; no real inventory |
| Assembly references | PASS | Existing piece/edge/thread/ring IDs and flat anchors |
| Construction | UNVERIFIED | Fold process, ring opening/retention, seam/load/3D contact remain unproved |
| Physical evidence | UNVERIFIED | Scale/material accuracy, durability and manufacturing not verified |
| Overall | **CHECKED / UNVERIFIED** | **manufacturingVerified=false**, inventoryMutated=false |

A second proposal with test ring availability reduced to zero returned **FAIL**, material layer FAIL. Geometry success did not mask the shortage.

## Seven blockers and explicit revision flow

| Phase 6D blocker | Explicit synthetic resolution |
| --- | --- |
| CONFIRMED_FABRIC_REQUIRED | Existing confirm-geometry API, only on cloned TEST_FIXTURE source |
| FABRIC_REVISION_REQUIRED | Same confirmation creates geometry version 1 with current analysis/photo basis |
| FABRIC_GRAIN_REQUIRED | Explicit test grain 90 degrees, guarded direct fixture update increments FabricPiece.__v |
| FABRIC_MATERIAL_SPECIFICATIONS_REQUIRED | Existing proposal.fabricMaterialDeclaration, basis SYNTHETIC_FIXTURE |
| EXPLICIT_STOCK_SNAPSHOT_REQUIRED | Explicit supplied TEST_FIXTURE stock object, never database inventory |
| STOCK_BINDING_REQUIRED: thread | thread -> test-thread |
| STOCK_BINDING_REQUIRED: key-ring | key-ring -> test-ring |

Confirmation/grain change the source hash, so the old run correctly rejects another technical submission with **409 FABRIC_SOURCE_CHANGED**. A new minimal workflow reuses existing assessment/review and immutable source snapshots:

1. GET `/api/concept-runs/:id/source-comparison` supplies previous/current snapshots, fromSourceHash/toSourceHash and current runVersion.
2. POST `/api/concept-runs/:id/refresh-source` requires strict body `{expectedRunVersion,fromSourceHash,toSourceHash,reviewer,rationale}`. Current fabric hash and parent revision must match; unchanged/duplicate/stale refreshes are rejected. No approval decision can be included.
3. A **new run** receives the exact original raw concept text and IDs, reassessed against current source evidence. Its concepts start at reviewVersion 0 with no approval or technical history. Immutable parent source, reviews and technical versions remain intact; only an append-only refresh link is added. Parent link/new run are saved in one transaction with optimistic version protection.
4. Explicit re-review supplies the new source hashes through the existing review API. The old review's hashes are rejected. Only then may the existing technical endpoint create new source-bound versions and run the existing bridge/nesting/precheck chain.

Source-refresh IDs are local run identifiers, **not inference campaigns**. No provider, campaign lock or budget reservation is invoked. Technical versions are scoped to a run: the refreshed run's version 1 links to the parent run containing the preserved AI rejection (v1) and authored draft (v2), rather than rewriting/reusing versions within the parent. Reports retain source-refresh provenance.

The existing nested-layout SVG renderer is reused. Successful proposals persist `nestingSvg` and its SHA-256, with proposal/source/report hashes in metadata. GET `/api/technical-proposals/:id/nesting.svg` serves that immutable image (404 if no layout); the existing pattern preview route remains unchanged. All routes retain the default-disabled local MVP guard; no public deployment was added.

## Reproduce and inspect

```powershell
node experiments/mvp-design-flow/keychain-feasibility-demo.js data/my-new-keychain-feasibility
```

The CLI reuses Phase 6D's exact-evidence clone routine, then performs fixture-only confirmation, stale-source rejection, explicit refresh/re-review, technical submission, SVG downloads and a shortage test through local HTTP. The original saved DB is never written. New declarations are recorded in `test-fixture-evidence.json`, and all exact HTTP requests/responses are saved individually and in `transcript.json`.

Actual output: **data/mvp-keychain-phase6e-001/**:

- `preliminary-geometry.json` and **`preliminary-nesting.svg`**: independent geometry-only evidence.
- **`pattern.svg`**, **`nested.svg`**: actual API downloads; opened/rasterized and visually inspected alongside the preliminary SVG.
- **`feasibility-report.json`**, `technical-proposal.json`: actual full report, placements, utilization, separate layers, BOM/assembly, source/photo/review provenance.
- `insufficient-stock.json`: real API material-shortage outcome.
- `initial/`: preserved DRAFT/CONCEPT_ONLY comparison, old rejection, editable draft snapshot and origin hashes.
- `preservation-check.json`: final read-only check verifies original fabric, run and proposals unchanged after the entire demonstration.

Actual clone DB: `borsal-mvp-demo-577427ce-0393-4fa3-8571-d983a844c79e-test`. Parent run `6af715ab702bbc870df35fbc`; refreshed run **6af73515a985e1adce777d26**; selected concept **a96f954a-3083-491b-9976-93d3bdbb7111**; full proposal **6af73515a985e1adce777d27**. Source hash explicitly changed from `e292c567c497217d083a5d78a3263d066c800cc9bf0445e4c09614f7d723cff1` to `6d4b21bd382b86acff0d4ab2f928376a89198602b057be1e346ec82cf208f3ed`. The real/original source remains DRAFT/AVAILABLE with its original rejection and review.

Actual HTTP sequence: synthetic confirmation **200**; old-source technical submission **409**; comparison **200**; refresh **201**; unreviewed technical submission **409**; explicit TEST_FIXTURE re-review **200**; technical proposal **201**, CHECKED/UNVERIFIED; both SVG GETs **200**; shortage proposal **201**, CHECKED/FAIL; report GET **200**, sourceStale=false. Nothing was automatically approved for manufacturing.

```powershell
node experiments/mvp-design-flow/serve.js borsal-mvp-demo-577427ce-0393-4fa3-8571-d983a844c79e-test
curl.exe http://127.0.0.1:3001/api/technical-proposals/6af73515a985e1adce777d27
curl.exe http://127.0.0.1:3001/api/technical-proposals/6af73515a985e1adce777d27/nesting.svg -o data/my-keychain-nested.svg
```

## Essential remaining checklist

- Independently verify a real mat/photo scale, source contour, grain, material and real ring/thread requirements/stock. Do not transfer these TEST_FIXTURE PASS results to real inventory.
- Human review of pattern/placement, then make a physical sample: turn-ins, center return, D-shaped ring opening/key retention, bulk, seams, finished dimensions, abrasion and load. The frozen schema still cannot engineer the return fold or prove physical construction; no product photo/3D preview is implied.
- Use actual source confirmation + explicit refresh + new hash-bound drafting review for a real source. Snapshot-based cross-document reads can become stale immediately; later checks reject changed sources, but this is not an inventory/approval transaction.
- Add final human approval and revision-conditional, idempotent transactional reservations only in a separately authorized task, after real evidence. Coordinate every direct DB writer; add authentication before public writes. No reservation or approval was implemented here.

## Verification

Initial focused API suite **49/49 passed** (three files, 60.03s). Tests cover unchanged-pattern geometry, source-hash/version guards, no inherited approval, fresh fixture pipeline/shortage, concurrent refresh and transactional rollback. A stronger rollback test additionally fails the parent save after child insertion; final regression and preservation results follow below.

Final full regression: **637/637 passed**, **33 files**, **140.17s**. Final keychain API recheck: **10/10 passed**, **19.06s**, including rejection of old review hashes and rollback after child insertion. Existing tests/schemas/fixtures/tolerances were not weakened or changed. `git diff --check` and intended source/docs secret/whitespace scans passed. All **81** prior AI/ledger file hashes match, with no slots 13..20 reserved: **12/20** remains consumed. Final original fabric/run/proposal hash checks passed. No Cloudflare, production/inventory writes, Phase 6E commit, push or merge occurred.
