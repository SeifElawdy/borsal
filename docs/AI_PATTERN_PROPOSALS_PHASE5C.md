# Phase 5C: offline AI-pattern proposal intake

## Baseline and audit

Phase 5B audit found exactly its five intended source/test files and documentation. Original saved inputs/reports and the complete SVG reproduced exactly from source; the SVG rasterized successfully to a 38,203-byte PNG buffer. The preview had already been visually inspected in Phase 5B. Its labels, source hashes and distinct cutting/stitching styles were retained. Generated artifacts remain ignored under `data/` and were not staged.

Credential/private-key, whitespace and test-database isolation checks passed. Full baseline: **515/515 tests passed**, 26 files, **84.10 seconds**. Staged diff checks passed; only Phase 5B was committed as **5ecd1f8**, `feat: add technical pattern drafting`. Work then moved to **feature/ai-pattern-proposals**. Phase 5C remains uncommitted.

## Scope and files

This is an OFFLINE intake boundary for future AI-generated technical proposals. It performs **zero inference**, repair, network, database, production API or inventory operations. No new dependency, original contract, model output or existing validator was changed. Matching hashes do not establish authorship, engineering truth or manufacturing approval.

New files under `experiments/ai-pattern-proposals/`:

- `adapter.js`: versioned envelope, provenance integrity checks and unchanged 5B handoff.
- `examples.js`: original source-linked 8B/70B concepts and explicitly manual technical fixtures.
- `run.js`: JSON-file/demo CLI with complete structured JSON output.
- `adapter.test.js`: focused integrity, readiness, rejection, feasibility and CLI tests.

## Input contract

Use `schemaVersion: "borsal.ai-pattern-proposal/0.1"`:

| Field | Meaning |
| --- | --- |
| sourceConcept | Existing 5B source wrapper: declared path and `borsal.concept/0.1` or `borsal.manual-concept/0.1` data |
| proposal.design | Optional existing 5B design wrapper: declared path and explicit `borsal.design/0.1` data |
| proposal.context | Optional existing 5A/5B context: supplied fabric geometry/confirmation/revision/material/grain, explicit cutting instances, allowance declarations, grain tolerance/rotation constraints, stock snapshot/bindings and bounded search settings |
| provenance.origin | CONCEPT_ONLY, MANUAL_FIXTURE or SAVED_AI_OUTPUT |
| provenance.sourcePath | Nonblank declared source reference; no automatic filesystem lookup |
| provenance.conceptSha256 | SHA-256 of `JSON.stringify(raw sourceConcept)`, UTF-8 |
| provenance.proposalSha256 | SHA-256 of `JSON.stringify(raw proposal ?? null)`, UTF-8 |
| provenance.modelId / campaignId | Both required for SAVED_AI_OUTPUT; prohibited for manual/concept-only intake attribution |

The `proposal` object is optional; an absent proposal hashes as JSON `null`. CONCEPT_ONLY origin cannot claim a supplied technical proposal. Known envelope fields are strict; malformed hashes, contradictory attribution and unknown fields are rejected before drafting. The exported `fingerprint(value)` helper computes the documented object hash. Hashes are key-order-sensitive JSON payload checks, **not original file/response-byte hashes**, digital signatures or trusted model provenance.

Original concept campaign/response hashes remain separately preserved inside the source concept snapshot. A future proposal may interpret an earlier concept, so its declared model/campaign need not be the same as that concept's original campaign. Model attribution is marked NOT_INDEPENDENTLY_VERIFIED. No HTTP status, token count, Neuron consumption or successful model performance is fabricated; `liveInferencePerformed` is always false.

## Validation and handoff

1. Validate the envelope and existing concept/manual-source contract.
2. Hash original supplied source/proposal objects before schema trimming/defaults; reject mismatches and unserializable payloads before any drafting handoff. Retain detached snapshots and the declared provenance.
3. Pass the original concept, design and context values unchanged to 5B. Do not create missing geometry, design dimensions, allowance offsets, material quantities, stock references or attachment points.
4. Existing 5B/5A schemas and polygon utilities validate technical data and references before complete proposals reach the unchanged Phase 4D pipeline. Missing fields remain actionable unresolved items; known contradictions fail. The adapter does not duplicate the technical/geometry algorithms.
5. Preserve 5B readiness status, verdict, errors, unresolved paths, source-linked geometry/SVG and complete nested 5A/4D evidence. Preserve the original concept's brief, requirement ledger, connections and limitations independently of the technical result.

All creative review stays **UNVERIFIED**, including a model's self-declared CLAIMED coverage. A limitations ledger cannot prove no original requirements were omitted. Existing incomplete-input limitations remain: some cross-reference refinements cannot run until missing structural fields are supplied; these proposals never receive a feasibility PASS or an assertion that full validation occurred.

## Results

