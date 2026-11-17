# Blueprint Phase A — offline implementation

**No live inference, provider lookup, eligibility renewal, repair request or fallback was performed. The LLM integration is NOT proven until a separate authorized live inference succeeds. Geometry validity does not prove physical manufacturability.** No live-test script was added.

## Preservation and baseline

HEAD remains `9559e1e00513a0a6f90af9d4c66bbf8b0309132c`. No newer commits or pre-existing uncommitted/untracked source changes existed. Safety tag: `borsal-pre-blueprint-20261116T104805078Z`. New working branch: `feature/blueprint-engineering`. No reset, checkout-discard, stash, source-data rewrite, commit, push or merge.

Private recovery folder outside the working tree:

`E:/Borsal-Recovery/borsal-pre-model-upgrade-20261114T170313Z/pre-blueprint-20261116T104805078Z/`

It contains the original working-tree diff/untracked inventory, `borsal-delivery.bundle`, owner database archive, 1,237 hash-verified application files (including ledger, source uploads and saved previews/evidence), `VERIFIED-DELIVERY-ADDENDUM.json` and `RESTORE.txt`. Initial owner dump restoration was verified **before source changes**. Final `BLUEPRINT-REVERIFIED.json` additionally records a successful isolated bundle clone/fsck, all backup file hashes, a supplementary current evaluation-workspace dump and fresh isolated restores of both authoritative databases. An overlong temporary database name initially failed validation; shortening only that new temporary name fixed verification. No original namespace was modified.

| Collection | Owner workspace | Saved evaluation workspace |
|---|---:|---:|
| accessorystocks | 0 | 0 |
| conceptruns | 7 | 1 |
| creationoperations | 43 | 4 |
| creationprojects | 7 | 1 |
| designreviews | 3 | 1 |
| fabricpieces | 7 | 1 |
| inventoryitems | 0 | 0 |
| localaisettings | 1 | 1 |
| productionevidences | 0 | 0 |
| technicalproposals | 20 | 1 |
| **Total** | **88** | **10** |

Final isolated restore databases: `borsal-bp-restore-14a22892-791d-4795-870d-856b3c7823de-test` and `borsal-bp-restore-5d630881-d6e3-4279-95fb-fea2a7c92d43-test`. Document and index hashes match the archives and unchanged sources. Recovery commands are in the private RESTORE.txt: clone the bundle into a **new directory**, restore archives with `--nsFrom`/`--nsTo` into **new unique databases**, never `--drop` or restore over active owner data. Preserve newer usage history during any future recovery. Original submission ZIP SHA-256 remains `c475ef9e859e33de0bdd78cdbe0cff67ebcd5ca2349a3d54b87eedbb3c168f19`.

Before editing: **890 tests / 72 files PASS**, production build PASS, with provider credentials cleared and outbound HTTP blocked. Exact contract inspection is in [BLUEPRINT_PHASE0_FINDINGS.md](BLUEPRINT_PHASE0_FINDINGS.md).

## Files and integration

New source: `src/services/blueprint.js` (strict contract, transport parsing, expansion, provenance), `blueprintProvider.js` (opt-in Llama profile/prompt), `fixtures/blueprints.js` (authored offline cases), `scripts/offline-provider-guard.cjs`. New focused tests: `src/services/blueprint.test.js`, `src/routes/blueprint.test.js`, `experiments/design-language/ai-spike/blueprint-accounting.test.js`, `scripts/offline-provider-guard.test.js`.

Minimal existing-file changes:

* `localAI.js`: server-side `LLAMA_BLUEPRINT` engineering selection; GPT_OSS remains default and QWEN remains opt-in.
* Existing spike `provider.js`: enumerated Llama-only JSON Mode profile; Blueprint requires final text rather than object reserialization. Existing model profiles remain intact.
* `technicalGeneration.js`: checks authoritative context, records transport validation, rejects incomplete final output, preserves exact raw response, then uses the existing append-only constructor.
* `technicalFlow.js`: accepts only trusted server-side Blueprint assessment metadata; raw parent remains immutable; derived reports carry unresolved/manual findings.
* `designConstruction.js`: recognizes trusted Blueprint provenance and expands into the existing engineering compiler. Source/review/technical-version/transaction protections remain in place.
* Existing spike `campaign.js`: demonstrated atomic baseline-publication fix described below.

No changes to `productEngineering.js`, `borsal.engineering-plan/0.1`, `designCandidate.js`, geometry/nesting/assembly validators, Qwen configuration, Fix 1 identity behavior, database schemas, frontend, inventory or approval logic. No dependencies added. Documentation consists of this report and Phase 0 findings. Generated verification artifacts remain ignored under `data/blueprint/`.

## Contract as implemented

