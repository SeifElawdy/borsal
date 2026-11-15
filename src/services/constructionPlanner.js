// Construction hypotheses only. Existing constructor, nester and prechecks remain authoritative.
const {z}=require('zod'),candidate=require('./designCandidate');
const {fingerprint}=require('../../experiments/ai-pattern-proposals/adapter');
const POLICY='borsal.construction-planner/0.1',VERSION='borsal.construction-intent/0.1';
const text=z.string().trim().min(1).max(800),positive=z.number().finite().positive();
const intentSchema=z.object({schemaVersion:z.literal(VERSION),name:text,function:text,
  method:z.enum(['TWO_PANEL_OPEN_SLEEVE','TWO_PANEL_SNAP_FLAP_POUCH','UNSUPPORTED']),cutWidthCm:positive.max(30).optional(),cutHeightCm:positive.max(30).optional(),flapLengthCm:positive.max(10).optional(),
  seamAllowanceCm:positive.max(2).optional(),hemTurnCm:positive.max(2).optional(),
  creativeChanges:z.array(text).min(1).max(8),unresolved:z.array(text).min(1).max(8)}).strict();
function messages(run,concept){return [{role:'system',content:`Return one JSON object, no Markdown. Plan construction, NOT cutting coordinates. Contract: {schemaVersion:"${VERSION}",name:string,function:string,method:"TWO_PANEL_OPEN_SLEEVE"|"TWO_PANEL_SNAP_FLAP_POUCH"|"UNSUPPORTED",cutWidthCm?:positive number,cutHeightCm?:positive number,flapLengthCm?:positive number,seamAllowanceCm?:positive number,hemTurnCm?:positive number,creativeChanges:nonempty string[],unresolved:nonempty string[]}. OPEN_SLEEVE: two panels, three sewn sides, double hems, overcast allowances, no closure. SNAP_FLAP_POUCH: front/back with integral extended flap and proposed paired magnetic snap; supply flapLengthCm. Prefer it for coin retention. Host searches bounded dimensions and validates layouts. Weaving, drawstrings and strength are unverified. Disclose creative changes for human selection. Omit dimensions for UNSUPPORTED. Include allowances in cutting dimensions; demand is 2*w*h plus w*flapLength for a flap. Area alone never proves fit. Never fabricate source facts, stock, tests or approval. All engineering is UNVERIFIED; lists max8 short entries.`},
 {role:'user',content:JSON.stringify({concept:concept.assessment?.proposal||concept,source:{polygonCm:run.sourceSnapshot.polygonCm,holes:run.sourceSnapshot.holes||[],physicalAccuracy:'UNVERIFIED',material:'UNKNOWN',grain:'UNKNOWN',stock:'UNKNOWN'},task:'Assess only the selected concept, its intended function and stated features. Do not introduce wrap, weaving, wearable or keychain requirements unless that concept states them. Proposed closure/construction interpretations require explicit selection; an open sleeve cannot establish secure coin retention. Otherwise declare unsupported construction and preserve the missing decisions.'})}];}
