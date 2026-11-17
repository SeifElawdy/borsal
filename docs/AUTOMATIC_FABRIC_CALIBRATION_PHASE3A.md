# Phase 3A: offline automatic fabric-mat calibration

Scope: automatic fiducial recognition, pixel-to-centimeter calibration and an optional offline physical-test measurement report. No endpoint, production model, fabric contour algorithm, inventory or AI changes. Physical accuracy is UNVERIFIED. There are no Cloudflare calls. Phase 2B closeout commit: `7ad1892`; working branch: `feature/automatic-fabric-calibration`.

Phase 3B update: the API integration described at the end now extends from-photo; the Phase 3A offline scope and earlier execution records below are historical. Physical accuracy remains unverified.

## Recommended MVP default: A4 preset

**A4 is now the primary practical test mat**, for small scraps only. It is not a long-term size limit or a solution for large fabric pieces. No real printed-mat accuracy has been established.

Printable file: **E:\Borsal project\The_Project\borsal\experiments\automatic-calibration\mat-a4.svg** ([open the A4 master](../experiments/automatic-calibration/mat-a4.svg)). The old mat-40cm.svg remains unchanged as the larger alternative. The A4 file is deterministic vector artwork, not an AI image.

| Property | a4 (default) | large (retained) |
| --- | --- | --- |
| Page width x height | 21 x 29.7 cm, portrait A4 | 50 x 50 cm |
| Square marker-center reference span | 16 x 16 cm | 40 x 40 cm |
| Complete marker width/height | 2 x 2 cm | 4 x 4 cm |
| Marker centers on page | (2.5,6.85), (18.5,6.85), (18.5,22.85), (2.5,22.85) cm | (5,5), (45,5), (45,45), (5,45) cm |
| Inner marker-free square used by extraction | 12 x 12 cm | 32 x 32 cm |
| Recommended initial fabric bounding box | Up to about 10 x 10 cm with clearance | Up to about 28 x 28 cm with clearance |

The physical origin remains marker 0's center, regardless of the extra white page margins. A4 uses square calibration references centered on a rectangular page; **29.7 cm paper height is not the reference span**. All four marker codes/orientations are unchanged. Each A4 marker has 6 x 6 cells, about 3.333 mm per cell. Marker edges stay 1.5 cm from the left/right paper edges, with additional white space above and below. All markers and their white quiet zones must remain fully visible.

### Print and ruler-check A4

Open the existing SVG in an application that preserves physical SVG dimensions. Select **portrait A4, 100% / Actual Size, no Fit to Page, no shrink/stretch**. Disable browser headers/footers and scaling; if margins force resizing, use an SVG-capable print tool instead. No tiling, large-format printer or mat regeneration is required. Do not print a screenshot or resize the master to match a screen view.

Before photography, independently ruler-check each marker's 2 cm outer width and height, both horizontal and vertical 16 cm reference spacings, and both diagonals (theoretical length 16*sqrt(2) cm). Record actual readings, ruler resolution, print settings and method. Check both axes to catch nonuniform printing. Uniform mis-scaling can still pass marker detection: reject a known wrong-scale print and do not interpret decoded IDs as a successful ruler check.

Place one small flat fabric scrap entirely inside marker-coordinate x/y **2..14 cm**, the 12 cm inner square. For initial tests keep it within **3..13 cm** on both axes, leaving about 1 cm clear background on each side: a practical 10 x 10 cm bounding-box limit. On the page this recommended area is x 5.5..15.5 cm, y 9.85..19.85 cm. Keep fabric, frayed threads and fingers away from every marker. Larger pieces or rotated pieces whose bounding box exceeds this area need a larger mat. Start with dark hole-free fabric on the white field; pale fabric, holes, multiple pieces, wrinkles and strong shadows remain limitations.

Take a near-top-down photo of the entire sheet with all four markers visible, sharp and comfortably larger than the existing 24-pixel minimum. Keep the original photo. Test several small sizes and orientations; compare width/height in mat axes, not rotated edge lengths. Repeat with reasonable lighting changes. Covered corners, missing markers, cropped tags and inconsistent dimensions must still fail safely with no fabricated dimensions.

### A4 offline commands and metadata

From the repository root, create a private test folder and copy the existing null-reference template once per image:

~~~powershell
New-Item -ItemType Directory -Path data/physical-calibration -Force
Copy-Item experiments/automatic-calibration/physical-observations.template.json data/physical-calibration/a4-001-observations.json
# Put the real camera image at data/physical-calibration/a4-001.jpg.
# Enter genuine ruler readings/methods, 16 cm span / 2 cm marker print checks and conditions in the copied JSON.
node experiments/automatic-calibration/run.js detect --preset=a4 --image=data/physical-calibration/a4-001.jpg --output=data/physical-calibration/a4-001-markers
node experiments/automatic-calibration/run.js measure --preset=a4 --image=data/physical-calibration/a4-001.jpg --observations=data/physical-calibration/a4-001-observations.json --output=data/physical-calibration/a4-001-result
~~~

