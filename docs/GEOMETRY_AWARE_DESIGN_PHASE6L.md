# Phase 6L — Geometry-aware candidate generation

## Audit and preservation

Phase 6K passed the 729-test baseline, secret/dependency inspection and staged whitespace checks, then was committed as `91ea592` (`feat: improve candidate validation and recovery`). Branch: `feature/geometry-aware-ai-design`. Phase 6L is uncommitted. Existing Express, candidate schema, constructor, validators, nesting and approval engines remain authoritative; no replacement engine or dependencies.

Zero Cloudflare requests. The current real ledger is **16/20**, four remaining. All 109 existing campaign/ledger artifacts have unchanged hashes. Saved Woven Wrap proposals v1–v3, their raw outputs, source geometry/photo, generated preview, review history, stock and inventory are unchanged. Only project navigation selection changed during browser inspection. Audit: `data/phase6l-final-audit.json`.

## Exact Woven Wrap findings

| Version | Evidence and outcome |
| --- | --- |
| v1 `6af7ae465ce38497e465b510` | Legacy concept-only response supplied a 10 × 10 cm stitching square but no cutting instances. A documented uniform 0.5 cm offset would require an 11 × 11 cm cutting square; area alone does not establish fit in this irregular scrap. No historical geometry was replaced. |
| v2 `6af82aaf00afd61121236a59` | Raw candidate had width/height targets 30/60, no depth, a Main Wrap cut 10 × 40 cm quantity 1 and Accent Strip cut 5 × 5 cm quantity 2. Historical rejection: missing `overallDimensions.depth`; Phase 6K made candidate product targets independently optional without changing legacy design requirements. |
| v3 `6af83148f139873bec7d1b07` | Derived assessment retains the supplied geometry: **400 + 25 + 25 = 450 cm²**, exceeding the **162.045910493827 cm²** source. `REJECTED / FAIL`; independent geometry `NO_LAYOUT_FOUND / AREA_PRECHECK_FAILED`; zero placements. |

The excess comes from polygon dimensions and copy counts, not software-added allowances. Explicit cutting polygons were retained as-is. Positive seam allowances (0.5/0.2 cm), a 1 cm hem proposal and coincident stitching/cutting boundaries do not establish included finish geometry; no extra fabric was guessed. Width/height targets are product proposals, not source measurements or the basis of cutting demand.

Exact additional defects:

- `assembly[0].sides[1]`: `DISCONNECTED_EDGE_CHAIN`. Edges `[2,3]` use REVERSE, which requires decreasing contiguous indices (e.g. `[3,2]`). Software does not choose a seam direction for the designer.
- `materials[1].quantity.unit`: `BOM_UNIT_INVALID`. WOVEN_FABRIC quantity is `1 piece`; its required unit is `cm2`. No guessed area conversion is performed.
- Accent Strip copy 2 has no structured assembly reference. Copy 1 is attached to the Main Wrap; the intended second connection/separate use remains unresolved.
- Cutting and stitching rings coincide despite positive allowances; inclusion and actual finishing intent are unestablished.

Usable evidence: finite simple proposed cut/stitch polygons, explicit quantities, a valid thread requirement/estimate of required length, named relationships, fold intent and creative instructions. These can be preserved as proposals and diagnostics. They do not resolve excessive demand, missing connections or physical construction. A genuinely revised smaller/fewer-piece construction is required; old versions must not be silently scaled or declared successful.

## Generation changes

`src/services/candidatePrompt.js` now supplies one exact source-constraint summary: original polygon/holes in cm, net usable area, bounds, width/height, vertex/hole counts and bounding-box fill ratio. Bounds are explicitly not usable rectangular fabric. Source basis/version/hash and declared grain are distinguished from unknown physical accuracy, verified grain/material properties and stock.

The same `borsal.design-candidate/0.1` contract is retained. The compact instructions require:

- Proposed cutting/stitching geometry, quantities, allowance intent, material requirements and construction instructions.
- Sum of every copy's cutting area, including proposed allowances, within source area; this is necessary and never sufficient for fit.
- Compact arbitrary supported outlines suited to the actual boundary/holes; local piece origins need not match photo coordinates.
- Correct material units, no duplicate claim that the SCRAP fabric is an available STOCK material, valid named thread/assembly references and contiguous seam traversal.
- Connections or explicit unresolved/separate intent for physical copies, optional unknown depth, no fabricated stock/material/grain or construction verification.
- Preservation of the selected idea; any incompatible creative requirement must be disclosed for human review.

