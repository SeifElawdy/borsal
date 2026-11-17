// Composable proposal compiler. Geometry, containment and nesting remain designCandidate's responsibility.
const {z}=require('zod'),candidate=require('./designCandidate');
const {dimensions,area,validatePolygon}=require('../geometry/polygon');
const VERSION='borsal.engineering-plan/0.1',POLICY='borsal.engineering-compiler/0.1';
// Exact irregular source coordinates plus the primitive catalog exceed the older intent-only prompt.
// Output tokens/reasoning stay unchanged. Worst-case documented input/output rates fit this hold.
const LIMITS=Object.freeze({maxPromptBytes:8000,freeTierHoldNeurons:450});
const obj=s=>z.object(s).strict(),text=z.string().trim().min(1).max(500),number=z.number().finite(),positive=number.positive(),point=z.tuple([number,number]);
const shape=z.discriminatedUnion('type',[
 obj({type:z.literal('RECT'),width:positive,height:positive}),
 obj({type:z.literal('ELLIPSE'),width:positive,height:positive}),
 obj({type:z.literal('POLYGON'),vertices:z.array(point).min(3).max(64)})]);
const ref=obj({piece:text,copy:z.number().int().positive(),point});
const extraOperations=[
 obj({type:z.literal('FOLD'),piece:text,method:z.enum(['HEM','BOX','PLEAT']),from:point,to:point,allowance:positive,instruction:text}),
 obj({type:z.literal('FINISH'),piece:text,edges:z.array(z.number().int().nonnegative()).min(1),method:z.literal('OVERCAST'),thread:text,instruction:text}),
 obj({type:z.literal('LAYER'),layers:z.array(ref).min(2).max(6),thread:text,instruction:text})];
const schema=obj({schemaVersion:z.literal(VERSION),name:text,function:text,
 closure:z.enum(['NONE','VELCRO','DRAWSTRING','ZIPPER','SNAP','BUTTON','BUCKLE','TOGGLE','HOOK','TIE','UNKNOWN']),
 components:z.array(obj({name:text,purpose:text,quantity:z.number().int().positive().max(20),
  role:text.optional(),shape,allowanceCm:number.min(0),
  grainDirectionDeg:number.min(0).lt(180).optional(),grainToleranceDeg:number.min(0).max(90).optional(),
  allowedRotationsDeg:z.array(number).min(1).max(16).optional()})).min(1).max(12),
 materials:candidate.candidateSchema.shape.materials,
 operations:z.array(z.union([candidate.candidateSchema.shape.assembly.unwrap().element,...extraOperations])).max(30),
 changes:z.array(text).max(6),unresolved:z.array(text).max(8)});
function ring(s){if(s.type==='POLYGON')return structuredClone(s.vertices);if(s.type==='RECT')return [[0,0],[s.width,0],[s.width,s.height],[0,s.height]];
 return Array.from({length:24},(_,i)=>[s.width/2*(1+Math.cos(2*Math.PI*i/24)),s.height/2*(1+Math.sin(2*Math.PI*i/24))]);}
