// Offline declarations/references/stock precheck. Never approves or mutates inventory.
const {z}=require('zod');
const {designSchema}=require('../design-language/schema');
const {layoutSchema,VERSION,evaluateLayout}=require('./engine');
const {nestingSchema}=require('./nesting');
const {validatePolygon,pointInPolygon,normalizeToCounterClockwise,area}=require('../../src/geometry/polygon');
const technical=designSchema.shape.technical.shape,catalog=technical.bom.element.shape.material;
const knownTypes=new Set(catalog.options.map(o=>o.shape.type.value));
const operationSchema=technical.assembly.element;
const text=z.string().trim().min(1),id=z.string().regex(/^[a-z][a-z0-9-]*$/),num=z.number().finite();
const object=shape=>z.object(shape).strict(),point=z.tuple([num,num]),poly=z.array(point).min(3);
const source=z.discriminatedUnion('kind',technical.bom.element.shape.source.options.map(s=>s.shape.kind.value==='SCRAP'?s.extend({scrapId:text}):s));
const material=object({type:text,specs:z.record(z.string(),z.union([text,num,z.boolean()]))});
const quantity=object({value:num.positive().max(Number.MAX_SAFE_INTEGER),unit:z.enum(['cm','cm2','piece'])});
const patternSchema=object({
  pieces:z.array(object({id,bomId:id,edges:z.array(object({id,basis:z.enum(['CUTTING','STITCHING']),segmentIndex:z.number().int().min(0)})).default([]),stitchingPolygonCm:poly.optional()})),
  components:z.array(object({id,role:text,pieceIds:z.array(id).default([]),bomIds:z.array(id).default([])})),
  assembly:z.array(z.object({id,type:text}).passthrough()),
  connections:z.array(object({id,kind:text,fromComponentId:id,toComponentId:id,assemblyIds:z.array(id),complete:z.boolean().default(false)})).default([]),
  physicalClaims:z.array(text).default([]),
  unsupportedClaims:z.array(object({id,description:text,reason:text,missingInformation:z.array(text).min(1)})).default([]),
});
const requestSchema=object({
  schemaVersion:z.literal('borsal.material-precheck/0.1'),unit:z.literal('cm'),
  fabric:object({id:text,geometry:object({polygonCm:poly,holes:z.array(poly).default([]),confirmed:z.boolean().optional(),version:z.number().int().positive().optional()}),grainDirectionDeg:num.min(0).lt(180).optional(),material:material.optional()}),
  nesting:object({request:nestingSchema,result:z.object({status:z.enum(['LAYOUT_FOUND','NO_LAYOUT_FOUND']),placements:z.array(object({id,translationCm:point,rotationDeg:num}))}).passthrough()}),
  pattern:patternSchema,
  bom:z.array(object({id,source,material,quantity,stockId:id.optional()})).min(1),
  stock:object({complete:z.boolean(),items:z.array(object({id,material,quantity:quantity.extend({value:num.min(0).max(Number.MAX_SAFE_INTEGER)}),availability:z.enum(['AVAILABLE','UNAVAILABLE','UNKNOWN'])}))}).optional(),
}).superRefine((r,ctx)=>{
  for(const [name,items]of [['bom',r.bom],['stock',r.stock?.items||[]],...['pieces','components','assembly','connections','unsupportedClaims'].map(k=>['pattern.'+k,r.pattern[k]])]){
    const seen=new Set();items.forEach((v,i)=>{if(seen.has(v.id))ctx.addIssue({code:'custom',path:[name,i,'id'],message:'Duplicate identifier'});seen.add(v.id);});
  }
});
const EPS=1e-6;
const mod=(v,n)=>((v%n)+n)%n;
const unitFor=type=>['WOVEN_FABRIC','LINING_FABRIC','INTERFACING'].includes(type)?'cm2':['WEBBING','THREAD'].includes(type)?'cm':'piece';
const canonical=m=>JSON.stringify({type:m.type,specs:Object.fromEntries(Object.entries(m.specs).sort(([a],[b])=>a<b?-1:a>b?1:0))});
function sameRing(a,b){if(a.length!==b.length)return false;const x=normalizeToCounterClockwise(a),y=normalizeToCounterClockwise(b);return y.some((_,offset)=>x.every((p,i)=>p.every((v,j)=>Math.abs(v-y[(i+offset)%y.length][j])<=EPS)));}
function sameHoles(a,b){if(a.length!==b.length)return false;const used=new Set();return a.every(h=>{const i=b.findIndex((other,i)=>!used.has(i)&&sameRing(h,other));if(i<0)return false;used.add(i);return true;});}
function onOrInside(p,polygon){
  if(pointInPolygon(p,polygon))return true;
  return polygon.some((a,i)=>{const b=polygon[(i+1)%polygon.length],dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/d)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)<=EPS;});
}
function properCross(a,b,c,d){
  const side=(p,q,r)=>((q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]))/Math.hypot(q[0]-p[0],q[1]-p[1]);
  const opposite=(a,b)=>(a>EPS&&b<-EPS)||(a<-EPS&&b>EPS);
  return opposite(side(a,b,c),side(a,b,d))&&opposite(side(c,d,a),side(c,d,b));
}
const combine=layers=>layers.some(l=>l.status==='FAIL')?'FAIL':layers.some(l=>l.status==='UNVERIFIED')?'UNVERIFIED':'PASS';

