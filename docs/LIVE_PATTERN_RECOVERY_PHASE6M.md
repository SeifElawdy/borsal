# Phase 6M — Saved LIVE candidate recovery

## Audit and scope

Phase 6L baseline **742/742** passed. Source, dependencies, secret and staged whitespace checks passed. Commit: `88134dd`, `feat: add geometry-aware design generation`. Current branch: `feature/live-pattern-recovery`; Phase 6M is uncommitted. No inference, paid services, inventory mutation, push or merge.

The owner made the latest LIVE request between phases. The current shared ledger is **17/20**, not 16/20. Campaign: `experiments/design-language/ai-spike/results/campaigns/mvp-technical-507a1d2a-79f4-4e01-a411-639df47f0cab/`. Historical response: HTTP 200, Llama 3.3 70B, finish `stop`, 804 completion tokens, no truncation. None of this is new inference performed in Phase 6M.

## Exact latest design and failures

Raw v4: `6af83c903c23be2cc6a70f04` (CONCEPT_ONLY). Original derived v5: `6af83c903c23be2cc6a70f06` (REJECTED / FAIL). The raw candidate is valid `borsal.design-candidate/0.1`; no JSON parsing or candidate-base-schema issue occurred.

Main Wrap: one 6 × 16 cm cutting rectangle = 96 cm², with a supplied 5 × 15 cm stitching rectangle, 0.5 cm allowance, 45° proposed local grain, 10° tolerance and allowed rotations **[0,90]**. Accent Strip: two 2 × 4 cm cuts = 16 cm² total, each with a supplied 1 × 3 cm stitching rectangle and 0.25 cm allowance. Demand **112 cm²**, source **162.045910493827 cm²**. This is a proposed design, not measured finished-product geometry.

| Exact path / evidence | Root cause and treatment |
| --- | --- |
| `assembly[0].sides[1]` | `DISCONNECTED_EDGE_CHAIN`: Accent Strip copy 1 requests edges `[0,1]` with REVERSE direction. The ordered sequence conflicts with the direction. Changing direction or reversing edge order are different possible corrections; geometry/prose does not uniquely choose one. Retain REJECTED; do not guess. |
| `technical.overallDimensions.depth` | Legacy design transport requires a numeric depth, but the candidate correctly omits it for an incompletely specified product. Kept absent and UNVERIFIED; never set to zero or derived from a flat outline. |
| `technical.bom[2].quantity` | Additional STOCK requirement named Main Fabric supplies material specs but no quantity object. It might be redundant with the SCRAP requirement, but deleting it or assigning its quantity would infer intent. Retain an explicit unresolved requirement. |
| `technical.patternPieces[1].grainDirectionDeg` | Accent Strip has no proposed grain direction. Do not copy the Main Wrap's 45° or invent source grain. |
| `GRAIN_TOLERANCE_REQUIRED`, instances `piece-2-1`, `piece-2-2` | The legacy drafting handoff requires tolerances for these copies. Missing tolerance/grain remains UNVERIFIED; preliminary geometric screening still runs. |
| Assembly prose | The instruction says a 2.5 cm seam allowance, while supplied geometric allowances are 0.5/0.25 cm. Selected seam paths also have 20 cm versus 4 cm total edge length; easing/gathering intent and assembled contact are not established. These are additional construction questions, not grounds to rewrite geometry or claim physical feasibility. |

Nesting **did run** in v5: 225 generated candidates, 165 tested, 60 duplicates skipped, 166 validator calls. Each tested Main Wrap placement was rejected for `OUTSIDE_FABRIC` and `FABRIC_BOUNDARY_INTERSECTION_OR_CONTACT`. Result: `NO_LAYOUT_FOUND / DISCRETE_CANDIDATES_EXHAUSTED`, no placements or valid partial layout, 0% utilized. This is **bounded-search uncertainty**, not an area failure or proof of global impossibility. The [0,90] rotation restriction is preserved. Missing material/grain did not prevent this assessment.

## Minimal deterministic recovery

Existing construction now has explicit, versioned opt-in policy `borsal.candidate-recovery/0.1`, selected by `normalizeEquivalent:true`. Legacy callers and constructor cache keys remain compatible when the flag is absent. No design schema or feasibility algorithm is weakened.

Only these transformations are supported:

- Exact finite `{x,y}` points, with no extra properties, become equivalent `[x,y]` tuples in supported point fields.
- A duplicated final point equal to the first is removed from an explicitly closed polygon; the geometric boundary is unchanged. References to a resulting invalid/degenerate edge remain invalid.
- A missing copy reference becomes 1 only when its named piece resolves uniquely and explicitly has quantity 1. Multiple copies, absent/ambiguous piece names and missing geometry remain blockers.
- Existing constructor ID, unit and demand calculations continue unchanged.

