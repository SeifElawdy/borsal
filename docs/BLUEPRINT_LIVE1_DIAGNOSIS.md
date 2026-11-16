# Blueprint LIVE1 diagnosis � read-only, before A.2 code changes

## Preservation and baseline

Branch feature/blueprint-engineering, HEAD 9559e1e00513a0a6f90af9d4c66bbf8b0309132c. All 16 uncommitted Phase A files preserved and hash-verified in E:/Borsal-Recovery/borsal-pre-model-upgrade-20261114T170313Z/pre-blueprint-20261116T104805078Z/pre-a2-20261116T123133694Z. Existing bundle, Mongo archive and Phase A review-copy hashes verify read-only. Baseline: **944 tests / 76 files PASS; production build PASS** with provider credentials cleared and the offline guard active. Fresh accounting evidence: data/blueprint-a2/before.json. No owner database or ledger writes.

## Exact saved request and authoritative record

Campaign: mvp-technical-97232cea-bf62-4467-b45a-8ddb469b399b. Original immutable files under experiments/design-language/ai-spike/results/campaigns/mvp-technical-97232cea-bf62-4467-b45a-8ddb469b399b/: request.json, provider-envelope.json, response.json, raw-response.txt, blueprint-validation.json, proposal.json, result.json. request.json SHA-256 cf68965d99ee09143b4ef4ac8fae65748c51d7d4c8e9ad63257f76a71ce903c7; raw-response.txt SHA-256 28b5e7a698d45e2a02e9e67dcc22c3fee9f6f535d278a0eff120ae3834614dbf.

Model requested: @cf/meta/llama-3.3-70b-instruct-fp8-fast; native /ai/run, JSON Mode. Prompt JSON.stringify(messages) bytes **4693**; serialized request input **4798** bytes. The saved generation parameters below include timeoutMs, which is a local transport deadline, not a native request body field. Native payload was {messages,response_format,temperature,stream,max_tokens}; no strict JSON Schema or reasoning parameter. Raw envelope identifies backend model @cf/meta/llama-3.3-70b-json; this is recorded, not a newly selected fallback.

Saved parameters:

```json
{
  "response_format": {
    "type": "json_object"
  },
  "temperature": 0.3,
  "stream": false,
  "max_tokens": 4096,
  "timeoutMs": 120000
}
```

**Exact saved messages, without modification:**

