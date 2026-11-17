// Additive transport/identity adapter; the existing engineering compiler is unchanged.
const {z}=require('zod'),{createHash}=require('crypto'),engineering=require('./productEngineering');
const VERSION='borsal.blueprint/0.1',obj=s=>z.object(s).strict(),text=z.string().min(1).max(500).refine(v=>v===v.trim(),'FIELD_WHITESPACE_NOT_ALLOWED'),n=z.number().finite(),positive=n.positive().max(1000);
const key=z.string().regex(/^[a-z][a-z0-9_]{0,31}$/),index=z.number().int().min(0).max(23);
const componentRef=obj({kind:z.literal('component_instance'),ref:z.string().regex(/^[a-z][a-z0-9_]{0,31}(#[1-9][0-9]?)?$/)});
const hardwareRef=obj({kind:z.literal('hardware'),ref:key});
const anchor=obj({...componentRef.shape,edge:index,fraction:n.min(0).max(1),insetCm:n.min(0).max(1000)});
const side=obj({...componentRef.shape,edges:z.array(index).min(1).max(24),direction:z.enum(['FORWARD','REVERSE'])});
const operation=z.discriminatedUnion('type',[
 obj({type:z.literal('SEAM'),sides:z.tuple([side,side]),thread:hardwareRef,instruction:text}),
 obj({type:z.literal('ATTACH'),from:anchor,to:anchor,thread:hardwareRef,instruction:text}),
 obj({type:z.literal('INSTALL'),material:hardwareRef,anchors:z.array(anchor).min(1).max(6),instruction:text}),
 obj({type:z.literal('LAYER'),layers:z.array(anchor).min(2).max(6),thread:hardwareRef,instruction:text}),
 obj({type:z.literal('FINISH'),component:componentRef,scope:z.literal('ALL_COPIES'),edges:z.array(index).min(1).max(24),method:z.literal('OVERCAST'),thread:hardwareRef,instruction:text}),
 obj({type:z.literal('FOLD'),component:componentRef,scope:z.literal('ALL_COPIES'),method:z.literal('HEM'),axis:z.enum(['HORIZONTAL','VERTICAL']),offsetCm:n.min(0).max(1000),spanStartCm:n.min(0).max(1000),spanEndCm:n.min(0).max(1000),allowanceCm:positive,instruction:text})]);
const materialSchema=require('./designCandidate').candidateSchema.shape.materials.unwrap().element;
const requirement=z.discriminatedUnion('type',materialSchema.shape.requirement.options.filter(s=>['THREAD','ZIPPER','BUTTON','HARDWARE'].includes(s.shape.type.value)));
const material=obj({key,role:text,requirement,quantity:materialSchema.shape.quantity.optional(),threadEstimate:materialSchema.shape.threadEstimate.optional()}).superRefine((v,c)=>{if(Number(!!v.quantity)+Number(!!v.threadEstimate)!==1)c.addIssue({code:'custom',path:['quantity'],message:'EXPLICIT_MATERIAL_DEMAND_REQUIRED'});if(v.threadEstimate&&v.requirement.type!=='THREAD')c.addIssue({code:'custom',path:['threadEstimate'],message:'THREAD_ESTIMATE_REQUIRES_THREAD'});});
const schema=obj({closure:engineering.schema.shape.closure,
 components:z.array(obj({key,role:text,shape:z.enum(['RECT','ELLIPSE']),widthCm:positive,heightCm:positive,quantity:z.number().int().min(1).max(20),allowanceCm:n.min(0).max(100),allowedRotationsDeg:z.array(n.min(0).lt(360)).min(1).max(16).optional()})).min(1).max(12),
 materials:z.array(material).max(20),operations:z.array(operation).max(30),unresolved:z.array(obj({reason:text,affectedKeys:z.array(key).max(32)})).max(8)});
const issue=(code,path,message=code)=>({code,path,message});
function reject(errors){return {status:'REJECT',errors};}
// Only authoritative structured slots, never product-name/description inference.
// Shared by read-only preflight, protected dispatch and the strict expander.
function compatibility(context){
 const c=context?.product?.closure,kind=c?.kind,requirements=Array.isArray(c?.requirements)?c.requirements:[],malformedRequirements=c?.requirements!=null&&!Array.isArray(c.requirements),blocks=[],warnings=[];
 const supported=['NONE','ZIPPER','BUTTON','SNAP'],unspecified=kind==='UNKNOWN',known=typeof kind==='string'&&kind.length>0;
 const mandatory=c?.mandatory===true||c?.required===true||requirements.length>0||malformedRequirements||known&&!['UNKNOWN','NONE','MULTIPLE'].includes(kind);
 const named=malformedRequirements?JSON.stringify(c.requirements):requirements.length?JSON.stringify(requirements):c?.description||kind||'Unnamed mandatory closure';
 if(mandatory&&(malformedRequirements||!known||unspecified||kind==='MULTIPLE'||requirements.some(r=>r!==kind)))blocks.push({code:'MANDATORY_CLOSURE_CLARIFICATION_REQUIRED',path:['product','closure'],requirement:named,message:'Explicit mandatory closure is ambiguous, malformed or contradictory; clarify it before generation.'});
 else if(mandatory&&!supported.includes(kind))blocks.push({code:'UNSUPPORTED_MANDATORY_CLOSURE',path:['product','closure'],requirement:named,message:'Mandatory closure '+kind+' has no supported Blueprint material/INSTALL representation.'});
 else if(!known||kind==='MULTIPLE'||!supported.includes(kind))warnings.push({code:unspecified?'CLOSURE_UNSPECIFIED':'CLOSURE_METADATA_AMBIGUOUS',message:'No interpretable mandatory closure is recorded. Keep UNKNOWN; an open proposal is optional only if it preserves the approved function.'});
 const attachments=context?.product?.attachments;
 for(const attachment of Array.isArray(attachments)?attachments:attachments==null?[]:[attachments])blocks.push({code:'ATTACHMENT_REQUIREMENT_NOT_STRUCTURED',path:['product','attachments'],requirement:typeof attachment==='string'?attachment:JSON.stringify(attachment),message:'This authoritative attachment requirement lacks a supported structured Blueprint mapping; clarification is required.'});
 return {status:blocks.length?'BLOCKED':'ALLOWED',expectedClosure:known&&supported.includes(kind)?kind:'UNKNOWN',blocks,warnings,physicalManufacturingReadiness:'NOT_VERIFIED'};
}
function validate(input,context){
 const parsed=schema.safeParse(input);
 if(!parsed.success)return reject(parsed.error.issues.flatMap(i=>i.code==='unrecognized_keys'?i.keys.map(k=>issue('UNKNOWN_FIELD',[...i.path,k])):[issue(i.message.endsWith('_REQUIRED')?i.message:'INVALID_FIELD',i.path,i.message)]));
 const b=parsed.data,errors=[],components=new Map(),materials=new Map();
 const add=(code,path)=>errors.push(issue(code,path));
 for(const [list,map]of [[b.components,components],[b.materials,materials]])for(const [i,c]of list.entries()){if(components.has(c.key)||materials.has(c.key))add('DUPLICATE_KEY',[map===components?'components':'materials',i,'key']);map.set(c.key,c);}
 function component(r,path){const [k,num]=r.ref.split('#'),c=components.get(k);if(!c){add(materials.has(k)?'REFERENCE_KIND_MISMATCH':'UNRESOLVED_REFERENCE',path);return null;}if(!num&&c.quantity>1){add('AMBIGUOUS_INSTANCE_REFERENCE',path);return null;}const copy=num?Number(num):1;if(copy>c.quantity){add('UNRESOLVED_REFERENCE',path);return null;}return {c,copy};}
 function hardware(r,path,thread=false){const m=materials.get(r.ref);if(!m)add(components.has(r.ref)?'REFERENCE_KIND_MISMATCH':'UNRESOLVED_REFERENCE',path);else if(thread&&m.requirement.type!=='THREAD')add('THREAD_REQUIREMENT_REQUIRED',path);return m;}
 function anchored(r,path){const resolved=component(r,path);if(resolved&&r.edge>=(resolved.c.shape==='RECT'?4:24))add('INVALID_EDGE',path);return resolved;}
 for(const [i,o]of b.operations.entries()){
  const p=['operations',i];if(o.thread)hardware(o.thread,[...p,'thread'],true);if(o.material)hardware(o.material,[...p,'material']);
  if(o.sides)for(const [j,r]of o.sides.entries()){const t=component(r,[...p,'sides',j]);if(t&&(new Set(r.edges).size!==r.edges.length||r.edges.some(e=>e>=(t.c.shape==='RECT'?4:24))))add('INVALID_EDGE',[...p,'sides',j,'edges']);}
  for(const [name,refs]of [['anchors',o.anchors],['layers',o.layers],['from',o.from?[o.from]:null],['to',o.to?[o.to]:null]])if(refs)refs.forEach((r,j)=>anchored(r,[...p,name,j]));
  if(o.component){const t=component(o.component,[...p,'component']);if(t){if(t.copy!==1)add('ALL_COPIES_SCOPE_REQUIRES_FIRST_INSTANCE',[...p,'component']);if(o.edges&&(new Set(o.edges).size!==o.edges.length||o.edges.some(e=>e>=(t.c.shape==='RECT'?4:24))))add('INVALID_EDGE',[...p,'edges']);if(o.type==='FOLD'&&o.spanEndCm<=o.spanStartCm)add('INVALID_FOLD_SPAN',p);}}
 }
 b.unresolved.forEach((u,i)=>u.affectedKeys.forEach(k=>{if(!components.has(k)&&!materials.has(k))add('UNRESOLVED_REFERENCE',['unresolved',i,'affectedKeys']);}));
 if(!context||!['projectId','fabricId','sourceHash','fingerprint'].every(k=>typeof context[k]==='string'&&context[k].length>0)||!Number.isSafeInteger(context.version)||context.version<1||!context.product?.name||!context.product?.intendedFunction)add('AUTHORITATIVE_CONTEXT_REQUIRED',[]);
 else {
  const gate=compatibility(context);errors.push(...gate.blocks.map(e=>({...e,message:e.message+' Requirement: '+e.requirement})));
  // Missing nonmandatory metadata is represented by UNKNOWN in a read-only view;
  // never persist/reword the original identity or reinterpret a mandatory clause.
  const view=context.product.closure?context:{...context,product:{...context.product,closure:{kind:'UNKNOWN'}}};
  const conflicts=require('./designIdentity').technicalConflicts(view,{originalInput:{proposal:{schemaVersion:engineering.VERSION,name:context.product.name,function:context.product.intendedFunction,closure:b.closure}}});
  conflicts.forEach(c=>errors.push(issue('DESIGN_IDENTITY_CONFLICT',[],c.message||c.code)));
  if(b.closure!==gate.expectedClosure&&!errors.some(e=>e.code==='DESIGN_IDENTITY_CONFLICT'))add('DESIGN_IDENTITY_CONFLICT',['closure']);
  const required={ZIPPER:'ZIPPER',BUTTON:'BUTTON',SNAP:'HARDWARE'}[gate.expectedClosure];
  if(required&&!b.operations.some(o=>o.type==='INSTALL'&&materials.get(o.material.ref)?.requirement.type===required&&(b.closure!=='SNAP'||materials.get(o.material.ref)?.requirement.specs.kind==='MAGNETIC_SNAP')))add('MANDATORY_CLOSURE_INSTALL_REQUIRED',['operations']);
 }
 return errors.length?reject(errors):{status:'VALID',blueprint:b};
}
function parse(response,context){
 if(response?.finishReason!=='stop'||response?.truncated===true||typeof response?.text!=='string'||!response.text.trim())return {status:'FAIL',errors:[issue('INCOMPLETE_FINAL_OUTPUT',[])]};
 const normalizations=[];let text=response.text.trim();if(text!==response.text)normalizations.push('SURROUNDING_WHITESPACE');
 const fence=/^```(?:json)?\r?\n([\s\S]*)\r?\n```$/.exec(text);if(fence){text=fence[1];normalizations.push('SINGLE_MARKDOWN_FENCE');}
 let raw;try{raw=JSON.parse(text);}catch{return {status:'FAIL',errors:[issue('INVALID_JSON',[])],normalizations};}
 return {...validate(raw,context),normalizations};
}
function expand(input,context,provenance){
 if(!['LIVE_AI','MOCK','FIXTURE','HUMAN'].includes(provenance))throw Error('HOST_PROVENANCE_REQUIRED');
 const checked=validate(input,context);if(checked.status!=='VALID')return checked;
 const b=checked.blueprint,cs=[...b.components].sort((a,b)=>a.key.localeCompare(b.key)),ms=[...b.materials].sort((a,b)=>a.key.localeCompare(b.key));
 const byKey=new Map(cs.map(c=>[c.key,c])),name=k=>k;
 const ref=r=>{const [k,n]=r.ref.split('#');return {piece:name(k),copy:n?Number(n):1};};
 const point=r=>{const rr=ref(r),c=byKey.get(rr.piece),ring=engineering.ring({type:c.shape,width:c.widthCm,height:c.heightCm}),a=ring[r.edge],d=ring[(r.edge+1)%ring.length],dx=d[0]-a[0],dy=d[1]-a[1],length=Math.hypot(dx,dy);return {...rr,point:[a[0]+r.fraction*dx-r.insetCm*dy/length,a[1]+r.fraction*dy+r.insetCm*dx/length]};};
 const operations=b.operations.map(o=>{const common={type:o.type,instruction:o.instruction};switch(o.type){
  case 'SEAM':return {...common,sides:o.sides.map(s=>({...ref(s),edges:s.edges,direction:s.direction})),thread:o.thread.ref};
  case 'ATTACH':return {...common,from:point(o.from),to:point(o.to),thread:o.thread.ref};
  case 'INSTALL':return {...common,material:o.material.ref,anchors:o.anchors.map(point)};
  case 'LAYER':return {...common,layers:o.layers.map(point),thread:o.thread.ref};
  case 'FINISH':return {...common,piece:ref(o.component).piece,edges:o.edges,method:o.method,thread:o.thread.ref};
  case 'FOLD':return {...common,piece:ref(o.component).piece,method:o.method,from:o.axis==='HORIZONTAL'?[o.spanStartCm,o.offsetCm]:[o.offsetCm,o.spanStartCm],to:o.axis==='HORIZONTAL'?[o.spanEndCm,o.offsetCm]:[o.offsetCm,o.spanEndCm],allowance:o.allowanceCm};
 }});
 const plan={schemaVersion:engineering.VERSION,name:context.product.name,function:context.product.intendedFunction,closure:b.closure,
  components:cs.map(c=>({name:c.key,purpose:c.role,role:c.role,quantity:c.quantity,shape:{type:c.shape,width:c.widthCm,height:c.heightCm},allowanceCm:c.allowanceCm,...(c.allowedRotationsDeg?{allowedRotationsDeg:c.allowedRotationsDeg}:{})})),
  materials:ms.map(m=>({name:m.key,requirement:m.requirement,...(m.quantity?{quantity:m.quantity}:{threadEstimate:m.threadEstimate})})),operations,changes:[],unresolved:b.unresolved.map(u=>u.reason)};
 const planCheck=engineering.schema.safeParse(plan);if(!planCheck.success)return reject(planCheck.error.issues.map(i=>issue('INVALID_EXPANDED_PLAN',i.path,i.message)));
 const id=(k,i)=>'bp-'+createHash('sha256').update(JSON.stringify([context.projectId,context.fabricId,context.sourceHash,context.fingerprint,context.version,k,i])).digest('hex');
 const metadata={schemaVersion:VERSION,provenance,designFingerprint:context.fingerprint,designVersion:context.version,projectId:context.projectId,sourceHash:context.sourceHash,requirementCompatibility:compatibility(context),
  status:b.unresolved.length?'HAS_UNRESOLVED_ITEMS':'EXPANDED',unresolved:structuredClone(b.unresolved),physicalManufacturingReadiness:'NOT_VERIFIED',blueprint:b,
  components:cs.map((c,i)=>({key:c.key,role:c.role,id:id(c.key,0),allowanceCm:c.allowanceCm,compilerAlias:'piece-'+(i+1),instances:Array.from({length:c.quantity},(_,j)=>({ref:c.key+'#'+(j+1),id:id(c.key,j+1),compilerAlias:'piece-'+(i+1)+'-'+(j+1)}))})),materials:ms.map(m=>({key:m.key,id:id(m.key,0)}))};
 return {status:'EXPANDED',plan,metadata};
}
function assess(input,context,source,concept,provenance){const out=expand(input,context,provenance);if(out.status!=='EXPANDED')return out;const compiled=engineering.assess(out.plan,source,concept),screening=compiled.result.screening;
 const placed=new Set((screening?.status==='LAYOUT_FOUND'?screening.placements:screening?.bestPartial?.placements||[]).map(p=>p.id));
 out.metadata.assessment={geometryStatus:screening?.status||'NOT_EVALUATED',nestingReason:screening?.reason||null,unplacedInstances:out.metadata.components.flatMap(c=>c.instances.filter(i=>!placed.has(i.compilerAlias)).map(i=>i.ref)),assemblyConsistency:compiled.result.errors.length?'VALIDATION_FAILED':'REFERENCE_CHECKS_PASSED_NOT_FUNCTIONAL_PROOF',findings:compiled.result.errors,physicalManufacturingReadiness:'NOT_VERIFIED'};
 compiled.result.blueprint=out.metadata;compiled.result.unresolved.push(...out.metadata.unresolved.map(u=>({code:'HAS_UNRESOLVED_ITEMS',message:u.reason,affectedKeys:u.affectedKeys,validation:'MANUAL_UNVALIDATED'})));if(out.metadata.unresolved.length&&compiled.result.status!=='REJECTED')compiled.result.status='CONCEPT_ONLY';return {...out,...compiled};}
module.exports={VERSION,schema,validate,parse,expand,assess,compatibility};
