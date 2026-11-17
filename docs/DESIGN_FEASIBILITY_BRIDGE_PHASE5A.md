# Phase 5A: offline design-to-feasibility bridge

## Baseline and scope

Phase 4D audit found exactly its five intended source/test/documentation files. Credential/private-key and whitespace checks passed; full baseline regression passed **470/470**, 24 files, **54.23 seconds**. Staged `git diff --check` passed. Phase 4D alone was committed as **b1072c6**, `feat: integrate unified feasibility pipeline`. The bridge was implemented on the new **feature/design-feasibility-bridge** branch and remains uncommitted.

The adapter maps explicit data to the unchanged Phase 4D pipeline. It generates no cutting patterns, seam offsets, attachment positions, material quantities or stock. No network, AI, database, production API, reservation or inventory mutation is involved. No dependency or original schema/example/model output was changed.

Files under `experiments/design-feasibility/`:

- `bridge.js`: strict request validation, source validation, explicit instance/reference mapping, readiness report and pipeline invocation.
- `examples.js`: original saved source-linked cases plus a deliberately synthetic technical test.
- `run.js`: request-file and mixed-demo CLI, JSON stdout only.
- `bridge.test.js`: offline mapping, rejection, missing-data, provenance and pipeline regression tests.

## Request contract

Root `schemaVersion` is `borsal.design-bridge/0.1`.

| Field | Meaning |
| --- | --- |
| source.kind | CONCEPT or DESIGN |
| source.path | Declared source path/reference; no automatic file lookup or trust assertion |
| source.data | Original `borsal.concept/0.1` or `borsal.design/0.1` object |
| context.fabric | Optional existing 4D fabric contract: ID, confirmed geometry/revision, centimeter polygon/holes, material and grain |
| context.instances | Explicit cutting instances, at most 20: unique `id`, source `pieceId`, source `copy`, `cuttingPolygonCm`, `allowancesIncluded: true`, optional `grainToleranceDeg` and `allowedRotationsDeg` |
| context.stockBindings | Explicit object mapping source STOCK BOM IDs to supplied stock item IDs |
| context.stock | Optional unchanged 4D offline stock snapshot |
| context.search | Optional unchanged bounded 4B/4D settings |

Context is optional so incomplete sources can receive actionable readiness requirements. Missing context does not become an empty verified inventory. The exported `requestSchema` and executable examples provide exact structures. Unsupported fields/versions, nonfinite coordinates, invalid quantities and malformed declarations are rejected.

## Readiness and validation boundary

- **CONCEPT_ONLY / UNVERIFIED:** valid concept or valid-but-incomplete technical description. The report lists exact missing cutting instances, known grain/tolerance, confirmed fabric/revision/material, stock snapshot/bindings or unsupported curve/stock-cutting representation. Concepts preserve every original requirement and unresolved connection and receive the existing technical review queue. Concept prose never supplies a pattern or quantity.
- **REJECTED / FAIL:** malformed original schema, broken source IDs/edge/copy/thread references, invalid straight seam/cutting polygons, duplicate instance mappings, contradictory fabric identity, explicitly unconfirmed fabric, or demonstrable mapped technical contradictions. Errors retain original Zod paths/messages or precheck reason codes. Invalid supplied technical data is not repaired to make it concept-only.
- **CHECKED:** supported and sufficiently explicit inputs were passed to 4D. `verdict` is the pipeline's unchanged PASS/FAIL/UNVERIFIED. A stock shortage is a checked feasibility FAIL, not a rewritten BOM. Incomplete supplied stock availability or bounded NO_LAYOUT_FOUND remains UNVERIFIED. All full pipeline evidence is retained.

No bridge verdict is manufacturing approval. `manufacturingVerified` is always false, and 4D physical evidence is always UNVERIFIED. Completeness cannot be inferred solely from a schema or limitations ledger; creative fidelity still requires human review.

## Supported mapping

`borsal.design/0.1` stores **SEAM_LINE** outlines and a scalar seam allowance, not cutting geometry. The bridge therefore requires separately supplied cutting polygons for every requested source copy. It never uses `seamAllowanceCm` to enlarge a polygon and does not independently establish that a supplied allowance matches that scalar width or is adequate.

Only straight LINE outlines are mapped. The source's explicit last closing endpoint becomes an implicit polygon closure: the final repeated point is omitted, with the conversion recorded. Segment IDs become stitching-edge IDs with their original zero-based segment index. Coordinates and edge order are unchanged; invalid closure, duplicate vertices or self-intersections are rejected rather than snapped/repaired. Bezier curves require a separately reviewed representation/edge mapping and remain CONCEPT_ONLY; there is no speculative flattening.

Every explicit cutting instance maps source `(pieceId, copy)` to a caller-supplied unique nested ID. Source assembly references are rewritten to that ID with `copy: 1`, because 4D IDs already identify individual instances. Components expand their explicitly referenced copies; BOM IDs/specifications/quantities remain unchanged, with only explicit stock bindings added. Source scrap IDs must match the supplied fabric ID. Source grain direction is copied; tolerance must be supplied. No manufacturing quantity, attachment location or rotation restriction is guessed.

