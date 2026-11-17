# Phase 3C: calibration semantics and confirmation audit

> Historical audit below is retained as evidence. The **Confirmation safety fix** section at the end supersedes its old historical-confirmation and conflict-response behavior.

## Scope and outcome

Read AGENTS.md, Phase 3A/3B documentation, the model, confirmation/reanalysis routes, polygon/homography utilities and existing tests. No proven calibration mapping/metadata defect was found; **no production code, stored values or historical data were changed** in Phase 3C. Added focused characterization/regression coverage and this audit report. Physical accuracy remains unverified. No Cloudflare, frontend, manufacturing engine, dependencies, commit, push or merge.

The actual HTTP exercise used a new UUID-suffixed test database and a new loopback server on an OS-assigned port, separate from the existing server and inventory. Only that test database was connected and subsequently dropped; the real database/sample was never queried or modified. The original data/test-mat40.png remains unchanged. Test snapshots and new uploaded files remain locally under ignored data/.

## 40 cm versus 4 cm: no mapping defect

- Existing legacy markerSizeCm describes the side of the four-point reference square passed to computeScaleInfo, which constructs destination corners (0,0), (S,0), (S,S), (0,S).
- Automatic large registration supplies the four *detected marker centers* as the legacy markerCornersPx compatibility field. Their physical reference side is 40 cm, so analysis.markerSizeCm=40 is correct.
- calibrationEvidence.profile.markerSizeCm=4 is the actual printed fiducial's outer width; profile.spanCm=40 is center spacing. The known page is 50 x 50 cm. These are three distinct quantities, not inconsistent duplicates.
- The automatic detector also retains each observed tag's four corners, IDs, center positions, physical profile and homography in evidence. Confirmation copies the same evidence and compatibility fields into geometry.basis; archives retain them.
- Changing the legacy compatibility size from 40 to 4 while retaining center-square coordinates would shrink calculated lengths tenfold and areas one hundredfold. No rename, migration, remapping or historical rewrite is justified. New readers should use the explicit profile/evidence fields and calibrationSource rather than infer tag size from the legacy field.

## Existing confirmation rules inspected

POST /api/fabrics/:id/confirm-geometry first validates ObjectId/existence and rejects RESERVED/CONSUMED fabrics with 409. Its strict body accepts polygonCm, optional holes (default []), source=manual|suggested, optional basedOnAnalysisId; unknown fields are 400. Polygon validation requires at least three finite points, coordinates within [-1000,1000], no consecutive duplicate vertices, no self-intersection and area greater than 0.01 cm2. Holes are validated and must remain inside the outer polygon without crossing it.

An explicit analysis ID must resolve to the current analysis or analysisHistory, otherwise 400 with no write. A valid historical ID is intentionally allowed. Omission selects the current analysis; a metadata-only fabric may have no basis. Polygon orientation is normalized counter-clockwise. source=suggested records intent and the selected suggestion; it does not replace the submitted polygon or require exact equality. basis.matchesSuggestion compares normalized coordinates within 1e-6. Existing geometry is archived, the next version is assigned, and status becomes CONFIRMED. There is no manufacturing/physical-accuracy approval operation.

Repeated confirmation is intentionally **not idempotent**: the next call creates a new version and archives the preceding geometry even if its polygon is unchanged. The API does not accept a client expected-version/freshness precondition. No rules were bypassed or weakened for the audit.

## Actual isolated HTTP results

Evidence directory: **E:\Borsal project\The_Project\borsal\data\phase3c-audit-30040ac2**.

[Audit summary](../data/phase3c-audit-30040ac2/audit.json), [registration](../data/phase3c-audit-30040ac2/01-registration.json), [confirmation](../data/phase3c-audit-30040ac2/02-confirmation.json), [first persisted snapshot](../data/phase3c-audit-30040ac2/03-confirmed-snapshot.json), [after reanalysis](../data/phase3c-audit-30040ac2/12-after-analysis.json), [final main-fabric snapshot](../data/phase3c-audit-30040ac2/15-final-main-fabric.json), [concurrency evidence](../data/phase3c-audit-30040ac2/19-concurrency.json). These local artifacts are deliberately not committed.

