# Emergency MVP delivery — 14 November 2026

## Recovery and preserved work

Recovery was verified **before implementation**. See [PROJECT_RECOVERY_CHECKPOINT.md](PROJECT_RECOVERY_CHECKPOINT.md) for restore commands.

- Phase 6O commit: `8d801165ac5f23a6f39a1ffcd44632c03da36f2d`.
- Tag: `borsal-pre-model-upgrade-20261114T170313Z`.
- Private external backup: `E:\Borsal-Recovery\borsal-pre-model-upgrade-20261114T170313Z\verified-snapshot-final`.
- Bundle verified/cloned/fsck checked; 2,019 application/artifact files (614,259,775 original bytes) hashed. Credentials are DPAPI encrypted; dependencies/browser caches are reproducible exclusions.
- Official MongoDB tools dumped 21 Borsal databases; all restored to separate test namespaces with matching document/index evidence. Source databases were rechecked unchanged. No original database was dropped or overwritten.
- On resumption, all 21 database archives and the Git bundle were rehashed against `VERIFIED-CHECKPOINT.json`; all matched. No second backup or reset was performed.
- Local checkpoint commits: `d110310` recovery instructions; `8297c0c` authorized shared cap increase. Current branch: `feature/emergency-construction-mvp`. No push/merge.
- Construction checkpoint `31c7fc4`; completed diagnostic/prototype-flow checkpoint `d7da6df97898f71b629257f8e4608b178c337762`.
- Verified append-only delivery backup: `E:\Borsal-Recovery\borsal-pre-model-upgrade-20261114T170313Z\delivery-addendum-20261114T181610136Z`. Git bundle verified; current USER database restored separately with matching hashes (10 collections / 20 documents); 61 copied artifacts hashed, including current **19/30** ledger. Original full backup remains untouched. Recovery details are in the linked checkpoint document and private `RESTORE.txt`.

## Practical model decision

This is a bounded integration assessment, not a statistically reliable model benchmark. No research weights, GPU infrastructure or dependencies were installed.

