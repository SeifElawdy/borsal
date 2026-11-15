# Fix 1: unified product design identity

## Recovery and preservation

Before implementation, HEAD was `bb8f17397faad4919d6c2bdf4492666d7ded11e4`, branch `feature/simple-product-journey`, with a clean working tree. The committed four-view preview improvements were retained.

Recovery tag: `borsal-pre-design-identity-20261115T124534206Z`.

Private verified backup: `E:/Borsal-Recovery/borsal-pre-model-upgrade-20261114T170313Z/pre-design-identity-20261115T124534206Z/`.

The Git bundle and official MongoDB archive were verified; restoration into a new isolated database matched **66 documents / 10 collections**, including histories, approvals and inventory. **487 artifacts** were copied and hashed. Post-test preservation verified all original records and 486 artifacts unchanged; the remaining original server log was strictly append-only, with its original bytes intact. No original project, image, proposal, review, inventory or request receipt was changed. The submission ZIP remains unchanged (SHA-256 `c475ef9e859e33de0bdd78cdbe0cff67ebcd5ca2349a3d54b87eedbb3c168f19`). Earlier backups remain untouched.

Safe source rollback: `git worktree add ../borsal-before-fix1 borsal-pre-design-identity-20261115T124534206Z`. Private `RESTORE.txt` documents cloning the bundle and restoring the archive into NEW directories/namespaces. Never overwrite the live database or replace its latest usage ledger with an older copy.

## Exact mismatch causes

The actual saved Coin Purse concept explicitly says **Velcro**. Its old image-prompt builder checked zipper/button/snap cues but not Velcro, then defaulted a pouch to a gathered top with ties. That independent visual hypothesis did not follow the approved closure requirement. The later explicitly selected technical alternative used an integral flap and paired magnetic snap. These were three distinct implementations.

The gallery had source/review/proposal checks, but no authoritative design revision, and its renderer fell back to historical images when current images were absent. A warning did not prevent those images from occupying the main product gallery. Original concept text could also leak back into new prompts after an alternative was selected.

## Authoritative specification

`src/services/designIdentity.js` constructs `borsal.design-identity/0.1` snapshots from existing project, source, concept/review and selected proposal records. Snapshots are persisted in **CreationProject.designVersions**, with **activeDesignFingerprint** identifying the active version. There is no second workflow engine or independent geometry validator.

Each snapshot carries project/fabric/run/concept references, source/concept/review hashes, approval version, product function, silhouette, closure requirements, distinctive details, attachments, known source bounds/area, proposed dimensions/component roles when present, technical proposal ID/version/hash, original requirements, explicit changes, unresolved information, parent fingerprint and stable content fingerprint. Missing category/dimensions remain null; physical properties remain unknown or explicitly declared/unverified.

Selecting an existing historical context restores its stored identity. New contexts append snapshots; old versions are never rewritten. Legacy records are resolved read-only and remain unbound until an explicit project selection or generation action persists the corresponding version. No migration writes the owner's historical data during startup or tests.

## Concept and technical propagation

Technical requests now receive compact active-design requirements, the source fabric reference and design fingerprint. The full snapshot is retained in request/proposal provenance. Unsupported required closures must be reported as unsupported, rather than silently substituted. Known contradictory technical closures remain incomplete with explicit errors and no current cutting/nesting preview; deterministic derivations inherit the original requested identity.

Existing geometry/nesting/assembly authorities are unchanged. The existing explicit construction-selection gate is reused. An accepted alternative creates a separate design revision whose active requirements reflect that construction, while preserving the original concept and closure in history. Rejected or unselected model output cannot silently authorize a different closure. Later generation compares against the **active alternative**, not the superseded original closure.

Project/source/concept/proposal/review checks, optimistic concurrency, confirmation, idempotency and protected local operations remain enforced. Requests from stale design dialogs fail before inference; ongoing sets recheck design/source/review before each view. Usage is informational only; actual Free-tier checks and no-retry behavior remain intact.

## Preview and review propagation

New image prompts use the active function, silhouette, closure, details, source constraints and supported technical evidence. They no longer introduce a generic gathered pouch closure. Contradictory recognized closure directions are rejected before a provider request. A changed construction does not retain superseded closure features in its active prompt.

All four views share one frozen specification. Hero references must belong to that same fingerprint. Every new view/set records the design fingerprint/version/snapshot and applicable technical proposal provenance. One button, one confirmation for up to four sequential calls, per-view status, receipts, partial success and no retries remain unchanged. Neither FLUX nor gallery layout was replaced.

- **Exploratory concept images:** no usable selected technical construction; still tied to their exact design context.
- **Current design images:** generated for the active design and usable selected technical proposal.
- **Historical images:** older/different fingerprints, plus legacy images without identity metadata. They remain accessible but are never relabeled as current.

Review Product shows Current Design (function, silhouette, closure/construction, changes and original requirements/history), then the gallery and existing cutting/layout/assembly/material evidence. If no matching images exist, it states **“Current design preview not generated.”** One full-set generation action remains available when the existing provider guards permit it. Internal evidence stays in Advanced Details.

## Scenario A: original historical regression

`node scripts/design-identity-replay.cjs` copied the actual saved Velcro Coin Purse project into a NEW isolated database. It retained the original selected snap-flap proposal, original images and review history. Binding the existing explicit selection created a separate snap identity with Velcro retained in the original requirements/parent revision. All four historical image URLs remained accessible, none appeared as current snap imagery, and reload preserved the active identity. Original database hashes matched before/after.

