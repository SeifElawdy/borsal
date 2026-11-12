# Phase 4B: bounded automatic polygon nesting

## Phase 4A audit and commit

Before new implementation, verified branch feature/pattern-feasibility-engine and exactly six intended Phase 4A files. Credential/private-artifact scan found no configured sensitive values or key patterns. Local photographs/results remained ignored; only the labeled synthetic polygon fixture was eligible. Full baseline passed **384/384** (21 files, 49.17s), and working/staged diff checks passed. Committed ONLY Phase 4A as **3fab4a8**, message: feat: add geometric pattern feasibility validator. Phase 4B files are intentionally uncommitted. No push or merge.

## Scope and files

This is independent deterministic OFFLINE search for explicitly supplied polygon shapes, not pattern generation, AI, inventory or manufacturing approval. It uses one irregular fabric polygon with optional disjoint holes. New files in experiments/pattern-feasibility/:

- nesting.js: strict nesting request, bounded candidate generation/backtracking, Phase 4A validation and result diagnostics.
- nesting-examples.js: automatic-search requests using the already committed synthetic fabric/pieces.
- nest-run.js: JSON CLI and reproducible demos, separate from the unchanged Phase 4A validator CLI.
- nesting.test.js: search, constraints, determinism, budgets and CLI tests.

No Phase 4A implementation/schema/test, production source, dependency, database model or endpoint was modified. The existing Phase 4A evaluateLayout is the fit authority; this code imports it rather than reproducing containment/collision rules.

## Request contract

schemaVersion is borsal.nesting/0.1; unit must be cm. Fabric and piece polygon/grain/allowance fields are inherited from Phase 4A. Each piece ID identifies ONE instance. A caller supplies polygon shapes, not placements. Manual placement, quantity, template, scaling/mirroring and unknown fields are rejected rather than silently ignored. Multiple instances require distinct IDs.

~~~json
{
  "schemaVersion": "borsal.nesting/0.1",
  "unit": "cm",
  "fabric": {"polygonCm": [[0,0],[10,0],[10,10],[0,10]], "holes": [], "grainDirectionDeg": 0},
  "pieces": [
    {"id":"piece-a", "polygonCm":[[0,0],[2,0],[2,2],[0,2]], "outlineBasis":"CUTTING", "seamAllowanceStatus":"INCLUDED", "grain":{"localDirectionDeg":0,"toleranceDeg":0}, "allowedRotationsDeg":[0,180]},
    {"id":"piece-b", "polygonCm":[[0,0],[2,0],[0,2]], "outlineBasis":"CUTTING", "seamAllowanceStatus":"INCLUDED", "grain":{"localDirectionDeg":0,"toleranceDeg":0}}
  ],
  "search": {"rotationsDeg":[0,90,180,270], "gridStepsCm":[2,1,0.5], "gridInsetCm":0.01, "maxCandidates":5000, "maxBacktracks":100}
}
~~~

Numbers above are illustrative mathematical inputs, not verified physical pattern instructions. No seam geometry is generated. Missing/partial grain or allowance declarations retain Phase 4A UNVERIFIED statuses. Explicitly invalid declarations are rejected; complete grain constraints are enforced by the validator for every attempted pose.

### Configurable bounds and deterministic ordering

| Setting | Default | Allowed range / meaning |
| --- | --- | --- |
| search.rotationsDeg | [0,90,180,270] | Default candidates for pieces without their own allowedRotationsDeg; 1..16 finite angles |
| piece.allowedRotationsDeg | absent | Explicit per-piece choices OVERRIDE the default list; 1..16 finite angles |
| search.gridStepsCm | [2,1,0.5] | 1..8 positive levels, each 0.001..1000 cm |
| search.gridInsetCm | 0.01 cm | 0.00001..10 cm, candidate-anchor offset inside the FABRIC BOUNDING BOX, not kerf or a seam allowance |
| search.maxCandidates | 5000 | Integer 1..100000 GLOBAL generated-pose cap, including duplicate grid visits |
| search.maxBacktracks | 100 | Integer 0..10000 accepted-prefix rewinds; 0 forbids trying a sibling after an accepted branch dead-end |
| Piece instances | - | 1..20; explicit IDs and polygons, no template restriction |

