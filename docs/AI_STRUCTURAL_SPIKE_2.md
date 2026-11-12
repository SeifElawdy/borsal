# AI Structural Spike 2 - Phase 2B

## Latest result: explicit-coordinate retest completed; broader schema failures remain

Executed ONLY phase2b-simple-shoulder-003 / simple-shoulder, with one initial generation and one repair, using the same Cloudflare @cf/meta/llama-3.1-8b-instruct, Workers Free confirmation and unchanged borsal.design/0.1. Both responses were HTTP 200 and valid JSON; neither passed Zod. All 11 coordinate values present in EACH response are now arrays of exactly two finite numbers. No excessive whitespace, incomplete JSON or truncation was observed. The two-request allowance is exhausted; no other brief, third request or next phase was started.

### Minimal code changes
- prompt.js explicitly says every point is a two-finite-number JSON array; gives correct [12.5, 8.0] and incorrect {"x":12.5,"y":8.0} fragments; enumerates all nine actual point-bearing schema paths: outline starts/endpoints, cubic controls, fold from/to, ATTACH anchors and INSTALL anchors.
- Existing closure, valid edge/copy/BOM references and technical creative-coverage requirements remain. The prompt reinforces linked material/body assemblies for requested external straps/buttons; unsupported details must remain documented.
- Repair retains the original brief, contract and original model response once, groups exact errors, gives an actionable array/object correction, and requests one complete JSON object with no Markdown/commentary or blank padding. No second contract copy is appended to feedback.
- harness.js adds diagnoseOutput and records characters/UTF-8 bytes, raw JSON validity, whitespace counts/fraction, trailing whitespace, unmatched containers/strings/delimiters and incomplete-JSON status. Excessive whitespace is a REPORTING heuristic: >=1024 whitespace characters AND >=80% whitespace; it is not independent proof of a model loop or a new schema rule. Incomplete JSON is based on failed parsing plus lexically unclosed containers/strings (excluding mismatched delimiters); this is diagnostic, not an auto-repair/parser replacement.
- Raw responses, original parsed values and Zod issues are unchanged. Diagnostics do not trim, coerce coordinates, append closing syntax, filter output or grant another retry. Provider JSON-object mode, temperature 0.7, stream=false, max_tokens=6144, timeout, model and existing one-repair/campaign controls remain unchanged.

### Baseline, offline verification and preservation
- Branch feature/ai-structural-spike; existing untracked experiment/report files were inspected, not reset. Read current rules/report/runtime files, actual schema and prior failed responses.
- Verified explicit/distinct -test database naming, newer isolated test-suffixed databases/temp uploads and sequential Vitest files before running baseline. No production database was used.
- Baseline npm test: 206/206 passed across 10 files, exit 0; start 03:48:12, duration 22.33s.
- Focused coordinate/prompt/harness/campaign tests: 97/97 passed across 4 files, exit 0; start 03:52:36, duration 3.60s.
- Full npm test: 224/224 passed across 11 files, exit 0; start 03:53:08, duration 21.96s. All 206 prior tests remain unchanged. Eighteen new cases cover actual point fields discovered from Zod, valid/invalid examples, unchanged finite tuple validation, original brief/errors, non-mutating malformed/whitespace/truncation diagnostics, escaped delimiters, raw response preservation and smoke-lock/shared-budget/one-repair safety.
- Before inference, shared usage was 5/12 and ID 003 did not exist. Exclusive campaign creation and pre-inference reservations consumed global slots 6 and 7. The counter is now 7/12; five unused slots are not permission for more requests.
- SHA-256 comparison verified 46 protected old result/lock/example/schema/provider/run/campaign/test files unchanged. Previously saved results were not reclassified or rewritten. All new saved artifacts were checked against configured credentials/account/database values; no matches were found.
- No dependency, design-schema, production code/API/model, provider configuration, .env or existing-test change; no commit/push. Only prompt.js, experimental harness diagnostics, new coordinate.test.js, new campaign artifacts and this report changed.

### Actual live metrics
| Attempt | HTTP | JSON / Zod | Zod issues | Prompt / completion / total tokens | Neurons | Finish / truncation |
| --- | --- | --- | --- | --- | --- | --- |
| initial | 200 | true / false | 3 | 1821 / 1192 / 3013 | 49.06235122680664 | stop / false |
| repair | 200 | true / false | 11 | 2987 / 1217 / 4204 | 54.736289978027344 | stop / false |

Totals: 4808 prompt + 2409 completion = 7217 tokens; 103.79864120483398 provider-reported Neurons. Output cap stayed 6144 per request. Both finish_reason values are stop, completion use is below the cap, and truncated=false.
Initial output: 3680 characters/UTF-8 bytes, 77 whitespace characters (2.09%), zero trailing whitespace. Repair: 3022 characters/UTF-8 bytes, 38 whitespace characters (1.26%), zero trailing whitespace. Both diagnostics report validJson=true, incompleteJson=false, excessiveWhitespace=false, unclosedContainers=0. Absence of looping in this run does not prove the cause of the prior whitespace behavior or guarantee it cannot recur.

### Exact validation results
Initial: 3 issues, all at the root/creative boundary:
```text
creative.description: empty string; expected nonempty text.
creative: extra keys technical and limitations.
technical: missing at JSON root; expected object (it was nested inside creative).
```
Repair: 11 issues. It moved technical to the root but retained the following problems:
```text
creative.description: empty string.
 technical.overallDimensions.width: 0; expected >0.
 technical.overallDimensions.height: 0; expected >0.
 technical.overallDimensions.depth: 0; expected >0.
 technical.components[1].role: CLOSURE; not an allowed component role.
 technical.patternPieces[0].outline.segments: one item; expected >=2.
 technical.patternPieces[1].outline.segments: one item; expected >=2.
 technical.patternPieces[2].outline.segments: one item; expected >=2.
 technical.patternPieces[3].outline.segments: one item; expected >=2.
 technical.patternPieces[4].outline.segments: one item; expected >=2.
 technical: extra limitations key (root limitations also exists).
```
Counts 3 -> 11 are not evidence that the repair introduced every body defect: initially misplaced technical masked them. Coordinate errors are absent, and separate direct point-schema checks confirm all 11 present points in each response are valid tuples. The output does not exercise Bezier controls/fold points; those fields are covered by offline schema-derived instruction tests, not a live success claim.

### Additional observed geometry/reference/BOM defects (not extra claimed Zod errors)
- All five pattern outlines contain one vertical line and are unclosed. They do not provide valid closed pattern regions or the requested asymmetric sloping opening.
- Unknown BOM references in the repair: technical.patternPieces[3].bomId=linings-fabric; technical.patternPieces[4].bomId=interfacing; technical.assembly[0].bomId=strap-thread; technical.features[0].bomIds[0]=strap-fabric; technical.features[1].bomIds[0]=button-thread. Only outer-fabric is declared in BOM.
- Initial limitations references undefined button-feature; repair adds that feature. Component/pattern identifiers otherwise exist, but full cross-field refinements are not established while base schema errors remain.
- One WOVEN_FABRIC SCRAP source is declared with cm2 units, but no WEBBING or BUTTON/WOOD STOCK entry exists. No stock availability is falsely marked available; required stock accessories are omitted instead. Unrequested lining/interfacing pieces add nonexistent material references.
- The INSTALL record references undefined strap-thread and places its anchor on strap-piece rather than on the body. A fabric-cut button piece and illegal CLOSURE component do not model a wooden stock button.

### Creative intent and honest limitations
| Brief requirement | Current evidence | Assessment (human review pending) |
| --- | --- | --- |
| Asymmetric sloping opening | Empty description, zero overall dimensions and single-line pattern outlines | Not technically represented |
| External webbing shoulder strap | STRAP feature/component exists, but its piece uses outer-fabric; no WEBBING material or body mount | Incorrectly simplified to fabric-cut strap; external webbing requirement not preserved |
| Visible wooden button closure | Repair adds closure intent, illegal button component and fabric pattern; missing button-thread reference | Prose/labels only; no BUTTON/WOOD spec or functional body closure relationship |
| One outer scrap | One woven SCRAP source and area units | Declared; material adequacy, fit and manufacturing are unverified |
Unsupported/partial records are model self-declarations, not independent evidence. They say silhouette/opening is incomplete and ask for strap seam allowance/grain direction even though those fields are already present at zero. Button details are called unsupported without establishing a schema limitation: BUTTON with WOOD specs and INSTALL are supported. The initial asymmetric-opening limitation points to the strap feature, not a modeled opening. Human-review fields remain PENDING/null; no manufacturing feasibility is claimed.

### Comparison across campaigns and recommendation
| Campaign / prompt | Initial validation | Repair validation | Whitespace / truncation | Tokens / Neurons |
| --- | --- | --- | --- | --- |
| 001 / raw source | 17 Zod issues | 5 Zod issues | No observed truncation | 10007 / 130.97154998779297 |
| 002 / compact alias | 10 coordinate Zod issues | Invalid JSON; final Zod not reached | Repeated whitespace, length stop at 6144 | 11402 / 268.7542953491211 |
| 003 / explicit arrays | 3 root/creative issues | 11 Zod issues; point types correct | No excessive whitespace or truncation | 7217 / 103.79864120483398 |
Current initial prompt is 6315 characters (system 5921); actual repair context is 10872. Previous compact prompt was 5618 initial / 8683 actual repair. Actual input tokens rose 1667 ->1821 initially and 2522 ->2987 for repair; lower TOTAL usage here comes mainly from avoiding the previous long whitespace output, not from a smaller prompt. Causality/general reliability is not established by one sample.
The narrow coordinate correction worked for present values, but broad hierarchy/geometry/reference compliance and brief preservation remain unreliable. Do not loosen the schema or add automatic postprocessing to claim success. Further prompt tuning, a supported schema-constrained-output approach, model comparison or staged concept/technical generation may be worth a separately approved review; none is implemented or proven necessary here. Avoid assuming staged generation or a larger output cap guarantees valid designs. Preserve the current evidence and stop before spending more shared slots.

