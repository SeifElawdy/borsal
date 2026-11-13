// Explicit data adapter only: no pattern generation, offsets, stock selection or approval.
const {z}=require('zod');
const {createHash}=require('crypto');
const {designSchema}=require('../design-language/schema');
const {conceptSchema,technicalReviewQueue}=require('../design-language/concept-spike/schema');
const {requestSchema:pipelineSchema,runPipeline}=require('../pattern-feasibility/pipeline');
const {precheck}=require('../pattern-feasibility/precheck');
const {validatePolygon,validateWithHoles}=require('../../src/geometry/polygon');
const id=z.string().regex(/^[a-z][a-z0-9-]*$/),text=z.string().min(1),finite=z.number().finite();
const object=shape=>z.object(shape).strict();
const requestSchema=object({schemaVersion:z.literal('borsal.design-bridge/0.1'),
  source:object({kind:z.enum(['CONCEPT','DESIGN']),path:text,data:z.unknown()}),
  context:object({fabric:pipelineSchema.shape.fabric.optional(),stock:pipelineSchema.shape.stock,
    search:pipelineSchema.shape.search,stockBindings:z.record(id,id).default({}),
    instances:z.array(object({id,pieceId:id,copy:z.number().int().positive(),
      cuttingPolygonCm:pipelineSchema.shape.pieces.element.shape.polygonCm,
      allowancesIncluded:z.literal(true),grainToleranceDeg:finite.min(0).max(90).optional(),
      allowedRotationsDeg:pipelineSchema.shape.pieces.element.shape.allowedRotationsDeg})).max(20).default([]),
  }).prefault({}),
});
function bridge(input){
  const out={schemaVersion:'borsal.design-bridge-result/0.1',status:'REJECTED',verdict:'FAIL',manufacturingVerified:false,
    source:null,contextEvidence:null,mapping:[],missingRequirements:[],errors:[],review:null,pipelineInput:null,pipeline:null,
    limitations:['Only explicit straight-edged seam geometry and separately supplied cutting outlines are mapped',
      'Creative intent and physical construction require independent human/engineering review']};
  const error=(code,details={})=>out.errors.push({code,...details});
  const missing=(code,details={})=>out.missingRequirements.push({code,...details});
  const parsed=requestSchema.safeParse(input);
  if(!parsed.success){error('INVALID_BRIDGE_INPUT',{issues:parsed.error.issues});return out;}
  const r=parsed.data,c=r.context;
  out.contextEvidence={snapshot:structuredClone(input.context??{}),sha256:createHash('sha256').update(JSON.stringify(input.context??{})).digest('hex'),hashBasis:'JSON.stringify(input.context ?? {}), UTF-8'};
  if(c.fabric){const valid=validateWithHoles(c.fabric.geometry.polygonCm,c.fabric.geometry.holes);if(!valid.valid)error('INVALID_FABRIC_GEOMETRY',{details:valid.errors});}
  // Snapshot the original payload, including creative intent and source provenance.
  out.source={kind:r.source.kind,path:r.source.path,snapshot:structuredClone(r.source.data),
    sha256:createHash('sha256').update(JSON.stringify(r.source.data)??'undefined').digest('hex'),hashBasis:'JSON.stringify(source.data), UTF-8'};
  const source=(r.source.kind==='CONCEPT'?conceptSchema:designSchema).safeParse(r.source.data);
  if(!source.success){error('INVALID_SOURCE',{issues:source.error.issues});return out;}
  if(out.errors.length)return out;
  if(r.source.kind==='CONCEPT'){
    const concept=source.data;out.review=technicalReviewQueue(concept);
    missing('TECHNICAL_DESIGN_REQUIRED',{details:'Supply a separately authored borsal.design/0.1 technical proposal; concept prose cannot generate geometry or quantities'});
    for(const req of concept.requirements)missing('CREATIVE_REQUIREMENT_UNVERIFIED',{requirementId:req.id,intent:req.intent,details:req.unresolved});
    for(const connection of concept.connections)missing('CONNECTION_UNVERIFIED',{connectionId:connection.id,details:connection.missingInformation});
    out.status='CONCEPT_ONLY';out.verdict='UNVERIFIED';return out;
  }
  const d=source.data,t=d.technical,pieces=new Map(t.patternPieces.map(p=>[p.id,p])),bom=new Map(t.bom.map(b=>[b.id,b]));
  const seams=new Map(),instances=new Map(),instanceIds=new Set();
  for(const p of t.patternPieces){
    if(p.outline.segments.some(s=>s.type!=='LINE')){missing('EXPLICIT_CURVE_REPRESENTATION_REQUIRED',{pieceId:p.id,details:'No curve flattening or edge remapping is implemented'});continue;}
    // Convert explicit closure notation to an implicit polygon ring; do not repair coordinates.
    const polygon=[p.outline.start,...p.outline.segments.slice(0,-1).map(s=>s.to)],validation=validatePolygon(polygon);
    if(!validation.valid)error('INVALID_SOURCE_SEAM_POLYGON',{pieceId:p.id,details:validation.errors});
    else seams.set(p.id,polygon);
    if(bom.get(p.bomId).source.kind!=='SCRAP')missing('STOCK_CUTTING_NOT_SUPPORTED',{pieceId:p.id,details:'The 4D nesting stage supports pieces cut from one supplied scrap only'});
  }
  for(const instance of c.instances){
    const p=pieces.get(instance.pieceId),key=instance.pieceId+':'+instance.copy;
    if(!p||instance.copy>p.cutCount)error('INVALID_INSTANCE_REFERENCE',{instanceId:instance.id,pieceId:instance.pieceId,copy:instance.copy});
    if(instances.has(key)||instanceIds.has(instance.id))error('DUPLICATE_INSTANCE',{instanceId:instance.id,key});
    instances.set(key,instance);instanceIds.add(instance.id);
    const valid=validatePolygon(instance.cuttingPolygonCm);if(!valid.valid)error('INVALID_CUTTING_POLYGON',{instanceId:instance.id,details:valid.errors});
    if(instance.grainToleranceDeg===undefined)missing('GRAIN_TOLERANCE_REQUIRED',{instanceId:instance.id});
  }
  for(const [bomId]of Object.entries(c.stockBindings))if(bom.get(bomId)?.source.kind!=='STOCK')error('INVALID_STOCK_BINDING',{bomId});
  const expected=t.patternPieces.reduce((sum,p)=>sum+p.cutCount,0);
  if(expected>20)missing('INSTANCE_LIMIT_EXCEEDED',{expected,limit:20});
  // Avoid expanding unbounded source cutCount; an unsupported size cannot trigger a large loop.
  else for(const p of t.patternPieces)for(let copy=1;copy<=p.cutCount;copy++)if(!instances.has(p.id+':'+copy))missing('EXPLICIT_CUTTING_INSTANCE_REQUIRED',{pieceId:p.id,copy});
  if(!c.fabric)missing('CONFIRMED_FABRIC_REQUIRED');
  else{
    if(c.fabric.geometry.confirmed===false)error('FABRIC_NOT_CONFIRMED');
    else if(c.fabric.geometry.confirmed!==true)missing('CONFIRMED_FABRIC_REQUIRED');
    if(c.fabric.geometry.version===undefined)missing('FABRIC_REVISION_REQUIRED');
    if(c.fabric.grainDirectionDeg===undefined)missing('FABRIC_GRAIN_REQUIRED');
    if(!c.fabric.material)missing('FABRIC_MATERIAL_SPECIFICATIONS_REQUIRED');
    if(c.fabric.id!==t.scrapSources[0].id)error('SCRAP_ID_MISMATCH',{sourceScrapId:t.scrapSources[0].id,fabricId:c.fabric.id});
  }
  const stockBom=t.bom.filter(b=>b.source.kind==='STOCK');
  if(stockBom.length&&!c.stock)missing('EXPLICIT_STOCK_SNAPSHOT_REQUIRED');
  for(const b of stockBom)if(!c.stockBindings[b.id])missing('STOCK_BINDING_REQUIRED',{bomId:b.id});
  // Reference validation and polygon validation above run even when technical data is incomplete.
  if(out.errors.length)return out;
  if(!c.fabric||expected>20||out.missingRequirements.some(m=>['EXPLICIT_CURVE_REPRESENTATION_REQUIRED','EXPLICIT_CUTTING_INSTANCE_REQUIRED','STOCK_CUTTING_NOT_SUPPORTED'].includes(m.code))){out.status='CONCEPT_ONLY';out.verdict='UNVERIFIED';return out;}
  const lookup=(pieceId,copy)=>instances.get(pieceId+':'+copy);
  const ref=a=>({...a,pieceId:lookup(a.pieceId,a.copy).id,copy:1});
  const list=[...instances.values()];
  const mapped={schemaVersion:'borsal.feasibility-pipeline/0.1',unit:'cm',fabric:c.fabric,search:c.search,stock:c.stock,
    pieces:list.map(i=>({id:i.id,polygonCm:i.cuttingPolygonCm,outlineBasis:'CUTTING',seamAllowanceStatus:'INCLUDED',
      grain:{localDirectionDeg:pieces.get(i.pieceId).grainDirectionDeg,toleranceDeg:i.grainToleranceDeg},allowedRotationsDeg:i.allowedRotationsDeg})),
    bom:t.bom.map(b=>({...b,...(b.source.kind==='STOCK'?{stockId:c.stockBindings[b.id]}:{})})),
    pattern:{pieces:list.map(i=>({id:i.id,bomId:pieces.get(i.pieceId).bomId,stitchingPolygonCm:seams.get(i.pieceId),
      edges:pieces.get(i.pieceId).outline.segments.map((s,segmentIndex)=>({id:s.id,basis:'STITCHING',segmentIndex}))})),
      components:t.components.map(comp=>({id:comp.id,role:comp.role,pieceIds:list.filter(i=>comp.pieceIds.includes(i.pieceId)).map(i=>i.id),bomIds:[...new Set(comp.pieceIds.map(p=>pieces.get(p).bomId))]})),
      assembly:t.assembly.map(a=>a.type==='SEAM'?{...a,sides:a.sides.map(ref)}:a.type==='ATTACH'?{...a,from:ref(a.from),to:ref(a.to)}:{...a,anchors:a.anchors.map(ref)}),connections:[],
      // Feature intent is not proof of a technical strap/closure/fold implementation.
      physicalClaims:t.features.filter(f=>f.kind!=='BODY').map(f=>f.id+': '+f.kind+': '+f.intent),
      unsupportedClaims:d.limitations.map(l=>({id:l.id,description:t.features.find(f=>f.id===l.featureId).intent,reason:l.reason,missingInformation:l.missingInformation})),
    },provenance:{label:'EXPLICIT_DESIGN_BRIDGE_MAPPING',source:r.source.path,assumptions:'Source SHA-256 '+out.source.sha256+'; cutting outlines, stock and material declarations supplied offline, not engineering approval'}};
  // Folds remain visible as unsupported physical requirements, not silently omitted.
  for(const p of t.patternPieces)for(const fold of p.folds)mapped.pattern.physicalClaims.push(p.id+'.'+fold.id+': '+fold.type+' fold; 3D construction UNVERIFIED');
  out.mapping=list.map(i=>({sourcePieceId:i.pieceId,sourceCopy:i.copy,instanceId:i.id,edgeIds:pieces.get(i.pieceId).outline.segments.map(s=>s.id),closureConversion:'EXPLICIT_LAST_ENDPOINT_TO_IMPLICIT_RING',coordinateFrame:'UNCHANGED_PIECE_LOCAL_CM'}));
  const check=precheck({schemaVersion:'borsal.material-precheck/0.1',unit:'cm',fabric:mapped.fabric,
    nesting:{request:{schemaVersion:'borsal.nesting/0.1',unit:'cm',fabric:{polygonCm:mapped.fabric.geometry.polygonCm,holes:mapped.fabric.geometry.holes,grainDirectionDeg:mapped.fabric.grainDirectionDeg},pieces:mapped.pieces,search:mapped.search},result:{status:'NO_LAYOUT_FOUND',placements:[]}},pattern:mapped.pattern,bom:mapped.bom,stock:mapped.stock});
  // Reject malformed/contradictory technical data before search. Stock shortage and
  // area sufficiency are feasibility outcomes, retained for 4D rather than repaired.
  const malformedMaterial=new Set(['INVALID_MATERIAL_SPECIFICATIONS','BOM_UNIT_INVALID','STOCK_UNIT_INVALID','STOCK_PIECE_QUANTITY_NOT_INTEGER','STOCK_SPECIFICATIONS_MISMATCH','SCRAP_SPECIFICATIONS_MISMATCH']);
  for(const [layer,v]of Object.entries(check.layers))if(v.status==='FAIL')for(const reason of v.reasons){
    if(['input','geometry','allowances','assembly'].includes(layer)||malformedMaterial.has(reason.code))error('CONTRADICTORY_TECHNICAL_DATA',{layer,...reason});
  }
  if(out.errors.length)return out;
  if(out.missingRequirements.length){out.status='CONCEPT_ONLY';out.verdict='UNVERIFIED';return out;}
  out.pipelineInput=mapped;out.pipeline=runPipeline(mapped);out.status='CHECKED';out.verdict=out.pipeline.status;
  return out;
}
module.exports={bridge,requestSchema};
