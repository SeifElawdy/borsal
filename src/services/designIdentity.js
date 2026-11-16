// Versioned project snapshots of the existing source/concept/proposal records.
// No new design engine: explicit construction selections alone may change requirements.
const {fingerprint}=require('../../experiments/ai-pattern-proposals/adapter');
const {fail}=require('./conceptFlow');
const {dimensions,area}=require('../geometry/polygon');
const POLICY='borsal.design-identity/0.1';
function closure(text){
 const s=String(text||'').toLowerCase(),rules={VELCRO:/velcro|hook.and.loop/,DRAWSTRING:/drawstring|draw.string/,ZIPPER:/zipper|\bzipped\b/,SNAP:/magnetic.snap|\bsnap\b/,BUTTON:/\bbutton\b/,TUCK:/tucked.corner|tuck.closure/,BUCKLE:/\bbuckle\b/,TOGGLE:/\btoggle\b/,HOOK:/hook.closure|hook.fastener/,TIE:/tie.closure|tied.closure/};
 if(/no closure|without (a )?closure|open.top|open sleeve/.test(s))return {kind:'NONE',description:'Open; no closure'};
 const found=Object.entries(rules).filter(([,r])=>r.test(s)).map(([k])=>k);
 return {kind:found.length===1?found[0]:found.length?'MULTIPLE':'UNKNOWN',description:found.length?found.join(' / '):'Closure not specified',requirements:found};
}
function proposedClosure(proposal){let data=proposal?.originalInput?.proposal;if(!data&&proposal?.originalInput?.rawProposalText)try{data=JSON.parse(proposal.originalInput.rawProposalText);}catch{}const engineering=proposal?.provenance?.derivation?.engineering?.plan||(data?.schemaVersion==='borsal.engineering-plan/0.1'?data:null);if(engineering)return {kind:engineering.closure,description:'Proposed '+engineering.closure+' closure'};const intent=proposal?.provenance?.derivation?.constructionIntent||data;if(intent?.method==='TWO_PANEL_SNAP_FLAP_POUCH')return {kind:'SNAP',description:'Proposed paired magnetic snap with integral flap'};if(intent?.method==='TWO_PANEL_OPEN_SLEEVE')return {kind:'NONE',description:'Open sleeve; no closure'};const t=data?.design?.data?.technical;return closure(JSON.stringify({features:t?.features,hardware:t?.bom?.filter(b=>b.material?.type==='HARDWARE').map(b=>b.material.specs)}));}
function engineeringConflicts(spec,plan){if(!plan)return [];const issues=[];if(plan.name!==spec.product.name)issues.push({code:'DESIGN_NAME_REVIEW_REQUIRED',message:'Proposed product name differs from the approved design. Explicit selection is required.'});if(plan.function!==spec.product.intendedFunction)issues.push({code:'DESIGN_FUNCTION_REVIEW_REQUIRED',message:'Proposed function differs from the approved design. Review the changed interpretation explicitly.'});return issues;}
function technicalConflicts(spec,proposal){const actual=proposedClosure(proposal),required=spec.product.closure;let data=proposal.originalInput?.proposal;try{if(proposal.originalInput?.rawProposalText)data=JSON.parse(proposal.originalInput.rawProposalText);}catch{}const plan=proposal.provenance?.derivation?.engineering?.plan||(data?.schemaVersion==='borsal.engineering-plan/0.1'?data:null),issues=engineeringConflicts(spec,plan);if(actual.kind!=='UNKNOWN'&&required.kind!=='UNKNOWN'&&actual.kind!==required.kind)issues.push({code:'CONSTRUCTION_REQUIREMENT_CONFLICT',message:'Required '+required.description+'; proposal uses '+actual.description+'. Explicit alternative selection is required.'});return issues;}

