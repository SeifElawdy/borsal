# Phase 1 final report

## Baseline and read-only audit
Before editing: npm test exited 0; all 36 original tests passed. Both data/test/TEST1.png and data/test/markers.json exist. No Vitest config existed, so vitest.config.js was added.

| Existing write endpoint | Construction before changes | Exposed fields and consistency |
| --- | --- | --- |
| POST /api/fabrics | FabricPiece.create(parseResult.data), already Zod-parsed, not raw req.body | Schema explicitly accepted status and geometry (including confirmed/version). Clients could bypass confirmation. Unknown fields including availabilityStatus, geometryHistory, analysis were silently stripped. |
| PUT /:id/geometry | Explicit assignment from Zod-parsed polygonCm/holes | Always reset confirmed=false and status=DRAFT and incremented version, but overwrote a confirmed geometry without archiving it. Other client fields were stripped. |
| POST /:id/analyze-photo | Explicit analysis assignment; corner JSON parsed and Zod-validated; marker size numerically checked | Did not touch geometry/status or accept client analysis/history/status. Wrote the photo BEFORE extraction, and replaced analysis without history. Other client fields were ignored. |
| POST /:id/confirm-geometry | Explicit assignment from Zod-parsed polygonCm/holes/source and server fields | Only archived already confirmed geometry. Extra server fields were stripped. No availability/frozen guard existed. |

None of these four endpoints constructed a document directly from raw req.body. availabilityStatus did not exist in the model. The unsafe creation schema was the direct confirmation bypass.

Actual baseline output:
```text

> borsal@1.0.0 test
> vitest run


 RUN  v5.1.0 E:/Borsal project/The_Project/borsal


 Test Files  4 passed (4)
      Tests  36 passed (36)
   Start at  01:18:31
   Duration  6.71s (tests 79%, import 18%, transform 2%, worker 1%)
```

## Delivered behavior
- POST /api/fabrics/from-photo validates strict multipart metadata and temporary calibration, then extracts the contour. A document and photo are created only after ok===true and validation.valid===true.
- Server-generated ObjectId and crypto.randomUUID filenames are contained within the uploads root. File cleanup follows failed document creation; failed validation/extraction writes no photo.
- Registration returns 201 with DRAFT/AVAILABLE fabric, registrationSource=photo, calibrationSource=manual-dev, summary, suggested polygon, validation, the unchanged accuracyNote, and the exact TS-001 devNotice. No geometry is inferred as confirmed.
- Model defaults support legacy reads without changing legacy database documents. analysisHistory preserves prior analyses; analyze-photo never assigns geometry/status.
- All write input comes from Zod-parsed fields or server-controlled values. Unknown fields list their names in 400 errors. RESERVED/CONSUMED blocks all three existing geometry write routes.
- PUT archives confirmed geometry before replacing it with a draft; confirmation also archives a previous draft to satisfy the requested 1 -> 2 -> 3 history sequence.
- Test files run sequentially. The new suite uses a unique test-suffixed database plus a unique temporary uploads folder, both cleaned after its run.

## Created or modified files
- Modified src/models/FabricPiece.js: availability/registration/calibration fields, analysisHistory, geometry-status comment, grain angle <180 validation.
- Modified src/routes/fabrics.js: image-first route, shared photo helpers, strict allowlists, frozen guards, analysis/geometry history, delayed file writes and cleanup.
- Created src/routes/fromPhoto.test.js: 28 new regression/validation/integration cases with isolated test storage.
- Created vitest.config.js: fileParallelism=false and verbose test reporting.
- Created docs/TEMPORARY_SHORTCUTS.md: TS-001, TS-002, TS-003 and removal criteria.
- Created docs/PROJECT_STATUS.md: existing milestones, completed Phase 1, upcoming phases in the requested order.
- Created docs/phase1-tests.txt: actual final npm test output, including test names/counts.
- Created docs/PHASE1_REPORT.md: this report, audit, baseline, full final output and curl example.

## Existing tests and behavior changes
All 36 existing tests are unchanged, with no loosened thresholds/tolerances; git diff for the four original test files is empty. No original test required changes.
The intended API changes reject previously accepted server-controlled fields. Shared metadata now enforces fabricType <=50 and grain angle <180. Calibration rejects collinear corners and area <=1%, enforcing the requested convexity and strictly greater than 1% rule.
Confirmation now snapshots any existing geometry, including drafts (necessary for requested test 10). Frozen-fabric checks precede body validation; a missing existing ID now returns 404 before photo/body validation in analyze-photo and before body validation in confirm-geometry. Multer upload rejection still happens before route handling.
Code-writing mistakes caused intermediate failed runs (undefined fabric at route load, then missing calibration helper functions); both were corrected. The final run below passed. No existing tests were weakened to fix those failures.

