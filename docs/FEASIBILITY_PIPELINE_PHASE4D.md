# Phase 4D: unified offline feasibility pipeline

## Scope and baseline

This deterministic orchestrator combines the unchanged Phase 4A geometric validator, Phase 4B bounded nesting and Phase 4C material/construction precheck. It generates no patterns and performs no AI, network, database, inventory or production API operations. No new dependency is required.

Phase 4C audit found exactly its five intended files. One extra EOF blank line was removed from `precheck-examples.js`, retaining its final newline. Staged whitespace and credential/private-key checks then passed; the full baseline passed **452/452**, 23 files, 52.58 seconds. Only Phase 4C was committed as **ef0c749**, `feat: add material and construction precheck`. Phase 4D remains uncommitted.

## Implementation and input

Files under `experiments/pattern-feasibility/`:

- `pipeline.js`: strict versioned request, orchestration and unified report.
- `pipeline-examples.js`: seven reproducible synthetic cases, derived from the existing 4C examples.
- `pipeline-run.js`: JSON-file/demo CLI, stdout only.
- `pipeline.test.js`: focused integration, safeguards, determinism and CLI tests.

`runPipeline(input)` accepts `schemaVersion: "borsal.feasibility-pipeline/0.1"`, `unit: "cm"`, and these fields:

| Field | Contract reused |
| --- | --- |
| fabric | 4C fabric ID, geometry polygon/holes, confirmation/revision, optional grain and material specifications |
| pieces | 4B explicit instance IDs, cutting polygons, grain/seam declarations and optional allowed rotations |
| search | Optional existing bounded 4B search settings; defaults and hard limits unchanged |
| pattern | 4C piece-to-BOM mapping, stitching polygons, edge IDs, components, operations, connections and unresolved claims |
| bom | Explicit 4C SCRAP/STOCK material specifications, quantities, units and stock references |
| stock | Optional supplied offline stock snapshot; never inferred from a real database |
| provenance | Optional declared label, source and assumptions strings |

The exported `requestSchema` and executable examples specify exact JSON shapes. Unsupported physical construction/material types retain 4C UNVERIFIED semantics. Incorrect known specifications, invalid units, broken references and known shortages fail. Missing stock or physical evidence cannot become PASS. This is not a permanent production contract.

## Execution and safeguards

1. Validate strict input and reuse the complete 4C schema refinements before search, including duplicate IDs. Derive the nesting fabric from the single supplied fabric record; callers cannot supply a competing nesting boundary or claimed layout result.
2. Run existing bounded nesting with its unchanged deterministic candidate/rotation ordering, grain rules, collision/containment/tolerance checks and counters.
3. Independently call Phase 4A on every found complete layout. Preserve its full polygons, dimensions, areas, grain/allowance results and diagnostics. Never substitute area sufficiency for containment or overlap checks.
4. Call Phase 4C with the same original request and proposed nesting result. It independently revalidates geometry again, and checks allowances, actual grain, material allocations, aggregated stock demand, edge/component/thread references and supported connections. No algorithms are copied into the orchestrator.
5. Merge layer results without promoting unknowns. Expose nesting, independent validation and precheck evidence separately. Invalid input skips search and marks unevaluated layers UNVERIFIED.

`status` uses FAIL > UNVERIFIED > PASS across all layers. `structuralStatus` excludes only the explicit `physicalEvidence` layer, which is always UNVERIFIED in this prototype: it has no mechanism for independently authenticating physical accuracy or engineering evidence. Consequently a fully supported synthetic structural PASS still has overall UNVERIFIED, and `manufacturingVerified` is always false. Supplied confirmation is a declaration, not physical approval. No caller flag can override these boundaries.

`NO_LAYOUT_FOUND` after a candidate/backtrack limit or discrete exhaustion means unresolved search, not proven impossibility. Invalid geometry, input, a violated necessary area condition or an independently rejected proposal produces FAIL with its limited scope. The report always keeps `globalFeasibility: "NOT_ASSESSED"`. No global impossibility is claimed, including for malformed input. A necessary-condition failure is separately identified by `AREA_PRECHECK_FAILED`.

## Unified report

