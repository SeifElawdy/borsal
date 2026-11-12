# Design Language Spike 1 - Phase 2A

## Outcome and scope
Completed the manual language experiment only. Version borsal.design/0.1 structurally parses all eight manually authored women's bag examples. No numerical expressiveness acceptance threshold was approved or applied, and the language is not permanently adopted. Phase 2B has not started. No AI/external API calls were made.
All dimensions, material specifications and quantities are illustrative. None of these designs is manufacturing-verified or manufacturing-ready; no physical/engineering feasibility checks were performed.

## Step 0 verification and actual checks
- Starting branch: feature/design-language-spike; HEAD: 4729b3d. Working tree was clean before changes.
- Read AGENTS.md, package.json, the existing polygon/homography modules and tests, docs/PROJECT_STATUS.md and the Phase 1b report. The current backend uses existing CommonJS and Zod; Vitest tests follow the existing import convention for Vitest itself.
- Verified database isolation before baseline execution: configured MongoDB URI has an explicit database name, fabrics.test.js derives a DISTINCT -test database, and the two newer API suites use unique test-suffixed database names plus unique temporary uploads directories. fileParallelism=false prevents shared fixture/upload interference. No credentials or connection strings were printed.
- Baseline npm test: exit 0, 76 passed across 6 files; start 02:13:38; duration 18.45s.
- Focused npm test -- experiments/design-language/schema.test.js: exit 0, 51 passed across 1 file; start 02:20:44; duration 674ms.
- node experiments/design-language/evaluate.js: exit 0; all eight schemaValid=true; every result manufacturingVerified=false (meaning NOT established, not an engineering failure).
- Final npm test: exit 0, 127 passed across 7 files (76 previous + 51 new); start 02:21:56; duration 19.61s. No existing test or tolerance changed.
- git diff --quiet -- src package.json package-lock.json vitest.config.js: exit 0; production source, database schema, dependencies, test configuration and all existing tests are unchanged.
The existing simulated database-create cleanup test prints an expected generic error on stderr while passing. No baseline or new-test failures occurred.

## Proposed language structure
The standalone Zod schema is [schema.js](../experiments/design-language/schema.js). The evaluator is [evaluate.js](../experiments/design-language/evaluate.js). Neither is imported by the backend. Examples are static JSON, authored manually as distinct experiments, not runtime-generated templates or a catalog of approved products.

| Section | Contract and purpose |
| --- | --- |
| schemaVersion, id, name, category | Exact version borsal.design/0.1; design identity and SHOULDER_BAG/TOTE_BAG classification. No template ID dictates geometry. |
| creative | Free-form description, aesthetic intentions and intended use. Software does not treat this prose as manufacturing instructions. |
| technical.dimensionUnit, evidence, overallDimensions | Centimeters; literal ILLUSTRATIVE_ONLY; finite positive width/height/depth. Overall dimensions are independent illustrative targets, not derived from panels. |
| technical.scrapSources | Exactly ONE symbolic physical scrap source for this MVP. It is not a live FabricPiece ID and has no inferred dimensions/availability. Future multi-scrap support requires an explicit versioned relaxation of the length guard, with source references already structured. |
| technical.bom | Entries have unique IDs, a discriminated SCRAP(scrapId) or STOCK(availability=NOT_CHECKED) source, controlled material type/specs and explicit quantity value/unit. Scrap is woven fabric in this version. All scrap entries refer to the one declared source; at least one actual pattern uses it. |
| technical.components | Unique component IDs, roles (body, gusset, base, pocket, flap, strap, handle, lining, divider, reinforcement) and explicit piece IDs. Multiple pieces and cut copies may come from the same scrap. |
| technical.patternPieces | Unique IDs, BOM material reference, integer cutCount, finite grain direction [0,180), closed boundary segments, nonnegative seamAllowanceCm and fold axes. Every piece belongs to exactly one component. Pattern materials must be area-based fabric/interfacing. |
| technical.assembly | Named SEAM pairs of edge groups, ATTACH anchor pairs, and INSTALL BOM-to-piece anchors. Each piece reference includes a 1-based cut-copy index; edge and thread references are checked. |
| technical.features | Named intent records with controlled feature kind, component IDs and BOM IDs. Intent prose is descriptive; references are machine-interpretable. This layer can preserve a feature even when its process/geometry is unsupported. |
| limitations | REQUIRED array, permitted to be empty when an author declares no missing feature. Each entry references a feature ID, status PARTIAL/UNSUPPORTED, a nonempty reason and missing-information list. Unknown fields are rejected rather than silently stripped. Every supplied sample records both partial and unsupported intent. |

