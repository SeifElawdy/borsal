# Coin Pouch technical recovery and product review

Date: 2026-11-15. ZERO Cloudflare requests. New geometry is an explicitly authored, engine-derived construction interpretation, not recovered AI cutting coordinates or manufacturing approval.

## Preservation and rollback

Before development, all pending preview improvements were committed as `87fb21413eb574e53484dad9451dfa37eac88621`, tag `borsal-pre-coin-pouch-final-20261115T112433531Z`, on `feature/simple-product-journey`.

Verified private backup: `E:/Borsal-Recovery/borsal-pre-model-upgrade-20261114T170313Z/pre-coin-pouch-final-20261115T112433531Z/`. Its Git bundle verifies; its official MongoDB dump was restored into an isolated database and matched all 57 documents across 10 collections. All 403 preserved artifacts matched hashes. Original submission ZIP SHA-256 remains `c475ef9e859e33de0bdd78cdbe0cff67ebcd5ca2349a3d54b87eedbb3c168f19`. Existing broader recovery backups remain untouched.

Safe source rollback: create a separate checkout, `git worktree add ../borsal-before-coin-pouch borsal-pre-coin-pouch-final-20261115T112433531Z`. Alternatively clone `borsal-delivery.bundle` into a NEW directory. Private `RESTORE.txt` documents restoring into a NEW database; do not overwrite the active namespace or restore an older usage ledger over current history.

## Exact saved failure

Original project `6af98b0b78082f63c9e2bf1f`, fabric `6af98b2d78082f63c9e2bf20`, concept `c9cdce7b-879d-48ab-b4c5-55eac07048dc` (Coin Pouch), run `6af98b4778082f63c9e2bf23`. Original versions and approvals remain unchanged.

Both GPT-OSS 120B calls returned HTTP 200, valid JSON and schema-valid `borsal.construction-intent/0.1`, with finish reason `stop`; this is not the earlier provider-envelope defect or output truncation. Version 1 (`6af9934da54a5184e697dc48`) declared `UNSUPPORTED`. Version 2 (`6af993d5a54a5184e697dc4b`) proposed `TWO_PANEL_OPEN_SLEEVE`, width 6 cm, height 8 cm, seam/hem 0.5 cm, with an explicitly unresolved closure. Neither supplied cutting polygons, because the construction-only prompt explicitly delegated those to the host.

The operation contract and host only offered an open sleeve or unsupported construction. An open sleeve cannot establish the requested secure coin closure. The pipeline correctly saved an incomplete proposal; repeated inference under that same contract could not add missing host closure support. The saved 6 × 8 cm two-panel interpretation demands 96 cm², but the existing bounded search found no layout (`CANDIDATE_LIMIT`, 1,112 attempted candidates). Area sufficiency does not prove fit; search exhaustion is not global impossibility. There was no successful selected engine-derived version for Review Product to display.

Provider extraction → JSON parsing → intent validation all succeeded. Missing construction support and explicit alternative selection prevented construction/persistence, followed by an incomplete review presentation. No evidence establishes a cross-project Coin Pouch/Woven Wrap substitution in this saved case. New operation selection checks project/run/concept/parent/source/review/technical versions; mismatches are rejected, not rebased.

## Historical model evidence

| Saved result | Actual technical information | Failure / limitation |
|---|---|---|
| Llama 3.3 70B, `phase2b-llama33-70b-shoulder-001` | Full older design representation, pattern and assembly/BOM information | Four structural issues: `technical.components[1].pieceIds`, missing `technical.features`, missing root `limitations`, misplaced root `features`; saved audit also found out-of-body accessory anchors. |
| Llama 3.3 70B, `phase5d-burgundy-accessory-002` | One pattern and two cutting instances | `technical.scrapSources` had object/array mismatch; closing-coordinate/invalid cutting polygons, no assembly. 626 completion tokens and `stop` do not establish truncation. |
| Llama 3.3 70B, `phase6c-burgundy-keychain-001` | Pattern, assembly and two BOM entries, no usable cutting-instance handoff | Five BOM errors: `technical.bom[0].material.specs.{fiber,weave,weightGsm}` and `[1].material.specs.{finish,sizeCm}`. Unknown enum placeholders and zero physical properties do not satisfy the schema. |
| GPT-OSS 120B, current Coin Pouch v1/v2 | Schema-valid construction intent; v2 has explicit proposed panel dimensions and allowances | No closed-pouch host method; v1 unsupported, v2 open sleeve with unresolved closure. No AI cutting coordinates to recover. |