| Request/check | Actual result |
| --- | --- |
| Register test-mat40.png, matPreset=large | 201, DRAFT/AVAILABLE, four markers, 74-point suggestion, 11.3889 x 23.3611 cm, 162.0459 cm2 |
| Confirm actual suggestion with its analysisId | 200, CONFIRMED, geometry.confirmed=true, version 1, empty geometry history |
| Provenance/evidence | Persisted basis analysisId/photoPath/evidence match the registration, matchesSuggestion=true |
| Invalid self-intersecting polygon / outside hole | 400 / 400; document unchanged |
| Unknown analysis ID / forbidden confirmed field | 400 / 400; document unchanged |
| Malformed fabric ID / absent fabric ID | 400 / 404; document unchanged |
| Repeat confirmation | 200, version 2; prior geometry archived unchanged |
| Later legacy/manual photo analysis | 200; fresh analysis ID and old analysis archived; confirmed geometry and its evidence/photo remain unchanged; geometryBasedOnCurrentAnalysis=false |
| Explicitly confirm historical original analysis | 200; correct original basis, matchesSuggestion=true, current-analysis flag=false |
| Submit old polygon but omit basedOnAnalysisId | 200; basis defaults to current analysis and matchesSuggestion=false, as existing rules allow |
| Two confirmations after synchronized reads of version 0 | One 200, one 500 (VersionError); persisted version 1, empty history; no silent winning-geometry overwrite in this case |

The original source-photo bytes and earlier snapshots remained unchanged. No real-inventory record was used as an audit target. The isolated test database was dropped only after full snapshots were saved; uploaded audit originals remain in the evidence directory's uploads/ subtree.

## Findings and blockers

1. **No metadata defect:** retain 40/4/span semantics and all historical fields.
2. **Freshness policy gap:** a stale but geometrically valid polygon is not automatically rejected when basedOnAnalysisId is omitted. The current analysis becomes its basis, with matchesSuggestion=false. geometryBasedOnCurrentAnalysis then reports true because it compares analysis IDs only; it does NOT establish suggestion equality, measurement accuracy, or technical approval. Explicit historical confirmation remains supported by design. A stricter freshness/revision policy requires a separate contract decision; it was not invented here.
3. **Concurrency response defect:** in the deterministic first-confirmation race, both MongoDB updates filtered on the same _id and __v=0. Mongoose rejected one with VersionError, preventing that overwrite, but the route maps it to generic 500 rather than an explicit conflict response. Do not treat this limited default array-version protection as universal concurrency safety; other read-modify-save paths and inventory state changes still need conditional atomic updates before reservations. The new test enforces one winner and no silent loss, without permanently prescribing 500 as the desired conflict contract.
4. **Unverified physical accuracy:** status CONFIRMED means the existing user geometry confirmation step was executed. basis.calibrationEvidence.status remains PHYSICAL_ACCURACY_UNVERIFIED. It is not manufacturing approval. The synthetic sample in real inventory was untouched and must not be promoted on the basis of this audit.

No runtime change was made for these policy/concurrency findings: this task preserves existing rules and fixes only proven mapping/metadata errors; none were found. Recommended follow-up is an explicitly scoped freshness/concurrency contract and conditional-write implementation, with conflict handling and race tests across all relevant writes, before inventory/reservations. No new phase was started.

## Verification

Baseline full suite: **317/317 passed**, 18 files, 39.96s. Added four tests in src/routes/confirmationAudit.test.js covering semantic compatibility and repeated confirmation, immutable geometry on reanalysis plus stale/current/historical-basis behavior, save-failure nonpersistence, and synchronized concurrent-confirmation protection. Focused suite: **4/4 passed**, 4.05s. Existing tests/thresholds and production code are unchanged. Final full-suite result is appended after execution.

Final regression: **321/321 passed**, 19 files, 43.79s. All 317 previous tests remain unchanged and pass. Four new focused tests pass; the deterministic concurrency test still reproduces a version rejection, with the current route logging VersionError and returning generic 500. These passing characterization tests do not resolve the documented freshness/conflict-response gaps. Only the new test file and Phase 3C documentation/follow-up link were added by this audit. The real inventory sample and previous data remain untouched.


## Confirmation safety fix (current contract)

### Root cause and minimal changes

The old route let basedOnAnalysisId select an archived analysis and defaulted omitted IDs to the current analysis even for an unrelated old polygon. It had no client geometry revision check. Default Mongoose array versioning happened to reject some confirmation races, but did not provide complete save protection for scalar-only geometry or analysis replacement. The catch handler translated expected version failures to generic 500.

FabricPiece now uses **optimisticConcurrency: true**, so every model save compares/increments its observed __v. PUT geometry, analyze-photo and confirm-geometry add a save-time availability predicate; raw legacy records with no __v additionally require that the version field is still absent. This makes the first legacy write conditional too. Each document's geometry, status and history are persisted in one conditional MongoDB update: a failed revision match cannot append history or partially change fields. No data migration, historical snapshot rewrite or calibration-size change was performed. See [Mongoose optimistic concurrency](https://mongoosejs.com/docs/guide.html#optimisticConcurrency) and [additional save predicates](https://mongoosejs.com/docs/api/model.html#Model.prototype.$where).