## Geometry and reference conventions
All pattern coordinates, anchors, fold axes, seam allowances and material dimensions ending in Cm use centimeters. Local 2D coordinates have x right and y up; negative coordinates are permitted. There are no world transforms, placements, orientation-in-assembly or physical thickness implications.
outlineBasis=SEAM_LINE is mandatory. The outline is a nominal stitch-boundary design, NOT an offset cutting contour. LINE segments have an endpoint; CUBIC_BEZIER segments have two control points and an endpoint. The starting point and ordered segments explicitly close back to the start. IDs are scoped: piece IDs are unique per design; edge/fold IDs per piece; typed reference fields resolve their respective namespaces. copy selects 1..cutCount. FORWARD/REVERSE describes traversal of the listed edge group.
Seam allowance is one uniform scalar per piece; it is not computed or added to the boundary. Fold records carry a straight axis, HEM/BOX/PLEAT intent and allowance, not a spatial fold state. Assemblies are relationships, not a dependency-checked operation schedule. Grouped seam edges and anchors describe relationships without asserting matched lengths or physically complete stitch coverage.
The existing geometry modules were inspected but not called by this validator: polygon.js checks straight polygon geometry and homography.js handles photo calibration. Neither is a reliable cubic-path manufacturing validator. Reusing them to certify these curved or folded concepts would overstate their scope; both remain unchanged.

## Controlled materials and quantities
- WOVEN_FABRIC: fiber (COTTON/POLYESTER/BLEND), weave (PLAIN/TWILL/SATIN), weightGsm; quantity cm2. It may come from SCRAP or unchecked STOCK.
- LINING_FABRIC: fiber and weightGsm; quantity cm2; STOCK.
- WEBBING: fiber and widthCm; quantity cm; STOCK.
- ZIPPER: lengthCm, toothType (COIL/METAL), endType (CLOSED/OPEN); integer quantity piece; STOCK.
- THREAD: fiber and tex; quantity cm; STOCK.
- BUTTON: diameterCm and material (METAL/RESIN/WOOD); integer quantity piece; STOCK.
- HARDWARE: kind (D_RING, SWIVEL_HOOK, MAGNETIC_SNAP, TURN_LOCK, RIVET, BAG_FOOT), finish and sizeCm; integer quantity piece; STOCK.
- INTERFACING: weightGsm and bond (FUSIBLE/SEW_IN); quantity cm2; STOCK.
These are controlled experimental identifiers, not an exhaustive material ontology. Examples exercise woven fabric, lining, webbing, zipper, thread, interfacing and multiple hardware types; BUTTON is representable but no sample uses it. Unsupported material/process types must remain visible in a feature limitation, pending a versioned addition; do not replace them with a misleading supported type. Structured specifications do not establish material suitability or stock availability. Nominal BOM totals are not nesting estimates, procurement checks or calculated fabric consumption.

## Eight-design expressiveness comparison
Categories are four women's shoulder bags (1-4) and four women's totes (5-8). All are original hand-authored specimen descriptions. No intended gathering, fold, closure, compartment or structural feature was removed to satisfy validation; unmodeled details remain in their feature/limitation records.

| Design (illustrative W x H x D cm) | Schema-valid | Expressed intent | Partial | Unsupported | Missing for deterministic validation | Would extension improve coverage? |
| --- | --- | --- | --- | --- | --- | --- |
| [1. Ochre Ribbon Shoulder](../experiments/design-language/examples/01-shoulder-01.json) (28 x 22 x 3) | Yes | Two-panel shell | External strap mounting/reinforcement | Soft 3D drape | Bar-tacks, mount loads, bending/stretch properties | Yes: stitch-path definitions; drape needs a separate material model |
| [2. Boxline Zip Shoulder](../experiments/design-language/examples/02-shoulder-02.json) (26 x 20 x 8) | Yes | Shell, base and separate side-gusset pieces | Zipper insertion and ring/strap loops | Three-way corner stacking | Zip end tabs, clearances, loop stacks, clipping/topology | Yes: seam spans, zipper-end parts and junction topology |
| [3. Crescent Pocket Shoulder](../experiments/design-language/examples/03-shoulder-03.json) (28 x 20 x 4) | Yes | Basic stock shoulder strap | Cubic crescent outline/allowance and internal pocket attachment | Variable gathers on a curve | Curve offsets/length matching, pocket stitch path, gather/ease mapping | Yes: seam parameterization, gather ratio/distribution and placement transforms |
| [4. Arc Flap Shoulder](../experiments/design-language/examples/04-shoulder-04.json) (24 x 18 x 4) | Yes | Shell and basic stock strap | Rounded flap finishing and magnetic closure installation | Flush snap recess/compression | Facing, turn-of-cloth, prong holes, backing/stack tolerances | Yes: hole geometry and layer stacks; compression needs engineering data |
| [5. Ribbon Handle Tote](../experiments/design-language/examples/05-tote-05.json) (34 x 38 x 3) | Yes | Shell and top-hem axis | Folded fabric handles and reinforced mounts | Finished handle cross-section | Fold order, handle drop, layer stack and stitch footprints | Yes: directed folds, layer order and stitch paths |
| [6. Accordion Base Tote](../experiments/design-language/examples/06-tote-06.json) (38 x 32 x 12) | Yes | Separate flat floor panel | Box-fold side gussets and split webbing handles | Twist-free 3D collapsing corners | Fold directions/angles, handle split lengths, corner stacks/kinematics | Yes: fold state and junction constraints; motion requires a separate solver |
| [7. Quiet Divide Lined Tote](../experiments/design-language/examples/07-tote-07.json) (36 x 34 x 8) | Yes | Outer shell and basic stock handles | Full lining fit and central divider attachment | Partial-edge turning gap and temporary seam state | Lining ease, divider transforms, gap intervals, assembly access/order | Yes: edge intervals, seam states, transforms and operation dependencies |
| [8. Architect Hardware Tote](../experiments/design-language/examples/08-tote-08.json) (32 x 30 x 10) | Yes | Shell, side and base components | Sew-in interfacing, riveted handles and feet mounts | Upright load-bearing shape retention | Layer paths, paired rivet holes/grip, washers/clearances, stiffness/loads | Yes: hardware cutouts and layer/process data; structural behavior needs engineering checks |

