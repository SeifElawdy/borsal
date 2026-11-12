// Pure supplied-layout checking: no search, file IO, AI, persistence or approval.
const {z}=require('zod');
const {validatePolygon,validateWithHoles,normalizeToCounterClockwise,pointInPolygon,
  area,dimensions,signedArea}=require('../../src/geometry/polygon');
const VERSION='borsal.pattern-layout/0.1';
const DISTANCE_EPS_CM=1e-6,AREA_EPS_CM2=1e-8,ANGLE_EPS_DEG=1e-7;
const number=z.number().finite(),point=z.tuple([number,number]);
const polygon=z.array(point).min(3);
const angle=number.min(0).lt(180),object=shape=>z.object(shape).strict();
const layoutSchema=object({
  schemaVersion:z.literal(VERSION),unit:z.literal('cm'),
  fabric:object({polygonCm:polygon,holes:z.array(polygon).default([]),grainDirectionDeg:angle.optional()}),
  pieces:z.array(object({
    id:z.string().regex(/^[a-z][a-z0-9-]*$/),polygonCm:polygon,
    placement:object({translationCm:point,rotationDeg:number}),
    outlineBasis:z.enum(['CUTTING','SEAM_LINE','UNKNOWN']).default('UNKNOWN'),
    seamAllowanceStatus:z.enum(['INCLUDED','NOT_INCLUDED','UNKNOWN']).default('UNKNOWN'),
    grain:object({localDirectionDeg:angle.optional(),toleranceDeg:number.min(0).max(90).optional()}).optional(),
  })).min(1),
}).superRefine((layout,ctx)=>{
  const seen=new Set();layout.pieces.forEach((p,i)=>{
    if(seen.has(p.id))ctx.addIssue({code:'custom',path:['pieces',i,'id'],message:'Duplicate piece instance ID'});
    seen.add(p.id);
  });
});
const mod=(n,period)=>((n%period)+period)%period;
const edges=polygon=>polygon.map((p,i)=>[p,polygon[(i+1)%polygon.length]]);

