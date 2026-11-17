# Phase 5B: offline authored technical drafting

## Baseline and scope

Phase 5A audit found exactly the four intended bridge files and its documentation. Credential/private-key, whitespace and test-database isolation checks passed. Full baseline: **494/494 tests passed**, 25 files, **112.81 seconds**. Staged diff checks passed; only Phase 5A was committed as **3739e7c**, `feat: bridge designs to feasibility pipeline`. Work then moved to **feature/technical-pattern-drafting**. Phase 5B remains uncommitted.

This workflow packages explicitly authored geometry and metadata, renders an SVG preview and delegates readiness/feasibility to the unchanged 5A bridge and Phase 4D pipeline. It does not turn prose into patterns, generate seam offsets, choose attachment points, calculate procurement quantities or assume stock exists. No AI, network, production API, database, inventory mutation or new dependency is involved.

## Files and contract

Files under `experiments/technical-drafting/`:

- `draft.js`: strict draft/source validation, unresolved-field report, source snapshots/hashes, cutting-piece metadata and bridge invocation.
- `preview.js`: escaped, static SVG showing separately styled cutting/stitching outlines and centimeter labels.
- `examples.js`: explicitly authored small accessory pocket, incomplete draft and invalid cutting polygon.
- `run.js`: CLI and exclusive fresh-directory artifact writer.
- `draft.test.js`: focused source, geometry, uncertainty, SVG and CLI tests.

Use `schemaVersion: "borsal.technical-draft/0.1"` with:

| Field | Content |
| --- | --- |
| sourceConcept | Declared `path` and `data`: existing `borsal.concept/0.1`, or minimal `borsal.manual-concept/0.1` |
| design | Optional declared `path` and explicitly authored `borsal.design/0.1` data |
| context | Optional unchanged 5A context: fabric, explicit cutting instances, allowance inclusion, grain tolerances, allowed rotations, stock snapshot/bindings and bounded search settings |

The manual concept has an ID, `authorship: "HUMAN"`, `brief` reusing the existing original-brief structure, and `creative` reusing the existing concept creative structure. It requires no fictional AI response, campaign ID or model provenance. This is an isolated source wrapper; original concept/design schemas are unchanged.

The `design` retains existing required category/identity, creative descriptions, illustrative overall dimensions, seam-line patterns, components, edges, assembly, features, BOM and limitations. `context.instances` supplies distinct centimeter cutting polygons for each source `(pieceId, copy)`. The bridge requires explicit included-allowance declarations, source grain direction and supplied tolerance before nesting. Source cut counts never generate geometry; missing cutting copies stay unresolved.

Existing design categories remain SHOULDER_BAG/TOTE_BAG. The example uses TOTE_BAG as an explicit **future parent-design context** for an accessory pocket; it does not invent a complete tote, handles or other bag patterns. The generic polygon renderer has no rectangular-bag template, and concave/CW/nonzero-origin cases are tested. Curves may be drawn as their original SVG paths, but the existing bridge does not flatten Bezier stitching geometry for manufacturing checks: those drafts stay CONCEPT_ONLY. Piece-internal cutouts and stock-cutting designs retain existing bridge limitations.

## Results and boundaries

- **REJECTED / FAIL:** malformed supplied data, invalid geometry/references or a rejected bridge request. No invalid preview is emitted.
- **CONCEPT_ONLY / UNVERIFIED:** missing explicit technical fields, cutting geometry, grain, stock or unsupported mapping. Exact missing field paths are retained. The workflow does not insert dimensions, allowances, quantities or points. Valid supplied cutting geometry can be previewed when the bridge is incomplete for independent grain/stock reasons; structurally incomplete technical designs have no preview.
- **CHECKED:** a complete supported draft reached the existing bridge/pipeline. Its PASS/FAIL/UNVERIFIED verdict and evidence remain unchanged. Physical evidence never becomes manufacturing approval.

Reports contain the original concept/design/context snapshots and SHA-256 hashes (JSON.stringify UTF-8 basis), source paths, source-copy links, explicit cutting polygons, computed bounding boxes/areas, original stitching outlines, declared allowance/grain values, original BOM/assembly/features/limitations and full bridge evidence. Concept requirements remain visible with creative review UNVERIFIED. A supplied technical interpretation of an AI concept is not automatically evidence that all creative requirements were realized.

Cutting and stitching outlines remain distinct. A scalar `seamAllowanceCm` is displayed as a declaration, never used to enlarge the seam polygon. Explicit cutting contours are checked by existing geometry/precheck rules; adequate allowance width, exact scalar-to-offset equivalence and seam strength are not established. Missing dimensions are not inferred from a concept or replaced with bounding boxes. Authored overall dimensions and computed cutting-outline dimensions have separately labeled report fields.

On structurally incomplete input, source schema checks can mask further cross-reference refinements. The report remains CONCEPT_ONLY with no feasibility run; the missing fields must be supplied before complete validation. Known malformed coordinates and invalid supplied polygons are rejected even alongside missing fields. No incomplete draft is claimed fully technically validated.

## SVG preview

