# Phase 6F: design approval and inventory MVP

## Verified outcome

Phase 6E passed audit/secret/diff checks and **637/637 baseline tests** (132.81s), then was committed as **b5d750b**, `feat: complete keychain nesting and source refresh`. Branch: **feature/mvp-approval-inventory**. Phase 6F is uncommitted; no push/merge.

The backend now persists separate technical design reviews, independent-evidence attestations, accessory stock and reserved production-plan entries. Prototype approval never reserves anything. The current Burgundy Keychain is still synthetic and physically UNVERIFIED: actual real-production approval was **blocked with HTTP 409**. A successful reservation was demonstrated **only in an explicitly enabled, isolated TEST_FIXTURE database**; it is not real production authorization or finished-product stock.

**Zero Cloudflare inference. Shared ledger remains 12/20; all 81 prior campaign/ledger artifact hashes are unchanged.** No real stock/source records or original saved fabric/concept/proposal records were modified.

## Local endpoints and review decisions

All routes require existing `BORSAL_MVP_DESIGN_FLOW=1` and a loopback socket; disabled by default. No public deployment or authentication framework was added.

| Method / path | Purpose |
| --- | --- |
| POST/GET `/api/technical-proposals/:id/design-review` | Append/read versioned APPROVED_FOR_PROTOTYPE, REVISE or REJECTED decisions |
| POST `/api/technical-proposals/:id/production-readiness` | Read-only, structured missing-evidence/current-version reasons |
| POST/GET `/api/technical-proposals/:id/verification-evidence` | Append/list immutable evidence bundles and trusted operator attestations |
| POST `/api/technical-proposals/:id/approve-production` | Explicit final human approval + atomic inventory/reservation, or 409 with reasons |
| POST/GET `/api/accessory-stock` | Register/list accessory stock lots with receipts, units, balances and versions |
| GET `/api/inventory`, `/api/inventory/:id` | Read persistent reserved plans, approval history, references and allocations |

Prototype/revise/reject requests bind `expectedVersion`, exact `proposalHash`, `sourceHash`, reviewer and rationale. Production approval is **not** an allowed decision on that route; it requires the separate final action and full gate. Concept APPROVED_FOR_DRAFTING remains a separate prerequisite. Proposal and prior review/evidence versions are not rewritten.

Operator-required writes use a capability configured manually with `BORSAL_APPROVAL_TOKEN` (at least 32 characters), `BORSAL_OPERATOR_ID`, and `Authorization: Bearer ...`. No token was written to .env, source, logs or saved HTTP transcripts. Real stock/evidence/final writes additionally require `BORSAL_PRODUCTION_APPROVALS=1`; it was **not enabled in the actual demo**. A local unauthenticated prototype decision can be recorded as LOCAL_DECLARED but cannot satisfy the production human-review gate.

TEST_FIXTURE writes additionally require `BORSAL_INVENTORY_TEST_FIXTURES=1` **and a `borsal-...-test` database**. This is a separate labeled execution scope, never a way to satisfy REAL evidence. No body field grants that server capability. The CLI configures an ephemeral token and fixture scope in memory only.

## Strict real-production gate

Final input supplies `scope`, `evidenceId`, `expectedReviewVersion`, `proposalHash`, `sourceHash`, `conceptReviewHash`, UUID `idempotencyKey`, rationale, and `stockBindings` keyed by BOM ID with `{stockId,expectedVersion}`. Defaults are fail-closed REAL scope, not fixture scope.

The gate requires:

- Current immutable design/SVG hashes, current fabric source hash, current hash/version of APPROVED_FOR_DRAFTING concept review, and an authenticated, current APPROVED_FOR_PROTOTYPE technical review. Explicitly selected immutable proposal versions may be reviewed; new variants do not silently replace that selection.
- Confirmed fabric geometry tied to its current analysis/photo, AVAILABLE whole scrap, and PASS engine input/geometry/nesting/allowance/grain/material/assembly layers. Invalid construction/feasibility cannot be cleared by a report.
- An immutable, matching REAL evidence bundle: independent ruler/calibrated-scanner dimensions/area/grain checked against geometry within explicitly attested tolerances; independently inspected/lab material specifications matching the BOM; report references/SHA-256 values; distinct observer and authenticated attester.
- Recorded physical sample checks for dimensions, fold fit, ring retention, seam strength and abrasion, all PASS, plus explicit resolution hashes for **every** existing UNVERIFIED construction reason. Original engine UNVERIFIED results remain unchanged; the separate human/evidence gate never rewrites them to PASS.
- Genuine authenticated stock records, receipt references, exact material/unit matches, valid versions/availability and sufficient aggregate quantities. TEST_FIXTURE stock, evidence, methods, receipts, review/source labels and synthetic declaration bases do not qualify as REAL; relabeling a fixture receipt/evidence is rejected.

Evidence is a **trusted operator attestation**, not automated scientific verification. The operator must actually examine independent reports/receipts and the physical sample. Opaque report references/hashes are retained; this phase does not fetch reports, authenticate the external observer, or prove truthful reporting by a dishonest administrator. No real-world evidence was invented or registered in this phase. Fixture values explicitly use method TEST_FIXTURE and are mathematical expectations, not image-derived ground truth disguised as ruler measurements.

## Reservation transaction and inventory meaning

Inside one MongoDB transaction, the service rechecks readiness, conditionally debits stock available balances/increments reserved balances using versions and sufficient-quantity predicates, reserves the whole fabric with its current __v/geometry version, coordinates the concept-run revision, appends final approval with review-version CAS, and creates one inventory entry. Any failure rolls back all writes. Direct DB writers must coordinate revisions; bypassing that contract is not supported.

Unique proposal/fabric/idempotency indexes prevent duplicate reservations. Same key + same normalized request returns the existing entry (**200** replay, **201** first creation), even after its own reservation changes fabric availability. Changed payload/same key and competing keys/designs return **409** without partial allocation. A readiness/approval failure does not create an approval or reserve an idempotency key. Prototype approval changes only review/revision metadata.

Required unique indexes are explicitly initialized before writes, once per connected database, even when Mongoose autoIndex is disabled. Index failure blocks writes with 503. Expected exhausted write/version conflicts return 409. An unknown transaction commit outcome returns 503: final approvals must be retried with the **same idempotency key**, not a new request; review callers must first check current state/version. No rollback or zero reservation is assumed after an uncertain commit acknowledgement.

An InventoryItem is a **RESERVED_PRODUCTION_PLAN**, not a manufactured product: it retains proposal/concept/source hashes, full BOM/cutting/assembly/feasibility snapshots, evidence ID, approval versions/history, fabric version/whole-scrap allocation and exact stock reservations. `finishedProduct=false` and `manufacturingVerified=false` always. TEST_FIXTURE items additionally have `productionAuthorized=false`; a future properly evidenced REAL human approval is administrative authorization only.

References distinguish FLAT_PATTERN_SVG, NESTING_LAYOUT_SVG, FABRIC_SOURCE_PHOTO and optional PHYSICAL_PROTOTYPE photos. **finishedProductPhoto is null**; the flat pattern/source-fabric photo is never represented as a finished keychain image. The whole scrap is exclusively reserved; remaining-area estimates are not automatically created as reusable remnant inventory. Restock, release/cancel and manufacture/consume transitions are not implemented.

## Actual API demonstration

```powershell
node experiments/mvp-design-flow/approval-inventory-demo.js data/my-new-approval-demo
```

