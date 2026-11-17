# Fix 2 — one authorized live evaluation

November 16, 2026. The owner explicitly reduced the requested two tests to **one**. This was not a mock-provider test. All pre-live gates passed: 875 regression tests, focused checks, production build, Edge at 1440/1920 and verified recovery. Source checkpoint: `b742e10d0fd11d15e1db792637e281c533ac6ec3`, tag `borsal-general-engineering-offline-20261116`.

## Project and source

- Project: `6afa552c54e64817d5ac7218`, “LIVE engineering evaluation - synthetic calibration source”.
- Isolated database: see `data/general-engineering/live-verification.json` and `live-workspace-*.json`. Original owner database document/index hashes were compared with the verified pre-task snapshot and remain identical.
- Uploaded image: `data/test-mat40.png`, a **synthetic calibration photograph**, not an independently measured physical scrap. The actual multipart API detected four markers and a 74-point polygon. Recorded bounds 11.3889 × 23.3611 cm; area 162.0459 cm². The detected outline was explicitly confirmed through the normal UI, without asserting physical measurement accuracy.
- Saved original upload: `data/local-mvp/uploads/6afa553154e64817d5ac7219/11f2535a-0392-4f87-b6f0-522449680316.png`.
- Concept run: `6afa560554e64817d5ac721c`.
- Selected concept: `0fb37fcc-ceb2-4c68-ab0e-121ea1157314`, model concept ID `fabric-accessory-1`, **Zipper Pouch**. Explicitly APPROVED_FOR_DRAFTING review version 1. Function: organization/storage; required zipper along top opening. No closure substitution was accepted.

## Actual requests and costs

| Request | Model | HTTP / finish | Input / output tokens | Reported Neurons |
|---|---|---|---|---|
| Ideas | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | 200 / stop | 1,695 / 576 | 163.16957092285156 |
| Engineering | `@cf/openai/gpt-oss-120b` | 200 / length | 2,034 / 2,048 | 204.3541259765625 |

Ideas receipt: `experiments/design-language/ai-spike/results/campaigns/mvp-concepts-471fecd0-faf8-4eeb-9b64-25d11b5504cf/`.
Engineering receipt: `experiments/design-language/ai-spike/results/campaigns/mvp-technical-964973e1-229a-44e7-a507-9afa9a7382cd/` (request, raw response, provider envelope, output diagnostics, proposal and result).

Three schema-valid ideas were returned: Zipper Pouch, Hair Tie and Coin Purse. They are relevant but conventional; this is not evidence of exceptional creative diversity. Zipper Pouch was chosen because it tests joining, closure and explicit hardware requirements supported by the new catalog. No prewritten technical proposal was injected.

GPT-OSS used the existing native `/ai/run` provider, JSON Mode, temperature 0.3, low reasoning, 2,048 output tokens and 120-second timeout. The response extraction succeeded. No transport/envelope defect occurred.

Both calls were initiated through the user-facing confirmation controls with atomic accounting. A test-harness navigation failure occurred before technical dispatch; the unchanged ledger/absent dispatch receipt confirmed no provider call, and navigation was resumed. No inference was retried, repaired or replaced. Final global usage: **68**, starting at 66. Reported total: **367.52369689941406 Neurons**. Conservative holds retained: 2,350 Neurons, leaving 7,650 in the isolated test workspace's owner-attested allocation; holds are not actual billed usage. Four image calls remained unused. No paid setting was enabled.

## Exact technical failure

Proposal `6afa577c54e64817d5ac721e`, version 1, remains immutable MODEL_OUTPUT / REJECTED / FAIL. Error: `INVALID_JSON`. The raw response is 5,478 bytes and ends inside the second component's coordinates. `finish_reason=length`; six containers remain unclosed. Whitespace fraction is approximately 24.9%, not a whitespace loop.

The completed first component is named FrontPanel, quantity 1, BODY, with 0.5 cm proposed allowance. Its 74 vertices match the entire source polygon **exactly** (162.0459 cm²), exceeding the engineering contract's 64-vertex component limit. The back is described as a mirrored front, but its vertex array is truncated. If both whole-source panels were completed as described, their stitching demand alone would be at least 324.0918 cm² before allowances; this is a conditional diagnostic, not a computed valid cutting demand. The concave source boundary is also unsuitable for the implemented uniform convex allowance derivation.

The partial response uses `schemaVersion:"0.1"`, rather than `borsal.engineering-plan/0.1`. JSON parsing fails before those schema defects can be validated. No complete materials, joins, assembly sequence or unresolved list was returned. A complete first polygon is not sufficient evidence to fabricate the missing second piece, finishing or assembly. Nothing was closed, simplified, resized or silently repaired.

**Construction compilation, cutting validation and nesting did not run for this live proposal. No live cutting SVG, nesting SVG, assembly SVG, BOM or four-view gallery exists.** Geometry PASS from authored offline tests is not substituted for this failure.

The general limitation is output-contract adherence and bounded response allocation when the model copies dense source context instead of proposing compact component parameters. A larger token budget alone would not fix duplicated full-source demand. Generic prompt clarification was added offline (exact version literal; parameterized shapes; compact local polygons; source boundary is context), preserving arbitrary supported geometry and the 2,048-token low-reasoning configuration. It has not received a second live test.

## Review, reload and identity

Review Product displays Zipper Pouch, the zipper requirement, no selected construction, no invented pattern, and the rejected validation state. A **REVISE** decision was saved through the ordinary UI with a factual note about truncated output. Reload restored the same project/concept/proposal/review and improvement stage. The active source and concept remain linked to the request's design fingerprint. Source and raw response hashes match persisted evidence.

`data/general-engineering/live-verification.json` records owner-data immutability, production readiness false, zero test inventory and zero accessory stock. No reservation, production approval or manufactured physical evidence exists.

Screenshots at 1440/1920: `data/general-engineering/live-browser/` — upload, analysis, ideas confirmation/results, engineering confirmation/result, Review Product, saved review and reopened review. The live call steps use the real React handlers, protected Express routes, real MongoDB and global ledger. External providers were not mocked. Later offline regression/browser checks use explicitly labeled TEST_FIXTURE providers in separate databases.

## Result

| Criterion | Single live test |
|---|---|
| LIVE inference | PASS — two logged real requests |
| Source processing | PASS — actual pipeline on disclosed synthetic image; physical accuracy unverified |
| Concept relevance | PARTIAL — relevant, conventional ideas |
| Construction generation | FAIL — truncated, invalid JSON |
| Cutting geometry | FAIL — no valid compiled proposal |
| Nesting | FAIL — not run; no valid cutting inputs |
| Assembly | FAIL — absent |
| Four-view gallery | FAIL — deliberately not dispatched after technical failure |
| Design consistency | PARTIAL — selected name/function/zipper retained; no pattern/image comparison possible |
| Review / persistence | PASS — REVISE saved and restored; owner records unchanged |
| Overall end-to-end product | FAIL — no validated live product design |

No second product was tested, per the owner's latest instruction. No model-ranking conclusion is supported. The deterministic compiler's authored generalization evidence is separately documented in `GENERAL_PRODUCT_ENGINEERING_FIX2.md` and `data/general-engineering/offline-cases/`.

Next action requires a new explicit authorization: assess the clarified compact plan contract on one selected concept without copying dense source coordinates. Do not increase tokens or run a repair loop merely to complete this report. Any successful plan must still pass the existing compiler, nesting and construction checks; physical manufacture remains unverified.
