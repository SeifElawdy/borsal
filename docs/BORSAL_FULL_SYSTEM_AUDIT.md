# Borsal V1 full-system audit

Audit date: 2026-11-17. Scope: original main repository, including existing uncommitted technical-image changes. Audit-only: no application implementation edits, live inference, owner database changes, accounting changes or historical-worktree changes. This is a source/artifact audit, not certification of every endpoint. No fresh owner-database census or desktop browser session was performed; current saved owner selections and account eligibility therefore remain unverified. Source locations below identify files and exact functions/symbols rather than unstable line numbers.

## 1. Architecture assessment

Borsal is a local-first React/Vite application over Express/Mongoose, with a substantial chain of experimental modules now used as runtime dependencies. Fabric routes invoke calibration and polygon extraction. ConceptRun stores source snapshots, raw proposals and reviews. CreationProject stores selection and versioned identity snapshots. TechnicalProposal retains original inputs, derivation, assessments, SVGs and feasibility. CreationOperation records asynchronous provider outcomes and idempotency. Separate approval/inventory records implement later physical-evidence and transactional reservation gates.

Technical generation has LEGACY, CANDIDATE, CONSTRUCTION and ENGINEERING strategies. ENGINEERING selects GPT_OSS by default, QWEN opt-in or LLAMA_BLUEPRINT. The Blueprint adapter expands compact shapes/references into the existing engineering contract; productEngineering compiles it into designCandidate, then existing drafting/precheck/nesting layers. Advanced construction alternatives use constructionPlanner, including fixed open-sleeve and snap-flap implementations. These are not equivalent generation strategies: they have different expressiveness, identity semantics and prerequisites.

The separation between stochastic proposals and deterministic geometry is appropriate. The main architectural weakness is the absence of one normalized, assessed construction artifact consumed consistently by identity, review and imagery. Downstream services repeatedly unpack originalInput, derivation.candidate, derivation.engineering.plan and legacy technical envelopes. A geometrically assessed artifact is not yet a functionally assessed product.

## 2. Workflow assessment

| Stage | Actual behavior and integration | Assessment |
|---|---|---|
| Upload | fabrics.js validates file type/size; uses stored images and mat presets | Useful, but supported calibrated photographs are required; arbitrary casual photos are not equivalent |
| Analysis | automatic-calibration/measurement and polygon routines derive planar dimensions | Camera calibration, flatness and segmentation uncertainty remain physical limitations; outline confirmation is not independent metrology |
| Ideas | conceptFlow preserves model output, references and review | Creative proposal validity does not establish representability in construction vocabulary |
| Selection | designIdentity versions source/concept/proposal context; closure interpretation includes text matching | Strong lineage, fragile semantic extraction |
| Engineering | multiple transports/contracts and a deterministic compiler | Offline composability demonstrated; live reliability not established by successful fixtures |
| Cutting | explicit stitching geometry plus cutting allowances; ellipse becomes 24 chords | Actual calculated patterns, but curvature/turn-of-cloth and finished dimensions are not solved |
| Nesting | bounded candidates/backtracking, complete-layout revalidation, partial evidence | Correctly distinguishes LAYOUT_FOUND and search exhaustion; no global optimality/impossibility proof |
| Assembly | references, paths, materials and proposed operations checked | Not a physical assembly simulator or functional-product proof |
| Images | FLUX conditioned with source region and Hero, sequential four-view requests | Real visual generation exists; common prompt/provenance is not pixel-level conformity |
| Review | selected proposal, SVG, assembly and status shown; project state persists | Some selection fallbacks and error gates can still misrepresent the active artifact |
| Inventory | authenticated evidence, current hashes, stock bindings, transactional writes | Sensible conservative boundary; physical evidence schema remains narrow and operator-attested |

## 3. Confirmed problems

### P1 — Product connectivity is weaker than its name implies
Location: src/services/productEngineering.js, compile(), reference(), touched and UNCONNECTED_COMPONENT.
Evidence: touching any valid copy marks it connected; FOLD marks every copy touched. There is no graph traversal proving all components form one assembled product. Two separately folded components can satisfy this local accounting without a connection between them. Downstream validators still apply; this finding is specifically about the compiler's claimed connectivity check.
Impact: valid local relationships can be mistaken for a coherent product.
Repair: report component participation separately from graph connectivity; derive explicit intended subassemblies and check connections between them. Do not equate connected graph with manufacturability.

### P1 — Closure presence does not prove an operable closure
Location: productEngineering.js compile(), types/specs closure checks and INSTALL handling.
Evidence: ZIPPER requires a ZIPPER material; INSTALL checks referenced material/anchors. Neither establishes tape allowance, installation sequence, opening clearance, end stops or usability. Several closure types only add CLOSURE_ENGINEERING_REQUIRED.
Impact: schema-valid closure plans can remain functionally incomplete.
Repair: add a small operation capability specification with required installation evidence; expose structural-reference and functional-construction verdicts independently. Unsupported closure engineering must block a completed-product claim, not concept storage.