These are different products, prompts and contracts, not a controlled benchmark. Llama supplied more explicit technical data under larger contracts but still failed deterministic checks. GPT complied with a much narrower intent contract but could not overcome its missing host operation. There is no defensible model winner from this evidence. Future comparison would need the same product, contract, settings and independent scoring; no such inference was run here. Saved comparison: `data/coin-pouch-final/model-comparison.json`.

## Smallest construction-aware improvement

Added an explicit `TWO_PANEL_SNAP_FLAP_POUCH` intent and `COIN_POUCH_SNAP_FLAP` local planning choice. It preserves coin storage while proposing a flat pocket with integral back flap and a paired snap. It does not claim to implement gathering, drawstrings or rounded shaping seen in historical illustrations. Human selection of this interpretation remains mandatory.

The existing constructor, polygon authority, bounded nester, assembly precheck, immutable technical API and source guards are reused. No validator was replaced, no rejected version resized in place, no source measurement inferred and no stock created. The prompt now describes supported closed-pouch intent, includes flap demand and stays within the existing preflight safeguard.

The planner first assessed a new 6 × 8 cm pocket with a 2.5 cm flap (111 cm²), then 5 × 7 cm (82.5 cm²): both exhausted their bounded searches. A NEW 4.5 × 6.5 cm front plus 4.5 × 9 cm back/flap genuinely nested:

| Component | Cutting quantity / dimensions | Proposed purpose |
|---|---|---|
| Front coin pocket | 1 × 4.5 × 6.5 cm | Pocket front; double-turn upper finish |
| Back with integral flap | 1 × 4.5 × 9 cm | Pocket back and proposed closure cover; double-turn flap-tip finish |

Total demand **69.75 cm²** from the original **162.045910493827 cm²** polygon; utilization **43.043357149489545%**, remaining **92.29591049382688 cm²**. Front rotation 90°, translation `[27.551666666666666,26.07944444444444]`; back rotation 0°, translation `[21.051666666666666,16.57944444444444]`. Layout found after 1,073 attempts, independently validated geometry PASS; assembly references PASS.

Proposed sequence: cut the assessed pieces with included 0.5 cm seam and 0.4 cm double-turn hem allowances; hem front opening and flap tip; align bottoms/right sides and sew the explicit side–bottom–side paths, leaving the opening; overcast raw seam/flap edges and turn; propose a flap hinge at y=5.7 cm; install/test the paired snap at reflected proposed local centers `[2.25,4.075]` and `[2.25,7.325]`. A hinge hypothesis is not encoded as an already verified folding operation. Thread demand is an unverified perimeter-based estimate; one snap unit means a complete paired set, REQUIRED rather than AVAILABLE.

Material suitability, reinforcement, finishing, fold behavior, hardware installation, secure coin retention and physical assembly remain **UNVERIFIED**. Construction status is **CONSTRUCTION_UNVERIFIED**, creative coverage partial, overall persisted status **CONCEPT_ONLY / UNVERIFIED**, manufacturing approval false. A technically coherent proposed sequence and fitting layout are not a successful prototype.

## Actual original-source replay

`node scripts/coin-pouch-replay.cjs` cloned preserved original BSON records into a new isolated database, reused original source/run/review hashes and actual APIs, preserved both original responses, explicitly selected a new version in the clone, fetched real SVGs and checked blocked production readiness. Simulated prototype review occurred only in the clone. Original database/document/index hashes remained identical.

Important source limitation: this user's saved photo matches `data/test-mat40.png`. It is the ORIGINAL saved Coin Pouch source, but a known synthetic calibration/sample image, not independently verified real-fabric accuracy. This replay proves the existing source-record geometry/technical path, not real-world measurement or manufacturing feasibility.

Artifacts: `data/coin-pouch-final/replay-1794742836138/`:

