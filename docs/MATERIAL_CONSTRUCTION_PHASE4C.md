# Phase 4C: offline material and construction precheck

This deterministic experiment checks supplied declarations, geometry and references. It does not approve manufacturing or authenticate confirmation, material properties or stock. No database, inventory mutation, network requests or production integration is involved.

## Baseline and files

Phase 4B audit found only the intended five nesting source/test/documentation files; credential/private-artifact checks and whitespace checks passed. Baseline regression: 411/411 tests. Phase 4B was committed as `9e6bf91` (`feat: add automatic pattern nesting`). Phase 4C remains uncommitted.

- `experiments/pattern-feasibility/precheck.js`: strict input validation, seven result layers and aggregate verdict.
- `experiments/pattern-feasibility/precheck-examples.js`: reproducible synthetic requests using the existing 74-point fabric fixture and Phase 4B nesting.
- `experiments/pattern-feasibility/precheck-run.js`: JSON CLI.
- `experiments/pattern-feasibility/precheck.test.js`: focused offline regression tests.

## Input contract

Use `schemaVersion: "borsal.material-precheck/0.1"` and `unit: "cm"`. `precheck-examples.js` provides executable input examples; the exported `requestSchema` defines exact fields.

- `fabric`: original record `id`, `geometry` containing `polygonCm`, optional `holes`, `confirmed` and `version`; optional fabric `grainDirectionDeg` and material specifications. Missing confirmation/revision is UNVERIFIED; explicit unconfirmed geometry fails. These are offline declarations, not a database read.
- `nesting`: original Phase 4B `request` and `result`. Claimed validator evidence is never trusted: placements are revalidated by Phase 4A against the supplied fabric, holes, actual grain and allowed rotations. Fabric rings must match within 1e-6 cm, allowing cyclic/orientation differences. Missing complete layout is unresolved, never global impossibility.
- `pattern.pieces`: unique instance `id`, `bomId`, optional explicit `stitchingPolygonCm`, and `edges` with unique `id`, `basis` (`CUTTING` or `STITCHING`) and zero-based `segmentIndex`. The final polygon segment wraps to its first point. Metadata is separate from nesting cutting geometry.
- `pattern.components`: free-form role, unique ID, explicit `pieceIds` and `bomIds`. Each nested instance must have one owner. No bag templates or fixed product categories are required.
- `pattern.assembly`: existing design-language `SEAM`, `ATTACH` and `INSTALL` structures. Pattern IDs here identify individual nested instances, so `copy` must be 1. Anchors are piece-local centimeter coordinates, not global nesting coordinates. Edges must exist and seam chains must be contiguous. SEAM/ATTACH require THREAD BOM references. INSTALL requires a known BOM item and valid anchors. Unknown operations remain visible and UNVERIFIED.
- `pattern.connections`: IDs, free-form kind (including STRAP/CLOSURE), source/destination component IDs, explicit assembly IDs and `complete`. Graph connectivity is checked; a declared complete but disconnected connection fails. Partial coverage is unresolved. Graph connectivity does not prove assembled attachment alignment or strength.
- `pattern.physicalClaims` and `unsupportedClaims`: unresolved physical requirements; unsupported entries retain description, reason and nonempty missing-information details.
- `bom`: unique ID, SCRAP/STOCK source, material type/specifications, positive quantity and explicit unit; STOCK rows can identify `stockId`. SCRAP source must identify the supplied fabric. Stock accessories need not become fabric cutting patterns.
- Optional `stock`: `complete` snapshot flag and items with unique ID, material specifications, nonnegative quantity, unit and AVAILABLE/UNAVAILABLE/UNKNOWN availability.

Known material specifications and supported operation shapes reuse the unchanged `borsal.design/0.1` schema. Fabric/lining/interfacing quantities use `cm2`; thread/webbing use `cm`; buttons/hardware/zippers use integer `piece` quantities. No implicit unit conversions occur. Unknown material types are retained as UNVERIFIED. Known malformed specifications, invalid units, broken references or mismatched supplied specifications fail.

All BOM demands sharing a stock ID are summed before checking availability. Missing explicitly referenced stock fails only when the supplied snapshot declares itself complete; otherwise it is UNVERIFIED. Missing stock IDs never cause automatic material selection. SCRAP quantities must cover allocated cutting areas without exceeding usable scrap area. Area accounting alone cannot establish fit. Stock-fabric cutting feasibility is UNVERIFIED outside this one-scrap layout.

## Verdicts and boundaries

Each of input, geometry, allowances, grain, materials, assembly and construction returns PASS/FAIL/UNVERIFIED with reason codes. Aggregate precedence is FAIL, then UNVERIFIED, then PASS. `manufacturingVerified` and `inventoryMutated` are always false.

Cutting outlines are accepted as allowance-inclusive only when explicitly declared CUTTING/INCLUDED. Missing declarations remain UNVERIFIED. No offset, enlargement or allowance width is invented. Optional stitching outlines are validated and checked against cutting outlines; demonstrated excursions fail, ambiguous boundary contact remains UNVERIFIED. Inclusion declarations do not prove adequate seam width. Unequal seam lengths remain unresolved for possible ease/gathering rather than imposing a product restriction.

Grain uses fabric and piece-local directions, actual placement rotation and supplied angular tolerance through Phase 4A. Missing real fabric grain cannot be replaced by a nesting claim. Missing direction/tolerance is UNVERIFIED; known incompatible directions fail.

Structural checks can PASS without a manufacturing approval. Strap load paths, working closures, physical claims, unsupported operations, assembly order, seam strength, drape, thickness, interfacing performance and three-dimensional construction are not engineered. An anchor inside a local outline establishes only that limited planar fact. Stock is a snapshot with no reservation, consumption, freshness or concurrency guarantee. Source fabric physical measurement accuracy remains UNVERIFIED.

## Reproduce

```powershell
node experiments/pattern-feasibility/precheck-run.js --demo
node experiments/pattern-feasibility/precheck-run.js path/to/request.json
npx vitest run experiments/pattern-feasibility --reporter=dot
npm test -- --reporter=dot
```

CLI JSON goes to stdout. Request-file exit codes: 0 PASS, 2 FAIL, 3 UNVERIFIED; malformed CLI/file JSON exits 1. The mixed-outcome demo exits 0 after successfully reporting all examples. Nothing is written or mutated automatically.

Actual CLI demo outcomes:

| Example | Aggregate | Evidence |
| --- | --- | --- |
| structural | PASS | All seven supported structural layers pass; manufacturingVerified=false |
| valid | UNVERIFIED | Geometry, allowances, grain, materials and assembly pass; strap/closure physics unresolved |
| insufficient | FAIL | Thread demand 100 cm exceeds supplied 10 cm |
| incomplete | UNVERIFIED | Missing allowance/grain evidence and incomplete stock snapshot |

The fixture confirmation, grain, materials, stitching coordinates and stock quantities are explicitly SYNTHETIC offline declarations. They are not a real product or inventory record.

Focused verification: 41/41 new precheck tests and 119/119 tests across all three pattern-feasibility files passed. Full regression: 452/452 tests across 23 files passed (53.15 seconds), including all 411 baseline tests unchanged. Expected injected persistence-failure logs appeared in the existing API tests; no tests failed. Existing thresholds were unchanged. `git diff --check` passed.
