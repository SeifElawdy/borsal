# Phase 6H.1 — Unified dark experience and motion

Phase 6H audit passed **665/665 tests**, dependency/secret/whitespace checks, and preservation of all 81 AI campaign/ledger artifacts. Committed as **`75aa303`**, `feat: add guided creation studio`. Current branch: **`feature/unified-dark-motion`**. Phase 6H.1 remains uncommitted; no push/merge or Phase 6I work.

## Launch

Run **`npm run mvp`** from the repository root. Open **http://127.0.0.1:5173**. Existing MongoDB/local configuration and client dependencies are unchanged. The isolated test workspace, saved concepts/proposals, review histories and browser resume keys were preserved. No new dependencies or backend/API/model changes were made.

## One visual system

`client/src/tokens.css` centralizes surfaces, text, borders, focus, PASS/FAIL/UNVERIFIED colors, type, spacing, radii, shadows and transition timing. Every route/stage, form, dialog, inspector, table, project archive and disabled control now uses charcoal/deep-violet surfaces, off-white text and restrained lime actions. The old light-workspace switch is removed. The `precision-experience` class now identifies contextual tooling only; it is never a light theme.

Technical image/SVG canvases retain a controlled neutral background so the original drawings and source photographs remain readable. White pixels in an existing photo/SVG are evidence assets, not bright application cards or fabricated product images.

| Text | Implemented scale |
| --- | --- |
| Main workspace heading | 38–42px; 32–34px on narrower layouts |
| Section heading | 24–28px; product titles wrap naturally |
| Body | 16–18px, with comfortable line-height |
| Buttons/navigation | 14–17px |
| Labels, helper text, badges, technical IDs | At least 14px |

No whole-page scaling or zoom was used. Long source names, proposal titles and hashes wrap; source-run options use concise explicit IDs rather than clipping long hashes. Disabled controls remain readable and explain their gates. Nine normal-text foreground/background pairs, including PASS/FAIL/warning states, meet **at least 4.5:1** token contrast. This is targeted accessibility verification, not a claim of comprehensive WCAG certification. Historical exported SVG typography was not rewritten; the UI adds readable actual placed bounds/area/rotation alongside zoom/pan tools.

## Motion and interaction

- Shared `motion.mjs` spring/stagger settings coordinate welcome typography, source-image entrance, workflow stages and contextual inspectors. There is no decorative infinite-motion background.
- The stepper has animated completed connectors, a shared moving active indicator and spring emphasis. Completed, blocked, failed and unverified states remain backend-derived presentation states.
- Concept cards enter with a stagger and spring on hover/tap; selection feedback, buttons, badges and toasts animate without invoking API calls.
- Sidebar expansion changes workspace space smoothly, with an explicit accessible toggle. No hover-triggered layout shifts are required.
- Dialogs have real entrance **and exit** lifecycles, current close callbacks, focus trapping/restoration and Escape support. Exiting overlays cease intercepting clicks.
- Canvas zoom, keyboard pan and fit/reset use springs; direct pointer dragging tracks without spring lag. Image/contour comparisons cross-fade. Fullscreen supports Escape, trapped keyboard traversal and focus restoration.
- Loading skeletons animate only while their real operation is pending. No invented percentages, automatic retries or background provider calls were added.
- `MotionConfig reducedMotion="user"`, explicit reduced-motion canvas handling and the CSS media preference remove transform motion appropriately. Keyboard focus has a high-contrast visible outline.

Actual browser samples show stage translation/opacity settling to `none`/1; zoom progressing from about 1 to **1.25**; keyboard pan moving the canvas **20px**, fit returning it to **0px**; gallery hover reaching **−6px**; reduced-motion stage transform `none`. Modal focus trap/restore, fullscreen Escape, navigation expansion and native Tab focus all passed.

Native testing also found and fixed retained landing scroll when Start Creating changed the upload substage without changing its numeric stage. That transition now restores the top of the workspace. Toasts were moved away from the measurement inspector and pass pointer events through except their dismiss control.

## Actual verification

