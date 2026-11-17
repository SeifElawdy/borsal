# Phase 6O — Product construction and creative fidelity

## Audit and scope

Phase 6N baseline: **766/766** passed. Source, dependencies, secrets and staged whitespace were audited. An explicit 16-file allowlist was committed as **`bcd9842`**, `feat: add geometry-first autonomous pattern generation`. Current branch: `feature/product-construction-fidelity`. Phase 6O is uncommitted; no push or merge.

The owner selected real ENGINE_DERIVED v9 between phases: **`6af882270fb443ab509f1ddc`**. This assessment reads that saved evidence; it does not change its geometry, original report, approval, preview or proposal history. Current shared ledger: **18/20**. ZERO Phase 6O Cloudflare requests, image regeneration or inventory mutations.

## What the selected Woven Wrap actually supports

The approved intent is a versatile fabric wrap for hair styling/fashion, with an intricate weave. Its explicit unresolved requirement already asks for fold/tie methods and fabric weight/drape. Approval for drafting did not establish those facts.

| Piece | Cutting bounds | Supplied engineering | Actual unresolved function |
| --- | --- | --- | --- |
| Main piece | **6.19444 × 12.18056 cm**, 75.45177 cm² | Proposed stitching rectangle and 0.25 cm allowance | Generic BODY/shape label does not define how it becomes a wearable wrap, folds, interlaces, closes or fits. |
| Tie piece, copy 1 | **1.2 × 1.2 cm**, 1.44 cm² | Proposed stitching rectangle and 0.1 cm allowance | No tie length, joining operation, interlacing path or justified separate role. A small square is not evidence of a functioning tie. |
| Tie piece, copy 2 | **1.2 × 1.2 cm**, 1.44 cm² | Same proposed finishing geometry | Same missing role/connection; copy count alone does not establish an assembly. |

All three cuts nest on the original irregular source: **78.331774691358 cm²**, **48.33924808879518%** utilization, independent geometry PASS. This proves only the supplied cutting layout fits the recorded polygon.

The proposed technical `assembly` list is **empty**; both pattern `folds` lists are empty. Finishing paths are labeled `PROPOSED_EDGE_FINISH_ONLY`. Perimeter stitching does not determine a hem/binding/fray-control method or connect components. The 105.5 cm cotton-thread demand is an engine estimate, not available stock or a physically verified consumption measurement. Cotton/plain/200 gsm is a proposed material target, not measured source material.

**Conclusion:** the existing alternative does not establish the intended wearable wrap/weave function. There is insufficient engineering information to claim it genuinely works, or to prove every future wrap construction impossible. No missing fold, weave, attachment, size or material fact was invented to produce PASS.

## Construction-fidelity assessment

`src/services/constructionFidelity.js` is a read-only evidence adapter around existing design contracts and `experiments/pattern-feasibility/precheck.js`. It expands existing copy/edge references into the same precheck instance convention and reuses its geometry revalidation, seam-chain/thread/copy/anchor checks. It does not implement a second assembly or geometry validator.

The precheck can structurally accept an empty assembly list. The new product-level summary explicitly distinguishes that from a meaningful connection, role, finish or creative implementation. It records per piece:

- Declared/generic product role; generated BODY roles and labels are not treated as engineered function.
- Supported reference declarations versus absent connections or unexplained standalone use.
- An explicitly supplied proposed hem versus a bare stitching path or absent finishing information.
- Creative relationship as an unresolved requirement; textual similarity never proves technical coverage.

For valid supplied supported operations, proposed instructions are generated from the existing source references. For a supplied hem, instructions point to its declared axis/allowance and stitching path. Such instructions remain proposals, not physical validation. Contradictory references produce `INVALID_CONSTRUCTION` and no repaired joining instruction. Unsupported weaving/folds remain UNVERIFIED. The Woven Wrap currently receives only source-linked **proposed perimeter-finishing instructions**, not a fabricated woven assembly plan.

The response separately exposes **`GEOMETRY_PASS`**, **`CONSTRUCTION_UNVERIFIED`**, **`CREATIVE_COVERAGE_PARTIAL`**, existing precheck evidence and actionable blockers. A source-linked SVG schematic annotates per-piece role, connection, finish and cutting bounds; it is explicitly **not assembled geometry** or a finished-product preview.

New ENGINE_DERIVED versions retain the assessment in their immutable report. Existing versions are assessed on demand without rewriting them. Safe incomplete/invalid input handling never fills missing quantities or measurements.

The existing bridge's curve boundary is preserved: unsupported curved stitching returns `EXPLICIT_CURVE_REPRESENTATION_REQUIRED`. No curve flattening, edge remapping or derived sewing instruction is performed for it.

## Actual API and preview reconciliation

Read-only endpoint:

`GET /ui/projects/:projectId/runs/:id/concepts/:conceptId/proposals/:proposalId/construction`

