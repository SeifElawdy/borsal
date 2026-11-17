// Offline intake for future model output. No inference, repair, defaults or approval.
const {z}=require('zod');
const {createHash}=require('crypto');
const {draft,requestSchema:draftSchema}=require('../technical-drafting/draft');
const object=shape=>z.object(shape).strict(),text=z.string().min(1).refine(v=>v.trim().length>0,'Must not be blank'),hash=z.string().regex(/^[a-f0-9]{64}$/);
const requestSchema=object({schemaVersion:z.literal('borsal.ai-pattern-proposal/0.1'),
  sourceConcept:draftSchema.shape.sourceConcept,
  proposal:object({design:draftSchema.shape.design,context:draftSchema.shape.context}).optional(),
  provenance:object({origin:z.enum(['CONCEPT_ONLY','MANUAL_FIXTURE','SAVED_AI_OUTPUT']),sourcePath:text,
    conceptSha256:hash,proposalSha256:hash,modelId:text.optional(),campaignId:text.optional()}),
}).superRefine((r,ctx)=>{
  if(r.provenance.origin==='SAVED_AI_OUTPUT'){
    for(const k of ['modelId','campaignId'])if(!r.provenance[k])ctx.addIssue({code:'custom',path:['provenance',k],message:'Saved AI attribution requires an explicit '+k});
  }else if(r.provenance.modelId||r.provenance.campaignId)ctx.addIssue({code:'custom',path:['provenance'],message:'Do not attribute a manual/concept-only intake to a new model output'});
  if(r.provenance.origin==='CONCEPT_ONLY'&&r.proposal!==undefined)ctx.addIssue({code:'custom',path:['proposal'],message:'CONCEPT_ONLY origin must not claim a supplied technical proposal'});
});
// Integrity basis is the exact supplied JSON object, not canonicalized/repaired JSON.
function fingerprint(value){return createHash('sha256').update(JSON.stringify(value)).digest('hex');}
function evaluateProposal(input){
  const out={schemaVersion:'borsal.ai-pattern-proposal-result/0.1',status:'REJECTED',verdict:'FAIL',
    manufacturingVerified:false,liveInferencePerformed:false,provenance:null,sourceSnapshot:null,
    creativeReview:null,errors:[],unresolved:[],draft:null,
    limitations:['Offline proposal intake only; no model performance or manufacturing approval is established',
      'Hashes prove payload consistency only, not authorship, scale, stock availability or truthful creative coverage']};
  const parsed=requestSchema.safeParse(input);
  if(!parsed.success){out.errors.push({code:'INVALID_PROPOSAL_ENVELOPE',issues:parsed.error.issues});return out;}
  const r=parsed.data;
  // Hash raw supplied values before Zod trimming/defaults can alter the evidence.
  try{
    const conceptHash=fingerprint(input.sourceConcept),proposalHash=fingerprint(input.proposal??null);
    if(conceptHash!==r.provenance.conceptSha256)out.errors.push({code:'CONCEPT_HASH_MISMATCH',path:['provenance','conceptSha256']});
    if(proposalHash!==r.provenance.proposalSha256)out.errors.push({code:'PROPOSAL_HASH_MISMATCH',path:['provenance','proposalSha256']});
    out.provenance={...structuredClone(r.provenance),hashBasis:'JSON.stringify(raw sourceConcept / raw proposal ?? null), UTF-8',integrity:out.errors.length?'FAIL':'PASS',authorship:'NOT_INDEPENDENTLY_VERIFIED'};
    out.sourceSnapshot={sourceConcept:structuredClone(input.sourceConcept),proposal:structuredClone(input.proposal??null)};
  }catch(error){out.errors.push({code:'NON_JSON_PROVENANCE_PAYLOAD',message:'Payload cannot be serialized as JSON for integrity checks'});return out;}
  if(out.errors.length)return out;
  const concept=r.sourceConcept.data,brief=concept.schemaVersion==='borsal.manual-concept/0.1'?concept.brief:concept.originalBrief;
  out.creativeReview={status:'UNVERIFIED',originalBrief:structuredClone(brief),
    requirementLedger:structuredClone(concept.requirements??[]),connections:structuredClone(concept.connections??[]),limitations:structuredClone(concept.limitations??[])};
  // Original payloads pass through unchanged; 5B/5A/4D remain the validation authorities.
  const result=draft({schemaVersion:'borsal.technical-draft/0.1',sourceConcept:input.sourceConcept,
    ...(input.proposal?.design!==undefined?{design:input.proposal.design}:{}),
    ...(input.proposal?.context!==undefined?{context:input.proposal.context}:{})});
  out.draft=result;out.status=result.status;out.verdict=result.verdict;
  out.errors=structuredClone(result.errors);out.unresolved=structuredClone(result.unresolved);
  // Pending creative requirements survive even if the technical subset fits.
  for(const req of concept.requirements??[])out.unresolved.push({code:'CREATIVE_REQUIREMENT_UNVERIFIED',requirementId:req.id,coverage:req.coverage,details:structuredClone(req.unresolved)});
  return out;
}
module.exports={evaluateProposal,requestSchema,fingerprint};