function compile(input){
 const p=schema.parse(input),names=new Map(),materials=new Map(p.materials.map(m=>[m.name,m])),errors=[],checks=[];
 const issue=(code,message)=>errors.push({code,message});
 const pieces=p.components.map(c=>{if(names.has(c.name))issue('DUPLICATE_COMPONENT',c.name);const stitchingPolygon=ring(c.shape);
  if(!validatePolygon(stitchingPolygon).valid)issue('INVALID_COMPONENT_POLYGON',c.name);
  // Free component purposes/roles stay in the plan; only supported legacy transport roles are mapped.
  const role=candidate.candidateSchema.shape.pieces.element.shape.role.safeParse(c.role);
  const out={name:c.name,...(role.success&&role.data?{role:role.data}:{}),quantity:c.quantity,stitchingPolygon,allowance:c.allowanceCm,allowancePolicy:'UNIFORM_CONVEX_MITER',folds:[],
   ...(c.grainDirectionDeg===undefined?{}:{grainDirectionDeg:c.grainDirectionDeg}),...(c.grainToleranceDeg===undefined?{}:{grainToleranceDeg:c.grainToleranceDeg}),...(c.allowedRotationsDeg?{allowedRotationsDeg:c.allowedRotationsDeg}:{})};names.set(c.name,out);return out;});
 const assembly=[],instructions=[],touched=new Set(),finished=new Set();
 function thread(name){if(materials.get(name)?.requirement.type!=='THREAD')issue('THREAD_REQUIREMENT_REQUIRED',String(name));}
 function reference(r){const c=names.get(r.piece);if(!c||r.copy>c.quantity)issue('INVALID_COMPONENT_COPY',r.piece);else touched.add(r.piece+':'+r.copy);}
 for(const [index,op]of p.operations.entries()){
  instructions.push(op.instruction);const check={step:index+1,type:op.type,status:'PROPOSED',physicalStatus:'UNVERIFIED'};checks.push(check);
  if(op.type==='FOLD'){const c=names.get(op.piece);if(!c){issue('UNKNOWN_FOLD_COMPONENT',op.piece);continue;}
   c.folds.push({type:op.method,from:op.from,to:op.to,allowance:op.allowance});finished.add(op.piece);for(let copy=1;copy<=c.quantity;copy++)touched.add(op.piece+':'+copy);
  }else if(op.type==='FINISH'){const c=names.get(op.piece);thread(op.thread);if(!c||op.edges.some(e=>e>=c.stitchingPolygon.length)||new Set(op.edges).size!==op.edges.length)issue('INVALID_FINISH_EDGES',op.piece);else finished.add(op.piece);
  }else if(op.type==='LAYER'){thread(op.thread);op.layers.forEach(reference);if(new Set(op.layers.map(r=>r.piece+':'+r.copy)).size!==op.layers.length)issue('DUPLICATE_LAYER',op.instruction);
   for(let i=1;i<op.layers.length;i++)assembly.push({type:'ATTACH',from:op.layers[i-1],to:op.layers[i],thread:op.thread,instruction:op.instruction});
  }else {const refs=op.sides||op.anchors||[op.from,op.to];refs.forEach(reference);if(op.type==='SEAM'||op.type==='ATTACH')thread(op.thread);if(op.type==='INSTALL'&&!materials.has(op.material))issue('UNKNOWN_HARDWARE_REQUIREMENT',op.material);assembly.push(op);}
 }
 for(const c of p.components){for(let copy=1;copy<=c.quantity;copy++)if(!touched.has(c.name+':'+copy))issue('UNCONNECTED_COMPONENT',c.name+' copy '+copy+' needs a join, attachment or fold');if(!finished.has(c.name))checks.push({piece:c.name,status:'UNVERIFIED',code:'EDGE_FINISH_REQUIRED'});}
 // Named closures must have a corresponding explicit requirement, never assumed stock.
 const types=p.materials.map(m=>m.requirement.type),specs=p.materials.map(m=>m.requirement.specs);
 if(p.closure==='ZIPPER'&&!types.includes('ZIPPER')||p.closure==='BUTTON'&&!types.includes('BUTTON')||p.closure==='SNAP'&&!specs.some(s=>s.kind==='MAGNETIC_SNAP'))issue('CLOSURE_REQUIREMENT_MISSING',p.closure);
 if(['VELCRO','DRAWSTRING','BUCKLE','TOGGLE','HOOK','TIE'].includes(p.closure))checks.push({status:'UNVERIFIED',code:'CLOSURE_ENGINEERING_REQUIRED',closure:p.closure});
 const limitations=[...p.unresolved,'AI-proposed dimensions, allowances, joining, finishing and hardware are UNVERIFIED design choices, not measured source facts or available stock.',
  'Ellipses use 24 explicit straight chords; curved seam behavior and allowance corner behavior need physical assessment. No strength or manufacturing approval.',
  ...checks.filter(c=>c.status==='UNVERIFIED').map(c=>c.code+': '+(c.piece||c.closure||''))];
 return {plan:p,errors,checks,candidate:{schemaVersion:candidate.VERSION,name:p.name,unit:'cm',pieces,materials:p.materials,assembly,instructions:instructions.length?instructions:['Construction operations are missing; do not manufacture.'],limitations},
  transformations:[{operation:'COMPILE_EXPLICIT_COMPONENT_SHAPES',policy:POLICY,basis:'AI_PROPOSED_STITCHING_GEOMETRY',ellipseSegments:24}]};
}
function assess(input,source,concept,options){const compiled=compile(input);const result=candidate.construct(compiled.candidate,source,concept,options);
 result.transformations.unshift(...compiled.transformations);result.errors.push(...compiled.errors);if(result.errors.length)result.status='REJECTED';
 result.engineering={policy:POLICY,plan:compiled.plan,checks:compiled.checks,constructionStatus:result.errors.length?'INVALID_CONSTRUCTION':'UNVERIFIED',manufacturingVerified:false};
 return {...compiled,result};}