- `cutting-pattern.svg`, `nesting-layout.svg`, `construction-schematic.svg`.
- `proposal.json`, `report.json`, preserving original source polygon, placements, assembly checks and provenance.

Original-source replay database: `borsal-coin-replay-79b8eda4-2ceb-406f-b6ae-77a244376df9-test`. New clone-only proposal `6af99a3325f16d91ef1630b7`, version 3. The owner must explicitly select an interpretation before a new version is written to the original project.

## Complete Review Product

Review Product now combines the preserved four-view gallery, large actual cutting SVG, actual nesting SVG/utilization, component purposes, proposed assembly/finishing instructions, construction schematic, required BOM and separate geometry/construction/physical states. Missing patterns and exhausted searches have actionable explanations. Unsupported image features are disclosed. Diagnostics and internal references remain in Advanced Details.

Prototype-only approval, Needs Changes and rejection use existing protected review APIs. Needs Changes saves the review and returns to Generate Design with one local alternative-selection path; original versions remain accessible. Production remains blocked without existing real-evidence requirements. No gallery orchestration or image regeneration was changed.

## Verification and screenshots

Focused tests: see `data/coin-pouch-final/focused.log` (30/30) and `focused-final.log` (29/29). Full final regression result is recorded below after verification. Existing tests/thresholds are unchanged. During verification, the expanded prompt exceeded the existing 5,500-byte construction guard; it was shortened rather than raising the guard. An intermediate combined browser/regression run also timed out an existing 5-second concurrency test; the final regression is run without the browser workload.

Frontend build passed (2.00 s); existing >500 kB bundle warning remains. Browser checks used actual local APIs with disabled inference in the original-source replay. Both 1440 and 1920 widths passed readability/dark-surface/overflow checks, Needs Changes routing, reload/resume, previous review reopening, unchanged source/proposals/inventory/budget and no console exceptions. SVGs were rasterized and visually inspected. These are source-replay checks, not a new live AI generation.

Before: `data/local-mvp/real-creation-check-1794743815188/{1440,1920}-review-before.png` (prior review layout, same isolated project).

After: `data/local-mvp/real-creation-check-1794743867575/`, both widths:

- `review-product.png`, `cutting-pattern.png`, `fabric-layout-nesting.png`.
- `assembly-guide.png`, `materials-feasibility.png`.
- `revise-next-action.png`, `reloaded-revision.png`, `review-restored.png`.

Cloudflare ledger: **48 used, internal limit null**, unchanged; ZERO live calls. Existing owner Free-tier checks, confirmation, receipts and no-retry behavior remain intact. No production approval, source evidence or inventory was changed.

## Owner test steps

1. `npm run mvp`, open `http://127.0.0.1:5173`, reopen the saved Coin Pouch project.
2. Open Generate Design. The saved response is assessed locally, with no inference or engineering-entry form.
3. Review a snap-flap option, explicitly accept its creative/physical limitations and select it. This creates a NEW proposal; it does not replace saved AI output or illustrations.
4. Open Review Product to inspect the four images, cutting pattern, fabric layout, assembly and material/evidence gaps.
5. Save prototype-only review, Needs Changes or rejection. No action approves production or reserves stock.

For the preserved isolated replay instead: `node scripts/local-mvp.js --replay=data/coin-pouch-final/replay-workspace.json` (only when normal server is stopped). Inference is hard-disabled; simulated review stays isolated.


## Final verification and recovery checkpoint

Final full regression: **841/841 tests, 64/64 files**, 204.42 s (`data/coin-pouch-final/regression-verified.log`). All existing tests remain unchanged. Final frontend build passed; desktop screenshot and API replay findings are recorded above.

Final checkpoint tag: `borsal-coin-pouch-review-20261115T120846676Z`; private restore-verified addendum: `E:/Borsal-Recovery/borsal-pre-model-upgrade-20261114T170313Z/coin-pouch-review-verified-20261115T120846676Z`. The commit ID is recorded in the tag and private `VERIFIED-DELIVERY-ADDENDUM.json`. This checkpoint includes the intended implementation, tests and documentation; the original submission release is preserved.

Final focused rerun: **30/30 tests in five files**, 22.55 s (`data/coin-pouch-final/focused-verified.log`).