## Differences and limits
No frontend, authentication, new dependency, commit, push, or later phase was added. app.js, server.js, geometry code, vision code and package.json remain unchanged.
The specified history sequence requires archiving the PUT-created draft on confirmation; this extends the previous confirmed-only archival behavior. No other requested feature was omitted.
The full output is preserved below and in phase1-tests.txt; the PowerShell capture includes its NativeCommandError formatting around stderr output. The final process exit code was 0. The simulated database-failure log is expected from the cleanup test.

## Ready-to-run Windows example
From the project root, with the server running on port 3000 (the example itself was not sent, to avoid adding a persistent fabric):
```powershell
curl.exe http://localhost:3000/api/fabrics/from-photo -F "photo=@data/test/TEST1.png" -F "name=TEST1 fabric" -F "fabricType=cotton" -F "massGrams=25" -F "markerCornersPx=[[278,229],[1011,226],[1018,979],[282,979]]" -F "markerSizeCm=10"
```
Both calibration fields are developer-only TEMPORARY inputs (TS-001); automatic Borsal marker detection is planned.

## Remaining risks
- TS-001 manual calibration and the uniform-background/inside-marker assumptions remain; the photo result is approximate and needs explicit geometry confirmation.
- TS-002 manual creation and TS-003 open access remain intentionally available for development. Restrict them before approval/inventory phases.
- Filesystem and MongoDB writes are not one atomic transaction: ordinary database-create failures clean up the photo, but a process crash can leave an orphan. A cleanup failure is logged by error code.
- Existing read-modify-save endpoints do not serialize simultaneous requests; concurrent updates/reservations need atomic concurrency controls before inventory workflows.
- Existing original tests still use the configured database name plus -test and can leave their original upload artifacts; they were not changed or cleaned against existing data. The new suite uses its own isolated, cleaned storage.
- Replica-set transaction and Cloudflare spike milestones were recorded from existing project artifacts; those external checks were not rerun in this phase.
- AGENTS.md was already present and remains untouched (Git lists it as untracked). Git was available at C:/Program Files/Git/cmd/git.exe; git diff --check passed, with LF/CRLF informational warnings.

