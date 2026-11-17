# Phase 6H — Guided Creation Studio

Phase 6G baseline: **657/657 tests**, dependency audit zero vulnerabilities, secret/diff checks clean and all 81 prior AI campaign/ledger files preserved. Committed as **`c617c7a`**, `feat: add interactive local MVP`. Current branch: **`feature/guided-creation-studio`**. Phase 6H is uncommitted; no push/merge.

## Launch and user journey

Install client dependencies after pulling changes: `npm --prefix client ci` (adds the explicitly requested Motion for React dependency). With the existing MongoDB replica set and local server configuration, run **`npm run mvp`** and open **http://127.0.0.1:5173**. Root dependencies and backend frameworks are unchanged. The launcher continues using the existing isolated test workspace; no database reset or production mutation occurs.

The English-only, LTR default entry is one Creation Studio, not a dashboard of disconnected pages. Its cinematic welcome leads through an explicit **Start Creating** action into eight interactive stages:

1. Drag/drop JPEG or PNG, inspect a local pre-upload preview, select A4/large mat and submit the existing multipart registration API. Busy feedback describes processing without fictional percentages. Successful registration automatically opens analysis.
2. Compare the original source photo and actual calibrated centimeter outline in a zoom/pan/fit/fullscreen viewer. Review dimensions, marker count, reference span, marker size, analysis ID and calibration evidence. Explicit geometry confirmation supplies the current analysis ID and expected geometry version, then advances to ideas. Physical accuracy remains UNVERIFIED.
3. View saved real AI concepts, or explicitly create existing offline MOCK concepts for the selected confirmed source. The latter requires a visible TEST_FIXTURE confirmation dialog and consumes zero model calls. No unrelated images or fabricated concepts appear as live AI output.
4. Compare ideas, inspect source relationships, features, unresolved/accessory requirements and original output. A human records APPROVED_FOR_DRAFTING, REVISE or REJECTED with an authored brief and exact proposal/source hashes. Approval advances to technical drafting; it never grants manufacturing approval.
5. Import explicitly authored technical data or unchanged raw model output through the existing technical API. Existing generation controls remain disabled with specific authorization/eligibility blockers. The authored key-fob reference is optional and labeled; a separate explicit test action loads its unchanged 14 × 4 cm geometry with synthetic material/stock snapshots and binds only the SCRAP references to the selected fabric. This is not AI output or proof of creative fidelity. Invalid/partial submissions remain REJECTED or CONCEPT_ONLY as the backend decides.
6. Inspect actual cutting and nesting SVGs, source photo, explicit BOM, assembly references, utilization and per-layer feasibility. Viewers support mouse/touch pan, keyboard arrows, +/− zoom, fit/reset and fullscreen. Unsupported folds remain documented. No layout is shown unless the existing pipeline produced one.
7. Inspect the honest product-preview state, compare source fabric or actual flat pattern, and continue without requiring an image. No finished-product imagery was generated. Future imagery must be labeled ILLUSTRATIVE_AI_PREVIEW with source/design/model/prompt provenance; none is claimed here.
8. Review current readiness and prototype history, record a protected prototype/revise/reject decision, inspect actual workspace stock/inventory and a separately labeled read-only TEST_FIXTURE archive. Real final approval/reservation remains disabled and subject to the unchanged server evidence gate.

Progress indicates COMPLETED, NEEDS_ACTION, IN_PROGRESS, FAILED, UNVERIFIED and BLOCKED. Successful non-decision actions advance automatically. Human confirmation/review, missing technical information, absent physical evidence and any future paid/request-consuming operation are never silently bypassed. No inference is dispatched on mount, rerender, route change or reload.

## Save, resume and stale evidence

Only navigation identifiers and the current stage are stored in database-scoped, per-fabric browser localStorage. No credentials, operator tokens, manufacturing evidence or AI output are placed there. Actual fabrics, concepts, immutable proposal versions and review history remain in MongoDB. Reload restores the selected project/stage/proposal. My projects reopens saved projects; source-run and proposal-version selectors preserve access to historical results.

Current source comparison and proposal reads use existing backend hashes/version guards. A source/review change visibly marks dependent evidence stale. The explicit source-refresh API creates a new run and requires concept re-review; old approval is not transferred. Historical proposal SVGs remain viewable but cannot be presented as current approval evidence. This is presentation orchestration over existing APIs, not a new workflow or feasibility engine.

## Backend and security scope

Audited contracts include registration/confirmation, concept generation/review/source comparison/refresh, technical proposal creation/versioned SVGs, production readiness, prototype review, stock and inventory. Existing request schemas and concurrency guards were reused unchanged. The central client preserves multipart and JSON formats, 409 errors and expected versions/hashes.

Only two local adapter helpers were added: POST `/ui/test-fixture/fabrics/:id/concepts` and GET `/ui/test-fixture/fabrics/:id/authored-draft`. Both require the existing isolated test-database guard and TEST_FIXTURE server flag; concept creation also requires the same local session/Origin protections as other writes. They delegate to the existing concept service and existing authored fixture builder. The draft helper changes only explicit SCRAP bindings and adds a visible creative-coverage limitation. It creates no stock/evidence/fabric writes. Live/mock calls to original generation routes remain blocked by the existing local adapter; the new route accepts no caller-supplied mode/provider.

Host/loopback checks, HttpOnly SameSite session, server-memory operator bridge, restricted photo paths, SVG CSP, required production evidenceId and REAL production disable flags remain intact. The interface is for trusted localhost development, not public authentication/deployment.

## Final visual direction — cinematic / precision hybrid