Angles normalize modulo 360, deduplicate and sort ascending. Grid levels deduplicate and sort coarse-to-fine. Pieces sort by descending area; ties use ASCII ID order. Returned complete placements/validator evidence use original input order. Candidate positions enumerate rotation, then y rows / x columns within each grid level. No random choice or time-based termination affects outputs; identical input produces identical result/counters.

## Search and final authority

1. Validate request/schema and call Phase 4A with temporary zero placements as PREFLIGHT. Its fabric/shape validity and area necessary condition are used; its overlapping/outside zero positions are not confused with global impossibility. Invalid geometry/configuration and area insufficiency return NO_LAYOUT_FOUND with diagnostics, without a search.
2. Generate translations lazily, using the rotated piece bounding box to align its minimum corner to the grid's fabric-bounding-box anchor. This supports negative/nonzero piece origins. Bounding boxes only bound candidate enumeration, never prove a fit.
3. For every unique candidate on a prefix, call the complete Phase 4A validator on that prefix. Accept only geometryStatus=PASS and status!=FAIL. Thus collisions, concave crossings, covered holes, boundary contact/tolerance and supplied grain constraints cannot be bypassed. UNVERIFIED metadata remains UNVERIFIED instead of preventing a geometrically meaningful search or becoming verified.
4. On a dead-end, try alternatives only within the remaining backtrack/candidate budgets. Duplicate poses are skipped ONLY within the same prefix; the same pose is revalidated if other placed pieces change.
5. Before LAYOUT_FOUND, independently call Phase 4A again on the COMPLETE proposal in original input order. Its full evidence and PASS/UNVERIFIED status are returned. Unexpected final rejection never becomes success.

Geometry policy, coordinate/area constraints, rotation frame, implicit polygon closure, numerical tolerances and no-contact policy are unchanged from Phase 4A. This engine adds no alternative acceptance path. All candidate enumeration is finite/lazy; global generated count includes duplicates, so skipped visits cannot bypass the budget. attemptedCandidates counts actual candidate validation calls; validatorCalls includes one preflight plus attempted candidates plus the final complete-layout verification when reached (at most maxCandidates+2). Setup/geometry-validation cost still depends on vertex counts; these are operation-count bounds, NOT a wall-clock deadline or a performance guarantee.

## Output semantics

- status=LAYOUT_FOUND: all requested instances were placed and the final validator accepted geometry and every supplied hard constraint. validationStatus is PASS or UNVERIFIED, never manufactured into PASS by filling missing data. placements contain translations in cm and normalized rotations in degrees; validatorEvidence contains all placed polygons, dimensions, areas, per-piece results and diagnostics. manufacturingVerified is ALWAYS false.
- status=NO_LAYOUT_FOUND: no accepted complete layout was obtained. Reasons include INVALID_INPUT, INVALID_FABRIC_OR_PIECE, AREA_PRECHECK_FAILED, CANDIDATE_LIMIT, BACKTRACK_LIMIT and DISCRETE_CANDIDATES_EXHAUSTED. This is NOT a proof of global impossibility. globalImpossibilityClaimed is ALWAYS false. validatorEvidence/validationStatus are null when no complete candidate was checked; bestPartial carries clearly labeled valid-prefix evidence if one existed.
- areaSummary reports requested supplied-outline area, net usable fabric area, utilized/remaining area and utilization percent. On success its basis is COMPLETE_VALIDATED_LAYOUT. On failure its basis is BEST_VALID_PARTIAL_LAYOUT, and it never represents that prefix as a complete solution. Invalid geometry has null area metrics; a valid empty prefix uses zero utilization. Floating-point remaining area is clamped at zero for insignificant negative roundoff.
- generatedCandidates, attemptedCandidates, skippedDuplicateCandidates, backtracks, validatorCalls, rejectionCounts, searchLimits, rotationChoices and pieceOrder explain the actual bounded run.
- unresolvedConstraints identifies missing grain/allowance information for each relevant piece. Search success does not resolve declaration truth, physical accuracy, seam construction, stock availability or engineering/manufacturing feasibility.

## Reproduce

~~~powershell
node experiments/pattern-feasibility/nest-run.js --demo
node experiments/pattern-feasibility/nest-run.js data/nesting-request.json
npx vitest run experiments/pattern-feasibility
~~~