Actual replay evidence: `data/design-identity/saved-replay-1794755061577/report.json`. This is original saved evidence replayed offline, not a new live generation or owner approval.

Mocked API regression also exercises Velcro image prompts, rejects drawstring directions before inference, requires explicit snap alternative acceptance, and verifies that the subsequent four-view set targets the selected snap fingerprint/proposal. Original exploratory receipts remain byte-for-byte unchanged.

## Scenario B: fresh project

The isolated API test starts empty, uploads a photograph through multipart registration, confirms detected geometry explicitly, obtains mocked new concepts through the live-capable protected route, approves a closure-free idea, generates exploratory views, generates/selects existing-engine construction, validates/nests it, creates a four-view current-design set and reopens the exact version. Materials/stock/physical evidence remain unverified; production readiness remains false and inventory is unchanged. Another project/source, stale review, wrong proposal and conflicting closure cases are rejected by these tests and the retained guard tests.

Desktop browser verification started from a genuinely new isolated project with TEST_FIXTURE providers. It exercised upload, analysis/confirmation, concepts, four exploratory views, explicit approval, technical generation/selection, real cutting/nesting SVGs and prototype-only review. Completion continued in the SAME fixture project after correcting test-driver timing/punctuation, then generated four current-design views, checked all view fingerprints/proposal IDs, inspected assembly/materials and reloaded successfully. No coordinates, BOM IDs or technical JSON were typed. No live inference or real inventory mutation occurred.

Browser evidence at **both 1440 and 1920**:

- Historical regression: `data/local-mvp/real-creation-check-1794755123412/` — `identity-current-design`, `identity-empty-current-gallery`, cutting/assembly and reopened-review PNGs, plus `report.json`.
- Fresh upload through construction: `data/local-mvp/real-creation-check-1794754629518/` — upload, analysis, concept/gallery, pattern/nesting, review and separated historical-gallery PNGs.
- Fresh completion: `data/local-mvp/real-creation-check-1794754865087/` — `fresh-current-design`, `fresh-current-design-gallery`, cutting, layout, assembly, materials and reopened-review PNGs, plus `report.json`.

Screenshots were visually inspected; browser checks found no console exceptions, undersized text or horizontal overflow. Reduced-motion and resume checks passed. Mock images are visibly TEST_FIXTURE, not claimed as AI photography.

## Verification notes

Focused tests: **51 passed / 7 files** (`data/design-identity/focused-complete.log`). Final full regression/build/checkpoint results are recorded below after verification. No assertions or tolerances were loosened. One existing integration test now fetches the current project revision before its compare-and-swap test because generation persists a design snapshot; its success/stale-version/cross-project assertions remain unchanged.

The added identity context initially exceeded the existing prompt preflight cap. Duplicated wording/metadata was compacted instead of raising that guard; the required fabric reference was retained. Existing selected-concept scope wording was restored to preserve its guard test. Browser driver waits now await actual asynchronous controls rather than assuming a fixed render time.

Current shared usage is **54 requests, internal limit null**; ZERO live calls during this task. All mocked requests use separate test ledgers. The frontend build retains the pre-existing >500 kB bundle warning.

## Owner's brand-new project test

1. Run `npm run mvp`; open `http://127.0.0.1:5173` and create a new project. No demo data is inherited.
2. Upload your photograph with the correct mat preset; inspect and explicitly confirm the detected outline. This is not independent physical verification.
3. Refresh the existing Workers Free dashboard attestation if required. Generate Ideas only after its visible confirmation; select an idea and inspect its stated function/closure.
4. Generate a full preview set if desired. Before technical selection these are exploratory illustrations. Approve the concept for drafting explicitly.
5. Generate Product Design. If the available construction changes the approved mechanism, review and explicitly accept a separate alternative, or retain the original unsupported design. No silent substitution occurs.
6. In Review Product, inspect Current Design, actual pattern/layout, assembly and missing evidence. A different technical revision does not inherit the old images: generate its own full set with the four-call confirmation.
7. Reload/reopen the project; verify the same active design, matching current gallery and accessible historical images. Physical/manufacturing approval remains separate and blocked without evidence.

## Remaining boundaries

Version/provenance and recognized closure-conflict checks are deterministic; general natural-language semantics are not a complete product-engineering proof. Unknown or unsupported characteristics remain unresolved. No new Velcro/weaving construction algorithm was added. Model obedience, exact silhouette/texture and pixel-level image fidelity were NOT verified by inference or image-content analysis. Matching metadata is not such proof. Physical measurements, material suitability, genuine stock and successful assembly still require independent evidence. Fix 2 was not started.


## Final verification and checkpoint

**51 focused tests / 7 files passed; 849 regression tests / 66 files passed** (217.39 s). Final production build passed (1.38 s). Logs: `data/design-identity/focused-complete.log`, `regression-complete.log`, `build-delivery.log`.

Final local checkpoint tag: `borsal-unified-design-identity-20261115T170937196Z`. Private restore-verified backup: `E:/Borsal-Recovery/borsal-pre-model-upgrade-20261114T170313Z/design-identity-verified-20261115T170937196Z`. The tag and its `VERIFIED-DELIVERY-ADDENDUM.json` record the final commit hash. No push or merge.
