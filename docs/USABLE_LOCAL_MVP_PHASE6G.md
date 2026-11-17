# Phase 6G — Local interactive MVP

Phase 6F was audited and committed as `c6f6130` (`feat: add approval and transactional inventory MVP`). Phase 6G remains uncommitted on `feature/usable-local-mvp`.

## Launch

With the existing MongoDB replica set and server `.env` configured, install dependencies once with `npm ci` and `npm --prefix client ci`. Run **`npm run mvp`** from the repository root. Open **http://127.0.0.1:5173**. Ports 3001 and 5173 must be available. No credentials belong in client configuration.

The launcher creates a fresh isolated `borsal-mvp-demo-<UUID>-test` database on first launch using the existing source-preserving demo workflow and saved live concepts. `data/local-mvp/workspace.json` retains this workspace for subsequent launches; no automatic reset occurs. The original source records remain separate. A separately labeled read-only Phase 6F archive supplies historical fixture reservations for inspection; it is not current workspace inventory. This local demo depends on the existing saved source artifacts and databases and is not a portable seeded production deployment.

## Interface and real operations

React, Vite, Tailwind CSS, React Router and Lucide React are isolated in `client/`. Arabic RTL layouts use burgundy, ivory and sage, responsive navigation and consistent loading, empty, error and success states. Centralized `client/src/api.js` uses Vite `/api` and `/ui` proxies. Existing schemas, routes, review/version/hash guards and feasibility algorithms remain authoritative.

| Screen | Actual connected behavior |
| --- | --- |
| Dashboard | Database-derived fabric, concept, technical proposal and inventory summaries; original fabric photo |
| Fabric Studio | Multipart photo upload with mat preset, detected contour/dimensions, explicit geometry confirmation and provenance warnings |
| AI Design Studio | Three saved live concepts, human review decisions and drafting brief; explicit source comparison/refresh |
| Technical workspace | Version selection, pattern/nesting SVGs, BOM, assembly, feasibility layers; advanced authored/raw model proposal import through existing API |
| Product preview | Honest NOT_GENERATED placeholder and source fabric reference, explicitly distinct from finished-product imagery |
| Approval & inventory | Readiness checklist, protected prototype review, explicitly declared TEST_FIXTURE stock, current inventory and separate read-only reservation archive |

No new text inference is authorized: generation controls are disabled rather than returning fabricated concepts. Image inference was not performed because current Free-tier eligibility could not be established from available configuration. No account usage probes, retries or fallback inference were made. A future generated image must be labeled `ILLUSTRATIVE_AI_PREVIEW`; flat pattern SVGs and original fabric photos are not product photos. Shared budget remains **12/20**; all 81 previously recorded campaign/ledger artifacts were preserved.

## Local security boundaries

The Express adapter binds to loopback, requires an isolated test database, checks the expected Host, and requires an exact allowed Origin plus a random HttpOnly SameSite=Strict session cookie for writes. A narrowly allowlisted operator bridge delegates to existing protected handlers using an ephemeral server-memory token; no operator secret is returned to React, cookies or browser storage. Real production approval is disabled by launcher configuration and the required production `evidenceId` schema remains unchanged. Live generation routes are blocked by the adapter. Photo reads are confined to the repository's data directory; archived SVG responses have a restrictive CSP.

Automatic approval review rejected an attempted optional `evidenceId` change during implementation. That batch was not applied: the existing mandatory evidence requirement was retained and the interface disables final approval until genuine evidence is available.

This is a trusted local development workspace, not public authentication or a hardened public deployment. Do not expose either port or use a production database. Prototype approval creates no reservations and proves no physical feasibility. Client dependencies add no backend dependencies; generated builds, browser profiles, uploads, screenshots and local results remain ignored.

## Actual verification

- Original baseline: **651/651** tests. Full final regression: **657/657**, 35 files, 156.44 seconds. Existing tests unchanged.
- Focused local UI adapter plus approval tests: **20/20**, including host/origin/session rejection, multipart registration/confirmation, inference blocking, protected fixture stock and unsafe photo paths.
- Client production build passed; client production dependency audit reported **0 vulnerabilities**. `git diff --check` passed.
- Real headless Edge checks: all six screens at 1440×1060 and 390×844; no JavaScript exceptions, no horizontal mobile overflow and **zero Cloudflare requests**. The mobile navigation drawer was exercised.
- Actual browser API evidence: upload **201**, confirmation **200**, malformed image **400** with no document creation, concept review **200**, prototype review **201** with zero reserved inventory, fixture stock **201** with zero reserved balance, archived SVG **200**, authored proposal import **201 / CONCEPT_ONLY**. No unknown stock/material evidence was invented to upgrade that outcome. Final production approval stayed disabled; this browser test did not submit a REAL production approval.

Reproduce browser checks while the server runs: `node scripts/check-local-mvp.cjs` (requires installed Microsoft Edge). This performs explicitly labeled mutations only inside the isolated demo workspace, saves screenshots and preserves prior runs.

Latest verified browser evidence: `data/local-mvp/browser-check-1794593067384/report.json`, with **16 screenshots**, including `desktop-dashboard.png`, `desktop-technical.png`, `desktop-nesting.png`, `desktop-preview.png`, `mobile-dashboard.png` and `mobile-approval.png`. Desktop and mobile screenshots were visually inspected. Full test log: `data/phase6g-regression.log`. These local artifacts are intentionally not committed.

## Remaining MVP blockers

The synthetic burgundy sample is not independently physically verified. Genuine fabric/material measurements, real stock receipts, physical construction evidence and final human technical review remain required by the existing production gate. Public authentication and deployment hardening are outside this local MVP. Finished-product imagery remains unavailable until an explicitly permitted Free-tier image request can be executed safely; no visual placeholder claims manufacturing evidence. Next steps are physical verification and prototype review, then genuine evidence-backed final approval and transactional reservation through the existing backend, without promoting TEST_FIXTURE declarations to real evidence.