- Focused presentation/accessibility/local-API suite: **24/24** (existing 14 plus ten new contrast/type checks).
- Full regression: **675/675**, 37 files, with existing tests/thresholds unchanged.
- React production build passed; client dependency audit reported **zero vulnerabilities**. Credential and Git whitespace checks passed.
- An earlier run during concurrent screenshot capture had two unchanged API tests hit the existing 5-second timeout: `keychainMvp.test.js` concurrent refresh and `technicalProposals.test.js` authored proposal persistence. No timeout/assertion was weakened. Both complete files subsequently passed **31/31** on their own; the separate full suite passed **675/675**. Concurrent capture is an observed circumstance, not a proven root-cause diagnosis. The original failure log is retained as `data/phase6h1-regression-concurrent-timeouts.log`.
- Real Edge checks use native mouse input with hit-testing, actual multipart/API calls, keyboard events and isolated TEST_FIXTURE records. They cover upload → explicit confirmation → labeled MOCK concepts → human drafting approval → authored technical proposal → SVG/nesting → honest preview state → prototype review/inventory, plus reload/resume, source refresh/re-review, preserved historical proposals and malformed-image recovery.
- **64** both-width visual audits found zero text below 14px, zero bright application panels and zero horizontal page overflow. The audit includes rendered, non-collapsed text beyond the viewport. **70 screenshots** include all major stages at **1440px and 1920px**, plus full-page and interaction states. Zero JavaScript exceptions and zero Cloudflare requests were recorded. Native Tab focus was additionally checked in a fresh read-only browser run.

The demonstrated authored test pattern still yields geometry **PASS**, nesting **LAYOUT_FOUND**, **34.5581%** utilization and overall **UNVERIFIED**. It is the existing reference key-fob geometry, not proof that a selected Petal Cable Nest concept is fully engineered. Physical and creative-coverage uncertainties remain recorded. Prototype review reserves nothing; no real inventory or source records were changed.

## Screenshots and reproduction

Main evidence directory: **`data/local-mvp/dark-motion-check-1794604661478/`** (`report.json`). Each name below exists with both `1440-` and `1920-` prefixes:

| Stage | Screenshot suffix |
| --- | --- |
| Welcome | `creation-landing.png` |
| Upload | `fabric-upload.png`, `upload-preview.png` |
| Analysis/confirmation | `fabric-analysis.png`, `confirmation-gate.png` |
| Ideas/selection | `ai-ideas.png`, `concept-gallery.png`, `concept-hover.png`, `concept-selection.png` |
| Draft/pattern/nesting | `technical-drafting.png`, `technical-pattern.png`, `nesting.png` |
| Product preview | `product-preview.png`, `preview-source-compare.png`, `fullscreen-source.png` |
| Review/inventory | `review-readiness.png`, `prototype-reviewed.png`, `fixture-stock.png`, `inventory-history.png`, `reservation-details.png` |
| Resume/source/version/failure | `resumed-pattern.png`, `historical-version-access.png`, `stale-source-guard.png`, `upload-failure.png`, `reopened-project.png` |
| Navigation/projects | `navigation-expanded.png`, `project-overview.png`, `keyboard-back-navigation.png` |

Fresh native-Tab/scroll-restoration evidence after the final small UX correction: **`data/local-mvp/dark-motion-check-1794605244387/keyboard-report.json`**, with `1440-keyboard-focus.png`, `1920-keyboard-focus.png` and updated upload/welcome captures. Screenshots were visually inspected against the Phase 6H dark landing and earlier light workspaces; the small type/light-panel discontinuity is removed.

Reproduce with the local server running: **`node scripts/check-dark-mvp.cjs`**. This reuses the existing guided browser harness and adds both-width captures, font/surface/overflow audits and motion/keyboard checks. It requires installed Microsoft Edge and writes only clearly labeled records in the isolated demo database. `--keyboard-only` checks native Tab navigation without creating fabric/concept/proposal records. All screenshots/browser profiles/results remain ignored by Git.

Logs: `data/phase6h1-baseline.log`, `data/phase6h1-focused-final.log`, `data/phase6h1-timeout-recheck.log`, `data/phase6h1-regression-final.log`, `data/phase6h1-regression-release.log`, `data/phase6h1-browser-final.log`, `data/phase6h1-keyboard-final.log`.

## Remaining limits

No blocking UI defect was observed in the tested Edge desktop flows. Mobile redesign, other-browser coverage and a full assistive-technology audit remain outside this verification. Long evidence/history views intentionally scroll. Product imagery remains honestly unavailable until separate inference authorization, account Free-tier verification and the protected preview integration exist. Genuine physical/material evidence and stock are still required by the unchanged production gate.

**Zero Cloudflare requests; shared usage remains 12/20. All 81 prior campaign/ledger hashes remain unchanged.** No manufacturing approval, real inventory reservation, public deployment or paid service activation occurred.