### Artifacts
- [Complete result and original/repaired response text with all errors and diagnostics](../experiments/design-language/ai-spike/results/campaigns/phase2b-simple-shoulder-003/result.json).
- [Exact prompt snapshot](../experiments/design-language/ai-spike/results/campaigns/phase2b-simple-shoulder-003/prompt-snapshot.json).
- [Separate analyst review](../experiments/design-language/ai-spike/results/campaigns/phase2b-simple-shoulder-003/review.json).
Campaign lock, per-attempt reservations, append-only checkpoints and global slots remain intact. Earlier sections are preserved historical results, not this campaign's current status.

Command executed once (existing ID now refuses rerun):
```powershell
node experiments/design-language/ai-spike/run.js --live --free-tier-confirmed --campaign=phase2b-simple-shoulder-003 --brief=simple-shoulder
```

## Offline diagnostic addendum: coordinates and repair truncation

Inspected AGENTS.md, this report, unchanged schema, prompt builder, provider, harness, campaign 002 result and saved prompt snapshot. This addendum is documentation only: no inference, tests, code/schema changes, artifact edits, lock removal/reset, dependency changes, commit or push. Shared budget remains 5/12. The 206-test result below is historical and was not rerun.

### Coordinate evidence: one shared representation failure
The source point schema is z.tuple([z.number().finite(), z.number().finite()]): exactly two finite numeric array elements. All ten actual values are non-array objects whose numeric x/y values are otherwise finite. Each yields invalid_type: expected tuple, received object. Expected values below illustrate representation only; no output was converted or rewritten.
| Exact JSON path | Actual value (JSON object) | Expected representation (two-number tuple) |
| --- | --- | --- |
| `technical.patternPieces[0].outline.start` | `{"x":0,"y":0}` | `[0,0]` |
| `technical.patternPieces[0].outline.segments[0].to` | `{"x":10,"y":0}` | `[10,0]` |
| `technical.patternPieces[0].outline.segments[1].control1` | `{"x":5,"y":5}` | `[5,5]` |
| `technical.patternPieces[0].outline.segments[1].control2` | `{"x":15,"y":5}` | `[15,5]` |
| `technical.patternPieces[0].outline.segments[1].to` | `{"x":20,"y":0}` | `[20,0]` |
| `technical.patternPieces[1].outline.start` | `{"x":0,"y":10}` | `[0,10]` |
| `technical.patternPieces[1].outline.segments[0].to` | `{"x":10,"y":10}` | `[10,10]` |
| `technical.patternPieces[1].outline.segments[1].control1` | `{"x":5,"y":15}` | `[5,15]` |
| `technical.patternPieces[1].outline.segments[1].control2` | `{"x":15,"y":15}` | `[15,15]` |
| `technical.patternPieces[1].outline.segments[1].to` | `{"x":20,"y":10}` | `[20,10]` |

The saved contract correctly defines P=[N,N], N as finite number, and uses start:P, to:P, control1:P and control2:P. There is no schema/prompt type contradiction. However, it relies on an alias and never explicitly contrasts a two-element JSON array with the common {x,y} object convention. Evidence proves a single object-versus-tuple adherence failure; it does NOT prove why the model ignored the alias. Aliasing/instruction salience or model limitations are plausible explanations, not established causes. Repair feedback grouped all ten paths under expected tuple/received object but did not translate that message into an explicit [x,y]-versus-object correction.

### Truncation evidence and repair-context inspection
- Configured provider max_tokens: 6144; reported repair completion_tokens: 6144; finish_reason: length. HTTP 200 and valid provider envelope. The output-length stop was provider-side, not a local response slice, parser limit, campaign cap or 60-second timeout. Provider/harness code retains the complete returned response string and contains no output slicing.
- Saved repair output: 16813 characters / 16813 UTF-8 bytes (about 16.4 KiB), with 14653 trailing whitespace characters. Its last non-whitespace character is at position 2160; the JSON-shaped prefix leaves one object unclosed. JSON.parse fails at position 16813. It visibly still uses object coordinates; this is not a repaired/validated proposal.
- Thus, reaching the provider output cap is established. Repeated whitespace exhausted most output space; the artifact does not support claiming that the intended bag JSON inherently required 6144 tokens. The cause of that repetition (model degeneration, JSON-mode interaction or other provider/model behavior) is unproven. Raising max_tokens could merely extend waste.
- Repair context contains the 5224-character contract, 394-character original brief, the failed 1985-character design ONCE as an assistant message, and 1080-character grouped feedback: 8683 content characters / 2522 reported prompt tokens. The entire design is not duplicated in the feedback. Keeping it once is useful for preserving IDs/intent; removing it indiscriminately could make repair less reliable.
- The contract is resent in the second HTTP request, as expected for this stateless conversation. Smaller actionable feedback is possible, but this is INPUT overhead; it does not itself explain the 6144-token OUTPUT whitespace. No input-context-limit error is recorded.

### Other detectable problems and creative intent
The initial outlines are also unclosed: piece 0 starts (0,0) and ends (20,0); piece 1 starts (0,10) and ends (20,10). These are additional observations masked by the base tuple errors, not extra Zod errors claimed to have been emitted. Existing IDs resolve where present, but assembly=[] supplies no seam, THREAD or accessory installation relationships. One WOVEN_FABRIC SCRAP source with cm2 units is declared; its 1 cm2 quantity is not established as sufficient for the stated 30 x 20 x 10 cm concept.
Creative preservation is incomplete: the asymmetric opening exists as a FOLD feature with empty references and no valid closed silhouette; the external webbing strap and its stock BOM/mounts are absent; the wooden button exists only as a CLOSURE intent without a BUTTON/WOOD BOM or INSTALL/body anchors. The partial opening-dimensions limitation does not establish schema incapability: illustrative dimensions were allowed. The unparseable repair prefix claims closure requirements were unspecified, contradicting the brief. Human review remains pending; these are assistant observations, not manufacturing approval.

### Strategy comparison (expected effects, not measured new results)
| Strategy | Complexity and calls | Expected token trade-off | Schema compatibility / Backend MVP fit |
| --- | --- | --- | --- |
| A: one-step design, explicit coordinate arrays, concise repair | Small prompt-only change; one initial call and at most one repair under current controls | A short positive/negative coordinate fragment costs little; more direct feedback can shorten input. No guarantee against output loops or creative omissions | Same final schema/harness. Smallest controlled next experiment; include a technical brief-coverage check because syntax alone is insufficient |
| B: creative concept, then technical generation | Adds an intermediate concept contract, handoff and separate checks. At least two generation calls; a subsequent repair would require a third call or consume a stage's allowance | Concept stage may be short, but extra round-trip and handoff tokens are added; net usage is unknown. Could improve focus but can also drop requirements between stages | Final design can still use unchanged schema; intermediate concept is not itself a schema-valid design. More workflow than needed for this MVP diagnosis; does not automatically solve coordinate or JSON issues |

### Recommended smallest next task (NOT implemented)
Prefer A first; reliability must be demonstrated, not assumed. In a separately approved prompt-only task: (1) state explicitly that every start/to/control1/control2/fold/anchor point is an exactly-two-number [x,y] JSON array, never an object; provide only tiny valid/invalid coordinate fragments, no bag template; (2) make tuple repair feedback actionable with exact failing paths and retain the prior design once; (3) retain the original brief and check strap/wood-button/opening representation through existing features/BOM/assembly fields, without inventing new schema fields; (4) add offline prompt/feedback tests, then request a separately authorized one-brief retest with the existing one-repair/shared-budget guards.
Keep model, schema and output cap fixed initially so the observation is interpretable. Stop and record any length finish; do not automatically retry, increase the cap, coerce saved coordinates or append missing braces. If the bounded A experiment still omits intent or loops, review supported constrained output or strategy B/model choice in a separate decision. No current evidence requires loosening the schema, which already expresses the required tuple, path, material and installation structures.

Previous implementation/test/inference sections follow as historical evidence. This addendum proposes no adopted solution and execution stops for review.

## Previous result: compact-contract retest; no valid design produced

Implemented prompt construction only, kept borsal.design/0.1 unchanged, passed offline verification, then ran phase2b-simple-shoulder-002 for ONLY the same simple-shoulder brief. Exactly one initial request and one repair were sent, both HTTP 200. The initial JSON had 10 Zod issues; the repair hit the existing 6144-token output cap and was invalid JSON. No third request, other brief, schema relaxation or next phase was attempted. This retest does NOT establish successful schema adherence or creative preservation.

### Prompt contract and repair changes
- prompt.js now uses the installed Zod native toJSONSchema conversion on the actual unchanged designSchema, then renders a compact human-readable typed contract with aliases for materials, pieces, components, features, assembly and root structure. Neither raw Zod source nor its executable refinement loops is sent to the model. No dependency was added.
- Required field names/nesting, literals, enums, numeric/array bounds and material specifications are derived from the real structure. Cross-field prose describes the existing ID ownership/reference checks, one-scrap rule, material-specific units, fabric-pattern restrictions, edge/copy semantics, THREAD requirements, closed outlines and root-level limitations.
- The contract separates Component roles from Feature kinds; CLOSURE remains a feature kind only. Ready-made buttons/webbing/hardware belong in BOM/INSTALL/Feature records, not fabric cutting patterns. Partial/unsupported intent must remain named and have nonempty reasons/missing-information entries; unrequested features are not invented as limitations.
- Creative requirements are explicitly required in supported geometry, body-connected anchors and material specifications; prose alone is insufficient. This is guidance, not an automated semantic proof.
- Repair feedback groups identical code/message issues while retaining every exact path, code and message. The full original brief, contract and original response remain in context. Original saved validation results are not rewritten or filtered. One repair remains the harness limit.
- For compatibility with an unchanged existing test, the human-readable source-binding label contains the text const designSchema. It is an identifier citation, not executable source. Added tests explicitly reject embedded declarations, z.object/z.enum calls, superRefine, ctx.addIssue, require calls and validator function bodies in the model prompt.

