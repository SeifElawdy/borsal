# Phase 6B: persistent technical design API

## Audit and result

Phase 6A security/diff/isolation audit and **605/605 baseline tests** passed (31 files, 98.68s). Only its nine intended source/test/demo/documentation files were committed as **a621928**, `feat: integrate persistent AI concept flow`. This phase remains on **feature/mvp-design-flow**, uncommitted. **Zero Cloudflare requests**: imported MODEL_OUTPUT data is submitted JSON, never an inference trigger.

The backend now persists approved-concept technical proposals and versions, evaluates them through the existing 5E handoff / 5B drafting / 5A bridge / Phase 4D nesting-precheck chain, and serves the stored SVG and feasibility report. No geometry/nesting algorithm was duplicated, no stock was reserved and no manufacturing approval was added.

Files: `src/models/TechnicalProposal.js`, `src/services/technicalFlow.js`, additions to `src/routes/concepts.js`, `src/routes/technicalProposals.test.js`, and `experiments/mvp-design-flow/{technical-fixture,technical-demo}.js`. Original design schemas and feasibility engines are unchanged.

## Local endpoints

The existing **BORSAL_MVP_DESIGN_FLOW=1 + loopback socket** gate covers all new routes; they are disabled by default. No public/proxied unauthenticated deployment is supported. Use only isolated demo/test DBs until authentication/deployment hardening is explicitly scoped.

| Method/path | Result |
| --- | --- |
| POST `/api/concept-runs/:runId/concepts/:conceptId/technical-proposals` | 201 with immutable proposal version, assessment, full feasibility evidence when evaluable, SVG and provenance |
| GET same path | All stored versions in ascending order |
| GET `/api/technical-proposals/:proposalId` | Full persisted proposal/report plus current sourceStale flag |
| GET `/api/technical-proposals/:proposalId/preview.svg` | Stored SVG, or 404 PREVIEW_NOT_AVAILABLE; CSP/nosniff/no-store headers |

Submission body:

```json
{
  "expectedReviewVersion": 1,
  "expectedTechnicalVersion": 0,
  "origin": "AUTHORED",
  "sourceLabel": "Explicit authored technical input",
  "proposal": {
    "design": { "path": "my-explicit-source", "data": "EXPLICIT borsal.design/0.1 OBJECT HERE" },
    "context": { "instances": [], "stockBindings": {} }
  }
}
```

The string above is explanatory notation, not a ready technical design. Use the saved **authored-request.json** below for an actually runnable full request. `proposal` can be omitted/empty: that records CONCEPT_ONLY rather than generating missing data. For `origin: "MODEL_OUTPUT"`, supply **rawProposalText** containing that proposal object instead, and omit `proposal`. Raw text is preserved exactly; invalid JSON is saved as a REJECTED version with technical errors. There is no repair/fallback/model call.

The inner proposal reuses the existing 5B design wrapper and 5A context (instances, explicit stock snapshot/bindings/search), with **fabric overrides prohibited**. Server-controlled status/version/SVG/provenance fields are rejected. Malformed inner technical data is persisted as REJECTED, not silently fixed. Missing data remains CONCEPT_ONLY/UNVERIFIED.

### Source IDs and material declarations

The API binds the engine scrap ID to **`fabric-<fabricObjectId>`**, also returned in run.sources[0].id. The design's scrapSources and SCRAP BOM must explicitly use this alias. This corrects the earlier full-handoff mapping gap: raw MongoDB IDs can begin with digits and therefore cannot satisfy the legacy design ID grammar. Submitted pattern/BOM references are never silently rewritten. The real FabricPiece ID remains separately persisted.

Optional **proposal.fabricMaterialDeclaration**:

```json
{
  "basis": "SYNTHETIC_FIXTURE",
  "material": { "type": "WOVEN_FABRIC", "specs": { "fiber": "COTTON", "weave": "PLAIN", "weightGsm": 200 } }
}
```

This example is an **explicit synthetic test declaration**, not measured properties of the saved burgundy fabric. The other allowed basis is USER_DECLARED_UNVERIFIED. The server never derives this field from a BOM or fills it automatically. Without it, unknown fabric material remains unknown and the existing bridge may remain CONCEPT_ONLY. Existing declared grain/geometry revision/confirmation come from the actual fabric record. Provided stock quantities are only supplied snapshots. No source/inventory record is modified by technical submission.

Material matching can PASS structurally against the explicit declaration; physical/material truth is still UNVERIFIED in the separate evidence layer, and manufacturingVerified remains false. Do not use a synthetic declaration to claim real source properties.

## Approval, versions and provenance

Latest review must be APPROVED_FOR_DRAFTING, its version must match, and the current fabric source hash must match the generation snapshot. Missing approval, stale review/source or stale expectedTechnicalVersion returns 409 without creating a proposal. A reviewer-authored drafting brief is still required by the existing handoff; otherwise the result remains CONCEPT_ONLY.

Each version is a separate immutable TechnicalProposal document: exact original input/raw text, origin/source label, input/raw hashes, actual fabric/photo/analysis source snapshot, concept/review hashes, review version, detailed errors, feasibility report, SVG and SVG SHA-256. SVG metadata additionally links proposal ID/version and source hashes. MODEL_OUTPUT previews are labeled imported model proposals, not manually authored designs. No model-authorship claim is independently authenticated.

