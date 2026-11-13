// Authored geometry only. This workflow never generates offsets, dimensions or stock.
const {z}=require('zod');
const {createHash}=require('crypto');
const {conceptSchema}=require('../design-language/concept-spike/schema');
const {designSchema}=require('../design-language/schema');
const {bridge,requestSchema:bridgeSchema}=require('../design-feasibility/bridge');
const {validatePolygon,validateWithHoles,dimensions,area}=require('../../src/geometry/polygon');
const {renderPreview}=require('./preview');
const object=shape=>z.object(shape).strict(),text=z.string().min(1);
// A manual source has no fictitious model response or campaign provenance.
const manualConceptSchema=object({schemaVersion:z.literal('borsal.manual-concept/0.1'),id:conceptSchema.shape.id,
  authorship:z.literal('HUMAN'),brief:conceptSchema.shape.originalBrief,creative:conceptSchema.shape.creative});
const requestSchema=object({schemaVersion:z.literal('borsal.technical-draft/0.1'),
  sourceConcept:object({path:text,data:z.union([conceptSchema,manualConceptSchema])}),
  design:object({path:text,data:z.unknown()}).optional(),context:z.unknown().optional()});
const snapshot=value=>({snapshot:structuredClone(value),sha256:createHash('sha256').update(JSON.stringify(value)).digest('hex'),hashBasis:'JSON.stringify(value), UTF-8'});
function draft(input){
  const out={schemaVersion:'borsal.technical-draft-result/0.1',status:'REJECTED',verdict:'FAIL',manufacturingVerified:false,
    provenance:null,creativeReview:{status:'UNVERIFIED',requirements:[]},cuttingPieces:[],technicalMetadata:null,
    unresolved:[],errors:[],bridge:null,previewSvg:null,
    limitations:['Illustrative authored draft; not manufacturing approval or a print-validated cutting pattern',
      'Dimensions below are supplied declarations or computed polygon bounding boxes, never independent physical measurements',
      'Creative fidelity, scalar allowance adequacy and assembled construction remain unverified']};
  const parsed=requestSchema.safeParse(input);
  if(!parsed.success){out.errors.push({code:'INVALID_DRAFT_INPUT',issues:parsed.error.issues});return out;}
  const r=parsed.data,concept=r.sourceConcept.data,brief=concept.schemaVersion==='borsal.manual-concept/0.1'?concept.brief:concept.originalBrief;
  out.provenance={concept:{path:r.sourceConcept.path,...snapshot(input.sourceConcept.data)},design:r.design?{path:r.design.path,...snapshot(r.design.data)}:null,context:snapshot(r.context??{})};
  out.creativeReview.requirements=structuredClone(brief.requirements);
  const classify=(issues,value,prefix)=>{
    for(const issue of issues){const actual=issue.path.reduce((v,k)=>v?.[k],value);
      if(actual===undefined&&issue.code!=='custom'&&issue.code!=='unrecognized_keys')out.unresolved.push({code:'EXPLICIT_FIELD_REQUIRED',path:[...prefix,...issue.path],message:issue.message});
      else out.errors.push({code:'INVALID_SUPPLIED_TECHNICAL_DATA',path:[...prefix,...issue.path],issue});
    }
  };
  const context=bridgeSchema.shape.context.safeParse(r.context);
  if(!context.success)classify(context.error.issues,r.context,['context']);
  if(!r.design)out.unresolved.push({code:'EXPLICIT_TECHNICAL_DESIGN_REQUIRED'});
  const design=r.design?designSchema.safeParse(r.design.data):null;
  if(design&&!design.success)classify(design.error.issues,r.design.data,['design','data']);
  if(context.success){
    for(const i of context.data.instances){
      const valid=validatePolygon(i.cuttingPolygonCm);if(!valid.valid)out.errors.push({code:'INVALID_CUTTING_POLYGON',instanceId:i.id,details:valid.errors});
      if(!design?.success&&i.grainToleranceDeg===undefined)out.unresolved.push({code:'GRAIN_TOLERANCE_REQUIRED',instanceId:i.id});
    }
    const f=context.data.fabric;
    if(f){const valid=validateWithHoles(f.geometry.polygonCm,f.geometry.holes);if(!valid.valid)out.errors.push({code:'INVALID_FABRIC_GEOMETRY',details:valid.errors});}
  }
  if(out.errors.length)return out;
  if(!design?.success||!context.success){out.status='CONCEPT_ONLY';out.verdict='UNVERIFIED';return out;}
  // The original bridge is the readiness/validation authority; no substitute layout checks.
  const checked=bridge({schemaVersion:'borsal.design-bridge/0.1',source:{kind:'DESIGN',path:r.design.path,data:r.design.data},context:r.context});
  out.bridge=checked;out.status=checked.status;out.verdict=checked.verdict;
  out.errors.push(...checked.errors);out.unresolved.push(...checked.missingRequirements);
  if(checked.status==='REJECTED')return out;
  const pieces=new Map(design.data.technical.patternPieces.map(p=>[p.id,p]));
  for(const instance of context.data.instances){
    const p=pieces.get(instance.pieceId);
    // Only explicitly supplied valid geometry may be drawn, including on incomplete drafts.
    const validation=validatePolygon(instance.cuttingPolygonCm);
    if(!p||!validation.valid)continue;
    out.cuttingPieces.push({id:instance.id,sourcePieceId:p.id,sourceCopy:instance.copy,unit:'cm',
      polygonCm:structuredClone(instance.cuttingPolygonCm),dimensions:dimensions(instance.cuttingPolygonCm),areaCm2:area(instance.cuttingPolygonCm),
      stitchingOutline:structuredClone(p.outline),seamAllowanceCm:p.seamAllowanceCm,
      allowanceBasis:'EXPLICIT_CUTTING_POLYGON; SCALAR_WIDTH_NOT_INDEPENDENTLY_VERIFIED',
      grainDirectionDeg:p.grainDirectionDeg,grainToleranceDeg:instance.grainToleranceDeg??null});
  }
  out.technicalMetadata={sourceConceptSha256:out.provenance.concept.sha256,sourceDesignSha256:out.provenance.design.sha256,
    authoredDimensions:structuredClone(design.data.technical.overallDimensions),bom:structuredClone(design.data.technical.bom),
    assembly:structuredClone(design.data.technical.assembly),features:structuredClone(design.data.technical.features),limitations:structuredClone(design.data.limitations),
    evidence:design.data.technical.evidence};
  if(out.cuttingPieces.length)out.previewSvg=renderPreview(out);
  return out;
}
module.exports={draft,requestSchema,manualConceptSchema};
