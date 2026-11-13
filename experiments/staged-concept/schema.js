const {z}=require('zod');
const {conceptSchema}=require('../design-language/concept-spike/schema');
const {manualConceptSchema}=require('../technical-drafting/draft');
const object=shape=>z.object(shape).strict(),id=conceptSchema.shape.id,text=z.string().trim().min(1),hash=z.string().regex(/^[a-f0-9]{64}$/);
// Creative intent only: no geometry, numerical measurements, BOM or stock fields.
const creativeConceptSchema=object({schemaVersion:z.literal('borsal.creative-concept/0.1'),id,
  productIdea:object({name:text,description:text}),intendedUse:text,
  distinctiveFeatures:z.array(object({id,description:text})).min(1),sourceReferences:z.array(id).min(1),
  constraints:z.array(text).min(1),unresolvedRequirements:z.array(object({id,description:text,neededInformation:z.array(text).min(1)})).min(1),
}).superRefine((r,ctx)=>{
  for(const key of ['distinctiveFeatures','unresolvedRequirements'])if(new Set(r[key].map(v=>v.id)).size!==r[key].length)ctx.addIssue({code:'custom',path:[key],message:'Duplicate identifier'});
  if(new Set(r.sourceReferences).size!==r.sourceReferences.length)ctx.addIssue({code:'custom',path:['sourceReferences'],message:'Duplicate source reference'});
});
const reviewSchema=object({decision:z.enum(['APPROVED_FOR_DRAFTING','REVISE','REJECTED']),reviewer:text,rationale:text,
  proposalSha256:hash,sourceHashes:z.record(id,hash),
  // Explicitly authored by the reviewer, not inferred from model prose or mislabeled AI authorship.
  draftingBrief:manualConceptSchema.optional(),
});
module.exports={creativeConceptSchema,reviewSchema};