```json
[
  {
    "role": "system",
    "content": "Return only JSON. Small flat Blueprint; never supply schemaVersion, id/_id, database IDs or coordinates. Required root fields: function (copy activeDesign.function/intendedFunction verbatim), closure (copy activeDesign closure kind), components, materials, operations, unresolved. Every object rejects unknown fields. Symbolic key /^[a-z][a-z0-9_]{0,31}$/; unique across BOTH lists. role describes purpose, NEVER a reference. Components {key,role,shape:RECT|ELLIPSE,widthCm,heightCm,quantity,allowanceCm,allowedRotationsDeg?}. Stitching dimensions positive cm, quantity integer 1..20, explicit nonnegative convex-miter cutting allowance. No POLYGON. RECT edges 0 bottom,left-to-right;1 right,bottom-to-top;2 top,right-to-left;3 left,top-to-bottom (y-up). ELLIPSE:24 CCW chords, edge0 starts at rightmost point. Optional rotations finite degrees [0,360). No invented source measurements/grain/material/stock.\nReferences: component {kind:component_instance,ref:key#n} with 1-based copy. Bare key only if quantity=1. Hardware/thread {kind:hardware,ref:key}. Anchor extends component reference with required edge (zero-based),fraction [0,1] along directed edge,insetCm>=0 inward normal; NO coordinate pairs. All references must resolve uniquely. SEAM side extends component ref with edges:[indices],direction:FORWARD|REVERSE; contiguous directed chains.\nMaterials {key,role,requirement,quantity? or threadEstimate? EXACTLY ONE}. requirement THREAD specs {fiber:COTTON|POLYESTER|BLEND,tex:positive}; ZIPPER {lengthCm:positive,toothType:COIL|METAL,endType:CLOSED|OPEN}; BUTTON {diameterCm:positive,material:WOOD|METAL|RESIN}; HARDWARE {kind:D_RING|SWIVEL_HOOK|MAGNETIC_SNAP|TURN_LOCK|RIVET|BAG_FOOT,finish:NICKEL|BRASS|BLACK,sizeCm:positive}. quantity {value:positive,unit:cm|cm2|piece}; threadEstimate {method:ALL_STITCHING_PERIMETERS,multiplier:positive,tailCm:nonnegative}. These are REQUIRED materials, never AVAILABLE stock.\nEvery operation requires type,instruction plus: SEAM {sides:[side,side],thread:hardwareRef}; ATTACH {from:anchor,to:anchor,thread:hardwareRef}; INSTALL {material:hardwareRef,anchors:[anchor]}; LAYER {layers:[anchor,anchor,...] (2..6 distinct copies),thread:hardwareRef}; FINISH {component:componentRef,scope:ALL_COPIES,edges:[indices],method:OVERCAST,thread:hardwareRef}; FOLD {component:componentRef,scope:ALL_COPIES,method:HEM,axis:HORIZONTAL|VERTICAL,offsetCm,spanStartCm,spanEndCm,allowanceCm:positive}. All-copy operations explicitly reference copy #1; they apply to every copy, not just #1. FOLD span end > start; values are cm along its stated axis, not vertex lists. Thread refs require THREAD. Every copy needs a supported join, attach, install, layer or fold. Preserve mandatory closure with declared matching hardware AND INSTALL. Reference consistency is not functional closure proof.\nLimits: 12 component definitions,20 materials,30 operations,8 unresolved. unresolved:[{reason,affectedKeys:[declared keys]}] for unspecifiable or unsupported needs, including elastic/gathering/weaving, single-copy finishing/folds, physical tests. Do not turn these into invented operations. Use short instructions. Missing source physical facts stay unknown. Bounding box and recorded area are approximate GUIDANCE ONLY: deterministic nesting decides feasibility; area sufficiency does NOT prove fit. No automatic shrinking. Physical manufacturing is NOT VERIFIED. Return only JSON, no reasoning. Follow activeDesign closure and silhouette exactly. If unsupported, place the exact need under unresolved; do not substitute another closure. Changes require separate explicit human selection."
  },
  {
    "role": "user",
    "content": "{\"sourceGuidance\":{\"widthCm\":11.388888888888893,\"heightCm\":23.3611111111111,\"recordedAreaCm2\":162.045910493827,\"approximate\":true,\"shape\":\"IRREGULAR\",\"holesCount\":0,\"exactPolygon\":\"RETAINED_BY_HOST_FOR_NESTING\",\"physicalAccuracy\":\"UNVERIFIED\",\"material\":\"UNKNOWN\",\"grain\":\"UNKNOWN\",\"stock\":\"UNKNOWN\"},\"concept\":{\"activeDesign\":{\"designFingerprint\":\"a6d668cbd45f9547c715010c2bec424b191e5b8a5dbd1bc3c43be1ed3d125493\",\"sourceReference\":\"fabric-6afaf4e1b75c874d3e57621f\",\"name\":\"Mini Coin Purse\",\"function\":\"Practical accessory\",\"silhouette\":\"A small, functional purse made from fabric scraps, perfect for carrying coins or small items\",\"closure\":{\"kind\":\"UNKNOWN\",\"description\":\"Closure not specified\",\"requirements\":[]},\"details\":[\"Small, compact design\"],\"attachments\":[],\"construction\":null,\"unresolved\":[\"Determine the optimal fabric scrap size for the purse\",\"Physical construction and source material/stock remain unverified\"]}}}"
  }
]
```

Read directly from MongoDB creationprojects (not inferred from product name): project 6afaf4c0b75c874d3e57621e; fabric 6afaf4e1b75c874d3e57621f; run 6afaf4fab75c874d3e576222; concept 3e5e03eb-6815-4b4a-a7ed-9d68492f444a; approved review version 1; design **version 2**, fingerprint **a6d668cbd45f9547c715010c2bec424b191e5b8a5dbd1bc3c43be1ed3d125493**. Stored approved function: **"Practical accessory"**. Closure exactly {"kind":"UNKNOWN","description":"Closure not specified","requirements":[]}. Thus UNKNOWN with requirements=[] represents **no mandatory closure specified**, not unsupported closure. Other stored requirements/features: {"name":"Mini Coin Purse","closure":{"kind":"UNKNOWN","description":"Closure not specified","requirements":[]},"features":["Small, compact design"]}. Silhouette: "A small, functional purse made from fabric scraps, perfect for carrying coins or small items"; attachments []; unresolved ["Determine the optimal fabric scrap size for the purse","Physical construction and source material/stock remain unverified"]. Source {"widthCm":11.388888888888893,"heightCm":23.3611111111111,"usableAreaCm2":162.045910493827,"material":"UNKNOWN","grain":"UNKNOWN","physicalAccuracy":"UNVERIFIED"}. The current project also retains version 3, fingerprint 1b699e7e84c39cb3d0a0651d24bc7f7f6daa6fabaeb1e0d1fd038dbe3441e72f; historical request context must not be silently replaced with it.

## Exact returned output and persistence

```json
{"function": "Practical accessory", "closure": "UNKNOWN", "components": [], "materials": [], "operations": [], "unresolved": ["Determine the optimal fabric scrap size for the purse", "Physical construction and source material/stock remain unverified", "Unsupported closure kind"]}
```