### Offline verification and preservation
- Read AGENTS.md, latest report, original/repaired 001 output, prompt/schema/provider/harness/run files and relevant tests; branch remained feature/ai-structural-spike. Existing untracked Phase 2B files were preserved.
- Database-test isolation was verified before baseline: explicit/distinct test database, unique test-suffixed databases and temporary upload directories in newer suites, sequential file execution. No production database was used.
- Baseline npm test: 189/189 passed across 9 files, exit 0; start 03:21:35, duration 20.70s.
- Focused prompt/harness/campaign tests: 79/79 passed across 3 files, exit 0; start 03:26:14, duration 2.91s.
- Full npm test: 206/206 passed across 10 files, exit 0; start 03:27:04, duration 21.07s. All 189 previous tests remained unchanged. Seventeen new prompt tests check nesting, actual enums/spec fields, typed assemblies, units/accessories, geometry/reference rules, limitations, all six briefs, complete grouped feedback, lack of runtime Zod code, and measured size reduction. They do not generate designs or call an API.
- A 31-file SHA-256 snapshot verified old results/locks, old experiment tests/runtime modules, the schema and all eight examples unchanged after the retest. Earlier request slots were preserved. Only new shared reservations 4 and 5 and the new named campaign artifacts were added.
- Saved campaign artifacts were checked against configured token/account/database values: no credential matches. No .env, production code, dependencies, provider, harness, run.js, campaign controls, previous examples or existing tests were modified in this task.

### Measured prompt sizes
| Text size (characters, message content only) | Before | After |
| --- | --- | --- |
| System contract | 9669 | 5224 |
| Initial messages with identical brief | 10063 | 5618 (44.17% smaller) |
| Equivalent repair using OLD output/errors | 16241 | 10978 (32.41% smaller) |
| Actual new repair messages | Not directly comparable | 8683 |
For the prior 17 errors, grouping yields 6 message groups; for the new 10 coordinate errors it yields 1 group with all 10 paths. New repair feedback alone is 1080 characters. Character measurements are not token estimates; actual provider token usage appears below.

### Live comparison and usage
| Metric | Previous source-code prompt (001) | Compact typed contract (002) |
| --- | --- | --- |
| Initial / repair HTTP | 200 / 200 | 200 / 200 |
| Initial JSON / Zod | true / false | true / false |
| Initial Zod issues | 17 | 10 (all point tuple/object mismatches) |
| Repair JSON / Zod | true / false | false / not reached |
| Repair issue count | 5 Zod issues | 1 JSON parsing issue at root; not evidence of improved Zod adherence |
| Initial prompt / completion tokens | 2722 / 1793 | 1667 / 1069 |
| Repair prompt / completion tokens | 4366 / 1126 | 2522 / 6144 |
| Total prompt / completion / all tokens | 7088 / 2919 / 10007 | 4189 / 7213 / 11402 |
| Total reported Neurons | 130.97154998779297 | 268.7542953491211 |
| Initial / repair finish reason | stop / stop | stop / length |
| Initial / repair truncation | false / false | false / true |

Initial input tokens fell 2722 to 1667; repair input tokens fell 4366 to 2522. Total input fell 7088 to 4189, but overall usage rose because the repair generated 6144 output tokens, mostly repeated trailing whitespace. Therefore the shorter prompt did NOT produce a cheaper or successful completed design in this sample.
The initial request consumed 44.13935089111328 Neurons; repair consumed 224.6149444580078; task total 268.7542953491211. All are provider-reported. The shared counter is now 5/12 including the previous smoke and both design campaigns. Seven unreserved slots remain; no further inference is authorized by this task.

### Exact errors and remaining defects
Initial output: 10 invalid_type issues, actual coordinate objects {x,y}, expected two-element JSON tuples [x,y]. For each piece index 0 AND 1, the exact failing locations are:
```text
 technical.patternPieces[0].outline.start
 technical.patternPieces[0].outline.segments[0].to
 technical.patternPieces[0].outline.segments[1].control1
 technical.patternPieces[0].outline.segments[1].control2
 technical.patternPieces[0].outline.segments[1].to
 technical.patternPieces[1].outline.start
 technical.patternPieces[1].outline.segments[0].to
 technical.patternPieces[1].outline.segments[1].control1
 technical.patternPieces[1].outline.segments[1].control2
 technical.patternPieces[1].outline.segments[1].to
```
Initial structural improvements: no invalid CLOSURE component role, root limitations is present, SCRAP quantity uses cm2 and component/pattern/BOM identifiers resolve where present. These do not establish a correct bag: the model omitted the requested stock accessories and assembly altogether. Full refinements did not run after tuple type failures.
Initial geometry still does not close: piece-1 starts at object (0,0) and ends at (20,0); piece-2 starts at (0,10) and ends at (20,10). Both coordinates and closure violate the existing contract. assembly=[] means no seam/thread or strap/button installation relationships exist. Missing relationships must not be interpreted as successfully validated references.
Repair output: JSON.parse fails at root with expected closing syntax at character 16813. Provider finish_reason=length and truncated=true. The response has 14653 trailing whitespace characters and one unclosed object brace. The visible prefix still uses object coordinates and moves limitations inside technical, but it is not a complete parsed proposal. Its one parsing error cannot be compared to five old Zod errors as evidence of improvement; final Zod validation was not reached.

### Creative and unsupported-feature assessment
| Requested intent | Observed in initial proposal | Assessment / unverified aspect |
| --- | --- | --- |
| Asymmetric sloping opening | FOLD feature with empty componentIds/bomIds; a PARTIAL limitation asks for opening dimensions | No valid closed opening/silhouette or explicit feature-to-pattern relationship establishes the requested form |
| External webbing shoulder strap | No WEBBING BOM, STRAP feature or body mounts | Omitted from technical structure and not honestly recorded as unsupported |
| Visible wooden button closure | CLOSURE feature with empty references | No BUTTON BOM with WOOD specification and no INSTALL/body anchors; technical requirement remains prose-only |
| One outer scrap | One WOVEN_FABRIC SCRAP source and cm2 units | Declared correctly, but stated quantity adequacy, scrap fit and manufacturing are unverified |
Initial limitations contains one correctly placed PARTIAL record with a nonempty missing-information list, but missing user-provided dimensions is not proof of a language limitation; illustrative dimensions could have been chosen. The unparseable repair prefix adds an UNSUPPORTED closure claim saying requirements were unspecified, although the brief explicitly requires a wooden button. This is not accepted as honest unsupported-feature disclosure. Full final feature assessment is unavailable because repair JSON is incomplete.
These are assistant observations, not independent human approval. Saved human-review fields remain PENDING/null; no cross-design diversity result or manufacturing feasibility is claimed. The prompt itself preserved every brief requirement; the model output did not.

### Recommendation and stop condition
Keep the schema unchanged: arrays for coordinates, closed line/curve paths, wood button STOCK entries and webbing INSTALL anchors are already representable. This failure does not justify changing enums or relaxing validation. Contract compression improved input size and removed some old structural confusions, but the point alias did not secure tuple output and creative omissions persisted.
Before any separately authorized retest, review a more explicit coordinate instruction (two-element [x,y] arrays, never objects), a stronger supported structured-output strategy or a different text model. The repeated-whitespace repair may reflect a model/JSON-mode generation failure; its cause is a hypothesis, not established by this two-request run. Do not infer that a larger token limit or schema changes would fix it. No such follow-up change, model switch or extra request was implemented.

### Saved artifacts and scope
- [Complete result, raw response texts and exact validation issues](../experiments/design-language/ai-spike/results/campaigns/phase2b-simple-shoulder-002/result.json).
- [Initial and repair prompt snapshot](../experiments/design-language/ai-spike/results/campaigns/phase2b-simple-shoulder-002/prompt-snapshot.json).
- [Separate analyst review and measurements](../experiments/design-language/ai-spike/results/campaigns/phase2b-simple-shoulder-002/review.json).
- Permanent campaign lock, attempt records and append-only checkpoints remain in that campaign directory; previous campaigns and global accounting were not reset or bypassed.
Code changes: only experiments/design-language/ai-spike/prompt.js. Added prompt.test.js; added only new campaign/review/prompt-snapshot artifacts; updated this report. No production API, schema, dependency, backend framework, frontend, commit or push change. Stopped after the one initial request and one allowed repair.

Command actually executed once (this existing ID now refuses rerun):
```powershell
node experiments/design-language/ai-spike/run.js --live --free-tier-confirmed --campaign=phase2b-simple-shoulder-002 --brief=simple-shoulder
```

All sections below are preserved historical results; their earlier current-status statements and CLI instructions are superseded by this latest section.

## Previous result: first named campaign; AI proposal remained schema-invalid

Campaign phase2b-simple-shoulder-001 executed ONLY simple-shoulder, using Cloudflare @cf/meta/llama-3.1-8b-instruct and unchanged borsal.design/0.1. Exactly one initial request and one allowed schema-repair request were sent. Both returned HTTP 200 and parseable JSON; BOTH failed Zod validation. No further request, brief, automatic retry or new phase was started. Campaign status COMPLETED means execution ended, not design validation success.