No seam direction/order, dimensions, allowance, material quantity, grain, stock or rotation restriction is guessed. Raw equivalent-but-schema-rejected model output retains its original rejection. With explicit recovery enabled, a separate derived version can normalize and assess it. A mocked future-output API test proves this yields actual cutting/nesting SVGs while preserving raw text. Invalid geometry and non-equivalent representations stay rejected.

The actual latest Woven Wrap already uses canonical arrays and explicit copies: **no equivalent normalization applies**. Consequently recovery cannot resolve its genuine design contradictions or placement failure.

## Actual offline API outcome

The existing protected local construct endpoint was called with parent v4, expected review 1, technical version 5, `EXPLICIT_ONLY`, and `normalizeEquivalent:true`. HTTP **201** appended derived v6 **`6af84063a099af451e4b4969`**. Browser replay returned **200** with the same v6 and no duplicate history. Original v1–v5, raw model responses, source/reviews and preview remain unchanged.

Outcome: **REJECTED / FAIL** for ambiguous seam traversal; independent geometry **UNVERIFIED / NO_LAYOUT_FOUND**, reason `DISCRETE_CANDIDATES_EXHAUSTED`. Demand remains 112 cm², tested placements 165, accepted placements **0**, utilization **0%**. No nesting SVG exists; no successful or manufacturing-approved real pattern has been recovered.

Local artifacts:

- `data/phase6m-live-recovery/api-response.json`
- `data/phase6m-live-recovery/summary.json`
- `data/phase6m-live-recovery/diagnostic-pattern.svg` — actual proposed cutting/stitching/fold geometry, marked REJECTED / FAIL; not a placed layout or approved cutting instruction.

## UI and verification

Saved candidate recovery is accessible from a derived failure through its original raw parent, without version-ID entry. It requires explicit zero-call confirmation. Failed technical proposals mark **both Technical draft and Pattern & nesting FAILED**, even when a diagnostic SVG exists. Raw/incomplete candidates and unplaced nonfailed assessments stay UNVERIFIED. Missing material/number/grain messages now explain the actual uncertainty rather than presenting raw Zod type errors. Users may request a different construction explicitly; no provider call occurs on navigation/reload.

- Focused: **42/42**, six files (`data/phase6m-focused.log`). Exact saved response; optional dimensions; grain uncertainty; immutable API recovery/replay; equivalent point/closure/copy handling; invalid geometry; ambiguous seams; positive candidate-to-pattern/nesting; failed workflow states.
- Full final regression: **754/754**, 50 files (`data/phase6m-regression-final.log`); previous 742 tests unchanged. An earlier run overlapped a UI helper edit and saw the new test with a cached older module export; the stable final run is authoritative. No test was weakened.
- Frontend production build passed (`data/phase6m-build.log`); existing nonblocking >500 kB bundle warning remains.
- Actual USER workspace browser smoke passed at **1440/1920px**: `data/local-mvp/real-creation-check-1794654560896/`, six screenshots and `report.json`. Checked zero-call reprocessing, replay/no duplicate version, backward navigation, visible FAILED stage states, no engineering data entry, unchanged inventory/budget, no browser exceptions/overflow. Screenshots visually inspected. Command: `node scripts/check-real-creation.cjs --live-recovery=6af83c903c23be2cc6a70f04`.

Preservation audit: `data/phase6m-final-audit.json`. All **119** pre-existing campaign/ledger files have unchanged hashes; original proposals, source snapshot/photo, generated image, reviews and inventory are unchanged. Only the requested v6, run technical history/version and project navigation were appended/updated. Server restored in normal USER mode at `http://127.0.0.1:5173` (`npm run mvp`). Shared ledger remains **17/20**, zero Phase 6M requests.

## Shortest next action

This saved design cannot be turned into a validated layout by equivalent normalization. The smallest next design action is one explicitly owner-authorized **Try a Different Construction** request, preserving Woven Wrap intent and including existing failure feedback: propose a more compact/narrower cutting design under the source boundary, unambiguous connected seam intent, consistent allowance instructions, and an explicit quantity or stated removal of the redundant material requirement. Do not require the ordinary user to supply vertices, BOM IDs or seam indices. No such inference was performed here. Physical material/grain, drape, strength, stock and construction remain independently UNVERIFIED even if a future layout passes.
