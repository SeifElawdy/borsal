# Phase 1b final report

## Step 0: baseline and schema audit
Before any code changes, npm test exited 0: 5 files passed; 64/64 tests passed. Start 01:48:46; duration 13.69s (tests 81%, import 18%). Both the model and route file, their photo helpers, and polygon normalization were read.

- analysis: optional AnalysisSchema subdocument (_id:false), holding photoPath, markerCornersPx, markerSizeCm, calibrationSource (manual-dev/auto-marker, default manual-dev), scale, suggestedPolygonCm, stats, warnings, createdAt. It had no analysisId.
- analysisHistory: array of the identical AnalysisSchema shape, default [].
- geometry: optional GeometrySchema (_id:false) holding polygonCm, holes, confirmed (default false), version (default 1), source, suggestedPolygonCm and confirmedAt. It had no analysis/photo basis.
- geometryHistory: array of GeometryHistorySchema (_id:false), default [], with the corresponding geometry snapshot fields. It had no basis.
- Photo deletion audit: the only runtime deletion helper is removePhoto (unlink plus empty-directory rmdir). It is called after a failed photo write, or when from-photo creation/analyze-photo persistence fails after the new photo was written. Reanalysis never deletes an earlier photo. Existing test cleanup removes only its temporary upload directory. Runtime deletion behavior required no changes.
- Before Phase 1b, confirm-geometry stored the normalized polygon, holes, confirmed=true, incremented version, source, suggestedPolygonCm copied from current analysis for source=suggested, and confirmedAt; set status=CONFIRMED; and archived the replaced geometry. It did not store the photograph/calibration provenance.

## Implemented behavior
- Every newly generated analysis gets crypto.randomUUID() via shared buildAnalysis. AnalysisSchema also supplies the history element shape; legacy records have no default analysisId.
- Strict confirmation accepts only one new optional field: basedOnAnalysisId. A supplied value must select the current analysis or history; unknown IDs return 400 before any history/status/document mutation. Omission uses the current analysis when present.
- geometry.basis copies analysisId, photoPath, calibrationSource, markerSizeCm, markerCornersPx, scale, suggestedPolygonCm, analysisCreatedAt, matchesSuggestion. structuredClone detaches arrays, objects and dates from the selected analysis.
- matchesSuggestion compares the saved CCW-normalized polygon against the CCW-normalized suggestion: equal point counts and coordinate-by-coordinate absolute error <=1e-6. No cyclic starting-point matching is inferred.
- With no analysis, basis is omitted and manual confirmation still works. With a legacy analysis, basis is populated but analysisId remains absent.
- Both history and live geometry schemas accept basis. Existing archival code copies it unchanged. PUT always creates an unconfirmed geometry without basis.
- GET detail, analyze-photo and confirm-geometry include a top-level geometryBasedOnCurrentAnalysis computed at serialization time. It is null for unconfirmed/missing basis/missing IDs, otherwise a comparison of basis and current analysis IDs. It is neither stored nor added to the list response.
- Reanalysis never assigns geometry/status and emits the exact requested notice when geometry is confirmed; old photographs remain on disk.

## Files created or modified (this phase only)
- Modified src/models/FabricPiece.js: optional analysisId and shared geometry basis schema for live/history entries.
- Modified src/routes/fabrics.js: UUID assignment, strict analysis selection, detached basis and match computation, derived flags and reanalysis notice.
- Created src/routes/traceability.test.js: 12 isolated integration tests with unique test-suffixed database and temporary uploads directory; both cleaned after the suite.
- Modified docs/PROJECT_STATUS.md: completed Phase 1/1b and required concurrency/TS-001/002/003 limitations.
- Created docs/phase1b-tests.txt: actual complete final npm test capture.
- Created docs/PHASE1B_REPORT.md: this audit and report with complete test output.

## Existing tests and behavior changes
All 64 existing tests passed unchanged; git diff for the five pre-existing test files is empty. No threshold or tolerance changed. Twelve new cases exercise the requested scenarios plus PUT archival, tolerance/normalization, current-ID selection, and non-persistence/list exclusion of the derived flag.
The new basedOnAnalysisId selection also determines the existing geometry.suggestedPolygonCm field when source=suggested, so explicitly confirming from history copies that historical suggestion. With basedOnAnalysisId omitted, existing source/suggestion/version/history behavior is retained. No existing field was removed or renamed.
No runtime photo deletion changes were needed; the existing failed-request cleanup remains intact.

## Differences from the instructions
No requested task was omitted. The confirmation snapshot is immutable in the requested value-copy sense: reanalysis and later changes to the originating analysis do not alter it. Reconfirmation creates a fresh snapshot and archives the old geometry. This does not prevent a direct database administrator from altering stored documents.
No dependency, frontend, authentication, unrelated refactor, commit, push or later phase was added. Full output is included below and in phase1b-tests.txt so the chat response can stay brief.

