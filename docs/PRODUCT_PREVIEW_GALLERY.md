# Product preview gallery — one-button full set

## Focused quality update (current)

The one-button four-request job, confirmations, progress, caching and partial-success behavior are unchanged. ZERO live inference in this update.

- Inspected the saved live Coin Pouch: Hero copied corner fiducials; Alternate hid the recognizable opening/body; Details was another full-product frame. The full calibration photograph exposed marker pixels, and the shared specification lacked a fixed silhouette/closure or a single macro target.
- A concept-specific visualDesign is now created and stored BEFORE the job composes its four prompts. Every view receives exactly the same serialized specification/hash: silhouette, opening/closure and count, distinguishing features, source-constrained approximate scale, material appearance, one detailFocus and the actual useAction. Unspecified decisions are explicitly visual hypotheses, not technical approvals or verified stock. Stated closure features/material requirements take precedence.
- Coin Pouch example: upright rounded body, gathered top and two matching fabric ties, one opening-edge/channel macro target and coins being placed through that SAME opening. Proposed 6.3 × 6.9 cm appearance targets are derived from the supplied scrap only for visual scale, not finished measurements, cutting patterns or fit proof.
- Alternate is limited to an opposite front-quarter 30–45° view, keeping the opening and distinctive silhouette visible. Details is a true macro of that single named feature, occupying 80–95% of frame with most of the body cropped out. In Use performs the actual shared useAction without redesigning the closure/body.
- For source photos with trustworthy stored calibration, the existing inverse homography projects the existing fabric contour/holes into the EXIF-normalized photo. A DERIVED masked fabric-only reference removes mat, markers and non-fabric background and flattens it to neutral. It does not modify the original photo, contour, homography or source record. No geometry or material property is inferred. Legacy/invalid transforms fall back honestly to the original image rather than guessing a crop; this limitation is recorded.
- The original Coin Pouch photo yielded a 411 × 841 px masked appearance reference. Offline evidence: data/preview-quality/derived-fabric-reference-neutral.png and proposed-prompts.json. Hero/source conditioning still uses the existing supported input_image_0. Hero background symbols, mats, grids, rulers, fiducials and reference-board layout are explicitly contamination, not design features, and are forbidden anywhere in the output.

Recovery was verified before editing. Prior checkpoint 3618407 and its bundle remain valid. A new verified Git/data/MongoDB backup plus the exact current working-source files/patch is saved privately at:

E:\Borsal-Recovery\borsal-pre-model-upgrade-20261114T170313Z\pre-preview-quality-20261115T104303725Z

It restores 51 documents with matching collection/index hashes, zero failures, 357 hashed artifacts and the previously uncommitted full-set implementation. See VERIFIED-DELIVERY-ADDENDUM.json, VERIFIED-WORKING-SOURCE.json, working-changes.patch and working-source/. To recover, clone the bundle into a NEW directory at its saved base, then copy the verified working-source tree into that NEW checkout (including its new worker file). Never overwrite the active database/ledger or old backups.

**36 focused tests passed**, including four-prompt immutable specifications, distinct camera/macro/use contracts, conditioned reference-board pixels, marker-free synthetic fabric masks/holes, original-data immutability, safe fallback and actual mocked four-view API generation/provenance/failure safety. React production build passed. No live quality claims or new manufacturing evidence were established. Logs: data/preview-quality/focused.log and build.log. Approximate texture/color, legacy crop fallback and actual model adherence remain limitations requiring a separately authorized live test.

## Current workflow

**Generate Full Preview Set → one confirmation for up to four calls → Hero → Another Angle → Details → In Use.** The four sequential requests run on the server, not through four manual buttons. No retry or fallback is performed.

