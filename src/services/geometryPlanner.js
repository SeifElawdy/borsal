// New design hypotheses, not repairs to historical AI output. Existing constructor,
// polygon validator and bounded nester remain the only geometry authorities.
const {z}=require('zod'),candidate=require('./designCandidate');
const {area,validateWithHoles}=require('../geometry/polygon');
const {fingerprint}=require('../../experiments/ai-pattern-proposals/adapter');
const {fail,ensureCurrent}=require('./conceptFlow');
const POLICY='borsal.geometry-planner/0.1';
const limitsSchema=z.object({scales:z.array(z.number().finite().positive().max(1)).min(1).max(6).default([.6,.5,.4,.3]),maxAlternatives:z.number().int().min(1).max(3).default(2)}).strict();
const inputSchema=z.object({parentProposalId:z.string().regex(/^[a-f0-9]{24}$/),expectedReviewVersion:z.number().int().positive(),expectedTechnicalVersion:z.number().int().nonnegative(),
  action:z.enum(['EXPLORE','SELECT']),constructionMethod:z.enum(['SHAPE_STUDY','TWO_PANEL_SLEEVE','COIN_POUCH_SNAP_FLAP']).default('SHAPE_STUDY'),alternativeKey:z.string().regex(/^[a-f0-9]{64}$/).optional(),acceptCreativeLimitations:z.boolean().optional(),limits:limitsSchema.optional()}).strict();
