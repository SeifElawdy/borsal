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

## Known limitations
- Read-modify-save operations have no concurrency protection yet. They must become conditional atomic updates before reservations; simultaneous requests can affect geometry version numbering and lose updates/history.
- [TS-001](TEMPORARY_SHORTCUTS.md#ts-001-developer-supplied-marker-calibration): marker corners and marker size remain developer-only temporary inputs pending automatic Borsal marker detection.
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