function pointSegmentDistance(p,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],length2=dx*dx+dy*dy;
  const t=length2?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length2)):0;
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
}
function edgeContact(a,b) {
  // Proper crossings have zero separation. Use distance (cm) for all near/collinear
  // contacts rather than applying a length tolerance to an unscaled cross product.
  const cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
  const straddles=(x,y)=>(x>0&&y<0)||(x<0&&y>0);
  if(straddles(cross(...a,b[0]),cross(...a,b[1]))&&straddles(cross(...b,a[0]),cross(...b,a[1])))return true;
  return Math.min(pointSegmentDistance(a[0],...b),pointSegmentDistance(a[1],...b),
    pointSegmentDistance(b[0],...a),pointSegmentDistance(b[1],...a))<=DISTANCE_EPS_CM;
}
function boundaryContact(a,b) {
  const ea=edges(a),eb=edges(b);
  for(let i=0;i<ea.length;i++)for(let j=0;j<eb.length;j++)if(edgeContact(ea[i],eb[j]))return {edgeA:i,edgeB:j};
  return null;
}
function conflict(a,b) {
  const contact=boundaryContact(a,b);
  if(contact)return {kind:'BOUNDARY_INTERSECTION_OR_CONTACT',...contact};
  if(pointInPolygon(a[0],b)||pointInPolygon(b[0],a))return {kind:'INTERIOR_OVERLAP_OR_CONTAINMENT'};
  return null;
}
function transform(polygon,placement) {
  const rotationDeg=mod(placement.rotationDeg,360),r=rotationDeg*Math.PI/180,c=Math.cos(r),s=Math.sin(r),[tx,ty]=placement.translationCm;
  return polygon.map(([x,y])=>[x*c-y*s+tx,x*s+y*c+ty]);
}
const combine=checks=>checks.includes('FAIL')?'FAIL':checks.includes('UNVERIFIED')?'UNVERIFIED':'PASS';
function grainCheck(fabric,piece) {
  if(fabric.grainDirectionDeg===undefined||!piece.grain||piece.grain.localDirectionDeg===undefined||piece.grain.toleranceDeg===undefined)
    return {status:'UNVERIFIED',reason:'GRAIN_INFORMATION_MISSING'};
  const placedDirectionDeg=mod(piece.grain.localDirectionDeg+mod(piece.placement.rotationDeg,360),180);
  const delta=Math.abs(placedDirectionDeg-fabric.grainDirectionDeg),deviationDeg=Math.min(delta,180-delta);
  return {status:deviationDeg<=piece.grain.toleranceDeg+ANGLE_EPS_DEG?'PASS':'FAIL',
    reason:deviationDeg<=piece.grain.toleranceDeg+ANGLE_EPS_DEG?'DECLARED_GRAIN_CONSTRAINT_MET':'GRAIN_DIRECTION_MISMATCH',
    placedDirectionDeg,deviationDeg,toleranceDeg:piece.grain.toleranceDeg};
}
function allowanceCheck(piece) {
  return piece.outlineBasis==='CUTTING'&&piece.seamAllowanceStatus==='INCLUDED'
    ?{status:'PASS',reason:'ALLOWANCES_EXPLICITLY_DECLARED_INCLUDED'}
    :{status:'UNVERIFIED',reason:'COMPLETE_ALLOWANCE_GEOMETRY_NOT_ESTABLISHED'};
}
function evaluateLayout(input) {
  const result={schemaVersion:'borsal.pattern-feasibility-result/0.1',unit:'cm',status:'FAIL',
    classification:'INVALID_INPUT',geometryStatus:'UNVERIFIED',globalFeasibility:'NOT_ASSESSED',manufacturingVerified:false,
    tolerance:{distanceCm:DISTANCE_EPS_CM,areaCm2:AREA_EPS_CM2,angleDeg:ANGLE_EPS_DEG},
    boundaryPolicy:'NO_CONTACT_OR_WITHIN_DISTANCE_TOLERANCE',fabric:null,areaCheck:null,pieces:[],diagnostics:[],
    limitations:['Only the supplied layout is checked; failure does not prove global impossibility',
      'Allowance geometry is never generated; declaration truth is not independently verified',
      'Grain directions are user declarations, not image measurements','No cutting, seam, load, inventory or manufacturing approval']};
  const parsed=layoutSchema.safeParse(input);
  if(!parsed.success){result.diagnostics=parsed.error.issues.map(i=>({code:'INVALID_INPUT',path:i.path,message:i.message}));return result;}
  const layout=parsed.data,f=layout.fabric;
  const fv=validateWithHoles(f.polygonCm,f.holes);
  const fabricErrors=[...fv.errors];
  // The existing validator does not reject holes overlapping/containing each other.
  for(let i=0;i<f.holes.length;i++){
    if(boundaryContact(f.holes[i],f.polygonCm))fabricErrors.push('Hole '+i+' contacts or is too close to outer boundary');
    for(let j=0;j<i;j++)if(conflict(f.holes[i],f.holes[j]))fabricErrors.push('Holes '+j+' and '+i+' overlap, nest or contact');
  }
  if(fabricErrors.length){result.diagnostics=fabricErrors.map(message=>({code:'INVALID_FABRIC',message}));return result;}
  const outer=normalizeToCounterClockwise(f.polygonCm),holes=f.holes.map(normalizeToCounterClockwise);
  result.fabric={polygonCm:outer,holes,areaCm2:fv.netAreaCm2,...dimensions(outer)};
  result.classification='SUPPLIED_LAYOUT_ONLY';
  for(const piece of layout.pieces){
    const p={id:piece.id,status:'FAIL',geometryStatus:'FAIL',placement:{...piece.placement,rotationDeg:mod(piece.placement.rotationDeg,360)},
      placedPolygonCm:null,dimensions:null,areaCm2:null,reasons:[],grain:grainCheck(f,piece),allowances:allowanceCheck(piece)};
    result.pieces.push(p);
    const local=validatePolygon(piece.polygonCm);
    if(!local.valid){p.reasons.push({code:'INVALID_PIECE',errors:local.errors});continue;}
    const placed=transform(normalizeToCounterClockwise(piece.polygonCm),piece.placement),validation=validatePolygon(placed);
    if(!validation.valid){p.reasons.push({code:'INVALID_TRANSFORMED_PIECE',errors:validation.errors});continue;}
    p.placedPolygonCm=normalizeToCounterClockwise(placed);p.dimensions=dimensions(placed);p.areaCm2=area(placed);
    p.inputOrientation=signedArea(piece.polygonCm)>0?'CCW':'CW';
    const contact=boundaryContact(placed,outer);
    if(contact)p.reasons.push({code:'FABRIC_BOUNDARY_INTERSECTION_OR_CONTACT',...contact});
    if(placed.some(v=>!pointInPolygon(v,outer)))p.reasons.push({code:'OUTSIDE_FABRIC'});
    holes.forEach((hole,holeIndex)=>{
      const overlap=conflict(placed,hole);
      if(overlap)p.reasons.push({code:'FABRIC_HOLE_INTERSECTION_OR_COVERAGE',holeIndex,...overlap});
    });
  }
  for(let i=0;i<result.pieces.length;i++)for(let j=0;j<i;j++){
    const a=result.pieces[i],b=result.pieces[j];
    if(!a.placedPolygonCm||!b.placedPolygonCm)continue;
    const overlap=conflict(a.placedPolygonCm,b.placedPolygonCm);
    if(overlap){a.reasons.push({code:'PIECE_OVERLAP_OR_CONTACT',otherPieceId:b.id,...overlap});b.reasons.push({code:'PIECE_OVERLAP_OR_CONTACT',otherPieceId:a.id,...overlap});}
  }
  const total=result.pieces.every(p=>p.areaCm2!==null)?result.pieces.reduce((sum,p)=>sum+p.areaCm2,0):null;
  result.areaCheck={status:total===null?'UNVERIFIED':total<=fv.netAreaCm2+AREA_EPS_CM2?'PASS':'FAIL',
    totalPieceAreaCm2:total,usableFabricAreaCm2:fv.netAreaCm2,necessaryOnly:true};
  if(result.areaCheck.status==='FAIL')result.diagnostics.push({code:'TOTAL_AREA_EXCEEDS_USABLE_FABRIC'});
  for(const p of result.pieces){
    p.geometryStatus=p.reasons.length?'FAIL':'PASS';
    p.status=combine([p.geometryStatus,p.grain.status,p.allowances.status]);
  }
  result.geometryStatus=combine([result.areaCheck.status,...result.pieces.map(p=>p.geometryStatus)]);
  result.status=combine([result.geometryStatus,...result.pieces.map(p=>p.status)]);
  return result;
}
module.exports={VERSION,layoutSchema,evaluateLayout,transform};