| Option | Verified availability / setup | Practical decision |
| --- | --- | --- |
| [ChatGarment](https://github.com/biansy000/ChatGarment) | Published code, pretrained-weight link, Python/LLaVA/flash-attn plus GarmentCodeRC; repository Apache-2.0. Its text pipeline additionally calls GPT-4o. | Useful parametric-garment research, not a ready Node API or irregular-scrap accessory solver. Reject for this deadline; no deployment/performance test. |
| [GarmentGPT](https://github.com/ChimerAI-MMLab/Garment-GPT) | Python, NVIDIA CUDA, vLLM/LLaMA-Factory and multiple Hugging Face decoders/checkpoints. README declares Apache-2.0, but linked LICENSE retrieval returned 404. | Larger integration and unresolved license-file verification. Not installed or evaluated live. |
| [AIpparel](https://github.com/georgeNakayama/AIpparel-Code/tree/master) | Code, pretrained `.pth` weights and multimodal dataset; Python 3.10, PyTorch 2.3.1/CUDA 12.1 and garment preprocessing. Redistribution/weight terms not independently cleared here. | Sewing-pattern token research; no demonstrated scrap/accessory constraints. Not installed. |
| [GarmentDiffusion](https://github.com/Shenfu-Research/GarmentDiffusion) | Official multimodal 3D sewing-pattern research repository; inspected README offers project/paper links, but no usable installation/weights/license instructions were established. | Deployment readiness is unverified. Not a safe deadline dependency. |
| [GarmentCode](https://github.com/maria-korosteleva/GarmentCode) | MIT modular parametric sewing-pattern framework; a Python geometry system, not hosted text inference. | Relevant construction-first principle; replacing tested Borsal geometry would add risk. No integration. |
| Cloudflare Llama 8B/70B | Existing real artifacts: both produced JSON but invalid or incomplete technical designs; later Woven candidates exceeded area or had disconnected sewing. | Keep compatibility and history. Do not repeat monolithic complete-pattern generation. |
| [GPT-OSS 120B](https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/) | Existing Workers AI REST/JSON Mode transport; compact construction profile, 1,536 output tokens, 120s deadline, temperature 0.3. | One small construction-intent request is the proposed bounded live check, followed by existing deterministic engines and explicit alternative selection. Actual result is recorded below after execution. |
| [Qwen 3.8 27B](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/) | Hosted reasoning model, 40,909 input / 290,909 output Neurons per million tokens. | The bounded full-output estimate exceeds the current 350-Neuron local headroom. Do not call it. Older Qwen3-30B is [scheduled to retire November 20](https://developers.cloudflare.com/changelog/post/2026-11-05-planned-model-deprecations/); avoid adopting it for the MVP. |

[Current Cloudflare pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) lists a 10,000-Neuron daily Free allocation and explicitly identifies paid-only models; GPT-OSS and the above Qwen are not on that paid-only list. This does not replace account evidence: the existing owner dashboard attestation must remain current, paid billing false, and sufficient conservative allocation must be reserved atomically. No account-plan/usage API 403 check is repeated.

## Construction-first implementation

The primary path is a compact **construction intent → explicitly selected product alternative → deterministic cutting/seam/hem construction → existing polygon validation/nesting → existing assembly/material assessment**. It reuses the protected technical-generation route, immutable proposals, receipt idempotency, shared atomic ledger, source/review guards and existing geometry-plan selection. There is no second validator or new persistence subsystem.

New `borsal.construction-intent/0.1` represents function, supported construction method, proposed dimensions and explicit creative changes/unknowns. It does not claim source measurements or stock. The bounded compiler supports **two-panel open sewn sleeves only**. Arbitrary polygonal designs remain supported by existing candidate/drafting paths, but are not automatically converted into this primitive. Unsupported weaving remains unsupported.

For this limited sleeve: two congruent panels have separate cutting/stitching geometry, a matched side–base–side seam, double-turn top hems, proposed internal-edge overcasting, automatically assigned references, required thread estimate and proposed assembly sequence. Material specifications are explicit UNVERIFIED suitability targets, not observed source properties or available inventory. No finished depth is invented.

### Woven Wrap disposition

The original concept and image remain unchanged. Selected historical geometry v9 used 78.3318 cm² (48.3392%) but had no joining, woven structure, wearable closure or engineered tie. Its two 1.2 cm squares are not functioning ties. The saved illustration is concept/source-linked, not evidence of this pattern's folds or thickness.

The new sleeve is a **different product**, requiring an explicit human checkbox/selection. It must never be silently relabeled as a successful Woven Wrap. Local bounded examples:

- Two 6 × 8 cm panels: 96 cm²; no layout found within configured search, not global impossibility.
- Two 5 × 7 cm panels: real geometry PASS, 70 cm², **43.1976%** utilization of the original 162.0459 cm² irregular polygon.
- Two 4 × 6 cm panels: real geometry PASS, 48 cm², **29.6212%** utilization.
- Existing assembly-reference checks pass for the proposed paired seam. Physical assembly, material suitability, stock and original creative fidelity remain UNVERIFIED/PARTIAL; manufacturing approval stays false.

## Operations and safety

- Shared cap increased to **30** without resetting baseline, reservations, unknown outcomes or campaigns. Pre-implementation ledger: **18 consumed**.
- Saved owner Free proof initially had 350 conservative Neurons remaining, expiring `2026-11-15T00:00:00Z`, paid billing false. Compact planner hold: 300 Neurons. The request is refused above 5,500 prompt bytes; documented GPT-OSS rates and byte-based input bound plus 512-token overhead bound the estimate below the hold.
- Existing concept/legacy technical profiles retain their 1,900-Neuron holds and provider defaults; image profile unchanged. No fallback, repair inference or automatic retry.
- Ordinary users choose a product alternative and inspect instructions, pattern/nesting and unresolved evidence. Internal IDs/vertices/JSON remain advanced-only.
- Original raw output and rejected proposals are immutable. A selected alternative appends ENGINE_DERIVED provenance with parent/input/source/review hashes. Selection replay is idempotent and stale-source/review/version conflicts remain blocked.

## Verification and demonstration

Completed verification milestones: 44 budget/API tests; 71 construction/provider/API/campaign tests; 26 corrected-boundary/construction tests; then **788/788 full regression**. The first full run found one old concurrency test still seeding 19/20 used slots: it now seeds 29/30 and retains exactly the same one-winner assertion. No geometric tolerance or engineering validation was weakened. Subsequent diagnostic/readability/schematic checks passed 40, 20 and 23 focused tests in their respective runs; final regression/build results are recorded below after completion.

Final checks: **791/791 tests, 56/56 files**, `npm test` (201.92s), log `data/emergency-delivery-regression.log`. React production build **passed** (`data/emergency-delivery-build.log`, 1.38s); existing >500 kB chunk warning remains nonblocking. `git diff --check` and known-credential/private-key scans passed; no dependency changes. Existing Mongoose deprecation warnings were not turned into unrelated refactoring. Automated tests used isolated databases/mocked external providers and made no Cloudflare requests.

Launch: `npm run mvp` → **http://127.0.0.1:5173** (MongoDB replica set required). Safe fixture launch: `node scripts/local-mvp.js --mock --geometry-first`; it creates a fresh isolated test workspace, never resets a user project, and disables network inference.

## Actual live evaluation — no retry

- Local construction checkpoint: `31c7fc4` (`feat: add bounded construction-aware product planning`).
- Exactly **one** new inference request: `mvp-technical-6e342eec-5867-4662-8050-9d6064a76224`, model `@cf/openai/gpt-oss-120b`, JSON Mode, temperature **0.3**, `max_tokens=1536`, timeout **120s**.
- Cloudflare **HTTP 200**, but the existing adapter rejected the response as **INVALID_PROVIDER_ENVELOPE** during `VALIDATING_RESPONSE`, after **10,427 ms**. Local API returned **502** and saved a FAILED operation (`6af89f9d7166748be46f5cd2`). This was not a timeout.
- No technical proposal was created. JSON/schema validity, construction quality, finish reason, tokens and actual Neurons **could not be established**. The prior adapter did not retain this unexpected envelope, so its exact shape/content cannot be reconstructed. Do not infer that GPT-OSS produced a bad design or was superior to Llama.
- Follow-up offline fix: future technical calls privately capture a secret-redacted provider envelope before validation, including failure cases. Mock tests prove capture-before-rejection; this is **not** a successful live retest or a speculative envelope-parser fix.
- Campaign artifacts: `experiments/design-language/ai-spike/results/campaigns/mvp-technical-6e342eec-5867-4662-8050-9d6064a76224/` (lock, request, attempt and failure). Additional receipt/preservation evidence: `data/emergency-live-construction-20261114/{dispatch.json,api-result.json,summary.json}`. These private files are ignored by Git.
- Shared ledger now **19/30**; the failed/unknown result remains consumed. The 300-Neuron hold is not refunded: local conservative balance **50**, not a claim about exact dashboard usage. No additional model/image request, fallback or repair was made. Qwen evaluation was not affordable under the verified conservative headroom.
- Existing user fabric records, stock, inventory, reviews and every historical proposal were hashed before/after and matched. The selected Woven Wrap project/approval/proposal was not replaced or reselected.

## Actual isolated end-to-end demonstration

The browser used a fresh **TEST_FIXTURE** database and replayed the saved Woven concept/failed candidate without inference. The original irregular polygon was used unchanged. A simulated explicit human chose the new sewn sleeve; this does **not** record an alternative choice for the real user project.

1. Current concept approval/source checks passed through the actual protected API.
2. `Create Product Design · 0 AI calls` explored bounded constructions without engineering data entry.
3. Explicit checkbox/selection saved ENGINE_DERIVED proposal `6af8a2d60415d5a85447e57b`, retaining parent/source/review hashes and immutable rejected history.
4. Two **5 × 7 cm** cutting panels: **70 cm²** demand, **43.1976344%** utilization, **92.0459105 cm²** remaining geometric area. Existing independent geometry validator: **PASS**.
5. Actual placements: panel 1 rotation **0°**, translation **[21.0516667, 16.5794444] cm**; panel 2 rotation **90°**, translation **[26.0516667, 24.5794444] cm**. A rotation is not proof of compatible physical grain.
6. Existing assembly-reference precheck: **PASS**. Double-turn opening hems, matched side/base seam and proposed internal-edge overcasting are documented. Required thread estimate: **142.8 cm**, polyester/tex30 target, availability **NOT_CHECKED**. Required SCRAP area is exactly both physical cuts including allowances.
7. Status **CONCEPT_ONLY / UNVERIFIED**. Missing source grain/material/stock, incomplete finished-dimension targets and physical construction remain unresolved. The legacy bag category is retained only as the existing experimental transport contract; the explicitly selected product function is a sleeve, not a shoulder bag or wearable weave.
8. Browser recorded **APPROVED_FOR_PROTOTYPE**, scope **TEST_FIXTURE**, then confirmed REAL production readiness **false** with independent-measurement/material/construction blockers. Inventory and stock were unchanged. No manufacturing approval or reservation occurred.
9. Reload/resume and backward navigation passed; no console errors, no raw technical entry, 20 desktop visual audits at **1440/1920 px** passed. The technical stage remains UNVERIFIED while completed geometric nesting is shown separately. The pattern canvas is primary; construction instructions/schematic follow it.

### Reviewable files

- Exact export directory: `data/emergency-demo-results/1794679568267/`.
- `cutting-pattern.svg`, `nesting-layout.svg`, `proposed-assembly.svg`, `construction-evidence.svg`.
- `proposal.json`, `source.json`, `bom.json`, `assembly-instructions.json`, `construction-report.json`, `demo-summary.json`.
- Screenshots/report: `data/local-mvp/real-creation-check-1794679486085/`, including `1440-` and `1920-` variants of `geometry-options`, `geometry-selection`, `engine-cutting-pattern`, `engine-nesting`, `construction-summary`, `prototype-readiness`, `prototype-reviewed`, `review-inventory` (PNG), plus `report.json`.
- Cutting, nesting and construction-summary screenshots were opened and visually inspected. The schematic is explicitly proposed construction, **not a generated product image**. No new image was generated and the original illustration remains unchanged.

## Final demonstration steps and limits

1. Start MongoDB's existing replica set, then `npm run mvp`; open **http://127.0.0.1:5173**. This reopens the preserved USER workspace, not the fixture database.
2. Open the saved Woven Wrap project → Technical draft → **Create Product Design · 0 AI calls**. Review the open-sleeve alternative and explicitly select it **only if you accept the different product/function**. This appends a version; it does not modify the original Woven Wrap or rejected AI data.
3. Inspect cutting/nesting, proposed assembly schematic, BOM and instructions. Record a prototype decision if desired. This can be demonstrated without spending more AI budget or entering engineering coordinates.
4. To reproduce the isolated demonstration: `node scripts/local-mvp.js --mock --geometry-first --construction`, then `node scripts/check-real-creation.cjs --geometry-first --construction`, then `node scripts/export-construction-demo.cjs`. Stop an existing local launcher first. No database/ledger reset is performed; exports use new timestamped paths.
5. For new live generation, first manually check the current Workers Free dashboard and save truthful current remaining allocation in the UI. **Do not reset the shared 19/30 ledger.** The GPT-OSS response compatibility/outcome remains a live blocker; inspect a separately authorized captured-envelope attempt before relying on it. No superiority or success claim is justified by this failed evaluation.
6. Before physical making or final production: verify printed-mat scale and actual fabric dimensions, material and grain; verify suitable thread/stock independently; test hems, fraying, seam/turning bulk, function and strength on a physical sample; record genuine evidence and human technical approval. Existing transactional production/reservation gates remain authoritative and disabled without that evidence.

**Readiness:** usable local, explicitly limited construction-and-nesting prototype with a coherent authored/engine-derived sleeve alternative. Fully autonomous LIVE AI-to-manufactured-product readiness is **not established**. Woven wearability/interlacing remains unengineered, no sleeve product photograph exists, and no physical manufacturing evidence has been invented.

## Final stabilization and submission

Starting checkpoint: `412dc6eeebbc755028d07bb3476326dd5b896841`; branch **feature/emergency-construction-mvp**. Existing recovery/addendum files were rehashed on resumption: **86 files matched**, including all original database archives, both delivery Git bundles and copied addendum evidence. Restore-verification evidence remains valid. No original database record or prior backup was changed.

### Planner diagnosis: established facts versus unavailable evidence

The latest campaign remains `mvp-technical-6e342eec-5867-4662-8050-9d6064a76224`. It contains `failure.json`, not `response.json`, `raw-response.txt` or a captured envelope. The saved local API result is an error receipt, **not the original provider response**. No newer planner response was found.

- HTTP **200**, JSON decoding completed, then failure in **VALIDATING_RESPONSE**. This excludes the recorded client timeout, DNS/TLS and response-JSON decoding paths for this attempt.
- The adapter accepts an object containing `result.response` as a string or non-array object. Its INVALID_PROVIDER_ENVELOPE branch rejects a non-object/array root, missing result, or incompatible/missing response value. Without the discarded body, these cases cannot be distinguished.
- An explicit `success:false` or non-2xx response would take the separate provider-error branch when the root is an object. No such code was recorded; an unconventional inference-error payload still cannot be ruled out.
- The model-specific contract, output shape, request-option compatibility, internal inference outcome, finish reason and usage cannot be conclusively attributed from the saved evidence. No speculative parser change or fabricated raw response was introduced.
- Existing capture-before-validation behavior was retested offline, including unknown HTTP-200 envelopes, diagnostics and no-retry behavior. It will preserve future redacted technical envelopes privately; it cannot recover the old body.
- **ZERO new live requests** in stabilization. Current ledger **19/30**; the saved conservative Free balance is **50**, below the planner's 300 hold. No refund/reset or paid service was used. The permitted one-request maximum was not spent.

### Fresh-project browser proof

`node scripts/local-mvp.js --mock --construction` starts with no seeded user records. `node scripts/check-real-creation.cjs --submission` now follows the actual construction-intent/explicit-alternative workflow rather than the older automatic candidate-to-SVG path. The harness waits for the provider dialog to close before clicking local construction; no application gate was bypassed.

Successful browser evidence: **data/local-mvp/real-creation-check-1794681253078/** (`report.json`, screenshots at **1440/1920**). A new project uploaded `data/test-mat40.png` through the real multipart API, detected/calibrated its contour, explicitly confirmed geometry, requested fixture-labelled concepts and image, selected/reviewed a concept using prefilled routine text, requested a mocked construction intent, explicitly selected the separate sleeve alternative, viewed actual cutting/nesting SVGs and proposed instructions, saved prototype review, checked blocked production, reopened preview/history and restored state after reload. No technical coordinates/JSON were typed; inventory was unchanged; browser-to-Cloudflare requests **0**. The three external-provider operations were mocked and used only an isolated test ledger.

The resulting sleeve has two 5 × 7 cm panels, 70 cm² demand, actual geometry PASS, about 43.20% utilization, declared POCKET component roles, matched seam references, double-turn hems and proposed overcasting. Source material/grain/stock and physical construction remain UNVERIFIED; the model fixture did not prove AI engineering quality. `cutting-pattern.svg`, `nesting-layout.svg`, `proposed-assembly.svg`, `assembly-instructions.json` and `demo-result.json` are exported with the browser evidence. Fixture preview images are visibly NOT AI / NOT A PRODUCT PHOTO; the preserved original live illustration is not represented as a sleeve photograph.

Submission setup/walkthrough: **README.md**, with non-secret **.env.example**. Source packaging uses **scripts/package-submission.ps1** with explicit successful fixture-browser evidence. It includes tracked source/dependency manifests/documentation, reviewed test images/marker fixture and selected TEST_FIXTURE screenshots/SVGs. It excludes actual `.env`, account credentials, databases/dumps, uploads, live campaigns/ledger, Git history/bundles, dependency/build caches and private backup files. It is not a portable seeded deployment; MongoDB/rs0, dependencies and local configuration are required, and the owner's active ledger must never be reset or duplicated when enabling LIVE.

Stabilization checks completed: **30/30 focused tests**, **791/791 full regression across 56 files** (213.90s), React production build **PASS** (1.97s), and the full desktop journey described above **PASS**. Logs: `data/submission-focused-tests.log`, `data/submission-regression.log`, `data/submission-react-build.log`. No tolerance or engineering rule changed. Existing chunk/deprecation warnings remain nonblocking.

### Submission handoff

- Code/setup/packager checkpoint: **34574eded81c632b864fdf65254d3a97ae215792**. Submission revision: local tag **borsal-mvp-submission-20261114**, branch **feature/emergency-construction-mvp**. The exact final source SHA is recorded by `package-manifest.json`; subsequent release changes are documentation only.
- Deliver **data/submission/20261114-release/borsal-mvp-source.zip** and its adjacent **package-manifest.json**. The manifest records source commit, archive SHA-256, entry sizes/hashes and exclusions. The final source ZIP includes the completed delivery report and setup README.
- Packaging preflight already verified a 257-file source package, required backend/frontend manifests, documentation and selected test assets. Windows PowerShell path-separator/assembly-loading issues were fixed in the packaging helper before successful archive verification; earlier incomplete attempts remain separately marked, never substituted for the release.
- The package contains **12** explicitly labelled fixture-example files: desktop screenshots, cutting/nesting/assembly SVGs, proposed instructions and a concise result. Reviewed image fixtures have no EXIF/XMP/IPTC metadata. Only three allowlisted `data/` test inputs are shipped; actual user photos, active workspace, raw provider records, databases, ledgers and backups are not shipped.
- Credentials were scanned against all tracked source and selected examples without printing values. No configured credential was found. The package is read/hash-verified and required entries checked; extraction verification evidence is saved alongside local submission logs. No dependencies/caches/build output are embedded.
- The normal USER launch remains `npm run mvp` → **http://127.0.0.1:5173**. Offline walkthrough: `node scripts/local-mvp.js --mock --construction`; browser verifier: `node scripts/check-real-creation.cjs --submission`. No new Cloudflare request was made; ledger remains **19/30**.

**Submission verdict:** stable, backed-up local prototype and source handoff, with a coherent explicitly selected sewn alternative and honest engineering unknowns. Remaining blockers are the unproven GPT-OSS response contract, insufficient current conservative Free headroom for a planner retest, and missing physical/material/stock evidence. This is not a claim of fully autonomous live pattern engineering, portable seeded deployment or manufacturing readiness.

## Post-release urgent planner fix

See [LIVE_PLANNER_ENVELOPE_FIX.md](LIVE_PLANNER_ENVELOPE_FIX.md). Separate branch **fix/live-planner-envelope**, release **f217f2a** and verified ZIP untouched. New captured responses prove `/ai/run` GPT-OSS returns a Chat Completion under `result`; the adapter now extracts final `choices[0].message.content`, preserves usage/finish reason and rejects errors/refusals/reasoning-only output. No endpoint/model/prompt/schema weakening or live retest was performed.

Actual budget advanced through nine recorded post-release requests to **28/30**, not 19/30; three remaining matched the 27/30 pre-request snapshot. Current Free proof has 4,700 conservative Neurons and a 300-Neuron planner hold. Confirmation refreshes and shows used/total/remaining; atomic reservations remain authoritative. **ZERO new live calls in this fix**.

Offline replay: all three captured texts are valid intent JSON; one 198 cm² candidate fails the unchanged 162.0459 cm² area check, and two declare UNSUPPORTED. Design limitations remain explicit. **806 tests**, build and 1440/1920 browser smoke passed; real user database, original 180 campaign/ledger files and release ZIP hashes are unchanged. New checkpoint tag: **borsal-planner-envelope-fix-20261114**. Code rollback: stop launcher, `git switch --detach f217f2a`, then `npm run mvp`; preserve the current ledger/database. The frontend is ready for one explicitly confirmed live planner request after restarting/reloading, subject to the current gates; a useful fitting construction is not guaranteed by transport success.

## Urgent simplified creation workflow

See [SIMPLE_CREATION_STUDIO.md](SIMPLE_CREATION_STUDIO.md). Tested source checkpoint **0b5dd73**, tag **borsal-simple-studio-20261114**, branch **feature/simple-product-journey**. Original release `f217f2a` and submission ZIP are preserved.

The latest keychain response is a valid but unsupported construction intent with no `design.data` or usable cutting geometry. It cannot be recovered into a pattern without inventing information. The wrong legacy-parser path now returns a specific 422 instead of the undefined-object schema error. Incomplete results stay on Generate Design, including old saved empty-pattern selections. Hardcoded wrap/weaving instructions were removed from the generic planner; stored project references matched, while meaning was contaminated by the old prompt/UI. Context resolution and preview association are stricter.

Five public steps replace the engineering navigation. Main actions follow actual state; deterministic local assessment is automatic, alternative selection remains explicit, and technical diagnostics/IDs/history are progressively disclosed. Pattern, nesting and assembly share one product-design view. Prototype review and blocked production remain honest. A browser-discovered confirmation-unmount bug was fixed without weakening source guards.

**23 focused tests**, **817 full tests / 59 files**, React build and 1440/1920 Edge journey pass. Browser evidence: `data/local-mvp/real-creation-check-1794688820145/` (before baseline and screenshot names in the linked report). Actual upload, confirmation, mocked provider generation, construction selection, 70 cm² / 43.20% nested layout, assembly, prototype review, blocked production, incomplete-output recovery, cancelled revision confirmation and earlier-version resume were exercised through real APIs in an isolated fixture workspace. No coordinates or technical JSON were typed; no inventory changed; no external inference occurred.

Both new private backups are verified; final addendum: `E:\Borsal-Recovery\borsal-pre-model-upgrade-20261114T170313Z\simple-studio-verified-20261114T204426021Z`. See [PROJECT_RECOVERY_CHECKPOINT.md](PROJECT_RECOVERY_CHECKPOINT.md). Original 35 user documents/indexes and application artifacts match pre-change evidence. Final dump restored 35 documents with zero failures; bundle/file hashes verified.

Current global ledger: **29/30**, one remaining; **ZERO calls in this task**. No automatic retry or live validation was performed. Normal launch: **`npm run mvp` → http://127.0.0.1:5173**. Useful AI construction is still not guaranteed; missing physical/material/stock evidence remains a production blocker. Do not spend the remaining request without explicit confirmation and current Free-tier safeguards.
