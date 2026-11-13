const {z}=require('zod');
const {evaluateProposal,fingerprint}=require('../ai-pattern-proposals/adapter');
const {diagnoseOutput}=require('../design-language/ai-spike/harness');
const {nest}=require('../pattern-feasibility/nesting');
const {boundingBox}=require('../../src/geometry/polygon');
const {fabric,sourceConcept}=require('./prompt');
const rawSchema=z.object({design:z.unknown().optional(),instances:z.array(z.unknown()).optional()}).strict();
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function geometrySvg(evidence){
  const f=evidence.fabric,b=boundingBox(f.polygonCm),width=Math.max(28,f.widthCm+4),height=f.heightCm+7;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}cm" height="${height}cm" viewBox="0 0 ${width} ${height}"><title>EXPERIMENTAL geometry-only nesting, physically UNVERIFIED</title><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" font-size="0.4"><text x="1" y="1">Geometry screening ONLY — physically UNVERIFIED</text><text x="1" y="1.8">No material, stock, grain, stitching or manufacturing approval</text><g transform="translate(${2-b.minX} ${4-b.minY})"><polygon points="${f.polygonCm.map(p=>p.join(',')).join(' ')}" fill="#e2c0ca" stroke="#752a40" stroke-width="0.04"/>${evidence.pieces.map(p=>`<polygon points="${p.placedPolygonCm.map(p=>p.join(',')).join(' ')}" fill="white" stroke="#1f618d" stroke-width="0.04"/><text x="${boundingBox(p.placedPolygonCm).minX}" y="${boundingBox(p.placedPolygonCm).minY+0.5}">${escape(p.id)}: ${p.dimensions.widthCm.toFixed(2)} × ${p.dimensions.heightCm.toFixed(2)} cm</text>`).join('')}</g></g></svg>\n`;
}
function evaluate(text,{campaignId,model,mode='MOCK',sourcePath}){
  const out={status:'REJECTED',verdict:'FAIL',physicalAccuracy:'UNVERIFIED',manufacturingVerified:false,diagnostics:diagnoseOutput(text),rawParsed:null,errors:[],adapter:null,geometryScreening:null,previewBasis:null,previewSvg:null};
  try{out.rawParsed=JSON.parse(text);}catch{out.errors=[{code:'INVALID_JSON',path:[],message:'Raw model response was not valid JSON; no repair performed'}];return out;}
  const parsed=rawSchema.safeParse(out.rawParsed);
  if(!parsed.success){out.errors=parsed.error.issues;return out;}
  const raw=out.rawParsed,concept=sourceConcept();
  const proposal={...(raw.design!==undefined?{design:{path:sourcePath+'#design',data:raw.design}}:{}),context:{fabric:fabric(),...(raw.instances!==undefined?{instances:raw.instances}:{})}};
  const envelope={schemaVersion:'borsal.ai-pattern-proposal/0.1',sourceConcept:concept,proposal,
    provenance:{origin:mode==='LIVE'?'SAVED_AI_OUTPUT':'MANUAL_FIXTURE',sourcePath,conceptSha256:fingerprint(concept),proposalSha256:fingerprint(proposal),...(mode==='LIVE'?{modelId:model,campaignId}:{})}};
  out.adapter=evaluateProposal(envelope);out.status=out.adapter.status;out.verdict=out.adapter.verdict;out.errors=[...out.adapter.errors];
  // A separate mathematical screen can nest explicit cuts even when unknown real
  // properties prevent the full 5A/5B gate. It never upgrades the adapter verdict.
  if(Array.isArray(raw.instances)&&raw.instances.length){
    const pieces=raw.instances.map(i=>i&&typeof i==='object'?{id:i.id,polygonCm:i.cuttingPolygonCm,outlineBasis:'CUTTING',seamAllowanceStatus:i.allowancesIncluded===true?'INCLUDED':'UNKNOWN',...(i.allowedRotationsDeg!==undefined?{allowedRotationsDeg:i.allowedRotationsDeg}:{})}:i);
    out.geometryScreening=nest({schemaVersion:'borsal.nesting/0.1',unit:'cm',fabric:{polygonCm:fabric().geometry.polygonCm},pieces,search:{maxCandidates:2000,maxBacktracks:20,gridStepsCm:[2,1,0.5]}});
    if(['INVALID_INPUT','INVALID_FABRIC_OR_PIECE','AREA_PRECHECK_FAILED','FINAL_VALIDATION_FAILED'].includes(out.geometryScreening.reason)){
      out.verdict='FAIL';out.status=out.geometryScreening.reason==='AREA_PRECHECK_FAILED'?'FAIL':'REJECTED';
      out.errors.push({code:'GEOMETRY_SCREEN_FAILED',reason:out.geometryScreening.reason,diagnostics:out.geometryScreening.diagnostics,globalImpossibilityClaimed:false});
    }
    if(out.geometryScreening.status==='LAYOUT_FOUND'){out.previewSvg=geometrySvg(out.geometryScreening.validatorEvidence);out.previewBasis='GEOMETRY_ONLY_NESTING';}
  }
  if(!out.previewSvg&&out.adapter.draft?.previewSvg){out.previewSvg=out.adapter.draft.previewSvg.replace('MANUALLY AUTHORED DRAFT',mode==='LIVE'?'MODEL-PROPOSED DRAFT':'OFFLINE MOCK DRAFT');out.previewBasis='LOCAL_DRAFT_OUTLINES';}
  return out;
}
module.exports={evaluate,geometrySvg};
