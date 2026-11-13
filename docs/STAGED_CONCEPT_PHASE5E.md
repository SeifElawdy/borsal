# Phase 5E: concept generation and explicit review

## Baseline and audit

Phase 5D audit found only its intended bounded-generator source/tests, provider diagnostics and documentation: nine files. Credential/private-key, whitespace and isolated-test-database checks passed. All **66 existing campaign/budget artifact files** matched the prior audit digest; none were staged. Full baseline: **566/566 passed**, 29 files, **90.70 seconds**. Staged diff checks passed. Phase 5D alone was committed as **c02f721**, `feat: add bounded live pattern generation experiment`; work moved to **feature/staged-concept-review**. Phase 5E remains uncommitted.

The preceding live response demonstrated that valid JSON and a short completed response do not establish a defined product or valid technical geometry. This phase separates creative intent, explicit review and subsequent technical drafting. It does not repair that response or change any prior model output, schema, provider default, campaign lock or request count.

## Files and workflow

New files under `experiments/staged-concept/`:

- `schema.js`: compact strict creative contract and separate review contract.
- `workflow.js`: source/prompt context, one-shot mock generation, raw assessment, review binding and existing 5B handoff.
- `examples.js`: explicitly authored offline concept/review fixtures, not live AI results or real user approvals.
- `run.js`: offline demo, assessment and review CLI; optional fresh-directory artifact saving.
- `workflow.test.js`: concept, gate, integrity, handoff, mock and CLI tests.

The generator uses the existing provider's `generate(messages)` interface and generation-setting metadata; it adds no SDK or HTTP implementation. **Only MOCK providers may execute here.** A LIVE provider is rejected before its generate/transport method runs. The CLI has no live option, credentials loading, shared-budget operation, retries or repair loop. The current provider can be used only after a separately reviewed future live integration; this phase does not enable one.

## Compact creative contract

`schemaVersion: "borsal.creative-concept/0.1"`:

| Field | Required content |
| --- | --- |
| id | Existing lowercase ID convention |
| productIdea | Nonempty name and description of one product idea |
| intendedUse | Specific intended use as text |
| distinctiveFeatures | Nonempty list of unique IDs and creative descriptions |
| sourceReferences | Nonempty list of unique known source IDs |
| constraints | Nonempty textual constraints |
| unresolvedRequirements | Nonempty unique IDs, descriptions and informative neededInformation lists |

No category or product-template collection is imposed. Bag-only legacy categories are not part of this stage. The strict contract rejects numeric measurement/quantity fields, cutting geometry, stock/material-property objects, extra keys and model-authored review decisions. Free text is still untrusted: structural validation cannot prove originality, usefulness, honest constraints or the absence of an unsupported factual claim inside prose. Human review must assess those aspects; no language-based auto-approval heuristic is introduced.

The prompt asks for a specific useful small fabric-appropriate idea and distinctive features, with unknowns made explicit. It includes the original **74-point synthetic burgundy polygon**, recorded provenance and computed source area approximately **162.045910493827 cm2** as context, not as a verified physical measurement. Fiber, weave, weight, grain, strength, stock and actual construction/scale accuracy remain unknown. Source IDs are resolved to snapshots and SHA-256 hashes by the host; the model need not fabricate file hashes.

## Assessment and review boundary

Raw text is preserved exactly and JSON is parsed without fence removal, repairs or normalization of the saved proposal. A valid concept is **CONCEPT_ONLY / UNVERIFIED**, pending review. Missing required fields produce actionable INCOMPLETE status, also CONCEPT_ONLY. Malformed/contradictory data is REJECTED. No assessment automatically creates a review or a technical pattern.

Review is a **separate explicit input** containing:

- `decision`: APPROVED_FOR_DRAFTING, REVISE or REJECTED.
- `reviewer` and nonempty `rationale`.
- `proposalSha256`: SHA-256 of the exact raw UTF-8 proposal, including whitespace.
- `sourceHashes`: exact source-ID/hash map matching the current source snapshots; source hashes use JSON.stringify of source data.
- Optional `draftingBrief`: a separately supplied reviewer-authored `borsal.manual-concept/0.1` brief for the existing 5B boundary.

The review snapshot itself is hashed. A changed proposal (even whitespace), changed geometry/source data, missing source hash, incomplete concept or invalid review blocks the gate. A model's own decision field is rejected by the concept schema. Reviewer identity is **declared, not authenticated or cryptographically attested**; this offline module adds no authentication. Hash binding checks consistency, not truth or authority.

| Decision | Effect |
| --- | --- |
| APPROVED_FOR_DRAFTING | Allows a drafting handoff only; concept itself stays UNVERIFIED, with manufacturingVerified=false |
| REVISE | Retains proposal/reason and blocks drafting |
| REJECTED | Retains proposal/reason; REJECTED/FAIL and no drafting |

Existing rejected technical results remain rejected; approving a separate creative idea never overwrites a technical rejection or implies fabric fit, stock availability or manufacturing suitability.

## Minimal technical handoff