- The existing protected endpoint family now includes POST /api/concept-runs/:id/concepts/:conceptId/preview-sets with X-Borsal-Calls: 4. It returns 202 with a saved operation/set ID. A complete matching set can be reused without new inference. Idempotency and the existing pending-image lock prevent duplicate/concurrent sets and per-view dispatch.
- All four images belong to one saved gallery group. Each view persists QUEUED, GENERATING, SUCCEEDED or FAILED, its prompt/provenance/model/usage and its own campaign receipt. Progress polling and reload only read local data; they never dispatch or resume inference. Successful images remain visible even when the parent set fails.
- The Hero uses the actual fabric photo. Later views use ONE supported input_image_0 containing a two-panel reference board: original material at left, the generated Hero at right. The same visual specification and Hero hash anchor every later view. This preserves material and identity context without adding unsupported provider fields or extra AI planning calls.
- Prompts emphasize a believable finished product, intentional functional form and finishing, actual concept purpose, source color (including burgundy when present), appropriate small-scrap scale and active use rather than random hand-holding. All construction choices remain illustrative hypotheses. Exact visual consistency, texture fidelity and manufacturing feasibility are not claimed.
- One conservative 600-Neuron hold is required up front; current Free-tier eligibility is rechecked before every view. Each actual image request is logged in the existing informational ledger before dispatch. Unused/unknown holds remain conservative rather than inventing zero usage. A failed Hero or authentication/quota/source failure stops the remaining requests safely. An ordinary later-view network failure can leave that view failed while subsequent authorized views continue with the saved Hero.
- The gallery remains in selected-concept details and product review, with one primary action, per-view progress and the existing four tabs. Saved historical images remain available. Diagnostics stay in Advanced Details. Review changes label earlier illustrations honestly; they do not delete them or pretend they are engineering evidence.

## Verified recovery and tests

Before ANY implementation changes, the completed per-view work was committed as **36184070c98bd0201aae91af6d34b74fffe13637** and tagged **borsal-pre-preview-batch-20261115T100225697Z**. Verified private backup:

E:\Borsal-Recovery\borsal-pre-model-upgrade-20261114T170313Z\pre-preview-batch-20261115T100225697Z

The Git bundle was verified; official MongoDB dump/restore matched all 46 documents and collection/index hashes with zero restore failures. All 310 copied artifacts were hashed. Prior checkpoints and the release ZIP remain untouched. Recovery instructions and manifests are inside that private directory. Restore into NEW locations only; never replace the active usage ledger or database.

**38 focused tests pass** across the actual isolated API, image adapter, reference-board pixels, prompt roles, gallery/context/history and partial-success rendering. Tests prove one four-call authorization, queued/generating checkpoints, duplicate prevention, mandatory Hero references, continued In Use after a detail failure, safe Hero failure, actual Free-tier headroom and retention of prior groups. Source/review/approval and inventory safeguards are unchanged.

Actual Edge/CDP fixture journey passed at **1440 and 1920px**, including one full-set confirmation, all four saved tabs, In Use viewing, source upload/confirmation, concept approval, actual pattern/nesting, prototype review, blocked production, reload and previous-version reopening. Readability/overflow audits and browser exceptions passed. Evidence/screenshots: data/local-mvp/real-creation-check-1794738415622/. The image provider was MOCKED and clearly labelled TEST_FIXTURE; these are not quality-validation images.

Logs: data/preview-batch/focused.log and build.log. React production build passed. Existing large-chunk warning remains nonblocking. **ZERO live Cloudflare calls** during implementation. Live visual quality still requires an explicitly authorized owner test; it was not inferred from mocks.

Keep the local server running until a set finishes (up to four bounded image timeouts). This lean prototype has no durable job runner: a process interruption preserves receipts/images but does not automatically resume or retry the remaining calls. Changing source/review mid-job stops rather than silently rebasing the set. No manufactured physical evidence, approval or inventory mutations were introduced.

Launch: npm run mvp → http://127.0.0.1:5173. Backend changes require restarting the launcher; refresh the browser afterwards.

---

## Previous per-view implementation (historical, preserved for API compatibility)

# Product preview gallery

