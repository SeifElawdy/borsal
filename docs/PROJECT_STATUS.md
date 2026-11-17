# Project status

## Previously completed phases
- MongoDB replica set and transactions (existing project milestone; not rerun in Phase 1).
- FabricPiece model.
- Polygon validation.
- Homography.
- OpenCV contour extraction with developer-supplied marker corners (TS-001).
- analyze-photo and confirm-geometry with geometry history.
- Cloudflare FLUX.2 Klein single-request spike (recorded in doc/decision-001.md; not rerun).

## Completed registration phases
Phase 1: image-first fabric registration - completed. All 64 existing tests remain unchanged and pass.
Registration creates a DRAFT/AVAILABLE FabricPiece only after successful photo analysis. Geometry requires explicit confirmation. Temporary developer calibration remains TS-001.

Phase 1b: photo/analysis traceability - completed. The final npm test run passed 76 tests across 6 files (64 existing unchanged + 12 new).
Each new analysis has an analysisId. Confirmed geometry keeps a detached basis snapshot of the selected current/historical analysis; reanalysis preserves that geometry and its original photo. Derived response flags distinguish the current photo from the basis photograph. Legacy analyses remain valid without IDs.

## Completed design experiment (pending review)
Phase 2A: Design Language Experiment 1 - completed as an experiment, not permanent architecture acceptance. Version borsal.design/0.1 and eight manual women's bag examples are isolated under experiments/design-language/. All eight are schema-valid; 35 declared feature intents were assessed as 12 expressed, 15 partial and 8 unsupported. No sample is manufacturing-verified. No numerical expressiveness threshold was applied.
Focused tests: 51 passed. Full suite: 127 passed across 7 files, including all 76 previous tests unchanged. See [the factual comparison and limitations](DESIGN_LANGUAGE_SPIKE_1.md). Phase 2B research is now closed; see AI_STRUCTURAL_SPIKE_2.md.

## Known limitations
- Geometry/analysis API saves now use optimistic revision checks plus save-time availability predicates. Future inventory/raw database writers must participate in the revision protocol; crash-orphan photo cleanup and broader transaction policy remain hardening work.
- [TS-001](TEMPORARY_SHORTCUTS.md#ts-001-developer-supplied-marker-calibration): manual marker inputs remain legacy/developer-only; A4/large automatic registration exists, with physical accuracy still unverified.
- [TS-002](TEMPORARY_SHORTCUTS.md#ts-002-manual-creation-without-a-photo): metadata-only creation remains for development/tests.
- [TS-003](TEMPORARY_SHORTCUTS.md#ts-003-no-authentication): endpoints remain open; access control is required before approval/inventory/reservations phases.

## Upcoming phases (in order)
1. Design-language experiment 1 (manual designs).
2. AI structural experiment 2.
3. Borsal marker design and physical validation.
4. Registration UI decision.
5. Design models + pattern engine + BOM.
6. Nesting + four-layer feasibility.
7. Technical outputs (SVG/PDF).
8. AI design pipeline.
9. Visualization.
10. Approval + inventory + reservations.
11. Hardening.

## Phase 2B closeout
Research complete: both text models produced unapproved technical proposals. Offline staged concept proof and two local photorealistic previews do not establish manufacturing feasibility or use actual fabric imagery. Live artifacts, counters and preview images remain local; only reviewed regression fixtures are versioned. Next: Phase 3A offline physical-mat calibration prototype, without API integration.

## Phase 3A offline calibration prototype
Prototype implemented on feature/automatic-fabric-calibration: four coded perimeter markers, explicit physical mat profiles, automatic homography/scale estimation and debug overlay. Focused 19/19; full 272/272 tests passed. See [print instructions, evidence and limitations](AUTOMATIC_FABRIC_CALIBRATION_PHASE3A.md). Physical print/ruler validation is pending; measurement accuracy is UNVERIFIED. Existing fabric APIs and TS-001 remain unchanged.

## Phase 3B automatic image-first registration
Implemented matPreset=a4|large on POST /api/fabrics/from-photo without manual corner inputs. Original photo, auto-marker analysis UUID, calibration evidence and suggested geometry are preserved; creation remains DRAFT/AVAILABLE and existing confirmation snapshots the evidence. Legacy developer calibration remains compatible. Baseline 300/300; focused API 57/57; final full 317/317 passed. Physical measurement accuracy is still UNVERIFIED. See AUTOMATIC_FABRIC_CALIBRATION_PHASE3A.md, Phase 3B section. No manufacturing approval or additional phase implemented.

## Phase 3 final closeout
Phase 3A?3C backend implementation is complete: A4/large printable mat presets, offline automatic measurement, image-first automatic registration, original-photo/analysis evidence, confirmation snapshots and revision-safe geometry/analysis writes. Final regression: **333/333 passed**, 20 files, 47.08s. No geometric tolerance was loosened. See [calibration and usage](AUTOMATIC_FABRIC_CALIBRATION_PHASE3A.md) and [current confirmation safety contract](CALIBRATION_CONFIRMATION_PHASE3C.md).

Remaining limitations:
- Physical measurement accuracy remains **UNVERIFIED** until independently measured printed-mat trials; confirmed geometry is not manufacturing approval.
- Legacy unchanged confirmations without expectedGeometryVersion remain non-idempotent; clients should supply the current analysis ID and geometry revision.
- Direct database/inventory writers must coordinate __v revisions; API save protection does not cover arbitrary raw writes. Database/file crash-orphan cleanup remains separate hardening.

Only source, tests, printable SVG masters and documentation are included in the Phase 3 closeout. Credentials, local uploads, photographs, inference/audit results and test database contents are excluded. Next branch: feature/pattern-feasibility-engine, reserved for subsequent instructions; **no Phase 4 implementation** is included. No push or merge.