HTTP **200**, content-type application/json; finish_reason **stop**; truncated **false**; final assistant content exists. Usage exactly {"prompt_tokens":1156,"completion_tokens":60,"total_tokens":1216,"neurons":43.116146087646484}; 60 completion tokens out of 4,096. No token exhaustion or transport/envelope parsing failure. The 280-byte final text is preserved as proposal 6afaf534b75c874d3e576224, technical version 1, MODEL_OUTPUT, REJECTED/FAIL. Operation 6afaf52fb75c874d3e576223 is SUCCEEDED/201 because the response was persisted; it does **not** mean engineering success.

Saved validation findings:

```json
{
  "status": "REJECT",
  "errors": [
    {
      "code": "INVALID_FIELD",
      "path": [
        "components"
      ],
      "message": "Too small: expected array to have >=1 items"
    },
    {
      "code": "INVALID_FIELD",
      "path": [
        "unresolved",
        0
      ],
      "message": "Invalid input: expected object, received string"
    },
    {
      "code": "INVALID_FIELD",
      "path": [
        "unresolved",
        1
      ],
      "message": "Invalid input: expected object, received string"
    },
    {
      "code": "INVALID_FIELD",
      "path": [
        "unresolved",
        2
      ],
      "message": "Invalid input: expected object, received string"
    }
  ],
  "normalizations": [],
  "provenance": "LIVE_AI"
}
```

blueprint.validate performs schema.safeParse first and returns immediately on these four errors: components minimum 1; unresolved[0], [1], [2] must be objects. Blueprint function/closure/reference checks therefore did **not** run after that early return. Existing active source/design/review guards ran before dispatch and again before persistence; technicalFlow's identity check cannot treat this schema-less raw object as an engineering plan. No compiler, geometry assessment or nesting ran. No cutting geometry is recoverable from empty components. Do not repair or overwrite this rejected evidence.

## Request-count reconciliation

Actual persisted global usage: **73**, not 72. Phase A baseline was 71. request-72.json is the new idea campaign mvp-concepts-2c4a48cd-a79a-42cc-81eb-217ee5bcd609, reserved 2026-11-16T12:20:10.409Z. request-73.json is this technical campaign, reserved 2026-11-16T12:21:04.222Z. Its persisted receipt/generation.globalUsed is 73. The reported confirmation UI's 72 was the count **before** the technical request; it is not the post-request total. Ledger and persisted receipt agree. No slot was reset/refunded. Snapshot: 479 ledger files, 51 settings/operation records; hashes/totals recorded privately in before.json.

## Hypotheses � evidence, not inferred model reasoning

| Hypothesis | Finding | Evidence / limit |
|---|---|---|
| Prompt said UNKNOWN was unsupported or told model to decline | **SUPPORTED as ambiguity; CONTRADICTED as an explicit instruction** | It says preserve mandatory closure with matching hardware AND INSTALL, without explaining UNKNOWN. It permits unsupported needs under unresolved; model added Unsupported closure kind. No sentence explicitly calls UNKNOWN unsupported. Actual causal reasoning is UNDETERMINED; host code already allowed UNKNOWN. |
| unresolved was an escape hatch because components were not required | **CONTRADICTED literally; SUPPORTED missing accepted-attempt minimum guidance** | Root-field list includes components, but no explicit at-least-one rule or statement that unresolved cannot replace a construction. Response used empty components/operations. |
| No structural example; model guessed object-shaped fields | **SUPPORTED absence and resulting mismatch; causal attribution UNDETERMINED** | Prompt contains shorthand catalog, not a full JSON skeleton. It says unresolved:[{reason,affectedKeys}], yet output copies string-shaped existing identity.unresolved entries. |
| Supplied function missing/mangled/too vague | **CONTRADICTED missing/mangled; SUPPORTED broad wording** | Mongo version 2, sent activeDesign.function and returned function all say Practical accessory verbatim. This is broad, but the supplied silhouette explicitly explains carrying coins/small items. No authority exists to rewrite the approved function. |
| Output budget, provider envelope or deterministic nesting caused failure | **CONTRADICTED** | HTTP 200, normal stop, complete JSON, only 60 output tokens. Schema rejection happened before nesting. |

## Narrow A.2 direction

Keep UNKNOWN as unspecified; do not force an open construction or invent closure hardware. A supported open proposal is acceptable only when it plausibly preserves the existing approved function, silhouette and requirements. If the vocabulary cannot represent that function, report the limitation rather than manufacture geometry. Move authoritative function ownership to the host. Add a deliberately invalid, non-product-specific structure skeleton and explicit minimum/typed-unresolved rules. Reuse one capability classification for preflight and expansion. Explicit mandatory unsupported or uninterpretably ambiguous requirements require clarification before any hold; nonmandatory ambiguity warns and permits a request. No product-name matching, identity rewrite or functional-rule engine.

No live inference was performed for this diagnosis.