`borsal.blueprint/0.1` is a host-side policy label: **the model must not supply schemaVersion**. Every model object is strict. Required root fields:

* `function`: approved intended function verbatim; `closure`: existing closure enum, checked against the active identity.
* `components`: 1–12 definitions with `key`, `role`, `shape` RECT|ELLIPSE, `widthCm`, `heightCm`, `quantity`, `allowanceCm`; optional `allowedRotationsDeg`.
* `materials`: 0–20 entries with `key`, `role`, existing THREAD|ZIPPER|BUTTON|HARDWARE `requirement`, and **exactly one** explicit `quantity` or `threadEstimate`. Stock is never inferred.
* `operations`: 0–30 supported operations below.
* `unresolved`: 0–8 `{reason,affectedKeys}` entries, retained verbatim and tagged manual/unvalidated.

Keys match `^[a-z][a-z0-9_]{0,31}$` and are globally unique across both lists. Roles are descriptions, never lookup keys. Component references are `{kind:"component_instance",ref:"key#n"}`; copy numbers are 1-based and must exist. Bare keys are allowed only for quantity=1. Hardware/thread references are `{kind:"hardware",ref:"key"}`. Cross-kind, duplicate, ambiguous and unresolved references reject with path/code.

Dimensions are finite positive cm up to 1,000; quantities are integers 1–20; cutting allowance is required, finite 0–100 cm. Optional rotations are finite [0,360). These are bounded adapter inputs, not new physical defaults. No POLYGON/vertices are accepted. Field-surrounding whitespace rejects rather than silently inheriting the existing compiler's trimming. No model IDs or unknown nested fields are stripped.

Operations adapt directly to existing fields:

| Blueprint operation | Explicit inputs / existing expansion |
|---|---|
| SEAM | Two typed sides, each with edges and FORWARD/REVERSE; typed thread; instruction. Existing directed seam validation decides consistency. |
| INSTALL | Typed material and typed anchors; instruction. Reference/position validation only, not demonstrated installation. |
| ATTACH | Typed from/to anchors and thread; instruction. |
| LAYER | Ordered 2–6 typed anchors on distinct copies; thread; instruction. Existing compiler produces adjacent attachments. |
| FINISH | Typed component, explicit ALL_COPIES scope, edges, OVERCAST, thread, instruction. Copy #1 denotes the explicitly acknowledged all-copy pattern scope. |
| FOLD | Typed component, ALL_COPIES scope, HEM, HORIZONTAL/VERTICAL axis, offsetCm, spanStartCm, spanEndCm, allowanceCm, instruction. Existing compiler validates the expanded axis. |

Anchors require edge index, fraction along that directed stitching edge and inward insetCm. Host expands these supplied scalars into the existing point-reference representation using the existing RECT/24-chord ELLIPSE ring. No edge, orientation, span, dimension, inset or allowance is guessed. These are parameterizations of existing operations, not new geometry primitives.

Unsupported single-copy folds/finishes, raw polygons, pleat/weave/gather mechanics and material types outside the initial subset are not invented. Unresolved requirements are **not** converted into operations. Known mandatory closure cannot be changed or replaced by UNKNOWN. ZIPPER/BUTTON/SNAP additionally require corresponding declared hardware and INSTALL; this is reference consistency, **not functional closure proof**. Other mandatory closures and free-prose mandatory attachments currently reject with explicit unsupported/unstructured-requirement findings: no new semantic attachment system was introduced. Existing identity checks enforce function/name/closure; no approved requirements are rewritten.

## Determinism and provenance

Authoritative component-definition, component-instance and material IDs are `bp-` plus SHA-256 of JSON `[projectId,fabricId,sourceHash,designFingerprint,designVersion,key,instanceIndex]`; index 0 identifies a definition/material, 1..quantity identifies copies. No clock, randomness or Blueprint-content-only identity. Definitions/materials are sorted by symbolic key; operation order remains authored assembly order. Same input/context gives byte-identical expansion; changing project, fabric, polygon/source hash, identity fingerprint or version changes IDs.

Existing engineering-plan names are local symbolic references; existing compiler aliases (`piece-1`, `piece-1-1`, etc.) remain local and unchanged. They are **not global persistent IDs**. `provenance.derivation.blueprint.components` maps each key/role, contextual authoritative ID and local compiler alias. Full authoritative design snapshot remains in existing derivation/generation metadata. This preserves the existing plan contract and compiler while making identities context-scoped.

Host provenance is LIVE_AI, MOCK, FIXTURE or HUMAN; model input cannot set it. Simulated protected-route execution is **MOCK**, authored offline examples **FIXTURE**. Existing Mixed generation/derivation metadata carries Blueprint, normalizations, unresolved entries, allowances, contextual IDs and assessment. No plan-schema change was necessary.

