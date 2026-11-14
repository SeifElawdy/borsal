const {contractText}=require('../../experiments/design-language/ai-spike/prompt');
const {area,dimensions,boundingBox,validatePolygon,validateWithHoles}=require('../geometry/polygon');
// Summaries describe the existing source; no new fit/geometry algorithm or source facts.
function sourceConstraints(run){
  const source=run.sources[0],data=source.data,holes=data.holes||[],polygon=data.polygonCm;
  if(!validateWithHoles(polygon,holes).valid)throw Error('INVALID_SOURCE_GEOMETRY');
  const bounds=boundingBox(polygon),size=dimensions(polygon),outerArea=area(polygon),holeArea=holes.reduce((n,h)=>n+area(h),0);
  return {sourceId:source.id,sourceHash:run.sourceSnapshot.hash,unit:'cm',polygonCm:polygon,holes,
    usableAreaCm2:outerArea-holeArea,boundsCm:bounds,...size,
    irregularity:{vertexCount:polygon.length,holeCount:holes.length,boundsFillRatio:(outerArea-holeArea)/(size.widthCm*size.heightCm),warning:'The bounds are not usable rectangular fabric. Area sufficiency does not establish containment or fit.'},
    evidence:{basis:data.geometryBasis??null,geometryVersion:data.geometryVersion??null,analysisId:data.analysisId??null,physicalAccuracy:'UNVERIFIED',
      declaredGrainDirectionDeg:run.sourceSnapshot.grainDirectionDeg??null,grainVerification:'NOT_SUPPLIED',materialProperties:'NOT_SUPPLIED',availableStock:'NOT_SUPPLIED'}};
}
function revisionFeedback(previous){
  const a=previous.assessment||{},g=a.preliminaryGeometry?.result;
  // Feedback is bounded; keep the original complete evidence in its immutable proposal.
  const issues=(a.errors||[]).flatMap(e=>e.issues?.map(i=>({code:e.code,path:i.path,message:i.message}))||[{code:e.code,path:e.path,message:e.message}]);
  const supplied=previous.originalInput?.proposal?.context?.instances,instances=Array.isArray(supplied)?supplied:undefined;
  const operations=previous.originalInput?.proposal?.design?.data?.technical?.assembly;
  const assembly=Array.isArray(operations)?operations:[];
  const referenced=new Set(assembly.flatMap(op=>Array.isArray(op?.sides)?op.sides:Array.isArray(op?.anchors)?op.anchors:[op?.from,op?.to].filter(Boolean)).map(ref=>ref?.pieceId+':'+ref?.copy));
  return {proposalId:String(previous._id),version:previous.version,status:previous.status,sourceHash:previous.provenance.fabricSourceHash,
    errors:issues.slice(0,20),additionalErrorCount:Math.max(0,issues.length-20),
    unresolved:(a.constructionPlan?.unresolved||[]).slice(0,12),
    ...(instances?{cuttingDemand:instances.map(i=>({piece:i?.pieceId,copy:i?.copy,...(validatePolygon(i?.cuttingPolygonCm).valid?{areaCm2:area(i.cuttingPolygonCm),...dimensions(i.cuttingPolygonCm)}:{geometry:'INVALID_OR_MISSING'})}))}:{}),
    ...(instances?.length>1?{assemblyCoverage:{unreferencedCopies:instances.filter(i=>!referenced.has(i?.pieceId+':'+i?.copy)).map(i=>({piece:i?.pieceId,copy:i?.copy})),status:'UNVERIFIED',reason:'Describe how each intended copy connects, or explicitly explain why it remains separate; reference presence alone never verifies construction.'}}:{}),
    geometry:g?{status:g.status,reason:g.reason,limits:g.searchLimits,area:g.areaSummary,globalImpossibilityClaimed:false}:null,
    requirement:'Propose a genuinely revised design preserving the approved creative intent. Do not copy oversized geometry, guess missing facts, silently repair historical evidence or claim global impossibility.'};
}
function compactReviewerBrief(brief){
  if(!brief)return brief;
  const copy=structuredClone(brief),text=copy.brief?.text;
  // Routine review stores the same text three times. Remove exact duplicates only,
  // never summarize, truncate or remove a distinct human creative requirement.
  if(typeof text==='string'){
    const lines=new Set(text.split(/\r?\n/).map(line=>line.trim()));
    if(copy.brief.requirements)copy.brief.requirements=copy.brief.requirements.filter(line=>!lines.has(line.trim()));
    if(copy.creative?.shapeIntent===text)delete copy.creative.shapeIntent;
  }
  return copy;
}
function messages(run,concept,feedback,userObservations,revisionApproach){
  const material=contractText().split('\n').find(line=>line.startsWith('Material='));
  return [{role:'system',content:[
    'Propose the selected product as ONE complete JSON object using borsal.design-candidate/0.1. No Markdown. This is an UNVERIFIED DESIGN PROPOSAL, never measured source facts or manufacturing proof. Do not generate legacy design/BOM/internal IDs: software constructs those after this response.',
    'You MAY invent/propose appropriate design shapes, dimensions, cutting/stitching geometry, allowances, fold geometry, attachment strategies, construction sequence and estimated required materials. Do not invent actual source fiber, weight, stretch, grain, available stock, receipts, physical tests or confirmed finished dimensions. Unknown physical evidence must NOT prevent proposing a candidate.',
    'Provide component shape hypotheses and construction intent, not a claimed spatially feasible pattern. The deterministic geometry-first planner explores new dimension/allowance alternatives and verifies placements independently. Keep component roles explicit in piece names and instructions. Unsupported weaving, folds and attachments remain limitations; no model claim establishes physical construction.',
    'TEXT=nonempty string; N=finite number; P=[N,N], never {x,y}; polygon=P[] with 3..100 points, implicitly closed (do not repeat first point). Arbitrary simple concave or convex shapes allowed; no fixed product template. Unit cm recommended. Piece names/material names are unique natural-language labels; reference these labels exactly, not invented internal IDs.',
    material,
    'Root={schemaVersion:"borsal.design-candidate/0.1",name:TEXT,unit:"cm"|"mm",overallDimensions?:{width?:N>0,height?:N>0,depth?:N>0},fabricRequirement?:Material(WOVEN_FABRIC only),pieces:Piece[1..20],materials:RequiredMaterial[],assembly:Assembly[],instructions:TEXT[1..40],limitations:TEXT[1..40]}. Optional source facts do not belong in this response. Every overallDimensions member is optional. Omit unknown depth/height/width for flat or incompletely specified products; never insert zero or invent thickness. These are proposed product targets, never established by a flat outline.',
    'Piece={name:TEXT,quantity:positive integer,cuttingPolygon?:polygon,stitchingPolygon?:polygon,allowance?:N>=0,allowancePolicy?:"EXPLICIT_CUTTING"|"UNIFORM_CONVEX_MITER",allowancesIncluded?:boolean,grainDirectionDeg?:N in [0,180),grainToleranceDeg?:N in [0,90],allowedRotationsDeg?:N[],folds?:[{type:"HEM"|"BOX"|"PLEAT",from:P,to:P,allowance:N>0}]}. All pieces come from ONE supplied scrap. Supply explicit cutting AND stitching polygons where possible; stitching must fit within cutting. At most 20 physical copies total. All point/allowance/overall coordinates use root unit. Grain angles are design orientation targets, NOT known source grain.',
    'If you give only stitching geometry, explicitly choose UNIFORM_CONVEX_MITER plus an allowance to propose uniform extra cutting material around a convex polygon. Concave offsets are unsupported: give explicit cutting geometry. Do not use this policy for a fold/tie finish you have not described. Never silently omit allowances or fabricate a stitch line by equating it to cutting.',
    'SIZE TO THE SCRAP: use sourceConstraints below, not the name or imagined dimensions of the product. Before responding, sum quantity × cutting-polygon area for EVERY piece, including all proposed allowances; this must not exceed usableAreaCm2. Software recalculates demand: do not supply a separate guessed fabric total or list the same SCRAP fabric as an extra STOCK material. Keep shapes compact for the actual irregular boundary/holes; bounds and area alone never prove fit. Placement is searched independently, so piece-local origins need not match photo coordinates. Do not silently scale a historical design: this request proposes a new version.',
    'RequiredMaterial={name:TEXT,requirement:Material,quantity?:{value:N>0,unit:"cm"|"cm2"|"piece"},threadEstimate?:{method:"ALL_STITCHING_PERIMETERS",multiplier:N>0,tailCm:N>=0}}. These are REQUIRED, never AVAILABLE. Quantity units: WOVEN_FABRIC/LINING_FABRIC/INTERFACING cm2; THREAD/WEBBING cm; ZIPPER/BUTTON/HARDWARE integer piece. Supply either quantity or an explicit thread estimation rule, not both. Specs containing Cm and tailCm always use cm. Software calculates total SCRAP cutting area and internal references. Material targets may be proposed; no UNKNOWN enums or zero placeholders. Missing specs remain unresolved instead of guessing actual fabric.',
    'Part={piece:TEXT,copy:positive integer,edges:integer[] starting at 0 for stitching edges, direction:"FORWARD"|"REVERSE"}. Anchor={piece:TEXT,copy:positive integer,point:P}. SEAM={type:"SEAM",sides:[Part,Part],thread:required material name,instruction:TEXT}. ATTACH={type:"ATTACH",from:Anchor,to:Anchor,thread:required material name,instruction:TEXT}. INSTALL={type:"INSTALL",material:required material name,anchors:Anchor[],instruction:TEXT}. Assembly=SEAM|ATTACH|INSTALL. Existing contiguous edge indices and copies only: FORWARD follows +1 indices and REVERSE follows -1, wrapping around the polygon; thread names must reference a THREAD requirement; accessory anchors must lie inside their piece.',
    'Connect every intended physical copy in the assembly plan, or explain that it is separate/unresolved. For example, REVERSE edges [3,2] are contiguous; [2,3] are not REVERSE. Positive seam allowances need distinct cutting/stitching geometry and explicit inclusion intent; fold/turn-in claims need proposed geometry and instructions. SEAM/ATTACH/INSTALL and HEM/BOX/PLEAT describe supported data, never verified construction. Missing grain/material/stock evidence must remain unknown, but must not block a proposed cutting layout. If the creative intent cannot be preserved, state the conflict in limitations for human review rather than silently substituting another product.',
    'Provide a concise proposed assembly order and keep unsupported fold/tie/finish details explicit in limitations. Do not assert fit: software runs bounded nesting. Aim for low waste and practical small products suited to the actual irregular scrap. If feedback shows the previous geometry was not placed, propose a genuinely revised shape/size/construction; never describe bounded search as global impossibility. No automatic repair or second inference follows this request.',
  ].join('\n')},{role:'user',content:JSON.stringify({concept:concept.assessment.proposal,reviewerBrief:compactReviewerBrief(concept.reviews.at(-1)?.review.draftingBrief),
    sourceConstraints:sourceConstraints(run),sourceHash:run.sourceSnapshot.hash,physicalEvidence:'UNVERIFIED',stock:'NOT_SUPPLIED',...(feedback?{previousAttemptFeedback:feedback,revisionApproach:revisionApproach||'SMALLER_SAME_INTENT'}:{}),...(userObservations?{userObservations,observationWarning:'Self-reported choices only, never independently verified source properties or available inventory. UNKNOWN remains UNKNOWN.'}:{})})}];
}
module.exports={messages,sourceConstraints,revisionFeedback};
