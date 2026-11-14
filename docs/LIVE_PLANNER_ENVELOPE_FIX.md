# Live planner envelope fix — 14 November 2026

Branch: `fix/live-planner-envelope`, created from the clean release `f217f2a0ea13a2bd38779c7293f69affaf9c9545` before edits. The release branch/tag, verified recovery backups and source ZIP are preserved. **No new Cloudflare inference/API request, retry or fallback is permitted in this fix.** Official public documentation was read only.

## Exact demonstrated cause

Newest captured failure: `mvp-technical-08a057f5-6861-4c95-9c5d-8f26add0d5a4`, reserved slot **28**, `2026-11-14T19:09:05.783Z`. Existing files remain in `experiments/design-language/ai-spike/results/campaigns/<campaign>/`.

- Request: `POST /client/v4/accounts/<redacted>/ai/run/@cf/openai/gpt-oss-120b`; JSON Mode, `stream:false`, temperature 0.3, max_tokens 1536, timeout 120s. Prompt: 5,029 bytes; conservative estimate 282 Neurons, 300 hold.
- Actual response: HTTP **200**, JSON root `success:true`, `errors:[]`, `result.object:"chat.completion"`, one assistant choice with `finish_reason:"stop"`.
- Final text is **`body.result.choices[0].message.content`**, a string containing valid `borsal.construction-intent/0.1` JSON. Separate `reasoning` / `reasoning_content` fields are not final text and must not become proposals.
- The old adapter required **`body.result.response`**. That absent legacy field caused INVALID_PROVIDER_ENVELOPE before usage/final content could be returned, producing the saved local 502/FAILED receipt. This is an output-envelope integration defect, not a demonstrated request-configuration, network, model-inference or JSON-generation failure.
- Original capture did not record HTTP Content-Type. JSON decoding succeeded, but the exact MIME header cannot be reconstructed. Future captures record the safe MIME type when supplied. Raw JSON/body and original failure/receipt remain unchanged.
- Actual latest usage recovered from the saved envelope: **1,680 prompt / 872 completion / 2,552 total tokens; 112.90876770019531 Neurons**. No truncation. This does not refund the original hold or alter its historical FAILED state.

## API comparison and minimal fix

