export class ApiError extends Error{constructor(status,body){super(body.error||'REQUEST_FAILED');this.status=status;this.body=body;}}
export async function request(path,{method='GET',body,headers:extraHeaders={}}={}){
  let response;try{response=await fetch(path,{method,credentials:'same-origin',headers:{...(body instanceof FormData?{}:body?{'Content-Type':'application/json'}:{}),...extraHeaders},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});}catch{throw new ApiError(0,{error:'CONNECTION_FAILED'});}
  const data=await response.json().catch(()=>({error:'INVALID_RESPONSE'}));if(!response.ok)throw new ApiError(response.status,data);return data;
}
export const api={bootstrap:()=>request('/ui/bootstrap'),upload:form=>request('/api/fabrics/from-photo',{method:'POST',body:form}),
  confirm:(id,body)=>request(`/api/fabrics/${id}/confirm-geometry`,{method:'POST',body}),
  reviewConcept:(run,id,body)=>request(`/api/concept-runs/${run}/concepts/${id}/review`,{method:'POST',body}),
  comparison:id=>request(`/api/concept-runs/${id}/source-comparison`),refresh:(id,body)=>request(`/api/concept-runs/${id}/refresh-source`,{method:'POST',body}),
  propose:(run,id,body)=>request(`/api/concept-runs/${run}/concepts/${id}/technical-proposals`,{method:'POST',body}),
  readiness:(id,body={})=>request(`/api/technical-proposals/${id}/production-readiness`,{method:'POST',body}),
  review:(id,body)=>request(`/ui/operator/technical-proposals/${id}/design-review`,{method:'POST',body}),
  stock:body=>request('/ui/operator/accessory-stock',{method:'POST',body}),draft:()=>request('/ui/authored-draft'),fixtureConcepts:id=>request('/ui/test-fixture/fabrics/'+id+'/concepts',{method:'POST',body:{}}),proposal:id=>request('/api/technical-proposals/'+id)};
const designMessages={MODEL_OUTPUT_TOKEN_LIMIT_REACHED:'The model reached its output limit before returning a design. No usable design was returned; the request receipt is saved.',PREVIEW_DESIGN_CONFLICT:'That image direction changes this design. Select a separate design alternative first.',DESIGN_CONSTRUCTION_CONFLICT:'The proposed construction conflicts with this design. Review an explicit alternative before generating images.',DESIGN_VERSION_CHANGED:'The selected design changed. Refresh and confirm the current version.',DESIGN_PROPOSAL_VERSION_MISMATCH:'This pattern belongs to a different source, idea or review version.'};
export const explain=code=>designMessages[code]||String(code||'Request failed').replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase());
export function errorText(e){return (e.status===409?'Conflict: refresh the source or review before continuing. ':'')+explain(e.message)+(e.body?.issues?.length?' ? '+e.body.issues.map(i=>i.path.join('.')+': '+i.message).slice(0,4).join('; '):'');}
export async function declarationHash(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');}