function compile(input){
 const intent=intentSchema.parse(input);if(intent.method==='UNSUPPORTED')return {intent,candidate:null,reason:'CONSTRUCTION_METHOD_UNSUPPORTED'};
 if(intent.method==='TWO_PANEL_SNAP_FLAP_POUCH')return compilePouch(intent);
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
  instructions,limitations:[...intent.creativeChanges,...intent.unresolved,'Alternative product: a two-panel open keepsake sleeve. This does not establish or replace the distinct functional features of the approved concept.',
   'Cotton/plain/150 gsm and polyester/tex30 are UNVERIFIED suitability targets, not supplied fabric observations. Test the actual material; no stock is declared available.',
   'Hem, overcasting, seam bulk, stitch tension, capacity and strength require physical trials. Finished dimensions are not measured or verified.']}};
}
function compilePouch(intent){
 if(intent.flapLengthCm===undefined)return {intent,candidate:null,reason:'EXPLICIT_FLAP_LENGTH_REQUIRED'};
 const base=compile({...intent,method:'TWO_PANEL_OPEN_SLEEVE'});if(!base.candidate)return {...base,intent};
 const c=base.candidate,w=intent.cutWidthCm,h=intent.cutHeightCm,t=intent.hemTurnCm,s=intent.seamAllowanceCm,f=intent.flapLengthCm,hinge=h-2*t,frontY=hinge-.65*f,backY=hinge+.65*f;
 if(w-2*s<2.5||frontY<s+.4||backY>h+f-2*t-.4)return {intent,candidate:null,reason:'POUCH_CLOSURE_CLEARANCE_INSUFFICIENT'};
 c.name=intent.name;const [front,back]=c.pieces;front.name='front coin pocket panel';back.name='back coin pocket with integral flap';back.role='FLAP';
 back.cuttingPolygon=[[0,0],[w,0],[w,h+f],[0,h+f]];back.folds=back.folds.map(a=>({...a,from:[a.from[0],a.from[1]+f],to:[a.to[0],a.to[1]+f]}));
 c.assembly[0].sides[0].piece=front.name;c.assembly[0].sides[1].piece=back.name;
 delete c.materials[0].threadEstimate;c.materials[0].quantity={value:3*(2*(w+h)+2*(w+h+f))+100,unit:'cm'};
 c.materials.push({name:'required paired magnetic snap',requirement:{type:'HARDWARE',specs:{kind:'MAGNETIC_SNAP',finish:'NICKEL',sizeCm:.6}},quantity:{value:1,unit:'piece'}});
 c.assembly.push({type:'INSTALL',material:'required paired magnetic snap',anchors:[{piece:front.name,copy:1,point:[w/2,frontY]},{piece:back.name,copy:1,point:[w/2,backY]}],instruction:`Propose one complete paired magnetic snap: front center (${w/2}, ${frontY}) cm; flap counterpart (${w/2}, ${backY}) cm in local cutting coordinates. These align by reflection about y=${hinge} cm; verify hardware fit and retention physically.`});
 c.instructions=[`Cut one front coin pocket panel ${w} × ${h} cm and one back coin pocket with integral flap ${w} × ${h+f} cm from the assessed layout. All seam and turn-in fabric is included.`,
  `Double-turn the front top by ${t} cm twice; double-turn the rear flap tip by ${t} cm twice. Stitch each hem 0.1 cm below its inner edge.`,
  `With right sides together and bottoms aligned, sew front to back along the matching side–bottom–side paths at ${s} cm allowance; stop 0.1 cm below the finished opening y=${hinge} cm. Do not sew the opening closed.`,
  'Hand-overcast the internal side/bottom allowances and both exposed integral-flap side edges. Turn the pocket right side out. Test actual fray control and seam bulk on a sample.',
  `Propose folding the integral flap over the opening along y=${hinge} cm. This hinge is a construction hypothesis, not a supported hem operation or verified physical fold.`,
  c.assembly[1].instruction,'Close the paired snap to cover the pocket opening. Test coin escape, opening clearance, fabric tear-out and snap force before prototype use; secure retention is NOT proven.'];
 c.assembly[0].instruction=c.instructions[2];c.limitations=[...intent.creativeChanges,...intent.unresolved,'NEW snap-flap interpretation, not a recovery or resizing of the saved model geometry. It requires explicit human selection.',
  'No gathered/drawstring closure or internal pocket is engineered. Existing illustrations may show those unsupported features.',
  'The flap hinge is explicitly proposed but not a new validated folding operation. Physical fold, snap installation/retention, reinforcement needs, finishing and small-coin containment remain UNVERIFIED.',
  'Woven cotton/plain/150 gsm, polyester tex30 and 0.6 cm nickel magnetic snap are proposed suitability requirements, not measured source properties or available stock. One hardware unit means one complete paired snap set.',
  'Thread demand is an unverified estimate: three times both cutting perimeters plus 100 cm for hems, overcasting, installation and tails. No physical manufacturing approval.'];
 return {intent,candidate:c};
}
function plan(_raw,source,concept,options={}){
 if(options.pouch&&!/coin|pouch|purse/i.test(concept?.productIdea?.name||''))return {status:'NO_SUPPORTED_CONSTRUCTION',alternatives:[],attempts:[{reason:'COIN_POUCH_INTENT_REQUIRED'}],manufacturingVerified:false};
 const intents=options.pouch?[...(_raw?.cutWidthCm&&_raw?.cutHeightCm?[[ _raw.cutWidthCm,_raw.cutHeightCm ]]:[]),[5,7],[4.5,6.5],[4,6]].map(([w,h])=>({schemaVersion:VERSION,name:'Coin Pouch — proposed snap-flap interpretation',function:'Small closed fabric pocket for coins, using a proposed integral flap and paired snap',method:'TWO_PANEL_SNAP_FLAP_POUCH',cutWidthCm:w,cutHeightCm:h,seamAllowanceCm:.5,hemTurnCm:.4,flapLengthCm:2.5,creativeChanges:['Retains the coin-storage purpose; proposes a snap and integral flap instead of leaving the closure undecided or copying unengineered drawstrings. Explicit selection required.'],unresolved:['Actual material, grain, stock and physical closure/coin-retention tests missing.']})):options.intent?[options.intent]:[6,5,4].map(w=>({schemaVersion:VERSION,name:'Keepsake sleeve — alternative product',function:'An open sleeve for a small keepsake; a separate proposed product',method:'TWO_PANEL_OPEN_SLEEVE',cutWidthCm:w,cutHeightCm:w+2,seamAllowanceCm:.5,hemTurnCm:.5,
  creativeChanges:[`Uses the selected scrap for an open sewn sleeve, a different interpretation of ${concept?.productIdea?.name||'the selected idea'}. Explicit alternative selection is required; its original functional features are not assumed implemented.`],unresolved:['Source material, grain, available thread and physical construction are not verified.']}));
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
 if(raw?.method==='TWO_PANEL_SNAP_FLAP_POUCH'){const built=compile(raw);if(!built.candidate)return null;return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="430" viewBox="0 0 1000 430"><rect width="1000" height="430" fill="#19151f"/><g fill="#f8f4fc" font-family="sans-serif" font-size="21"><text x="30" y="35">Proposed snap-flap Coin Pouch — physical assembly UNVERIFIED</text><rect x="90" y="110" width="210" height="220" fill="#57334d" stroke="#d8ff51"/><text x="75" y="370">Front pocket</text><rect x="430" y="65" width="210" height="265" fill="#57334d" stroke="#d8ff51"/><path d="M430 150H640" stroke="#ddd0e9" stroke-dasharray="8 6"/><circle cx="195" cy="185" r="9"/><circle cx="535" cy="110" r="9"/><text x="400" y="370">Back + integral flap</text><text x="690" y="140">Dashed: proposed hinge</text><text x="690" y="185">Dots: paired snap</text><text x="30" y="410">Diagram only; use source-linked cutting geometry and test the actual closure.</text></g></svg>`;}

 const {intent,candidate:c}=compile(raw);if(!c)return null;
 const w=intent.cutWidthCm,h=intent.cutHeightCm,k=180/Math.max(w,h),s=intent.seamAllowanceCm,t=intent.hemTurnCm;
 const panel=(x,paired=false)=>`<g transform="translate(${x},95)">${paired?`<rect x="8" y="-8" width="${w*k}" height="${h*k}" fill="none" stroke="#bfa7da" stroke-dasharray="5 4"/>`:''}<rect width="${w*k}" height="${h*k}" fill="#49354f" stroke="#f2eaf7" stroke-width="2"/><path d="M0 ${t*k}H${w*k}M0 ${2*t*k}H${w*k}" stroke="#bfa7da" stroke-dasharray="6 4" fill="none"/><path d="M${s*k} ${(2*t+.1)*k}V${(h-s)*k}H${(w-s)*k}V${(2*t+.1)*k}" fill="none" stroke="#d8ff51" stroke-width="3"/><text y="${h*k+28}" fill="#f2eaf7" font-size="16">${w} × ${h} cm cut</text></g>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="360" viewBox="0 0 1000 360"><metadata>${JSON.stringify({policy:POLICY,intentSha256:fingerprint(intent),basis:'PROPOSED_CONSTRUCTION_SCHEMATIC',physicalAssembly:'UNVERIFIED'})}</metadata><rect width="100%" height="100%" fill="#19151f"/><text x="24" y="30" fill="#f2eaf7" font-size="21">Proposed sleeve assembly — not a finished-product image</text><text x="24" y="60" fill="#cbb9d8" font-size="16">White: cut · purple dashes: top turn axes · lime: side/base seam</text>${panel(60)}${panel(330)}${panel(680,true)}<text x="60" y="325" fill="#f2eaf7" font-size="16">1. Hem both openings</text><text x="330" y="325" fill="#f2eaf7" font-size="16">2. Align right sides together</text><text x="680" y="325" fill="#f2eaf7" font-size="16">3. Sew sides/base; top stays open</text><text x="24" y="350" fill="#cbb9d8" font-size="15">Then overcast internal raw edges, turn and test. Material, seam strength and finished capacity remain UNVERIFIED.</text></svg>`;
}
module.exports={POLICY,VERSION,intentSchema,messages,compile,plan,schematic};
