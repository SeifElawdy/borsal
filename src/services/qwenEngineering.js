// Model-specific request contract only; no changes to engineering compilation or validation.
const {z}=require('zod'),engineering=require('./productEngineering');
const {area,dimensions}=require('../geometry/polygon');
const MODEL='@cf/qwen/qwen3.8-27b';
const POLICY=Object.freeze({maxInputBytes:24000,overheadTokens:1024,inputNeuronsPerMillion:40909,outputNeuronsPerMillion:290909,safetyMargin:1.15,freeTierHoldNeurons:4000});
function strictObject(properties){return {type:'object',properties,required:Object.keys(properties),additionalProperties:false};}
// Project the existing schema into a strict generation subset. Optional source/grain facts
// are omitted, not replaced with null/zero or invented values. Local Zod remains authoritative.
function outputSchema(){const root=z.toJSONSchema(engineering.schema,{target:'draft-2020-12'});delete root.$schema;
 const component=root.properties.components.items;component.properties=Object.fromEntries(Object.entries(component.properties).filter(([k])=>component.required.includes(k)));component.required=Object.keys(component.properties);
 const material=root.properties.materials.items,{name,requirement,quantity,threadEstimate}=material.properties;
 const threadRequirement=requirement.oneOf.find(r=>r.properties.type.const==='THREAD');
 root.properties.materials.items={anyOf:[strictObject({name,requirement,quantity}),strictObject({name,requirement:threadRequirement,threadEstimate})]};
 root.required=Object.keys(root.properties);
 return root;}
const PARAMETERS=Object.freeze({reasoning_effort:'xhigh',max_completion_tokens:8192,stream:false,temperature:.3,
 response_format:Object.freeze({type:'json_schema',json_schema:Object.freeze({name:'borsal_engineering_plan',strict:true,schema:outputSchema()})})});
function inputBytes(messages){return Buffer.byteLength(JSON.stringify({messages,...PARAMETERS}));}
function maxNeurons(bytes){if(!Number.isSafeInteger(bytes)||bytes<0||bytes>POLICY.maxInputBytes)throw Object.assign(Error('QWEN_INPUT_LIMIT_EXCEEDED'),{status:422,code:'QWEN_INPUT_LIMIT_EXCEEDED'});
 // Completion includes reasoning and final tokens. Do not count only final JSON.
 return Math.ceil(((bytes+POLICY.overheadTokens)*POLICY.inputNeuronsPerMillion+PARAMETERS.max_completion_tokens*POLICY.outputNeuronsPerMillion)/1000000*POLICY.safetyMargin);}
function messages(run,concept){const prompt=engineering.messages(run,concept),source=run.sourceSnapshot,bounds=dimensions(source.polygonCm),usable=area(source.polygonCm)-(source.holes||[]).reduce((n,h)=>n+area(h),0),body=JSON.parse(prompt[1].content);
 body.source={...bounds,usableAreaCm2:usable,boundingRectangleAreaCm2:bounds.widthCm*bounds.heightCm,areaFractionOfBounds:usable/(bounds.widthCm*bounds.heightCm),
  shape:'IRREGULAR_POLYGON',boundaryVertices:source.polygonCm.length,holesCount:(source.holes||[]).length,exactGeometry:'RETAINED_BY_HOST_FOR_INDEPENDENT_NESTING',
  material:'UNKNOWN',grain:'UNKNOWN',stock:'UNKNOWN',physicalAccuracy:'UNVERIFIED'};
 prompt[1].content=JSON.stringify(body);prompt[0].content+=' Complete the supplied JSON Schema, including materials, operations, changes and unresolved. The source outline is deliberately absent: propose compact local components, not a copy of the scrap. All proposed engineering remains physically UNVERIFIED. Return final JSON only, not reasoning text.';
 return prompt;}
module.exports={MODEL,POLICY,PARAMETERS,outputSchema,inputBytes,maxNeurons,messages};
