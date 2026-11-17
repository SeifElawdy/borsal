# Phase 6J — Autonomous candidate and pattern construction

Phase 6I passed **694/694 baseline tests**, secret/dependency and staged whitespace checks, then was committed as **`44106d6`**, `feat: activate real AI creation MVP`. Current branch: **`feature/autonomous-design-generation`**. Phase 6J is uncommitted; no push/merge or Cloudflare inference occurred.

## Actual Woven Wrap diagnosis

The saved LIVE campaign is `experiments/design-language/ai-spike/results/campaigns/mvp-technical-494da51b-9af5-4ab5-a3a4-dc501b06b2eb/`; inspect `raw-response.txt`, `proposal.json` and `response.json`. Parent proposal: **`6af7ae465ce38497e465b510`**. HTTP 200, finish reason `stop`, **580 completion tokens**, 4,460 total tokens, 222.25765991210938 reported Neurons; not truncated. These are historical figures, not new usage.

The response was valid JSON and schema-valid legacy design data, **CONCEPT_ONLY—not a Zod-rejected proposal**. Its exact unresolved requirements were:

- `context.instances`: `EXPLICIT_CUTTING_INSTANCE_REQUIRED`, `piece-1`, copy 1. Only the stitching outline was supplied.
- `context.fabric.grainDirectionDeg`: `FABRIC_GRAIN_REQUIRED`.
- `context.fabric.material`: `FABRIC_MATERIAL_SPECIFICATIONS_REQUIRED`.

The stitching polygon is `[10,10] → [20,10] → [20,20] → [10,20]`, a 10×10 cm square. The scalar proposed allowance is 0.5 cm; SCRAP demand was 100 cm², which does not account for a new outward cutting allowance. The stated 30×20×1 cm product target is not established by this square. Assembly and folds are empty; fold/tie/finish methods and the creative “intricate weave” feature are not technically engineered. COTTON/PLAIN/200 GSM is a proposed requirement, not an independently inspected source fact. No thread operation or missing attachment point was fabricated to fill these gaps.

### Explicit local recovery

A new, recorded **uniform convex miter allowance** assumption permits an 11×11 cm cutting polygon `[9.5,9.5] → [20.5,9.5] → [20.5,20.5] → [9.5,20.5]`. Its computed fabric demand is **121 cm²**. Original geometry, target dimensions, 100 cm² demand and raw response remain unchanged in the parent.

The existing nester tried **100 candidates**, rotations 0/90/180/270°, grid steps 2/1/0.5 cm, within limits 5,000 candidates and 100 backtracks. Result: **NO_LAYOUT_FOUND / DISCRETE_CANDIDATES_EXHAUSTED** on the original irregular 162.045910493827 cm² polygon. Area sufficiency did not prove fit. No global impossibility or manufacturing approval is asserted; a genuinely revised design requires a separately authorized proposal.

Offline recovery artifacts: **`data/phase6j-woven-recovery/report.json`**, **`data/phase6j-woven-recovery/pattern.svg`**. This analysis did **not** append a version to the real user project. The UI can explicitly append a source-linked DERIVED version through the protected local construction route. Original source photo and saved illustrative preview remain untouched.

## Implemented workflow

**Approved concept → one AI candidate request → raw MODEL_OUTPUT version → local deterministic construction → new DERIVED version → existing validation/bridge/nesting → SVG, requirements and proposed instructions.**

The existing technical-generation route accepts `strategy: "CANDIDATE"`; LEGACY remains backward-compatible. The compact `borsal.design-candidate/0.1` contract uses unique natural-language piece/material labels, arbitrary explicit polygons, quantities, optional uniform convex allowance policy, proposed material requirements, named assembly intent, instructions and limitations. AI may propose engineering; it must not invent actual source properties, available stock, receipts or physical tests. Invalid output is preserved as rejected; no automatic repair, retry or fallback inference follows it.

`src/services/designCandidate.js` validates candidates and constructs existing `borsal.design/0.1` data. It assigns internal piece/component/material/edge/operation IDs and copy references, converts explicit mm geometry to cm without rounding, computes cutting area, and optionally estimates thread from an explicitly proposed perimeter multiplier/tail rule. Required stock stays NOT_CHECKED, never AVAILABLE. Missing source material/grain does not prevent independent preliminary geometry assessment.

Only explicit cutting/stitching geometry or an explicit uniform convex miter policy is used. Concave cutting outlines are supported; concave offsets, sharp/collinear offset corners, curves, stock-cut patterns and differing legacy copy outlines require explicit supported geometry/new proposals. No stitching outline is inferred from cutting, no finished dimensions from cutting bounds, and no fold/tie construction is invented. Existing polygon, bridge, containment, precheck and nesting checks remain authoritative; assembly reference/chain errors, outside anchors/folds, invalid polygons and numeric overflow fail explicitly. Proven excess cutting area retains FAIL; bounded search exhaustion remains uncertain.

`src/services/designConstruction.js` appends versions through the existing proposal transaction, checking source/review hashes, parent ownership and technical versions. DERIVED provenance records parent ID/input/raw hashes, constructor policy, assumptions, calculations and instructions. Forged DERIVED imports are blocked. Duplicate construction is idempotent; concurrent requests cannot create duplicate children/history. A legacy proposal cannot silently bind to another scrap.

