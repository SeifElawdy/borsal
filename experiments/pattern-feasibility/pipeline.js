// Offline orchestration only: the existing engines remain the check authorities.
const {z}=require('zod');
const {nest,nestingSchema}=require('./nesting');
const {evaluateLayout,VERSION}=require('./engine');
const {precheck,requestSchema:precheckSchema}=require('./precheck');
const requestSchema=z.object({
  schemaVersion:z.literal('borsal.feasibility-pipeline/0.1'),unit:z.literal('cm'),
  fabric:precheckSchema.shape.fabric,pieces:nestingSchema.shape.pieces,
  search:nestingSchema.shape.search,pattern:precheckSchema.shape.pattern,
  bom:precheckSchema.shape.bom,stock:precheckSchema.shape.stock,
  provenance:z.object({label:z.string().min(1),source:z.string().min(1),assumptions:z.string().min(1)}).strict().optional(),
}).strict();
const combine=layers=>layers.some(l=>l.status==='FAIL')?'FAIL':layers.some(l=>l.status==='UNVERIFIED')?'UNVERIFIED':'PASS';
function runPipeline(input){
  const out={schemaVersion:'borsal.feasibility-pipeline-result/0.1',unit:'cm',status:'FAIL',structuralStatus:'UNVERIFIED',
    layers:{},placements:[],measurements:null,utilization:null,provenance:null,
    evidence:{nesting:null,independentValidation:null,precheck:null},constraints:[],blockers:[],
    globalFeasibility:'NOT_ASSESSED',manufacturingVerified:false,inventoryMutated:false,
    limitations:['Bounded search is incomplete; NO_LAYOUT_FOUND does not prove impossibility',
      'Physical accuracy and engineering evidence are not verified by this prototype',
      'Confirmation, grain, allowances and stock are offline declarations; no approval or reservation']};
  const finish=()=>{
    out.constraints=Object.entries(out.layers).flatMap(([layer,v])=>v.reasons.map(reason=>({layer,status:v.status,...reason})));
    out.blockers=out.constraints.filter(v=>v.status!=='PASS');
    out.structuralStatus=combine(Object.entries(out.layers).filter(([k])=>k!=='physicalEvidence').map(([,v])=>v));
    out.status=combine(Object.values(out.layers));return out;
  };
  // No supplied physical evidence is silently promoted to a verified fact.
  out.layers.physicalEvidence={status:'UNVERIFIED',reasons:[{code:'PHYSICAL_ACCURACY_AND_ENGINEERING_UNVERIFIED'}]};
  const invalid=issues=>{
    out.layers.input={status:'FAIL',reasons:[{code:'INVALID_INPUT',issues}]};
    for(const k of ['nesting','geometry','allowances','grain','materials','assembly','construction'])out.layers[k]={status:'UNVERIFIED',reasons:[{code:'INPUT_NOT_EVALUABLE'}]};
    return finish();
  };
  const parsed=requestSchema.safeParse(input);if(!parsed.success)return invalid(parsed.error.issues);
  const r=parsed.data;
  out.provenance={supplied:r.provenance||null,fabricId:r.fabric.id,geometryVersion:r.fabric.geometry.version??null,
    confirmed:r.fabric.geometry.confirmed??null,physicalAccuracy:'UNVERIFIED',stockBasis:'SUPPLIED_OFFLINE_SNAPSHOT'};
  // Construct the nesting input from ONE fabric record to avoid competing copies.
  const request={schemaVersion:'borsal.nesting/0.1',unit:'cm',
    fabric:{polygonCm:r.fabric.geometry.polygonCm,holes:r.fabric.geometry.holes,grainDirectionDeg:r.fabric.grainDirectionDeg},pieces:r.pieces,search:r.search};
  const makePrecheck=result=>({schemaVersion:'borsal.material-precheck/0.1',unit:'cm',fabric:r.fabric,
    nesting:{request,result},pattern:r.pattern,bom:r.bom,stock:r.stock});
  // Reuse the complete 4C refinements (including unique IDs) before searching.
  const checked=precheckSchema.safeParse(makePrecheck({status:'NO_LAYOUT_FOUND',placements:[]}));
  if(!checked.success)return invalid(checked.error.issues);
  const nesting=nest(request);out.evidence.nesting=nesting;out.utilization=nesting.areaSummary;
  let independent=null;
  if(nesting.status==='LAYOUT_FOUND'){
    const poses=new Map(nesting.placements.map(({id,...placement})=>[id,placement]));
    independent=evaluateLayout({schemaVersion:VERSION,unit:'cm',fabric:request.fabric,
      pieces:r.pieces.map(({allowedRotationsDeg,...p})=>({...p,placement:poses.get(p.id)}))});
    out.evidence.independentValidation=independent;
    out.placements=nesting.placements;
    out.measurements={basis:'SUPPLIED_CM_GEOMETRY_NOT_PHYSICAL_MEASUREMENT',fabric:independent.fabric,
      pieces:independent.pieces.map(p=>({id:p.id,dimensions:p.dimensions,areaCm2:p.areaCm2,placedPolygonCm:p.placedPolygonCm}))};
  }
  // 4C independently checks references, materials and the same proposed layout.
  const checks=precheck(makePrecheck(nesting));out.evidence.precheck=checks;
  out.layers={...out.layers,...checks.layers};
  if(nesting.status==='LAYOUT_FOUND'){
    out.layers.nesting={status:'PASS',reasons:[{code:'COMPLETE_LAYOUT_FOUND'}]};
    if(independent.geometryStatus!=='PASS'||independent.status==='FAIL'){
      out.layers.geometry={status:'FAIL',reasons:[{code:'INDEPENDENT_VALIDATION_FAILED',diagnostics:independent.diagnostics,pieces:independent.pieces}]};
    }
  }else{
    // Only invalid input/geometry or a failed necessary area condition is proven.
    const proven=['INVALID_INPUT','INVALID_FABRIC_OR_PIECE','AREA_PRECHECK_FAILED','FINAL_VALIDATION_FAILED'].includes(nesting.reason);
    out.layers.nesting={status:proven?'FAIL':'UNVERIFIED',reasons:[{code:nesting.reason,globalImpossibilityClaimed:false,diagnostics:nesting.diagnostics}]};
    if(proven)out.layers.geometry={status:'FAIL',reasons:[{code:nesting.reason,scope:'INPUT_OR_NECESSARY_CONDITION_OR_PROPOSED_LAYOUT_ONLY'}]};
  }
  return finish();
}
module.exports={runPipeline,requestSchema};
