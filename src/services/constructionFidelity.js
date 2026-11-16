// Evidence adapter only. Existing material/assembly and geometry checks remain authoritative.
const {precheck,requestSchema}=require('../../experiments/pattern-feasibility/precheck');
const {dimensions,area}=require('../geometry/polygon');
const {fingerprint}=require('../../experiments/ai-pattern-proposals/adapter');
const POLICY='borsal.construction-fidelity/0.1';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function assess(proposal,concept,previews=[]){
  try{return build(proposal,concept,previews);}catch{return {policy:POLICY,geometry:'UNVERIFIED',construction:'INVALID_CONSTRUCTION',creativeCoverage:'CREATIVE_COVERAGE_PARTIAL',pieces:[],instructions:[],blockers:[{code:'MALFORMED_TECHNICAL_INPUT',message:'The supplied technical structures cannot be assessed. No construction or measurements were inferred.'}],manufacturingVerified:false,inventoryMutated:false};}
}
function build(proposal,concept,previews){
  const raw=proposal.originalInput?.proposal,t=raw?.design?.data?.technical,instances=raw?.context?.instances||[],source=proposal.provenance?.sourceSnapshot||{},screen=proposal.assessment?.preliminaryGeometry?.result;
  const report={policy:POLICY,provenance:{proposalId:String(proposal._id),version:proposal.version,inputHash:proposal.provenance?.inputSha256,sourceHash:proposal.provenance?.fabricSourceHash,conceptHash:proposal.provenance?.conceptSha256,reviewVersion:proposal.reviewVersion},
    geometry:'UNVERIFIED',construction:'CONSTRUCTION_UNVERIFIED',creativeCoverage:'CREATIVE_COVERAGE_PARTIAL',pieces:[],instructions:[],blockers:[],precheck:null,manufacturingVerified:false,inventoryMutated:false};
  const block=(code,message,piece)=>report.blockers.push({code,message,...(piece?{piece}:{} )});
  if(!t||!['patternPieces','components','assembly','bom'].every(k=>Array.isArray(t[k]))||!Array.isArray(instances)||!instances.length){block('TECHNICAL_INFORMATION_INCOMPLETE','Explicit cutting pieces and technical metadata are required before construction can be assessed.');report.reportHash=fingerprint(report);return report;}
  const patterns=new Map(t.patternPieces.map(p=>[p.id,p])),lookup=(id,copy)=>instances.find(i=>i.pieceId===id&&i.copy===copy),ref=r=>({...r,pieceId:lookup(r.pieceId,r.copy)?.id||'unresolved-piece',copy:1});
  const assembly=t.assembly.map(a=>a.type==='SEAM'?{...a,sides:a.sides.map(ref)}:a.type==='ATTACH'?{...a,from:ref(a.from),to:ref(a.to)}:{...a,anchors:(a.anchors||[]).map(ref)});
  const nestingRequest={schemaVersion:'borsal.nesting/0.1',unit:'cm',fabric:{polygonCm:source.polygonCm,holes:source.holes||[],...(source.grainDirectionDeg==null?{}:{grainDirectionDeg:source.grainDirectionDeg})},
    pieces:instances.map(i=>({id:i.id,polygonCm:i.cuttingPolygonCm,outlineBasis:'CUTTING',seamAllowanceStatus:i.allowancesIncluded===true?'INCLUDED':'UNKNOWN',grain:{...(patterns.get(i.pieceId)?.grainDirectionDeg===undefined?{}:{localDirectionDeg:patterns.get(i.pieceId).grainDirectionDeg}),...(i.grainToleranceDeg===undefined?{}:{toleranceDeg:i.grainToleranceDeg})},...(i.allowedRotationsDeg?{allowedRotationsDeg:i.allowedRotationsDeg}:{})})),search:screen?.searchLimits};
  const request={schemaVersion:'borsal.material-precheck/0.1',unit:'cm',fabric:{id:proposal.provenance.fabricScrapId||t.scrapSources[0].id,geometry:{polygonCm:source.polygonCm,holes:source.holes||[],...(source.geometry?.confirmed===undefined?{}:{confirmed:source.geometry.confirmed}),...(source.geometry?.version===undefined?{}:{version:source.geometry.version})},...(source.grainDirectionDeg==null?{}:{grainDirectionDeg:source.grainDirectionDeg})},
    nesting:{request:nestingRequest,result:screen||{status:'NO_LAYOUT_FOUND',placements:[]}},bom:t.bom,
    pattern:{pieces:instances.map(i=>{const p=patterns.get(i.pieceId),ring=p?.outline?[p.outline.start,...p.outline.segments.slice(0,-1).map(s=>s.to)]:undefined;return {id:i.id,bomId:p?.bomId,...(ring?{stitchingPolygonCm:ring}:{}),edges:p?.outline?.segments.map((s,segmentIndex)=>({id:s.id,basis:'STITCHING',segmentIndex}))||[]};}),
      components:t.components.map(c=>({id:c.id,role:c.role,pieceIds:instances.filter(i=>c.pieceIds.includes(i.pieceId)).map(i=>i.id),bomIds:[...new Set(c.pieceIds.map(id=>patterns.get(id)?.bomId).filter(Boolean))]})),assembly,connections:[],physicalClaims:t.patternPieces.flatMap(p=>(p.folds||[]).map(f=>'Declared '+f.type+' fold; physical implementation unverified')),unsupportedClaims:[]}};
  const curves=t.patternPieces.some(p=>p.outline?.segments.some(s=>s.type!=='LINE')),checked=requestSchema.safeParse(request);
  // Same boundary as the existing design bridge: never flatten curves or remap edges.
  if(curves)block('EXPLICIT_CURVE_REPRESENTATION_REQUIRED','Curved stitching needs an explicit supported representation; no curve flattening or edge remapping was performed.');
  else if(checked.success){report.precheck=precheck(request);report.geometry=report.precheck.validatorEvidence?.geometryStatus==='PASS'?'GEOMETRY_PASS':report.precheck.layers.geometry.status==='FAIL'?'FAIL':'UNVERIFIED';if(report.precheck.layers.assembly.status==='FAIL'||report.precheck.layers.geometry.status==='FAIL')report.construction='INVALID_CONSTRUCTION';}
  else block('PRECHECK_INFORMATION_INCOMPLETE','The existing assembly precheck needs complete pattern, material and nesting declarations; missing values were not invented.');
  const assemblyValid=report.precheck?.layers.assembly.status==='PASS'||proposal.provenance?.derivation?.engineering?.constructionStatus==='UNVERIFIED';
  const intent=proposal.provenance?.derivation?.constructionIntent;
  const engineering=proposal.provenance?.derivation?.engineering;
  if(engineering){report.proposedProduct={name:engineering.plan.name,function:engineering.plan.function,method:'COMPOSABLE_OPERATIONS',unresolved:engineering.plan.unresolved,classification:'AI_PROPOSED_ENGINEERING',authorship:'AI_PLAN / DETERMINISTIC_COMPILATION',schematicSvg:require('./productEngineering').schematic(engineering.plan)};
    report.proposedAssembly=(proposal.assessment?.constructionPlan?.instructions||[]).map((text,index)=>({step:index+1,text,basis:'SOURCE_LINKED_PROPOSED_CONSTRUCTION',physicalStatus:'UNVERIFIED'}));
    for(const finding of engineering.checks.filter(c=>c.status==='UNVERIFIED'))block(finding.code,'Proposed construction still requires: '+(finding.piece||finding.closure||finding.code));}
  if(intent){report.proposedProduct={name:intent.name,function:intent.function,method:intent.method,creativeChanges:intent.creativeChanges,unresolved:intent.unresolved,classification:'EXPLICITLY_SELECTED_ALTERNATIVE',authorship:'ENGINE_DERIVED_CONSTRUCTION_HYPOTHESIS'};
    report.proposedProduct.schematicSvg=require('./constructionPlanner').schematic(intent);
    report.proposedAssembly=(proposal.assessment?.constructionPlan?.instructions||[]).map((text,index)=>({step:index+1,text,basis:'SOURCE_LINKED_PROPOSED_CONSTRUCTION',physicalStatus:'UNVERIFIED'}));}
  for(const [index,i]of instances.entries()){
    const p=patterns.get(i.pieceId),owners=t.components.filter(c=>c.pieceIds.includes(i.pieceId)),seed=proposal.provenance?.derivation?.candidate?.pieces?.[t.patternPieces.findIndex(p=>p.id===i.pieceId)],label=seed?.name?.replaceAll('-',' ')||'Piece '+(index+1);
    const touched=assembly.filter(a=>(a.sides||a.anchors||[a.from,a.to]).filter(Boolean).some(r=>r.pieceId===i.id));
    const generic=proposal.origin==='ENGINE_DERIVED'&&owners.every(c=>c.role==='BODY'),role=owners.length&&owners.every(c=>typeof c.role==='string'&&c.role.trim())&&!generic?'DECLARED':'UNVERIFIED';
    const overcast=engineering?.plan.operations.some(o=>o.type==='FINISH'&&o.piece===seed?.name);
    const finish=overcast?'PROPOSED_OVERCAST':p?.folds?.some(f=>f.type==='HEM')&&p.outline?'PROPOSED_HEM':p?.outline?'STITCH_PATH_ONLY':'MISSING';
    const piece={key:i.id,label:label+(i.copy>1?' · copy '+i.copy:''),copy:i.copy,dimensions:dimensions(i.cuttingPolygonCm),areaCm2:area(i.cuttingPolygonCm),role:{status:role,description:engineering?.plan.components.find(c=>c.name===seed?.name)?.purpose||(role==='DECLARED'?owners.map(c=>c.role).join(', '):'A component label or generic body role does not establish its product function.')},connection:{status:touched.length&&assemblyValid?'DECLARED':'UNVERIFIED',operationCount:touched.length},finishing:{status:['PROPOSED_HEM','PROPOSED_OVERCAST'].includes(finish)?'DECLARED':'UNVERIFIED',method:finish},conceptRelationship:'UNVERIFIED'};
    report.pieces.push(piece);
    if(role==='UNVERIFIED')block('MEANINGFUL_ROLE_NOT_ENGINEERED','Explain what this piece does in the finished product.',piece.label);
    if(!touched.length)block('CONNECTION_OR_STANDALONE_INTENT_MISSING','Specify how this piece connects, or explicitly justify its separate use.',piece.label);
    if(!['PROPOSED_HEM','PROPOSED_OVERCAST'].includes(finish))block('FINISHING_METHOD_UNSPECIFIED',p?.outline?'A stitching outline is supplied, but a hem, binding or other fray-control finish is not engineered.':'A stitching path and an explicit edge-finishing method are missing.',piece.label);
    if(p?.outline&&!curves)report.instructions.push({kind:'PROPOSED_FINISHING',piece:piece.label,source:{pieceId:i.pieceId,copy:i.copy},text:finish==='PROPOSED_HEM'?`For ${piece.label}, follow only the supplied hem axis/allowance and stitching path; physical suitability remains unverified.`:`For ${piece.label}, perimeter stitching is proposed along the supplied line. Choose and engineer a suitable edge finish before making it.`});
  }
  if(assemblyValid)for(const op of assembly){const refs=(op.sides||op.anchors||[op.from,op.to]).filter(Boolean),labels=[...new Set(refs.map(r=>report.pieces.find(p=>p.key===r.pieceId)?.label).filter(Boolean))];report.instructions.push({kind:'SUPPORTED_REFERENCE_PLAN',source:{operationId:op.id},text:`Proposed ${op.type.toLowerCase()} involving ${labels.join(' and ')} using the supplied references. This checks declarations, not assembled contact, strength or operation.`});}
  if(report.precheck?.layers.assembly.status==='FAIL')block('INVALID_ASSEMBLY_REFERENCES','Existing assembly checks reject one or more connections; no repaired instruction was generated.');
  block('CREATIVE_FUNCTION_NOT_VERIFIED','Product function and distinctive creative features need an explicit engineered implementation and human review. Geometry and generic component roles do not prove them.');
  block('PHYSICAL_ASSEMBLY_NOT_VERIFIED','Material behavior, folds, weaving, tie/closure retention, finished size and physical construction are not established.');
  report.creativeRequirements=[concept?.productIdea?.description,...(concept?.distinctiveFeatures||[]).map(f=>f.description),...(concept?.unresolvedRequirements||[]).map(r=>r.description)].filter(Boolean).map(description=>({description,status:'UNVERIFIED',basis:'Creative intent is preserved as a requirement, not evidence of technical implementation.'}));
  if(intent?.method==='TWO_PANEL_SNAP_FLAP_POUCH'){
    report.proposedProduct.classification='EXPLICIT_CONSTRUCTION_INTERPRETATION';
    block('FLAP_HINGE_AND_SNAP_PHYSICAL_TEST_REQUIRED','The integral flap hinge, hardware installation and coin-retention performance require physical testing. INSTALL checks references, not snap reliability.');
    report.previewNotice='This proposed plan uses two flat panels, an integral flap and a paired snap. Gathered/drawstring openings or rounded shaping in the saved illustrations are not engineered by this pattern.';
  }
  report.previews=previews.map(p=>({id:p.id,label:'ILLUSTRATIVE_AI_PREVIEW',assetUrl:p.assetUrl,sourceMatches:p.sourceHash===proposal.provenance.fabricSourceHash,conceptMatches:p.conceptHash===proposal.provenance.conceptSha256,reviewMatches:p.reviewVersion===proposal.reviewVersion,technicalVersionLinked:p.proposalId===String(proposal._id)&&p.proposalHash===proposal.provenance.inputSha256,visualFidelity:'UNVERIFIED',notice:'Illustration is not evidence of folds, thickness, texture, attachment geometry, finished dimensions or construction.'}));
  report.reportHash=fingerprint(report);report.annotationSvg=diagram(report);return report;
}
function diagram(report){
  const width=1000,height=130+Math.ceil(report.pieces.length/3)*170;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><metadata>${escape(JSON.stringify({policy:POLICY,reportHash:report.reportHash,provenance:report.provenance}))}</metadata><rect width="100%" height="100%" fill="#19151f"/><text x="24" y="35" fill="#f8f4fc" font-size="22">Construction evidence schematic — not assembled geometry</text><text x="24" y="65" fill="#ddd0e9" font-size="16">${escape(report.geometry)} · ${escape(report.construction)} · ${escape(report.creativeCoverage)}</text>${report.pieces.map((p,i)=>{const x=24+(i%3)*325,y=100+Math.floor(i/3)*170;return `<g><rect x="${x}" y="${y}" width="305" height="145" rx="8" fill="#30243b" stroke="#a98eba"/><text x="${x+14}" y="${y+27}" fill="#f8f4fc" font-size="17">${escape(p.label)}</text><text x="${x+14}" y="${y+54}" fill="#ddd0e9" font-size="15">Role: ${p.role.status}</text><text x="${x+14}" y="${y+80}" fill="#ddd0e9" font-size="15">Connection: ${p.connection.status}</text><text x="${x+14}" y="${y+106}" fill="#ddd0e9" font-size="15">Finish: ${p.finishing.status}</text><text x="${x+14}" y="${y+131}" fill="#ddd0e9" font-size="14">${p.dimensions.widthCm.toFixed(2)} × ${p.dimensions.heightCm.toFixed(2)} cm cutting bounds</text></g>`;}).join('')}</svg>`;
}
module.exports={assess,POLICY};
