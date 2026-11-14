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

Completed focused verification before resumption: 44 budget/API tests; then 71 construction/provider/API/campaign tests. Full regression, production build, browser demonstration and actual live outcome are pending at this checkpoint and must not be described as completed yet.

Launch: `npm run mvp` → **http://127.0.0.1:5173** (MongoDB replica set required). Safe fixture launch: `node scripts/local-mvp.js --mock --geometry-first`; it creates a fresh isolated test workspace, never resets a user project, and disables network inference.

Final demonstration evidence, screenshots, usage and remaining steps will be appended after execution.
