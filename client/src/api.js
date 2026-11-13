export class ApiError extends Error{constructor(status,body){super(body.error||'REQUEST_FAILED');this.status=status;this.body=body;}}
export async function request(path,{method='GET',body}={}){
  let response;try{response=await fetch(path,{method,credentials:'same-origin',headers:body instanceof FormData?{}:body?{'Content-Type':'application/json'}:{},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});}catch{throw new ApiError(0,{error:'CONNECTION_FAILED'});}
  const data=await response.json().catch(()=>({error:'INVALID_RESPONSE'}));if(!response.ok)throw new ApiError(response.status,data);return data;
}
export const api={bootstrap:()=>request('/ui/bootstrap'),upload:form=>request('/api/fabrics/from-photo',{method:'POST',body:form}),
  confirm:(id,body)=>request(`/api/fabrics/${id}/confirm-geometry`,{method:'POST',body}),
  reviewConcept:(run,id,body)=>request(`/api/concept-runs/${run}/concepts/${id}/review`,{method:'POST',body}),
  comparison:id=>request(`/api/concept-runs/${id}/source-comparison`),refresh:(id,body)=>request(`/api/concept-runs/${id}/refresh-source`,{method:'POST',body}),
  propose:(run,id,body)=>request(`/api/concept-runs/${run}/concepts/${id}/technical-proposals`,{method:'POST',body}),
  readiness:(id,body={})=>request(`/api/technical-proposals/${id}/production-readiness`,{method:'POST',body}),
  review:(id,body)=>request(`/ui/operator/technical-proposals/${id}/design-review`,{method:'POST',body}),
  stock:body=>request('/ui/operator/accessory-stock',{method:'POST',body}),draft:()=>request('/ui/authored-draft')};
export const explanations={
  CONNECTION_FAILED:'تعذر الاتصال بالخادم المحلي. تأكد من تشغيل Borsal ثم أعد المحاولة.',PRODUCTION_NOT_READY:'الموافقة النهائية محظورة حتى استكمال الأدلة المطلوبة.',
  CURRENT_SOURCE_REQUIRED:'تغيّر مرجع القماش. حدّثه وأعد مراجعته.',FABRIC_SOURCE_CHANGED:'تغيّر مصدر القماش؛ يلزم تحديث صريح وإعادة مراجعة.',CURRENT_SOURCE_AND_REVIEW_REQUIRED:'المصدر أو المراجعة غير محدثين.',
  CONFIRMED_FABRIC_REQUIRED:'هندسة القماش تحتاج إلى تأكيد صريح.',FABRIC_REVISION_REQUIRED:'إصدار هندسي مؤكد مفقود.',FABRIC_GRAIN_REQUIRED:'اتجاه نسيج القماش غير متحقق.',
  FABRIC_MATERIAL_SPECIFICATIONS_REQUIRED:'خصائص الخامة غير موثقة.',EXPLICIT_STOCK_SNAPSHOT_REQUIRED:'لا توجد لقطة مخزون موثقة.',STOCK_BINDING_REQUIRED:'يجب ربط الخامة المطلوبة بمخزون محدد.',
  PRODUCTION_WRITES_DISABLED:'الإنتاج الحقيقي معطل في المساحة المحلية التجريبية.',TEST_FIXTURE_SOURCE_NOT_REAL_VERIFICATION:'المصدر تجريبي؛ لا يُعد دليلًا لمنتج حقيقي.',TEST_FIXTURE_REVIEW_NOT_REAL_VERIFICATION:'المراجعة تخص تجربة معزولة فقط.',
  INDEPENDENT_MEASUREMENTS_REQUIRED:'أضف قياسات مستقلة للقماش.',VERIFIED_FABRIC_MATERIAL_REQUIRED:'توثيق الخامة الفعلية مطلوب.',PHYSICAL_CONSTRUCTION_EVIDENCE_REQUIRED:'اختبارات تجميع مادية مطلوبة.',
  CURRENT_HUMAN_TECHNICAL_REVIEW_REQUIRED:'راجع التصميم التقني الحالي أولًا.',AUTHENTICATED_TECHNICAL_REVIEW_REQUIRED:'مراجعة مشغّل معتمد مطلوبة للإنتاج.',GENUINE_STOCK_BINDING_REQUIRED:'يلزم مخزون حقيقي مطابق للـ BOM.',
  CONCEPT_APPROVAL_REQUIRED:'يلزم اعتماد الفكرة للتخطيط أولًا.',CONCEPT_VERSION_CONFLICT:'تغيّرت المراجعة؛ حدّث البيانات وحاول مجددًا.',DESIGN_REVIEW_VERSION_CONFLICT:'تغيّر إصدار المراجعة؛ أعد تحميل الحالة.',
  SOURCE_REFRESH_VERSION_CONFLICT:'تغيّر المرجع أثناء المراجعة. اطلب مقارنة جديدة.',LIVE_GENERATION_DISABLED_FOR_THIS_PHASE:'الاستدلال المباشر غير مصرح به في هذه الجلسة.',LOCAL_SESSION_AND_ORIGIN_REQUIRED:'انتهت الجلسة المحلية. أعد تحميل الصفحة.',
  CURRENT_PHOTO_BASIS_REQUIRED:'تأكيد الهندسة يجب أن يرتبط بتحليل الصورة الحالي.',INVALID_INPUT:'راجع الحقول المطلوبة وصيغة البيانات.',
};
export const explain=code=>explanations[code]||code||'تعذر تنفيذ العملية';
export function errorText(e){return explain(e.message)+(e.body?.issues?.length?' · '+e.body.issues.map(i=>i.message).slice(0,2).join('، '):'');}
export async function declarationHash(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');}
