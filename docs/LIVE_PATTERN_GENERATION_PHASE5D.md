# Phase 5D: one bounded live pattern proposal

## Baseline and scope

Phase 5C audit found exactly its four intended experiment files and documentation. Credential/private-key, whitespace and isolated-test-database checks passed. Full baseline: **533/533 passed**, 27 files, **80.54 seconds**. Staged diff checks passed. Phase 5C alone was committed as **4bdded5**, `feat: validate AI pattern proposals`; work moved to **feature/live-pattern-generation-spike**. Phase 5D remains uncommitted.

This experiment requests one original small fabric accessory and explicitly proposed geometry. It does not generate images, approve manufacturing, modify production APIs/data/inventory or install dependencies. It reuses the existing Cloudflare provider, schema-derived contract renderer, shared atomic request budget, output diagnostics/redaction, 5C adapter, 5B drafting, 5A bridge and Phase 4 nesting/geometry checks.

## Files and use

New files under `experiments/live-pattern-generation/`:

- `prompt.js`: human-authored open-ended brief, schema-derived compact contract and original synthetic fabric polygon.
- `evaluate.js`: raw JSON validation, unchanged 5C handoff and separately scoped geometry-only nesting evidence/preview.
- `campaign.js`: exclusive campaign artifacts, original shared request reservation before inference, exactly one direct provider call and no repair/retry/fallback.
- `run.js`: explicit live/free-confirmed CLI, mock by default, fixed approved 70B model.
- `spike.test.js`: offline parser/geometry/provider/campaign/limit/redaction checks.

```powershell
npx vitest run experiments/live-pattern-generation --reporter=dot
node experiments/live-pattern-generation/run.js --mock --campaign=my-new-offline-pattern-check
```

Mock output proves plumbing only. Importing modules never loads credentials or calls a network. Live execution requires `--live --free-tier-confirmed` and a fresh named campaign. There is no repair count, token-cap override, reset, fallback or model-selection CLI option. Do not rerun the completed approved campaign or create another live campaign without separate authorization.

## Contract and evidence boundaries

The model returns only `{design: Root, instances: CuttingInstance[]}`. `Root` is the unchanged `borsal.design/0.1` contract rendered into compact types using the existing prompt helper. Each explicit instance identifies a source pattern/copy, cutting polygon, allowance inclusion and optional tolerance/rotations using the existing 5A shape. No completed bag/pattern template is provided. Unsupported legacy category/curve/construction details must be disclosed; the accessory can use an explicitly illustrative parent bag category without inventing a full parent product.

The source is a new **human-authored experiment brief**, not an AI concept masquerading as manual work. The actual AI proposal remains separately saved and linked by hashes. The request includes the original 74-point synthetic burgundy polygon and its existing provenance; area is approximately **162.045910493827 cm2**. Host input contains no asserted material properties, stock, grain, confirmation or revision. Those values are unknown and are not copied from the artificial material/stock declarations in earlier demos.

All model dimensions, quantities, material requirements and assembly ideas are unverified hypotheses. The prompt explicitly says to omit required-but-unknown source properties and record the missing information rather than invent them to satisfy the schema. This can legitimately yield CONCEPT_ONLY even with good cutting geometry. No fabricated stock snapshot or confirmation is inserted to force the bridge to run full manufacturing-related checks.

Raw response text is parsed as-is: no fence stripping, point conversion, polygon closure repair, trimming, rounding or second request. Unexpected root stock/fabric/approval fields are rejected. The saved 5C envelope hashes link the raw design/instances to the trusted host input. Existing 5C/5B/5A readiness, errors, source snapshots and reasons remain intact.

When unknown real-world information blocks the full bridge, a **separate geometry-only screen** reuses Phase 4B on explicitly supplied cutting polygons and the original scrap. It has no inferred grain and uses 2,000 candidates, 20 backtracks and grid levels [2,1,0.5] cm. It never upgrades an incomplete/rejected adapter verdict. Proven invalid input/geometry or a failed area necessary condition makes the top-level verdict FAIL; bounded search exhaustion remains unresolved and never proves global impossibility. The original adapter result is retained separately.

A found geometry-only layout gets an SVG with a labeled synthetic scrap and explicit cutting polygons/dimensions. This preview verifies no stitching, material, source grain, stock or physical construction. If only the existing local drafting preview is available, its display caption is labeled MODEL-PROPOSED DRAFT for live output; no geometry is altered. `previewBasis` distinguishes these views. Nested 5B evidence retains its existing static renderer output; it is not proof of human authorship of model geometry. Physical accuracy and manufacturing approval remain UNVERIFIED/false everywhere.