The report includes aggregate and per-layer verdicts/reasons, complete proposed placements, centimeter polygon/dimension/area evidence, utilization with its original COMPLETE_VALIDATED_LAYOUT or BEST_VALID_PARTIAL_LAYOUT basis, nesting limits/counters, precheck stock comparisons, flattened constraints/blockers and declared provenance. Physical accuracy stays UNVERIFIED. Measurements are calculated from supplied centimeter geometry, not new physical measurements or independent ground truth. Without a complete layout, `measurements` is null and complete placements are empty; any partial layout is explicitly scoped inside nesting evidence. Invalid shape areas are null rather than fabricated zeros.

Structural fit does not verify allowance adequacy, print/calibration accuracy, seam strength, fabric thickness/drape, three-dimensional closure alignment or load capacity. Local anchor containment and a connected assembly graph do not prove physical construction. Stock snapshots are neither authenticated nor reserved, and can become stale. Search remains discrete/incomplete and is not an optimality proof or wall-clock guarantee. The existing 20-piece and search-operation caps remain unchanged.

## Reproduce

```powershell
node experiments/pattern-feasibility/pipeline-run.js --demo
node experiments/pattern-feasibility/pipeline-run.js path/to/pipeline-request.json
npx vitest run experiments/pattern-feasibility --reporter=dot
npm test -- --reporter=dot
```

The CLI emits JSON to stdout and writes no files. Single-request exit codes: 0 PASS, 2 FAIL, 3 UNVERIFIED; CLI/file/JSON errors use 1. The mixed-outcome demo exits 0 upon successful execution, not approval of every case. Physical evidence is currently unresolved, so a supported structural request exits 3.

The demo uses the saved burgundy fabric's **74-point** polygon in `synthetic-fabric.json`, labeled SYNTHETIC_BURGUNDY_FABRIC_TEST_FIXTURE with its original source provenance. Two explicitly defined right-triangle cutting instances (`[[0,0],[2,0],[0,2]]`) occupy **4 cm2** in total. Confirmation, grain, included allowances, stitching lines, material properties, operations and stock quantities are explicitly synthetic declarations. They are not reconstructed measurements, a real garment pattern or available inventory.

Actual CLI outcomes:

| Example | Nesting / geometry | Structural verdict | Overall verdict |
| --- | --- | --- | --- |
| structural | LAYOUT_FOUND / PASS | PASS | UNVERIFIED: physical evidence |
| valid | LAYOUT_FOUND / PASS | UNVERIFIED | UNVERIFIED: strap/closure physics |
| insufficient | LAYOUT_FOUND / PASS | FAIL | FAIL: thread demand 100 cm, snapshot 10 cm |
| incomplete | LAYOUT_FOUND / PASS | UNVERIFIED | UNVERIFIED: allowance/grain/stock gaps |
| bounded | NO_LAYOUT_FOUND / UNVERIFIED | UNVERIFIED | UNVERIFIED: one-candidate cap |
| invalid | NO_LAYOUT_FOUND / FAIL | FAIL | FAIL: self-intersecting cutting outline |
| references | LAYOUT_FOUND / PASS | FAIL | FAIL: unknown thread BOM reference |

For complete demo layouts, net fabric area is **162.045910493827 cm2**, utilization **2.4684362523004544%**, remaining area approximately **158.04591049382702 cm2**. These values describe the mathematical fixture only. No physical accuracy percentage or manufacturing approval is established.

## Verification

New pipeline tests: **18/18 passed**. Combined Phase 4A–4D focused tests: **137/137 passed**, four files. Tests exercise independent evidence agreement, holes, invalid polygons, area necessity, bounded termination, grain constraints, missing allowances/confirmation/stock, shortages, broken references, unknown materials, unsupported physical claims, input immutability, network-free determinism and actual CLI exit codes. No existing test, geometric tolerance, source engine or dependency was modified.

Full regression: **470/470 passed**, 24 files, **54.86 seconds**, including all 452 baseline tests unchanged. Expected injected persistence-failure messages appeared in existing API failure-path tests; there were no failing tests. Working diff checks and separate whitespace/credential checks of all five new untracked files passed. HEAD remains the Phase 4C commit; no Phase 4D commit, push or merge was performed. No implementation blocker remains for this offline scope; physical evidence, stock freshness and bounded-search completeness remain unresolved by design.
