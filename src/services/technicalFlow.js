const mongoose=require('mongoose'),{createHash}=require('crypto'),{z}=require('zod');
const Run=require('../models/ConceptRun'),Fabric=require('../models/FabricPiece'),Proposal=require('../models/TechnicalProposal');
const {sourceFor,fail}=require('./conceptFlow');
const {handoff}=require('../../experiments/staged-concept/workflow');
const {fingerprint}=require('../../experiments/ai-pattern-proposals/adapter');
const {requestSchema:bridgeSchema}=require('../../experiments/design-feasibility/bridge');
const {requestSchema:draftSchema}=require('../../experiments/technical-drafting/draft');
const {requestSchema:precheckSchema}=require('../../experiments/pattern-feasibility/precheck');
const {geometrySvg}=require('../../experiments/live-pattern-generation/evaluate');
const object=shape=>z.object(shape).strict();
const proposalSchema=object({design:draftSchema.shape.design,context:bridgeSchema.shape.context.unwrap().omit({fabric:true}).optional(),
  fabricMaterialDeclaration:object({basis:z.enum(['SYNTHETIC_FIXTURE','USER_DECLARED_UNVERIFIED']),material:precheckSchema.shape.fabric.shape.material.unwrap()}).optional()});
const inputSchema=object({expectedReviewVersion:z.number().int().min(1),expectedTechnicalVersion:z.number().int().min(0),origin:z.enum(['AUTHORED','MODEL_OUTPUT','DERIVED']),sourceLabel:z.string().trim().min(1),proposal:z.unknown().optional(),rawProposalText:z.string().min(1).optional()}).superRefine((v,c)=>{
  if(v.origin==='MODEL_OUTPUT'&&(v.rawProposalText===undefined||v.proposal!==undefined))c.addIssue({code:'custom',path:['rawProposalText'],message:'MODEL_OUTPUT requires only rawProposalText'});
  if(v.origin==='AUTHORED'&&v.rawProposalText!==undefined)c.addIssue({code:'custom',path:['rawProposalText'],message:'AUTHORED uses proposal, not rawProposalText'});
});
const bytesHash=text=>createHash('sha256').update(text).digest('hex');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function technicalFabric(f,run,declaration){
  const g=f.geometry;
  return {id:run.sources[0].id,geometry:{polygonCm:run.sourceSnapshot.polygonCm,holes:run.sourceSnapshot.holes,
    ...(g?.confirmed?{confirmed:true,version:g.version}:{})},
    ...(f.grainDirectionDeg!==undefined?{grainDirectionDeg:f.grainDirectionDeg}:{}),...(declaration?{material:declaration.material}:{})};
}
function evaluate(input,run,concept,f,review){
  let raw=input.proposal??{};
  if(input.origin==='MODEL_OUTPUT')try{raw=JSON.parse(input.rawProposalText);}catch{return {status:'REJECTED',verdict:'FAIL',errors:[{code:'INVALID_JSON'}],manufacturingVerified:false};}
  if(raw?.schemaVersion===require('./designCandidate').VERSION){const parsed=require('./designCandidate').candidateSchema.safeParse(raw);return parsed.success?{status:'CONCEPT_ONLY',verdict:'UNVERIFIED',errors:[],unresolved:[{code:'DETERMINISTIC_CONSTRUCTION_PENDING'}],manufacturingVerified:false}:{status:'REJECTED',verdict:'FAIL',errors:[{code:'INVALID_CANDIDATE',issues:parsed.error.issues}],manufacturingVerified:false};}
  const parsed=proposalSchema.safeParse(raw);
  if(!parsed.success)return {status:'REJECTED',verdict:'FAIL',errors:[{code:'INVALID_TECHNICAL_ENVELOPE',issues:parsed.error.issues}],manufacturingVerified:false};
  if(raw.design&&raw.design.data===undefined)return {status:'CONCEPT_ONLY',verdict:'UNVERIFIED',errors:[],unresolved:[{code:'EXPLICIT_DESIGN_DATA_REQUIRED'}],manufacturingVerified:false};
  return handoff(concept.rawText,review,{sources:run.sources,...(raw.design?{design:raw.design}:{}),context:{...(raw.context||{}),fabric:technicalFabric(f,run,raw.fabricMaterialDeclaration)}});
}
async function create(runId,conceptId,body,generation=null){
  const input=inputSchema.parse(body);if(input.origin==='DERIVED'&&!generation?.derivation)throw fail(403,'TRUSTED_CONSTRUCTOR_REQUIRED');let saved;
  // All proposal/history writes commit together. Driver retries do not call any AI.
  await mongoose.connection.transaction(async session=>{
    const run=await Run.findById(runId).session(session);if(!run)throw fail(404,'CONCEPT_RUN_NOT_FOUND');
    const concept=run.concepts.find(c=>c.id===conceptId);if(!concept)throw fail(404,'CONCEPT_NOT_FOUND');
    const f=await Fabric.findById(run.fabricId).session(session).lean();if(!f)throw fail(409,'FABRIC_SOURCE_CHANGED');
    let source;try{source=sourceFor(f);}catch{throw fail(409,'FABRIC_SOURCE_CHANGED');}
    if(source.snapshot.hash!==run.sourceSnapshot.hash)throw fail(409,'FABRIC_SOURCE_CHANGED');
    if(concept.reviewVersion!==input.expectedReviewVersion)throw fail(409,'CONCEPT_VERSION_CONFLICT');
    if((concept.technicalVersion||0)!==input.expectedTechnicalVersion)throw fail(409,'TECHNICAL_VERSION_CONFLICT');
    const review=concept.reviews.at(-1)?.review;if(review?.decision!=='APPROVED_FOR_DRAFTING')throw fail(409,'CONCEPT_APPROVAL_REQUIRED');
    if(input.origin==='DERIVED'){const parent=await Proposal.findById(generation.derivation.parentProposalId).session(session).lean();if(!parent||String(parent.runId)!==String(run._id)||parent.conceptId!==conceptId||parent.reviewVersion!==concept.reviewVersion||parent.provenance.fabricSourceHash!==source.snapshot.hash||parent.provenance.inputSha256!==generation.derivation.parentInputSha256)throw fail(409,'DERIVATION_PARENT_MISMATCH');}
    const version=(concept.technicalVersion||0)+1,_id=new mongoose.Types.ObjectId(),assessment=evaluate(input,run,concept,f,review);
    if(generation?.construction?.status==='REJECTED'){assessment.status='REJECTED';assessment.verdict='FAIL';assessment.errors=generation.construction.errors;}
    const provenance={...(generation?.derivation?{derivation:generation.derivation}:{}),fabricId:String(run.fabricId),fabricScrapId:run.sources[0].id,fabricSourceHash:run.sourceSnapshot.hash,
      sourceSnapshot:run.sourceSnapshot,conceptSha256:concept.assessment.provenance.proposalSha256,reviewSha256:fingerprint(review),reviewVersion:concept.reviewVersion,
      inputSha256:fingerprint(body),rawProposalSha256:input.rawProposalText?bytesHash(input.rawProposalText):null,
      materialEvidence:'Explicit declarations only; never verified source properties',origin:input.origin,authorship:input.origin==='DERIVED'?'SYSTEM_DETERMINISTIC_TRANSFORM':'DECLARED_NOT_AUTHENTICATED',physicalAccuracy:'UNVERIFIED',sourceRefresh:run.sourceRefresh??null,...(generation&&!generation.construction?{generation}: {})};
    if(generation?.construction){assessment.constructionPlan={instructions:generation.construction.instructions,unresolved:generation.construction.unresolved,transformations:generation.construction.transformations,manufacturingVerified:false};}
    let svg=assessment.handoff?.drafting.previewSvg||generation?.construction?.previewSvg||null;
    if(svg){if(input.origin==='DERIVED')svg=svg.replaceAll('MANUALLY AUTHORED DRAFT','SYSTEM-DERIVED DESIGN PROPOSAL').replace('Authored technical pattern','System-derived technical pattern');if(input.origin==='MODEL_OUTPUT')svg=svg.replace('MANUALLY AUTHORED DRAFT','IMPORTED MODEL-PROPOSED DRAFT');
      const metadata={proposalId:String(_id),version,...provenance,sourceSnapshot:undefined};
      svg=svg.replace(/(<svg\b[^>]*>)/,match=>match+'\n<metadata id="borsal-proposal-provenance">'+escape(JSON.stringify(metadata))+'</metadata>');}
    const feasibility=assessment.handoff?.drafting.bridge?.pipeline||null;
    const evidence=feasibility?.evidence?.independentValidation;
    let nestingSvg=evidence&&feasibility.evidence.nesting.status==='LAYOUT_FOUND'?geometrySvg(evidence):null;
    // Geometry can be screened independently while source material/stock remain unknown.
    // This never upgrades bridge readiness or the aggregate feasibility verdict.
    if(generation?.construction?.screening){assessment.preliminaryGeometry={label:'PRELIMINARY GEOMETRY ONLY',status:generation.construction.screening.validatorEvidence?.geometryStatus||(generation.construction.screening.reason==='AREA_PRECHECK_FAILED'?'FAIL':'UNVERIFIED'),result:generation.construction.screening,fullReadinessUpgraded:false,manufacturingVerified:false};if(generation.construction.screening.reason==='AREA_PRECHECK_FAILED')assessment.verdict='FAIL';if(generation.construction.screening.status==='LAYOUT_FOUND')nestingSvg=geometrySvg(generation.construction.screening.validatorEvidence).replace('Geometry screening ONLY','PRELIMINARY GEOMETRY ONLY');}
    const cutting=assessment.handoff?.drafting?.cuttingPieces;
    if(!feasibility&&!generation?.construction?.screening&&assessment.status!=='REJECTED'&&cutting?.length){
      const result=require('../../experiments/pattern-feasibility/nesting').nest({schemaVersion:'borsal.nesting/0.1',unit:'cm',
        fabric:{polygonCm:run.sourceSnapshot.polygonCm,holes:run.sourceSnapshot.holes||[],...(f.grainDirectionDeg===undefined?{}:{grainDirectionDeg:f.grainDirectionDeg})},
        pieces:cutting.map(p=>({id:p.id,polygonCm:p.polygonCm,outlineBasis:'CUTTING',seamAllowanceStatus:'INCLUDED',grain:{localDirectionDeg:p.grainDirectionDeg,...(p.grainToleranceDeg==null?{}:{toleranceDeg:p.grainToleranceDeg})}})),
        search:{maxCandidates:5000,maxBacktracks:100}});
      assessment.preliminaryGeometry={label:'PRELIMINARY GEOMETRY ONLY',result,fullReadinessUpgraded:false,manufacturingVerified:false};
      if(result.status==='LAYOUT_FOUND')nestingSvg=geometrySvg(result.validatorEvidence).replace('Geometry screening ONLY','PRELIMINARY GEOMETRY ONLY');
    }
    if(nestingSvg){nestingSvg=nestingSvg.replace('Geometry screening ONLY','Nested layout ONLY - physically UNVERIFIED');
      nestingSvg=nestingSvg.replace(/(<svg\b[^>]*>)/,m=>m+'<metadata>'+escape(JSON.stringify({proposalId:String(_id),version,fabricSourceHash:provenance.fabricSourceHash,reportSha256:fingerprint(feasibility),manufacturingVerified:false}))+'</metadata>');}
    const data={_id,runId:run._id,conceptId,fabricId:run.fabricId,version,reviewVersion:concept.reviewVersion,origin:input.origin,sourceLabel:input.sourceLabel,originalInput:body,provenance,
      status:assessment.status,verdict:assessment.verdict,assessment,feasibility,previewSvg:svg,svgSha256:svg?bytesHash(svg):null,nestingSvg,nestingSvgSha256:nestingSvg?bytesHash(nestingSvg):null,manufacturingVerified:false};
    [saved]=await Proposal.create([data],{session});
    concept.technicalVersion=version;concept.technicalHistory=concept.technicalHistory||[];concept.technicalHistory.push({version,proposalId:_id,reviewVersion:concept.reviewVersion,inputSha256:provenance.inputSha256});
    run.markModified('concepts');await run.save({session});
  });
  return saved;
}
module.exports={create,technicalFabric,inputSchema};