function precheck(input){
  const layers=Object.fromEntries(['input','geometry','allowances','grain','materials','assembly','construction'].map(k=>[k,{status:'PASS',reasons:[]}]));
  const mark=(name,status,code,details={})=>{const l=layers[name];l.reasons.push({code,...details});l.status=combine([l,{status}]);};
  const result={schemaVersion:'borsal.material-precheck-result/0.1',status:'FAIL',layers,validatorEvidence:null,stockChecks:[],manufacturingVerified:false,inventoryMutated:false,
    limitations:['Offline confirmation, material and stock declarations are not independently authenticated','No stock reservation/consumption or manufacturing approval','Physical seam, load, closure operation and construction feasibility remain unverified']};
  const parsed=requestSchema.safeParse(input);
  if(!parsed.success){mark('input','FAIL','INVALID_INPUT',{issues:parsed.error.issues});for(const k of Object.keys(layers).filter(k=>k!=='input'))mark(k,'UNVERIFIED','INPUT_NOT_EVALUABLE');return result;}
  const r=parsed.data,req=r.nesting.request,metas=new Map(r.pattern.pieces.map(p=>[p.id,p])),pieces=new Map(req.pieces.map(p=>[p.id,p])),bom=new Map(r.bom.map(b=>[b.id,b])),components=new Map(r.pattern.components.map(c=>[c.id,c]));
  const preflight=evaluateLayout({schemaVersion:VERSION,unit:'cm',fabric:{polygonCm:r.fabric.geometry.polygonCm,holes:r.fabric.geometry.holes},pieces:req.pieces.map(({allowedRotationsDeg,...p})=>({...p,placement:{translationCm:[0,0],rotationDeg:0}}))});
  if(!preflight.fabric||preflight.pieces.some(p=>p.reasons.some(v=>v.code.startsWith('INVALID'))))mark('geometry','FAIL','INVALID_FABRIC_OR_PATTERN',{diagnostics:preflight.diagnostics});
  if(r.fabric.geometry.confirmed===false)mark('geometry','FAIL','FABRIC_NOT_CONFIRMED');
  else if(r.fabric.geometry.confirmed!==true)mark('geometry','UNVERIFIED','CONFIRMATION_NOT_SUPPLIED');
  if(r.fabric.geometry.version===undefined)mark('geometry','UNVERIFIED','FABRIC_REVISION_NOT_SUPPLIED');
  if(!sameRing(r.fabric.geometry.polygonCm,req.fabric.polygonCm)||!sameHoles(r.fabric.geometry.holes,req.fabric.holes))mark('geometry','FAIL','NESTING_FABRIC_MISMATCH');
  if(req.fabric.grainDirectionDeg!==undefined&&r.fabric.grainDirectionDeg!==undefined&&Math.abs(req.fabric.grainDirectionDeg-r.fabric.grainDirectionDeg)>1e-7)mark('grain','FAIL','FABRIC_GRAIN_METADATA_MISMATCH');
  let evidence;
  const positions=new Map(r.nesting.result.placements.map(p=>[p.id,p]));
  if(r.nesting.result.status!=='LAYOUT_FOUND')mark('geometry','UNVERIFIED','NO_COMPLETE_NESTING_RESULT');
  else if(positions.size!==r.nesting.result.placements.length||positions.size!==pieces.size||[...positions.keys()].some(k=>!pieces.has(k)))mark('geometry','FAIL','NESTING_INSTANCE_MISMATCH');
  else{
    const placed=req.pieces.map(({allowedRotationsDeg,...p})=>{const {id,...placement}=positions.get(p.id);const choices=allowedRotationsDeg||req.search?.rotationsDeg||[0,90,180,270];if(!choices.some(a=>{const delta=Math.abs(mod(a,360)-mod(placement.rotationDeg,360));return Math.min(delta,360-delta)<=1e-7;}))mark('geometry','FAIL','ROTATION_NOT_ALLOWED',{pieceId:p.id});return {...p,placement};});
    evidence=evaluateLayout({schemaVersion:VERSION,unit:'cm',fabric:{polygonCm:r.fabric.geometry.polygonCm,holes:r.fabric.geometry.holes,grainDirectionDeg:r.fabric.grainDirectionDeg},pieces:placed});
    result.validatorEvidence=evidence;
    if(evidence.geometryStatus!=='PASS')mark('geometry','FAIL','NESTING_REVALIDATION_FAILED',{diagnostics:evidence.diagnostics,pieces:evidence.pieces.map(p=>({id:p.id,reasons:p.reasons}))});
  }
  for(const p of req.pieces){
    if(p.outlineBasis!=='CUTTING'||p.seamAllowanceStatus!=='INCLUDED')mark('allowances','UNVERIFIED','CUTTING_ALLOWANCES_NOT_ESTABLISHED',{pieceId:p.id});
    const g=evidence?.pieces.find(v=>v.id===p.id)?.grain;
    if(!g)mark('grain','UNVERIFIED','PLACEMENT_GRAIN_NOT_EVALUABLE',{pieceId:p.id});
    else if(g.status!=='PASS')mark('grain',g.status,g.reason,{pieceId:p.id});
    if(!metas.has(p.id)){mark('assembly','UNVERIFIED','PATTERN_METADATA_MISSING',{pieceId:p.id});mark('materials','UNVERIFIED','PATTERN_ALLOCATION_MISSING',{pieceId:p.id});}
  }
  function checkMaterial(m,where){
    if(!knownTypes.has(m.type)){mark('materials','UNVERIFIED','UNSUPPORTED_MATERIAL_TYPE',{where,type:m.type});return false;}
    const valid=catalog.safeParse(m);if(!valid.success)mark('materials','FAIL','INVALID_MATERIAL_SPECIFICATIONS',{where,issues:valid.error.issues});return valid.success;
  }
  const stock=new Map((r.stock?.items||[]).map(s=>[s.id,s])),demand=new Map();let scrapDemand=0;
  if(!r.bom.some(b=>b.source.kind==='SCRAP'))mark('materials','FAIL','SCRAP_BOM_MISSING');
  for(const item of stock.values()){
    checkMaterial(item.material,'stock:'+item.id);
    if(knownTypes.has(item.material.type)&&item.quantity.unit!==unitFor(item.material.type))mark('materials','FAIL','STOCK_UNIT_INVALID',{stockId:item.id});
    if(item.quantity.unit==='piece'&&!Number.isInteger(item.quantity.value))mark('materials','FAIL','STOCK_PIECE_QUANTITY_NOT_INTEGER',{stockId:item.id});
  }
  if(r.fabric.material)checkMaterial(r.fabric.material,'fabric');
  for(const b of r.bom){
    checkMaterial(b.material,'bom:'+b.id);
    if(knownTypes.has(b.material.type)&&b.quantity.unit!==unitFor(b.material.type))mark('materials','FAIL','BOM_UNIT_INVALID',{bomId:b.id,expectedUnit:unitFor(b.material.type)});
    if(b.quantity.unit==='piece'&&!Number.isInteger(b.quantity.value))mark('materials','FAIL','BOM_PIECE_QUANTITY_NOT_INTEGER',{bomId:b.id});
    if(b.source.kind==='STOCK'&&['WOVEN_FABRIC','LINING_FABRIC','INTERFACING'].includes(b.material.type))mark('construction','UNVERIFIED','EXTERNAL_STOCK_CUTTING_NOT_VERIFIED',{bomId:b.id});
    if(b.source.kind==='SCRAP'){
      if(b.source.scrapId!==r.fabric.id)mark('materials','FAIL','SCRAP_REFERENCE_MISMATCH',{bomId:b.id});
      if(b.material.type!=='WOVEN_FABRIC')mark('materials','UNVERIFIED','SCRAP_MATERIAL_NOT_SUPPORTED',{bomId:b.id});
      if(!r.fabric.material)mark('materials','UNVERIFIED','FABRIC_SPECIFICATIONS_MISSING',{bomId:b.id});
      else if(canonical(b.material)!==canonical(r.fabric.material))mark('materials','FAIL','SCRAP_SPECIFICATIONS_MISMATCH',{bomId:b.id});
      if(b.quantity.unit==='cm2')scrapDemand+=b.quantity.value;
    }else if(!b.stockId)mark('materials','UNVERIFIED','STOCK_REFERENCE_MISSING',{bomId:b.id});
    else{
      const s=stock.get(b.stockId);
      if(!s){mark('materials',r.stock?.complete?'FAIL':'UNVERIFIED',r.stock?.complete?'MATERIAL_STOCK_MISSING':'STOCK_DATA_MISSING',{bomId:b.id,stockId:b.stockId});continue;}
      if(canonical(b.material)!==canonical(s.material))mark('materials','FAIL','STOCK_SPECIFICATIONS_MISMATCH',{bomId:b.id,stockId:s.id});
      if(b.quantity.unit!==s.quantity.unit){mark('materials','FAIL','STOCK_UNIT_MISMATCH',{bomId:b.id,stockId:s.id});continue;}
      const group=demand.get(s.id)||{value:0,bomIds:[]};group.value+=b.quantity.value;group.bomIds.push(b.id);demand.set(s.id,group);
    }
  }
  const allocation=new Map();
  for(const m of metas.values()){
    const p=pieces.get(m.id),b=bom.get(m.bomId);
    if(!b){mark('materials','FAIL','UNKNOWN_PATTERN_BOM',{pieceId:m.id,bomId:m.bomId});continue;}
    if(!p){mark('geometry','UNVERIFIED','PATTERN_LAYOUT_NOT_SUPPLIED',{pieceId:m.id});continue;}
    if(b.source.kind!=='SCRAP'||b.source.scrapId!==r.fabric.id)mark('materials','FAIL','NESTED_PATTERN_NOT_FROM_THIS_SCRAP',{pieceId:m.id,bomId:m.bomId});
    if(validatePolygon(p.polygonCm).valid)allocation.set(b.id,(allocation.get(b.id)||0)+area(p.polygonCm));
  }
  for(const [bomId,requiredArea]of allocation)if(bom.get(bomId).quantity.unit==='cm2'&&bom.get(bomId).quantity.value+1e-8<requiredArea)mark('materials','FAIL','SCRAP_QUANTITY_BELOW_PATTERN_AREA',{bomId,requiredAreaCm2:requiredArea});
  const usable=preflight.fabric?.areaCm2;
  if(usable!==undefined&&scrapDemand>usable+1e-8)mark('materials','FAIL','SCRAP_QUANTITY_EXCEEDS_USABLE_AREA',{requiredAreaCm2:scrapDemand,usableAreaCm2:usable});
  for(const [stockId,d]of demand){const s=stock.get(stockId);const status=s.availability==='UNAVAILABLE'||d.value>s.quantity.value+1e-8?'FAIL':s.availability==='UNKNOWN'?'UNVERIFIED':'PASS';result.stockChecks.push({stockId,bomIds:d.bomIds,required:d.value,available:s.quantity.value,unit:s.quantity.unit,status});if(d.value>Number.MAX_SAFE_INTEGER)mark('materials','FAIL','QUANTITY_SUM_OUT_OF_RANGE',{stockId});if(status!=='PASS')mark('materials',status,s.availability==='UNAVAILABLE'?'STOCK_UNAVAILABLE':d.value>s.quantity.value+1e-8?'INSUFFICIENT_STOCK':'STOCK_AVAILABILITY_UNKNOWN',{stockId});}
  const owners=new Map(),edgeMaps=new Map();
  for(const c of components.values()){
    if(!c.pieceIds.length&&!c.bomIds.length)mark('assembly','UNVERIFIED','UNBOUND_COMPONENT',{componentId:c.id});
    for(const pieceId of c.pieceIds){if(!pieces.has(pieceId)&&!metas.has(pieceId))mark('assembly','FAIL','UNKNOWN_COMPONENT_PIECE',{componentId:c.id,pieceId});const list=owners.get(pieceId)||[];list.push(c.id);owners.set(pieceId,list);}
    for(const bomId of c.bomIds)if(!bom.has(bomId))mark('assembly','FAIL','UNKNOWN_COMPONENT_BOM',{componentId:c.id,bomId});
  }
  for(const p of req.pieces){const count=(owners.get(p.id)||[]).length;if(count!==1)mark('assembly',count?'FAIL':'UNVERIFIED',count?'AMBIGUOUS_PATTERN_OWNER':'PATTERN_OWNER_MISSING',{pieceId:p.id});}
  for(const m of metas.values()){
    const p=pieces.get(m.id),edgeMap=new Map();edgeMaps.set(m.id,edgeMap);
    if(m.stitchingPolygonCm){
      if(!validatePolygon(m.stitchingPolygonCm).valid)mark('allowances','FAIL','INVALID_STITCHING_POLYGON',{pieceId:m.id});
      else if(p&&validatePolygon(p.polygonCm).valid){
        const crosses=m.stitchingPolygonCm.some((a,i)=>p.polygonCm.some((c,j)=>properCross(a,m.stitchingPolygonCm[(i+1)%m.stitchingPolygonCm.length],c,p.polygonCm[(j+1)%p.polygonCm.length])));
        const samples=m.stitchingPolygonCm.flatMap((a,i)=>{const b=m.stitchingPolygonCm[(i+1)%m.stitchingPolygonCm.length];return [a,[(a[0]+b[0])/2,(a[1]+b[1])/2]];});
        if(crosses||samples.some(v=>!onOrInside(v,p.polygonCm)))mark('allowances','FAIL','STITCHING_LINE_OUTSIDE_CUTTING_OUTLINE',{pieceId:m.id});
        else{
          const check=evaluateLayout({schemaVersion:VERSION,unit:'cm',fabric:{polygonCm:p.polygonCm},pieces:[{id:m.id,polygonCm:m.stitchingPolygonCm,placement:{translationCm:[0,0],rotationDeg:0}}]});
          if(check.geometryStatus!=='PASS')mark('allowances','UNVERIFIED','STITCHING_CONTAINMENT_NOT_ESTABLISHED',{pieceId:m.id});
        }
      }
    }
    for(const e of m.edges){
      if(edgeMap.has(e.id))mark('assembly','FAIL','DUPLICATE_EDGE_ID',{pieceId:m.id,edgeId:e.id});edgeMap.set(e.id,e);
      const polygon=e.basis==='CUTTING'?p?.polygonCm:m.stitchingPolygonCm;
      if(!polygon)mark('assembly','UNVERIFIED','EDGE_GEOMETRY_MISSING',{pieceId:m.id,edgeId:e.id});
      else if(e.segmentIndex>=polygon.length)mark('assembly','FAIL','EDGE_INDEX_INVALID',{pieceId:m.id,edgeId:e.id});
    }
  }
  const operations=new Map();
  function checkAnchor(anchor,nodes,materials){
    if(!metas.has(anchor.pieceId)&&!pieces.has(anchor.pieceId)){mark('assembly','FAIL','UNKNOWN_ANCHOR_PIECE',{pieceId:anchor.pieceId});return;}
    if(anchor.copy!==1)mark('assembly','FAIL','INVALID_PATTERN_COPY',{pieceId:anchor.pieceId});
    const p=pieces.get(anchor.pieceId);if(!p)mark('assembly','UNVERIFIED','ANCHOR_GEOMETRY_MISSING',{pieceId:anchor.pieceId});
    else if(validatePolygon(p.polygonCm).valid&&!onOrInside(anchor.point,p.polygonCm))mark('assembly','FAIL','ANCHOR_OUTSIDE_PATTERN',{pieceId:anchor.pieceId,point:anchor.point});
    for(const owner of owners.get(anchor.pieceId)||[])nodes.add(owner);
    if(metas.has(anchor.pieceId))materials.add(metas.get(anchor.pieceId).bomId);
  }
  for(const raw of r.pattern.assembly){
    if(!['SEAM','ATTACH','INSTALL'].includes(raw.type)){operations.set(raw.id,{unsupported:true});mark('assembly','UNVERIFIED','UNSUPPORTED_OPERATION',{operationId:raw.id,type:raw.type});mark('construction','UNVERIFIED','UNSUPPORTED_OPERATION',{operationId:raw.id,type:raw.type});continue;}
    const parsedOp=operationSchema.safeParse(raw);
    if(!parsedOp.success){mark('assembly','FAIL','INVALID_SUPPORTED_OPERATION',{operationId:raw.id,issues:parsedOp.error.issues});continue;}
    const op=parsedOp.data,nodes=new Set(),materials=new Set();
    if(op.threadBomId&&bom.get(op.threadBomId)?.material.type!=='THREAD')mark('assembly','FAIL','INVALID_THREAD_BOM',{operationId:op.id,bomId:op.threadBomId});
    if(op.threadBomId)materials.add(op.threadBomId);
    if(op.type==='SEAM')for(const side of op.sides){
      if(!pieces.has(side.pieceId)&&!metas.has(side.pieceId))mark('assembly','FAIL','UNKNOWN_SEAM_PIECE',{operationId:op.id,pieceId:side.pieceId});
      if(side.copy!==1)mark('assembly','FAIL','INVALID_PATTERN_COPY',{pieceId:side.pieceId});
      const map=edgeMaps.get(side.pieceId),refs=side.edgeIds.map(k=>map?.get(k));
      if(refs.some(e=>!e))mark('assembly','FAIL','UNKNOWN_EDGE_REFERENCE',{operationId:op.id,pieceId:side.pieceId});
      else{
        if(new Set(side.edgeIds).size!==side.edgeIds.length)mark('assembly','FAIL','DUPLICATE_SEAM_EDGE',{operationId:op.id});
        const basis=refs[0].basis,n=basis==='CUTTING'?pieces.get(side.pieceId)?.polygonCm.length:metas.get(side.pieceId)?.stitchingPolygonCm?.length;
        if(refs.some(e=>e.basis!==basis)||refs.some((e,i)=>i&&n&&e.segmentIndex!==mod(refs[i-1].segmentIndex+(side.direction==='FORWARD'?1:-1),n)))mark('assembly','FAIL','DISCONNECTED_EDGE_CHAIN',{operationId:op.id});
        if(basis==='CUTTING'||!n)mark('construction','UNVERIFIED','STITCHING_LINE_NOT_ESTABLISHED',{operationId:op.id});
      }
      for(const owner of owners.get(side.pieceId)||[])nodes.add(owner);
      if(metas.has(side.pieceId))materials.add(metas.get(side.pieceId).bomId);
    }
    else if(op.type==='ATTACH'){checkAnchor(op.from,nodes,materials);checkAnchor(op.to,nodes,materials);}
    else{
      if(!bom.has(op.bomId))mark('assembly','FAIL','UNKNOWN_INSTALL_BOM',{operationId:op.id});
      materials.add(op.bomId);for(const c of components.values())if(c.bomIds.includes(op.bomId))nodes.add(c.id);
      for(const anchor of op.anchors)checkAnchor(anchor,nodes,materials);
      if(!['WEBBING','BUTTON','HARDWARE','ZIPPER'].includes(bom.get(op.bomId)?.material.type))mark('construction','UNVERIFIED','INSTALL_OPERATION_NOT_ENGINEERED',{operationId:op.id});
    }
    if(op.type==='SEAM'){
      const lengths=op.sides.map(side=>{
        const polygon=metas.get(side.pieceId)?.stitchingPolygonCm,refs=side.edgeIds.map(id=>edgeMaps.get(side.pieceId)?.get(id));
        if(!polygon||refs.some(e=>!e||e.basis!=='STITCHING'||e.segmentIndex>=polygon.length))return null;
        return refs.reduce((sum,e)=>{const a=polygon[e.segmentIndex],b=polygon[(e.segmentIndex+1)%polygon.length];return sum+Math.hypot(a[0]-b[0],a[1]-b[1]);},0);
      });
      if(lengths.some(v=>v===null))mark('construction','UNVERIFIED','SEAM_LENGTHS_NOT_ESTABLISHED',{operationId:op.id});
      else if(Math.abs(lengths[0]-lengths[1])>EPS)mark('construction','UNVERIFIED','SEAM_EASING_OR_GATHERING_UNVERIFIED',{operationId:op.id,lengthsCm:lengths});
    }
    operations.set(op.id,{nodes:[...nodes],materials:[...materials]});
  }
  for(const c of r.pattern.connections){
    if(!components.has(c.fromComponentId)||!components.has(c.toComponentId)){mark('assembly','FAIL','UNKNOWN_CONNECTION_COMPONENT',{connectionId:c.id});continue;}
    if(!c.assemblyIds.length){mark('assembly','UNVERIFIED','CONNECTION_OPERATIONS_MISSING',{connectionId:c.id});continue;}
    if(c.assemblyIds.some(id=>!operations.has(id))){mark('assembly','FAIL','UNKNOWN_CONNECTION_OPERATION',{connectionId:c.id});continue;}
    if(c.assemblyIds.some(id=>operations.get(id).unsupported)){mark('assembly','UNVERIFIED','CONNECTION_USES_UNSUPPORTED_OPERATION',{connectionId:c.id});continue;}
    const selected=c.assemblyIds.map(id=>operations.get(id)),reached=new Set([c.fromComponentId]);let changed=true;
    while(changed){changed=false;for(const op of selected)if(op.nodes.some(n=>reached.has(n)))for(const n of op.nodes)if(!reached.has(n)){reached.add(n);changed=true;}}
    if(!reached.has(c.toComponentId))mark('assembly',c.complete?'FAIL':'UNVERIFIED','DISCONNECTED_DECLARED_CONNECTION',{connectionId:c.id});
    if(!c.complete)mark('assembly','UNVERIFIED','CONNECTION_COVERAGE_PARTIAL',{connectionId:c.id});
    mark('construction','UNVERIFIED',c.kind==='STRAP'?'STRAP_LOAD_PATH_UNVERIFIED':c.kind==='CLOSURE'?'CLOSURE_OPERATION_UNVERIFIED':'PHYSICAL_CONNECTION_UNVERIFIED',{connectionId:c.id});
  }
  for(const claim of r.pattern.physicalClaims)mark('construction','UNVERIFIED','PHYSICAL_CLAIM_UNVERIFIED',{claim});
  for(const claim of r.pattern.unsupportedClaims)mark('construction','UNVERIFIED','UNSUPPORTED_PHYSICAL_CLAIM',claim);
  if(!layers.construction.reasons.length)mark('construction','PASS','SUPPORTED_STRUCTURAL_CHECKS_ONLY');
  result.status=combine(Object.values(layers));return result;
}
module.exports={precheck,requestSchema,onOrInside,properCross};
