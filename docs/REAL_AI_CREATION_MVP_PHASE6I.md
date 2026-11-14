# Phase 6I — Real creation projects and guarded AI actions

Phase 6H.1 passed its **675/675** baseline and source/security/diff audit, then was committed as **`d126487`**, `feat: unify dark studio and motion`. Current branch: **`feature/real-ai-creation-mvp`**. Phase 6I remains uncommitted; no push or merge.

## Launch and workflow

Run **`npm run mvp`** and open **http://127.0.0.1:5173** with the existing MongoDB replica set and server-only provider configuration. The loopback-only launcher creates a persistent, empty `borsal-local-user-<UUID>` database; its private locator is `data/local-mvp/user-workspace.json`. Production approvals and legacy live flags remain disabled. No prior fabric, concepts, patterns, stock or reservations are copied.

Choose New Project → upload a JPEG/PNG with A4/large mat → inspect actual measurements → explicitly confirm current geometry/photo basis → generate concepts → select and optionally visualize → record human approval/drafting brief → request technical proposal → inspect pattern/nesting/findings → prototype review. Every inference is a separate confirmed action. Preview can be revisited later. Missing physical evidence never becomes approval.

Projects persist source association and workflow/run/concept/proposal identifiers with version guards. Reload/reopen restores the server-held selection. One immutable uploaded source association is supported per project; another photograph requires another project. Historical generations/proposals remain accessible. Nothing dispatches inference on mount, refresh, route change or rerender.

Optional previous demo: stop the launcher, then **`npm run mvp -- --demo`**. Its original workspace/evidence are preserved. **`npm run mvp -- --mock`** creates a fresh isolated TEST_FIXTURE database with mocked providers and a separate ledger; network inference is disabled. Its counter is not the real ledger.

## API and engine reuse

Existing calibration, confirmation, concept review, proposal transactions, drafting bridge, bounded nesting, feasibility, SVG and approval/inventory services remain authoritative. No design schema or geometry algorithm was replaced.

| Action | Route |
|---|---|
| Empty project / listing | `POST /ui/projects`, `GET /ui/projects` |
| Persist selection | `PATCH /ui/projects/:id` with `expectedVersion` |
| Link new uploaded source | `POST /ui/projects/:id/source` with `fabricId`, `expectedVersion` |
| Upload / confirmation | Existing `POST /api/fabrics/from-photo`, `POST /api/fabrics/:id/confirm-geometry` |
| Current Free-tier check | `GET/POST /ui/ai-settings` |
| Creative concepts | Existing `POST /api/fabrics/:fabricId/concepts` |
| Human review | Existing `POST /api/concept-runs/:id/concepts/:conceptId/review` |
| Illustrative preview | `POST /api/concept-runs/:id/concepts/:conceptId/previews` |
| Technical generation | Existing `POST /api/concept-runs/:id/concepts/:conceptId/technical-proposals/generate` |
| Guided authored version | `POST /ui/projects/:projectId/runs/:id/concepts/:conceptId/assisted-draft` |
| Request receipt / image | `GET /ui/operations/:id`, `GET /api/previews/:id/image` |

Generation requires the local session/Origin, server-held operator capability, project/source hashes, explicit one-call confirmation and UUID idempotency key. Persistent receipts and unique indexes prevent duplicate requests and concurrent pending operations of the same kind/project. Shared reservations/checkpoints precede inference. Unknown outcomes remain counted; no repair/retry/fallback is automatic. Authentication/quota failures require review. Operator/provider secrets never reach React or browser storage.

## Provider availability and provenance

Text reuses **`@cf/meta/llama-3.3-70b-instruct-fp8-fast`**, JSON Mode, temperature 0.7, `max_tokens=6144`, **120s** timeout. Creative concepts and selected-concept technical drafting remain separate. Targeted technical instructions distinguish design hypotheses from unknown source properties, forbid UNKNOWN/zero placeholders and invented stock, require explicit cutting instances and valid BOM/thread/assembly references, and reconcile SCRAP quantities. Raw responses are validated as-is. This prompt improvement has not been evaluated live in this phase.

Images reuse the proven **`@cf/black-forest-labs/flux-2-klein-4b`** multipart contract: prompt, actual source PNG as `input_image_0`, width/height 1024. Source conditioning is approximate, not verified texture or construction. Actual bytes are saved under `data/creation-previews/<projectId>/<UUID>.png|jpg`; safe local asset routes serve them. Stored metadata includes prompt, model, source/conditioning/output hashes, concept/review/proposal association, usage when reported and artistic assumptions. Matching inputs reuse previews; regeneration requires another confirmation. Every preview is **ILLUSTRATIVE_AI_PREVIEW**, with TEST_FIXTURE/NOT AI labeling for mocked images. Source/pattern comparison and stale/history notices remain available.

