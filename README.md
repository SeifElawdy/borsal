# Borsal — local fabric-to-product MVP

Borsal measures a photographed fabric scrap, supports staged AI concept/review workflows, and checks proposed cutting patterns against the irregular scrap. The premium dark Creation Studio connects the existing backend steps; geometric fit is **not** manufacturing approval.

## Architecture and requirements

- Node.js/CommonJS, Express and MongoDB/Mongoose; Sharp/OpenCV.js calibration and contour extraction.
- React, Vite, Tailwind, Motion and React Router in `client/`; centralized API client and loopback Vite proxy.
- Existing deterministic geometry, bounded nesting, material/assembly checks, versioned proposals, SVGs, review and transactional reservation guards.
- Tested with Node **26.13.0**, npm, Windows and a running MongoDB replica set named **rs0**. Transactions require a replica set. Browser verification uses installed Microsoft Edge; it is not needed for ordinary use.

## Install and launch

From the project directory:

```powershell
npm ci
npm --prefix client ci
if (-not (Test-Path -LiteralPath .env)) { Copy-Item .env.example .env }
```

Create `.env` only when absent; **never overwrite existing configuration**. Configure `MONGODB_URI` for your existing local replica set. Cloudflare credentials are optional for offline use and stay server-side. The archive does not install MongoDB, initialize its replica set, or include database contents.

```powershell
npm run mvp
```

Open **http://127.0.0.1:5173**. Express listens on loopback port **3001**. A new installation starts with an empty user workspace; existing local workspace metadata reopens saved work. Stop an earlier launcher before starting another. No public deployment is configured.

## Submission demonstration — no live AI required

```powershell
node scripts/local-mvp.js --mock --construction
```

This creates a fresh isolated TEST_FIXTURE database and blocks external inference. It does not reset the user's database or shared live ledger.

1. Create a new project; upload included **`data/test-mat40.png`**, select **large**, then detect and measure. This is a synthetic calibration fixture, not verified physical fabric.
2. Inspect the image, outline and measurements; explicitly confirm the geometry.
3. In **AI availability & budget**, record a **TEST_FIXTURE** check in this mock workspace. Generate ideas; outputs replay saved creative evidence, not new live inference.
4. Select an idea, generate the fixture-labelled image, and explicitly approve for drafting. Routine review text is prefilled and editable.
5. Choose **Create Product Design**, confirm one **mocked** planner call, then **Create Product Design · 0 AI calls** to assess the saved construction intent.
6. Review and explicitly select the **open keepsake sleeve alternative**. It is a different product from the original wearable/weaving concept.
7. Inspect two 5 × 7 cm cutting panels, actual nesting, proposed seams/hems, assembly schematic, BOM and unresolved evidence. The demonstrated 70 cm² layout uses about **43.20%** of the 162.0459 cm² synthetic scrap.
8. Record a prototype-only review; production remains blocked and no stock is reserved. Reload and revisit previous stages/versions.

No engineering coordinates, IDs or raw JSON are required. Optional expert editing remains available. `data/test/TEST1.png` and `markers.json` are a legacy manual-calibration test fixture; use `test-mat40.png` for the automatic-mat walkthrough.

Optional desktop verification while that mock launcher is running:

```powershell
node scripts/check-real-creation.cjs --submission
```

It exercises actual local APIs at 1440/1920 px with mocked external AI. Results and screenshots are saved to a new `data/local-mvp/real-creation-check-*/` directory.

## Actual features and AI status

Automatic A4/large-mat registration; explicit geometry confirmation; source/photo/analysis provenance; project resume; concept review; illustrative-image storage; raw technical-output retention; deterministic sleeve construction; polygon validation and bounded nesting; pattern/nesting SVGs; BOM/assembly assessment; prototype review; protected readiness/reservation backend.

Historically used models: Cloudflare **Llama 3.1 8B**, **Llama 3.3 70B**, and **FLUX.2 Klein 4B**. Existing FLUX outputs are illustrative, not measured product photographs. A **GPT-OSS 120B** planner evaluation reached HTTP 200 but failed response-envelope validation; its unretained response body prevents a conclusive cause or quality assessment. Future technical envelopes are captured privately before validation. No speculative parser fix or live success is claimed.

The original owner's shared accounting is **19/30** requests. Live actions require explicit confirmation, current Workers Free/dashboard evidence, sufficient conservative Neurons and atomic ledger reservation; no automatic retry/fallback. **Do not initialize a second ledger using the same owner's account.** Restore the owner's latest private ledger before enabling that account in another checkout. The source package has no credentials, active workspace, campaign ledger or seeded database; it is **not a portable live deployment**.

## Evidence, tests and limitations

`submission-examples/` in the source ZIP contains selected actual TEST_FIXTURE browser screenshots and cutting/nesting/assembly SVGs. They are evidence of the demonstrated software flow, not real manufacturing. The working repository keeps full private execution records under `data/`; these are excluded from source submission.

```powershell
npm test
npm run client:build
```

Last completed regression before submission stabilization: **791/791** tests. Final submission rerun results are recorded in `docs/MVP_DELIVERY_STATUS.md`. Tests use unique test databases and mocked external inference. The >500 kB frontend chunk warning and Mongoose deprecation warnings are nonblocking.

The sleeve's geometry and assembly references pass, but physical assembly/material/stock/grain remain **UNVERIFIED**, with overall **CONCEPT_ONLY** readiness. The original Woven Wrap's interlacing/wearable function is not implemented. Missing finished dimensions are not filled with zero. Fabric/thread specifications are proposed suitability targets, not observed source facts; stock is NOT_CHECKED. Production requires independent measurements/material evidence, physical construction testing, current human approval and genuine stock through the existing protected gates.

Calibration design/print instructions: `docs/AUTOMATIC_FABRIC_CALIBRATION_PHASE3A.md`; printable files: `experiments/automatic-calibration/mat-a4.svg` and `mat-40cm.svg`. Print at Actual Size and verify with a ruler; physical measurement accuracy is not yet established.
