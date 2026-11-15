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