Expected VersionError and failed save predicates (DocumentNotFoundError) return a stable **409**:

~~~json
{"error":"Fabric changed; reload and retry","code":"FABRIC_VERSION_CONFLICT"}
~~~

This response also applies to a mismatched expectedGeometryVersion. No automatic retry occurs. A failing reanalysis removes only its newly written photo; existing photos, geometry and analyses remain intact. An explicit already-frozen fabric retains its prior 409 frozen response. Unexpected storage/DB errors still return generic 500 rather than being mislabeled as successful conflicts.

### Freshness and edit rules

- If basedOnAnalysisId is supplied it must equal the CURRENT analysis ID. A known historical ID now returns 409 STALE_ANALYSIS; an unknown ID retains the existing 400 validation error. Historical analyses and basis snapshots remain stored and readable but cannot be selected for a new confirmation.
- Without an analysis ID, an exact current suggestion is still safe to confirm. An unchanged current geometry whose basis already matches the current analysis is also allowed. A different polygon on a modern analysis requires an explicit current basedOnAnalysisId, otherwise 409 CURRENT_ANALYSIS_REQUIRED. This includes stale or edited old suggestions, rather than silently rebinding them to the latest photo.
- Freshness outline comparison accepts counter-clockwise normalization and cyclic starting-vertex changes within 1e-6. It does not require edits to equal the suggestion: valid intentional edits naming the current analysis remain supported and get matchesSuggestion=false. The existing basis snapshot comparison semantics are retained.
- New optional expectedGeometryVersion is a nonnegative integer (0 when geometry is absent). If provided it must equal the CURRENT geometry.version. Changing an existing outline OR holes requires this field; absence returns 409 CURRENT_GEOMETRY_REQUIRED. Thus current manual edits and intentional reverts are supported after acknowledging the geometry revision, but old polygons cannot silently overwrite a changed geometry.
- Unchanged sequential confirmation remains non-idempotent for compatibility: it archives the old geometry and increments the version. A repeat with an obsolete expectedGeometryVersion returns 409 without another history entry. Clients should always send the version when protecting against retries or stale UI state.
- Metadata-only fabrics and legacy analyses without analysisId still work without a fabricated basis ID; unchanged existing legacy geometry remains confirmable. Existing geometry edits still need its revision. No historical record is assigned a synthetic analysis ID merely to satisfy this policy.

Recommended confirmation body after GET/current registration (replace placeholders with actual current values):

~~~json
{
  "polygonCm": [[0,0],[4,0],[4,3],[0,3]],
  "source": "manual",
  "basedOnAnalysisId": "CURRENT_ANALYSIS_UUID",
  "expectedGeometryVersion": 0
}
~~~

The coordinates above illustrate request shape only, not physical reference measurements. Use the actual current suggestion or intentional valid edit, and the current geometry version. User confirmation still does not establish physical measurement accuracy or manufacturing feasibility. The 40 cm reference-span versus 4 cm printed-tag semantics and all source-photo evidence remain unchanged.

### Actual new HTTP evidence

[Safety audit](../data/phase3c-safety-889f7e4a/audit.json), [final persisted fabric](../data/phase3c-safety-889f7e4a/final-fabric.json). All artifacts remain local under ignored data/phase3c-safety-889f7e4a/. A new UUID-suffixed test database and loopback HTTP server were used; that database was dropped after snapshots. The real database/sample was never accessed or modified.

| Actual request | HTTP outcome |
| --- | --- |
| Register test-mat40.png with large preset | 201 |
| Confirm current analysis with expectedGeometryVersion=0 | 200, version 1 |
| Retry with obsolete version 0 | 409 FABRIC_VERSION_CONFLICT, state unchanged |
| Later legacy/manual reanalysis | 200, old confirmed geometry untouched |
| Confirm old analysis ID | 409 STALE_ANALYSIS |
| Submit old polygon without current basis ID | 409 CURRENT_ANALYSIS_REQUIRED |
| Legitimate current-analysis edit with current geometry version | 200, version 2, prior geometry archived once |
| Two confirmations with synchronized reads | 200 / 409 FABRIC_VERSION_CONFLICT; no 500 |

Original photo bytes were preserved; no real inventory mutation occurred. Separate focused integration tests force confirmation/reanalysis races in BOTH commit orders, concurrent reanalysis and geometry PUT/confirmation races, missing-version legacy first saves, and a reservation becoming visible between read and save. They verify no lost newer geometry, duplicate history or losing-upload remnants.