## User experience and APIs

- **Create Product Design** is primary; expert/import tools are collapsed. The confirmation explains one AI call followed by zero-call local construction/evaluation. Routine review rationale/brief is prefilled from the selected concept and explicitly adopted by the human; approval remains an explicit decision.
- **Assess saved proposal locally · 0 AI calls** offers recorded supported derivation of existing outputs. **Propose a new product design** requests a separate authorized attempt with concise current validation/nesting feedback. Stale evidence is not rebound or reused as current feedback.
- Optional Unknown/Yes/No stretch/accessory answers are append-only **USER_DECLARED_UNVERIFIED** observations. They do not modify fabric properties, verify stock, trigger inference or authorize reservations. Only matching source/concept observations inform a future candidate request.
- Missing physical information has readable explanations and an evidence-review action, rather than directing ordinary users into ID/coordinate forms. Patterns, nesting, material demand, proposed assembly instructions and version history remain visual and source-linked.
- Existing preview generation can use the derived cutting outlines, intended assembly, requirements and actual source appearance. It remains a separate explicitly confirmed request labeled ILLUSTRATIVE_AI_PREVIEW. Existing imagery is never regenerated automatically; exact texture/construction fidelity is not claimed.

Existing generation: `POST /api/concept-runs/:runId/concepts/:conceptId/technical-proposals/generate` with current review/technical versions, `strategy: "CANDIDATE"`, optional current `feedbackFromProposalId`, and the existing campaign/session/Origin/project/source/idempotency/one-call safeguards.

Local construction: `POST /ui/projects/:projectId/runs/:runId/concepts/:conceptId/proposals/:parentId/construct` with `expectedReviewVersion`, `expectedTechnicalVersion`, `allowancePolicy: "EXPLICIT_ONLY" | "UNIFORM_CONVEX_MITER"`.

Optional answers: `POST /ui/projects/:projectId/observations` with `expectedVersion`, `runId`, `conceptId`, `stretch` and `accessory` (UNKNOWN/YES/NO). No new feasibility engine, dependency or inventory workflow was introduced.

## Actual verification

**27/27 focused tests passed. Full regression: 721/721, 43 files, 154.41 seconds; all 694 previous tests unchanged.** Coverage includes actual saved Woven Wrap, complete/incomplete candidates, concave geometry, unit normalization, material/thread demand, bad references/anchors/folds, source mismatch, malformed output preservation, parent provenance, concurrent/idempotent construction, unverified answers and area failure. React production build passed; Vite retains a non-blocking >500 kB bundle warning.

Actual Edge/CDP browser checks passed at **1440px and 1920px**, using isolated mocked providers and real local API/DB/geometry/SVG paths: new project, upload/detection/confirmation, two new concepts, preview, prefilled human review, **Create Product Design**, automatic raw/derived versions, pattern/nesting, proposed manufacturing instructions, optional Unknown answers, reload/resume and blocked production approval. **No BOM IDs, vertices, stitching IDs, JSON or long review text were typed.** No console errors, overflow, unreadable small text or bright panels; reduced-motion mode checked.

Evidence directory: **`data/local-mvp/real-creation-check-1794620898778/`** — `report.json`, `technical-report.json`, `raw-candidate.txt`, `cutting-pattern.svg`, `nesting-layout.svg`, and **28 screenshots** (`1440-*`, `1920-*`), visually inspected. This is clearly labeled TEST_FIXTURE, not real AI performance. Reproduce with `npm run mvp -- --mock`, then `node scripts/check-real-creation.cjs --autonomous`.

The mock proposal produced two 6×4 cm cutting panels, **48 cm²** demand, **LAYOUT_FOUND**, **29.621235% utilization**, and **114.045910 cm²** remaining. It has proposed separate stitching, a three-sided seam, internally consistent thread/copy/edge references and an estimated thread requirement. Geometry passes; overall **CONCEPT_ONLY / UNVERIFIED** because source grain/material and genuine stock remain unknown. Prototype/production approval was not faked; no inventory reservation occurred.

## Delivery and limitations

Launch normally with **`npm run mvp`** at **http://127.0.0.1:5173**; the original USER workspace is restored. Current shared ledger is **15/20**, five remaining, read from existing accounting—not assumed from Phase 6I's older count. **ZERO Cloudflare calls during this phase**; campaign locks/counters/results, live source records, original imagery and proposal/review history are preserved. No billing activation or budget reset.

Final audit: all **101** prior campaign/ledger files unchanged; hashes of all **10** existing user-record collections unchanged; original photo and illustrative preview bytes unchanged. Secret, dependency and whitespace checks passed. Audit evidence: `data/phase6j-final-audit.json`.

New prompt quality has not been evaluated live by instruction. A future owner-confirmed candidate request is the next real test. Woven Wrap's present geometry has no found layout; a revised proposal must preserve its creative requirements while proposing a workable size/construction. Physical calibration accuracy, material/grain, real stock, finish/tie/attachment behavior, strength and human manufacturing review remain genuinely unverified. No full manufacturing engine or approval is claimed.
