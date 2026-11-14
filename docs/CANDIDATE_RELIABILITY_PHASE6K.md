# Phase 6K — Candidate validation and offline recovery

## Audit and scope

Phase 6J baseline: 721 tests passed. Intended Phase 6J source/tests/docs were audited and committed as `b32ef5d` (`feat: automate technical design construction`). Current branch: `feature/candidate-reliability-fix`. Phase 6K is uncommitted. No Cloudflare requests, inventory mutations, dependency changes, push or merge.

## Exact saved failure and correction

Saved Woven Wrap v2: `6af82aaf00afd61121236a59`, campaign `mvp-technical-bee4ea2a-209f-4b75-a7f7-7fea0d363432`. The original rejection had one candidate-schema issue: `overallDimensions.depth`, expected number, received undefined. Its raw JSON supplies width 30 and height 60, with no depth. A flat/incomplete product target does not justify inventing thickness.

Candidate `overallDimensions` now permits independently optional positive finite width/height/depth. Unknown values remain absent; zero is rejected. The legacy `borsal.design/0.1` contract remains unchanged and strict. Constructor policy is versioned `borsal.draft-constructor/0.2`; historical failed derivations cannot suppress the corrected assessment.

Other optional fields were checked: an optional material requirement must be complete if supplied; optional quantities still require a positive value and correct type-dependent unit. Copy counts remain positive integers. Supplied points, folds, references and thread estimates retain their validation. Missing allowance-inclusion evidence stays absent/UNVERIFIED. No coordinates, quantities, stock or physical facts are repaired or invented.

Shared precheck rules now also catch BOM-unit and seam-chain defects when incomplete dimensions prevent legacy schema refinements from running. Existing containment semantics allow a supplied stitching boundary to coincide with its cutting boundary without falsely labeling it outside; this does not establish allowance adequacy.

## Actual saved-candidate recovery

The protected local API reprocessed v2 offline with `EXPLICIT_ONLY`, expected review version 1 and technical version 2:

`POST /ui/projects/6af7a8de5ce38497e465b509/runs/6af7aa765ce38497e465b50d/concepts/8229bad3-ece9-4710-a168-46af2c958061/proposals/6af82aaf00afd61121236a59/construct`

HTTP **201** appended DERIVED v3 `6af83148f139873bec7d1b07`. Repeating through the browser returned **200** with the same version, not a duplicate. Parent v2 and original raw output are unchanged. Depth remains absent. Outcome: **REJECTED / FAIL**, with independent **PRELIMINARY GEOMETRY ONLY: FAIL**:

| Evidence | Actual finding |
| --- | --- |
| `assembly[0].sides[1]` | `DISCONNECTED_EDGE_CHAIN`: edge sequence `[2,3]` uses REVERSE traversal, which requires decreasing contiguous indices. No order was silently changed. |
| `materials[1].quantity.unit` | `BOM_UNIT_INVALID`: WOVEN_FABRIC requires `cm2`; raw value is `piece`. Its quantity was not reinterpreted. |
| Cutting geometry | Main Wrap 10 × 40 cm, one copy: 400 cm². Accent Strip 5 × 5 cm, two copies: 50 cm². Total 450 cm² against 162.045910493827 cm² usable source area. |
| Nesting | `NO_LAYOUT_FOUND / AREA_PRECHECK_FAILED`, zero placements. This supplied design fails the necessary area condition; no global impossibility claim about other designs is made. |
| Construction | Cutting and stitching boundaries coincide despite positive allowances; inclusion is unspecified. Only Accent Strip copy 1 has an attachment operation. Copy 2 attachment and physically supported finished construction remain unresolved. |
| Physical readiness | Grain/material/stock/physical evidence remains unknown. Geometry failure is evaluated independently, not hidden behind those unknowns. |

Artifacts (local, ignored):

- `data/phase6k-woven-recovery/api-response.json`
- `data/phase6k-woven-recovery/summary.json`
- `data/phase6k-woven-recovery/diagnostic-pattern.svg` — diagnostic cutting preview only, not an approved pattern.

No nesting SVG was produced for Woven Wrap because no layout exists for the supplied demand. A new design is required, rather than data-entry recovery: the smallest next action is an explicitly authorized revised proposal with fewer/smaller pieces, correct fabric-area units, connected seam traversal and complete allowance/attachment intent. No such inference was executed.

## Workflow and verification

Normal users can choose **Reprocess saved candidate · 0 AI calls**. The UI explains actual area failure and does not demand depth, BOM IDs, vertices or JSON. Detailed developer paths remain collapsed. Generated candidate SVGs use readable piece labels; missing product targets display UNVERIFIED. Expert controls remain optional.

- Focused regression: **67/67**, five files. New tests cover exact saved v2, omitted/partial/complete dimensions, legacy strictness, invalid dimensions/polygons, missing pieces, contradictory references, units, boundary stitching, immutable API version append, replay and stale-review rejection.
- Full regression: **729/729**, 45 files; previous 721 tests unchanged. Log: `data/phase6k-regression.log`.
- React production build passed; existing nonblocking >500 kB bundle warning remains. Log: `data/phase6k-build.log`.
- Real saved-recovery browser flow passed at 1440px and 1920px: `data/local-mvp/real-creation-check-1794650793159/` (six screenshots and report). Version replay, unchanged parent, no developer fields, no browser exceptions or overflow verified.
- Isolated `--mock --flat` browser workflow passed at both widths: `data/local-mvp/real-creation-check-1794651026276/` (28 screenshots, cutting/nesting SVGs and technical report). Raw and derived dimensions have width/height only. Independent geometry **PASS / LAYOUT_FOUND**, 48 cm² demand, 29.621235% utilization. Overall remains **CONCEPT_ONLY / UNVERIFIED** because physical facts are missing. No raw technical fields were entered. Production approval stayed blocked; inventory unchanged. This mock proves the local workflow, not AI performance or manufacturing feasibility.
- Pattern and failure screenshots were visually inspected. Browser checks covered reduced motion, readable controls and absence of overflow. Commands: `node scripts/check-real-creation.cjs --saved-recovery=6af82aaf00afd61121236a59`; isolated fixture: `node scripts/local-mvp.js --mock --flat`, then `node scripts/check-real-creation.cjs --autonomous`.

## Preservation and remaining limits

Normal USER workspace restored at `http://127.0.0.1:5173` (`npm run mvp`). Current shared ledger **16/20**; zero new inference calls. All 109 pre-existing campaign/ledger artifact hashes, source-photo bytes, generated-preview bytes, original proposals, reviews, stock and inventory remain unchanged. Only the requested new derived proposal, its run history/version and project navigation selection were appended/updated. Mock tests changed no real workspace records. Audit: `data/phase6k-final-audit.json`.

The depth contract defect is fixed; Woven Wrap is not recovered into a successful product design. Material-unit/assembly errors, excessive cutting demand and unresolved construction intent are substantive. No automatic scaling, unit guessing, manufacturing approval or inventory reservation is performed. Physical measurements and construction still require independent evidence.