### Existing test changes required by the safer contract

No geometric threshold/tolerance was loosened. These old positive expectations are intentionally obsolete:

- traceability.test.js: historical-ID acceptance is now historical-ID rejection with 409. The detached-snapshot assertion confirms the CURRENT analysis then mutates its original values to prove the stored basis stays immutable. The success helper supplies the current ID for manual-edit tests; the second, changed-outline confirmation in the 1e-6 tolerance test now supplies expectedGeometryVersion=1. Numeric thresholds are unchanged.
- automaticRegistration.test.js: the final historical reconfirmation now expects 409, then an explicit current-analysis/current-version manual edit verifies old automatic evidence remains in geometryHistory and the new basis refers to the current photo.
- confirmationAudit.test.js: audited stale acceptance is now rejection; an explicit current-basis edit remains 200. The concurrency assertion is tightened to exact 409 and the stable response.
- fromPhoto.test.js: its manual-confirm helper supplies the current analysis ID when one exists; the deliberate revert after PUT supplies expectedGeometryVersion=2. History/version assertions remain unchanged.
- fabrics.test.js: the second confirmation intentionally changes existing geometry, so its body now includes expectedGeometryVersion=1. Existing version/history expectations remain unchanged.

New confirmationSafety.test.js covers stale/current analysis, exact-current legacy omission, changed geometry and holes, repeated/retried confirmation, simultaneous saves, both confirmation/reanalysis commit orders, concurrent reanalyses, PUT/confirmation, legacy missing __v, and save-time freezing. Test database/upload isolation is unchanged.

### Remaining risks and boundary

Conditional saves protect these API writers, not arbitrary raw database updates that ignore __v. The save-time availability predicate also catches a raw reservation flip, but future inventory writers must participate in the revision protocol. Database/file atomicity is still not distributed: ordinary failures clean up the losing new file, while process-crash orphan cleanup remains separate hardening.

Legacy unchanged repeats without expectedGeometryVersion are intentionally not idempotent, and an exact current polygon alone cannot prove which identical historical image a client looked at. Supply BOTH current analysis ID and geometry revision for explicit client intent. Legacy no-ID provenance remains limited rather than invented. Physical accuracy is still UNVERIFIED; this patch adds no manufacturing approval, inventory engine or new dependency.


### Safety-fix final test results and changed files

- Baseline before the fix: **321/321 passed**, 19 files, 44.38s.
- Final focused API regression: **81/81 passed**, 6 files, 26.10s, including all **12 new safety tests**. Both deterministic confirmation/reanalysis save orders, duplicate requests, scalar PUT races, missing-version legacy records, hole edits and late freezing were exercised.
- Final full npm test: **333/333 passed**, 20 files, 47.13s. The 321 existing cases still pass with the explicitly documented obsolete historical-acceptance/freshness request expectations updated; geometry thresholds/tolerances were not loosened.
- Runtime changes: src/models/FabricPiece.js (optimistic concurrency), src/routes/fabrics.js (current-basis/revision checks, conditional save predicates and stable 409 handling). New regression file: src/routes/confirmationSafety.test.js. Updated test files and exact contract reasons are listed above. Updated this audit, the Phase 3A follow-up and PROJECT_STATUS.md. No new dependency or data migration.
- The independent real HTTP audit passed (data/phase3c-safety-889f7e4a/audit.json): register 201, fresh confirmation/edit 200, stale/retried confirmation 409, simultaneous confirmations 200/409. Original photo bytes persisted unchanged; only the unique test DB was used and dropped. The real inventory sample was never touched.
- Read-only raw updates that do not advance __v are outside this protocol; future writes must coordinate. PUT/analysis saves have server-side race protection, while client-side expectedGeometryVersion is a confirmation contract. Unchanged legacy repeated confirmation without an expected version is still intentionally non-idempotent. Physical accuracy remains unverified and confirmation is not manufacturing approval. No Cloudflare calls, production data mutation, frontend, commit, push or merge.

## Phase 3 final closeout verification
Final full regression rerun: **333/333 passed**, 20 files, 47.08s. Reviewed all 23 intended Phase 3 files: no configured secrets/credential patterns, private run artifacts or active/external SVG content were found. Local data/, .env and inference-result folders are ignored and untracked. Remaining limits are physical accuracy UNVERIFIED, non-idempotent unversioned legacy repeats, and revision coordination for direct DB writers; no manufacturing approval follows from these tests. Only intended code/tests/printable mats/docs are being finalized. No production inventory/database mutation, Cloudflare request, push, merge or Phase 4 implementation was performed.