### P1 — Advanced alternatives can intentionally abandon function
Location: src/services/constructionPlanner.js plan(); explicit TWO_PANEL_OPEN_SLEEVE alternatives and product-name regex in pouch option.
Evidence: alternatives iterate fixed widths and explicitly say different interpretation; pouch behavior branches on coin/pouch/purse words.
Impact: a wearable wrap or closed organizer can become an open keepsake sleeve. Explicit selection preserves consent but does not solve the original product.
Repair: label this as an alternative product throughout; capability-match requirements before proposing alternatives. Retire product-name dispatch from the primary path in favor of supported operation combinations.

### P1 — Identity semantics rely on prose heuristics
Location: src/services/designIdentity.js closure(), requiredClosure(), content(), assertPrompt().
Evidence: closure regex scans descriptions/features/brief; open-top wording returns NONE before other requirements. Conflicting descriptive language and mandatory hardware can be misinterpreted. Name/function equality also creates review conflicts for equivalent paraphrases.
Impact: legitimate designs may be blocked; ambiguous requirements may be interpreted incorrectly.
Repair: collect explicit structured mandatory requirements at concept review, preserve original prose, and use that reviewed requirement set as authority. Keep unknown distinct from no closure and multiple alternatives.

### P1 — GPT-OSS still receives dense source coordinates
Location: src/services/productEngineering.js messages(); src/services/localAI.js engineeringSettings(); technicalGeneration.applyDesign().
Evidence: default GPT_OSS uses productEngineering.messages, whose user source includes polygonCm and holes. applyDesign replaces concept but leaves source. Qwen's compact input strategy is not automatically inherited.
Impact: known historical failure mode—copying dense source boundary and exhausting final JSON budget—remains possible on default path.
Repair: share a compact source constraint serializer across engineering providers; retain exact geometry exclusively for deterministic validation. Do not change token budgets without measuring serialized contracts and headroom.

### P1 — Generic UNSUPPORTED instruction conflicts with engineering schema
Location: technicalGeneration.applyDesign() and productEngineering.schema.
Evidence: non-Blueprint prompts append 'declare UNSUPPORTED' when requirements cannot be met, but engineering closure enum has no UNSUPPORTED and engineering contract requires components. construction-intent and engineering-plan have different failure representations.
Impact: a model following instructions can emit an invalid response.
Repair: specify the exact allowed failure envelope outside the successful engineering plan; persist it as an explained non-design result. Keep strict success validation.

### P1 — Technical image eligibility conflates unrelated conditions
Location: src/services/technicalImageBrief.js build().
Evidence: any assessment.errors blocks imagery, previewSvg presence is required, and instructions must exist in one of three array paths. Valid alternative representations not matching those paths yield TECHNICAL_IMAGE_DETAILS_REQUIRED; empty arrays are truthy and suppress later fallbacks. Generic error codes do not identify missing fields.
Impact: usable selected evidence may be blocked without an actionable reason; conversely the presence of SVG and instructions alone is not construction validation.
Repair: produce one normalized assessed-construction view at proposal persistence, with typed diagnostics and explicit depictability status. Images should require valid identity and meaningful depictable construction, not every unrelated full-readiness condition.

### P1 — Image prompt still has two potential authorities
Location: previewPrompt.specification(), technicalImageBrief.build().
Evidence: locked visualDesign derives silhouette/details from identity while technicalImageBrief carries actual components/operations. For non-explicit alternatives, identity can retain concept-level details unsupported by the cutting plan. Negative constraints are mostly closure-based and generic.
Impact: a prompt can simultaneously request conceptual volume and forbid unsupported depth.
Repair: build visualDesign exclusively from the selected normalized construction when technical imagery is requested; retain original concept separately. Validate positive claims against supported features before requesting images.

### P1 — Image request can bind identity before all validation completes
Location: src/routes/creationStudio.js generation handler: identity.bind occurs before preview.prepare and final X-Borsal-Design comparison.
Evidence: binding persists active identity/history; later preparation or header conflict can reject the operation.
Impact: a failed generation request can have a selection/identity side effect. This is a source-order finding, not a claim that a specific owner record was corrupted.
Repair: resolve and validate without mutation, then atomically compare selection/version and persist authorized binding/operation. Generation should consume an already selected identity.

