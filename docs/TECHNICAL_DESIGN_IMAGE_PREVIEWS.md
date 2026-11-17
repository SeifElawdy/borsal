# Technical-design-aware image previews

## Preservation
Main worktree started clean at `7ed9dbc`. Verified source recovery bundle: `data/technical-image-checkpoint-20261116-184917/source.bundle` (complete HEAD history). No owner database, original images, accounting records or historical worktree were changed. No commit was requested or created.

## Cause and fix
Existing Fix 1 binds versioned design identities and proposal IDs, but image prompts contained concept-stage instructions to add volume and plausible finishing. Selected proposals supplied incomplete technical context; old previews without a construction brief could still match the gallery. This permitted concept imagery to suggest unsupported construction.

`technicalImageBrief.build` deterministically extracts the selected proposal's engineering plan, derived candidate or legacy technical envelope, component geometry/quantities, allowances/folds, operations, materials and saved assembly instructions. It binds project, concept, source hash, proposal ID/version/hash and design fingerprint, with a stable brief hash. Cutting dimensions are explicitly not verified finished dimensions. Rejected, conflicting, incomplete or mismatched proposals are blocked before provider dispatch. The protected route requires an explicitly selected proposal for technical images.

Technical prompts prohibit undocumented closure/hardware, extra panels/pockets/straps, inferred gussets/base/depth and finished capacity claims. Concept-stage embellishment instructions are omitted. All four sequential views reuse the same immutable brief; its hash is saved per image and set, and included in cache fingerprints. Hero references cannot override the selected technical brief. Existing source/identity checks before each view and after inference retain concurrent changes as stale, without reassigning assets.

## UI and provenance
Review Product labels Selected Technical Design Images with the selected name and technical version, and separately displays Original Concept Images. Images without the matching technical brief cannot appear as current technical imagery; historical images remain available under Advanced Details. No legacy image is rewritten. Missing images show an empty state and an explicit generation action.

The existing confirmation still shows model, four calls, conservative Neuron hold and Free-tier status; it now also names the selected technical proposal/version. No render, reload or selection dispatches inference. Atomic accounting, receipts, idempotency, partial success, no retries/fallback, inventory and manufacturing guards are unchanged.

## Files
- `src/services/technicalImageBrief.js`, `.test.js`: deterministic brief and focused checks.
- `src/services/productPreview.js`: brief, exact-version provenance and cache binding.
- `src/services/previewPrompt.js`: technical-authoritative prompting without concept embellishment.
- `src/services/previewSet.js`: shared brief hash for four-view set.
- `src/routes/creationStudio.js`: selected-proposal guard.
- `src/routes/designIdentity.test.js`: real protected mocked gallery provenance checks.
- `client/src/liveStudio.jsx`: selected-name/version consent and separated galleries.
- `client/src/previewGallery.mjs`: require brief-bound technical images.

## Verification
Focused suite: 35 tests across technical brief, prompt, gallery, creation studio and historical/fresh design-identity scenarios. Initial prompt-size failure was fixed by eliminating duplicate evidence, without raising the existing 12 KB limit; affected tests were rerun successfully. Final affected run recorded in `data/technical-image-verified.log`. Build passed (`data/technical-image-build.log`); existing >500 KB chunk warning remains. Protected tests use isolated UUID databases, simulated image providers and assert real fetch is never called. They cover four-view persistence, consent, budget/ledger controls, identity history and production blocking. No live inference performed. No new desktop browser session was run; frontend verification comprises production build and gallery-state tests, plus inspection of Review Product wiring.

## Owner check
Open a saved project; explicitly select a valid technical alternative, then Review Product. Confirm its name/version, cutting and assembly evidence. Original illustrations remain in their own section. Click Generate images for this technical design only when ready for a separately authorized live set; review the confirmation and current Free-tier status. Switching versions must not display the previous set as current.

## Limitations
Prompts and matching provenance do not verify image pixels, exact material texture, cross-view consistency or physical construction. Independent FLUX views may still deviate. Unsupported/missing engineering information is blocked rather than invented. Geometry fit never establishes manufacturing readiness. No live quality or browser-render fidelity claim is made.