The owner's major visual correction replaces the previous burgundy/ivory identity. This is a structural redesign of the entry, navigation and workbench, not a theme switch on the old dashboard:

| Earlier composition | Final composition |
| --- | --- |
| Wide sidebar with manifesto and repeated material cards | Compact near-black icon tool rail; one project-aware top bar |
| Warm editorial heading above every stage | Dark, oversized bold welcome; compact contextual headings only inside the working flow |
| Upload card beside generic guidance card | Generous neutral input canvas with one dedicated settings/confirmation inspector |
| Rounded standalone pattern cards | Grid-based technical canvas, integrated tool strip and adjacent precision inspector |
| Small pastel concept tiles | Larger visual concept gallery with explicit placeholders, selected outlines and brief hover/entrance motion |
| Ivory product placeholder | Immersive charcoal/violet preview environment, comparison controls and a clear lime next action |

The dark welcome and project archive use actual saved source photographs, layered framing, restrained violet light, oversized sans-serif typography and electric-lime actions. The original fabric photo is editorially cropped/desaturated in the welcome **for display only**, labeled as a source photo; the stored image and measurements are unchanged. Detection/selection/drafting use light neutral surfaces and contextual controls. Brief Motion entrances, stage transitions, source-frame hover and CSS dark/light transitions respect reduced-motion preferences; there is no synthetic processing progress or constant decorative animation.

Visually compared the earlier `data/local-mvp/guided-check-1794599407234/1440-creation-landing.png` and `1920-product-preview.png` with the redesigned `data/local-mvp/guided-check-1794600325987/1440-creation-landing.png`, `1920-creation-landing.png`, `1440-fabric-upload.png`, `1440-fabric-analysis.png`, `1440-concept-gallery.png`, `1920-nesting.png` and `1920-product-preview.png`. The palette, page composition, scale, rail navigation, inspector layout and product presentation are visibly different. Later punctuation-only corrections preserve that composition. All these local images remain ignored by Git.

## Cloudflare status and exact blockers

**Zero inference requests. Shared ledger remains 12/20; prior campaigns, locks and counters are preserved.** No account-plan/usage probes or .env changes were made.

Public documentation inspected: [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) describes the 10,000-Neuron daily free allocation and paid-only exceptions; the [FLUX.2 Klein 4B model page](https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/) documents the existing model and image output. These pages establish public provider capability, not the current account's free plan/balance or permission for an inference call. Current local Free-tier confirmation is absent, and this task explicitly forbids inference without separate authorization.

The existing text provider, JSON Mode, bounded timeout and atomic campaign accounting are unchanged. The existing image integration is an isolated command-line spike, not a source/version-bound, shared-ledger-protected product-preview API. It is not exposed to the browser. Enabling preview later requires that narrow protected integration plus explicit authorization/account confirmation; merely having API credentials or a model listed publicly is insufficient. No paid activation or substitute model was attempted. Buttons show one request per generation and explain the blocker; no fake success or regeneration occurs.

## Verification and evidence

Focused API/presentation tests: **14/14** (8 local-adapter integration tests and 6 presentation contract tests). Full regression: **665/665**, 36 files. All 657 preceding tests remain passing and unchanged; local-adapter tests were extended only. React production build passes. Client dependency audit reports **0 vulnerabilities**; whitespace and credential/artifact checks pass.

The real Edge/CDP browser workflow at 1440 and 1920 pixels exercised actual multipart upload (201/DRAFT), explicit current-analysis confirmation (200), MOCK concept persistence (201), human drafting approval (200), authored technical proposal (201), pattern/nesting SVGs (200), reload/resume, fullscreen and source comparison, protected prototype review (201), fixture stock declaration, read-only historical inventory, blocked final approval, explicit source refresh/re-review and unchanged historical proposals. Malformed image bytes returned an error without a new fabric document. Keyboard navigation and reduced-motion preference were checked. No JavaScript exceptions or horizontal 1920px overflow were observed.

The unchanged authored reference cut uses **56 cm²** of the measured synthetic polygon **162.045910493827 cm²**. Actual bounded nesting: **LAYOUT_FOUND**, geometry **PASS**, utilization **34.558107532206535%**. Persisted proposal status is **CHECKED**, overall verdict **UNVERIFIED**. This deliberately tests the workflow with a reference pattern; it does not establish that the Petal Cable Nest concept is faithfully drafted. That creative-coverage gap is recorded explicitly in the fixture limitations and human test review. No physical measurement or construction claim is made.

Run `node scripts/check-guided-mvp.cjs` while the local server runs to reproduce the browser journey (installed Microsoft Edge required). It creates clearly labeled records only in the isolated demo database and preserves previous runs. `node scripts/check-local-mvp.cjs` now forwards to this updated English workflow check. Browser screenshots/report are in timestamped `data/local-mvp/guided-check-*` directories; latest successful exact path is recorded in `data/phase6h-browser.log`. Logs: `data/phase6h-focused.log`, `data/phase6h-regression.log`. These private local artifacts are ignored by Git.

## Remaining path to real use

Use a real printed-mat photograph, independently check scale/material/grain, and explicitly confirm the correct analysis. Authorize a bounded live concept/technical request only after current Free-tier safeguards are satisfied, or supply a genuinely concept-matching engineering draft through the existing import. Obtain physical prototype/strength/fit evidence and genuine accessory stock receipts, then human review through the unchanged protected production gate. Synthetic stock and successful nesting must never substitute for those requirements. No real inventory was mutated or reserved. Cross-browser/cross-device project synchronization and public deployment are outside this local MVP; mobile redesign remains deferred.