Choose a new output directory on every run. detect saves result.json and overlay.png; measure saves measurement-report.json, oriented.png, overlay.png and, when extraction is attempted, fabric-overlay.png and fabric-mask.png. Known references remain user-supplied; absent readings or failed detection yield null comparisons. All results remain physically UNVERIFIED.

The CLI defaults to a4 when no preset/dimensions are supplied. Passing --preset=a4 explicitly is recommended for reproducibility. Metadata is recorded in result.json at profile and in measurement-report.json at detection.profile: preset, page.widthCm, page.heightCm, spanCm, markerSizeCm and layout version. Failure reports retain this metadata too. Named presets and explicit dimensions cannot be mixed; partial explicit dimensions and unknown presets are rejected.

Larger and custom workflows remain supported:

~~~powershell
node experiments/automatic-calibration/run.js detect --preset=large --image=data/large-photo.jpg --output=data/large-markers
node experiments/automatic-calibration/run.js detect --span-cm=60 --marker-cm=6 --image=data/custom-photo.jpg --output=data/custom-markers
# Optional export to a NEW filename; the existing printable A4 master already exists.
node experiments/automatic-calibration/run.js print --preset=a4 --output=data/another-a4.svg
~~~

Explicit dimensions retain the earlier square-paper construction and are labeled custom; existing known square profiles, large artwork and physical origin remain compatible. New named paper sizes can be added to the preset table with explicit page dimensions, square reference span and marker width, then validated with renderer/detector/report tests. Rectangular *reference* spans would require a separately tested homography/ROI extension; rectangular A4 paper does not claim that capability.

No detector thresholds, corner-completion logic or geometry tolerances were loosened for A4. The existing 2 cm marker minimum, 24-pixel image-side minimum, exact codes, all-four-marker rule and 8%-of-marker-width layout residual guard remain. Keeping the square 16 cm reference lets the existing square homography and inner-ROI logic work unchanged. The marker-size residual guard becomes 0.16 cm for A4 (versus 0.32 cm for large); neither is a physical accuracy claim. Extraction retains its 0.6 cm near-edge rejection and existing ROI shrink, hence the conservative small-fabric recommendation.

The following large-mat sections and older execution results are retained as alternative-profile/history details; their 40/4 and 50 cm numbers do NOT apply to A4. Use the A4 instructions above for new MVP trials.

## Large-mat background and printing

The experimental `borsal.mat/0.1` mat has four uniquely coded black-and-white square fiducials at the perimeter of a plain white measurement field. IDs 0/1/2/3 identify physical top-left/top-right/bottom-right/bottom-left, independently of photograph rotation. Each marker contains a 4x4 binary payload and one-cell black border (6x6 cells overall). The small custom dictionary is NOT ArUco and is not compatible with ArUco printed tags. Its 16 rotated variants have minimum Hamming distance six; detection requires exact matching and does not correct damage.