## Problems and risks
- Read-modify-save still has no concurrency protection. Before reservations it must become conditional atomic updates; simultaneous requests can affect geometry version numbering and lose updates/history.
- Legacy analyses intentionally lack an analysisId: the flag stays null even after legacy confirmation. No IDs were backfilled or production records modified.
- TS-001 developer calibration, TS-002 metadata-only creation, TS-003 open endpoints remain as documented.
- Referenced photo/history retention accumulates disk/document data. The existing filesystem/MongoDB crash window remains; this phase introduces no retention cleanup.
- PowerShell wraps stderr in NativeCommandError formatting in the capture; the final test process exited 0. The database-error stderr message is expected from the existing simulated failed-create cleanup test.
- git diff --check passed; Git emitted only informational LF/CRLF warnings. No existing test files were changed.

## Full final npm test output (exit 0)
```text

> borsal@1.0.0 test
> vitest run


 RUN  v5.1.0 E:/Borsal project/The_Project/borsal

node.exe : stderr | src/routes/fromPhoto.test.js
At line:1 char:1
+ & "C:\Users\Seif\AppData\Local\fnm_multishells\10764_1794441112989/no ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (stderr | src/routes/fromPhoto.test.js:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
◇ injected env (3) from .env

 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > registers TEST1 only after analysis, with one document and a contained photo 1807ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects missing photo without persistence 27ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects unsupported MIME without persistence 14ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects photo over 10 MB without persistence 64ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects fake PNG without a document or file 31ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects missing name without a document or file 13ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects out-of-bounds corners without a document or file 12ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects background-only extraction without a document or file 61ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects negative mass without persistence 16ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects grain over range without persistence 12ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects grain at 180 without persistence 13ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects empty name without persistence 10ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects non-number mass without persistence 11ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects infinite mass without persistence 10ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects long fabric type without persistence 11ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects invalid corners JSON without persistence 9ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects missing marker size without persistence 13ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects nonconvex corners without persistence 14ms
stderr | src/routes/fromPhoto.test.js > Phase 1 image-first registration > removes the photo if document creation fails
Unexpected error in POST /api/fabrics/from-photo: Error

 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > treats optional empty multipart values as absent 83ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > removes the photo if document creation fails 53ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects server fields on photo registration with their names and no persistence 11ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 consistency guards > returns AVAILABLE for a raw legacy document on both read endpoints 27ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 consistency guards > archives replacement analyses and keeps geometry unchanged, including after confirmation 255ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 consistency guards > freezes every geometry write for RESERVED fabrics 56ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 consistency guards > freezes every geometry write for CONSUMED fabrics 56ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 consistency guards > rejects client-supplied server fields on manual creation 10ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 consistency guards > rejects confirmed:true on PUT without changing the document 22ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 consistency guards > archives confirmed and draft geometry with monotonically increasing versions 1, 2, 3 50ms
stderr | src/routes/traceability.test.js
◇ injected env (3) from .env

 ✓ src/routes/traceability.test.js > Phase 1b photo and geometry traceability > registers TEST1 with a UUID and confirms the exact analysis snapshot 2007ms
 ✓ src/routes/traceability.test.js > Phase 1b photo and geometry traceability > marks a manually shifted polygon as different from the suggestion 99ms
 ✓ src/routes/traceability.test.js > Phase 1b photo and geometry traceability > preserves confirmed basis and old photos on reanalysis, then archives the old basis on reconfirmation 158ms
 ✓ src/routes/traceability.test.js > Phase 1b photo and geometry traceability > accepts historical analysis IDs and stores a detached snapshot of all basis values 126ms
 ✓ src/routes/traceability.test.js > Phase 1b photo and geometry traceability > rejects an unknown analysis ID without changing any document field 68ms
 ✓ src/routes/traceability.test.js > Phase 1b photo and geometry traceability > supports manual confirmation without any analysis or basis 31ms
 ✓ src/routes/traceability.test.js > Phase 1b photo and geometry traceability > confirms legacy analyses without assigning or requiring an analysis ID 33ms
 ✓ src/routes/traceability.test.js > Phase 1b photo and geometry traceability > keeps confirm-geometry strict and rejects unknown extra fields 50ms
 ✓ src/routes/traceability.test.js > Phase 1b photo and geometry traceability > archives basis unchanged on PUT and leaves the unconfirmed geometry without basis 77ms
 ✓ src/routes/traceability.test.js > Phase 1b photo and geometry traceability > normalizes clockwise suggestions and applies the 1e-6 coordinate tolerance 77ms
 ✓ src/routes/traceability.test.js > Phase 1b photo and geometry traceability > returns null before confirmation and never stores or adds the derived flag to the list 122ms
 ✓ src/routes/traceability.test.js > Phase 1b photo and geometry traceability > accepts explicitly selecting the current analysis ID 57ms
 ✓ src/vision/extractContour.test.js > Fabric contour extraction (src/vision/extractContour.js) > A) SYNTHETIC GROUND-TRUTH: 400x300 px rectangle on yellow background 1380ms
 ✓ src/vision/extractContour.test.js > Fabric contour extraction (src/vision/extractContour.js) > B) SYNTHETIC CONCAVE: L-shaped fabric 745ms
 ✓ src/vision/extractContour.test.js > Fabric contour extraction (src/vision/extractContour.js) > C) NOISE & FRAYED THREADS: robustness against channel noise and thin thread protrusions 1015ms
 ✓ src/vision/extractContour.test.js > Fabric contour extraction (src/vision/extractContour.js) > D) FAILURE: image with only background (no fabric) returns ok:false without throwing 646ms
 ✓ src/vision/extractContour.test.js > Fabric contour extraction (src/vision/extractContour.js) > E) REAL IMAGE: TEST1.png plausibility checks 985ms
stderr | src/routes/fabrics.test.js
◇ injected env (3) from .env

 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/analyze-photo > Returns 200 with widthCm 7.5..9.5 and does NOT modify geometry 1765ms
 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/analyze-photo > Rejects a text file renamed to .png with 400 26ms
 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/analyze-photo > Returns 400 when markerCornersPx field is missing 23ms
 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/analyze-photo > Returns 400 when a corner is outside image dimensions 22ms
 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/analyze-photo > Returns 404 for a non-existent fabric id 11ms
 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/confirm-geometry > Returns 200, sets status CONFIRMED, geometry.confirmed true, version 1 35ms
 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/confirm-geometry > Returns 400 and saves nothing for a bow-tie (self-intersecting) polygon 20ms
 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/confirm-geometry > Confirming twice bumps version to 2 and geometryHistory has 1 entry 45ms
 ✓ src/geometry/homography.test.js > Homography and Scale Calibration > 1. Pure scaling: marker 10 cm drawn as 200x200 square maps correctly and has near zero skew 4ms
 ✓ src/geometry/homography.test.js > Homography and Scale Calibration > 2. Translation and rotation: a marker rotated 90 degrees maps corners consistently 1ms
 ✓ src/geometry/homography.test.js > Homography and Scale Calibration > 3. Perspective (tilted camera): maps quadrilateral corners to targets with < 1e-6 error, centroid inside square, skew > 0.05 1ms
 ✓ src/geometry/homography.test.js > Homography and Scale Calibration > 4. Round trip: invertHomography takes (5,5) cm back to pixel and forward again to (5,5) 1ms
 ✓ src/geometry/homography.test.js > Homography and Scale Calibration > 5. Real-use example: marker calibrates fabric polygon to 30 cm x 25 cm with area 750 cm2 1ms
 ✓ src/geometry/homography.test.js > Homography and Scale Calibration > 6. Degenerate input: three collinear points, duplicates, fewer than 4 points, and NaN throw 2ms
 ✓ src/geometry/homography.test.js > Homography and Scale Calibration > 7. applyHomography on a point that maps to infinity throws 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Rectangle [[0,0],[20,0],[20,30],[0,30]]: area 600, width 20, height 30, valid 4ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Triangle [[0,0],[10,0],[0,10]]: area 50, valid 1ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > L-shape (concave) [[0,0],[20,0],[20,10],[10,10],[10,30],[0,30]]: area 400, valid, bounding box 20 x 30 1ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Bow-tie (self-intersecting) [[0,0],[10,10],[10,0],[0,10]]: invalid, error mentions self-intersection 1ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Edge case 1: Non-adjacent collinear edges that overlap are rejected as a self-intersection 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Edge case 2: A non-adjacent edge touching another edge's vertex is rejected as a self-intersection, while normal adjacent edges remain valid 1ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Edge case 3: A hole touching the outer polygon boundary is rejected as invalid geometry, even if touching at only one point 1ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Collinear points [[0,0],[10,0],[20,0]]: invalid because of zero area 1ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Fewer than 3 points: invalid 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > A point containing NaN: invalid 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Duplicate consecutive points: invalid 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Clockwise rectangle: signedArea is negative, and normalizeToCounterClockwise makes it positive 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Rectangle with a valid hole [[5,5],[10,5],[10,10],[5,10]] inside [[0,0],[20,0],[20,30],[0,30]]: valid, netAreaCm2 = 600 - 25 = 575 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Hole outside the outer polygon: invalid 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Hole crossing the outer edge: invalid 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > pointInPolygon: one point inside the L-shape, one in its missing notch (outside), one far away 0ms

 Test Files  6 passed (6)
      Tests  76 passed (76)
   Start at  01:51:54
   Duration  18.26s (tests 78%, import 21%)

    Isolate  6 workers spawned · ~229ms startup each (spawn + environment, per file)
             at least ~1.14s faster with isolate: false — reuses workers across files instead of one per file
```