function context(project,run,concept,proposal){
 if(String(project.fabricId)!==String(run.fabricId)||!run.concepts.some(c=>c.id===concept.id))throw fail(409,'DESIGN_SOURCE_MISMATCH');
 if(proposal&&(String(proposal.runId)!==String(run._id)||proposal.conceptId!==concept.id||proposal.reviewVersion!==concept.reviewVersion||proposal.provenance.fabricSourceHash!==run.sourceSnapshot.hash))throw fail(409,'DESIGN_PROPOSAL_VERSION_MISMATCH');
 return {projectId:String(project._id),fabricId:String(run.fabricId),runId:String(run._id),conceptId:concept.id,conceptHash:concept.assessment.provenance.proposalSha256,reviewVersion:concept.reviewVersion,reviewHash:fingerprint(concept.reviews.at(-1)?.review||null),sourceHash:run.sourceSnapshot.hash,proposalId:proposal?String(proposal._id):null,proposalVersion:proposal?.version||null,proposalHash:proposal?.provenance.inputSha256||null};
}
function content(project,run,concept,proposal){
 const refs=context(project,run,concept,proposal),c=concept.assessment.proposal,features=(c.distinctiveFeatures||[]).map(f=>f.description),required=closure([c.productIdea.description,c.intendedUse,...features,...(c.constraints||[]),concept.reviews.at(-1)?.review.draftingBrief?.brief?.text||''].join(' '));
 let intent=proposal?.provenance?.derivation?.constructionIntent,explicit=proposal?.provenance?.derivation?.explicitlySelected===true;

 let data=proposal?.originalInput?.proposal;if(!data&&proposal?.originalInput?.rawProposalText)try{data=JSON.parse(proposal.originalInput.rawProposalText);}catch{}
 if(!intent&&data?.schemaVersion==='borsal.construction-intent/0.1')intent=data;
 let proposed=null;if(intent?.method==='TWO_PANEL_SNAP_FLAP_POUCH')proposed={kind:'SNAP',description:'Proposed paired magnetic snap with integral flap'};else if(intent?.method==='TWO_PANEL_OPEN_SLEEVE')proposed={kind:'NONE',description:'Open sleeve; no closure'};
 const engineering=proposal?.provenance?.derivation?.engineering?.plan||(data?.schemaVersion==='borsal.engineering-plan/0.1'?data:null);if(engineering)proposed={kind:engineering.closure,description:'Proposed '+engineering.closure+' closure'};const t=data?.design?.data?.technical;if(!proposed&&t){const detected=closure(JSON.stringify({features:t.features,hardware:t.bom?.filter(b=>b.material?.type==='HARDWARE').map(b=>b.material.specs)}));if(detected.kind!=='UNKNOWN')proposed=detected;}
 const conflicting=proposed&&required.kind!=='UNKNOWN'&&required.kind!==proposed.kind;
 const conflicts=conflicting&&!explicit?[{code:'CONSTRUCTION_REQUIREMENT_CONFLICT',message:`Required ${required.description}; proposal uses ${proposed.description}. Explicit alternative selection is required.`}]:[];
 if(engineering&&!explicit)conflicts.push(...engineeringConflicts({product:{name:c.productIdea.name,intendedFunction:c.intendedUse}},engineering));
 const selected=explicit&&proposed?proposed:required;
 return {schemaVersion:POLICY,...refs,product:{name:engineering&&explicit?engineering.name:intent&&explicit?intent.name:c.productIdea.name,category:c.productIdea.category||c.category||null,intendedFunction:explicit&&engineering?engineering.function:explicit&&intent?intent.function:c.intendedUse,silhouette:engineering&&explicit?engineering.function:intent&&explicit?intent.method==='TWO_PANEL_SNAP_FLAP_POUCH'?'Flat pocket with integral fold-over back flap':intent.function:c.productIdea.description,closure:selected,distinctiveDetails:explicit&&intent?[intent.function,...(proposal?.provenance?.derivation?.candidate?.pieces||[]).map(p=>p.name),...(proposed?[proposed.description]:[])]:features,attachments:explicit?(proposal?.provenance?.derivation?.candidate?.assembly||[]).filter(a=>a.type==='INSTALL').map(a=>a.material):features.filter(f=>/\b(strap|handle|ring|loop|attachment|hook)\b/i.test(f))},
  originalRequirements:{name:c.productIdea.name,closure:required,features},construction:{method:engineering?'COMPOSABLE_OPERATIONS':intent?.method||null,explicitlySelected:explicit,componentRoles:proposal?.provenance?.derivation?.candidate?.pieces?.map(p=>({name:p.name,role:p.role,quantity:p.quantity}))||t?.components?.map(c=>({name:c.id,role:c.role,pieceIds:c.pieceIds}))||[],proposedDimensions:intent?{cutWidthCm:intent.cutWidthCm??null,cutHeightCm:intent.cutHeightCm??null,flapLengthCm:intent.flapLengthCm??null}:t?.overallDimensions||null},
  sourceConstraints:{...dimensions(run.sourceSnapshot.polygonCm),usableAreaCm2:area(run.sourceSnapshot.polygonCm)-(run.sourceSnapshot.holes||[]).reduce((n,h)=>n+area(h),0),material:'UNKNOWN',grain:run.sourceSnapshot.grainDirectionDeg==null?'UNKNOWN':{declaredDirectionDeg:run.sourceSnapshot.grainDirectionDeg,status:'USER_DECLARED_UNVERIFIED'},physicalAccuracy:'UNVERIFIED'},
  changes:explicit?[...(engineering?.changes||intent?.creativeChanges||[]),...(conflicting?[`Closure changed from ${required.description} to ${proposed.description} by explicit construction selection.`]:[])]:[],
  unresolved:[...(c.unresolvedRequirements||[]).map(r=>r.description),...(engineering?.unresolved||intent?.unresolved||[]),'Physical construction and source material/stock remain unverified'],conflicts,manufacturingVerified:false};
}
function resolve(project,run,concept,proposal){
 const value=content(project,run,concept,proposal),contextHash=fingerprint(value),existing=(project.designVersions||[]).find(v=>v.contextHash===contextHash);
 return existing||{...value,contextHash,version:0,fingerprint:null,persisted:false};
}
function binding(project,run,concept,proposal){
 let history=project.designVersions||[];if(proposal&&!history.some(v=>v.runId===String(run._id)&&v.conceptId===concept.id&&v.reviewVersion===concept.reviewVersion&&!v.proposalId)){const base=binding({...project.toObject?.()||project,designVersions:history},run,concept,null);history=base.fields.designVersions;project={...project.toObject?.()||project,designVersions:history,activeDesignFingerprint:base.spec.fingerprint};}
 let spec=resolve({...project.toObject?.()||project,designVersions:history},run,concept,proposal);
 if(!spec.persisted){const version=history.length+1,parentFingerprint=project.activeDesignFingerprint||null;spec={...spec,version,parentFingerprint,persisted:true};spec.fingerprint=fingerprint(spec);history=[...history,spec];}
 return {spec,fields:{designVersions:history,activeDesignFingerprint:spec.fingerprint}};
}
async function bind(project,run,concept,proposal){
 const b=binding(project,run,concept,proposal);if(project.activeDesignFingerprint!==b.spec.fingerprint){project.set(b.fields);await project.save();}return b.spec;
}
async function assertActive(spec){
 const p=await require('../models/CreationProject').Project.findById(spec.projectId).lean();if(!p||String(p.fabricId)!==spec.fabricId||p.activeDesignFingerprint!==spec.fingerprint||(p.selection?.conceptId&&(p.selection.conceptId!==spec.conceptId||p.selection.runId!==spec.runId)))throw fail(409,'DESIGN_VERSION_CHANGED');
 const r=await require('../models/ConceptRun').findById(spec.runId);if(!r)throw fail(409,'DESIGN_VERSION_CHANGED');await require('./conceptFlow').ensureCurrent(r);const c=r.concepts.find(c=>c.id===spec.conceptId);if(!c||c.reviewVersion!==spec.reviewVersion||c.assessment.provenance.proposalSha256!==spec.conceptHash||fingerprint(c.reviews.at(-1)?.review||null)!==spec.reviewHash)throw fail(409,'DESIGN_VERSION_CHANGED');
}
function assertPrompt(spec,visual,notes=''){
 if(spec.conflicts.length)throw fail(409,'DESIGN_CONSTRUCTION_CONFLICT');
 for(const s of [visual?.openingClosure,visual?.silhouette,visual?.detailFocus,...(visual?.distinguishingDetails||[]),notes]){if(!s)continue;const requested=closure(s);if(requested.kind!=='UNKNOWN'&&requested.kind!==spec.product.closure.kind&&!(spec.product.closure.kind==='MULTIPLE'&&requested.requirements?.every(k=>spec.product.closure.requirements?.includes(k))))throw fail(409,'PREVIEW_DESIGN_CONFLICT');}
}
function promptRequirements(spec){return {designFingerprint:spec.fingerprint,sourceReference:'fabric-'+spec.fabricId,name:spec.product.name,function:spec.product.intendedFunction,silhouette:spec.product.silhouette,closure:spec.product.closure,details:spec.product.distinctiveDetails,attachments:spec.product.attachments,construction:spec.construction.method,unresolved:spec.unresolved};}
module.exports={POLICY,closure,proposedClosure,technicalConflicts,content,resolve,binding,bind,assertActive,assertPrompt,promptRequirements};
