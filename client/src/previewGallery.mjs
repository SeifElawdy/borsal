export const previewViews=[{id:'HERO',label:'Hero'},{id:'ALTERNATE',label:'Another Angle'},{id:'DETAIL',label:'Details'},{id:'IN_USE',label:'In Use'}];
export function galleryFor(items,{sourceHash,reviewVersion,proposalId=null}){
 const current=o=>{const p=o.result.preview;return !p.stale&&p.sourceHash===sourceHash&&p.reviewVersion===reviewVersion&&(p.proposalId||null)===proposalId&&p.previewPolicy==='borsal.product-preview/0.2';};
 const hero=items.find(o=>current(o)&&o.result.preview.viewRole==='HERO'),views={};
 for(const {id} of previewViews)views[id]=id==='HERO'?hero:items.find(o=>current(o)&&o.result.preview.viewRole===id&&o.result.preview.referencePreviewId===hero?._id&&!!hero);
 const count=previewViews.filter(v=>views[v.id]).length;
 return {hero,views,count,complete:count===4&&!!views.IN_USE};
}