- **REJECTED / FAIL:** malformed envelope/provenance, hash mismatch, invalid supplied technical schema/units/dimensions, invalid polygons or known broken/impossible references. No repair or silent numerical transformation occurs.
- **CONCEPT_ONLY / UNVERIFIED:** valid concept or incomplete/unrepresentable technical proposal. Missing dimensions, cutting copies, allowance/grain, stock or attachment coordinates remain unresolved; no absent pattern is generated.
- **CHECKED:** the existing drafting/feasibility workflow ran; its PASS/FAIL/UNVERIFIED verdict is preserved. A necessary area failure or insufficient supplied stock can be checked FAIL. Bounded NO_LAYOUT_FOUND remains unresolved, not global impossibility.

Every report states `manufacturingVerified: false`. The existing pipeline's physical-evidence layer remains UNVERIFIED; a successful geometric layout never validates printing/measurement accuracy, adequate seam width, assembled strap/closure behavior, fabric strength, stock freshness or a complete manufacturing process. Source/scalar allowance/stock declarations remain untrusted offline inputs.

## Reproduce

```powershell
node experiments/ai-pattern-proposals/run.js --demo
node experiments/ai-pattern-proposals/run.js path/to/proposal-request.json
npx vitest run experiments/ai-pattern-proposals experiments/technical-drafting experiments/design-feasibility experiments/pattern-feasibility --reporter=dot
npm test -- --reporter=dot
```

The CLI prints full JSON to stdout; it does not write or overwrite artifacts. Single-request exit codes: 0 PASS, 2 FAIL/rejected, 3 UNVERIFIED/concept-only; malformed CLI/file/JSON uses 1. The mixed demo exits 0 when execution succeeds, not because all cases pass. Source/proposal snapshots are intentionally included for review, so inputs must not contain credentials or private material intended to be excluded from reports.

## Actual demo outcomes

| Case | Status / verdict | Evidence |
| --- | --- | --- |
| concept-eight-b | CONCEPT_ONLY / UNVERIFIED | Original concept and provenance retained; technical design missing; all four creative requirements remain unresolved |
| concept-seventy-b | CONCEPT_ONLY / UNVERIFIED | Same boundary for the original 70B concept; no new inference or pattern reconstruction |
| complete | CHECKED / UNVERIFIED | Explicit manual accessory proposal; geometry PASS, physical/construction evidence UNVERIFIED |
| incomplete | CONCEPT_ONLY / UNVERIFIED | Missing authored dimensions, allowance scalar and one grain tolerance |
| invalid | REJECTED / FAIL | Self-intersecting supplied cutting polygon |
| insufficient-fabric | CHECKED / FAIL | Two explicit 6 x 4 cm cuts require 48 cm2; supplied 7 x 5 cm fabric has 35 cm2; AREA_PRECHECK_FAILED, no global impossibility claim |
| insufficient-material | CHECKED / FAIL | Geometry PASS; explicit thread demand 200 cm exceeds supplied synthetic stock 10 cm |
| invalid-reference | REJECTED / FAIL | Unknown stitching-edge reference; no correction |

The manual complete proposal reuses the explicitly authored Phase 5B two-panel accessory pocket against the labeled synthetic burgundy fabric fixture. Its cutting/stitching geometry, 0.5 cm declared allowance, grain, BOM, stock and construction limitations are unchanged. It is not output from either tested AI model. Fabric/material shortage cases are explicit mathematical/stock fixture edits, not real inventory mutations. Original concepts and saved model responses remain unchanged.

Tests additionally submit the saved initial 8B/70B technical proposals from the existing safe fixtures with their corresponding concept/model/campaign attribution. Both remain rejected by existing validation; they are not silently repaired or used to infer attachment geometry. These tests do not establish improved AI generation quality.

## Verification and remaining limits

New adapter tests: **18/18 passed**. Coverage includes both source-linked concepts, original malformed AI proposals, explicit manual geometry, missing fields, hash/attribution failures before handoff, unsupported creative claims, malformed dimensions/units/anchors, cyclic payload rejection, insufficient fabric/material, bounded search, unchanged source data, detached snapshots, deterministic network-free execution and actual CLI exit codes.

There is no new model, prompt, campaign, request budget or lock manipulation. Physical feasibility, creative fidelity and authenticated model/stock provenance still require independent review. No future phase or live inference is started by this adapter.

Final combined adapter/drafting/bridge/Phase 4 focused suite: **200/200 passed**, seven files, **25.20 seconds**. Full regression: **533/533 passed**, 27 files, **86.66 seconds**, including all 515 baseline tests unchanged. Expected injected persistence-failure logs appeared in the existing API failure-path tests; there were no failed tests. `git diff --check` and separate credential/whitespace checks of all five new files passed. Existing tracked source, schemas, fixtures, dependencies, production code and configuration have no diff. HEAD remains the Phase 5B commit on `feature/ai-pattern-proposals`; no Phase 5C commit, push or merge was performed. No implementation blocker remains for this offline scope.