### Minimal workflow changes and preservation
- Named CLI campaigns require --campaign=<id> and --brief=<id>; the selected brief is the only brief passed to the existing runExperiment. The task-level cap is two requests with at most one repair.
- Campaign IDs are lowercase letter-led alphanumeric/hyphen names, length 1-64; path separators, dots/traversal, absolute paths and Windows reserved device names are rejected. No reset/force/bypass option exists.
- Each ID atomically reserves results/campaigns/<id>/, with permanent lock.json, exclusive-create checkpoint-N.json and attempt-N.json records, and a once-only result.json. An existing directory/partial campaign is rejected; no old campaign artifact is overwritten. Checkpoints are append-only rather than rewrites of a result.
- A shared results/request-budget/baseline.json imports previous legacy design counters and fingerprints the historical root artifacts. The known smoke request is counted conservatively ONCE against the overall twelve-request ceiling. An old lock with an unknowable count consumes the full ceiling; changed/corrupt historical accounting fails closed.
- Every new LIVE request atomically reserves one of the remaining shared request-N.json files using exclusive creation, then persists its campaign attempt record BEFORE invoking the provider. Existing/empty reservation files count as spent after a crash. Writes are fsynced; no automatic reclamation exists. Concurrent processes/threads cannot acquire the same request slot. MOCK campaigns consume no real-request slots.
- The original runExperiment checkpoint occurs before reservation/inference. A network failure or interrupted attempt keeps its reserved slot; a new campaign ID never resets the shared budget. This protects request accounting on the same local filesystem; it is not a distributed multi-host quota service.
- The old smoke lock and all four prior root result artifacts were verified byte-for-byte unchanged by SHA-256 after the live run. No account-plan checks were repeated; the user-confirmed Workers Free account and configured credentials were reused.
- provider.js now retains HTTP status, numeric Neuron usage, finish reason, output-token cap and truncation indicators; harness.js records these fields without changing proposal text or validation. The model/schema/prompt were not changed to make the result pass.

### Tests actually run before inference
- Branch: feature/ai-structural-spike. Existing untracked Phase 2B experiment/report files were present and inspected; they were not reset.
- Database isolation was rechecked: explicit/distinct -test database in the original API suite, unique test-suffixed databases/temp uploads in newer suites, sequential test files. No production database was used.
- Baseline npm test: 160 passed across 8 files, exit 0; start 03:03:56, duration 18.89s.
- Focused npm test -- experiments/design-language/ai-spike/campaign.test.js experiments/design-language/ai-spike/harness.test.js: 62 passed across 2 files, exit 0; start 03:08:49, duration 2.50s.
- Full regression npm test: 189 passed across 9 files, exit 0; start 03:09:25, duration 20.75s. All 160 existing tests remain unchanged; 29 new cases cover campaign/path isolation, smoke preservation, duplicate rejection, shared/legacy budgets, actual worker-thread concurrency, crash-created slots, pre-inference checkpointing, one brief/two attempts, metadata and rejection of reset options.
- Git diff for production code, dependency/config files, the original schema and old tests was empty. No tolerance was weakened. Focused tests mock network transport and use unique guarded temporary directories only.

### Actual inference results and usage
| Attempt | HTTP | JSON | Zod schema | Reported errors | Prompt / completion / total tokens | Neurons | Finish / truncation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| initial | 200 | true | false | 17 | 2722 / 1793 / 4515 | 73.7287368774414 | stop / false |
| repair | 200 | true | false | 5 | 4366 / 1126 / 5492 | 57.24281311035156 | stop / false |

Output limit: 6144 tokens per request (existing provider default). Both report finish_reason=stop, truncated=false, and completion usage below the cap: no provider-reported truncation occurred.
Task totals: 7088 prompt tokens, 2919 completion tokens, 10007 total tokens and 130.97154998779297 reported Neurons. There were 2 actual design requests and 1 repair. The shared counter is now 3/12 including the prior smoke request, leaving 9 unreserved slots; these are not authorization for additional inference. No paid service or remaining-brief campaign was run.

### JSON versus design-schema evaluation
- Initial output has 17 Zod issues: component-button uses unsupported component role CLOSURE; SEAM side entries have id instead of required pieceId/copy; the button anchor omits copy and adds id; limitations is misplaced under technical and absent at the top level.
- Repair output has 5 Zod issues: role CLOSURE remains invalid, both SEAM relationships now omit threadBomId, technical.limitations remains an unrecognized key, and top-level limitations is still missing. The repair fixed some piece/copy fields but did not produce a valid design.
- Additional direct inspection of the unchanged responses found wrong BOM quantity units (SCRAP woven fabric uses piece, expected cm2; STOCK webbing uses piece, expected cm), WEBBING/BUTTON used as pattern-piece materials despite the area-material requirement, and all three outlines unclosed.
- Repaired pieceIds, component pieceIds and BOM IDs exist, but SEAM edge IDs edge-strap-1/2 and edge-outer-1/2 do not match the actual segment-* edge identifiers. Initial threadBomId points to outer fabric rather than a THREAD entry; no THREAD BOM entry exists. These are observed structural defects, not additional errors claimed to have been emitted by the top-level Zod parse.
- Because base structure errors prevent full refinement, automated referencesValid and scrapStockValid remain null (unestablished), not true. Direct inspection shows one SCRAP woven source and STOCK webbing/button with availability NOT_CHECKED, so source LABELS are distinguished; quantities, usage and pattern assignments still prevent overall correctness.
- Both responses declare three PARTIAL items inside misplaced technical.limitations: non-adjustable strap, absent lining and unreinforced button. Each has an empty missingInformation list. The repair adds two UNSUPPORTED declarations for absent lining and an adjustable strap, still nested in the wrong location. None constitutes a schema-valid limitations ledger.
- Lining and strap adjustability were NOT requested by simple-shoulder. Treating their absence as unsupported is an invented requirement/self-assessment, not proof of a schema limitation. No unsupported feature was silently removed or normalized by the harness.

### Creative-brief preservation (analyst observations, human review still pending)
| Requirement | What appears in the output | Remaining gap |
| --- | --- | --- |
| Asymmetrical sloping opening | Creative prose repeats the requested description | Outer geometry traces three sides of a square, with no sloping/asymmetric opening and no closing segment; technical intent is not preserved |
| External webbing shoulder strap | WEBBING stock spec, STRAP component and strap feature exist | Invalid stock pattern and unknown edges; seams join strap to itself rather than model external shell mounts |
| Visible wooden button closure | BUTTON material=WOOD and INSTALL record exist | Install anchor is on a button pattern, not the body; no functional shell/buttonhole/loop relationship or verified visibility |
| One outer scrap | One declared SCRAP source references outer fabric; extra materials are unchecked STOCK | Invalid units/material assignments and incomplete geometry; no scrap fit or manufacturing check |

These observations were produced by the coding assistant inspecting the saved JSON, not independent human approval. The saved harness human-review fields remain PENDING/null; cross-design diversity cannot be assessed from one proposal. Repeating the brief in creative prose is not evidence that its technical requirements survived.

### Artifacts and remaining blockers
- [Complete immutable campaign result](../experiments/design-language/ai-spike/results/campaigns/phase2b-simple-shoulder-001/result.json): both original response texts, parsed proposals, exact Zod errors, usage and metadata.
- [Separate structural review](../experiments/design-language/ai-spike/results/campaigns/phase2b-simple-shoulder-001/review.json): observed defects and creative-requirement observations, explicitly not human approval.
- Campaign lock, individual attempt reservations and append-only checkpoints remain beside the result. Global baseline and request-2.json/request-3.json remain under results/request-budget/. Historical artifacts were not moved, overwritten or deleted.
- All saved results were scanned against configured token/account/database values: no credential matches were found. No raw API error headers, stack traces or credentials were saved.
- The workflow blocker is resolved for explicitly named campaigns. The current blocker is design/schema quality: the two-request allowance is exhausted and the generated proposal is invalid. Further inference, prompt changes or schema extensions require another explicit task; no silent correction, third request or permanent schema adoption occurred.
- Manufacturing feasibility is NOT established. Retain the schema as an experimental contract for review; this one unsuccessful design-generation attempt is insufficient to adopt or reject it permanently.

Files changed for this task: run.js, provider.js and harness.js; added campaign.js and campaign.test.js under ai-spike; created only new named-campaign/shared-budget artifacts and review; updated this report. No production API/model/database/schema/dependency change, commit or push occurred.

Command actually executed (once; existing ID now refuses rerun):
```powershell
node experiments/design-language/ai-spike/run.js --live --free-tier-confirmed --campaign=phase2b-simple-shoulder-001 --brief=simple-shoulder
```

Older sections below are preserved historical records of the earlier blocked workflow and smoke test; their blockers/CLI instructions are superseded by the named-campaign workflow above.

## Previous status: Phase 2B.1 blocked by existing campaign workflow

The project owner authorized one simple-shoulder design generation plus at most one schema repair (maximum TWO new real requests), using the unchanged borsal.design/0.1 schema and existing Cloudflare text provider. Workers Free confirmation remains accepted; billing/account-plan checks were not repeated.

Preflight inspected AGENTS.md, this updated report, run.js, harness.js, provider.js, the simple-shoulder brief, and the existing results/lock. The live-campaign.json lock records:

- scope: ONE_APPROVED_LIVE_SMOKE_TEST
- approvedRequests: 1; requestsAttempted: 1; repairs: 0.
- Original ceiling: maxRequests=12, maxInitialRequests=6, maxRepairsPerBrief=1.

The blocker is workflow support, NOT exhaustion of the original twelve-request ceiling. In [run.js](../experiments/design-language/ai-spike/run.js), reserveCampaign uses exclusive file creation and explicitly prohibits a new campaign when this marker exists. The CLI has no resume, brief-selection or named-campaign option and otherwise loads all six briefs. The core runExperiment accepts a selected brief and a smaller budget, but invoking it directly would skip the CLI campaign lock. Selecting a different output directory would route around the existing global marker without an established shared-counter/campaign mechanism. Neither path was used.

Following step 4 of the Phase 2B.1 instructions, execution STOPPED before any model request rather than resetting, deleting or bypassing the lock. The new authorization was not consumed. Supporting a future run requires a reviewed workflow change for append-only campaign identities/authorization and shared cumulative request accounting that preserves the original smoke lock/results; that change was not implemented in this task.

