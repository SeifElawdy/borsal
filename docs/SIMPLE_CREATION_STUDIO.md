# Simple creation workflow — urgent stabilization

The release ZIP and original user records are preserved. Development branch: `feature/simple-product-journey`. New code checkpoint: `borsal-simple-studio-20261114`; no push or merge.

## Exact failure

The latest saved real proposal is version 1, `6af8b93ce57b89b87a82ae36`, for concept `fb5995a7-b4d9-472f-b586-b27d8727d565` (Fabric Keychain), run `6af8b0933467fd104c592c4c`. Its HTTP 200 model output is valid JSON and a valid `borsal.construction-intent/0.1` object with `method: UNSUPPORTED`. It has no technical `design.data`, explicit cutting outlines or supported cutting dimensions. Rough sizing mentioned in prose does not establish usable geometry.

“Construct & assess saved proposal” sent that intent to the legacy conversion branch in `designConstruction.build()`. `fromLegacy()` passed the absent `raw.design.data` to `designSchema.parse()`, producing “expected object, received undefined”. No derived proposal was successfully persisted. The frontend independently treated the existence of any proposal as sufficient to open Pattern & Nesting and restored internal stage 5 even without SVGs.

The constructor now rejects unsupported intents with HTTP **422 / CONSTRUCTION_METHOD_UNSUPPORTED**, missing technical objects with **CUTTING_GEOMETRY_REQUIRED**, and supported construction intents with **EXPLICIT_CONSTRUCTION_SELECTION_REQUIRED**. A supported changed-product alternative still requires human selection through the existing planner. No geometry, allowances or attachment mechanism was inferred from the unsupported response. Original raw output and rejected/incomplete histories remain unchanged.

The latest proposal is **not recoverable as a cutting pattern**. It remains “Design needs more work”; a new, explicitly confirmed design request or expert-supplied supported construction is needed. No new inference was made.

## Context findings

The latest concept, run, fabric and proposal references match. No cross-project database join was proven. However, the planner prompt hardcoded “original wrap/weaving” for every product, and default construction/UI descriptions assumed Woven Wrap. This contaminated product meaning for a keychain. The prompt and proposed-alternative descriptions now use the selected concept only. An alternative is explicitly a different product, never silent substitution.

Frontend context resolution now refuses invalid explicitly selected run/concept/proposal IDs instead of falling back to unrelated records. Saved illustrations require matching project, run and concept; previous-source/review and alternative-product limitations remain visible.

## Implemented journey

**Upload Fabric → Analyze Fabric → Explore Ideas → Generate Design → Review Product.** Existing eight internal stages, APIs, review/hash guards and histories remain authoritative.

- One main design action follows actual state. Duplicated generation/recovery buttons, raw status panels and empty pattern navigation were removed.
- Saved candidate geometry is assessed locally; supported construction intent is explored locally without inference. Changed alternatives require explicit selection. Failed local checks retain progress and do not navigate to patterns.
- Pattern access requires actual cutting and nesting SVGs without failed geometry. Reloading an old empty-pattern selection returns to Generate Design without changing the original saved proposal.
- Cutting pattern, fabric layout and assembly are tabs within the same design step. Materials are requirements, not available stock. Product review separates geometry fit from physical verification and production approval.
- Versions, original JSON, IDs, detailed verdicts, source hashes and receipts are under Advanced Details. Expert editing remains optional. Human concept/prototype decisions and provider confirmations remain explicit.
- Browser testing found and fixed a second defect: refreshing source validation temporarily unmounted the Improve design confirmation. Its component now stays mounted while the action waits for current source checks; server guards remain unchanged.

## Actual verification

- **817/817 tests, 59 files**, full regression (220.75s). All previous 806 tests pass; 11 focused regression cases were added. No geometry tolerance or safety gate weakened.
- **23/23 focused tests** across design-state/context, exact saved constructor failure, planner and real isolated API tests. The 422 case proves no additional proposal/history/source write.
- React production build passes. Existing large-chunk warning remains nonblocking.
- Actual Edge/CDP journey passes at **1440 and 1920px** using an isolated TEST_FIXTURE database and mocked external providers only. Real multipart upload, detection, explicit confirmation, concept review, image persistence, supported construction selection, actual nesting/SVG, assembly, prototype review, blocked production, reload and earlier-version reopening were exercised. No technical coordinates/JSON were typed. No inventory changed.
- The exact saved unsupported response was imported as a new isolated fixture version. Restoring stage 5 correctly displayed Generate Design, the direct constructor returned 422, Improve design opened a real confirmation without dispatch, and the earlier valid pattern remained reopenable.
- Dark/readability/overflow audits, reduced-motion preference, keyboard Tab navigation and no browser exceptions passed. No external Cloudflare request occurred. Mock request accounting remained in its separate ledger.

Evidence: `data/simple-studio/focused-final.log`, `regression.log`, `build-final.log`, `preservation.json`; browser `data/local-mvp/real-creation-check-1794688820145/report.json`.

## Before / after screenshots

Before: `data/local-mvp/real-creation-check-1794684624786/{1440,1920}-technical-generation.png` (retained actual pre-change baseline).

After: `data/local-mvp/real-creation-check-1794688820145/` — both widths for `new-project-upload`, `fabric-analysis`, `new-concepts`, `technical-generation`, `construction-alternative`, `actual-pattern`, `actual-nesting`, `autonomous-manufacturing-plan`, `prototype-review`, `incomplete-design-recovery`, `revision-confirmation`, `reopened-valid-design` (PNG names prefixed by width). SVGs and the fixture technical report are in the same folder. These are fixture screenshots, not new live AI results.

## Preservation and use

The original 35 user documents and indexes, 249 application artifacts and verified release ZIP were hash-checked unchanged. The actual global ledger is **29/30**; **zero calls** were made in this task. One remaining slot is not a guarantee of a valid design or sufficient current Free allocation. Every future call still requires a fresh browser confirmation and existing eligibility/budget gates.

Verified pre-change private backup: `E:\Borsal-Recovery\borsal-pre-model-upgrade-20261114T170313Z\pre-simple-studio-20261114T195239198Z` (10 collections / 35 documents; Git bundle and source artifacts; isolated restore matched document/index hashes). See `PROJECT_RECOVERY_CHECKPOINT.md` for the final addendum.

Launch normal user workspace: **`npm run mvp` → http://127.0.0.1:5173**. Open the saved project; incomplete output now stays on Generate Design with an explanation. Do not confirm a new AI request unless you intend to spend the remaining slot.

Offline reproduction: `node scripts/local-mvp.js --mock --construction`, then `node scripts/check-real-creation.cjs --submission`. Stop the normal launcher first; the mock workspace is explicitly isolated.

Code rollback: stop the launcher, `git switch --detach 3123cbd51ae84ce0ca4399e9f2aea851d2eaeb21`, then `npm run mvp`. Never roll back the active ledger or original database. Missing physical material, stock and construction evidence remains unresolved; this release is not manufacturing approval.