## Full final npm test output (exit 0)
```text

> borsal@1.0.0 test
> vitest run


 RUN  v5.1.0 E:/Borsal project/The_Project/borsal

 ✓ src/vision/extractContour.test.js > Fabric contour extraction (src/vision/extractContour.js) > A) SYNTHETIC GROUND-TRUTH: 400x300 px rectangle on yellow background 1600ms
 ✓ src/vision/extractContour.test.js > Fabric contour extraction (src/vision/extractContour.js) > B) SYNTHETIC CONCAVE: L-shaped fabric 758ms
 ✓ src/vision/extractContour.test.js > Fabric contour extraction (src/vision/extractContour.js) > C) NOISE & FRAYED THREADS: robustness against channel noise and thin thread protrusions 1060ms
 ✓ src/vision/extractContour.test.js > Fabric contour extraction (src/vision/extractContour.js) > D) FAILURE: image with only background (no fabric) returns ok:false without throwing 650ms
 ✓ src/vision/extractContour.test.js > Fabric contour extraction (src/vision/extractContour.js) > E) REAL IMAGE: TEST1.png plausibility checks 933ms
node.exe : stderr | src/routes/fromPhoto.test.js
At line:1 char:1
+ & "C:\Users\Seif\AppData\Local\fnm_multishells\1968_1794439523981/nod ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (stderr | src/routes/fromPhoto.test.js:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
◇ injected env (3) from .env

 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > registers TEST1 only after analysis, with one document and a contained photo 2013ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects missing photo without persistence 33ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects unsupported MIME without persistence 14ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects photo over 10 MB without persistence 68ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects fake PNG without a document or file 26ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects missing name without a document or file 16ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects out-of-bounds corners without a document or file 14ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects background-only extraction without a document or file 62ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects negative mass without persistence 17ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects grain over range without persistence 13ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects grain at 180 without persistence 11ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects empty name without persistence 11ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects non-number mass without persistence 11ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects infinite mass without persistence 11ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects long fabric type without persistence 10ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects invalid corners JSON without persistence 10ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects missing marker size without persistence 13ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects nonconvex corners without persistence 13ms
stderr | src/routes/fromPhoto.test.js > Phase 1 image-first registration > removes the photo if document creation fails
Unexpected error in POST /api/fabrics/from-photo: Error

 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > treats optional empty multipart values as absent 81ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > removes the photo if document creation fails 58ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 image-first registration > rejects server fields on photo registration with their names and no persistence 12ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 consistency guards > returns AVAILABLE for a raw legacy document on both read endpoints 28ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 consistency guards > archives replacement analyses and keeps geometry unchanged, including after confirmation 259ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 consistency guards > freezes every geometry write for RESERVED fabrics 52ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 consistency guards > freezes every geometry write for CONSUMED fabrics 49ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 consistency guards > rejects client-supplied server fields on manual creation 10ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 consistency guards > rejects confirmed:true on PUT without changing the document 21ms
 ✓ src/routes/fromPhoto.test.js > Phase 1 consistency guards > archives confirmed and draft geometry with monotonically increasing versions 1, 2, 3 58ms
stderr | src/routes/fabrics.test.js
◇ injected env (3) from .env

 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/analyze-photo > Returns 200 with widthCm 7.5..9.5 and does NOT modify geometry 1802ms
 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/analyze-photo > Rejects a text file renamed to .png with 400 24ms
 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/analyze-photo > Returns 400 when markerCornersPx field is missing 23ms
 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/analyze-photo > Returns 400 when a corner is outside image dimensions 21ms
 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/analyze-photo > Returns 404 for a non-existent fabric id 9ms
 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/confirm-geometry > Returns 200, sets status CONFIRMED, geometry.confirmed true, version 1 30ms
 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/confirm-geometry > Returns 400 and saves nothing for a bow-tie (self-intersecting) polygon 21ms
 ✓ src/routes/fabrics.test.js > POST /api/fabrics/:id/confirm-geometry > Confirming twice bumps version to 2 and geometryHistory has 1 entry 44ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Rectangle [[0,0],[20,0],[20,30],[0,30]]: area 600, width 20, height 30, valid 4ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Triangle [[0,0],[10,0],[0,10]]: area 50, valid 1ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > L-shape (concave) [[0,0],[20,0],[20,10],[10,10],[10,30],[0,30]]: area 400, valid, bounding box 20 x 30 1ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Bow-tie (self-intersecting) [[0,0],[10,10],[10,0],[0,10]]: invalid, error mentions self-intersection 1ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Edge case 1: Non-adjacent collinear edges that overlap are rejected as a self-intersection 1ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Edge case 2: A non-adjacent edge touching another edge's vertex is rejected as a self-intersection, while normal adjacent edges remain valid 1ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Edge case 3: A hole touching the outer polygon boundary is rejected as invalid geometry, even if touching at only one point 1ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Collinear points [[0,0],[10,0],[20,0]]: invalid because of zero area 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Fewer than 3 points: invalid 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > A point containing NaN: invalid 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Duplicate consecutive points: invalid 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Clockwise rectangle: signedArea is negative, and normalizeToCounterClockwise makes it positive 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Rectangle with a valid hole [[5,5],[10,5],[10,10],[5,10]] inside [[0,0],[20,0],[20,30],[0,30]]: valid, netAreaCm2 = 600 - 25 = 575 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Hole outside the outer polygon: invalid 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > Hole crossing the outer edge: invalid 0ms
 ✓ src/geometry/polygon.test.js > Polygon geometry and validation > pointInPolygon: one point inside the L-shape, one in its missing notch (outside), one far away 0ms
 ✓ src/geometry/homography.test.js > Homography and Scale Calibration > 1. Pure scaling: marker 10 cm drawn as 200x200 square maps correctly and has near zero skew 4ms
 ✓ src/geometry/homography.test.js > Homography and Scale Calibration > 2. Translation and rotation: a marker rotated 90 degrees maps corners consistently 1ms
 ✓ src/geometry/homography.test.js > Homography and Scale Calibration > 3. Perspective (tilted camera): maps quadrilateral corners to targets with < 1e-6 error, centroid inside square, skew > 0.05 1ms
 ✓ src/geometry/homography.test.js > Homography and Scale Calibration > 4. Round trip: invertHomography takes (5,5) cm back to pixel and forward again to (5,5) 1ms
 ✓ src/geometry/homography.test.js > Homography and Scale Calibration > 5. Real-use example: marker calibrates fabric polygon to 30 cm x 25 cm with area 750 cm2 1ms
 ✓ src/geometry/homography.test.js > Homography and Scale Calibration > 6. Degenerate input: three collinear points, duplicates, fewer than 4 points, and NaN throw 3ms
 ✓ src/geometry/homography.test.js > Homography and Scale Calibration > 7. applyHomography on a point that maps to infinity throws 1ms

 Test Files  5 passed (5)
      Tests  64 passed (64)
   Start at  01:25:25
   Duration  14.05s (tests 82%, import 18%)

    Isolate  5 workers spawned · ~229ms startup each (spawn + environment, per file)
             at least ~914ms faster with isolate: false — reuses workers across files instead of one per file
```