An approved concept can hand off through the unchanged 5B `draft()` only when an explicit **reviewer-authored drafting brief** is supplied. This avoids mislabeling model text as HUMAN-authored just to fit the existing manual-concept contract. The source proposal, its unresolved requirements and raw hash remain separate from the human review brief and review hash. Approval without that brief reports REVIEWER_AUTHORED_DRAFTING_BRIEF_REQUIRED, not an invented brief.

The handoff contains the exact 5B request, source-proposal/review hashes and unresolved creative requirements. Its source path links to the review hash; the existing 5B report snapshots the supplied human brief. Known geometry/source snapshots remain in the outer provenance. They are not silently promoted to confirmed fabric or used to create cutting patterns. Technical `design` and `context` can be supplied explicitly by a later caller; the existing drafting/5A/4D workflow remains the validation authority.

With no supplied design, dimensions, cutting polygons, seams, assembly or BOM, 5B correctly returns **CONCEPT_ONLY**, empty cutting pieces and EXPLICIT_TECHNICAL_DESIGN_REQUIRED. No technical-generation request, pattern drafting, material assignment, offset or stock selection occurs automatically. The unresolved creative ledger survives handoff; no assertion is made that future technical data realizes it completely.

## Reproduce offline

```powershell
node experiments/staged-concept/run.js --demo
node experiments/staged-concept/run.js --demo data/my-new-concept-demo
node experiments/staged-concept/run.js --assess path/to/raw-concept.txt
node experiments/staged-concept/run.js --review path/to/raw-concept.txt path/to/review.json data/my-new-reviewed-concept
npx vitest run experiments/staged-concept experiments/technical-drafting experiments/design-feasibility --reporter=dot
npm test -- --reporter=dot
```

Output directories must be new and their parent must exist; all writes are exclusive, refusing overwrite. Files per case are `<id>-raw.txt`, optional `<id>-review.json`, and `<id>-report.json`, preserving generation metadata, raw output, review, source snapshots/hashes and handoff. No file is modified automatically by the assessment/review functions. CLI stdout is a concise summary. Single assess/review commands exit 2 FAIL/rejected or 3 UNVERIFIED; a successfully executed mixed demo exits 0. There is no route from `--live` to inference.

Actual local demo artifacts are under ignored **`data/staged-concept-review-5e-001/`**. In particular:

- `approved-raw.txt`, `approved-review.json`, `approved-report.json`.
- `revise-*` and `rejected-*` proposal/review/report records.
- `incomplete-*` and `malformed-*` raw/report records.

All examples and review decisions are **explicitly authored OFFLINE MOCK fixtures**. OFFLINE_DEMO_REVIEWER does not represent real owner approval, AI quality or user acceptance. No stock, physical product or material-property verification was created.

| Demo concept/case | Review and handoff outcome |
| --- | --- |
| Burgundy Petal Cable Nest | Soft petal-like tabs intended to cradle a coiled cable; simulated APPROVED_FOR_DRAFTING; existing 5B returns CONCEPT_ONLY because no technical design exists |
| Folded Leaf Bookmark Beacon | Layered leaf-like page-corner marker; simulated REVISE and separate REJECTED examples, neither handed off |
| Incomplete Petal Cable Nest | intendedUse absent; INCOMPLETE / CONCEPT_ONLY; cannot be approved |
| Malformed concept | Extra cuttingPolygonCm rejected; no approval/handoff |

Retention, edge finish, material response and physical sizing remain unresolved even for the simulated approved idea. No dimensions, cutting coordinates or manufactured accessory are claimed by these creative descriptions.

## Tests and limitations

New concept/review tests: **21/21 passed**. Combined concept/drafting/bridge focused tests: **66/66 passed**, three files, **14.00 seconds**. A new prompt-test assertion was corrected to match the actual lowercase invariant text; no existing assertion or validation threshold was weakened. Tests cover explicit review decisions, raw/source hash binding, stale/incomplete/invalid approval rejection, non-bag ideas, forbidden technical fields, source references, unknowns, reviewer brief provenance, missing-geometry handoff, supplied technical-data delegation, detached snapshots, mock failure/no retry, real-provider execution disabled and CLI artifact/overwrite protection.

Full regression and final preservation checks are recorded below after execution. Remaining limits: structural validity does not establish creative quality or truth; declared reviewer identity is unauthenticated; downstream schemas still require separate explicit technical inputs and evidence. No live model quality, material behavior, physical accuracy, nesting or manufacturing success is established by the concept mock demos. No next phase is started.

### Final actual verification

Full regression: **587/587 passed**, 30 files, **97.75 seconds**, including all 566 baseline tests unchanged. Expected injected persistence-failure logs appeared in existing API tests; no tests failed. Credential/whitespace checks of all six new files and `git diff --check` passed. All **66 existing live campaign/budget artifact hashes remain unchanged**; shared request usage remains **10/12**. New demo artifacts are ignored under `data/` and actual requests for this task are **zero**. Existing production files, dependencies, original schemas and validators have no diff. HEAD remains **c02f721** on `feature/staged-concept-review`; no Phase 5E commit, push or merge was performed. No implementation blocker remains for this offline scope; technical geometry, real source measurements and engineering review remain intentionally unresolved.
