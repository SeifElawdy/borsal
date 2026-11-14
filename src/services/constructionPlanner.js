// Construction hypotheses only. Existing constructor, nester and prechecks remain authoritative.
const {z}=require('zod'),candidate=require('./designCandidate');
const {fingerprint}=require('../../experiments/ai-pattern-proposals/adapter');
const POLICY='borsal.construction-planner/0.1',VERSION='borsal.construction-intent/0.1';
const text=z.string().trim().min(1).max(800),positive=z.number().finite().positive();
const intentSchema=z.object({schemaVersion:z.literal(VERSION),name:text,function:text,
  method:z.enum(['TWO_PANEL_OPEN_SLEEVE','UNSUPPORTED']),cutWidthCm:positive.max(30).optional(),cutHeightCm:positive.max(30).optional(),
  seamAllowanceCm:positive.max(2).optional(),hemTurnCm:positive.max(2).optional(),
  creativeChanges:z.array(text).min(1).max(8),unresolved:z.array(text).min(1).max(8)}).strict();
function messages(run,concept){return [{role:'system',content:`Return one JSON object, no Markdown. Plan construction, NOT cutting coordinates. Contract: {schemaVersion:"${VERSION}",name:string,function:string,method:"TWO_PANEL_OPEN_SLEEVE"|"UNSUPPORTED",cutWidthCm?:positive number,cutHeightCm?:positive number,seamAllowanceCm?:positive number,hemTurnCm?:positive number,creativeChanges:nonempty string[],unresolved:nonempty string[]}. The supported primitive joins two congruent rectangular panels on three sides, double-turns the open top, and overcasts internal raw seam allowances. This is a limited sewn sleeve, NOT weaving or a wearable wrap. If changing the idea, disclose the different function for human selection. Omit dimensions for UNSUPPORTED. Propose small design dimensions constrained by the scrap: two panels use 2*width*height cm2, including all allowances; area alone never proves fit. No source properties, stock, physical tests or manufacturing approval may be invented. Unknowns stay unknown. All engineering is UNVERIFIED. No more than 8 short entries per list.`},
 {role:'user',content:JSON.stringify({concept:concept.assessment?.proposal||concept,source:{polygonCm:run.sourceSnapshot.polygonCm,holes:run.sourceSnapshot.holes||[],physicalAccuracy:'UNVERIFIED',material:'UNKNOWN',grain:'UNKNOWN',stock:'UNKNOWN'},task:'Assess the original wrap/weaving intent honestly. If unsupported, propose a clearly named small sewn keepsake sleeve as an alternative, requiring explicit selection.'})}];}
