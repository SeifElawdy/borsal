# Phase 4A: geometric feasibility of supplied cutting layouts

## Scope and status

Independent, deterministic offline experiment on feature/pattern-feasibility-engine. It checks the layout supplied by the caller, never searches for another layout. No AI, MongoDB, inventory, production API, pattern generation, new dependency or manufacturing approval. The initial branch/worktree was verified clean; baseline full suite passed **333/333** (20 files, 47.28s).

Files under experiments/pattern-feasibility/:

- engine.js: strict versioned Zod input, existing polygon validation and pure supplied-layout evaluation.
- engine.test.js: geometric, metadata, numerical and CLI regression cases.
- synthetic-fabric.json: only the saved 74-point synthetic fabric polygon and explicit provenance, not a database/photo/private-result dump.
- examples.js: two manually positioned triangular pieces on that polygon; one passing and one deliberately outside layout.
- run.js: JSON-file CLI or reproducible demo. It has no network/database integration.

## Input contract

Root schemaVersion is borsal.pattern-layout/0.1 and unit must be cm. Unknown fields, duplicate piece-instance IDs, nonfinite numbers and malformed transforms are rejected, not coerced or silently removed.

~~~json
{
  "schemaVersion": "borsal.pattern-layout/0.1",
  "unit": "cm",
  "fabric": {
    "polygonCm": [[0,0],[10,0],[10,10],[0,10]],
    "holes": [],
    "grainDirectionDeg": 0
  },
  "pieces": [{
    "id": "triangle-a",
    "polygonCm": [[0,0],[2,0],[0,2]],
    "placement": {"translationCm": [1,1], "rotationDeg": 0},
    "outlineBasis": "CUTTING",
    "seamAllowanceStatus": "INCLUDED",
    "grain": {"localDirectionDeg": 0, "toleranceDeg": 5}
  }]
}
~~~

This is an illustrative geometry input, not a physical pattern instruction. Each piece instance has its own unique ID and explicit placement; repeat a pattern as separate IDs/placements. There is exactly ONE fabric region, optionally with holes, and arbitrary simple polygonal pieces. There are no product templates or rectangular-fabric assumptions.

All points are [x,y] arrays in cm. Polygon rings are implicitly closed: do not repeat the first vertex at the end. Existing geometry rules remain unchanged: at least three finite vertices, coordinate range [-1000,1000], no consecutive duplicate points or self-intersections, area greater than 0.01 cm2. CW and CCW inputs are accepted and normalized CCW. Placed outlines are validated again against the same rules/range.

Rotation is about the piece's LOCAL ORIGIN, then translation: x'=x*cos(r)-y*sin(r)+tx; y'=x*sin(r)+y*cos(r)+ty. Finite rotation angles are normalized modulo 360 before trigonometry. No scaling, reflection or implicit centroid rotation is accepted. Positive rotation is mathematically counter-clockwise in a y-up frame; on saved y-down photograph/mat coordinates the same matrix appears clockwise. Keep polygons, placements and declared grain angles in one consistent coordinate frame. Dimensions in reports are the placed axis-aligned bounding-box extents, not intrinsic edge lengths.

The engine trusts the explicitly supplied fabric boundary/holes: it does not discover defects, reconstruct a photograph or verify physical scale. Empty/omitted holes means the caller supplied no excluded regions, not proof that physical fabric has no holes.

## Fit and numerical policy

1. Reuse src/geometry/polygon.js validatePolygon, validateWithHoles, orientation normalization, area, dimensions and pointInPolygon. Add local checks rejecting overlapping, nested or touching holes because the production validator does not validate hole-to-hole relationships. Production geometry code is unchanged.
2. Transform each valid outline and examine all boundary segments, not only its vertices or bounding box. Vertex inclusion plus no outer-boundary crossings/contact ensures containment for the supported simple polygons, including concavities. A bridge whose vertices are inside but whose edge exits an indentation fails.
3. Check fabric holes by boundary contact AND polygon containment in both directions. A piece entirely within a hole, crossing it, or enclosing an entire hole fails; the latter would be missed by piece-vertex checks alone.
4. Check every pair of pieces by all segment pairs plus containment in both directions, detecting proper crossing, interior overlap, coincident outlines, shared edges and isolated vertex touches.
5. Use conservative **NO CONTACT** policy. Any outer/hole/piece boundary separation <= **1e-6 cm** fails. Exact contact is not allowed in this phase; shared-edge/common-cut layouts are unsupported. This is a numerical exclusion margin, not a validated kerf or manufacturing clearance.
6. Proper crossings are detected by oriented straddling; near/collinear contact uses Euclidean endpoint-to-segment distances in cm. This avoids comparing a length epsilon to an unscaled cross product. Existing validation retains its original 1e-9 internal epsilon; the new clearance policy is a separate, more conservative distance check, not a modification to production validation.
7. Sum supplied piece areas and compare with net fabric area as a preliminary NECESSARY condition only (area tolerance 1e-8 cm2). Sufficient area never proves fit. Invalid pieces yield unknown totals, not invented zero areas. Hole regions must be disjoint before net area is used.

No automatic repair, offsets, snapping, sampling-based containment shortcut or polygon clipping library is introduced. Computation uses JavaScript double precision and quadratic validation/pairwise segment checks; very large vertex/piece counts and pathological numerical geometry have not been performance/robustness benchmarked. Near-contact failures are deliberately conservative. No exact-arithmetic guarantee is claimed.

## Allowances and grain: explicit uncertainty