Solid burgundy is the supplied cutting contour; dashed blue is the supplied stitching path. Each source copy is shown separately in its local centimeter coordinate frame, with ID/copy, cutting bounding-box dimensions, area, edge IDs, grain/tolerance and declared allowance. Display translations only arrange the sheet: they are not nesting placements or accessory attachment positions. The SVG includes centimeter page units, source hashes, verdict and explicit UNVERIFIED/no-approval warnings. Display labels round to four decimals; report polygons/dimensions retain numerical values.

Text/metadata is XML-escaped, with no script, links or external assets. The preview is readable vector output, **not a print-scale-validated production cutting file**. No photorealistic product rendering, physical material behavior or construction approval is implied.

## Reproduce and saved artifacts

From the repository root:

```powershell
node experiments/technical-drafting/run.js --demo
node experiments/technical-drafting/run.js --demo data/my-new-drafting-demo
node experiments/technical-drafting/run.js path/to/draft-request.json data/my-new-single-draft
npx vitest run experiments/technical-drafting experiments/design-feasibility experiments/pattern-feasibility --reporter=dot
npm test -- --reporter=dot
```

Output directories must not already exist; parent directories must exist. The CLI refuses overwrites and uses exclusive file writes. Each case saves `<name>-input.json`, `<name>-report.json` and, only when available, `<name>-preview.svg`. Reports retain all structured evidence but place SVG in a separate file. Single-request exit codes: 0 PASS, 2 FAIL/rejected, 3 UNVERIFIED/concept-only; CLI/file errors use 1. The mixed demo exits 0 when all cases were executed, not because all cases passed. Stdout is a concise status/error/unresolved summary.

Actual generated local artifacts (ignored by Git):

- Pattern request: **`data/technical-pattern-draft-5b-001/complete-input.json`**.
- Source-linked report/geometry: **`data/technical-pattern-draft-5b-001/complete-report.json`**.
- SVG preview: **`data/technical-pattern-draft-5b-001/complete-preview.svg`**.
- Incomplete/invalid inputs and reports: same directory, `incomplete-*` and `invalid-*`.
- `preview-check.png`: local Sharp raster used for visual inspection only, not AI image generation or another source design.

The saved SVG was opened through Sharp, rasterized successfully (38,203-byte PNG buffer), then visually inspected from its local raster. Labels, two distinct cutting/stitching rectangles and warnings were readable. `git check-ignore` confirmed the SVG is ignored under `data/`.

## Authored accessory example and actual verdicts

The example is a manually authored small open-top two-panel pocket. Both cutting panels are **6 × 4 cm**, area **24 cm2** each. Supplied stitching rectangles run from (0.5,0.5) to (5.5,3.5); right/bottom/left edge groups are explicitly joined, leaving the top open. Declared allowance is **0.5 cm**; grain is 0 degrees with supplied 5-degree tolerance and allowed rotations [0,180]. Declared overall dimensions are **5 × 3 × 0.2 cm**, illustrative and not physically verified.

The BOM explicitly declares 48 cm2 of SCRAP and 200 cm of THREAD. Offline synthetic stock declares 1,000 cm of thread; this is not actual inventory. The fabric is the existing labeled 74-point synthetic burgundy polygon, area **162.045910493827 cm2**; its confirmation, material/grain declarations and physical accuracy are not independently authenticated.

| Actual demo | Result | Evidence |
| --- | --- | --- |
| complete | CHECKED / UNVERIFIED | Two cutting panels; geometry/material checks PASS; construction/physical evidence UNVERIFIED; SVG saved |
| incomplete | CONCEPT_ONLY / UNVERIFIED | Missing overall dimensions, seamAllowanceCm and one grain tolerance; no bridge/pipeline run or invented preview |
| invalid | REJECTED / FAIL | Supplied self-intersecting cutting polygon; no invalid preview or feasibility run |

Found complete-layout utilization is approximately **48.00000000000006 cm2**, remaining **114.04591049382694 cm2**, **29.621235027605696%** utilization (floating-point arithmetic). Layout search and its limits are inherited unchanged. This is a mathematical placement witness, not an optimized yield or engineering approval. Opening finish, assembled depth, seam strength and any complete parent bag remain unresolved. This example was **not generated by AI**.

## Verification

New drafting suite: **21/21 passed**. Combined drafting/bridge/4A–4D focused suite: **182/182 passed**, six files, **20.96 seconds**. Coverage includes manual/existing concept sources, immutable lineage, missing dimensions/allowances/grain/attachments/quantities, invalid polygons and references, shortages, bounded search, arbitrary concave/CW/translated polygons, unflattened curves, openable/rasterizable SVG, escaped markup, deterministic network-free execution and CLI overwrite protection. Existing tests, schemas, validators and tolerances were unchanged.

Final full regression: **515/515 passed**, 26 files, **83.46 seconds**, including all 494 baseline tests unchanged. Expected injected persistence-failure logs appeared in existing API tests; there were no failures. `git diff --check` and separate security/whitespace checks of all six new files passed. Existing production source, schemas, safe original fixtures, dependencies and configuration have no diff. Generated artifacts remain ignored under `data/`. No Phase 5B commit, push or merge was performed. No implementation blocker remains for this offline scope; physical accuracy, opening finish, construction performance and complete parent-product drafting remain unverified.
