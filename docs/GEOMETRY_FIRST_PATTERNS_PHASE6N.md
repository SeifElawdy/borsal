# Phase 6N — Geometry-first pattern alternatives

## Audit and original evidence

Phase 6M baseline **754/754** passed; source, dependency, secret and staged whitespace checks passed. Committed as **`3545541`**, `feat: recover live technical proposals`. Branch: `feature/geometry-first-pattern-generation`. Phase 6N remains uncommitted. No Cloudflare inference, paid services, real inventory writes, push or merge.

The current real ledger is **18/20** (two remaining). The owner generated another LIVE candidate between phases. Campaign: `experiments/design-language/ai-spike/results/campaigns/mvp-technical-d65c60f4-e84e-4f0a-afe3-6e406cd1afcb/`. Original raw v7 and rejected derived v8 are preserved. V8 ID: `6af84660a099af451e4b496e`.

All four saved MODEL_OUTPUT proposals were reassessed read-only using existing construction (`data/phase6n-candidate-audit.json`): v1 lacks explicit cutting geometry; v2 demands 450 cm² and fails area/BOM/seam checks; v4 demands 112 cm² but exhausts discrete placements and has a disconnected seam; latest v7 demands 274.057098765432 cm² and fails area/seam checks.

### Exact latest failure

- Main cutting ring: `[17.041666666666664,8.569444444444443] → [28.430555555555557,8.569444444444443] → [28.430555555555557,31.930555555555543] → [17.041666666666664,31.930555555555543]`. This is the **bounding rectangle**, not the irregular fabric: **11.388888888889 × 23.361111111111 cm = 266.057098765432 cm²**.
- Tie ring: `[[20,10],[22,10],[22,12],[20,12]]`, 4 cm², **two** copies. Total **266.057098765432 + 8 = 274.057098765432 cm²**, versus **162.045910493827 cm²** usable fabric.
- Cutting and stitching rings coincide despite positive proposed allowances (main 0.5 cm, ties 0.2 cm). Inclusion flags do not independently establish adequate finishing geometry.
- `assembly[0].sides[1]`: `DISCONNECTED_EDGE_CHAIN`, edges `[2,3]` with REVERSE; order/direction conflict. No historical seam is silently corrected.
- Only tie copy 1 has a structured attachment; copy 2 connection and weaving intent are incomplete.
- Main proposed grain is 45°, tolerance 10°, rotations [0,90]. Tie grain/tolerances and actual fabric grain remain unknown. Finished depth remains absent; proposed width/height are not verified finished measurements.
- Latest nesting result: **`NO_LAYOUT_FOUND / AREA_PRECHECK_FAILED`**, zero placements and zero tested placement candidates. This design fails the necessary area condition. It does not establish that every different construction is impossible.

## Implemented strategy

`src/services/geometryPlanner.js` introduces one bounded construction layer, **not a second validator**. It consumes approved concept intent and an existing candidate's arbitrary component-shape hypotheses. Future candidate prompting now explicitly treats shapes as hypotheses; deterministic construction/nesting determines spatial support.

The planner explores explicit **new alternatives**, default scales `[0.6,0.5,0.4,0.3]`, stopping after two supported options. At most six configured dimension hypotheses, three returned alternatives and the existing per-layout 5,000-candidate/100-backtrack limits apply. Counts and supplied grain/rotation constraints are preserved. No fixed bag template or product category geometry is selected.

Explicit distinct cutting/stitching polygons, including concave shapes, can be scaled together. For coincident/missing cutting boundaries with a supplied stitching outline and allowance, the planner proposes a **new uniform convex miter allowance** using the existing offset helper. Unsupported concave offsets are not guessed. Every copy's actual cutting area is counted before nesting; oversized demand is rejected early. Existing constructor, polygon/hole/contact/collision validators and bounded nesting independently assess every proposed layout.

This intentionally changes proposed dimensions and allowances as **new engineering assumptions**, never as a correction to the rejected response. The original snapshot, raw model output, shapes and assembly references remain unchanged. Model-required material specifications remain targets, not source facts. The new alternative uses one SCRAP requirement, rather than carrying a second woven-fabric STOCK declaration. Thread, when required by the seed, is estimated under the explicit new rule: twice all supplied stitching perimeters plus 20 cm tail. Required thread is never assumed available.

The supported construction rule is **separate component edge finishing**. Supplied/generated stitching perimeters yield deterministic piece/copy/edge references and finishing instructions. Old invalid joining seams, folds and attachment claims are **not reused**. Interlacing, intricate weaving, wrapping, tying, wearability and physically assembled connections remain explicitly **UNVERIFIED**. No claim is made that disconnected geometric pieces establish a functioning woven product.

The new `ENGINE_DERIVED` origin is backward-compatible with existing proposal versions. Server-only derivation guards prevent a client from forging it. Selection uses the existing transactional proposal/history writer, source/review/version checks, replay handling and SVG renderer. Source, concept and parent lineage plus assumptions, finishing paths and PARTIAL creative coverage are persisted. Nesting SVG metadata now hashes the actual preliminary report when that is its evidence basis.

## Actual Woven Wrap alternatives

Pure offline evaluation used the original saved source polygon and exact latest LIVE component shapes. The following are **new engine studies**, not successful repairs to v8:

| Alternative | Cutting area | Search result | Placed cuts | Utilization | Overall readiness |
| --- | ---: | --- | ---: | ---: | --- |
| Scale 0.6, new explicit allowances | 112.79775555555548 cm² | NO_LAYOUT_FOUND / DISCRETE_CANDIDATES_EXHAUSTED; 144 placements tested | 0 | 0% | UNVERIFIED; no global impossibility claim |
| Scale 0.5, new explicit allowances | **78.331774691358 cm²** | **LAYOUT_FOUND / GEOMETRY PASS**, 248 placements tested | **3** | **48.33924808879518%** | CONCEPT_ONLY / UNVERIFIED |
| Scale 0.4, new explicit allowances | **50.13233580246914 cm²** | **LAYOUT_FOUND / GEOMETRY PASS**, 47 placements tested | **3** | **30.937118776828914%** | CONCEPT_ONLY / UNVERIFIED |

Option 1 cutting bounds are approximately **6.19444 × 12.18056 cm** for the main piece and **1.2 × 1.2 cm** for each tie. Proposed allowances are 0.25 cm / 0.1 cm. These do not establish finished wearable dimensions. All three actual placements, rotations and transformed polygons are recorded in the validator evidence; their positions are not manually authored.

Preserved creatively: selected Woven Wrap reference, main/tie component roles, arbitrary supplied silhouette hypotheses, explicit grain targets and interest in wrapping/weaving. **Not established:** the intricate weave, original finished size, hair-fit/function, folds, attachment locations, drape, strength or manufacturing feasibility. Selection explicitly acknowledges this partial interpretation.

## Real local API and guided UI

Protected endpoint:

`POST /ui/projects/:projectId/runs/:id/concepts/:conceptId/geometry-plan`

`EXPLORE` takes the current expected review/technical versions and saved parent ID, performs local planning, and writes no proposals. `SELECT` requires the returned alternative key and `acceptCreativeLimitations:true`; it saves a new immutable ENGINE_DERIVED version. Replay does not duplicate history. Foreign/stale source/review/plan references are rejected.

The primary button is **Create Product Design · 0 AI calls**. It shows real cutting options, actual area/utilization, separate geometric and physical verdicts, and search evidence. Users select an option through a clear limitations dialog; no vertices, IDs, quantities, sewing indices or JSON entry. Automatic handoff opens pattern/nesting. Technical design stays **UNVERIFIED** for PARTIAL engine coverage; successfully evaluated nesting can be completed independently. Missing physical grain/dimensions route to evidence review rather than requiring another AI request. Invalid designs remain FAILED.

Current limitation: the planner needs saved, structurally interpretable component outlines and explicit construction constraints. It cannot derive arbitrary product geometry solely from unconstrained creative prose. It does not yet independently synthesize a verified woven assembly, optimize globally or certify practical minimum dimensions.

## Reproducible isolated demonstration

No tests wrote to the user's project. The API suite and browser demo use new test-suffixed databases, the saved Woven intent and original polygon as **TEST_FIXTURE** evidence. Simulated approval/confirmation is visibly fixture-only, not real measurements or inventory.

```powershell
node scripts/local-mvp.js --mock --geometry-first
node scripts/check-real-creation.cjs --geometry-first
node scripts/geometry-first-demo.cjs --export
```

The launcher seeds offline through MOCK/service fixtures only; it does not invoke inference endpoints. The browser exercises actual local planning/selection APIs, renders the real engine SVGs, reloads/resumes and verifies source/history/inventory/budget preservation. The demo export reads only localhost. An earlier proposed inference-shaped demo was rejected by automatic safety review and replaced with this offline-only path; no rejected action was executed.

Selected isolated proposal: **`6af84c526d2c5d9ceac76767`**, version 3, origin ENGINE_DERIVED, **CONCEPT_ONLY / UNVERIFIED**, independent geometry **PASS**. Actual artifacts:

- `data/phase6n-demo/proposal.json` — source-linked proposal, placements, evidence and assumptions.
- `data/phase6n-demo/cutting-pattern.svg`
- `data/phase6n-demo/nesting-layout.svg`
- `data/phase6n-demo/bom.json`
- `data/phase6n-demo/assembly.json` — proposed finishing paths/instructions; weaving explicitly unverified.
- `data/phase6n-geometry-plan/offline-plan.json` — both alternatives and bounded failures.
- `data/local-mvp/real-creation-check-1794657456561/` — browser report and screenshots at 1440/1920px. Selected screenshots visually inspected.

## Verification and remaining blockers

- Focused: **23/23**, four files (`data/phase6n-focused.log`). Exact latest failure, original irregular source, area/shape failure distinction, valid alternatives, concave outlines/holes, grain constraints, invalid geometry/seams, unsupported offsets/weaving, bounded determinism, protected API exploration/selection, immutable history/replay, SVG provenance and stage semantics.
- Full final regression: **766/766**, 52 files (`data/phase6n-regression-final.log`). Previous 754 tests unchanged; one new presentation-state test was added. An earlier run overlapped that UI edit and used the old module snapshot; the final stable result is authoritative.
- Frontend production build passed (`data/phase6n-build.log`); existing nonblocking >500 kB bundle warning remains.
- Desktop browser flow passed at 1440/1920px: actual options → explicit human fixture selection → ENGINE_DERIVED pattern/nesting → reload. No engineering fields, browser exceptions, overflow, source/history/inventory mutations or provider calls.
- Real shared ledger remains **18/20**. All **129** existing campaign files, raw proposals, reviews, source geometry/photo, generated preview and real inventory are unchanged (`data/phase6n-final-audit.json`).

The first useful **geometry-assessed concept-to-cutting-study** path now works locally without another inference. This is not a verified woven product or manufacturing approval. The shortest next action is to open the existing Woven Wrap project at `http://127.0.0.1:5173` (`npm run mvp`), choose **Technical draft → Create Product Design**, review the new compact options and explicitly select one. That owner action can append a real ENGINE_DERIVED version; it was not performed on the user's records during tests. Next engineering work is a supported assembly/connection plan and physical prototype evidence; genuine source material/grain and stock are still required before production readiness or reservations.
