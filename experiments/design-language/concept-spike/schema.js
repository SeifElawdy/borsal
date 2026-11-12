// Concept intent only: no cutting geometry, quantities, persistence or approval.
const { z } = require('zod');
const VERSION = 'borsal.concept/0.1';
const text = z.string().trim().min(1);
const id = z.string().regex(/^[a-z][a-z0-9-]*$/);
const object = shape => z.object(shape).strict();
const conceptSchema = object({
  schemaVersion: z.literal(VERSION), id,
  provenance: object({ campaignId: text, attempt: z.literal('initial'), responseSha256: text.regex(/^[a-f0-9]{64}$/), extraction: z.literal('OFFLINE_MANUAL'), humanReview: z.literal('PENDING') }),
  originalBrief: object({ id, text, requirements: z.array(text).min(1) }),
  category: z.enum(['SHOULDER_BAG', 'TOTE_BAG']),
  creative: object({ shapeIntent: text, visualIntent: z.array(text).min(1), modelDescription: z.string() }),
  // Each original requirement survives even when absent from the generated proposal.
  requirements: z.array(object({ id, briefRequirement: text, intent: text, modelEvidence: text, coverage: z.enum(['MISSING', 'PARTIAL', 'CLAIMED']), unresolved: z.array(text).min(1) })).min(1),
  materials: z.array(object({ id, type: text, source: z.enum(['SCRAP', 'STOCK']), specificationIntent: text, availability: z.literal('NOT_CHECKED') })).min(1),
  scrapCount: z.literal(1),
  elements: z.array(object({ id, intent: text })).min(1),
  connections: z.array(object({ id, from: id, to: id, intent: text, status: z.literal('UNVERIFIED'), missingInformation: z.array(text).min(1) })).min(1),
  dimensions: z.array(object({ name: text, unit: z.literal('cm'), status: z.literal('UNRESOLVED'), missingInformation: text })).min(1),
  limitations: z.array(object({ feature: text, status: z.enum(['UNRESOLVED', 'UNSUPPORTED']), reason: text, missingInformation: z.array(text).min(1) })).min(1),
}).superRefine((c,ctx)=>{
  const issue = message => ctx.addIssue({code:'custom',message});
  for(const key of ['requirements','materials','elements','connections']) {
    const ids=c[key].map(x=>x.id); if(new Set(ids).size!==ids.length) issue('Duplicate '+key+' ID');
  }
  const elements=new Set(c.elements.map(e=>e.id));
  for(const r of c.connections) if(!elements.has(r.from)||!elements.has(r.to)) issue('Unknown connection element');
  const actual=c.requirements.map(r=>r.briefRequirement);
  if(actual.length!==c.originalBrief.requirements.length || c.originalBrief.requirements.some((r,i)=>r!==actual[i])) issue('Original requirements must be preserved in order without omissions');
});
// A review queue, deliberately NOT an automatic approval gate or geometry validator.
const REQUIRED_CHECKS = Object.freeze(['GEOMETRY_COORDINATES','CLOSED_CUTTING_OUTLINES','REFERENCES','ACCESSORY_LOCATIONS','STRAP_CLOSURE_CONNECTIONS','MATERIAL_BOM_ALLOCATION','ASSEMBLY_OPERATIONS']);
function technicalReviewQueue(concept) {
  conceptSchema.parse(concept);
  return { status:'NOT_APPROVED', manufacturingVerified:false, checks:REQUIRED_CHECKS.map(id=>({id,status:'UNVERIFIED'})) };
}
module.exports = { VERSION, conceptSchema, REQUIRED_CHECKS, technicalReviewQueue };