Supported SEAM/ATTACH/INSTALL operations retain their source fields and piece-local anchors. 4C validates mapped edge chains, stitching containment, anchor containment, thread/material references and stock specifications before search. Known contradictions are rejected even when independent stock/grain information is still missing, where the available supported geometry makes those checks possible. Unrepresentable curves and absent cutting outlines prevent those downstream checks; the report does not pretend that unresolved technical data passed.

Source features, limitations and folds remain in the source snapshot. Non-BODY feature intent and folds additionally become unresolved physical claims, and limitation reasons/missing-information lists become explicit unsupported claims. No strap/closure connection graph is invented from prose; `connections` is empty unless a future reviewed mapping provides it. Existing explicit assembly operations are checked, while physical strap load paths/closure alignment remain unresolved. STOCK cutting patterns remain unsupported by this one-scrap bridge rather than being silently nested onto the outer scrap.

## Provenance

Reports retain independent snapshots and SHA-256 hashes of original `source.data` and supplied context, plus declared source path, original concept campaign/response hashes, instance/copy/edge mapping and the exact constructed pipeline input. Hash basis is explicitly `JSON.stringify` UTF-8 of the supplied object, not the original file bytes. Snapshots are detached from subsequent caller mutation. Supplied provenance and stock declarations are not authenticated. Pipeline evidence retains fabric ID/revision and the bridge source hash. Do not put secrets in request objects: the CLI intentionally prints their snapshots for review.

## Reproduce and actual outcomes

```powershell
node experiments/design-feasibility/run.js --demo
node experiments/design-feasibility/run.js path/to/bridge-request.json
npx vitest run experiments/design-feasibility experiments/pattern-feasibility experiments/design-language/concept-spike --reporter=dot
npm test -- --reporter=dot
```

CLI output is JSON stdout; nothing is saved or overwritten automatically. Single-request exits: 0 PASS, 2 FAIL/rejected, 3 UNVERIFIED/concept-only; malformed CLI/file/JSON exits 1. The mixed demo exits 0 on successful execution, not approval of its designs.

| Actual demo | Bridge result | Evidence |
| --- | --- | --- |
| concept-eight-b | CONCEPT_ONLY / UNVERIFIED | Original brief/response linkage retained; 9 actionable technical/requirement/connection items |
| concept-seventy-b | CONCEPT_ONLY / UNVERIFIED | Original brief/response linkage retained; 9 actionable items |
| eight-b-original | REJECTED / FAIL | 3 base Zod issues: empty creative.description; technical/limitations incorrectly nested under creative; missing root technical |
| seventy-b-original | REJECTED / FAIL | 4 base Zod issues: empty component pieceIds; missing technical.features/root limitations; unexpected root features |
| synthetic | CHECKED / UNVERIFIED | Geometry PASS; pipeline structural PASS; physical evidence UNVERIFIED |
| shortage | CHECKED / FAIL | Same explicit geometry; thread demand 100 cm exceeds synthetic stock 10 cm |
| incomplete | CONCEPT_ONLY / UNVERIFIED | Two explicit cutting-copy polygons missing; no offset generation |
| invalid | REJECTED / FAIL | Unknown thread BOM reference; pipeline not run |

The original AI proposals are loaded unchanged from the committed safe `shoulder-003.json` and `shoulder-70b.json` fixtures, initial attempt only. Base errors can mask further defects; rejecting them is not a count of all technical problems. The two concepts are loaded unchanged from `concept-spike/cases.json`. No inference or model repair was attempted.

The synthetic design is explicitly authored in `examples.js`: one seam-line triangle, two source copies, separately supplied two-centimeter right-triangle cutting outlines, explicit seam edges/thread and supplied synthetic stock. It uses the labeled 74-point burgundy fabric fixture from 4D. Its category is required by the experimental design schema, but the two flat triangles are not a usable or engineered handbag. The synthetic width/height/depth and allowance numbers are illustrative declarations, not derived manufacturing instructions. No original design/model output was altered to make this case pass.

## Verification and limitations

New bridge suite: **24/24 passed** after correcting the omitted-context default handling found by a focused test. Combined bridge/4A–4D/concept focused suite: **178/178 passed**, six files, **11.23 seconds**. Existing tests and tolerances were unchanged. Tests include original source rejection and concept preservation, explicit copy/edge mapping, known geometric contradictions, missing metadata, stock shortages, unsupported curves/stock patterns, detailed limitations, bounded search, hashes, immutable inputs, network-free determinism and real CLI exit codes.

No architecture adoption, manufacturing approval, physical calibration accuracy or stock freshness is established. Original creative prose may still contain requirements not captured technically; human review is required. Scalar allowance adequacy, curved geometry conversion, stock-pattern nesting and full construction validation need separately scoped work. No next phase is started here.

Final full regression: **494/494 passed**, 25 files, **57.60 seconds**, including all 470 baseline tests unchanged. Expected injected persistence-failure messages appeared in existing API tests; no tests failed. `git diff --check` and separate credential/whitespace checks of all five new files passed. Existing schemas, protected source fixtures and production files remain unchanged. HEAD remains the Phase 4D commit on `feature/design-feasibility-bridge`; no Phase 5A commit, push or merge was performed. No implementation blocker remains for the requested offline scope.
