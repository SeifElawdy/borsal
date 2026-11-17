const {z}=require('zod');
const {createHash}=require('crypto');
const {creativeConceptSchema,reviewSchema}=require('./schema');
const {draft}=require('../technical-drafting/draft');
const {fingerprint}=require('../ai-pattern-proposals/adapter');
const {diagnoseOutput}=require('../design-language/ai-spike/harness');
const {GENERATION_PARAMETERS}=require('../design-language/ai-spike/provider');
const fixture=require('../pattern-feasibility/synthetic-fabric.json');
const {area,validatePolygon}=require('../../src/geometry/polygon');
const sourceSchema=z.array(z.object({id:z.string().regex(/^[a-z][a-z0-9-]*$/),path:z.string().min(1),data:z.unknown()}).strict()).min(1);
const rawHash=text=>createHash('sha256').update(text).digest('hex');
const sourceRecords=()=>[{id:'burgundy-scrap',path:'experiments/pattern-feasibility/synthetic-fabric.json',data:structuredClone(fixture)}];
function messages(sources=sourceRecords()){
  return [{role:'system',content:'Return one JSON object, no Markdown: {schemaVersion:"borsal.creative-concept/0.1",id:ID,productIdea:{name:TEXT,description:TEXT},intendedUse:TEXT,distinctiveFeatures:[{id:ID,description:TEXT}],sourceReferences:[ID],constraints:[TEXT],unresolvedRequirements:[{id:ID,description:TEXT,neededInformation:[TEXT]}]}. ID is lowercase ^[a-z][a-z0-9-]*$; TEXT is nonempty. Every listed array is nonempty, with unique IDs/references. Use known source IDs only. Propose ONE specific original useful small fabric-appropriate product with distinctive creative features; no fixed product or bag template. This is a concept only: no cutting polygons, coordinates, dimensions, quantities, stock, fabricated material properties, pattern instructions or feasibility/approval claims. Known facts are only the supplied synthetic geometry/provenance and burgundy appearance label. All physical accuracy, fiber, weave, weight, grain, strength, stock and construction suitability are UNKNOWN. Preserve those limits and unresolved design requirements. The human must review; never emit a review decision.'},
    {role:'user',content:JSON.stringify({brief:'Invent a distinctive small fabric-based product idea using one synthetic burgundy scrap as context. Explain its use and creative features; do not invent measurements or claim fit.',sources:sourceSchema.parse(sources).map(s=>({id:s.id,path:s.path,geometry:s.data,areaCm2:validatePolygon(s.data?.polygonCm).valid?area(s.data.polygonCm):null})),physicalAccuracy:'UNVERIFIED'})}];
}
function assess(rawText,{sources=sourceRecords()}={}){
  const out={schemaVersion:'borsal.concept-review-result/0.1',status:'REJECTED',verdict:'FAIL',schemaValid:false,manufacturingVerified:false,
    rawText,proposal:null,provenance:null,diagnostics:null,errors:[],missingRequirements:[],review:null,reviewGate:'PENDING_REVIEW',handoff:null};
  const checked=sourceSchema.safeParse(sources);
  if(typeof rawText!=='string'||!checked.success){out.errors.push({code:'INVALID_INTAKE'});return out;}
  const ids=checked.data.map(s=>s.id);if(new Set(ids).size!==ids.length){out.errors.push({code:'DUPLICATE_SOURCE_ID'});return out;}
  out.provenance={proposalSha256:rawHash(rawText),hashBasis:'Raw response UTF-8 bytes; source data hashes use JSON.stringify',sources:checked.data.map(s=>({...structuredClone(s),sha256:fingerprint(s.data)})),authorship:'NOT_INDEPENDENTLY_VERIFIED'};
  out.diagnostics=diagnoseOutput(rawText);
  try{out.proposal=JSON.parse(rawText);}catch{out.errors.push({code:'INVALID_JSON'});return out;}
  const parsed=creativeConceptSchema.safeParse(out.proposal);
  if(!parsed.success){
    for(const issue of parsed.error.issues){const actual=issue.path.reduce((v,k)=>v?.[k],out.proposal);if(actual===undefined&&issue.code!=='custom'&&issue.code!=='unrecognized_keys')out.missingRequirements.push({code:'CONCEPT_FIELD_REQUIRED',path:issue.path,message:issue.message});else out.errors.push(issue);}
    if(!out.errors.length){out.status='CONCEPT_ONLY';out.verdict='UNVERIFIED';out.reviewGate='INCOMPLETE';}return out;
  }
  for(const ref of parsed.data.sourceReferences)if(!ids.includes(ref))out.errors.push({code:'UNKNOWN_SOURCE_REFERENCE',sourceId:ref});
  if(out.errors.length)return out;
  out.schemaValid=true;out.status='CONCEPT_ONLY';out.verdict='UNVERIFIED';return out;
}
function reviewConcept(rawText,decision,options={}){
  const out=assess(rawText,options),parsed=reviewSchema.safeParse(decision);
  if(!parsed.success){out.errors.push({code:'INVALID_REVIEW',issues:parsed.error.issues});out.status='REJECTED';out.verdict='FAIL';out.reviewGate='BLOCKED';return out;}
  out.review={snapshot:structuredClone(decision),sha256:fingerprint(decision),reviewerIdentity:'DECLARED_NOT_AUTHENTICATED'};
  const expected=Object.fromEntries((out.provenance?.sources||[]).map(s=>[s.id,s.sha256])),actual=parsed.data.sourceHashes;
  const stale=parsed.data.proposalSha256!==out.provenance?.proposalSha256||Object.keys(actual).length!==Object.keys(expected).length||Object.keys(expected).some(id=>actual[id]!==expected[id]);
  if(!out.schemaValid||stale){out.errors.push({code:stale?'STALE_REVIEW':'CONCEPT_NOT_REVIEWABLE'});out.reviewGate='BLOCKED';out.status='REJECTED';out.verdict='FAIL';return out;}
  out.reviewGate=parsed.data.decision;
  if(parsed.data.decision==='REJECTED'){out.status='REJECTED';out.verdict='FAIL';}
  return out;
}
function handoff(rawText,decision,{design,context,...options}={}){
  const out=reviewConcept(rawText,decision,options);
  if(out.reviewGate!=='APPROVED_FOR_DRAFTING')return out;
  if(!decision.draftingBrief){out.missingRequirements.push({code:'REVIEWER_AUTHORED_DRAFTING_BRIEF_REQUIRED'});return out;}
  // Existing 5B manual-concept contract is a HUMAN-authored review brief. The model
  // proposal is kept separately; it is never relabeled as human-authored content.
  const request=structuredClone({schemaVersion:'borsal.technical-draft/0.1',sourceConcept:{path:'concept-review:'+out.review.sha256+'#reviewer-drafting-brief',data:decision.draftingBrief},...(design!==undefined?{design}:{}),...(context!==undefined?{context}:{})});
  out.handoff={request,drafting:draft(request),sourceProposalSha256:out.provenance.proposalSha256,reviewSha256:out.review.sha256,unresolvedCreativeRequirements:structuredClone(out.proposal.unresolvedRequirements)};
  out.status=out.handoff.drafting.status;out.verdict=out.handoff.drafting.verdict;return out;
}
async function generateConcept({provider,sources=sourceRecords()}){
  // This phase intentionally has no live execution path or budget/campaign writes.
  if(provider.mode!=='MOCK')throw Error('LIVE_GENERATION_DISABLED');
  const prompt=messages(sources);
  try{const response=await provider.generate(prompt);return {mode:'MOCK',model:provider.model,requests:1,liveRequests:0,repairs:0,generationParameters:GENERATION_PARAMETERS,response:structuredClone(response),assessment:assess(response.text,{sources})};}
  catch{ return {mode:'MOCK',requests:1,liveRequests:0,repairs:0,status:'PROVIDER_FAILED'}; }
}
module.exports={sourceRecords,messages,assess,reviewConcept,handoff,generateConcept};
