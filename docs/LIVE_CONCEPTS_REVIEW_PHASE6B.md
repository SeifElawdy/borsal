# Three saved live concepts — awaiting human selection

Extracted without alteration from Phase 6A saved raw output and its persisted-run artifact. **No new inference, review decision, approval or technical geometry was created for these concepts.** Saved state is PENDING_REVIEW / reviewVersion 0 for all three. No manufacturing feasibility is established.

Source campaign: **phase6a-burgundy-concepts-001**; model **@cf/meta/llama-3.3-70b-instruct-fp8-fast**. Fabric record **6af715aa702bbc870df35fba**, run **6af715ab702bbc870df35fbc**, original analysis **445d047f-3437-4dd1-b8e3-a1bd40abfb77**. The image/geometry is a synthetic calibration fixture; “synthetic burgundy fabric” below is model wording, not a verified fiber specification.

## Burgundy Wrist Cuff

- **API concept ID:** `7588e40c-fc91-4921-9684-2dc22bdcef46`; model ID: `burgundy-wrist-cuff`.
- **Actual description:** “A stylish and elegant wrist cuff made from a scrap of synthetic burgundy fabric”.
- **Intended use:** Fashion accessory.
- **Creative feature:** “The cuff has an elastic section to fit snugly around the wrist”.
- **Accessory/material implication:** An elastic section is proposed. The response does not say whether this is separate elastic stock, how it connects, its quantity/specification, or whether any elastic is available. Do not infer that the scrap itself stretches.
- **Model constraints:** Comfortable to wear; durable.
- **Model-listed unknowns:** Fabric strength and stretchiness; fabric suitability for a cuff.
- **Additional review needs (not generated design details):** Size/user needs, retention/comfort, construction, actual source grain/material data, edge finish and any required elastic/closure stock. Nothing here verifies a snug fit.

## Burgundy Keychain

- **API concept ID:** `a96f954a-3083-491b-9976-93d3bdbb7111`; model ID: `burgundy-keychain`.
- **Actual description:** “A small and functional keychain made from a scrap of synthetic burgundy fabric”.
- **Intended use:** Key holder.
- **Creative feature:** “The keychain has a sturdy key ring to hold multiple keys”.
- **Required accessory mentioned:** A key ring. No specification, verified quantity, supplier/stock or attachment point is supplied. “Sturdy” is untested intent, not an engineering result.
- **Model constraints:** Easy to attach keys; durable.
- **Model-listed unknowns:** Fabric tear resistance and abrasion resistance; durability suitability.
- **Additional review needs:** Actual dimensions/use, ring/attachment construction, reinforcement or seam requirements, load/abrasion testing and material/stock data. No ring availability or safe carrying load is established.

## Burgundy Brooch

- **API concept ID:** `d64a858c-cda0-41b6-bc82-46b88f65b546`; model ID: `burgundy-brooch`.
- **Actual description:** “A decorative and elegant brooch made from a scrap of synthetic burgundy fabric”.
- **Intended use:** Fashion accessory.
- **Creative feature:** “The brooch has a secure pin to attach to clothing”.
- **Required accessory mentioned:** A pin. No type, specification, verified quantity, availability or mounting location is supplied. “Secure” has not been tested.
- **Model constraints:** Secure on clothing; visually appealing.
- **Model-listed unknowns:** Fabric colorfastness and texture; appearance suitability.
- **Additional review needs:** Specific appearance/silhouette, dimensions, pin/backing construction, handling/clothing safety, retention and actual material/stock data. No attachment geometry or safe retention is inferred.

## Shared provenance and review boundary

All sourceReferences equal **`fabric-6af715aa702bbc870df35fba`**. Stored source snapshot hash: **e292c567c497217d083a5d78a3263d066c800cc9bf0445e4c09614f7d723cff1**. Whole raw batch SHA-256: **9f5e1b32a71085c7d7489d52d8c285e3b37af54933156cf7bea27c9c34be623a**.

Per-concept raw hashes (JSON.stringify of unchanged parsed child, as in the API):

- Wrist cuff: `a94851880e38fe6526895f261e3423dc81fcfe16428b482943e13f36c2ebca37`.
- Keychain: `064d87839e18a1c0f113f4602c43cfe75601f0ff89b84c24a8b9d8c78f3c1a5b`.
- Brooch: `a110cb48a9ac212567adca8dae846f5f58b7ac483abf733f881dd4a0cfec581c`.

Original raw output: `experiments/design-language/ai-spike/results/campaigns/phase6a-burgundy-concepts-001/raw-response.txt`; persisted-run artifact: `data/mvp-design-flow-6a-live-001/concept-run.json`. These ignored files remain unchanged.

These are ordinary accessory ideas, not evidence of novelty or proven suitability for the actual scrap. No dimensions, cutting polygons, seams, attachments, BOM quantities, material properties or available stock were generated. A human must select one and explicitly approve for drafting, request revision or reject it. Approval must include a reviewer-authored drafting brief if a technical handoff is desired; no simulated test approval applies to these live records.

The saved fabric is DRAFT/AVAILABLE and physically UNVERIFIED. A technical submission can remain CONCEPT_ONLY while source confirmation/material/grain/stock evidence is absent. Existing source-staleness guards must be respected: confirming/changing the fabric after generation changes its source hash, so do not overwrite or silently rebase the saved review. Any source-refresh workflow needs an explicit reviewed action, not another automatic inference or a budget reset.