outlineBasis supports CUTTING, SEAM_LINE and UNKNOWN (default). seamAllowanceStatus supports INCLUDED, NOT_INCLUDED and UNKNOWN (default). Only CUTTING + explicitly INCLUDED establishes that the caller supplied an allowance-complete cutting outline for this check. The checker **never adds an allowance** from a guessed width or from a seam line. Missing/not-included allowance geometry remains UNVERIFIED even if the supplied outline geometrically fits. The declaration itself is not independent engineering verification.

Grain data is optional: fabric.grainDirectionDeg and piece.grain.localDirectionDeg must be in [0,180); piece toleranceDeg is explicit and between 0 and 90. Compare the rotated local direction with fabric direction as an undirected axis modulo 180. Angular tolerance uses a separate 1e-7-degree numerical epsilon. Missing fabric grain, a piece direction, or its tolerance (including a partially supplied grain object) yields UNVERIFIED; fully supplied directions can pass or fail the declared constraint. No missing angle or tolerance is defaulted. The checker does not infer warp/weft from a photo or establish material anisotropy.

## Results and interpretation

- status PASS: the supplied layout passes geometry and all explicitly supplied allowance/grain checks under this contract. It is not a globally optimal layout or manufacturing approval.
- status FAIL: invalid input/geometry, failing supplied placement, area necessary-condition failure, or violated declared grain constraint. Failure of one layout does NOT imply no feasible layout exists.
- status UNVERIFIED: no established failure, but necessary allowance/grain information is missing. geometryStatus can be PASS while overall status is UNVERIFIED.

Every response states globalFeasibility=NOT_ASSESSED and manufacturingVerified=false. It includes unit, numerical tolerances, boundary policy, classification, diagnostics, normalized fabric/holes, net area, and areaCheck with necessaryOnly=true. Structurally invalid input has diagnostics with exact field paths and no fabricated geometry.

Each structurally valid piece record includes ID, normalized placement, placed polygon, dimensions, area, input winding, geometry reasons and separate grain/allowance status/reason. Invalid polygons have null dimensions/areas. Collision diagnostics identify both piece IDs and, where applicable, the first intersecting/contacting edge indices. Geometry problems are separate from incomplete manufacturing-related metadata.

## Reproduce the CLI

From the repository root:

~~~powershell
node experiments/pattern-feasibility/run.js --demo
node experiments/pattern-feasibility/run.js data/my-layout.json
npx vitest run experiments/pattern-feasibility/engine.test.js
~~~

Use the contract above for my-layout.json (UTF-8 JSON). The CLI writes JSON to stdout; it does not overwrite any source/result file. Exit codes for a single layout: 0 PASS, 2 FAIL, 3 UNVERIFIED; malformed JSON, bad command usage or IO errors use 1. --demo exits 0 when the intentionally mixed demonstration completes, not because every sample fits.

## Saved synthetic fixture and actual demonstration

synthetic-fabric.json copies only polygonCm from the preexisting data/test-mat40-measure/measurement-report.json and stores its source-file SHA-256 plus SYNTHETIC_TEST_FIXTURE / physicalAccuracy=UNVERIFIED labels. It does not depend on ignored local files at runtime. No measured accuracy, grain direction, material availability or manufacturing readiness is inferred from the source. The associated original synthetic image is data/test-mat40.png.

The demo's two explicitly positioned 2 cm right triangles have total area 4 cm2. Its declared included allowances and zero-degree grain axes are artificial demonstration assumptions, explicitly recorded in the output; they were not extracted from the original photo.

| Supplied layout | Explicit positions | Result | Meaning |
| --- | --- | --- | --- |
| pass | triangle-a at (22,20), triangle-b at (24,25), rotation 0 | PASS | Both supplied cutting polygons fit under the declared synthetic constraints |
| fail | Same first triangle; second translated to (100,100) | FAIL / OUTSIDE_FABRIC | This supplied layout fails although the 4 cm2 total area is below usable area |

Actual usable polygon area computed from the 74-point fixture: **162.045910493827 cm2** (the earlier rounded offline area was 162.0459). The demo was executed through the actual CLI and saved locally to [data/pattern-feasibility-demo-7266b44e/result.json](../data/pattern-feasibility-demo-7266b44e/result.json). Both cases return globalFeasibility=NOT_ASSESSED and manufacturingVerified=false. No automatic placement search was used to construct or test them.

## Verification and limitations

Final focused run: **51/51 tests passed**, 1 file, 1.49s. Tests cover multiple valid pieces, concave fabric and pieces, concavity-bridging edges, hole containment/crossing/coverage/contact, hole-to-hole overlap/nesting, all overlap/contact modes, area insufficiency and misleading sufficiency, rotation, winding, grain constraints/uncertainty, missing allowances, unit/version/ID/transform errors, finite-coordinate/range validation, tolerance edge cases, input immutability, no network access and actual CLI exit outcomes. No existing test or threshold was changed.

Remaining scope limits: polygonal straight-edge outlines only, no piece-internal cutouts, curve flattening, seam offset construction, common-edge cuts, nesting/search, cut ordering, physical accuracy validation, manufacturing feasibility, stock availability or inventory. Future work requires an explicitly reviewed input contract and tests; nothing in this phase adopts permanent pattern-engine architecture or starts a manufacturing engine. Full regression result is recorded after execution below. No commit, push or merge.

### Final actual regression result

After adding the partial-grain uncertainty case, focused tests passed **51/51** (1 file, 1.49s). The final full npm test passed **384/384** across **21 files**, 50.00s. All **333 existing tests remain unchanged and passing**. The earlier 383-test run also passed before that additional case. Production src/, dependencies and Vitest configuration are unchanged; only this document and experiments/pattern-feasibility/ are new. Git diff --check passed. No implementation blocker remains for this offline scope; physical manufacturing validation, nesting and unsupported geometry remain outside its claims. No commit, push or merge was performed.