| Requested evaluation | Actual Phase 2B.1 result |
| --- | --- |
| Status | BLOCKED_EXISTING_CAMPAIGN_WORKFLOW |
| New real model requests / repairs | 0 / 0 |
| Cumulative observed real requests | 1 (the previous smoke test only) |
| HTTP status / usage for this task | Not available: no request sent |
| JSON parsing / Zod schema validation | NOT_RUN / NOT_RUN |
| Missing fields / invalid references / SCRAP-STOCK checks | NOT_ASSESSED: no proposal |
| Partial / unsupported features | NOT_ASSESSED: no proposal |
| Creative-feature preservation | NOT_ASSESSED; human review pending |
| Output truncation | Not applicable: no response |

All previous result and lock files were preserved byte-for-byte. No model response or validation error was invented. Only this documentation was updated; no new result/lock was created, no code/schema/dependency/production change was made, no tests were rerun for this documentation-only update, and no commit or push occurred. The earlier smoke/offline results below remain historical evidence, not results for a real bag design.

## Previous result: single live smoke test completed

The project owner subsequently confirmed Workers Free ACTIVE, Workers Paid NOT activated and Workers AI dashboard usage 0/10,000 Neurons, and authorized exactly ONE small inference request. This resolves the earlier free-tier confirmation blocker for this smoke test only. The denied account-plan checks were NOT repeated.

| Observed item | Actual result |
| --- | --- |
| Provider / model | Cloudflare Workers AI / @cf/meta/llama-3.1-8b-instruct |
| Request scope | One minimal JSON response; the six-brief experiment was NOT launched |
| Requests / repairs / retries | 1 / 0 / 0 |
| Output-token limit | 64 |
| HTTP status | 200 |
| Provider envelope JSON / model output JSON | Both valid |
| Model output | {"ok":true} |
| Prompt / completion / total tokens | 51 / 6 / 57 |
| Reported Neurons | 0.4192536473274231 |
| Sanitized errors | None (error=null) |
| Started / finished (UTC) | 2026-11-12T00:56:32.177Z / 2026-11-12T00:56:32.740Z |

Actual sanitized result: [live-smoke.json](../experiments/design-language/ai-spike/results/live-smoke.json). These usage values were supplied by Cloudflare, not estimated. No additional dashboard or usage requests were made after inference.

The existing Cloudflare provider and its fixed text-model endpoint were reused unchanged. Its injectable fetch transport lowered only max_tokens from the design-experiment default to 64, enforced a single-call guard and captured HTTP status/available usage. The prompt requested only the JSON object {"ok":true}; no bag brief, production records or full design examples were sent.

The original reserveCampaign helper acquired live-campaign.json with exclusive creation before the request. No existing campaign lock or smoke result existed beforehand. The lock was then annotated with ONE_APPROVED_LIVE_SMOKE_TEST, approvedRequests=1, requestsAttempted=1 and repairs=0, preserving the overall twelve-request ceiling. The lock remains in place; it was neither reset, deleted nor bypassed. No remaining requests are authorized by this smoke-test approval.

This proves one live text/JSON response through the configured provider, not schema-valid bag generation, creative preservation, diversity or manufacturing feasibility. All six bag briefs remain NOT_RUN and human review remains pending. The historical live-blocked.json and mock-run.json artifacts were preserved as records of the earlier run.

Only this report and the two new result/lock files were written for the smoke test. Provider/backend/schema/dependency/configuration files and .env were unchanged. The live smoke request itself was the verification; no regression tests were rerun for these artifact-only changes. No commit, push, six-brief campaign or Phase 3 work occurred. Execution stopped after the single request.

The sections below document the ORIGINAL offline/blocked run and its tests; their zero-live-request statements and old unblock commands are historical, not the current smoke-test totals. The current campaign lock prevents another CLI campaign from starting automatically.

## Original harness run (historical): LIVE_TEST_BLOCKED
The isolated local harness is implemented and tested. Live text inference was NOT performed: zero initial model requests, zero repairs and zero live model requests overall. The six requested briefs were prepared but have no AI-generated proposals to evaluate. No AI performance or manufacturing feasibility result is established.
The existing Cloudflare credentials are present. Both read-only plan checks returned HTTP 403 / Cloudflare error code 10000: GET account subscriptions and GET Workers account settings. This prevents verifying the account is Workers Free without paid overage billing. A free-tier confirmation question was sent while implementation continued; no confirmation was received during this run. The --live command without confirmation saved a blocked report and made no network/model request.
An account-read 403 does not establish whether inference would authenticate successfully: permissions may be narrower, or credentials/account configuration may be invalid. No inference was attempted to test that distinction, and no settings, subscriptions, .env values or credentials were changed.

## 1. Baseline and configuration audit
- Branch: feature/ai-structural-spike. Working tree was clean before implementation.
- Read AGENTS.md, Phase 2A report, unchanged schema.js, evaluate.js, tests and all eight example JSON files. Inspected the existing Cloudflare image spike and its decision record. That earlier FLUX.2 Klein result is image-only evidence, not evidence of text/structured-generation support.
- Checked environment variable names and presence only. CF_ACCOUNT_ID and CF_API_TOKEN are configured; no other inspected text-provider key was available. Their values were never displayed.
- Verified database isolation before running the baseline: configured database pathname is explicit; the original API suite derives a DISTINCT -test database; newer suites use unique test-suffixed databases and temporary upload directories; Vitest runs files sequentially. No production database was used by this experiment.
- Baseline npm test: exit 0, 127 passed across 7 files; start 02:32:24, duration 18.70s.

