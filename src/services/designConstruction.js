// Append-only deterministic construction of a prior proposal. Never edits parent evidence.
const {z}=require('zod'),Run=require('../models/ConceptRun'),Proposal=require('../models/TechnicalProposal');
const {fail,ensureCurrent}=require('./conceptFlow'),{fingerprint}=require('../../experiments/ai-pattern-proposals/adapter');
const {designSchema}=require('../../experiments/design-language/schema'),candidate=require('./designCandidate');
const inputSchema=z.object({expectedReviewVersion:z.number().int().positive(),expectedTechnicalVersion:z.number().int().min(0),
  allowancePolicy:z.enum(['UNIFORM_CONVEX_MITER','EXPLICIT_ONLY']).default('EXPLICIT_ONLY'),normalizeEquivalent:z.boolean().default(false)}).strict();
function fromLegacy(raw,policy){
  const d=designSchema.parse(raw.design?.data),t=d.technical,bom=new Map(t.bom.map(b=>[b.id,b]));
  // Existing stock/material declarations are not copied: they are not design requirements.
  const fabric=t.bom.find(b=>b.source.kind==='SCRAP'),names=new Map(t.patternPieces.map(p=>[p.id,p.id]));
  const anchor=a=>({piece:names.get(a.pieceId),copy:a.copy,point:a.point});
  const pieces=t.patternPieces.map(p=>{if(p.outline.segments.some(s=>s.type!=='LINE')||bom.get(p.bomId).source.kind!=='SCRAP')throw fail(422,'UNSUPPORTED_LEGACY_GEOMETRY_REQUIRES_NEW_PROPOSAL');
    const copies=(raw.context?.instances||[]).filter(i=>i.pieceId===p.id);if(copies.some(i=>JSON.stringify(i.cuttingPolygonCm)!==JSON.stringify(copies[0].cuttingPolygonCm)))throw fail(422,'DISTINCT_COPY_OUTLINES_REQUIRE_EXPLICIT_CANDIDATE');
    return {name:p.id,quantity:p.cutCount,stitchingPolygon:[p.outline.start,...p.outline.segments.slice(0,-1).map(s=>s.to)],
      ...(copies.length?{cuttingPolygon:copies[0].cuttingPolygonCm,allowancesIncluded:copies.every(i=>i.allowancesIncluded===true),allowancePolicy:'EXPLICIT_CUTTING'}:policy==='UNIFORM_CONVEX_MITER'?{allowancePolicy:policy}:{}),
      allowance:p.seamAllowanceCm,grainDirectionDeg:p.grainDirectionDeg,...(copies[0]?.grainToleranceDeg===undefined?{}:{grainToleranceDeg:copies[0].grainToleranceDeg}),folds:p.folds.map(({id,...f})=>({...f,allowance:f.allowanceCm,allowanceCm:undefined})).map(({allowanceCm,...f})=>f)};});
  return {schemaVersion:candidate.VERSION,name:d.name,unit:'cm',overallDimensions:t.overallDimensions,fabricRequirement:fabric.material,pieces,
    materials:t.bom.filter(b=>b.source.kind==='STOCK').map(b=>({name:b.id,requirement:b.material,quantity:b.quantity})),
    assembly:t.assembly.map(a=>a.type==='SEAM'?{type:a.type,sides:a.sides.map(s=>({piece:s.pieceId,copy:s.copy,edges:s.edgeIds.map(id=>t.patternPieces.find(p=>p.id===s.pieceId).outline.segments.findIndex(e=>e.id===id)),direction:s.direction})),thread:a.threadBomId,instruction:'Proposed seam '+a.id+'; construction remains unverified'}:a.type==='ATTACH'?{type:a.type,from:anchor(a.from),to:anchor(a.to),thread:a.threadBomId,instruction:'Proposed attachment '+a.id+'; retention remains unverified'}:{type:a.type,material:a.bomId,anchors:a.anchors.map(anchor),instruction:'Proposed accessory installation '+a.id+'; placement is a hypothesis'}),
    instructions:['Cut only from an independently checked layout; supplied product dimensions are design targets, not finished measurements','Follow only explicitly described assembly relationships; missing fold, tie and finish methods require a new proposal or engineering review'],
    limitations:[...d.limitations.flatMap(l=>[l.reason,...l.missingInformation]),'Legacy overall dimensions are preserved targets; the flat pieces do not establish them','Fabric requirements are model-proposed targets, not inspected source properties']};
}
function build(parent,run,concept,policy,normalizeEquivalent=false){let raw;try{raw=parent.origin==='MODEL_OUTPUT'?JSON.parse(parent.originalInput.rawProposalText):parent.originalInput.proposal;}catch{throw fail(422,'INVALID_JSON_REQUIRES_NEW_PROPOSAL');}
  // A construction intent is not a legacy technical design. Never parse its
  // absent design.data, infer cutting geometry, or bypass alternative selection.
  if(raw?.schemaVersion===require('./constructionPlanner').VERSION){
    const intent=require('./constructionPlanner').intentSchema.safeParse(raw);
    if(!intent.success)throw fail(422,'INVALID_CONSTRUCTION_INTENT');
    throw fail(422,intent.data.method==='UNSUPPORTED'?'CONSTRUCTION_METHOD_UNSUPPORTED':'EXPLICIT_CONSTRUCTION_SELECTION_REQUIRED');
  }
  if(raw?.schemaVersion!==candidate.VERSION&&!raw?.design?.data)throw fail(422,'CUTTING_GEOMETRY_REQUIRED');
  if(raw?.schemaVersion!==candidate.VERSION&&raw?.design?.data?.technical?.scrapSources?.[0]?.id!==undefined&&raw.design.data.technical.scrapSources[0].id!==run.sources[0].id)throw fail(409,'LEGACY_SCRAP_REFERENCE_MISMATCH');
  const c=raw?.schemaVersion===candidate.VERSION?raw:fromLegacy(raw,policy);
  const result=candidate.construct(c,{id:run.sources[0].id,...run.sourceSnapshot},concept.assessment.proposal,{normalizeEquivalent});
  return {candidate:c,result};
}
async function create(runId,conceptId,parentId,body){
  const input=inputSchema.parse(body),run=await Run.findById(runId);if(!run)throw fail(404,'CONCEPT_RUN_NOT_FOUND');await ensureCurrent(run);
  const c=run.concepts.find(c=>c.id===conceptId),parent=await Proposal.findById(parentId).lean();if(!c||!parent||String(parent.runId)!==run.id||parent.conceptId!==conceptId)throw fail(409,'DERIVATION_PARENT_MISMATCH');
  if(c.reviewVersion!==input.expectedReviewVersion||parent.reviewVersion!==c.reviewVersion||parent.provenance.fabricSourceHash!==run.sourceSnapshot.hash)throw fail(409,'CURRENT_SOURCE_AND_REVIEW_REQUIRED');
  if(c.reviews.at(-1)?.review.decision!=='APPROVED_FOR_DRAFTING')throw fail(409,'CONCEPT_APPROVAL_REQUIRED');
  const key=fingerprint({parentId:String(parent._id),sourceHash:run.sourceSnapshot.hash,reviewVersion:c.reviewVersion,policy:input.allowancePolicy,constructor:candidate.POLICY,...(input.normalizeEquivalent?{recovery:candidate.RECOVERY_POLICY}:{})});
  const existing=await Proposal.findOne({runId:run._id,conceptId,'provenance.derivation.key':key});if(existing)return {proposal:existing,replayed:true};
  if((c.technicalVersion||0)!==input.expectedTechnicalVersion)throw fail(409,'TECHNICAL_VERSION_CONFLICT');
  const {result,candidate:proposalCandidate}=build(parent,run,c,input.allowancePolicy,input.normalizeEquivalent),derivation={key,parentProposalId:String(parent._id),parentInputSha256:parent.provenance.inputSha256,parentRawProposalSha256:parent.provenance.rawProposalSha256,policy:candidate.POLICY,...(parent.provenance.generation?.designSpecification?{designSpecification:parent.provenance.generation.designSpecification}:{}),...(input.normalizeEquivalent?{recoveryPolicy:candidate.RECOVERY_POLICY}:{}),allowancePolicy:input.allowancePolicy,candidate:proposalCandidate,transformations:result.transformations,unresolved:result.unresolved,instructions:result.instructions};
  const proposal=await require('./technicalFlow').create(runId,conceptId,{expectedReviewVersion:input.expectedReviewVersion,expectedTechnicalVersion:input.expectedTechnicalVersion,origin:'DERIVED',sourceLabel:'SYSTEM_DERIVED / UNVERIFIED_DESIGN_PROPOSAL',proposal:result.proposal||{design:{path:'rejected-candidate'}}},{derivation,construction:result,...(parent.provenance.generation?.designSpecification?{designSpecification:parent.provenance.generation.designSpecification}:parent.provenance.derivation?.designSpecification?{designSpecification:parent.provenance.derivation.designSpecification}:{})});
  return {proposal,replayed:false};
}
module.exports={create,build,fromLegacy,inputSchema};