### P2 — Frontend falls back to a proposal without explicit selection
Location: client/src/designFlow.mjs resolveContext(), proposal fallback to preferredProposalId/proposals[0]; state.jsx design requires selection.proposalId match.
Impact: displayed proposal can exist while active design identity is absent; generation can produce selection/version errors. Project scoping prevents simple cross-project mixing but does not prove human selection.
Repair: separate latest available proposal from explicitly selected proposal and never use the former as current design implicitly.

### P2 — Gallery classification is stricter but incomplete
Location: client/src/liveStudio.jsx ProductImage; previewGallery.mjs galleryFor.
Evidence: current technical imagery requires a matching brief and proposal. Original concept thumbnails are filtered by absent proposalId; historical technical imagery lives in generic Advanced Details. No dedicated historical technical-version comparison view exists.
Impact: safe exclusion can look like lost images; old technical images are accessible but their associated construction is not presented alongside them.
Repair: explicit current/concept/history categories with version labels and read-only navigation to originating proposal. Do not rebind old assets.

### P2 — Assembly schematic is textual, not spatial
Location: productEngineering.schematic().
Evidence: SVG consists of component text cards and operation text; it does not show oriented edges, fold direction, inside/outside surfaces or assembly states.
Impact: users can read instructions but cannot visually verify how parts form the illustrated object.
Repair: add modest diagrams from existing edges/anchors and ordered operations; do not call this a 3D simulation.

### P2 — Production evidence remains keychain-shaped
Location: approvalInventory.js evidenceSchema construction.checks.
Evidence: every product uses DIMENSIONS, FOLD_FIT, RING_RETENTION, SEAM_STRENGTH, ABRASION.
Impact: unrelated products require meaningless ring evidence, while zipper-specific requirements are absent.
Repair: versioned requirement-specific physical test checklist derived from reviewed construction, with authenticated evidence and existing transactions retained.

### P2 — Model selection is server configuration, not per-request choice
Location: localAI.engineeringSettings(), creationStudio.capabilities().
Evidence: BORSAL_ENGINEERING_MODEL selects GPT_OSS/QWEN/LLAMA_BLUEPRINT; UI displays server capability.
Impact: user expectations about which Generate action uses which provider may differ from actual strategy.
Repair: display strategy/model explicitly in one primary action and confirmation, persist resolved configuration, and keep rollback options without exposing secrets.

## 4. Engineering and AI assessment

AI should propose a bounded engineering intent including meaningful component roles, dimensions, explicit relationships and supported operations. Deterministic code should expand shapes, generate IDs, calculate allowances/demand and validate/nest. Neither a complete JSON plan nor a high-level product description alone is sufficient. Blueprint is a reasonable compact transport, but its small vocabulary is a capability boundary, not a general garment designer.

Do not enlarge the vocabulary merely to accept new operation names. Define geometry preconditions, component relationships and unresolved physical requirements for each supported operation. Finished dimensions require assembly transformations; current cut sizes do not justify finished volume. Thread-perimeter estimates are planning allowances, not measured consumption. Ellipse chord approximation and convex miter allowance policy need explicit suitability limits for concave/curved designs.

Nesting code retains candidate/backtrack limits, best partial placements and final independent validation. Preserve this. Missing material/grain evidence should remain independent from preliminary geometry results. No source review or illustration can replace physical sample testing.

## 5. Real AI readiness and historical evidence

| Path | Evidence | Readiness |
|---|---|---|
| Llama concept generation | Saved three-accessory success and later owner concepts documented in phase reports | Previously live-used; not proof every concept is engineerable |
| GPT-OSS engineering | Saved 2048-token length exhaustion/truncated JSON; Hair Tie null final content at earlier 1536 budget | Integration exists; reliable live engineering not demonstrated by these cases |
| Qwen | Prior HTTP400 tuple-schema error; corrected subsequent request timed out at 120011ms awaiting headers | Opt-in, remote engineering success unproven; no quality winner established |
| Llama Blueprint | Saved LIVE1 empty components/string unresolved fields; Phone Pouch string edge indices and undeclared closure design | Strict rejection appropriate; next prompt revision remains unproven live |
| Assisted/Advanced | Deterministic authored/derived patterns and nesting | Offline functional path, not AI engineering success |
| FLUX galleries | Historical real saved galleries and receipts | Real image generation works; selected-pattern visual fidelity unverified |

Evidence: docs/QWEN_ENGINEERING_LIVE_EVALUATION_FINAL.md; docs/BLUEPRINT_A2_REPORT.md; src/services/fixtures/gpt-oss-engineering-length.json, gpt-oss-hair-tie-limit.json, blueprint-live1-rejected.json, blueprint-phone-pouch-rejected.json. Reports and sanitized fixtures are historical evidence, not a fresh DB census or current provider eligibility verification. No new provider documentation compatibility claim is made.

