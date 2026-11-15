const fs=require('fs'),path=require('path'),sharp=require('sharp'),{randomUUID,createHash}=require('crypto');
const Run=require('../models/ConceptRun'),Proposal=require('../models/TechnicalProposal');
const {ensureCurrent,fail,writeNew}=require('./conceptFlow');
const {fingerprint}=require('../../experiments/ai-pattern-proposals/adapter');
const {openBudget}=require('../../experiments/design-language/ai-spike/campaign');
const {validateRuntime}=require('./localAI');
const {POLICY,VIEWS,specification,promptFor}=require('./previewPrompt');
const identity=require('./designIdentity');
const {fabricReference}=require('./previewReference');
const DATA=path.resolve(__dirname,'../../data');
const hash=b=>createHash('sha256').update(b).digest('hex');
async function makeConditioning(original,hero){
  if(!hero)return sharp(original).rotate().resize({width:1024,height:1024,fit:'inside',withoutEnlargement:true}).png().toBuffer();
  // A single supported input_image_0 carries BOTH material and product identity.
  const panel=bytes=>sharp(bytes).rotate().resize(512,1024,{fit:'contain',background:'#efeee9'}).png().toBuffer();
  const [material,product]=await Promise.all([panel(original),panel(hero)]);
  return sharp({create:{width:1024,height:1024,channels:3,background:'#efeee9'}}).composite([{input:material,left:0,top:0},{input:product,left:512,top:0}]).png().toBuffer();
}
async function prepare(runId,conceptId,proposalId,visualNotes='',options={}){
  const viewRole=options.viewRole||'HERO',reference=options.reference,design=options.designSpecification;
  if(design)await identity.assertActive(design);
  if(!VIEWS[viewRole])throw fail(400,'INVALID_PREVIEW_VIEW');
  const run=await Run.findById(runId);if(!run)throw fail(404,'CONCEPT_RUN_NOT_FOUND');await ensureCurrent(run);
  const concept=run.concepts.find(c=>c.id===conceptId);if(!concept?.assessment.schemaValid)throw fail(409,'VALID_CONCEPT_REQUIRED');
  let proposal;if(proposalId){proposal=await Proposal.findById(proposalId).lean();if(!proposal||String(proposal.runId)!==run.id||proposal.conceptId!==conceptId)throw fail(409,'PROPOSAL_SOURCE_MISMATCH');if(proposal.reviewVersion!==concept.reviewVersion)throw fail(409,'CURRENT_SOURCE_AND_REVIEW_REQUIRED');}
  if(design&&(design.runId!==run.id||design.conceptId!==conceptId||design.reviewVersion!==concept.reviewVersion||design.proposalId!==(proposalId||null)))throw fail(409,'DESIGN_PROPOSAL_VERSION_MISMATCH');
  const sourceHash=run.sourceSnapshot.hash,conceptHash=concept.assessment.provenance.proposalSha256;
  const provenance={runId:run.id,conceptId,conceptHash,reviewVersion:concept.reviewVersion,sourceHash,analysisId:run.sourceSnapshot.selectedPhoto?.analysisId,
    proposalId:proposal?._id?.toString()||null,proposalVersion:proposal?.version||null,proposalHash:proposal?.provenance.inputSha256||null,sourceImageSha256:null,
    label:'ILLUSTRATIVE_AI_PREVIEW',physicalAccuracy:'UNVERIFIED',conditioning:reference?'SOURCE_AND_HERO_REFERENCE_BOARD':'ACTUAL_SOURCE_PHOTO_APPROXIMATE_VISUAL_REFERENCE',visualNotes,
    ...(design?{designFingerprint:design.fingerprint,designVersion:design.version,designSpecification:design,imageCategory:proposal?.previewSvg&&!design.conflicts.length?'CURRENT_DESIGN':'EXPLORATORY_CONCEPT'}:{}),previewPolicy:POLICY,viewRole,previewSetId:options.previewSetId||null,referencePreviewId:reference?.operationId||null,referenceImageSha256:reference?.imageSha256||null};
  const p=concept.assessment.proposal;
  let technical=null;
  if(proposal&&proposal.status!=='REJECTED'&&proposal.previewSvg){
    let data=proposal.originalInput?.proposal;if(!data&&proposal.originalInput?.rawProposalText)try{data=JSON.parse(proposal.originalInput.rawProposalText);}catch{}
    const t=data?.design?.data?.technical,layout=proposal.assessment?.preliminaryGeometry?.result||proposal.feasibility?.evidence?.nesting;
    technical={evidence:'UNVERIFIED_DESIGN_PROPOSAL',pieces:t?.patternPieces?.map(piece=>({id:piece.id,copies:piece.cutCount,cuttingOutlines:data?.context?.instances?.filter(i=>i.pieceId===piece.id).map(i=>({copy:i.copy,polygonCm:i.cuttingPolygonCm})),allowanceCm:piece.seamAllowanceCm,folds:piece.folds})),
      requiredMaterials:t?.bom?.map(b=>({type:b.material?.type,quantity:b.quantity,source:b.source.kind,availability:'NOT_VERIFIED'})),
      proposedAssembly:proposal.assessment?.constructionPlan?.instructions||t?.assembly,
      layout:layout?{status:layout.status,placements:layout.placements,area:layout.areaSummary}:null};
  }
  const visualSpecification=options.visualSpecification||(reference?.visualSpecification?.visualDesign?reference.visualSpecification:null)||specification(p,run.sourceSnapshot,technical,visualNotes,design),prompt=promptFor(visualSpecification,viewRole,!!reference)+(reference&&visualNotes?'\nView-specific direction only; preserve product identity: '+visualNotes:'');
  if(design){if(visualSpecification.designIdentity?.fingerprint!==design.fingerprint)throw fail(409,'PREVIEW_DESIGN_CONFLICT');identity.assertPrompt(design,visualSpecification.visualDesign,visualNotes);}
  provenance.visualSpecificationSha256=fingerprint(visualSpecification);
  return {run,concept,provenance,prompt,reference,visualSpecification,fingerprint:fingerprint({policy:POLICY,designFingerprint:design?.fingerprint||null,sourceHash,conceptHash,reviewVersion:concept.reviewVersion,proposalHash:provenance.proposalHash,visualNotes,viewRole,referencePreviewId:provenance.referencePreviewId,referenceImageSha256:provenance.referenceImageSha256})};
}
async function generate(prepared,projectId,campaignId,runtime){
  validateRuntime(runtime);const {provenance,prompt,run}=prepared;
  const file=run.sourceSnapshot.selectedPhoto?.photoPath;if(!file||!fs.existsSync(file))throw fail(409,'SOURCE_PHOTO_UNAVAILABLE');
  const resolved=fs.realpathSync(file),root=fs.realpathSync(DATA);if(!resolved.toLowerCase().startsWith((root+path.sep).toLowerCase()))throw fail(403,'INVALID_SOURCE_PHOTO_PATH');
  const original=fs.readFileSync(resolved);let referenceBytes;
  if(prepared.reference){const refRoot=fs.realpathSync(path.join(DATA,'creation-previews')),refPath=fs.realpathSync(prepared.reference.filePath);
    if(!refPath.toLowerCase().startsWith((refRoot+path.sep).toLowerCase()))throw fail(403,'INVALID_PREVIEW_PATH');referenceBytes=fs.readFileSync(refPath);
    if(hash(referenceBytes)!==provenance.referenceImageSha256)throw fail(409,'PREVIEW_REFERENCE_CHANGED');}
  const material=await fabricReference(original,run.sourceSnapshot),conditioning=await makeConditioning(material.bytes,referenceBytes);
  provenance.sourceImageSha256=hash(original);provenance.conditioningImageSha256=hash(conditioning);provenance.materialReference={...material.info,imageSha256:hash(material.bytes)};
  const directory=path.join(runtime.root,'campaigns',campaignId);fs.mkdirSync(path.dirname(directory),{recursive:true});fs.mkdirSync(directory);
  const save=(name,data)=>writeNew(path.join(directory,name),data,[process.env.CF_ACCOUNT_ID,process.env.CF_API_TOKEN,process.env.MONGODB_URI]);
  save('lock.json',{campaignId,model:runtime.imageProvider.model,maxRequests:1,maxRepairs:0,execution:runtime.testing?'TEST_FIXTURE':'LIVE'});
  fs.writeFileSync(path.join(directory,'material-reference.png'),material.bytes,{flag:'wx'});
  save('request.json',{prompt,provenance,width:1024,height:1024});const slot=openBudget(runtime.root).reserve(campaignId,1);save('attempt-1.json',{state:'RESERVED_BEFORE_INFERENCE',globalSlot:slot,requestsDispatched:1});
  let response;try{response=await runtime.imageProvider.generate({prompt,sourceImage:conditioning});}catch(e){save('failure.json',{code:e.code||'PROVIDER_FAILURE',httpStatus:e.status??null,diagnostics:e.diagnostics??null,outcome:'MAY_HAVE_EXECUTED'});throw e;}
  const meta=await sharp(response.bytes).metadata();if(!['png','jpeg'].includes(meta.format)||!meta.width||!meta.height)throw fail(502,'INVALID_IMAGE_RESPONSE');
  const folder=path.join(DATA,'creation-previews',String(projectId));fs.mkdirSync(folder,{recursive:true});const output=path.join(folder,randomUUID()+'.'+(meta.format==='png'?'png':'jpg'));
  fs.writeFileSync(output,response.bytes,{flag:'wx'});
  let stale=false;try{const latest=await prepare(run.id,provenance.conceptId,provenance.proposalId,provenance.visualNotes,{viewRole:provenance.viewRole,reference:prepared.reference,visualSpecification:prepared.visualSpecification,designSpecification:prepared.provenance.designSpecification});stale=latest.fingerprint!==prepared.fingerprint;}catch{stale=true;}
  const preview={...provenance,fingerprint:prepared.fingerprint,prompt,model:runtime.imageProvider.model,httpStatus:response.httpStatus??null,usage:response.usage??null,
    visualSpecification:prepared.visualSpecification,execution:runtime.testing?'TEST_FIXTURE':'LIVE',createdAt:new Date().toISOString(),filePath:output,imageSha256:hash(response.bytes),contentType:'image/'+(meta.format==='png'?'png':'jpeg'),width:meta.width,height:meta.height,
    stale,artisticAssumptions:['Undefined colors/finishing and attachment presentation are illustrative','Source-photo conditioning does not verify material or texture','No finished physical product is depicted'],manufacturingVerified:false};
  save('result.json',preview);return preview;
}
module.exports={prepare,generate,makeConditioning};