function compile(input){
 const intent=intentSchema.parse(input);if(intent.method==='UNSUPPORTED')return {intent,candidate:null,reason:'CONSTRUCTION_METHOD_UNSUPPORTED'};
 const {cutWidthCm:w,cutHeightCm:h,seamAllowanceCm:s,hemTurnCm:t}=intent;
 if([w,h,s,t].some(v=>v===undefined))return {intent,candidate:null,reason:'EXPLICIT_CONSTRUCTION_DIMENSIONS_REQUIRED'};
 if(w<=2*s||h<=s+2*t+.1)return {intent,candidate:null,reason:'ALLOWANCES_EXCEED_PANEL'};
 const pieces=['front pocket panel','back pocket panel'].map(name=>({name,role:'POCKET',quantity:1,
  cuttingPolygon:[[0,0],[w,0],[w,h],[0,h]],stitchingPolygon:[[s,s],[w-s,s],[w-s,h-2*t-.1],[s,h-2*t-.1]],
  allowance:s,allowancePolicy:'EXPLICIT_CUTTING',allowancesIncluded:true,
  folds:[{type:'HEM',from:[0,h-t],to:[w,h-t],allowance:t},{type:'HEM',from:[0,h-2*t],to:[w,h-2*t],allowance:t}]}));
 const instructions=[`Cut one front and one back panel, each ${w} × ${h} cm, only from the independently validated layout. All seam/turn-in fabric is included.`,
  `On each panel, turn the top edge inward by ${t} cm twice along the marked axes. Stitch the folded hem ${.1} cm below its inner edge; confirm the finish on a test sample.`,
  `Place right sides together, align the two hemmed openings, and sew the side–bottom–side path at ${s} cm allowance. Leave the hemmed top open.`,
  'Hand-overcast the exposed internal side/bottom seam allowances before turning; no edge is declared fray-proof. Check the actual fabric and stitch formation.',
  'Turn right side out and check pocket opening, seams and fit with a physical prototype. This open sleeve has no closure, woven structure or load-bearing claim.'];
 return {intent,candidate:{schemaVersion:candidate.VERSION,name:intent.name,unit:'cm',
  // Targets are proposed suitability requirements, never observed material facts.
  fabricRequirement:{type:'WOVEN_FABRIC',specs:{fiber:'COTTON',weave:'PLAIN',weightGsm:150}},pieces,
  materials:[{name:'required sewing thread',requirement:{type:'THREAD',specs:{fiber:'POLYESTER',tex:30}},threadEstimate:{method:'ALL_STITCHING_PERIMETERS',multiplier:3,tailCm:30}}],
  assembly:[{type:'SEAM',sides:[{piece:pieces[0].name,copy:1,edges:[3,0,1],direction:'FORWARD'},{piece:pieces[1].name,copy:1,edges:[1,0,3],direction:'REVERSE'}],thread:'required sewing thread',instruction:instructions[2]}],
  instructions,limitations:[...intent.creativeChanges,...intent.unresolved,'Alternative product: a two-panel open keepsake sleeve. This does not implement or replace the approved wearable Woven Wrap.',
   'Cotton/plain/150 gsm and polyester/tex30 are UNVERIFIED suitability targets, not supplied fabric observations. Test the actual material; no stock is declared available.',
   'Hem, overcasting, seam bulk, stitch tension, capacity and strength require physical trials. Finished dimensions are not measured or verified.']}};
}
function plan(_raw,source,concept,options={}){
 const intents=options.intent?[options.intent]:[6,5,4].map(w=>({schemaVersion:VERSION,name:'Keepsake sleeve — alternative product',function:'An open sleeve for a small keepsake; not a wearable wrap',method:'TWO_PANEL_OPEN_SLEEVE',cutWidthCm:w,cutHeightCm:w+2,seamAllowanceCm:.5,hemTurnCm:.5,
  creativeChanges:['Preserves use of the selected scrap, but changes wearable wrap/weaving into a simple open sewn sleeve. Explicit alternative selection is required.'],unresolved:['Source material, grain, available thread and physical construction are not verified.']}));
 const attempts=[],alternatives=[];for(const input of intents){const built=compile(input);if(!built.candidate){attempts.push({status:'UNVERIFIED',reason:built.reason});continue;}
  const result=candidate.construct(built.candidate,source,concept,{search:{maxCandidates:1500,maxBacktracks:50}}),screen=result.screening;
  attempts.push({status:screen?.status||result.status,reason:screen?.reason,errors:result.errors,demandCm2:screen?.areaSummary.requestedPieceAreaCm2,attemptedPlacements:screen?.attemptedCandidates||0});
  if(result.errors.length||screen?.status!=='LAYOUT_FOUND'||screen.validatorEvidence.geometryStatus!=='PASS')continue;
  const evidence=require('./constructionFidelity').assess({origin:'ENGINE_DERIVED',originalInput:{proposal:result.proposal},provenance:{fabricScrapId:source.id,sourceSnapshot:source,derivation:{candidate:built.candidate,constructionIntent:built.intent}},assessment:{preliminaryGeometry:{result:screen},constructionPlan:{instructions:result.instructions}}},concept);
  if(evidence.precheck?.layers.assembly.status==='FAIL')continue;
  const assumptions=built.candidate.limitations,key=fingerprint({policy:POLICY,source,intent:built.intent});
  alternatives.push({key,candidate:built.candidate,result,assumptions,intent:built.intent,creativeCoverage:'ALTERNATIVE_PRODUCT',assemblyEvidence:evidence.precheck?.layers.assembly||null,verdicts:{geometry:'PASS',assemblyReferences:evidence.precheck?.layers.assembly.status||'UNVERIFIED',materials:'UNVERIFIED',stock:'UNVERIFIED',physicalAssembly:'UNVERIFIED'},finishingPaths:[]});
  if(alternatives.length===2)break;
 }
 return {policy:POLICY,status:alternatives.length?'ALTERNATIVES_FOUND':'NO_SUPPORTED_CONSTRUCTION',attempts,alternatives,limits:{maxAlternatives:2,maxCandidatesPerLayout:1500,maxBacktracks:50},manufacturingVerified:false,inventoryChecked:false,globalImpossibilityClaimed:false};
}
function schematic(raw){
 const {intent,candidate:c}=compile(raw);if(!c)return null;
 const w=intent.cutWidthCm,h=intent.cutHeightCm,k=180/Math.max(w,h),s=intent.seamAllowanceCm,t=intent.hemTurnCm;
 const panel=(x,paired=false)=>`<g transform="translate(${x},95)">${paired?`<rect x="8" y="-8" width="${w*k}" height="${h*k}" fill="none" stroke="#bfa7da" stroke-dasharray="5 4"/>`:''}<rect width="${w*k}" height="${h*k}" fill="#49354f" stroke="#f2eaf7" stroke-width="2"/><path d="M0 ${t*k}H${w*k}M0 ${2*t*k}H${w*k}" stroke="#bfa7da" stroke-dasharray="6 4" fill="none"/><path d="M${s*k} ${(2*t+.1)*k}V${(h-s)*k}H${(w-s)*k}V${(2*t+.1)*k}" fill="none" stroke="#d8ff51" stroke-width="3"/><text y="${h*k+28}" fill="#f2eaf7" font-size="16">${w} × ${h} cm cut</text></g>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="360" viewBox="0 0 1000 360"><metadata>${JSON.stringify({policy:POLICY,intentSha256:fingerprint(intent),basis:'PROPOSED_CONSTRUCTION_SCHEMATIC',physicalAssembly:'UNVERIFIED'})}</metadata><rect width="100%" height="100%" fill="#19151f"/><text x="24" y="30" fill="#f2eaf7" font-size="21">Proposed sleeve assembly — not a finished-product image</text><text x="24" y="60" fill="#cbb9d8" font-size="16">White: cut · purple dashes: top turn axes · lime: side/base seam</text>${panel(60)}${panel(330)}${panel(680,true)}<text x="60" y="325" fill="#f2eaf7" font-size="16">1. Hem both openings</text><text x="330" y="325" fill="#f2eaf7" font-size="16">2. Align right sides together</text><text x="680" y="325" fill="#f2eaf7" font-size="16">3. Sew sides/base; top stays open</text><text x="24" y="350" fill="#cbb9d8" font-size="15">Then overcast internal raw edges, turn and test. Material, seam strength and finished capacity remain UNVERIFIED.</text></svg>`;
}
module.exports={POLICY,VERSION,intentSchema,messages,compile,plan,schematic};