Free-tier controls use owner dashboard attestation expiring at UTC midnight, conservative atomic holds and request receipts. Actual quota is not queried automatically by these capability checks. Failed/unknown outcomes must remain accounted for. A2's 73-to-81 delta is documented concurrent legitimate image activity, not evidence of ledger corruption. Do not reset history to match an old report. Current global usage was not independently counted in this audit.

## 6. Recommended architecture and executable repair sequence

Repair selectively; do not replace Express/MongoDB, polygon validation, bounded nesting, immutable proposal history or approval transactions.

1. **Normalize selected construction evidence.** Add one read-only assessment representation produced by existing adapters: identity, components/copies, cutting/stitching basis, operations, materials, source hashes, diagnostics and separate geometry/reference/function/physical statuses. Test legacy, candidate, engineering, Blueprint and authored inputs. No migration of originals.
2. **Make explicit selection atomic.** Remove generation-side identity mutations before validation and implicit UI proposal fallback. Test stale/concurrent selection, source changes and failed image preparation with unchanged project state.
3. **Review structured requirements before inference.** Mandatory function/closure/attachments become reviewed fields. Unknown remains unknown; alternatives require explicit selection. Capability preflight explains precise unsupported operations without spending Neurons.
4. **Unify engineering transport semantics.** One compact source summary; successful plan and unsupported-result contracts; bounded final-output budget; strict final-content parsing. Retain provider-specific serializers. Retire LEGACY/CANDIDATE from the ordinary UI while retaining historical readers and advanced diagnostics.
5. **Strengthen construction assessment.** Component graph, intended subassemblies, opening boundaries, closure installation requirements and assembly sequence prerequisites. Start with a small demonstrable capability envelope; distinguish checks from physical proof.
6. **Ground imagery only in selected assessment.** One positive feature set and explicit forbidden features, suitable macro focus and supported use scenario. Bind brief/proposal/source hashes before all four calls. Add human visual-adherence review; never infer conformance from metadata.
7. **Consolidate Review Product.** Show selected product, exact version, pattern, nesting, assembly, required supplies, unresolved function and physical evidence. Historical images remain visibly historical.
8. **Validate one live path under separate authorization.** First pass offline contracts and selected-state tests, then bounded real concept/engineering/gallery workflow with no retry loop. Preserve failures. Only broaden supported products after coherent construction evidence exists.
9. **Generalize physical acceptance before inventory rollout.** Product-specific requirements generated from generic operations, authenticated independent evidence, then existing transactional stock reservation.

## 7. Real AI acceptance criteria

A future live evaluation must retain one real source photo, calibration basis and explicit outline review, with unknown material/grain retained. The concept must preserve reviewed function and requirements and fit the declared construction capability envelope. The real model response must be complete final JSON, strict-schema valid, source-linked and immutable. Every piece/copy needs a role, explicit geometry, allowance basis and meaningful assembly participation. All cuts must pass polygon checks and actual bounded nesting; report exact utilization and search limitations. Assembly must address openings, joins, finishing and required hardware without pretending reference checks prove function.

Select the assessed construction explicitly. Generate four views under a separately confirmed bounded request set, retain partial failures, inspect actual images for closure/silhouette/component consistency and record mismatches. Review must reopen with the same identity, source/proposal hashes, images and status. Prototype decision must persist; production remains blocked until independent physical evidence and real stock exist. An authored fallback can demonstrate usability but cannot count as successful live model engineering. No model should be promoted on HTTP200 alone.

## 8. Verification and limits

Focused existing tests were invoked directly through Node because PowerShell blocked npx.ps1. Provider environment variables were cleared. Selected suites: productEngineering, technicalImageBrief, blueprint-a2, nesting and frontend designFlow. Results are in data/full-audit-focused.log. These are offline unit/geometry tests; they do not validate current Cloudflare compatibility or owner saved selections. No full regression, production build, database mutation or browser interaction was needed for this documentation-only audit.

Further verification required: read-only owner DB census of latest selection/image/version anomalies; current account/receipt reconciliation; adversarial geometric/assembly fixtures; exact stale-binding HTTP reproduction; browser inspection of current error states. These are not presented as completed. No P0 exploit or proven production-data corruption was established. The P1 findings are sufficient to block a claim of general autonomous manufacturing readiness.

## 9. Final recommendation

Partially redesign the orchestration and construction-assessment boundary, retaining the working deterministic engines and persistence safeguards. The shortest reliable V1 is a capability-bounded AI proposal system with explicit requirements, one normalized selected construction, independent geometry/reference checks, meaningful assembly limitations and technically grounded illustrative images. A larger model or another prompt alone will not repair inconsistent representations, missing functional semantics or selection-side effects.

Verification outcome: all 69 focused tests passed across 5 files (7.64 seconds). No live provider requests were performed. Existing uncommitted image-preview changes were preserved; only this audit document was added by the audit.
