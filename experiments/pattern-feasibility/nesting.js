// Bounded deterministic candidate search; Phase 4A remains the only fit authority.
const {z}=require('zod');
const {layoutSchema,VERSION,evaluateLayout,transform}=require('./engine');
const {area,boundingBox}=require('../../src/geometry/polygon');
const finite=z.number().finite();
const rotations=z.array(finite).min(1).max(16);
const searchSchema=z.object({
  rotationsDeg:rotations.default([0,90,180,270]),
  gridStepsCm:z.array(finite.min(0.001).max(1000)).min(1).max(8).default([2,1,0.5]),
  gridInsetCm:finite.min(0.00001).max(10).default(0.01),
  maxCandidates:z.number().int().min(1).max(100000).default(5000),
  maxBacktracks:z.number().int().min(0).max(10000).default(100),
}).strict();
const nestingSchema=z.object({
  schemaVersion:z.literal('borsal.nesting/0.1'),unit:z.literal('cm'),fabric:layoutSchema.shape.fabric,
  pieces:z.array(layoutSchema.shape.pieces.element.omit({placement:true}).extend({allowedRotationsDeg:rotations.optional()})).min(1).max(20),
  search:searchSchema.optional(),
}).strict().superRefine((l,ctx)=>{
  const seen=new Set();l.pieces.forEach((p,i)=>{if(seen.has(p.id))ctx.addIssue({code:'custom',path:['pieces',i,'id'],message:'Duplicate piece instance ID'});seen.add(p.id);});
});
const angles=a=>[...new Set(a.map(r=>((r%360)+360)%360))].sort((a,b)=>a-b);
const placed=(piece,placement)=>{const {allowedRotationsDeg,...spec}=piece;return {...spec,placement};};
const valid=evidence=>evidence.geometryStatus==='PASS'&&evidence.status!=='FAIL';

function* candidates(piece,fabricBounds,choices,limits){
  // Lazy enumeration avoids allocating a potentially enormous fine-grid array.
  for(const step of limits.gridStepsCm)for(const rotationDeg of choices){
    const box=boundingBox(transform(piece.polygonCm,{rotationDeg,translationCm:[0,0]}));
    const minX=fabricBounds.minX+limits.gridInsetCm-box.minX,maxX=fabricBounds.maxX-limits.gridInsetCm-box.maxX;
    const minY=fabricBounds.minY+limits.gridInsetCm-box.minY,maxY=fabricBounds.maxY-limits.gridInsetCm-box.maxY;
    const nx=Math.floor((maxX-minX)/step),ny=Math.floor((maxY-minY)/step);
    for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++)yield {rotationDeg,translationCm:[minX+x*step,minY+y*step]};
  }
}