## Free allocation and request safeguards

Provider/model: **Cloudflare Workers AI, @cf/meta/llama-3.3-70b-instruct-fp8-fast**, with unchanged JSON-object mode, temperature **0.7**, **max_tokens=6144**, stream=false and 60-second timeout. Default 8B/provider configuration is unchanged.

Current [model documentation](https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/) confirms the model ID, 24,000-token context and response_format support. Current [pricing documentation](https://developers.cloudflare.com/workers-ai/platform/pricing/) lists **26,668 input / 204,805 output Neurons per million tokens**, and 10,000 daily Free Neurons with operations failing when Free limits are exhausted. No paid model/service, billing upgrade or AI Gateway credits are used.

Reuse the project owner's explicit Workers Free/no-paid-plan confirmation from this session; no contradictory account change is known. No repeated known-403 plan/usage API probe was made. Current account-wide remaining allocation is **UNKNOWN**, not asserted from an old dashboard value. Free-plan exhaustion would stop on the single provider error without retry; no paid overage was authorized or enabled.

Before live inference the original shared ledger showed **8/12** used: one legacy smoke request plus seven append-only reservation files. Existing campaigns, smoke lock and baseline are preserved. This experiment uses that exact ledger, not a new budget. Exclusive campaign directories prevent duplicate IDs; atomic reservation files prevent concurrent campaigns exceeding the shared cap. A crash/timeout/unknown outcome consumes its reserved slot. No slot, lock, result or old counter is reset or deleted.

Prompt size is **9,340 UTF-8 bytes**. A conservative byte-plus-framing guard fits the input and 6,144 output cap under the documented context. The cost ceiling deliberately overcounts the entire 24,000-token context as input and adds the full output cap again:

`(24000 * 26668 + 6144 * 204805) / 1000000 = 1898.35392 Neurons`.

It is below the retained 2,000-Neuron experiment ceiling and the daily Free allocation, but is **not proof of remaining account quota**. Actual usage must come from the response, never this ceiling.

## Artifacts

Live artifacts use the existing ignored directory tree:

`experiments/design-language/ai-spike/results/campaigns/phase5d-burgundy-accessory-001/`

Each new campaign writes `lock.json`, `request.json`, `attempt-1.json` before the single inference. After a response it saves `response.json`, exact `raw-response.txt` (except configured secret redaction), `validation-errors.json`, `result.json` with full provenance/feasibility evidence, and `preview.svg` when valid preview geometry exists. Provider failure instead saves sanitized `failure.json`. Writes are exclusive and fsynced. Secrets and account identifiers are scrubbed with the existing redaction helper. Existing artifacts must remain untouched.

## Offline verification

New focused tests: **15/15 passed**, including raw parsing/no repair, schema-derived prompt, no fabricated host properties, geometry-only uncertainty, invalid geometry/area failures, secret redaction, openable SVG, duplicate campaigns, old lock preservation, shared cap/concurrency, crash accounting, pre-call checkpointing, one call and safe provider failure. An earlier preview-selection test found the local draft SVG replacing the more appropriate geometry-only view; selection was corrected. No test threshold was loosened.

The combined spike/5A–5C/Phase 4/old provider-campaign focused run passed **324/324**, 13 files, **33.69 seconds**. The final aggregate-geometry failure change was then verified by the new **15/15** suite; full regression and actual live results are recorded below after execution.

## Actual single live attempt: transport failure, no retry

Executed once, only after the offline checks passed:

```powershell
node experiments/live-pattern-generation/run.js --live --free-tier-confirmed --campaign=phase5d-burgundy-accessory-001
```

Immediately beforehand, hashed **53 existing artifact files** to `data/phase5d-prior-evidence-hashes.json` (ignored) and verified the original shared ledger was 8/12. The new attempt reserved **slot 9** and saved its checkpoint before invoking the provider. No other campaign or brief was dispatched.

| Actual observation | Result |
| --- | --- |
| Campaign | phase5d-burgundy-accessory-001 |
| Requested model | @cf/meta/llama-3.3-70b-instruct-fp8-fast |
| Local provider-call attempts | **1** |
| Repair / retry / fallback | **0 / 0 / 0** |
| Status | **PROVIDER_FAILED** |
| Sanitized error | **NETWORK_OR_TIMEOUT** |
| HTTP status | **null / unavailable** |
| Raw model response | **Not received** |
| JSON / Zod / creative quality | **Not assessable** |
| Feasibility / nesting | **Not run for the live attempt** |
| SVG preview | **Not generated: no live geometry was received** |
| Actual input/output tokens / Neurons | **Unavailable, not zero** |
| Final shared ledger | **9/12**; reserved slot remains consumed |
| Old artifacts | **53/53 hashes unchanged** |

The existing provider intentionally merges network failures and its 60-second timeout into this sanitized error. The underlying cause, whether Cloudflare received/completed the request, and any actual consumption are **unknown**. This is not evidence that the model returned invalid JSON or invalid patterns. No HTTP error code, model output, validation success or physical measurement was invented. There was no retry, usage probe, lock removal or budget reset after the failure.

Saved actual artifacts: `lock.json`, `request.json`, `attempt-1.json`, and **`failure.json`** in the campaign directory above. No `raw-response.txt`, `response.json`, validation-result file or preview exists for this failed transport attempt. `failure.json` is the factual sanitized result; request/provenance/configuration evidence remains in `request.json`. The path is ignored by Git and prior results are preserved.

Output-quality and creative/technical coverage conclusions therefore remain **blocked by absence of a response**. The offline/mock geometry demonstrations validate the tooling only and must not be presented as real AI performance. Any further inference requires a separate reviewed authorization and a fresh campaign; this consumed request cannot be silently reclaimed or repeated.

## Final verification

Final full regression ran **before inference on the final source**: **548/548 passed**, 28 files, **83.58 seconds**, including all 533 baseline tests unchanged. Expected injected persistence-failure logs appeared in existing API tests; no tests failed. No source changes followed that run; only factual documentation was appended after the live attempt. Working diff checks, separate whitespace/credential checks and the saved-artifact credential scan passed. No existing production source, schema, dependency, configuration, earlier artifact or test was modified. Phase 5D remains uncommitted; no push or merge was performed. Stop for review: live output quality and feasibility remain unassessed due to the transport failure.

## Offline failure diagnosis addendum

This follow-up made **zero Cloudflare requests**; all provider/transport diagnostic tests used injected mocks. It did not retry inference, query account usage, reset a lock, reclaim slot 9 or alter prior campaign artifacts. The historical outcome stays NETWORK_OR_TIMEOUT; new diagnostics cannot retroactively recover the discarded exception.

### Timing evidence versus inference

| Preserved evidence | UTC time/value |
| --- | --- |
| lock.startedAt | 2026-11-13T12:41:48.085Z |
| lock file modification | 2026-11-13T12:41:48.087Z |
| request file modification | 2026-11-13T12:41:48.162Z |
| attempt checkpoint modification | 2026-11-13T12:41:48.273Z |
| failure file modification | 2026-11-13T12:42:48.363Z |
| Checkpoint-to-failure filesystem interval | approximately **60,089.37 ms** |
| Configured deadline | **60,000 ms** |
| Saved HTTP status, error cause/name, measured transport elapsed time | unavailable |

That interval is **consistent with** a 60-second client deadline. It is not a monotonic request-duration measurement: checkpoint writing, scheduling, exception handling and filesystem writes are included, and timestamps can be copied or modified. It does not independently prove that AbortSignal fired. The old fetch catch discarded the original exception's name/cause/code and always emitted NETWORK_OR_TIMEOUT. A network/DNS/TLS/transport failure near the deadline therefore cannot be distinguished from a local timeout. No server response, model failure, successful generation, billing amount or Cloudflare-side cancellation can be inferred.

The old fetch catch happened while awaiting response headers; JSON-body parsing had a separate INVALID_PROVIDER_ENVELOPE catch. Thus the saved legacy code identifies the local failure branch, but does not establish whether bytes were sent or Cloudflare accepted/executed the request. Provider-side execution and usage remain **UNKNOWN**, not zero. A timeout does not reliably cancel already dispatched server work.

### Minimal diagnostic changes

- `experiments/design-language/ai-spike/provider.js`: retain the existing public error codes (`NETWORK_OR_TIMEOUT`, `INVALID_PROVIDER_ENVELOPE`, authentication/quota/provider codes), model allowlist, JSON Mode, 6,144-token cap, temperature and 60-second default. Add safe `ProviderError.diagnostics` containing monotonic `elapsedMs`, `timeoutMs`, request `phase`, classified `kind`, `deadlineExpired`, timeout scope and allowlisted transport code/category. No retry or timeout increase was implemented.
- Classification distinguishes **TIMEOUT** (observed own deadline or known timeout indication), **NETWORK_ERROR**, **ABORTED**, invalid response JSON/envelope, known HTTP/provider failures and unknown body-read failures. An own-deadline timeout is distinguished from UND_ERR_CONNECT_TIMEOUT/HEADERS_TIMEOUT/BODY_TIMEOUT or an unattributed TimeoutError. DNS/TLS categories require recognized explicit codes, never an inference from timing or message text.
- Safe phases are AWAITING_RESPONSE_HEADERS, RESPONSE_BODY and VALIDATING_RESPONSE. Body timeouts can retain HTTP status if headers were already observed. Unknown body errors remain unknown; a generic TypeError is not sufficient evidence of a body network fault.
- Only enumerated DNS, TLS, socket and timeout codes are exposed. Exception messages, URLs, account IDs, headers, certificate data, stacks and arbitrary cause properties are discarded. `cloudflareExecution` remains UNKNOWN on failures.
- `experiments/live-pattern-generation/campaign.js` and the existing experiment `harness.js` persist these optional diagnostics on **future** failures. Existing files are not rewritten. Legacy errors without diagnostics keep their existing serialized shape.
- `experiments/design-language/ai-spike/diagnostics.test.js`: new mocked deadline/DNS/TLS/socket/body/JSON/HTTP/unknown failure cases, unchanged successful provider behavior, safe redaction and both persistence paths. All test transports are injected mocks; temporary campaign budgets are isolated from the real ledger.

No original test assertion was weakened. Legacy NETWORK_OR_TIMEOUT compatibility is intentional; consumers should inspect `failure.diagnostics.kind` to distinguish new TIMEOUT from NETWORK_ERROR. A historical error without diagnostics must remain ambiguous.

### Safest next single-request configuration — recommendation only

After separate authorization and a fresh named campaign, recommend **one request with a reviewed 120,000 ms client deadline**, keeping the **same 6,144 output-token cap**, model, JSON Mode, temperature and prompt; no repair, retry or fallback. This is a proposed next configuration, **not a change implemented or executed here**. The provider still defaults to 60,000 ms and has no new override flag.

Rationale: the only timing evidence is near the current deadline. A bounded two-minute wait would give a potentially slow non-streaming 70B completion more time while the new diagnostics identify actual failures. Increasing client wait alone does not increase the allowed output tokens or the previously documented token-based cost ceiling. It does not fix DNS/TLS/connectivity problems and does not guarantee a response.

Do **not** reduce max_tokens merely because no headers arrived: the response contains no completion-token/truncation evidence. Lowering the cap could create incomplete JSON for this multi-part contract and would change another experimental variable. Likewise, do not increase it: there is no evidence the output ceiling caused this transport failure. A later observed `finish_reason=length` or measured token usage would justify a separately reviewed output-size decision.

Recheck Workers Free confirmation, a known-safe allocation/cost bound and the unchanged shared 12-request cap before any separately approved call. Currently **9/12** remain used (three slots left); slot 9 is permanently counted despite uncertainty. Record new elapsed time/classification, HTTP/finish status and supplied usage. Stop after that one future response/error; do not silently retry an uncertain request. No such call is authorized or performed by this diagnostic task.

### Actual offline verification of the diagnostic change

New diagnostic cases: **14/14 passed**. Focused provider/harness/live-spike run: **62/62 passed**, three files. Final full regression on the completed change: **562/562 passed**, 29 files, **93.18 seconds**, including all previous 548 tests unchanged. Existing expected API persistence-failure logs appeared; no tests failed. Legacy model selection, JSON Mode, token cap, timeout default and error-code assertions continue to pass.

Compared hashes for **57 preserved artifact files** (the earlier 53 plus the four saved Phase 5D request/failure files): all unchanged. Read-only ledger inspection still shows **9/12**, with slot 9 assigned to phase5d-burgundy-accessory-001. The additional local diagnostic hash snapshot is ignored under `data/`; test-only locks/counters were created and removed solely in unique temporary directories. Working diff and changed-file credential/whitespace checks passed. No Cloudflare requests, real campaign mutation, production change, new dependency, commit or push occurred.

## Authorized controlled 120-second attempt: campaign 002

The project owner subsequently authorized **one** new Workers Free request, campaign **phase5d-burgundy-accessory-002**, with only the local deadline changed. This section supersedes the earlier recommendation-only state; campaign 001 and its ambiguous failure were not changed or retried.

### Configuration and offline gate

The provider now accepts an explicit 120,000 ms deadline while preserving its **60,000 ms default**. Only this exact campaign ID selects 120,000 ms in the experimental CLI; every other campaign keeps 60 seconds. There is no new arbitrary timeout/token/retry CLI option. Invalid deadline values are rejected. Timeout selection does not enter the HTTP inference payload or alter model generation parameters.

Compared the prompt messages and fabric input against campaign 001: **identical**. Compared provider settings against campaign 001: **only timeoutMs changed**. Model remains @cf/meta/llama-3.3-70b-instruct-fp8-fast; temperature 0.7, JSON-object mode, stream=false and **max_tokens=6144** remain unchanged. The conservative cost ceiling remains 1,898.35392 Neurons. Explicit Free-only authorization/prior plan confirmation was reused; no billing change, account-plan probe or paid fallback occurred. Current remaining account-wide quota was not asserted.

Added four offline tests covering campaign-specific override/default preservation, identical HTTP payload, safe 120-second timeout diagnostics and invalid deadline rejection. Full offline regression **before inference** passed **566/566**, 29 files, **92.30 seconds**, including all 562 prior tests unchanged. Security/whitespace checks passed. The real shared ledger was verified at **9/12** and the new campaign ID was absent.

Immediately before dispatch, recorded SHA-256 hashes of **58 prior files** to ignored `data/phase5d-002-prior-evidence-hashes.json`. The original shared ledger atomically reserved **slot 10** and the attempt checkpoint was saved before inference.

Actual command, executed once:

```powershell
node experiments/live-pattern-generation/run.js --live --free-tier-confirmed --campaign=phase5d-burgundy-accessory-002
```

### Actual response and verdict

| Observation | Actual result |
| --- | --- |
| Local inference dispatches | **1** |
| Repair / retry / fallback | **0 / 0 / 0** |
| HTTP | **200** |
| JSON parsing | **Valid** |
| Technical adapter | **REJECTED / FAIL** |
| Independent geometry screening | **NO_LAYOUT_FOUND / INVALID_FABRIC_OR_PIECE** |
| Final proposal verdict | **REJECTED / FAIL**, physically UNVERIFIED |
| Provider finish reason | **stop** |
| Truncated | **false** |
| Raw response size | **1,603 UTF-8 bytes** |
| Whitespace | **13 characters**, approximately 0.811%; no trailing whitespace/loop indication |
| Prompt / completion / total tokens | **2,920 / 626 / 3,546** |
| Reported Neurons | **206.07772827148438** |
| SVG | **Not produced: supplied cutting geometry is invalid** |
| Final shared budget | **10/12**, two slots remain; no slot was reclaimed |

Checkpoint-to-response filesystem interval was approximately **18,706.04 ms**. This is not a monotonic provider timing measurement. The response arrived well below both deadlines, so this success **does not prove** that increasing the timeout fixed campaign 001 or reveal that earlier failure's underlying cause. Its server-side outcome/usage remain unknown.

### Output quality and concrete defects

The model named its proposal generically “Small Fabric Accessory” and described it as decorative, without a specific independently assessable functional accessory. It proposed two diamond-like cutting rings but did not deliver valid cutting geometry or an engineered assembly.

Recorded adapter errors:

1. **design.data.technical.scrapSources**: expected a one-element array; received `{"id":"synthetic-scrap"}` as an object. This base schema failure can mask later design refinements.
2. **instances[0].cuttingPolygonCm**: first point [20,10] is repeated as the last point. The implicit-ring validator rejects duplicate first/last vertices and reports self-intersection.
3. **instances[1].cuttingPolygonCm**: first point [25,15] is likewise repeated as the last point, with the same validator failure.

`validation-errors.json` contains those three adapter error records plus a separate aggregate **GEOMETRY_SCREEN_FAILED** record carrying the same geometric failures. This is not four independent root causes. Nesting performed its preflight only: **zero candidate placements**, one validator call. Dimensions/areas/utilization remain null; no layout or preview was fabricated. The full 4D construction pipeline did not run after rejection, while the independent existing Phase 4 geometry preflight did.

Additional direct review of unchanged raw data (not a repaired/revalidated proposal):

- Both instance entries reference **piece-1, copy=1**, although the source pattern has **cutCount=1**. This is a duplicate physical-copy mapping, not two explicitly declared copies.
- The nominal stitching outline has only two distinct vertices, [20,10] and [25,15], traversing a line and returning. It does not specify a valid area-bearing polygon.
- The model asserted **POLYESTER / PLAIN / 200 gsm** despite the source material properties being unknown and explicit instructions not to invent them. Those assertions were not accepted as fabric facts. Its limitation mentions strength/stretch but does not establish the claimed fiber/weave/weight.
- Overall dimensions **30 x 20 x 5 cm** and the **0.2 cm2** SCRAP quantity are unsupported model hypotheses. No verified pattern consumption or dimensional fit can be established from the invalid outlines.
- Assembly is empty, so no useful joining/construction sequence is provided. No actual stock availability or manufacturing evidence was established.

No point was removed, copy count altered, BOM changed, source property filled, geometry repaired or inference repeated to make this result pass. Valid JSON is not a schema-valid, feasible or manufacturing-approved pattern proposal.

### Saved artifacts and final preservation checks

All actual artifacts are under the ignored directory:

**`experiments/design-language/ai-spike/results/campaigns/phase5d-burgundy-accessory-002/`**

Files: `lock.json`, `request.json`, `attempt-1.json`, **`response.json`**, **`raw-response.txt`**, **`validation-errors.json`**, and **`result.json`**. Result/provenance/5C–5B evidence and the independent geometry preflight are preserved. No `preview.svg` or failure artifact was invented for the successful HTTP response.

All **58 prior artifact hashes remain unchanged**, including campaign 001 and the earlier request reservations. The new attempt is counted as shared slot 10. No second request, production/API/inventory mutation, dependency addition, commit, push or merge occurred. Code was unchanged after the passing 566-test offline gate; only actual-result documentation was appended. Stop for review: the transport returned a response, but valid pattern generation and physical feasibility remain unestablished.

## Offline proposal failure analysis: campaign 002

Read-only investigation apart from this report. No inference, repair, schema/code edit, test run or artifact/budget mutation was performed. Evidence: unchanged `raw-response.txt`, `response.json`, `validation-errors.json`, `result.json`, saved `request.json` and the existing schemas/validators. The full artifact tree contained 66 files at investigation start; its digest is checked again after this addendum.

### What was actually proposed

- **Product:** name “Small Fabric Accessory”; intended use “decorative accessory”; description “Original small fabric-based accessory.” No more specific function, recipient use, mechanism or named accessory type was supplied. TOTE_BAG is the legacy category/parent-context label, not evidence of a designed tote.
- **Appearance/creative features:** burgundy and synthetic aesthetic labels; one generic BODY feature. Diamond-like numerical cutting silhouettes are visible in the point lists. No pocket, flap, strap, closure, fold, embellishment mechanism or joining operation was actually described.
- **Nominal dimensions:** 30 x 20 x 5 cm, explicitly ILLUSTRATIVE_ONLY. These are model hypotheses, not measured fabric or validated assembled dimensions.
- **Pattern definition:** one `piece-1`, `cutCount:1`, nominal allowance 0.5 cm and local grain direction 45 degrees. Its stitching path goes [20,10] -> [25,15] -> [20,10], only two distinct points. Existing polygon validation of that unchanged implied ring reports “Polygon must have at least 3 points.” It cannot define an area-bearing stitching outline.
- **Cutting entries:** instance-1 and instance-2 each list five points with the closing vertex repeated. Their raw coordinate bounding boxes are each 10 x 10 cm; the second point list is translated by (5,5) from the first. Those are descriptive coordinate extents, not valid cutting-pattern or assembled-product dimensions. Both claim `piece-1/copy:1`.
- **BOM/assembly:** one woven SCRAP entry, 0.2 cm2; unsupported assertions of POLYESTER, PLAIN and 200 gsm; no STOCK entry; `assembly:[]`, `folds:[]`. Only strength/stretch are listed as missing. No construction or availability can be inferred from these omissions.

### Failing paths and additional defects

Paths below refer to the **raw response**. Saved 5B diagnostics add the host wrapper `.data`, for example raw `$.design.technical.scrapSources` appears as `design.data.technical.scrapSources`.

| Raw JSON path | Expected | Actual | Evidence and likely root cause |
| --- | --- | --- | --- |
| `$.design.technical.scrapSources` | One-element array of `{id}` | `{"id":"synthetic-scrap"}` object | Recorded base Zod error. Correct array shape was already in the contract; model did not follow it. |
| `$.instances[0].cuttingPolygonCm[4]` | Last vertex distinct from first; closure implicit | [20,10], identical to vertex 0 | Recorded polygon rejection; confusion/non-adherence between cutting-ring and explicitly closed stitching conventions is plausible. |
| `$.instances[1].cuttingPolygonCm[4]` | Same implicit-ring convention | [25,15], identical to vertex 0 | Same recorded root cause. Validator also reports self-intersection from this invalid repeated-end representation; this is not independent evidence of a bow-tie diamond. |
| `$.design.technical.patternPieces[0].outline` | Simple area-bearing seam polygon with at least three distinct, noncollinear vertices | Two distinct points and two returning LINE segments | Additional geometric defect, masked in the full-source path by the base schema failure. The typed schema's `segments min=2` alone is insufficient to establish polygon validity. |
| `$.instances[1].pieceId`, `$.instances[1].copy` together with instance 0 and `$.design.technical.patternPieces[0].cutCount` | Unique physical `(pieceId,copy)` mapping, covering exactly the explicitly requested copies | Both entries are piece-1/copy 1; cutCount is 1 | Direct contradictory raw data. Two different instance IDs do not authorize duplicating one physical copy. Source custom refinements/mapping were not fully reached. |
| `$.design.technical.bom[0].material.specs.{fiber,weave,weightGsm}` | No invented source properties; unknown facts omitted and disclosed | POLYESTER / PLAIN / 200 | Unsupported factual assertion despite the prompt. Hypothesis: mandatory legacy material fields encouraged conventional placeholder values; internal model reasoning is unavailable. |
| `$.design.technical.bom[0].quantity.value` | Explicit quantity consistent with a supported cutting allocation | 0.2 cm2 | No credible allocation demonstrated for the raw 10 x 10 cm extents. With invalid geometry/copy mapping, no accepted consumption total exists; do not silently recalculate/replace this value. |
| `$.design.technical.overallDimensions` | An explicit dimensional hypothesis traceable to a technically described product | 30 x 20 x 5 | Numerical fields exist, but their connection to the two point lists or a specific accessory is absent. This is a technical-completeness problem, not a proved nesting failure based on assembled dimensions. |
| `$.instances[*].grainToleranceDeg` | Supplied tolerance for complete bridge evaluation | Absent in both entries | Legitimate unresolved input, not a base type error because the field is optional. Source fabric grain is also unknown; the declared local 45 degrees cannot establish grain compliance. |
| `$.design.technical.assembly` and `$.design.limitations[0].missingInformation` | Enough explicit assembly or honest disclosure for the chosen feature | Empty assembly; missing list only strength/stretch | Arrays are structurally permitted, but this does not provide connections or disclose degenerate geometry, copy mismatch, unsupported material assertions or a missing product definition. |

The saved error list contains **three adapter records** (one Zod shape issue and two invalid cutting rings), plus **one aggregate geometry-screen record** repeating those two cutting failures. It is not a complete enumeration of independent design defects. No repaired candidate was submitted to expose more errors. There are no reported nonexisting component/BOM/edge IDs in this output; the concrete reference contradiction is the duplicate physical-copy mapping. No anchor coordinates were provided, so there is no evidence of correctly located attachments either.

The host intentionally lacks fabric confirmation/revision, real material properties, source grain and stock measurements. These are separate **source-evidence gaps**, not facts the model was entitled to fabricate. Even a structurally corrected proposal would not receive manufacturing approval from the current pipeline.

### Why 626 tokens does not mean truncation

**Evidence:** HTTP 200; response is 1,603 UTF-8 bytes; usage reports 626 completion tokens out of a 6,144 cap; `finish_reason=stop`; `truncated=false`; valid complete JSON; no unclosed containers/string; 13 whitespace characters and no trailing padding. The provider did not report an output limit or partial transport body.

**Conclusion:** genuinely short delivered response, with an incomplete/invalid technical design. JSON completeness and product completeness are different. There is no evidence that raising timeout or output cap would restore omitted design content. These observations do not reveal the model's private reasoning or prove all requested content was internally considered. A premature semantic stop or oversimplification is a hypothesis, not demonstrated token truncation.

### Safe concept preservation

Useful fragments can be retained in a **separate source-linked CONCEPT_ONLY review record**: exact name, decorative intended use, burgundy label, quoted generic BODY intent, and a tentative diamond-like silhouette observation. Keep the original experiment brief and response/campaign hashes, all unmet requirements, human review PENDING and explicit unresolved product function/construction.

Do not promote 30 x 20 x 5 cm, polyester/weave/weight, grain direction, 0.2 cm2 quantity, duplicate instances or invalid rings into verified concept facts or technical instructions. They may remain quoted **rejected hypotheses** for traceability. Do not invent a pouch, bag, wallet, closure, material choice or attachment from the generic name. No salvage file was created here and the saved technical outcome remains **REJECTED/FAIL**. A later explicitly authored concept record can coexist with that rejected technical result; it cannot overwrite it or claim automatic creative fidelity.

### Contract comparison and smallest correction

The AI used the intended raw envelope `{design,instances}` correctly. The host then supplies the actual 5C envelope (`sourceConcept`, `proposal.design.path/data`, `proposal.context.fabric/instances`, provenance and hashes). The model was **not** required to fabricate those host fields or SHA-256 values; their absence from raw output is not an error.

The embedded `borsal.design/0.1` and cutting-instance content is where adherence failed. Existing instructions already specified `scrapSources:{id:ID}[] len=1`, no repeated closing vertex for cutting polygons, distinct physical copies, and no fabricated material facts. These are not newly discovered missing enum/field definitions. The prompt also requires a large legacy technical contract while explicitly permitting omitted unknown material fields; this structural-completeness versus truthful-unknowns tension must remain visible rather than being solved with invented properties.

The smallest **local contract clarification**, if later authorized, is a compact invariant block with literal container syntax `"scrapSources":[{"id":"synthetic-scrap"}]`, explicit minimum three distinct noncollinear vertices for area-bearing outlines, opposite cut/stitch closure conventions, and a bijection between supplied instance `(pieceId,copy)` pairs and declared cut counts. Include an honest readiness instruction for unknown material/stock/grain data. This needs no schema relaxation or numerical repair. It could address specific syntax/geometry errors, but cannot reliably supply missing product identity, construction intent or source measurements; the relevant rules were largely already present.

### ONE recommended strategy: staged concept then technical drafting

Recommend **staged concept/pattern generation with a human review gate**, reusing the existing concept contract, 5B drafting and 5C validation. First require a specific accessory function, creative features and honest unknowns without coordinates/BOM property guesses; review that concept. Only then request explicit technical geometry/references against the same scrap for the reviewed concept, preserving unknown source evidence. This separates ambiguous product invention from graph/geometry compliance rather than repeating a full technical-design attempt with another small prose patch.

Expected implementation complexity is **small to moderate**: orchestration, a compact concept-stage prompt, source/hash linkage and a deliberate review stop; existing validators/nesting remain authoritative. It does not require templates, schema changes, a manufacturing engine or new dependencies. Staging may reduce per-call cognitive/contract load, but improved reliability is a hypothesis requiring evaluation, not a proven outcome.

Request cost: if both stages use AI, **up to two separately approved single requests**, no repairs/retries; the shared ledger is **10/12**, so this would consume all remaining slots if both were executed. A human-authored/reviewed concept could instead make stage one offline and require only one future technical request. Actual future tokens/Neurons cannot be predicted from this failed 626-token sample. Under the same model/context/output caps, the existing conservative ceiling is **1,898.35392 Neurons per call**, or **3,796.70784** for two; these are ceilings from the recorded pricing/caps, not expected actual charges or proof of available quota. Reverify Free allocation/budget before any separate live authorization. No such requests or implementation are performed by this analysis.

No schema change is justified merely to accept the repeated vertex, singleton object or duplicate copy. Do not raise the output cap for a response that stopped at 626 tokens. Preserve the valid creative fragments for review, keep the technical rejection, and stop before further implementation/inference.

Final read-only verification: all **66 artifact files** retain the same tree digest before/after this investigation; shared budget is still **10/12**. `git diff --check` passed. Only this report was updated by the investigation. No tests, external/Cloudflare requests, code/schema edits, saved-response edits, campaign resets, commits or pushes were performed.