The existing loopback/Host/project ownership controls apply. Current source/review changes are surfaced as stale, while historical evidence remains inspectable. Local photo paths, credentials and operator secrets are not returned by the new report.

Actual v9 call returned **HTTP 200**: GEOMETRY_PASS / CONSTRUCTION_UNVERIFIED / CREATIVE_COVERAGE_PARTIAL, three pieces, three missing role declarations, three missing connection/standalone explanations and three unspecified finishing methods. Generic creative/physical implementation requirements remain unresolved. Source/review for v9 is current; physical evidence is still unknown.

Saved image: `data/creation-previews/6af7a8de5ce38497e465b509/e940d093-e026-4f94-a97e-28d65dd70830.jpg`, model FLUX.2 Klein 4B. Its metadata has review version **0**, no proposal ID/version/hash, and a prompt with `technical:null`; v9 uses review version **1**. Source/concept hashes match, but the image is **not technically version-linked**.

Visual inspection of the actual saved image shows a folded/layered textile form, rounded-looking thickness and textured surface. The pattern contains no engineered fold/layering/interlacing or edge-finish construction supporting that appearance. No scale, fabric fiber, stretch, thickness or actual weave can be measured or verified from this illustration. The image does not independently prove the concept's intricate weave either. The report/UI therefore says **ILLUSTRATIVE_AI_PREVIEW**, historical review association and **visual fidelity UNVERIFIED**, even when hashes match. No additional provider inference or regeneration was called.

Local immutable-evidence exports:

- `data/phase6o-assessment/api-report.json` — actual v9 HTTP report.
- `data/phase6o-assessment/construction-evidence.svg` — new evidence annotation only.
- `data/phase6o-assessment/cutting-pattern.svg` — copy of saved v9 SVG.
- `data/phase6o-assessment/nesting-layout.svg` — copy of saved v9 nesting SVG.

## User experience and next decisions

The Technical Workspace now shows **What this design actually supports**, per-piece roles/connections/finishes, plain-English blockers, proposed instructions and an expandable evidence schematic alongside the pattern/nesting workflow. Saved preview associations are displayed honestly. Ordinary users do not enter IDs, polygons, sewing indices or JSON. The concept-direction action only navigates to explicit review; it never changes approval automatically.

The smallest meaningful next decision is the intended function:

1. **Keep a wearable woven wrap:** define the intended wearing/closure form, viable strip/tie dimensions, interlacing topology, joining locations, assembly sequence and edge finish. These require a new source-linked engineering proposal and later physical testing; the current three pieces do not supply that plan.
2. **Explicitly approve a smaller decorative textile accent/study:** reduced dimensions may suit that interpretation, but its role and attachment still need engineering. This changes the creative goal and must go through human concept review; it is not silently substituted.

Either path still needs independently established material/grain/physical accuracy, genuine stock and prototype/construction evidence before production readiness. Merely nesting again or regenerating the same illustrative image does not close these gaps. The MVP now exposes the product-construction gap; it does **not yet deliver a coherent, manufacturing-ready Woven Wrap**.

## Verification

- Focused: **17/17**, four files (`data/phase6o-focused.log`). Valid supported assemblies and declared hems; missing roles; unsupported weaving/folds/curves; contradictory connections/copy/thread references; geometry-valid but concept-incomplete designs; incomplete material input; preview/version association; read-only reports, ownership and stale-source checks.
- Frontend production build passed (`data/phase6o-build.log`); existing nonblocking >500 kB bundle warning remains.
- Isolated API fixtures use unique test-suffixed databases and mocked/no external inference; existing user records and real stock are untouched.
- Desktop browser flow passed at **1440px and 1920px** using offline `--mock --geometry-first` fixtures: actual selection → construction summary → evidence schematic → pattern/nesting → reload. **14 screenshots**, no console errors or overflow, no technical data entry, unchanged fixture source/history/inventory and isolated ledger **0/20**. Paths: `data/local-mvp/real-creation-check-1794672614531/`; selected screenshots visually inspected. Commands: `node scripts/local-mvp.js --mock --geometry-first`, then `node scripts/check-real-creation.cjs --geometry-first`.
- Full final regression: **776/776**, 54 files (`data/phase6o-regression-verified.log`), previous 766 tests unchanged. Earlier runs encountered unchanged five-second timeouts in the concurrent-refresh test and, after the curve addition, a photo-analysis test. Their unmodified files passed **10/10** and **8/8** in isolation; the final full run with the dev server stopped passed. No timeout, threshold or test was weakened. Logs: `data/phase6o-concurrency-recheck.log`, `data/phase6o-vision-recheck.log`.

Normal local launch remains `npm run mvp`, `http://127.0.0.1:5173`. The restored USER workspace displays assessments through a read-only GET; all original campaigns, preview bytes, proposals, source and inventory remain preserved. Final preservation/security audit: `data/phase6o-final-audit.json`.