function plan(raw,source,concept,options={}){
  const limits=limitsSchema.parse(options),parsed=candidate.candidateSchema.safeParse(candidate.normalizeCandidate(raw).candidate),attempts=[],alternatives=[];
  const out={policy:POLICY,attempts,alternatives,limits,manufacturingVerified:false,inventoryChecked:false,globalImpossibilityClaimed:false};
  if(!parsed.success)return {...out,status:'INVALID_CONSTRUCTION',issues:parsed.error.issues};
  if(!validateWithHoles(source.polygonCm,source.holes||[]).valid)return {...out,status:'INVALID_SOURCE_GEOMETRY'};
  const seed=parsed.data,unit=seed.unit==='mm'?.1:1,usable=area(source.polygonCm)-(source.holes||[]).reduce((s,h)=>s+area(h),0);
  for(const scale of [...new Set(limits.scales)]){
    const assumptions=[`NEW ENGINE_DERIVED alternative: scale supplied shape hypotheses by ${scale}; this does not modify or repair the original design.`,
      'Use one scrap only; previous additional woven-fabric STOCK declarations are not carried into this alternative.',
      'Separate edge-finishing paths are proposed. Previous joining seams, folds and attachment claims are not reused; woven assembly is UNVERIFIED.'];
    const pieces=[];let unsupported;
    for(const p of seed.pieces){
      const convert=ring=>ring?.map(point=>point.map(v=>v*unit*scale));
      let cutting=convert(p.cuttingPolygon),stitching=convert(p.stitchingPolygon),allowance=p.allowance===undefined?undefined:p.allowance*unit*scale,included=p.allowancesIncluded===true;
      try{
        // Explicit distinct arbitrary outlines can be scaled together. Coincident
        // lines cannot prove an allowance: propose a NEW supported convex offset.
        if(stitching&&allowance!==undefined&&(!cutting||JSON.stringify(cutting)===JSON.stringify(stitching))){cutting=candidate.convexAllowance(stitching,allowance);included=true;assumptions.push(`${p.name}: new uniform convex miter cutting allowance ${allowance} cm around the proposed stitching path.`);}
        if(!cutting){unsupported='CUTTING_GEOMETRY_NOT_SUPPORTED';break;}
        pieces.push({name:p.name,quantity:p.quantity,cuttingPolygon:cutting,...(stitching?{stitchingPolygon:stitching}:{}),...(allowance===undefined?{}:{allowance}),allowancePolicy:'EXPLICIT_CUTTING',...(included?{allowancesIncluded:true}:{}),
          ...(p.grainDirectionDeg===undefined?{}:{grainDirectionDeg:p.grainDirectionDeg}),...(p.grainToleranceDeg===undefined?{}:{grainToleranceDeg:p.grainToleranceDeg}),...(p.allowedRotationsDeg?{allowedRotationsDeg:p.allowedRotationsDeg}:{})});
      }catch(e){unsupported=e.message;break;}
    }
    if(unsupported){attempts.push({scale,status:'UNVERIFIED',reason:unsupported});continue;}
    const demand=pieces.reduce((sum,p)=>sum+area(p.cuttingPolygon)*p.quantity,0);
    if(demand>usable){attempts.push({scale,status:'FAIL',reason:'AREA_PRECHECK_FAILED',demandCm2:demand,usableAreaCm2:usable});continue;}
    const materials=seed.materials.filter(m=>m.requirement.type!=='WOVEN_FABRIC').map(m=>m.requirement.type==='THREAD'?{name:m.name,requirement:m.requirement,threadEstimate:{method:'ALL_STITCHING_PERIMETERS',multiplier:2,tailCm:20}}:m);
    assumptions.push('Thread estimate, where a THREAD target exists: twice all supplied stitching perimeters plus 20 cm tail; an unverified engineering estimate, never stock.');
    const proposed={schemaVersion:candidate.VERSION,name:seed.name+' — compact geometry study',unit:'cm',...(seed.fabricRequirement?{fabricRequirement:seed.fabricRequirement}:{}),pieces,materials,assembly:[],
      instructions:['Use only the independently validated placements for this new alternative.','Cut every listed physical copy; required fabric demand includes the proposed allowances.','Proposed edge finish: sew along each supplied stitching perimeter; check actual material/finish suitability before making anything.','Interlacing, wrapping, joining, tying and load-bearing attachments require a separately engineered and physically tested assembly; no connection is approved here.'],
      limitations:[...seed.limitations,...assumptions,'Creative coverage is PARTIAL: original concept/shape roles remain references, but finished size, wearability, folds, intricate weaving, attachments and physical function are not established.']};
    const result=candidate.construct(proposed,source,concept,{normalizeEquivalent:true});
    attempts.push({scale,status:result.screening?.status||result.status,reason:result.screening?.reason,errors:result.errors,demandCm2:demand,attemptedPlacements:result.screening?.attemptedCandidates||0});
    if(result.errors.length||result.screening?.status!=='LAYOUT_FOUND'||result.screening.validatorEvidence?.geometryStatus!=='PASS')continue;
    const key=fingerprint({policy:POLICY,seed:raw,source,scale,proposed});
    alternatives.push({key,scale,candidate:proposed,result,assumptions,creativeCoverage:'PARTIAL',verdicts:{geometry:'PASS',materials:'UNVERIFIED',stock:'UNVERIFIED',physicalAssembly:'UNVERIFIED'},
      finishingPaths:pieces.flatMap(p=>p.stitchingPolygon?Array.from({length:p.quantity},(_,i)=>({piece:p.name,copy:i+1,edges:p.stitchingPolygon.map((_,j)=>j),direction:'FORWARD',basis:'PROPOSED_EDGE_FINISH_ONLY'})):[])});
    if(alternatives.length>=limits.maxAlternatives)break;
  }
  return {...out,status:alternatives.length?'ALTERNATIVES_FOUND':'NO_LAYOUT_FOUND'};
}
async function execute(runId,conceptId,body){
  const input=inputSchema.parse(body),Run=require('../models/ConceptRun'),Proposal=require('../models/TechnicalProposal'),run=await Run.findById(runId);
  if(!run)throw fail(404,'CONCEPT_RUN_NOT_FOUND');await ensureCurrent(run);
  const concept=run.concepts.find(c=>c.id===conceptId),parent=await Proposal.findById(input.parentProposalId).lean();
  if(!concept||!parent||String(parent.runId)!==run.id||parent.conceptId!==conceptId)throw fail(409,'DERIVATION_PARENT_MISMATCH');
  if(concept.reviewVersion!==input.expectedReviewVersion||parent.reviewVersion!==concept.reviewVersion||parent.provenance.fabricSourceHash!==run.sourceSnapshot.hash)throw fail(409,'CURRENT_SOURCE_AND_REVIEW_REQUIRED');
  if(concept.reviews.at(-1)?.review.decision!=='APPROVED_FOR_DRAFTING')throw fail(409,'CONCEPT_APPROVAL_REQUIRED');
  const engine=input.constructionMethod!=='SHAPE_STUDY'?require('./constructionPlanner'):module.exports;
  const keyBase={parentId:String(parent._id),sourceHash:run.sourceSnapshot.hash,reviewVersion:concept.reviewVersion,engine:engine.POLICY,alternativeKey:input.alternativeKey};
  if(input.action==='SELECT'){
    if(!input.alternativeKey||input.acceptCreativeLimitations!==true)throw fail(400,'EXPLICIT_ALTERNATIVE_SELECTION_REQUIRED');
    const existing=await Proposal.findOne({runId:run._id,conceptId,'provenance.derivation.key':fingerprint(keyBase)});if(existing)return {proposal:existing,replayed:true,manufacturingVerified:false};
  }
  if((concept.technicalVersion||0)!==input.expectedTechnicalVersion)throw fail(409,'TECHNICAL_VERSION_CONFLICT');
  let raw;try{raw=parent.origin==='MODEL_OUTPUT'?JSON.parse(parent.originalInput.rawProposalText):parent.provenance.derivation?.candidate;}catch{throw fail(422,'CANDIDATE_INTENT_UNAVAILABLE');}
  if(!raw)throw fail(422,'CANDIDATE_INTENT_UNAVAILABLE');
  const result=engine.plan(raw,{id:run.sources[0].id,...run.sourceSnapshot},concept.assessment.proposal,input.constructionMethod==='COIN_POUCH_SNAP_FLAP'?{pouch:true}:input.constructionMethod==='TWO_PANEL_SLEEVE'&&raw?.schemaVersion===require('./constructionPlanner').VERSION?{intent:raw}:input.limits);
  if(input.action==='EXPLORE')return {...result,parentProposalId:input.parentProposalId,sourceHash:run.sourceSnapshot.hash,reviewVersion:concept.reviewVersion};
  const selected=result.alternatives.find(a=>a.key===input.alternativeKey);if(!selected)throw fail(409,'ALTERNATIVE_NOT_CURRENT_OR_SUPPORTED');
  const derivation={...keyBase,key:fingerprint(keyBase),parentProposalId:String(parent._id),parentInputSha256:parent.provenance.inputSha256,parentRawProposalSha256:parent.provenance.rawProposalSha256,
    engine:engine.POLICY,policy:candidate.POLICY,candidate:selected.candidate,transformations:selected.result.transformations,assumptions:selected.assumptions,creativeCoverage:selected.creativeCoverage,finishingPaths:selected.finishingPaths,explicitlySelected:true,...(selected.intent?{constructionIntent:selected.intent}:{} )};
  const proposal=await require('./technicalFlow').create(runId,conceptId,{expectedReviewVersion:input.expectedReviewVersion,expectedTechnicalVersion:input.expectedTechnicalVersion,origin:'ENGINE_DERIVED',sourceLabel:input.constructionMethod!=='SHAPE_STUDY'?'ENGINE_DERIVED / EXPLICITLY_SELECTED_CONSTRUCTION_ALTERNATIVE':'ENGINE_DERIVED / EXPLICITLY_SELECTED_GEOMETRY_STUDY',proposal:selected.result.proposal},{derivation,construction:selected.result});
  return {proposal,replayed:false,manufacturingVerified:false};
}
module.exports={plan,execute,POLICY,inputSchema};