Only outer transport whitespace and one wrapping markdown fence are normalized, and both are recorded. Non-JSON, empty/null final content, missing/non-stop finish reason, reasoning-only or truncated output FAIL and retain response/receipt/hold; they do not create a successful version. Schema/reference violations REJECT with machine-readable paths/codes and preserve the raw parent. Valid output creates a separate derived version; raw output is never rewritten. HAS_UNRESOLVED_ITEMS stays visible in report metadata and manual/unvalidated construction findings, with CONCEPT_ONLY status rather than completed manufacturing readiness.

## Llama prompt and reservation

Selection: `BORSAL_ENGINEERING_MODEL=LLAMA_BLUEPRINT` via the existing server selection mechanism. Model `@cf/meta/llama-3.3-70b-instruct-fp8-fast`; native Workers AI `/ai/run`; response_format `{type:"json_object"}`, temperature 0.3, stream false, max_tokens **4096**, existing bounded 120-second timeout. No reasoning parameter, provider strict JSON Schema, retry or fallback.

Prompt supplies active approved function/closure/design context, approximate bounding dimensions and recorded area as **GUIDANCE ONLY**, supported shape/operation/hardware catalog, required key/copy/type rules, unresolved handling and “return only JSON”. Exact source polygon coordinates/holes are retained by Borsal and never serialized into this prompt. Area does not reject or resize the Blueprint; existing nesting/validation decides the outcome.

Serialized compact fixture sizes (UTF-8 bytes): panels 1,015; installed 1,442; folded 1,042; layered 1,568; composite **2,185**. Conservative estimate: **one token per UTF-8 byte**, deliberately exceeding ordinary JSON BPE expectations, then 1.5× largest tested output estimate and round up to a 1,024-token boundary: ceil(2,185×1.5/1,024)×1,024 = **4,096**. This is evidence from representative fixtures, **not a guarantee that every maximal schema instance fits**. Overlong output fails without repair/retry.

Input guard covers serialized messages plus native parameters: 12,000 bytes, with existing 512-token overhead allowance. Existing repository Llama rates: 26,668 input / 204,805 output Neurons per million tokens. Conservative maximum = ceil((((12,000+512)×26,668 + 4,096×204,805)/1,000,000)×1.15) = **1,349 Neurons**, rounded hold **1,350**. Existing protected-route owner proof, atomic hold, confirmation, idempotency, ledger and receipt logic are reused. No request-count ceiling was reintroduced. Current real eligibility/headroom was not renewed or used in Phase A.

## Accounting investigation

Reproduced the intermittent failure before fixing it: on the third cold-start round, six workers attempted 15 reservations each; two exited at zero with `BUDGET_BASELINE_MISMATCH`, leaving **60/90**. Exclusive baseline-file creation exposed the file before writing/fsync completed. This was not an exhausted cap or an existing reservation to refund.

Smallest fix: write/fsync a unique new temporary baseline, then atomically publish it using an exclusive hard link; remove only this invocation's temporary file. Existing baseline contents are still compared exactly and corrupt/changed baselines fail closed. Existing request-slot files, including empty/unknown-outcome slots, are never removed or rewritten. Unsupported filesystem publication fails closed.

After fix: ten probe rounds × six workers × 15 requests = **900 isolated successful reservations**, no errors; regression test repeats three rounds (**270 reservations**) and checks historical byte preservation. Protected API tests concurrently submit duplicate authorization and a competing request: one dispatch, one hold, one operation record, deterministic persisted outcome/replay. Failure outcomes retain the full hold; no speculative settlement refund exists. These are isolated database/root tests, not writes to the historical ledger.

End snapshots match exactly: **71 global requests**, 462 ledger files; ledger hash `46ed85892fdd8086f9561487882195060330fe7baca773393a07cb367f992aea`. Two settings plus 47 operation records match SHA-256 `09a1b0e49cdd323c6ebeac16ed1c55744944d8d1de4e316d9d9ed8515847caa8`. Sum of stored workspace proof balances remains 6,182; this sum is **not** verified global Free-tier headroom. No historical hold was released or adjusted.

## Offline outcomes

All five fixtures use the saved 74-point irregular **synthetic** burgundy polygon (~162.0459 cm²), the real unchanged compiler, independent geometry validation and actual bounded nesting. They are authored verification cases, not real model outputs or manufacturing tests.

| Fixture structure | Cutting copies | Required area cm² | Nesting | Utilization |
|---|---:|---:|---|---:|
| Two joined panels | 2 | 29.9200 | LAYOUT_FOUND | 18.4639% |
| Joined panels + external ring anchor | 2 | 29.9200 | LAYOUT_FOUND | 18.4639% |
| One explicitly hemmed component | 1 | 14.9600 | LAYOUT_FOUND | 9.2320% |
| RECT base + repeated ELLIPSE layers | 3 | 28.3305 | LAYOUT_FOUND | 17.4830% |
| Different-size RECTs + ELLIPSE, layer + attachment | 3 | 29.9653 | LAYOUT_FOUND | 18.4918% |