Recovery was verified **before implementation**: tag `borsal-pre-preview-gallery-20261115T093812802Z`, source commit `1bab4276096fe54b598048514ec77596b6f2b090`. Private backup: `E:\Borsal-Recovery\borsal-pre-model-upgrade-20261114T170313Z\pre-preview-gallery-20261115T093812802Z`. Git bundle verified; MongoDB dump restored into an isolated database: 42 documents, zero failures, matching collection/index hashes. All 286 copied files verified. See its `VERIFIED-DELIVERY-ADDENDUM.json` and `RESTORE.txt`. Original backups and release ZIP were not overwritten.

## Why the old preview was weak

The old path requested one neutral studio image, conditioned on the full fabric photograph. Concept information was supplied as JSON, but there was no explicit finished-object composition, distinct view, active-use scene or cross-view identity reference. It was conservative about unsupported details but did not strongly require visual transformation beyond the original scrap. This explains the prompt/logic weakness; image quality itself has not been retested live.

## Implemented behavior

- The existing image API accepts `viewRole`: **HERO**, **ALTERNATE**, **DETAIL**, **IN_USE**. Default HERO preserves older single-image clients. Each request still requires `X-Borsal-Calls: 1` and explicit browser confirmation. There is **no four-call batch**, hidden follow-up or retry.
- Each role has a purposeful product-specific prompt, grounded in the actual selected concept/name/function/features, source photograph, source geometry bounds/area and available technical evidence. Finished product, meaningful transformation, realistic purpose, approximate source color/texture and small-scrap scale are explicit. No fixed product templates or invented material/stock facts were added.
- Generate Hero first, then confirm each remaining view separately. A matching saved Hero can condition later views through the **existing `input_image_0` contract**; no unproven provider fields were added. Its visual specification is reused, with source/project/concept/review/proposal checks and image hashes. Without that reference, original-photo conditioning remains available and consistency limitations are disclosed.
- Every image has its own role, prompt, file, request receipt, usage, source/technical provenance and reference-image hash. These are independent generation requests, not crops. Caching includes the role and exact reference operation, preventing one view or older Hero series from being substituted for another.
- An error affects only that individual request. Existing completed images remain accessible. Regeneration is a new, separately confirmed call. Historical single previews remain visible and unchanged; old prompts are never overwritten.
- The gallery appears in **Explore Ideas / selected-idea details** and **Review Product**, with **Hero | Another Angle | Details | In Use** tabs, source/pattern comparison, fullscreen and missing-view generation. The current series is complete only with all four roles, including In Use. Old-source/review/reference images remain labelled historical; diagnostics and history stay in Advanced Details.

## Safety and verification

All images remain **ILLUSTRATIVE_AI_PREVIEW** (or explicit TEST_FIXTURE during tests). Visible seams, folding/closure choices and usage scenes are hypotheses, not engineering proof. Exact color/texture or inter-image consistency is not guaranteed. Independent physical dimensions, strength, material properties, stock and food-contact/hygiene/washability evidence are not invented. No production approval or inventory logic changed.

**28 focused tests passed** across prompt roles, gallery grouping/completion/history, the unchanged FLUX adapter, and real isolated API pathways with mocked providers. Tests cover four distinct confirmed calls, reference conditioning/provenance, cache/idempotency reuse, invalid references/roles, regeneration with identical reference bytes but a new version, and keeping completed images after a later network failure. No external fetch was allowed. React production build passed; existing chunk-size warning is nonblocking. Logs: `data/preview-gallery/focused.log`, `build.log`.

**ZERO live Cloudflare calls** were made. Four images require four individual confirmations and at most four new calls for a new set; matching cached results need no new call. Free-tier attestation/headroom checks, atomic usage logging, provider failure handling and no-retry behavior remain intact. Actual live visual quality needs the owner's separately confirmed trial.

Final preservation check: all 42 original user documents/indexes and all 286 checkpointed artifacts match their hashes; the original release ZIP is unchanged. Informational usage remains **33 requests used**. Evidence: `data/preview-gallery/preservation.json`. No inventory or production-approval records were changed.

Launch: `npm run mvp` → http://127.0.0.1:5173. Backend changes require a launcher restart; refresh the browser afterwards. Roll back code using the recovery tag in a separate checkout; never restore an old usage ledger or overwrite active user databases.
