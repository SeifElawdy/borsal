# Project status

## Previously completed phases
- MongoDB replica set and transactions (existing project milestone; not rerun in Phase 1).
- FabricPiece model.
- Polygon validation.
- Homography.
- OpenCV contour extraction with developer-supplied marker corners (TS-001).
- analyze-photo and confirm-geometry with geometry history.
- Cloudflare FLUX.2 Klein single-request spike (recorded in doc/decision-001.md; not rerun).

## Current phase
Phase 1: image-first fabric registration ? completed: npm test passed all 64 tests (36 existing unchanged + 28 new), across 5 files.
Registration creates a DRAFT/AVAILABLE FabricPiece only after successful photo analysis. Geometry requires explicit confirmation. Temporary developer calibration remains TS-001.

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