function nest(input){
  const out={schemaVersion:'borsal.nesting-result/0.1',status:'NO_LAYOUT_FOUND',reason:'INVALID_INPUT',
    validationStatus:null,validatorEvidence:null,placements:[],searchLimits:null,rotationChoices:{},pieceOrder:[],
    generatedCandidates:0,attemptedCandidates:0,skippedDuplicateCandidates:0,backtracks:0,validatorCalls:0,
    rejectionCounts:{},diagnostics:[],unresolvedConstraints:[],bestPartial:{placements:[],validatorEvidence:null},
    areaSummary:{basis:'BEST_VALID_PARTIAL_LAYOUT',requestedPieceAreaCm2:null,usableFabricAreaCm2:null,utilizedAreaCm2:null,remainingAreaCm2:null,utilizationPercent:null},
    globalImpossibilityClaimed:false,manufacturingVerified:false};
  const parsed=nestingSchema.safeParse(input);
  if(!parsed.success){out.diagnostics=parsed.error.issues.map(i=>({path:i.path,message:i.message}));return out;}
  const data=parsed.data,limits=searchSchema.parse(data.search||{});
  limits.rotationsDeg=angles(limits.rotationsDeg);limits.gridStepsCm=[...new Set(limits.gridStepsCm)].sort((a,b)=>b-a);
  out.searchLimits=limits;
  const layout=pieces=>({schemaVersion:VERSION,unit:'cm',fabric:data.fabric,pieces});
  const evaluate=pieces=>{out.validatorCalls++;return evaluateLayout(layout(pieces));};
  const preflight=evaluate(data.pieces.map(p=>placed(p,{translationCm:[0,0],rotationDeg:0})));
  const invalid=preflight.classification==='INVALID_INPUT'||preflight.pieces.some(p=>p.reasons.some(r=>r.code==='INVALID_PIECE'||r.code==='INVALID_TRANSFORMED_PIECE'));
  if(invalid){out.reason='INVALID_FABRIC_OR_PIECE';out.diagnostics=[...preflight.diagnostics,...preflight.pieces.flatMap(p=>p.reasons.filter(r=>r.code.startsWith('INVALID')).map(r=>({pieceId:p.id,...r})))];return out;}
  const usable=preflight.fabric.areaCm2;
  out.areaSummary={...out.areaSummary,requestedPieceAreaCm2:preflight.areaCheck.totalPieceAreaCm2,usableFabricAreaCm2:usable,utilizedAreaCm2:0,remainingAreaCm2:usable,utilizationPercent:0};
  out.unresolvedConstraints=preflight.pieces.flatMap(p=>['grain','allowances'].filter(k=>p[k].status==='UNVERIFIED').map(k=>({pieceId:p.id,constraint:k,reason:p[k].reason})));
  if(preflight.areaCheck.status==='FAIL'){out.reason='AREA_PRECHECK_FAILED';out.diagnostics=preflight.diagnostics;return out;}
  const order=[...data.pieces].sort((a,b)=>area(b.polygonCm)-area(a.polygonCm)||(a.id<b.id?-1:a.id>b.id?1:0));
  out.pieceOrder=order.map(p=>p.id);
  for(const p of order)out.rotationChoices[p.id]=angles(p.allowedRotationsDeg||limits.rotationsDeg);
  const bounds=boundingBox(data.fabric.polygonCm);let stopped=null,solution=null;
  const remember=(pieces,evidence)=>{if(pieces.length>out.bestPartial.placements.length)out.bestPartial={placements:pieces.map(p=>({id:p.id,...p.placement})),validatorEvidence:evidence};};
  function visit(depth,prefix){
    if(depth===order.length){solution=prefix;return true;}
    const p=order[depth],seen=new Set();
    for(const pose of candidates(p,bounds,out.rotationChoices[p.id],limits)){
      if(out.generatedCandidates>=limits.maxCandidates){stopped='CANDIDATE_LIMIT';return false;}
      out.generatedCandidates++;
      const key=JSON.stringify(pose);
      if(seen.has(key)){out.skippedDuplicateCandidates++;continue;}seen.add(key);
      out.attemptedCandidates++;
      const next=[...prefix,placed(p,pose)],evidence=evaluate(next);
      if(!valid(evidence)){
        const reasons=new Set(evidence.pieces.flatMap(p=>[...p.reasons.map(r=>r.code),...(p.grain.status==='FAIL'?[p.grain.reason]:[])]));
        for(const reason of reasons)out.rejectionCounts[reason]=(out.rejectionCounts[reason]||0)+1;
        continue;
      }
      remember(next,evidence);
      if(visit(depth+1,next))return true;
      if(stopped)return false;
      if(out.backtracks>=limits.maxBacktracks){stopped='BACKTRACK_LIMIT';return false;}
      out.backtracks++;
    }
    return false;
  }
  const found=visit(0,[]);
  if(found){
    // Revalidate the COMPLETE proposal in original input order before any success claim.
    const byId=new Map(solution.map(p=>[p.id,p]));
    out.validatorEvidence=evaluate(data.pieces.map(p=>byId.get(p.id)));
    out.validationStatus=out.validatorEvidence.status;
    if(valid(out.validatorEvidence)){
      out.status='LAYOUT_FOUND';out.reason=null;out.placements=data.pieces.map(p=>({id:p.id,...byId.get(p.id).placement}));
      out.areaSummary.basis='COMPLETE_VALIDATED_LAYOUT';
      out.bestPartial=null; // Keep partial evidence only when no complete layout was accepted.
    }else out.reason='FINAL_VALIDATION_FAILED';
  }else out.reason=stopped||'DISCRETE_CANDIDATES_EXHAUSTED';
  const evidence=out.status==='LAYOUT_FOUND'?out.validatorEvidence:out.bestPartial.validatorEvidence;
  const utilized=evidence?evidence.pieces.reduce((sum,p)=>sum+p.areaCm2,0):0;
  out.areaSummary={...out.areaSummary,utilizedAreaCm2:utilized,remainingAreaCm2:Math.max(0,usable-utilized),utilizationPercent:utilized/usable*100};
  return out;
}
module.exports={nest,nestingSchema};