The installed OpenCV.js runtime was checked: `findContours` and `warpPerspective` exist, while `aruco` and `ArucoDetector` are undefined. This motivates a narrow coded-square prototype without a dependency or runtime replacement. Binary-square candidate extraction, perspective normalization, border checks and orientation decoding follow the general approach described in [OpenCV's fiducial documentation](https://docs.opencv.org/4.x/d5/dae/tutorial_aruco_detection.html); contours use [the existing OpenCV.js API](https://docs.opencv.org/4.x/d5/daa/tutorial_js_contours_begin.html). The implementation is a conservative experiment, not evidence of production-grade recognition reliability or an implementation of the full ArUco detector.

Retained large-preset print example: marker-center spacing **40 cm**, each complete marker **4 cm** wide, paper **50 x 50 cm**. The SVG has explicit centimeter dimensions. The physical origin is ID 0's center; centers are (0,0), (40,0), (40,40), (0,40) cm. On the page these centers sit at (5,5), (45,5), (45,45), (5,45) cm. All payloads have the same printed orientation. No hidden physical dimensions are derived from the photograph.

- Print the SVG on matte white stock at **100% / actual size**, never fit-to-page. A large-format printer is preferred. If tiled, prevent overlaps, gaps, stretching and nonuniform scaling; reject a visibly distorted assembly.
- Measure the center-to-center spacing in both axes and both diagonals with a physical ruler. Verify the 4 cm outer marker widths and equal horizontal/vertical scale. Reprint if the chosen profile does not match. A wrong uniformly scaled print cannot be diagnosed from image recognition alone.
- Mount the entire mat flat. Preserve at least one white cell of quiet space around every marker. Keep the mat larger than the fabric, with every marker corner and border completely visible.
- For the 40/4 example keep fabric inside x/y **4..36 cm** in marker-center coordinates: a conservative 32 x 32 cm work area. This is a placement instruction, not an implemented fabric-containment check. The marker detector alone does not detect fabric or enforce this area; the optional offline measure command is described below.
- Different sizes are explicit profiles, e.g. spacing 60 cm and marker width 6 cm produce a 75 cm page and a conservative 48 cm work area. Supply the matching dimensions to both print and detection. Do not scale a print and keep the old profile.
- Photograph nearly top-down with the full mat in frame, diffuse light and a flat scrap. Avoid glare, motion blur, strong shadows, wrinkles and extreme foreshortening. Each marker should occupy comfortably more than 24 pixels per side; substantially larger is preferable for real trials.

## Files and offline usage

Under `experiments/automatic-calibration/`:

- `mat.js`: versioned physical profile, four payloads, exact rotation decoder and physical SVG renderer.
- `detect.js`: observed quadrilateral detection, code decoding, shared homography calibration and overlay.
- `run.js`: explicit print/detect CLI, refusing to overwrite output files/directories.
- `calibration.test.js`: generated synthetic and existing-image regression cases; no external service or database.
- `mat-40cm.svg`: printable default profile; no AI-generated content.

From the repository root in PowerShell:

```powershell
# Choose a new output filename; the checked-in example is already available.
node experiments/automatic-calibration/run.js print --span-cm=40 --marker-cm=4 --output=data/my-mat-40cm.svg
node experiments/automatic-calibration/run.js detect --span-cm=40 --marker-cm=4 --image=data/my-real-mat-photo.jpg --output=data/my-calibration-result
npx vitest run experiments/automatic-calibration/calibration.test.js
```

The CLI needs known physical dimensions, never manually entered `markerCornersPx`. Successful image recognition provides all marker IDs, observed image corners, projectively computed centers, approximate pixels/cm and a homography `H` mapping oriented image pixels to cm. Units, physical origin, rejection counts and corner residuals are explicit. Detection uses Sharp EXIF orientation normalization, so returned pixels and overlays correspond to that normalized image. Maximum input size is 24 million pixels; the detector does not silently resize it.

Failures leave `calibration: null`, preserve only actually decoded markers and provide reasons: `ALL_FOUR_VISIBLE_MARKERS_REQUIRED`, `DUPLICATE_MARKER_ID`, `MARKER_LAYOUT_OR_PHYSICAL_DIMENSIONS_INCONSISTENT` or `DEGENERATE_MARKER_LAYOUT`. Invalid image/profile arguments fail with an error; the CLI exits 1. A recognized-image calibration failure writes JSON and a failure overlay and exits 2. The detector does not complete missing IDs or estimate covered corners from their expected locations.

## Detection and validation boundary

1. Sharp produces oriented grayscale pixels. Existing `src/vision/opencv.js` loads OpenCV; Otsu thresholding and contour approximation produce convex quadrilateral candidates. Very small, clipped and severely distorted candidates are rejected.
2. Warp each observed quad to a 60 x 60 patch, require contrast and unambiguous cell samples, validate the black border, then match the exact payload over four rotations. Reorder corners by decoded orientation. Unknown, damaged or ambiguous codes are rejected, not corrected.
3. Require exactly one detection of every ID. Compute each observed marker center projectively from its detected corners; no mat corners are inferred from invisible features.
4. Reuse `computeScaleInfo` / `computeHomography` from the existing homography module. The known square **center spacing**, not marker width or page width, defines the four-center fit. Check the resulting transform against all 16 independently observed marker corners and their known marker widths. Maximum corner residual must be <= 8% of marker width; this is a synthetic consistency guard, not a real-world accuracy tolerance.
5. Return `EXACT_CODES_AND_LAYOUT_CONSISTENT` only when all checks pass. This diagnostic is **not a probability or calibrated confidence score**. `physicalAccuracy` remains `UNVERIFIED`. Pixels/cm is an approximate summary under perspective; use `H` for position-dependent conversion.

The overlay outlines decoded markers, labels IDs and displays prototype/failure status. Partially detected markers remain orange on failures; successful sets are green. It does not draw guessed or concealed markers.

## Offline evidence

Synthetic fixtures render the printable SVG with an irregular fabric-shaped polygon in the central field. Tests cover code separation, exact decoding, centimeter mapping, 90/180/27-degree rotations, an alternative mat size, mild perspective, partially hidden payload/border, a hidden corner, a fully hidden marker, cropped perimeter, duplicate IDs, inconsistent dimensions, blank images, invalid input/profile values and decodable success/failure overlays. Existing `data/test/TEST1.png` is reused as a negative case: its old manual marker is not this coded mat, so no calibration is invented.

Actual focused/full results and saved debug artifact paths are appended after execution below. Synthetic checks do not establish printed dimensions, lens distortion, repeatability, material planarity or fabric measurement accuracy.

## Limitations and first physical trial

The dictionary is small and experimental. Uneven illumination, false-positive texture, severe perspective, small tags, damage, lens distortion, mirror images and print artifacts are not comprehensively benchmarked. Exact matching favors false-negative failure over guessing. Passing sampled cells cannot prove every border pixel is uncovered. Four-marker visibility and independent marker-size/layout agreement are mandatory, but neither provides a real-world error bound. No error correction, camera intrinsic calibration, subpixel refinement, robust outlier fitting or partial-board recovery is implemented.

For the first physical trial:

1. Print, ruler-check and photograph the actual mat before fabric is added. Record printer settings, measured spacings/widths, camera settings and profile. Keep original photographs.
2. Place a flat independently measured rectangle and then an irregular scrap inside the work area; ensure markers stay uncovered. Include ruler-measured test distances in multiple positions and directions. Do not use only the marker centers as accuracy evidence because they fit the homography.
3. Run the offline CLI on repeated top-down and mildly rotated photographs. Inspect the overlay and compare transformed independent check points/distances against ruler measurements. Log all failures and errors, not just best examples. No accuracy acceptance threshold has been established yet.
4. Repeat at edges, under realistic lighting and with intentional marker occlusion. Occlusion must fail without dimensions. If precision is inadequate, investigate print scaling, lens distortion, corner localization and fabric/mat planarity before integration.

Next milestone: a reviewed physical-print dataset with independent measurements and an agreed error budget. Only then design production integration into the fabric extraction pipeline. Its current square ROI would include perimeter markers if fed the marker-center quadrilateral directly; use a verified inner fabric ROI and preserve the calibrated origin/transform rather than blindly passing corners into extraction. Keep TS-001 developer calibration in current endpoints until physical validation and an integration task are explicitly authorized. No API integration or manufacturing engine is started here.


## Actual execution results

- Phase 2B baseline: 253/253 tests, 13 files, 71.32s. Safe-fixture closeout regression: 253/253, 13 files, 31.27s; follow-up line-ending portability check: 17/17 concept tests. Closeout committed as 7ad1892 before creating the requested branch. No push, merge or history rewrite.
- Phase 3A initial focused suite: 17/17 passed. Final focused suite after adding hidden-corner and cropped-frame cases: **19/19 passed**, 1 file, 2.95s.
- Final full npm test: **272/272 passed**, 14 files, 32.98s. All 253 prior tests pass. Production source/dependencies/test configuration are unchanged on this branch. Tests used the verified test-only databases and temporary upload directories; no production database operations were performed.
- End-to-end offline CLI: printed experiments/automatic-calibration/mat-40cm.svg, rasterized a synthetic irregular-scrap scene and detected four markers successfully. Reported scale: **16 px/cm**; maximum observed-corner consistency residual: **0.04419417382416927 cm**. This residual is synthetic self-consistency, not measured physical error.
- Local debug artifacts: [synthetic input](../data/automatic-calibration-demo/synthetic-mat.png), [JSON result](../data/automatic-calibration-demo/detected/result.json), [opened and inspected overlay](../data/automatic-calibration-demo/detected/overlay.png). All remain under ignored data/. The overlay visibly labels IDs 0/1/2/3 around the central synthetic fabric shape. These are deterministic programmatic fixtures, not AI images.
- Rechecked all **53** historical inference artifacts/locks against their original stored SHA-256 values: unchanged. Both concept-preview PNGs and notes remain local. No AI requests, production endpoint edits, inventory changes, new dependencies, push or merge.
- Prototype source/tests/docs are left uncommitted for review on feature/automatic-fabric-calibration. Physical mat accuracy remains UNVERIFIED; no fabric API integration has begun.


## Large-mat physical test preparation (alternative profile; no physical results yet)

### Existing printable master: do not recreate

Exact Windows path: **E:\Borsal project\The_Project\borsal\experiments\automatic-calibration\mat-40cm.svg**.

The existing SVG was inspected and retained unchanged: **500 x 500 mm page**, **400 mm marker-center spacing**, **40 x 40 mm complete markers**, approximately 6.667 mm per cell. Marker centers on the page are (50,50), (450,50), (450,450), (50,450) mm. Use the existing file, not a screenshot, browser fit-to-page capture or resized PNG. It is print-ready as vector artwork; it has NOT been physically printed/validated by this task.

Printing routes:

- **Preferred: A1 (594 x 841 mm) or larger**, using an SVG-capable print application or a print shop. Center the entire 500 mm square on the sheet, select 100% / Actual Size and disable all fit, shrink and stretch options. The extra paper margins are harmless. A2 (420 x 594 mm), A3 and A4 cannot contain this square on one sheet at actual size.
- **Home tiled alternative:** use a print application's actual-size poster/tile mode with crop marks, page numbers and approximately 10 mm overlap. If conversion to PDF is necessary, preserve the SVG's 500 x 500 mm document size. On portrait A4 with about 190 x 270 mm usable area, allow roughly **3 columns x 2 rows**; inspect the application's tile preview because printer margins affect page count. Never use multiple-pages-per-sheet or fit each tile independently. Cut one overlapping edge, align matching crop marks, tape from the back and mount on a flat 500 mm square backing. Preserve full markers and quiet zones; discard a stretched/gapped assembly. If your software cannot retain actual size, use the print shop route instead. No PDF generator or printer software was added to the backend.

Before placing fabric, use an independent ruler/tape to check all four marker widths/heights, top/bottom horizontal spacing, left/right vertical spacing and both diagonals. Centers are the geometric midpoints of the printed outer squares; same-side corresponding marker edges also give the 400 mm spacing. The theoretical diagonal is 400*sqrt(2) mm. Record actual readings, ruler resolution and method; these are NOT supplied by the SVG or detector. Reject incorrectly scaled, stretched, warped or poorly assembled prints. Set printScale.status to REJECTED in the observations file for a known bad print. A proportional print shrink can pass recognition with an erroneous absolute scale: recognition is not a print-scale test.

### Physical photo sequence

1. Keep the blank mat flat, take an uncropped baseline photo and record the print checks. The blank image should detect the mat but report no fabric measurement.
2. Start with a single flat, high-contrast dark rectangular fabric piece, without holes, loose threads or wrinkles. Measure it independently with a ruler in cm before photography. Align its sides to the mat's axes so ruler side lengths can be compared directly to reported width/height. Calculate reference area from independently ruler-measured sides only for this rectangle; record that method explicitly.
3. Place all fabric inside the marker-free region x/y 4..36 cm relative to marker 0's center (page x/y 9..41 cm). For the first trial, leave a further 2 cm of clear background on every side: x/y 6..34 cm, a 28 x 28 cm placement area. Do not cover markers, corners or white quiet zones. The mat must remain larger than the entire scrap.
4. Take a near-top-down sharp photo with the entire mat and all four markers fully in frame. Keep lighting diffuse and the camera approximately parallel to the flat mat. Avoid glare, hand shadows and folded fabric. Keep the original image and EXIF metadata. The tool saves an oriented PNG for unambiguous overlay/pixel inspection.
5. Repeat with several fabric sizes, different positions and modest rotations, then reasonable lighting variations. Record image-specific conditions. A rotated fabric's reported width/height are **mat-axis-aligned bounding-box extents**, not necessarily its ruler-measured side lengths. Compare like with like; for angle trials use independent marked mat-axis extents or inspect area instead of equating rotated extents to side lengths. Photograph rotation is handled by marker IDs.
6. For irregular scraps, independently trace onto measured grid paper and count squares (document grid resolution and counting method) if an area reference is needed. Otherwise leave reference area null. Never substitute width*height for irregular-fabric area. Holes are not subtracted by the existing outer-contour extractor: use hole-free pieces initially.
7. Intentionally cover one marker, then only a corner, then crop a marker from frame. Each should produce no fabric dimensions or error percentages. Preserve failures and overlays. Try a knowingly incorrectly scaled print as a **negative** trial: record ruler evidence and set REJECTED. Uniform mis-scaling may still decode all IDs; the tool cannot independently establish physical scale from the image alone. Do not knowingly label a bad print RULER_CHECKED.

### Exact offline commands

Run from **E:\Borsal project\The_Project\borsal**. Put private photographs under ignored data/. First create the parent test folder and copy the blank observations template; keep it specific to each image:

~~~powershell
New-Item -ItemType Directory -Path data/physical-calibration -Force
Copy-Item experiments/automatic-calibration/physical-observations.template.json data/physical-calibration/test-001-observations.json
# Place the actual camera photo at data/physical-calibration/test-001.jpg.
# Edit the copied JSON with genuine ruler readings/methods and photo conditions.
node experiments/automatic-calibration/run.js measure --span-cm=40 --marker-cm=4 --image=data/physical-calibration/test-001.jpg --observations=data/physical-calibration/test-001-observations.json --output=data/physical-calibration/test-001-result
~~~

Use a NEW output directory for each image or rerun; existing results are never overwritten. The original detect command still works unchanged when only marker calibration is wanted:

~~~powershell
node experiments/automatic-calibration/run.js detect --span-cm=40 --marker-cm=4 --image=data/physical-calibration/test-001.jpg --output=data/physical-calibration/test-001-markers
~~~

### Per-image report and files

New isolated files: measurement.js (offline wrapper/report), measurement.test.js, physical-observations.template.json. run.js adds only the measure command and observations argument. This is an offline physical-test adapter, NOT production/API integration: it derives a safe inner square from the detected homography and calls the unchanged existing extractFabricContour. No marker corners are supplied by the user. Existing extractContour, OpenCV, Sharp and pure geometry behavior remain unchanged.

The measure command saves:

| File | Meaning |
| --- | --- |
| measurement-report.json | Image path/hash, profile, all observed marker positions, homography/scale, detector diagnostics, supplied observations, computed dimensions/area or null, comparisons or null, validation, warnings and artifact paths relative to this report |
| oriented.png | EXIF-normalized input used by both detector and extraction |
| overlay.png | Marker/ID calibration overlay, including failure status |
| fabric-overlay.png | Existing extractor's ROI and contour overlay, only if extraction was attempted |
| fabric-mask.png | Existing segmentation mask, only if extraction was attempted |

The original detect command outputs result.json and overlay.png; measure saves the complete marker result under detection in its measurement report instead of duplicating result.json.

The reusable input JSON has these sections:

- reference: widthCm, heightCm, areaCm2 (positive independent readings or null) and method (ruler/grid method, resolution, axis convention and area calculation). A non-null reference requires a nonempty method. Never enter values predicted by the detector as references.
- printScale: PENDING / RULER_CHECKED / REJECTED, horizontalSpanCm, verticalSpanCm, markerWidthCm, method. RULER_CHECKED requires all readings and a method. Put the other edge/marker/diagonal readings and ruler resolution in the method text. This is a user-recorded check, not automatic print approval.
- conditions: lighting, perspective, printScaling (text or null), suspectedIssues (array). Record blur, glare, shadows, wrinkles, assembly seams or nonuniform scaling explicitly.

All reference values in the supplied template are null. All output reports retain status PHYSICAL_ACCURACY_UNVERIFIED. computed contains widthCm, heightCm and areaCm2 only on successful marker detection AND valid contour extraction away from the inner ROI edge. polygonCm uses the original marker-center coordinate system. Width/height are mat-axis bounding-box extents; area is the gross external polygon area. The report deliberately rejects near-edge contours to avoid presenting a clipped region as a full piece; this cannot detect every occlusion or clipping mistake, so inspect overlays.

For each supplied positive reference, errors contains the independent reference, absoluteError = abs(computed-reference), and percentageError = 100*absoluteError/reference. Missing reference values, failed calibration, rejected printing, absent/invalid fabric and near-edge clipping produce null comparisons/dimensions, not zero or invented measurements. PENDING printing may produce experimental computed geometry with an explicit warning, but it is not verified physical measurement. No actual real-world accuracy percentage is reported before real images and independent readings exist.

### Required material for real-world validation

Provide the **original full-resolution photo**, its **per-image observations JSON**, **measurement-report.json**, **marker and fabric overlays** (and mask if available), actual mat ruler readings/print settings, independent fabric references with method/resolution, and condition notes. Include baseline and failed/obstructed trials, not only successes. State whether fabric sides align with mat axes and whether the piece has holes. Agree an accuracy tolerance only after reviewing real evidence; there is no automatic manufacturing or accuracy approval gate.

Known limits remain: uniform incorrect print scale cannot be inferred from appearance; camera lens distortion and nonplanarity are not corrected; light fabrics on white may fail segmentation; only the largest outer contour is measured, small fabric below the existing ROI area threshold can fail, and multiple pieces/holes are not handled as net area. Clipped boundaries, shadows or extra objects can still mislead contour extraction. The printable file remains unmodified. No physical trial was performed by this preparation task. Stop and wait for photographed test results before production integration.

### Preparation verification results

- Focused calibration/report tests: **29/29 passed**, 2 files, 6.81s (19 existing calibration tests plus 10 measurement-report tests).
- Full npm test: **282/282 passed**, 15 files, 38.12s. All previous 272 tests pass; production geometry, endpoints, dependency files and test configuration are unchanged.
- Executed the measure CLI on the existing **synthetic** mat fixture, using the untouched null-reference template. Detection succeeded, report status remained COMPUTED_UNVERIFIED and all three comparison fields were null. Output: data/automatic-calibration-demo/physical-preparation-check/measurement-report.json plus oriented input, marker overlay, fabric overlay and mask. This is a workflow smoke check, not a physical accuracy result.
- Verified the existing printable SVG still exactly matches the original renderer at the 40/4 profile. No replacement mat was created. Reviewed Git status: prior Phase 3A uncommitted changes remain; no commit, push or merge performed. No Cloudflare calls or frontend/new dependencies.
- Waiting for actual printed-mat photographs and independent ruler/grid readings. No real-world accuracy percentages or acceptance claim are available.


## A4 preset verification results

- Before changes: focused **29/29 passed** (2 files, 5.79s); full regression **282/282 passed** (15 files, 31.67s). Test-only database isolation was verified first.
- After changes: focused **42/42 passed** (3 files, 7.74s); full regression **295/295 passed** (16 files, 30.57s). The 13 new preset tests cover page/layout metadata and visible margins, exact A4 artifact, default/explicit CLI selection, selector conflicts, unchanged large artwork, A4 scale and rotations, obscured markers, incompatible profile rejection, report metadata, small synthetic fabric geometry, overlay dimensions and complete preset-based CLI execution.
- All 282 previous tests remain unchanged and pass. No threshold/tolerance was loosened; no production endpoint/geometry modules, dependency files or test database configuration were modified.
- Changed implementation: mat.js adds preset metadata/page-aware rendering; detect.js retains the selected preset in returned metadata; run.js selects A4 by default and accepts --preset. Created mat-a4.svg and presets.test.js. Updated this documentation. Existing mat-40cm.svg is byte-for-byte identical to the retained large renderer, and larger/custom tests still pass.
- A preset describes known configured print geometry, not an independently detected paper size. The program cannot infer actual page dimensions or uniform print shrink from marker codes; independent ruler verification remains mandatory.
- No physical mat was printed or photographed here; no real-world accuracy claim. No Cloudflare calls, frontend, dependencies, commit, push or merge. Wait for actual A4 test photographs and independent readings.

## Self-contained automatic measurement

Normal measurement requires only the photograph and known mat preset; independent observations are optional. No manual marker corners or ruler references are required to run:

~~~powershell
node experiments/automatic-calibration/run.js measure --preset=a4 --image=data/photo.jpg --output=data/photo-result
~~~

Use --preset=large for the retained larger mat. Optional --observations=data/observations.json preserves all existing independent reference, print-rejection and accuracy-evaluation behavior. Without it, reference readings stay null and print scale is PENDING; image-derived dimensions are never copied into ground truth. The program still automatically detects all four markers, calibrates, extracts the inner fabric contour and computes centimeter geometry.

measurement-report.json contains detection markers/profile/homography/diagnostics, computed widthCm/heightCm/areaCm2, polygonCm, validation, explicit failure reason, warnings, limitations and artifact paths. Outputs also include oriented.png, overlay.png and, when segmentation is attempted, fabric-overlay.png and fabric-mask.png. Existing output directories are refused. Calibration/segmentation failure leaves computed and polygonCm null and exits 2; absent independent readings leave error comparisons null. Invalid inputs fail with an error. Physical accuracy remains UNVERIFIED.

Self-contained measurement verification: five new automatic tests passed (2.84s), covering both presets, calibration failure, segmentation failure and the CLI without an observations file. The existing 42 focused cases also passed; the final full suite passed **300/300**, 17 files, 35.07s, including all 47 calibration/measurement cases. Existing assertions/tolerances were unchanged.

Actual synthetic CLI example (NOT physical validation): the existing large-mat synthetic irregular scrap produced computed {widthCm:28.625,heightCm:26.1875,areaCm2:574.3027}, polygonCm with 141 points, observationsFile:null and all error comparisons null. Saved locally under data/automatic-calibration-demo/self-contained-example/. Its dimensions are image-derived output only, never independent ground truth.

Changed for this task: measurement.js (optional input/default null references and report limitations), run.js (optional --observations), automatic.test.js (five new tests), and this documentation. Production source, presets, dependencies and previous results were not modified; no Cloudflare calls, commit or push.


## Phase 3B: automatic image-first API registration

POST /api/fabrics/from-photo now accepts multipart photo, name and **matPreset=a4|large**, plus existing optional fabricType, massGrams and grainDirectionDeg. It needs no database ID, manually entered marker corners or independent ruler observations. A matPreset is explicit for API calls; unlike the offline CLI, the API does not silently select a mat when calibration fields are omitted.

Example from the project root in Windows PowerShell (substitute an actual A4-mat photograph):

~~~powershell
curl.exe -X POST http://localhost:3000/api/fabrics/from-photo -F "photo=@data/physical-calibration/a4-001.jpg" -F "name=A4 cotton scrap" -F "matPreset=a4" -F "fabricType=cotton" -F "massGrams=15.5"
~~~

Use matPreset=large only with the retained 50 cm-page / 40 cm-span / 4 cm-marker layout. A4 remains a small-scrap profile. The service reuses the tested preset/detection/measurement functions under experiments/automatic-calibration rather than duplicating calibration or segmentation logic. These runtime source modules must be included with the backend when deploying this experimental feature; no CLI, network call or CLI filesystem output is invoked.

Flow: validate strict multipart metadata and photo type, decode with a 24-million-pixel safety cap, detect all four coded markers, derive homography, segment the marker-free inner ROI, validate the polygon and reject near-edge clipping. Only after successful measurement is the original, unmodified upload written under data/uploads/<fabricId>/<randomUUID>.<ext>, followed by FabricPiece creation. No photo/document is written on input/calibration/segmentation/geometry failure. Database creation failure removes the newly saved file; partial file-write failure also cleans it up. Previous photos/analysis records are never removed by this path. There is no database/filesystem distributed transaction; crash-orphan recovery remains future hardening, as with the existing upload flow.

Success is 201: fabric plus existing analysisSummary, suggestedPolygonCm, validation and accuracyNote, with calibration evidence for automatic registration. The record is always registrationSource=photo, status=DRAFT, availabilityStatus=AVAILABLE; geometry remains absent/unconfirmed. Existing confirm-geometry is still required to create confirmed geometry. Confirmation is a traceable user decision, not evidence of physical accuracy or manufacturing feasibility.

Analysis stores a fresh crypto UUID analysisId, original photoPath, calibrationSource=auto-marker, suggestedPolygonCm, dimensions/area in stats, warnings and createdAt. calibrationEvidence contains preset name/page/span/marker size, actually detected IDs/corners/centers, H and approximate scale, diagnostic residuals, normalized-image dimensions, original-photo SHA-256, coordinate frame and limitations. Detection coordinates refer to the EXIF-normalized original; stored photo bytes remain original. For backwards-compatible analysis/basis fields on AUTO analyses, markerCornersPx means the detected four-marker CENTER reference square and markerSizeCm means its span, NOT the individual tag width. Actual 2/4 cm tag widths and tag corners are unambiguously recorded in calibrationEvidence.profile and markers.

calibrationEvidence is server-generated, optional in legacy documents, and preserved by the shared Analysis schema in analysisHistory. At confirmation it is deeply copied into geometry.basis, alongside the existing photo/analysis identity and suggestion snapshot. Geometry history retains that basis through existing confirmation/PUT archival paths. The existing analyze-photo endpoint remains legacy/manual in this task; replacing an automatically registered fabric's analysis with it archives the automatic evidence, keeps confirmed geometry unchanged and retains its old photograph/basis.

Failure contract:

- 400: missing/unsupported matPreset without a complete legacy calibration, mixed automatic/manual modes, forbidden fields, missing/unsupported/spoofed/malformed photo or image above the decode cap.
- 422: automatic calibration/segmentation/validation fails. Response has error='Automatic fabric measurement failed', explicit reason, diagnostics, validation and warnings; no invented suggested polygon or summary. Reasons include missing/obscured/duplicate markers, inconsistent layout, absent fabric and near-edge clipping.
- 500: unexpected/persistence failure, generic Internal server error, with newly written-file cleanup.

Legacy TS-001 multipart markerCornersPx + markerSizeCm remains accepted ONLY when matPreset is absent. It is explicitly legacy/developer-only and returns legacyDevOnly=true plus its prior devNotice. That exact historic notice text is retained for backward compatibility (its old 'planned' wording is not the current automatic-preset feature status). Automatic responses do not return that notice. analyze-photo's manual contract is unchanged. These labels are not access control; the existing no-authentication limitation remains.

Physical measurement accuracy is still UNVERIFIED: no real printed-mat dataset was evaluated here. Uniform print scaling, lens distortion, nonplanar fabric, low contrast, contour completeness/holes and user confirmation remain separate limitations. No AI, inventory, frontend or manufacturing functionality is introduced.

### Phase 3B actual verification

- Baseline full suite: 300/300 passed, 17 files, 47.90s; test database isolation verified first.
- Focused API/traceability regression: 57/57 passed, 3 files, 15.60s, including 17 new automatic-registration cases.
- Final full npm test: **317/317 passed**, 18 files, 40.82s. All previous 300 tests remain unchanged and passing. No tolerance/threshold was loosened.
- Tests exercise both mat presets, original byte/hash preservation including EXIF-oriented JPEG, malformed/truncated images, missing/obscured markers, empty/clipped segmentation, invalid/missing/mixed calibration, server-field rejection, database and partial-file-write cleanup, immutable confirmation evidence and preservation in analysis/geometry history. New tests compare serialized evidence across HTTP/DB because JSON represents numeric -0 as 0; they do not change geometry values/tolerances.
- During new-test setup, an overlong generated test database name was corrected to a shorter UUID-suffixed test-only name before successful runs. Tests use a unique temporary upload directory and guarded database/upload cleanup; file parallelism remains disabled.
- Changed src/routes/fabrics.js (strict mode selection and automatic registration), src/models/FabricPiece.js (optional server evidence in analyses/basis), new src/routes/automaticRegistration.test.js, this document, TEMPORARY_SHORTCUTS.md and PROJECT_STATUS.md. Existing offline geometry/detection modules, test files, dependencies, uploads/history and Phase 2B artifacts were not modified by this task. No Cloudflare, AI, frontend, manufacturing engine, commit or push.

## Phase 3C audit follow-up
See [calibration semantics and actual confirmation/concurrency evidence](CALIBRATION_CONFIRMATION_PHASE3C.md). No 40/4 cm metadata mapping defect was found. Existing confirmation and historical-basis rules were preserved; stale-default and generic-500 concurrency behavior are documented blockers for stricter future contracts. No production code or real-inventory sample was changed.

### Current confirmation safety contract
The safety-fix section of CALIBRATION_CONFIRMATION_PHASE3C.md supersedes earlier historical-ID acceptance. New confirmations require the current analysis/basis; existing geometry edits require expectedGeometryVersion. Historical data remains readable and unchanged. Version conflicts now return stable 409 FABRIC_VERSION_CONFLICT, with optimistic/availability-conditional saves on confirmation, reanalysis and geometry PUT. Focused 81/81 and full 333/333 tests passed; physical accuracy remains unverified.

## Phase 3 final closeout
Final regression: **333/333 passed** (20 files, 47.08s). A4 and large masters, automatic measurement/registration, source-photo evidence and confirmation/concurrency safety are included. Local photographs/uploads, generated results, private inference artifacts, credentials and test DB contents remain excluded. Physical accuracy is still **UNVERIFIED**; legacy unversioned unchanged confirmations remain non-idempotent and direct DB writers must coordinate revisions. See the current Phase 3C safety contract. No Phase 4 implementation, push or merge is part of closeout.