Every JSON contains a clear creative description, identified components and pattern geometry, typed assembly references, a SCRAP/STOCK BOM and limitation reasons. Some assembly paths/parts are deliberately incomplete because that is an observed gap, not a hidden manufacturing claim. For example, the lined tote does not fake a whole-edge seam as its turning gap; the missing partial-edge semantics are recorded explicitly.

## How to interpret the measured results
- Schema-valid: mechanically passes required fields, strict supported types/units/version, positive finite dimensions, scoped uniqueness, closed endpoints and typed references. Observed: 8/8 examples.
- Expressible: a manual assessment of whether this draft can describe the specified feature intent. Across 35 declared feature intents, the authored ledger plus evaluator classified 12 as expressed, 15 partial and 8 unsupported. Counts reflect these authors' declared feature boundaries and gaps, not an independent semantic proof, physical pass rate, normalized creativity score or permanent adoption threshold.
- Manufacturing-verified: requires engineering/physical checks beyond structure; NOT established for any sample. The evaluator always reports manufacturingVerified=false and does not attempt those checks.
The evaluator derives expressed IDs from features without a limitation, and partial/unsupported IDs from the ledger. It cannot infer an omitted limitation from natural-language intent. A human must audit the creative brief against the technical data; schema-valid JSON alone cannot prove that the brief was preserved.
Observed strength: separate creative identity survives alongside explicit part, material, edge, copy and assembly references, while very different outlines and component layouts share a small contract. Observed gaps: curved offsets, spatial folds, seam intervals/states, gathers, layers, hardware cutouts and material mechanics. Supporting additional enum values or prose alone would not solve these gaps.

## What a future manufacturing validator would need
Before any manufacturing approval, define and check: complete component/assembly coverage; verified seam correspondence, lengths, ease and notch positions; robust line/curve intersections and topology; allowance offsets with corner treatment; holes/cutouts and safe clearances; directed folds, layer order, placement transforms, seam access and dependency order; materials/thickness, shrinkage, bend and strength properties; closure/hardware fit and loads; actual scrap geometry, defects, grain and usable regions; per-stock requirements and verified availability; then nesting, cutting tolerances and prototype/physical measurements. None of these calculations, inventory checks or pattern-generation processes was implemented here.
Extension would improve representational coverage for each example as listed above, but physical validation still requires independent engineering rules and data. No representation should claim arbitrary manufacturing geometry on the basis of this experiment.

## Recommendations for the next AI experiment (proposal only)
1. Keep this contract experimental. Give the future model the exact schema version, coordinate conventions, one-scrap rule and NOT_CHECKED stock rule; require separate creative and technical sections and an honest limitations ledger.
2. Compare model output against these eight manual briefs plus new held-out creative briefs, without selecting permanent bag templates. Audit preservation of gathers, compartments, folds, hardware and unusual silhouettes rather than simplifying them away.
3. Use structural errors as explicit feedback; compare unsupported/partial intent and hallucinated part/material references separately from parse success. Do not treat parser success as engineering approval.
4. First consider versioned seam-span/state, fold/layer and attachment-path extensions suggested by this report. Set review criteria and any numerical expressiveness threshold with the project owner before declaring the language accepted.
No model was called, no prompts were executed, no Phase 2B implementation was started, and no adoption decision was made.

## Files and scope
- Created experiments/design-language/schema.js (CommonJS Zod validator).
- Created experiments/design-language/evaluate.js (CommonJS local CLI and evaluator).
- Created experiments/design-language/schema.test.js (51 focused Vitest tests).
- Created eight standalone JSON examples in experiments/design-language/examples/ (individual links in the table).
- Created docs/DESIGN_LANGUAGE_SPIKE_1.md (this factual report).
- Updated docs/PROJECT_STATUS.md only after all tests passed, marking the manual experiment complete pending review.
No production backend, FabricPiece schema, routes, image/geometry extraction, database structure, dependencies or previous tests/configuration were changed. No commit or push was run.

## Reproduce
From the project root:
```powershell
node experiments/design-language/evaluate.js
npm test -- experiments/design-language/schema.test.js
npm test
```
The focused suite and evaluation do not load dotenv, Express, Mongoose or any network client. Before running the full suite in a different environment, re-check that MONGODB_URI has an explicit database and that the derived test database is distinct; existing integration suites drop their test databases. This experiment did not change that existing test behavior.