For a single request, exit 0 means a found layout with validator PASS; exit 3 means found geometry with validator UNVERIFIED; exit 2 means NO_LAYOUT_FOUND; exit 1 means malformed JSON/IO/CLI failure. --demo exits 0 if the intentionally mixed found/bounded-failure demonstration completes. Output is JSON stdout; no existing file is overwritten. API registration/model/inventory integration does not exist here.

## Actual demo evidence

The committed Phase 4A synthetic fixture contains the saved 74-point fabric outline (net area **162.045910493827 cm2**, physical accuracy UNVERIFIED). The existing right-triangle outlines, included-allowance declarations and zero-degree grain axes are explicitly SYNTHETIC DEMONSTRATION assumptions, not photo-derived facts. No saved Phase 4A supplied translation is used: placements are searched anew.

Actual CLI output is saved locally at [data/pattern-nesting-demo-e9124197/result.json](../data/pattern-nesting-demo-e9124197/result.json), outside the source tree. The normal request uses maxCandidates=2000, maxBacktracks=20, grid levels [2,1,0.5], and per-piece rotations [0,180].

| Demo | Actual outcome |
| --- | --- |
| synthetic | LAYOUT_FOUND, validator PASS; 29 generated/attempted candidates, 31 validator calls, 0 backtracks |
| bounded, same input with maxCandidates=1 | NO_LAYOUT_FOUND / CANDIDATE_LIMIT; 1 generated/attempted candidate, 2 validator calls; no global impossibility claim |

Found placements: triangle-a at **(25.051666666666666,10.579444444444443) cm**, triangle-b at **(23.051666666666666,14.579444444444443) cm**, both rotation 0. Utilized supplied-outline area is approximately **4 cm2**, remaining **158.04591049382702 cm2**, utilization **2.4684362523004544%**. This is a witness for this declared synthetic request, not optimal yield or a physically approved product.

## Tests and limitations

New nesting tests cover irregular/concave fabric and pieces, holes, required/per-piece rotations, supplied grain rejection, missing/partial grain/allowance uncertainty, collisions, area insufficiency, coarse-grid misses rescued by finer search, a backtracking-required case, negative origins, deterministic output/no mutation/no network, candidate/backtrack/duplicate bounds, invalid input/settings, final independent Phase 4A revalidation and CLI exit codes. Existing Phase 4A tests remain unchanged.

Limitations: discrete rotations and position grids can miss valid placements; coarse levels may consume the budget before finer levels; fixed area ordering/backtracking limits are heuristic; largest accepted prefix is not a utilization optimum; candidate-anchor inset is not a physical clearance guarantee. There is no continuous search, automatic pattern generation, SA offsets, polygon repair, piece cutouts, curve flattening, common-edge cutting, manufacturing approval, AI, production API, MongoDB/inventory or frontend. Higher limits increase cost and do not prove completeness. Physical fabric/calibration accuracy remains unverified. No new dependency was required.

Actual final focused/regression results are recorded after execution below. Phase 4B remains uncommitted; no push or merge.

### Final actual verification

- Phase 4A pre-commit full regression: **384/384 passed**, 21 files, 49.17s; working/staged diff checks and credential/artifact audit passed. Phase 4A commit is **3fab4a8** with the exact requested message.
- New nesting suite: **27/27 passed**. Combined Phase 4A/nesting focused command passed **78/78**, 2 files.
- Final full npm test: **411/411 passed**, 22 files, **53.61s**. All 384 previous tests remain unchanged and pass. No geometric/validator tolerance was changed.
- Verified HEAD still points to the Phase 4A commit; only the four new nesting source/demo/test files and this document are untracked Phase 4B work. Existing Phase 4A engine/tests, production src/, dependency files and Vitest configuration have no diff. git diff --check passed.
- Actual CLI demo saved at data/pattern-nesting-demo-e9124197/result.json: found/PASS after 29 candidates; one-candidate bounded case returned NO_LAYOUT_FOUND without global impossibility. Missing metadata cases retain validator UNVERIFIED and CLI exit 3.
- No implementation blocker remains in the requested offline scope. Search completeness/optimality and physical manufacturing approval remain unestablished. No Phase 4B commit, push, merge, AI/Cloudflare request, frontend or production database/inventory change.