| API | Contract / relevance |
| --- | --- |
| `/ai/run/<model>` | Workers AI wrapper; the [REST guide](https://developers.cloudflare.com/workers-ai/get-started/rest-api/) shows legacy `result.response` for Llama. The [GPT-OSS model page](https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/) supports this endpoint; actual retained GPT-OSS responses contain a Chat Completions object under `result`. Keep the proven endpoint and generation settings. |
| `/ai/v1/chat/completions` | [Documented OpenAI-compatible endpoint](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/) with `model` and `messages`. No endpoint migration is needed to parse the observed nested Chat Completions response. |
| `/ai/v1/responses` | The same official documentation supports non-streaming Responses requests only for GPT-OSS, using `input`. This request did not use Responses and did not return a Responses object. Do not reinterpret arbitrary output/reasoning items as a final answer. This adapter continues to reject that unconfigured response shape. |

The adapter now preserves legacy `result.response` behavior and accepts the demonstrated single assistant Chat Completion. It returns final `message.content` **unchanged**, retaining actual usage/finish reason/truncation. It rejects explicit error envelopes, nested inference errors, refusal/tool-only output, missing/empty final text, wrong roles and ambiguous multiple choices. It never concatenates reasoning, strips Markdown or repairs model JSON. Existing Zod/construction/nesting validation remains authoritative.

`src/services/fixtures/gpt-oss-chat-envelope.json` is a sanitized actual failure: final content and usage are unchanged, provider ID/reasoning/unused metadata removed or redacted. Original-envelope and final-content SHA-256 values retain traceability. Original private artifacts were not edited.

## Offline recovery results

All three captured failed GPT-OSS responses were replayed through the fixed adapter using mocked transport and **zero network/model calls**. Results are private under `data/planner-envelope-fix/*-offline.json` and `offline-summary.json`.

| Original slot | JSON / intent schema | Preserved design result |
| --- | --- | --- |
| 26 (`205ad8c3…`) | PASS / PASS | TWO_PANEL_OPEN_SLEEVE, two 9 × 11 cm panels: **198 cm² > 162.0459 cm²**. Existing area precheck FAIL, zero placement attempts. No shrinking or successful layout invented. Usage: 1,680 / 721 / 2,401 tokens; 102.61331176757812 Neurons. |
| 27 (`74fac899…`) | PASS / PASS | Model explicitly says UNSUPPORTED; dimensions absent. No cutting candidate fabricated. Usage: 1,680 / 618 / 2,298 tokens; 95.59059143066406 Neurons. |
| 28 (`08a057f5…`) | PASS / PASS | UNSUPPORTED, function/creative changes/unknowns retained; no fabricated pattern. Usage above. |

No recovered proposal was written to the real database. The mocked integration test exercises the same protected generation route, saves unchanged final content as CONCEPT_ONLY, records usage, and verifies idempotent replay causes no second dispatch or inventory change. Future transport success therefore does **not** guarantee a supported or fitting product.

## Budget reconciliation

The last release checkpoint was **19/30**, not the current live count. Nine subsequently recorded requests consume slots **20–28**: **one concept request**, **five image requests**, **three planner requests**. The immutable legacy baseline accounts for one request; reservations 2–28 account for 27 more. Cap **30**, used **28**, remaining **2**. Failed, unknown and crash reservations are never discarded.

Three remaining is the correct snapshot at **27/30 before reserving slot 28**; it is not evidence of a 12-slot cap or project-local counter. The confirmation now refreshes server state on opening and explicitly displays used/total/remaining before the requested call. After failure it closes, requiring a fresh explicit action/confirmation. Server-side atomic reservation remains final authority across tabs.

At inspection, existing owner-dashboard proof: **4,700 conservative Neurons**, paid billing false, no blocking reason, expires **2026-11-15T00:00:00Z**. No settings/proof/ledger/history were reset or changed. One future manually confirmed planner request needs one of the two remaining slots and a 300-Neuron hold; current eligibility still must pass when dispatched.

## Verification and rollback

Focused provider/schema/API checks, full regression, React build and isolated desktop smoke are required before the fix checkpoint. The test runner excludes generated `data/` copies: an extracted release otherwise rediscovered historical test files, causing duplicate execution. Those archives/extractions are preserved; intended source tests are not removed or weakened.

Completed: **33/33 focused provider/API tests**, **806/806 full tests in 57 files** (198.08s), React production build **PASS** (1.07s), and desktop smoke **PASS** at 1440/1920 px. Browser report: `data/local-mvp/real-creation-check-1794684624786/report.json`: 28 visual audits, refreshed confirmation budget verified, no console errors, reload/resume passed, production blocked, external requests 0. Logs and audit evidence are under `data/planner-envelope-fix/`.

Final preservation audit: all **10 original user-database collections** unchanged; all **180 existing campaign/ledger files** unchanged; release ZIP checksum unchanged; budget still **28/30**. No recovered data was persisted into the real user project, no stock/inventory changed, and no old failed receipt was relabeled.

Checkpoint tag: **borsal-planner-envelope-fix-20261114** on this fix branch; exact commit/bundle evidence is saved in `data/planner-envelope-fix/checkpoint.json`. The release tag/ZIP remains at `f217f2a`.

After a clean checkpoint, restart the normal local launcher to load the fixed provider, then reload the browser. A manually confirmed LIVE request is permitted by the existing gates; **none was made here**. A returned UNSUPPORTED/oversized design still requires honest revision/selection and never receives manufacturing approval.

Rollback without resetting data: stop the launcher, run **`git switch --detach f217f2a`**, then **`npm run mvp`**. This restores code only. Keep the current **28/30** ledger, user database and all campaign artifacts; never restore the older 19/30 ledger. Do not overwrite the verified release ZIP.