Saved failure feedback includes proposal/version/source provenance, bounded exact issue paths/messages, each supplied cutting copy's area/bounds, unreferenced copies, unresolved allowance intent, search limits and area failure. Invalid historical geometry is identified rather than assigned a fabricated area. Complete original evidence remains stored. No automatic retry, silent shape change or global-impossibility claim is added.

The review brief originally repeats identical text as prose, individual lines and shape intent. Only exact repetitions are omitted from the outgoing prompt; distinct creative requirements and immutable review records remain unchanged. The actual v3 revision request preflights at **15,570 bytes** against the unchanged conservative prompt/output allowance. A local request preview is saved at `data/phase6l-readiness-request.json`; it was not dispatched. Model, 6,144 output-token limit, 120-second timeout and atomic request accounting remain unchanged.

`technicalGeneration.js` retains existing source/review/version guards and saves the feedback proposal ID and selected revision approach in generation provenance. MOCK execution is explicitly labeled TEST_FIXTURE. Existing deterministic construction and independent bounded nesting run automatically after a schema-valid candidate; incomplete physical evidence does not prevent preliminary geometry assessment. Rejected raw output stays immutable.

## User workflow and live readiness

The current project remains on Woven Wrap v3 with its existing approval/source. The technical stage explains: **“The proposed cutting pieces require more fabric than is available.”** Its primary action is **Generate a Smaller Design**. The confirmation offers:

1. Smaller/fewer pieces, preserving the approved idea.
2. Different construction, preserving the approved idea.

The user sees one request, the actual model, remaining shared slots and conservative allocation hold. Source constraints and saved failure feedback are included automatically. No BOM IDs, quantities, vertices or JSON entry is required. The advanced editor remains optional. No concept is silently replaced or approved.

Next owner action: launch `npm run mvp`, open `http://127.0.0.1:5173`, reopen the existing Woven Wrap project, enter **Technical draft**, click **Generate a Smaller Design**, review the selected interpretation and confirm **exactly one request**. If the current dashboard attestation expires or free allocation is insufficient, use **AI availability & budget** to record a genuine current dashboard check first. No attestation was fabricated in this phase. A future result must still pass the same deterministic validation/nesting; this implementation does not establish improved live-model performance.

## Offline verification

- Focused: **29/29**, five files (`data/phase6l-focused.log`). Tests cover exact source/holes/bounds, saved 450 cm² failure feedback, copy-2 omission, area-sufficient unplaceable strip, smaller genuinely nesting candidate, unknown physical evidence, invalid seam/thread/copy references, malformed historic geometry, optional dimensions, lossless brief deduplication, immutable failed proposals and one mocked API dispatch.
- Full regression: **742/742**, 47 files (`data/phase6l-regression.log`); previous 729 tests unchanged.
- React production build passed (`data/phase6l-build.log`); existing nonblocking >500 kB bundle warning remains.
- Real-project readiness browser check passed at **1440 and 1920px**, with eight screenshots: `data/local-mvp/real-creation-check-1794652533470/`. Tested revision controls, both interpretation choices, modal, reload/resume, no technical data entry, no browser exceptions/overflow or generation dispatch. Selected screenshots visually inspected.
- Isolated mocked end-to-end browser flow passed at both sizes: `data/local-mvp/real-creation-check-1794652748904/`. New project → actual image multipart/calibration → explicit geometry confirmation → mocked ideas/image → explicit review → mocked candidate → automatic cutting/nesting SVG → results/reload. No raw engineering fields entered; production approval blocked and inventory unchanged.

Mocked browser candidate: **CONCEPT_ONLY / UNVERIFIED**, independent geometry **PASS / LAYOUT_FOUND**, 48 cm² utilized, **29.621235%** utilization. Artifacts in that directory: `cutting-pattern.svg`, `nesting-layout.svg`, `technical-report.json`, `raw-candidate.txt`, `report.json` and 28 screenshots. The separate API revision fixture uses a 12 cm² panel and also produces actual pattern/nesting SVGs. These are explicitly authored mock responses, not AI performance results or accepted Woven Wrap designs.

Remaining blockers: the saved real Woven Wrap still fails; no new live design exists yet. Prompt adherence is probabilistic. A bounded search failure does not prove all layouts/products impossible. Material/grain/stock, reliable woven/hem behavior, durability and physical accuracy still require genuine evidence. Geometry success never grants manufacturing approval or reserves inventory.