Proposal insertion and ConceptRun technical version/history append occur in **one MongoDB transaction**. Concurrent same-version submissions yield one 201 and one 409; failures roll back both writes. Driver transaction retries perform deterministic local validation only, never inference. Prior review/raw/proposal versions remain unchanged. Fabric reads are snapshot-based: later cross-document source changes mark old reports stale and block new submissions, not retroactively erase history or establish an atomic manufacturing/inventory approval.

## Actual complete API demo

```powershell
node experiments/mvp-design-flow/technical-demo.js data/my-new-technical-demo
```

This script forces MOCK generation, clears live enablement, creates a new UUID **-test** DB and uploads, and uses actual multipart HTTP for `data/test-mat40.png`. It explicitly declares synthetic grain, confirms only the synthetic source geometry through the existing confirmation endpoint, creates a matching **authored pocket concept**, then explicitly records a SYNTHETIC_DEMO_ONLY approval. **No saved live concept is approved.**

Actual retained demo: **data/mvp-technical-flow-6b-001/**:

- `authored-request.json`: exact runnable complete POST body.
- `transcript.json`: actual HTTP paths, JSON requests, status codes and responses.
- `complete-proposal.json`: persisted version-1 feasibility/provenance/report.
- `preview.svg`: actual SVG retrieved through the API; rasterized and visually inspected.
- `summary.json`, `registration.json`, original uploaded image and local `preview-check.png` inspection raster.

Actual sequence: registration **201**, synthetic geometry confirmation **200**, unapproved technical submission **409**, explicit synthetic concept review **200**, technical proposal **201**, SVG **200**, list/detail GET **200**. Complete proposal is **CHECKED / UNVERIFIED**, geometry **PASS**, **LAYOUT_FOUND** with two explicitly authored 6 x 4 cm cuts. Utilized area approximately **48 cm2**, remaining **114.04591049382694 cm2**, utilization **29.621235027605696%**. Construction and physical evidence remain UNVERIFIED. The fixture does not define a full bag or physically approved accessory.

Version 2 is **CONCEPT_ONLY** (no technical data); version 3 is **REJECTED** (malformed imported JSON). Both are preserved with their errors/unknowns; prior version-1 evidence remains unchanged. Fabric availability remains AVAILABLE and its original photo exists.

Reopen this isolated demo, with live generation disabled:

```powershell
node experiments/mvp-design-flow/serve.js borsal-mvp-demo-19e3f981-c13c-41ab-8fd3-19334c0d76c5-test
curl.exe http://127.0.0.1:3001/api/technical-proposals/6af71abf4d70edcb21e24d82
curl.exe http://127.0.0.1:3001/api/technical-proposals/6af71abf4d70edcb21e24d82/preview.svg -o data/my-downloaded-preview.svg
curl.exe http://127.0.0.1:3001/api/concept-runs/6af71abf4d70edcb21e24d81/concepts/841637d7-bcbb-480c-9101-c2bfcd788a2a/technical-proposals
```

To replay a version-1 POST, use a fresh approved synthetic run and bind authored-request.json to its explicit source alias. Reusing expectedTechnicalVersion=0 on this already-versioned demo correctly returns 409; it must not overwrite version 1. Full exact executed POSTs/responses are in transcript.json.

## Saved live concepts and next action

See **[LIVE_CONCEPTS_REVIEW_PHASE6B.md](LIVE_CONCEPTS_REVIEW_PHASE6B.md)** for the three original live concepts with exact IDs, descriptions, feature/accessory intent, model-listed unknowns, additional review needs and source references. They remain pending/unapproved in the saved evidence; no geometry, measurements, stock or design approval were invented for them.

Next human action: select one concept, author an explicit review/drafting brief and provide independently supplied technical geometry/requirements. Full source-dependent feasibility needs confirmed/current geometry and explicit material/grain/stock evidence. Saved live fabric remains DRAFT: current staleness guards reject silently rebasing concepts after a source change. Source refresh/re-review must be explicit; no automatic inference or quota consumption is necessary or authorized here. Manufacturing/physical testing and public/authenticated deployment remain outside this phase.

## Verification

New technical API tests: **11/11 passed**; combined technical/concept API focused run: **29/29 passed**, two files, **29.67 seconds**. An initial test-client SVG text/byte parsing mismatch was corrected without changing validation. Tests cover full source-linked nesting/SVG flow, version immutability/imported raw bytes, incomplete/rejected cases, approval/source/version guards, 201/409 concurrency, transaction rollback, stock shortages, protected server fields and local enablement. Full regression and final artifact preservation checks are recorded below after execution.

Final regression: `npm test -- --reporter=dot` — **616/616 tests passed**, **32/32 files**, **127.87 seconds**. All 605 prior tests remain unchanged. `git diff --check` passed; intended source/docs scanned without environment-secret or private-key matches. Generated demo files and regression logs remain ignored under `data/`.

All 73 existing AI campaign/result files retain the original aggregate SHA-256 `a0bf8e8b527b493450cce5bc3a203a82c77e6edbdac7de85aa7b7b46cf0c7608`. No Cloudflare requests, ledger changes (still **11/12**), previous-artifact edits, production/inventory mutations, Phase 6B commit, push or merge occurred.
