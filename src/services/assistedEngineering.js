// HUMAN input -> existing Blueprint adapter -> existing compiler/constructor.
const {z}=require('zod'),b=require('./blueprint'),identity=require('./designIdentity'),{fail,ensureCurrent}=require('./conceptFlow');
const inputSchema=z.object({kind:z.literal('ENGINEERING'),expectedReviewVersion:z.number().int().positive(),expectedTechnicalVersion:z.number().int().nonnegative(),expectedDesignFingerprint:z.string().regex(/^[a-f0-9]{64}$/).optional(),blueprint:b.schema,confirmed:z.literal(true),acceptCreativeChanges:z.boolean()}).strict();
async function create(project,runId,conceptId,body){
 const input=inputSchema.parse(body),run=await require('../models/ConceptRun').findById(runId),c=run?.concepts.find(c=>c.id===conceptId);if(!c)throw fail(404,'CONCEPT_NOT_FOUND');await ensureCurrent(run);
 if(String(project.fabricId)!==String(run.fabricId))throw fail(409,'PROJECT_SOURCE_MISMATCH');if(c.reviewVersion!==input.expectedReviewVersion||(c.technicalVersion||0)!==input.expectedTechnicalVersion)throw fail(409,'TECHNICAL_VERSION_CONFLICT');if(c.reviews.at(-1)?.review.decision!=='APPROVED_FOR_DRAFTING')throw fail(409,'CONCEPT_APPROVAL_REQUIRED');
 const q=project.selection?.conceptId===conceptId&&project.selection?.proposalId?await require('../models/TechnicalProposal').findById(project.selection.proposalId).lean():null;
 let spec=identity.resolve(project,run,c,q);if(input.expectedDesignFingerprint&&input.expectedDesignFingerprint!==spec.fingerprint)throw fail(409,'DESIGN_VERSION_CHANGED');if(spec.product.closure.kind==='MULTIPLE')throw fail(409,'CLOSURE_SELECTION_REQUIRED');if(spec.product.attachments.length)throw fail(422,'MANDATORY_ATTACHMENTS_REQUIRE_EXPERT_CONSTRUCTION');
 const changed=input.blueprint.closure!==spec.product.closure.kind;
 if(changed&&!input.acceptCreativeChanges)throw fail(409,'EXPLICIT_ALTERNATIVE_SELECTION_REQUIRED');
 spec=await identity.bind(project,run,c,q);
 const view={...spec,product:{...spec.product,closure:{kind:input.blueprint.closure,description:'Explicit human construction choice'}}},expanded=b.expand(input.blueprint,view,'HUMAN');if(expanded.status!=='EXPANDED')throw Object.assign(fail(400,'INVALID_AUTHORED_BLUEPRINT'),{issues:expanded.errors});
 if(changed)expanded.plan.changes=[`Human explicitly selected ${input.blueprint.closure} instead of ${spec.product.closure.description}. Original requirements remain in history; function and physical suitability require human review.`];
 const parent=await require('./technicalFlow').create(runId,conceptId,{expectedReviewVersion:input.expectedReviewVersion,expectedTechnicalVersion:input.expectedTechnicalVersion,origin:'AUTHORED',sourceLabel:'HUMAN / explicitly confirmed assisted engineering',proposal:expanded.plan},{designSpecification:spec,authorship:'HUMAN',humanBlueprint:expanded.metadata});
 const result=await require('./designConstruction').create(runId,conceptId,parent.id,{expectedReviewVersion:input.expectedReviewVersion,expectedTechnicalVersion:parent.version,acceptCreativeChanges:changed,allowancePolicy:'EXPLICIT_ONLY'});
 return result.proposal;
}
module.exports={create,inputSchema};
