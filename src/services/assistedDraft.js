// Explicit human input adapter. No offsets, stock declarations, or source measurements are generated.
const {z}=require('zod'),{designSchema}=require('../../experiments/design-language/schema');
const {validatePolygon}=require('../geometry/polygon'),{fail}=require('./conceptFlow');
const technical=require('./technicalFlow'),Run=require('../models/ConceptRun');
const bridge=require('../../experiments/design-feasibility/bridge').requestSchema;
const object=s=>z.object(s).strict(),id=z.string().regex(/^[a-z][a-z0-9-]*$/),n=z.number().finite(),point=z.tuple([n,n]);
const inputSchema=object({expectedReviewVersion:z.number().int().positive(),expectedTechnicalVersion:z.number().int().min(0),
  name:z.string().trim().min(1).max(100),category:designSchema.shape.category,notes:z.string().trim().min(1).max(3000),
  dimensions:designSchema.shape.technical.shape.overallDimensions.optional(),
  pieces:z.array(object({id,bomId:id,role:designSchema.shape.technical.shape.components.element.shape.role,
    cuttingPolygonCm:z.array(point).min(3).max(100),stitchingPolygonCm:z.array(point).min(3).max(100).optional(),
    cutCount:z.number().int().positive().max(20),seamAllowanceCm:n.min(0).optional(),grainDirectionDeg:n.min(0).lt(180).optional(),
    grainToleranceDeg:n.min(0).max(90).optional(),allowancesIncluded:z.boolean()})).min(1).max(20),
  bom:designSchema.shape.technical.shape.bom.max(30),assembly:designSchema.shape.technical.shape.assembly.max(50),
  sourceDeclaration:object({basis:z.string().trim().min(1),material:designSchema.shape.technical.shape.bom.element.shape.material.options.find(s=>s.shape.type.value==='WOVEN_FABRIC')}).optional(),
  stockDeclaration:object({basis:z.string().trim().min(1),snapshot:bridge.shape.context.unwrap().shape.stock.unwrap(),bindings:z.record(id,id)}).optional(),
});
async function create(runId,conceptId,body){
  const b=inputSchema.parse(body),run=await Run.findById(runId),c=run?.concepts.find(c=>c.id===conceptId);if(!c)throw fail(404,'CONCEPT_NOT_FOUND');
  for(const p of b.pieces)for(const ring of [p.cuttingPolygonCm,p.stitchingPolygonCm].filter(Boolean))if(!validatePolygon(ring).valid)throw fail(400,'INVALID_AUTHORED_POLYGON');
  const data={schemaVersion:'borsal.design/0.1',id:'authored-draft',name:b.name,category:b.category,
    creative:{description:c.assessment.proposal.productIdea.description,aesthetic:c.assessment.proposal.distinctiveFeatures.map(f=>f.description),intendedUse:c.assessment.proposal.intendedUse},
    technical:{dimensionUnit:'cm',evidence:'ILLUSTRATIVE_ONLY',overallDimensions:b.dimensions,scrapSources:[{id:run.sources[0].id}],bom:b.bom,
      components:b.pieces.map(p=>({id:'component-'+p.id,role:p.role,pieceIds:[p.id]})),
      patternPieces:b.pieces.map(p=>({id:p.id,bomId:p.bomId,cutCount:p.cutCount,outlineBasis:'SEAM_LINE',
        ...(p.stitchingPolygonCm?{outline:{start:p.stitchingPolygonCm[0],segments:p.stitchingPolygonCm.map((_,i)=>({id:'edge-'+(i+1),type:'LINE',to:p.stitchingPolygonCm[(i+1)%p.stitchingPolygonCm.length]}))}}:{}),
        seamAllowanceCm:p.seamAllowanceCm,grainDirectionDeg:p.grainDirectionDeg,folds:[]})),assembly:b.assembly,
      features:[{id:'creative-intent',kind:'BODY',intent:b.notes,componentIds:b.pieces.map(p=>'component-'+p.id),bomIds:b.bom.map(m=>m.id)}]},
    limitations:[{id:'unverified-construction',featureId:'creative-intent',status:'PARTIAL',reason:'Human-authored design hypotheses. Legacy category is a context only; no parent product or manufacturing proof is implied.',
      missingInformation:[b.notes,...c.assessment.proposal.unresolvedRequirements.map(r=>r.description),'Independent material, stock and physical construction evidence required',...(b.sourceDeclaration?['User material declaration, not verified evidence: '+b.sourceDeclaration.basis]:[]),...(b.stockDeclaration?['Offline stock declaration, no inventory written: '+b.stockDeclaration.basis]:[])]}]
  };
  const context={instances:b.pieces.flatMap(p=>Array.from({length:p.cutCount},(_,i)=>({id:p.id+'-'+(i+1),pieceId:p.id,copy:i+1,cuttingPolygonCm:p.cuttingPolygonCm,allowancesIncluded:p.allowancesIncluded,...(p.grainToleranceDeg===undefined?{}:{grainToleranceDeg:p.grainToleranceDeg})}))),...(b.stockDeclaration?{stock:b.stockDeclaration.snapshot,stockBindings:b.stockDeclaration.bindings}:{})};
  return technical.create(runId,conceptId,{expectedReviewVersion:b.expectedReviewVersion,expectedTechnicalVersion:b.expectedTechnicalVersion,origin:'AUTHORED',sourceLabel:'Local guided editor / HUMAN_AUTHORED_UNVERIFIED',proposal:{design:{path:'local-guided-editor',data},context,...(b.sourceDeclaration?{fabricMaterialDeclaration:{basis:'USER_DECLARED_UNVERIFIED',material:b.sourceDeclaration.material}}:{})}});
}
module.exports={inputSchema,create};