function schematic(plan){const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const rows=plan.components.map((c,i)=>`<g transform="translate(24,${70+i*65})"><rect width="900" height="54" rx="8" fill="#30283b"/><text x="12" y="23">${esc(c.name)} (${c.quantity} copies): ${esc(c.purpose)}</text><text x="12" y="45" font-size="14">${esc(c.shape.type)}; ${c.allowanceCm} cm proposed allowance</text></g>`).join('');
 const y=85+plan.components.length*65,ops=plan.operations.map((o,i)=>`<text x="24" y="${y+i*32}" font-size="15">${i+1}. ${esc(o.type)}: ${esc(o.instruction.slice(0,105))}</text>`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 ${y+plan.operations.length*32+55}" width="960"><rect width="100%" height="100%" fill="#19151f"/><g fill="#f5effc" font-family="sans-serif" font-size="18"><text x="24" y="34">Proposed component / assembly sequence - physical construction UNVERIFIED</text>${rows}${ops}</g></svg>`;}
function messages(run,concept){return [{role:'system',content:`Final compact JSON only. Contract: {schemaVersion:"${VERSION}",name,function,closure,components:[{name,purpose,quantity,role?,shape,allowanceCm}],materials:[],operations:[],changes:[],unresolved:[]}. cm; finite positive dimensions/counts, allowance>=0. STITCHING shapes: {type:RECT,width,height}, {type:ELLIPSE,width,height} (24 chords), {type:POLYGON,vertices:[[x,y],...]}. Prefer parameterized shapes; use at most 12 vertices per proposed polygon. Source polygon is CONTEXT, not a cutting component: never copy its dense boundary into panels. Use local component coordinates. Host derives convex miter cutting allowance; no implicit shrinking. Fit total copies in source; area alone cannot prove fit. Copy activeDesign.name and function VERBATIM; preserve closure. closure NONE|VELCRO|DRAWSTRING|ZIPPER|SNAP|BUTTON|BUCKLE|TOGGLE|HOOK|TIE|UNKNOWN. Propose meaningful roles, 2-5 components, concise instructions. Every operation has type plus: SEAM {sides:[{piece:name,copy:1,edges:[zero-based indices],direction:FORWARD|REVERSE},second],thread:name,instruction}; ATTACH {from:{piece,copy,point:[x,y]},to:same,thread,instruction}; INSTALL {material:name,anchors:[{piece,copy,point}],instruction}; FOLD {piece,method:HEM|BOX|PLEAT,from:[x,y],to:[x,y],allowance,instruction}; FINISH {piece,edges:[indices],method:OVERCAST,thread,instruction}; LAYER {layers:[{piece,copy,point},...],thread,instruction}. Contiguous seam paths in declared direction; equal mating lengths; anchors/axes inside. Finish all components. Materials {name,requirement:{type:THREAD,specs:{fiber:POLYESTER,tex:30}},threadEstimate:{method:ALL_STITCHING_PERIMETERS,multiplier:3,tailCm:30}}; hardware quantity:{value:positive,unit:piece}. BUTTON specs diameterCm/material WOOD|METAL|RESIN; ZIPPER lengthCm/toothType COIL|METAL/endType CLOSED|OPEN; HARDWARE kind D_RING|SWIVEL_HOOK|MAGNETIC_SNAP|TURN_LOCK|RIVET|BAG_FOOT,finish NICKEL|BRASS|BLACK,sizeCm. Requirements are proposals, not stock/source facts. Missing source grain/material/tests stay unknown. Unsupported elastic, gathering, weaving or closures remain unresolved. changes lists altered creative requirements requiring human approval. No manufacturing claims; all engineering physically UNVERIFIED.`},
 {role:'user',content:JSON.stringify({concept:concept.assessment?.proposal||concept,source:{polygonCm:run.sourceSnapshot.polygonCm,holes:run.sourceSnapshot.holes||[],...dimensions(run.sourceSnapshot.polygonCm),areaCm2:area(run.sourceSnapshot.polygonCm)-(run.sourceSnapshot.holes||[]).reduce((n,h)=>n+area(h),0),material:'UNKNOWN',grain:'UNKNOWN',stock:'UNKNOWN',physicalAccuracy:'UNVERIFIED'}})}];}
module.exports={VERSION,POLICY,LIMITS,schema,ring,compile,assess,messages,schematic};