## 2. Provider/model selection and free-tier constraints
Actual provider used for saved local generation results: offline mock, model none. The unit tests additionally use fake providers and mocked HTTP envelopes. No cloud text model was exercised.
Target adapter: Cloudflare Workers AI, @cf/meta/llama-3.1-8b-instruct. It reuses the configured CF_ACCOUNT_ID / CF_API_TOKEN with native fetch, pinned to the text-generation REST endpoint. No SDK or dependency was installed, no image endpoint is used and there is no automatic provider/model fallback.
The official [JSON Mode documentation](https://developers.cloudflare.com/workers-ai/features/json-mode/) lists this text model and explains response_format; the adapter sends type=json_object and validates the returned proposal locally with the original Zod contract. JSON mode does not replace validation and can fail on complex tasks. This model was selected from that documented list, not inferred from the existing image model.
The official [Workers AI pricing page](https://developers.cloudflare.com/workers-ai/platform/pricing/) states a 10,000-Neuron daily free allocation, reset at 00:00 UTC, and paid overages on Workers Paid. On Workers Free, further use requires an upgrade when the allocation is exhausted. The selected model is listed in its text-model pricing table. Actual remaining daily quota and account billing tier are UNKNOWN; no inference cost estimate was treated as proof of free usage.
The adapter therefore requires explicit known-Free/no-paid-overage confirmation in addition to credentials. That confirmation is not approval to spend money. If the account is paid or uncertain, keep live inference blocked. Current account-read authorization is insufficient for automatic verification. No paid service was selected or used.

## 3. Harness and validation behavior
- All implementation is under experiments/design-language/ai-spike/. The original schema and backend are unchanged.
- Six briefs cover two simple, two complex and two new creative concepts; both shoulder bags and totes are present. The lily/petal and constellation/kite briefs were written separately from the Phase 2A manual specimens.
- Prompts load the actual unchanged schema source, version and conventions: centimeters, seam-line outlines, one physical scrap, explicit STOCK=NOT_CHECKED materials, declared references/cut-copy indices and ILLUSTRATIVE_ONLY evidence.
- No completed example JSON is supplied to live prompts; there are no predetermined manufacturing templates. The original manual example is loaded only by offline unit tests as an explicit fixture.
- Each response is recorded as text, parsed by strict JSON.parse and validated by designSchema.safeParse. No fence stripping, reference repair, unit conversion, deletion of requirements or silent substitution of Zod-trimmed data occurs. Original parsed proposals and validation issues are preserved.
- One repair is allowed only after invalid JSON/schema/category output: it retains the original brief and complete previous response, includes the exact recorded validation errors and instructs the model to preserve every creative requirement and limitation.
- Automated fields cover valid JSON, exact schema acceptance, category match, schema-enforced reference/source checks, and self-reported partial/unsupported records. When incomplete data prevents an independent sub-check, its value is null, not a pass.
- Human-review fields are separate and always initialized PENDING/null: creativeIntentPreserved, missingSimplifiedOrHallucinatedFeatures, diversityAssessment, reviewer and notes. Cross-design diversity has a separate pending human review. Neither parser success nor the model's own ledger proves creative preservation.
- The harness never labels a proposal manufacturing-ready. manufacturingVerified=false means not established; it is not a calculated engineering failure.

## 4. Limits, failures, usage and saved artifacts
- At most SIX distinct brief IDs, at most ONE repair per brief and at most TWELVE total model requests. Smaller budgets are supported; larger ones are rejected before any call.
- A request is counted/checkpointed BEFORE provider invocation. Network ambiguity and provider failures consume an attempted-request slot; they are never retried automatically.
- Any provider failure stops the remaining campaign, including authentication/permission errors, quota/rate limits, HTTP 200 error envelopes and timeouts. No automatic retry or provider switch is implemented. fetch has a 60-second timeout.
- An exclusive live-campaign.json marker prevents a second CLI process/rerun from resetting the live budget, including after a crash. It is not removed automatically. A new campaign or recovery requires explicit project-owner review; do not delete it merely to retry.
- Results save per-attempt provider usage only when supplied (prompt_tokens, completion_tokens, total_tokens). Missing usage is null, not invented. There is no live usage data in this run.
- Only generic failure codes, HTTP status and numeric provider error codes are retained from provider failures. Remote error messages/headers are not logged. Saved outputs redact configured token/account/database identifiers recursively, including escaped strings.
- [results/live-blocked.json](../experiments/design-language/ai-spike/results/live-blocked.json) is the actual blocked manifest: requests=0, initialRequests=0, repairRequests=0, all briefs NOT_RUN.
- [results/mock-run.json](../experiments/design-language/ai-spike/results/mock-run.json) is the latest OFFLINE MOCK campaign: 12 simulated requests, 6 simulated repairs, 0 schema-valid designs. It deliberately returns only {"mockOnly":true}, so JSON parses but schema validation fails. This exercises control flow, not AI design performance.
- Two completed mock CLI campaigns were executed while developing the harness (12 simulated requests and 6 simulated repairs each); the latest replaces the saved mock artifact. Unit tests make additional in-memory mocked calls. NONE of these are real model requests or evidence of live creativity.
- Two real read-only account/plan HTTP checks were made; they are not inference requests and do not consume the twelve-model-request budget. No live-campaign marker exists because live inference has not started.

## 5. Per-brief live evaluation
| Brief | Level / category | Required creative intent | Live JSON / schema / references / SCRAP-STOCK / limitations | Live requests / repairs | Human intent / diversity review |
| --- | --- | --- | --- | --- | --- |
| simple-shoulder | simple / SHOULDER_BAG | Asymmetric sloping opening; External webbing shoulder strap; Wooden button closure; One fabric scrap for cut outer pieces | NOT_RUN / NOT_RUN / NOT_RUN / NOT_RUN / NOT_RUN | 0 / 0 | PENDING / PENDING |
| simple-tote | simple / TOTE_BAG | Narrow open-top tote; Short self-fabric handles; Tall offset external book sleeve; One fabric scrap for shell, handles and sleeve | NOT_RUN / NOT_RUN / NOT_RUN / NOT_RUN / NOT_RUN | 0 / 0 | PENDING / PENDING |
| complex-shoulder | complex / SHOULDER_BAG | Detachable accordion gussets; Reversible asymmetric flap; Turn-lock hardware; Zipped inner valuables pocket; One outer scrap; stock lining and hardware remain unchecked | NOT_RUN / NOT_RUN / NOT_RUN / NOT_RUN / NOT_RUN | 0 / 0 | PENDING / PENDING |
| complex-tote | complex / TOTE_BAG | Interfaced base; Suspended laptop compartment; Crossed webbing handles; Folding rain-cover panel and stowage pocket; One outer scrap; any stock materials remain unchecked | NOT_RUN / NOT_RUN / NOT_RUN / NOT_RUN / NOT_RUN | 0 / 0 | PENDING / PENDING |
| creative-lily | creative / SHOULDER_BAG | Unequal overlapping petal panels; Spiraling opening silhouette; Concealed magnetic snap; Diagonal stem-like shoulder strap; Retain spatial petal behavior as unsupported where necessary | NOT_RUN / NOT_RUN / NOT_RUN / NOT_RUN / NOT_RUN | 0 / 0 | PENDING / PENDING |
| creative-orbit | creative / TOTE_BAG | Concave asymmetric kite body; Orbit-shaped crossed webbing route; Suspended crescent pocket; Constellation/moon visual relationship; Retain spatial suspension and curved routing intent if unrepresentable | NOT_RUN / NOT_RUN / NOT_RUN / NOT_RUN / NOT_RUN | 0 / 0 | PENDING / PENDING |

For every brief, missing/simplified/hallucinated features are NOT ASSESSED because no live proposal exists. Partial and unsupported features are UNKNOWN for the same reason. The brief requirements above form a human-review checklist, not proof that future generated data will preserve them. Diversity is PENDING, not inferred from the deliberately repetitive mock payload.
When live data becomes available, review each brief against every requirement, inspect actual pattern/material/assembly data as well as prose, and record omitted, weakened or invented features. Review diversity across the six outputs. Attribute partial/unsupported entries to the model as self-declarations until checked by a human.

## 6. Actual tests and verification
- Focused final run: npm test -- experiments/design-language/ai-spike/harness.test.js; exit 0; 33 passed across 1 file; start 02:39:58, duration 698ms.
- Full final run: npm test; exit 0; 160 passed across 8 files (127 existing unchanged + 33 new); start 02:40:24, duration 18.93s.
- Tests cover successful parsing, invalid JSON and Markdown fences, structural failures, broken references and SCRAP sources, missing/preserved limitations, original values, source-schema/no-example prompts, repair feedback, exactly one repair, six/twelve limits, smaller budgets, pre-call checkpointing, persisted campaign lock, credential redaction, separate human fields, usage, malformed envelopes, network failures and authentication/quota/provider stops.
- All provider tests mock fetch; a global fetch spy rejects accidental network access. No API key is needed for focused tests or mock runs.
- git diff --quiet over src, package files, Vitest config, Phase 2A schema/evaluator/tests/examples returned exit 0. No existing functionality, schema or test/tolerance was modified.
- Saved-result credential scan returned savedResultsCredentialFree=true and liveCampaignStarted=false.
- The first focused attempt failed to import due to an apostrophe in a generated prompt string. That local syntax error was fixed; subsequent focused and full runs passed. No pre-existing test was changed to accommodate it.
- The existing simulated database-create cleanup test prints its expected generic error while passing; it is not a live AI error.

## 7. Recommendation and remaining risks
RETAIN borsal.design/0.1 unchanged as an experimental comparison contract for now. There is no live evidence here to justify adopting it permanently, extending it based on AI performance, or rejecting it. Phase 2A's representational gaps remain; this harness does not solve them.
Next review needs verified free-only provider access, one bounded live campaign and independent human assessment. Human review may then motivate versioned seam-span/state, fold/layer or attachment-path extensions, but parser success alone must not drive acceptance. No Phase 3 work was started.
Outstanding limitations: account billing and inference access are unverified; provider JSON mode may fail; quotas are account-wide; output can omit creative intent despite schema success; duplicate or self-reported features are not independent evidence; no manufacturing feasibility, nesting, inventory, reservation or engineering calculations exist. Results can contain fictional model-generated content; no production/private records are sent to the provider.
No .env modification, new dependency, production API/model/database change, image generation, commit or push occurred. Only the experiment folder and this report were created; PROJECT_STATUS.md was not marked as live-experiment complete.

## Files created
- experiments/design-language/ai-spike/briefs.json: six short briefs with independent review requirements.
- experiments/design-language/ai-spike/prompt.js: unchanged source-schema prompt and controlled repair feedback.
- experiments/design-language/ai-spike/provider.js: fixed Cloudflare text model, native fetch, usage/error adapter and free-only gate.
- experiments/design-language/ai-spike/harness.js: assessment, budgets, checkpoints, review separation and redaction.
- experiments/design-language/ai-spike/run.js: default mock/explicit-live CLI, campaign lock and local result saving.
- experiments/design-language/ai-spike/harness.test.js: 33 focused offline tests.
- experiments/design-language/ai-spike/results/mock-run.json: actual latest offline mock artifact.
- experiments/design-language/ai-spike/results/live-blocked.json: actual zero-request blocked-live artifact.
- docs/AI_STRUCTURAL_SPIKE_2.md: this factual report.

## Reproduce / unblock
Offline (no key/network required):
```powershell
npm test -- experiments/design-language/ai-spike/harness.test.js
node experiments/design-language/ai-spike/run.js --mock
npm test
```
With current missing billing confirmation, this safely records LIVE_TEST_BLOCKED and sends no model request:
```powershell
node experiments/design-language/ai-spike/run.js --live
```
Only AFTER the project owner verifies Workers Free with no paid overage billing, existing credentials may be reused without editing .env:
```powershell
node experiments/design-language/ai-spike/run.js --live --free-tier-confirmed
```
That final command was NOT run. Never pass --free-tier-confirmed for an uncertain or paid account. Any existing live-campaign marker prevents execution; stop for review rather than resetting it or retrying automatically. After a legitimate live run, review the saved results and update this report factually before drawing AI performance conclusions.

## Final offline failure analysis before strategy change

Inspected AGENTS.md, latest report, unchanged schema and saved initial/repair proposals for campaign 003. No inference, tests, implementation/schema edits, saved-response changes, lock resets or dependency changes. Budget remains 7/12. The small initial error count is misleading: this proposal is not close to a complete structurally valid design.

### Three initial Zod errors: exact expected/actual
| Path | Expected | Actual / root cause |
| --- | --- | --- |
| creative.description | Nonempty trimmed string | Empty string: placeholder content |
| creative | Only description, aesthetic, intendedUse | Extra technical and limitations keys: wrong nesting |
| technical | Required root object | Missing; technical payload is inside creative instead |
Correcting nesting would expose additional errors; it does not repair the contents. The actual repair demonstrates that directly without modifying or hypothetically validating an edited saved response.

### Eleven repair errors and why the count increased
| Exact path(s) | Expected / actual | Provenance |
| --- | --- | --- |
| creative.description | Nonempty text / empty string | Persistent original issue |
| technical.overallDimensions.width; technical.overallDimensions.height; technical.overallDimensions.depth | >0 / 0 at each field | Three pre-existing defects, newly exposed |
| technical.components[1].role | Existing component-role enum / CLOSURE (feature kind only) | Pre-existing defect, newly exposed |
| technical.patternPieces[0].outline.segments | >=2 items / 1 | Pre-existing defect, newly exposed |
| technical.patternPieces[1].outline.segments | >=2 items / 1 | Pre-existing defect, newly exposed |
| technical.patternPieces[2].outline.segments | >=2 items / 1 | Pre-existing defect, newly exposed |
| technical.patternPieces[3].outline.segments | >=2 items / 1 | Pre-existing defect, newly exposed |
| technical.patternPieces[4].outline.segments | >=2 items / 1 | Pre-existing defect, newly exposed |
| technical | No limitations key here / duplicate limitations nested here | Newly invalid placement |
Accounting: the repair fixed the two initial nesting issues, retained empty description, exposed NINE already-invalid body fields, and introduced ONE newly reported illegal key: 1+9+1=11. It is inaccurate to call all eight additional reported errors newly introduced defects.
Direct JSON comparison shows overallDimensions, scrapSources, BOM, components, patternPieces and assembly are unchanged after accounting for technical moving to the root; dimensionUnit/evidence are also unchanged. No previously valid geometry/dimension/material/assembly field became invalid. The repair did not broadly regenerate these sections.
Real content regressions: technical.limitations is newly illegal; adding button-feature resolves the old missing featureId but introduces undefined BOM button-thread; root limitations shrinks from three records to one, dropping the explicit button/other limitation coverage. A missing definition was substituted for the previous missing feature, not solved. Full cross-field refinements remain unestablished because base errors still block them.

### Independent brief and completeness review
- Asymmetric opening: no usable silhouette/opening is encoded. All five outlines are single vertical lines and unclosed. All eleven present point arrays are correctly typed; that narrow success does not make geometry valid.
- External shoulder strap: STRAP component uses outer-fabric rather than stock WEBBING. Its INSTALL references undefined strap-thread and anchors to strap-piece, not the body. This is an incorrect self-fabric simplification, not the requested external webbing implementation.
- Wooden button: initial has an invalid CLOSURE component/fabric pattern; repair adds closure prose but no BUTTON with material=WOOD and no functional body/buttonhole/loop relationship.
- One scrap/material sources: one WOVEN_FABRIC SCRAP with matching scrapId and cm2 units exists. Requested STOCK accessories are omitted rather than marked available. Lining/interfacing pieces are unrequested, and their linings-fabric/interfacing BOM IDs do not exist. Material adequacy is not established.
- References: component/piece IDs generally exist, but unknown BOM IDs include linings-fabric, interfacing, strap-thread, strap-fabric and (repair) button-thread. The initial button-feature limitation reference is undefined until the repair adds that feature. Correcting three envelope errors would still leave these defects and unclosed geometry.
- Limitations are not trustworthy coverage evidence: they cite missing seam allowance/grain direction although both fields are present at zero, and describe supported button mechanisms as unsupported without explaining a representational barrier. Initial asymmetric-opening record points to the strap feature. Repair reduces disclosed missing intent. Human review remains pending.

JSON validity: PASS both. Zod structural validity: FAIL both. Technical completeness: NOT established and contradicted by missing relationships/materials/geometry. Manufacturing feasibility: NOT evaluated. Neither a parser pass nor a future schema pass would establish engineering feasibility.

### Next-strategy comparison and recommendation
| Option | Implementation / token implications | Evidence-based assessment |
| --- | --- | --- |
| A: targeted correction | Small only for nesting; correcting the actual proposal also needs geometry, BOM and assembly redesign. More whole-response repair tokens, with no guaranteed convergence | Not merely three remaining fixes; risks polishing an incomplete design or confusing manual correction with AI success |
| B: concept then technical generation | New intermediate contract, handoff and coverage checks; at least two generation calls before any repair. Adds context/round-trip overhead; total savings unknown | May isolate intent, but the same model could still fail technical structure; more experimental workflow for the MVP before model capability is isolated |
| C: limited more-capable Cloudflare model comparison | Small experiment-only allowlisted model selection; reuse same schema, brief, prompt, campaign guards and validator. Per-call Neuron cost/eligibility must be verified, not assumed | Most informative low-scope controlled comparison before changing architecture; no success guarantee |
RECOMMEND C only. Across campaigns 001-003, none of six saved proposals passed the unchanged schema (one repair did not even parse). This establishes poor observed reliability for the TESTED model/prompt setup on this brief; it does not prove single-step generation fundamentally impossible. Coordinate guidance improved format, but hierarchy, meaningful geometry, reference consistency and brief coverage still fail. Keeping the workflow constant while changing one qualified model is a smaller diagnostic intervention than adding a two-stage architecture.

### Smallest next implementation task (proposal; NOT implemented)
Add an explicit, allowlisted experimental text-model choice while retaining the current default; qualify ONE more-capable Cloudflare model for JSON support and Workers Free before use, with no paid fallback. Add offline tests that model selection cannot alter campaign/shared limits or schema validation. Only under separate approval run one simple-shoulder comparison campaign, at most two requests, with the same prompt/schema/token cap and preserved artifacts. Compare independent technical brief coverage alongside Zod results. If no eligible free candidate exists, stop without inference. No specific candidate availability, price or performance was verified in this offline task.

Only this diagnostic section was appended. All experiment source, examples, saved results and locks remain byte-for-byte unchanged; no commit/push. Stop for review.

## Controlled Llama 3.3 70B comparison: one initial request, no repair

Campaign phase2b-llama33-70b-shoulder-001 sent exactly ONE request to @cf/meta/llama-3.3-70b-instruct-fp8-fast for simple-shoulder. HTTP 200; JSON valid; Zod failed with FOUR issues. No repair, retry, fallback or other brief was sent. Shared budget is now 8/12. REQUEST_LIMIT_REACHED is the local intentional one-request stop after invalid output, not a provider quota error. Stopped for review.

### Verification, conservative preflight and identical conditions
Cloudflare [model documentation](https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/) documents a 24000-token context, messages, response_format, stream, max_tokens and temperature; [JSON Mode](https://developers.cloudflare.com/workers-ai/features/json-mode/) explicitly lists the candidate. The requested temperature 0.7 is within the documented range. The unchanged 6144-token output cap plus the conservative current-input byte/framing bound fits inside the context.
The [documented rates](https://developers.cloudflare.com/workers-ai/platform/pricing/) are 26668 input and 204805 output Neurons per million tokens. Preflight intentionally treated the ENTIRE 24000-token context as input AND added the full 6144 output tokens, overcounting their overlap: (24000*26668 + 6144*204805)/1000000 = 1898.35392 Neurons, below the approved 2000 ceiling. This avoids relying on a guessed tokenizer count.
Workers Free confirmation was reused; no billing upgrade, paid service, account-plan check or inference probe was performed. Recorded earlier project usage was 503.94374018907547 Neurons; no known free-allocation shortfall existed. Live account-wide remaining quota was not queried or asserted. The Free allocation can be affected by other account usage; the single request would stop on a quota/auth/provider error without retry.
Exact client generation parameters: response_format={"type":"json_object"}, stream=false, temperature=0.7, max_tokens=6144, timeoutMs=60000. No seed was supplied for either model. Unspecified provider defaults are not claimed identical. The actual initial message array was byte-equivalent to campaign 003's saved INITIAL prompt; the original brief, prompt source and Zod schema were not modified.

### Minimal implementation and tests
- provider.js preserves the 8B default and allows only that default plus the explicitly approved 70B model; arbitrary IDs are rejected before network access. The JSON settings remain unchanged and are recorded as generationParameters.
- run.js accepts --model and --max-requests; the 70B comparison option requires maxRequests=1. Existing campaign isolation, append-only reservation files, old locks and global cap are unchanged. No force/reset path was added.
- harness.js only adds generation-parameter recording. No validation, prompt, retry-loop or schema rule was changed. The single-request budget makes the next repair iteration unreachable; the output remains saved even when invalid.
- Baseline npm test: 224/224 passed across 11 files, exit 0; start 04:13:42, duration 21.63s. Test database isolation was reverified before baseline.
- Focused model/harness/campaign tests: 74/74 passed across 3 files, exit 0; start 04:19:04, duration 3.05s.
- Full npm test: 236/236 passed across 12 files, exit 0; start 04:20:07, duration 22.64s. All 224 old tests remain unchanged. Twelve new cases check default preservation, allowlisted routing, identical message content/settings, free-tier gate, one-request CLI enforcement, invalid/duplicate options, recording and no fallback/retry.
- SHA-256 verified 60 protected prior artifacts, locks, schema, examples, prompt, brief, campaign controls and existing tests unchanged after inference. New result files were checked for configured credentials/account/database values: no matches. No production API/model/database/dependency/.env change, commit or push.

### Exact validation failures and masked-issue assessment
| Exact path | Expected | Actual |
| --- | --- | --- |
| technical.components[1].pieceIds | Nonempty ID array | [] for the ready-made strap component |
| technical.features | Required Feature array (min 1) here | Missing; features is placed at the JSON root instead |
| limitations | Required root array, allowed empty if honest | Missing |
| Root [] | No extra features key | Extra root features array containing three feature records |
Four Zod issues are recorded, and full cross-field refinement remains unestablished because of base errors. Direct inspection found ZERO further concrete schema-rule violations hidden in the existing values: IDs/units/source allocations and outline closure are consistent where present. This is not a formal validation pass or assurance that all semantic defects were found. Do not infer success from four versus the 8B's three masked initial errors.
Independent technical checks found TWO anchor-placement defects beyond current Zod rules: the strap anchor [10,10] and button anchor [20,15] both lie outside the body triangle [[0,0],[20,10],[30,20]]. The existing pure polygon validator accepts the closed triangle, and pointInPolygon returns false for both anchors. This is an offline 2D consistency check, not a manufacturing-engine implementation or physical approval.

### Independent technical/creative completeness
- Asymmetric opening: a closed asymmetric triangle with sloping edges is a stronger technical attempt than the 8B's single-line pieces. However, no edge is designated as the open mouth and no body seam/fold construction explains how the bag is assembled.
- External strap: WEBBING stock has width 2.5 cm and length 100 cm, with an INSTALL/body-piece reference. It still has one out-of-body anchor, no specified end-mount construction, and a STRAP component whose empty pieceIds violates the current cut-component contract.
- Wooden closure: BUTTON material WOOD, diameter 1.5 cm and quantity 1 are present, with INSTALL/body-piece reference. The anchor is outside the pattern, and no buttonhole/loop/opposing closure connection or visibility verification is supplied.
- Scrap/stock: exactly one WOVEN_FABRIC SCRAP source and one scrap pattern are declared. WEBBING, BUTTON and THREAD are correctly STOCK/NOT_CHECKED. Units are cm2, cm, piece and cm respectively. No stock availability or scrap fit is assumed.
- References/thread: no dangling BOM/piece/copy/feature-component IDs were observed when inspecting the misplaced feature records as data. A valid THREAD BOM exists, but no SEAM/ATTACH references it because none are modeled; an unused THREAD entry is not a schema violation or a complete sewing plan.
- Unsupported details: root limitations is absent, so omitted construction details are NOT honestly recorded in the required ledger. Source prose/feature intent is not independent proof of technical preservation. Independent human review remains pending.
JSON validity, Zod structural validity, technical completeness and manufacturing feasibility remain distinct: JSON PASS; Zod FAIL; technical completeness NOT established; manufacturing feasibility NOT evaluated.

### Side-by-side: INITIAL response only
| Criterion | Llama 3.1 8B, campaign 003 initial | Llama 3.3 70B, this initial |
| --- | --- | --- |
| HTTP / JSON | 200 / valid | 200 / valid |
| Zod | Fails: 3 reported envelope/description issues; many masked defects | Fails: 4 reported component/nesting/ledger issues |
| Description / dimensions | Empty description; dimensions all zero | Full brief-like description; positive 30 x 25 x 10 cm nominal dimensions |
| Pattern geometry | Five single-line, unclosed outlines | One closed three-edge triangle; basic polygon check passes |
| Materials / sources | Only outer SCRAP; requested stock accessories absent | One outer SCRAP plus properly specified unchecked WEBBING, WOOD BUTTON and THREAD STOCK |
| References | Four observed undefined BOM IDs plus a missing feature target | Declared references resolve where present; empty strap pieceIds is invalid |
| Strap/button relationships | Fabric substitution and invalid INSTALL material, no valid body closure | Explicit stock-to-body INSTALLs, but both anchors outside triangle; construction still incomplete |
| Unsupported/partial honesty | Mis-targeted/inaccurate records | Required ledger omitted entirely |
| Technical completeness | Not established | Better in these named aspects, still not complete or approved |
| Prompt / output / total tokens | 1821 / 1192 / 3013 | 1821 / 909 / 2730 |
| Actual Neurons | 49.06235122680664 | 234.72987365722656 |
| Finish / truncation / excessive whitespace | stop / false / false | stop / false / false |
Actual 70B output: 2435 UTF-8 bytes, 36 whitespace characters (1.48%), no trailing whitespace, incompleteJson=false. Both models received the same 1821 input tokens. The 70B used fewer output/total tokens but MORE Neurons. No provider compatibility problem was observed; the failure is in the design structure/technical content, not connectivity.
The 70B sample is qualitatively stronger in material choice, meaningful values and basic relationships, but has not demonstrated schema success. One unseeded generation per model is preliminary evidence only, NOT statistically reliable superiority or justification for permanent adoption. No 8B repair result was used as the comparison baseline.

### Artifacts, blockers and stop
- [Original response, exact errors, usage, model and parameters](../experiments/design-language/ai-spike/results/campaigns/phase2b-llama33-70b-shoulder-001/result.json).
- [Documented-rate preflight and prompt hash](../experiments/design-language/ai-spike/results/campaigns/phase2b-llama33-70b-shoulder-001/preflight.json).
- [Exact unchanged initial messages](../experiments/design-language/ai-spike/results/campaigns/phase2b-llama33-70b-shoulder-001/prompt-snapshot.json).
- [Separate offline review and anchor checks](../experiments/design-language/ai-spike/results/campaigns/phase2b-llama33-70b-shoulder-001/review.json).
Remaining blockers are schema adherence, valid accessory placement, complete body/closure construction and truthful limitation disclosure. No response was edited into compliance and no repair was attempted. Preserve this evidence and review before deciding any prompt/model/schema follow-up. Do not begin manufacturing or consume the remaining four shared slots automatically.
Only experiment provider/CLI selection, parameter recording, focused model tests, new artifacts and this appended report changed. All prior results/locks and production functionality were preserved.

Equivalent CLI arguments used once through the existing main workflow:
```powershell
node experiments/design-language/ai-spike/run.js --live --free-tier-confirmed --campaign=phase2b-llama33-70b-shoulder-001 --brief=simple-shoulder --model=@cf/meta/llama-3.3-70b-instruct-fp8-fast --max-requests=1
```


## Phase 2B closeout: offline staged architecture proof

Decision: stop single-request full technical-design generation. No new inference was made for this closeout. The shared budget remains 8/12, with all previous artifacts and locks preserved.

### Minimal concept contract
[Contract](../experiments/design-language/concept-spike/schema.js): experimental model-independent borsal.concept/0.1, separate from unchanged borsal.design/0.1. It records the original brief verbatim, category, free-form shape/visual intent, requirement-by-requirement source evidence, material/source intent, functional elements and connection intents, needed dimensions and unresolved/unsupported details. Connections use element IDs; no bag template or geometric coordinates are required or accepted. Material quantities and actual attachment points are deliberately excluded. Dimension records request measurements in cm rather than inventing values. Stock availability stays NOT_CHECKED.

[Two manually authored cases](../experiments/design-language/concept-spike/cases.json) identify the initial campaign and SHA-256 of its original response. Extraction is OFFLINE_MANUAL by the coding assistant, not an AI inference or independent human approval. The original saved model description is preserved, including the empty 8B description. Brief requirements restored as required intent are distinguished from observed model evidence; partial coverage never means technical verification. Extra model choices remain unresolved rather than being silently adopted. This is a hand-mapped case study, not a tested general-purpose semantic extractor.

| Initial source | JSON / design Zod | Concept structure | Preserved intent / unresolved evidence |
| --- | --- | --- | --- |
| 8B campaign 003 | Valid / 3 reported errors, additional masked defects | Offline concept parses | All four original requirements retained; zero dimensions, unclosed outlines, dangling references, fabricated fabric accessories, no usable body closure |
| 70B comparison | Valid / 4 reported errors | Offline concept parses | All four requirements retained; improved material declarations and closed outline, but no designated opening, both anchors outside body, no complete strap mounts or closure counterpart |

Both cases retain asymmetric sloping opening, external webbing shoulder strap, visible wooden button and one outer scrap. Small size remains in the original brief and shape intent; no approved dimensions are reconstructed. The 70B nominal 30 x 25 x 10 dimensions and accessory specifications remain available only as illustrative source claims, not accepted measurements. The 8B lining/interfacing additions require a human inclusion decision; 70B THREAD stock does not establish any sewing operation. No material consumption, attachment location or viable assembly can safely be reconstructed. Four connection intents per case explicitly include the missing counterpart-to-body relationship; every connection is UNVERIFIED.

### Proposed staged boundary
1. Creative concept: capture brief, free-form design intent and unresolved information; review preservation with a person. Concept parsing alone is administrative structure checking.
2. Technical proposal: independently develop a versioned technical representation from the reviewed concept. No automatic concept-to-pattern builder is implemented here. Never fill unknown coordinates or quantities merely to pass validation.
3. Independent technical review: require geometry/coordinate consistency, closed cutting outlines, valid piece/copy/edge/BOM references, accessory locations, complete strap/closure relationships, material allocation and supported assembly operations. Also verify that every retained creative requirement has technical evidence or an honest unsupported record.
4. Physical engineering and human approval remain separate future work. Neither concept validity nor design Zod validity grants approval.

The exported technicalReviewQueue only creates seven UNVERIFIED review tasks and NOT_APPROVED; it does not execute engineering checks or accept model-authored PASS assertions. Existing technical outlines are SEAM_LINE, not proven cutting contours: offset/allowance construction and cutting-outline closure require independent verification. Existing 2D inside-polygon failures are concrete negative evidence for the 70B anchors; the concept connection positions remain UNVERIFIED because reliable assembled mounting/closure operation cannot be established from this model. Passing Zod must never hide those failures. Reference existence is insufficient for functional attachment or seam compatibility.

### Findings, risks and next milestone
The two tested models did not deliver a structurally valid, technically complete design. The 70B improved specific materials and basic geometry; one sample per model is not a reliability estimate. The offline proof shows that a coordinate-free concept can retain all four brief requirements in both cases while openly recording unresolved construction. It does not prove automated extraction, AI concept quality, technical generation or manufacturing feasibility. Independent human creative review is PENDING. The concept schema itself cannot establish that an evidence sentence is truthful or that a rewritten original brief is authentic; provenance and explicit fixture checks support this particular study only.

Smallest next milestone: human-review these two concept records and the seven-check technical boundary, then specify one narrowly scoped deterministic technical check with explicit evidence and failure/UNVERIFIED cases. No new inference, full manufacturing engine or next-phase implementation is authorized by this closeout. Keep design-language adoption experimental.

### Offline verification
Baseline: npm test, 236/236 passed in 12 files (22.50s). Test databases were verified distinct from production; file parallelism remains disabled. Final focused/full results are recorded below after execution.

- Focused concept tests: 17/17 passed, 1 file, exit 0; 575ms. Both manually mapped concepts parse; all four original requirements survive in each case. Tests reject missing/changed requirements, invented coordinate/quantity fields, bad versions, duplicate IDs, invalid connection references, empty unresolved details and claimed verified mounts. The review queue remains NOT_APPROVED even for a schema-valid concept.
- Full regression: 253/253 passed, 13 files, exit 0; 22.59s. All 236 previous tests remain unchanged and passing.
- SHA-256 checks after regression confirmed all 73 protected experiment/schema/example/test/artifact files unchanged, including campaign locks and request reservations. Git tracked diff is empty. Existing untracked AI-spike/report files predated this task; only the report was appended and concept-spike was added.
- Created: concept-spike/schema.js (concept contract and explicit unverified review queue), cases.json (two source-linked manual case studies), concept.test.js (17 offline tests), protected-hashes.json (preservation checks). Updated only this documentation report. No production, dependency, prompt or design-schema changes; no commit/push.
- Live requests for this task: ZERO. No provider/account/billing actions or campaign resets; budget remains 8/12. Offline proof complete; stop for review, without claiming technical or physical approval.