The CLI reuses the prior exact-evidence clone and Phase 6E flow, then performs review/blocked REAL approval and the labeled fixture transaction through actual local HTTP. Origin records stay unchanged. Final retained output: **data/mvp-approval-phase6f-002/** (the earlier `-001` run is also preserved).

- Isolated DB: `borsal-mvp-demo-3732ca98-0a99-4509-a33b-141e7a60d76e-test`.
- Actual selected proposal: **6af742d50c6b5d44023564f0**; source is the approved Burgundy Keychain concept `a96f954a-3083-491b-9976-93d3bdbb7111`, with preserved source/photo/review lineage and the unchanged 14 x 4 cm authored cut.
- Prototype review **201 APPROVED_FOR_PROTOTYPE**, version 1; inventory count **0**.
- REAL final approval **409 PRODUCTION_NOT_READY**: production writes disabled, synthetic source/review, test evidence/methods and test stock/receipts. No real approval/reservation occurred.
- TEST_FIXTURE readiness true; simultaneous identical final requests returned **201/200**. Exactly **one** inventory plan: **6af742d60c6b5d44023564f8**, scope TEST_FIXTURE, productionAuthorized=false, manufacturingVerified=false.
- Fixture whole scrap RESERVED; **150 cm** thread and **1 piece** D-shaped ring reserved once. Available balances both **0**, reserved balances **150/1**, versions **1**. These quantities are explicit simulated stock, not real inventory assertions.
- Design-review history: version 1 APPROVED_FOR_PROTOTYPE -> version 2 APPROVED_FOR_PRODUCTION **in TEST_FIXTURE scope only**. The immutable technical proposal still reports CHECKED/UNVERIFIED.

Evidence files: `prototype-review.json`, **`blocked-production.json`**, **`inventory-test.json`**, `stock-after.json`, `test-evidence.json`, `summary.json`, `transcript.json` and individual `api-*.json` requests/responses (no authorization headers). Existing **source-flow/pattern.svg** and **source-flow/nested.svg** remain actual pattern/layout previews; no product image was generated. `origin-preservation.json` verifies original fabric/run/proposal hashes unchanged after the entire flow.

Read the retained fixture safely, with operator production writes unconfigured:

```powershell
node experiments/mvp-design-flow/serve.js borsal-mvp-demo-3732ca98-0a99-4509-a33b-141e7a60d76e-test
curl.exe http://127.0.0.1:3001/api/technical-proposals/6af742d50c6b5d44023564f0/design-review
curl.exe http://127.0.0.1:3001/api/inventory/6af742d60c6b5d44023564f8
```

Reservation itself changes availability/source revision, so the original proposal's later source-current check/readiness may be stale/not available. The inventory stores the exact pre-reservation approval snapshot and versions; idempotent replay returns that existing reservation, not a new readiness assertion.

## Tests and remaining real-MVP work

Initial API/full verification passed **13/13** and **650/650** tests. Expanded full regression passed **651/651**, **34 files**, **142.13s**, with indexes tested under autoIndex=false and safe transaction-outcome diagnostics. Existing 637 tests remain unchanged. Coverage includes three prototype decisions/no reservation, REAL rejection of test evidence, unit/balance/version checks, current source/concept/design hashes, physical failures/unresolved claims, same-key replay, concurrent same/different keys/shared stock, technical-revision and source-write races, and rollback after final inventory insertion failure. The rollback test verifies stock/fabric/run/review all unchanged and a clean retry. Zero external fetches in these tests; all successful reservations are isolated TEST_FIXTURE records. The final focused recheck is recorded below.

Remaining path: obtain a **real** measured fabric source/material/grain and genuine receipts/stock; explicitly confirm/refresh/re-review its design; construct and independently test a sample for the documented fold/ring/seam/durability limits; record truthful independent REAL evidence and authenticated human technical review; inspect the immutable previews/reports; only then enable the operator's explicit REAL final approval. Do not promote this synthetic clone into real stock. Public deployment still requires proper user authentication/authorization/audit hardening; local capability tokens are not a multi-user identity system. No manufacturing execution, consumption, release/cancel or public deployment is included here.

Final focused recheck: **14/14 passed**, **8.59s**, including correct uncertainty guidance for both approval and review. Final origin fabric/run/proposal hash checks passed; all **81** prior campaign/ledger hashes remain unchanged, no additional slots reserved (**12/20**). Intended source/docs secret/whitespace scans and `git diff --check` passed. Generated evidence remains Git-ignored. Phase 6F remains uncommitted; no push/merge or real inventory mutation occurred.