Each produces cutting, nesting, assembly SVG and proposed BOM. Paths: `data/blueprint/fixtures/{panels,installed,folded,layered,composite}-{cutting,nesting,assembly}.svg`, with corresponding `*-report.json`; summary `data/blueprint/fixture-results.json`. All assembly/physical readiness remains **UNVERIFIED / NOT_VERIFIED**. A 40×40 component returns the real AREA_PRECHECK_FAILED result without adapter resizing/rejection. A 30×0.5 outline has sufficient area but no found layout; bounded-search failure is preserved. Report metadata maps actual unplaced copies back to symbolic key#n.

Tests cover strict unknown/missing/ID/coordinate fields, duplicates, ambiguous/cross-kind/missing refs, nonfinite/out-of-range values, required orientations/allowances, unsupported operations, closure/function conflicts, UNKNOWN bypass prevention, transport fences/truncation/reasoning, unresolved/manual status, contextual deterministic IDs, existing defaults/Qwen, real saved-polygon nesting, SVG/BOM output, accounting and protected route receipts. Real provider fetch is asserted **never invoked**; native request serialization uses injected fake fetch only. The protected integration uses actual multipart upload, analysis, explicit geometry confirmation, concept review, source/design guards, append-only raw/derived versions, SVGs, persistence/replay, concurrent duplicate requests and insufficient-headroom rejection in a uniquely named isolated test DB.

Final: **54 focused checks / 4 files PASS; 944 full regression tests / 76 files PASS** (baseline 890/72); production frontend build PASS; `git diff --check` PASS. The existing build chunk-size warning remains. Tests/build use `scripts/offline-provider-guard.cjs`: provider credentials are cleared before and after dotenv, and non-loopback fetch/http/https throws before outbound dispatch. Mongo and loopback Supertest calls remain available. No browser/UI change was made or required for this backend-only Phase A.

One overlapping verification run exceeded an existing 5-second integration setup timeout and caused eight dependent failures. That unchanged file passed alone (8/8), then the final non-overlapping full run passed 944/944. No test timeout or assertion was weakened. Final checks also cover rejection of a new derivation from a stale active design and structured rejection of nonfinite calculated anchors. Fixture functions distinguish protective surfaces from decorative layered assemblies; their geometry is not relabeled as proof of a container or closure.

## Compatible concepts and remaining limits

Compatible construction classes for a **future** bounded demonstration: open-top holders with matched explicit panel seams; flat protective textile surfaces with explicit hems; layered decorative accents using repeated ellipses/rectangles and point stitching; small multi-component combinations of those operations. Decorative button or existing hardware anchor proposals can be represented, but their retention/functional behavior is not verified. These are capability classes, not product-name branches or production templates.

Not yet supported as demonstrated functional constructions: woven/gathered/elastic structures; mandatory free-prose straps/loops/attachments without structured requirements; single-copy folds/finishes on a repeated pattern; raw arbitrary polygon input to Blueprint; functional zipper tape installation, receiving buttonholes/loops, unsupported closures and load-bearing/food-contact/strength claims. Existing geometry can only establish fit. Some declared hardware INSTALL plans pass reference checks while requiring additional physical engineering; this is never advertised as a manufactured working closure.

Exact later owner steps (documentation only; **do not execute during Phase A**): choose an existing, currently approved concept compatible with this subset and preserve its function/closure; select LLAMA_BLUEPRINT through the existing server engineering setting and launch the normal local MVP; open the correct project/source/review; renew the normal owner Workers Free / paid-disabled attestation if required; use the existing Generate Product Design confirmation showing Llama, 4,096 output tokens, one call and the 1,350-Neuron hold. Only a **separately authorized future live task** may confirm that call. Inspect raw receipt, strict validation, derived lineage, actual fit and unresolved manual findings afterward. No fallback or repair call is authorized by Phase A. GPT_OSS remains the default rollback selection and QWEN remains available opt-in.

## Final worktree recovery

The complete intended, uncommitted Phase A diff, new source/tests/docs, verification logs, fixture SVGs and before/after accounting evidence are hash-verified in `E:/Borsal-Recovery/borsal-pre-model-upgrade-20261114T170313Z/pre-blueprint-20261116T104805078Z/phase-a-review-20261116T120411097Z`. Original HEAD/tag/bundle remain unchanged. Restore into a NEW bundle clone at the safety tag, apply `phase-a.diff`, then copy `new-files/` according to `REVIEW-MANIFEST.json`; never restore an older ledger or owner database over newer data. No pre-existing uncommitted source needed exclusion.