**Exact delivery status:** credentials are configured; the new USER workspace has no current owner Dashboard check. Text/image controls report **`CURRENT_OWNER_FREE_TIER_VERIFICATION_REQUIRED`**. No plan/usage API probes or inference were made. The owner must check Workers Free active, paid billing disabled and today's remaining Neurons, then record that check in the UI. This is explicitly owner-supplied verification, not independent account inspection; it expires at UTC midnight. TEST_FIXTURE attestations cannot enable real inference.

Cloudflare documents the [FLUX contract](https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/) and [Free allocation/pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/). Conservative allocation holds are **150 Neurons/image** (1024 input/output upper estimate 125.68) and **1900/text request**. Insufficient or expired allocation blocks inference. Holds are not actual usage; unknown usage is never assumed zero. Paid billing is never enabled.

## Assisted drafting and readiness

The form accepts arbitrary straight polygon cutting/separate stitching vertices, copies, allowance/grain targets, dimensions, WOVEN_FABRIC/THREAD/HARDWARE requirements, SEAM/INSTALL references and edge/copy/anchor details. No offsets, quantities or attachment locations are invented. Unsupported curves/folds/materials/assembly details retain advanced import. Explicitly copying a valid proposal into the editor refuses unsupported details rather than dropping them. Edits create new AUTHORED versions; original AI output remains unchanged.

Optional source-material properties and stock snapshots require an explicit basis; stock specification matches require a separate declaration. These are **USER_DECLARED_UNVERIFIED offline inputs**, not independent proof or inventory writes. Source grain is not inferred from proposed pieces. Missing inputs remain CONCEPT_ONLY/UNVERIFIED. Valid explicit cutting geometry may separately produce **PRELIMINARY GEOMETRY ONLY** nesting evidence/SVG without upgrading full readiness. Search exhaustion is not global impossibility.

## Actual verification

- **19/19 focused tests**, two files: isolated mocked live-capable routes, empty/multiple projects, actual multipart calibration/confirmation, image bytes/cache, strict provider behavior, idempotency/concurrency, timeout accounting, declarations, invalid/incomplete drafts, source staleness, budget exhaustion and blocked real approval.
- **694/694 full regression**, 39 files, **157.04s**. All 675 prior tests remain unchanged. Log: `data/phase6i-regression-final.log`.
- React production build passed; no dependencies added. Vite retains a non-blocking bundle-size warning above 500 kB.
- Actual Edge/CDP journey at **1440px and 1920px** exercised empty project → upload/detection → confirmation → two new mocked concepts → saved fixture image → human review → technical generation → actual nesting/SVG → reload/resume → prototype review → new authored form version → preview/history. Complete fixture: **CHECKED / UNVERIFIED**, geometry PASS, **LAYOUT_FOUND**. Authored version without copied material/stock declarations: **CONCEPT_ONLY**, with cutting/preliminary nesting SVGs. Real approval stayed blocked; inventory unchanged. Reduced motion checked; zero console exceptions, overflow, bright panels or visible text below 14px.
- Full journey report and **30 screenshots**, visually inspected: `data/local-mvp/real-creation-check-1794610214462/` (`report.json`, paired `1440-*`/`1920-*` images). Includes analysis, ideas, preview, patterns, nesting, editor, authored version, review and restored state. Optional source/stock declaration mapping additionally passed focused API tests.
- Normal launcher verified USER with **zero projects/fabrics/runs/stock/inventory** and no attestation. Both-width real-empty screenshots/report: `data/local-mvp/real-creation-check-1794610877846/`.
- Reproduce fixture browser checks: `node scripts/check-real-creation.cjs` while `--mock` runs. `--empty-only` checks a fresh normal workspace without writes/inference.
- **ZERO live Cloudflare requests**. Real ledger remains **12/20**, eight remaining. All **81** prior campaign/ledger hashes match `data/phase6d-artifact-hashes.json`; previous campaigns, counters, locks and results are unchanged.

## Remaining owner actions

Supply a real mat photograph and current Dashboard verification, then manually confirm the separate concept/image/technical requests. Actual provider/model availability and new prompt quality remain untested live by instruction. Invalid proposals stay rejected; missing detail can become a new authored version. Physical calibration accuracy, source material/grain evidence, construction tests, genuine stock and protected production controls remain necessary before real reservation. No manufacturing feasibility or approval is claimed.
