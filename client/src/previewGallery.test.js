import {it,expect} from 'vitest';
import {galleryFor,previewViews} from './previewGallery.mjs';
const context={sourceHash:'source',reviewVersion:1,proposalId:null},image=(id,viewRole,referencePreviewId=null)=>({_id:id,result:{preview:{...context,previewPolicy:'borsal.product-preview/0.2',viewRole,referencePreviewId}}});
it('requires four independently saved roles including In Use for a complete coherent gallery',()=>{
 const items=[image('hero','HERO'),image('angle','ALTERNATE','hero'),image('detail','DETAIL','hero')];
 expect(previewViews.map(v=>v.label)).toEqual(['Hero','Another Angle','Details','In Use']);expect(galleryFor(items,context).complete).toBe(false);
 const complete=galleryFor([...items,image('use','IN_USE','hero')],context);expect(complete.count).toBe(4);expect(complete.complete).toBe(true);
});
it('does not combine different heroes, stale sources, reviews or technical versions',()=>{
 const items=[image('new','HERO'),image('angle','ALTERNATE','old'),image('detail','DETAIL','new'),image('use','IN_USE','new')];
 items[2].result.preview.reviewVersion=0;items[3].result.preview.sourceHash='other';expect(galleryFor(items,context).count).toBe(1);
 expect(galleryFor([image('hero','HERO')],{...context,proposalId:'different'}).count).toBe(0);
});
it('never changes or discards historical single previews when finding the current series',()=>{
 const legacy={_id:'old',result:{preview:{...context,prompt:'Original saved prompt'}}},items=[legacy],before=JSON.stringify(items);
 expect(galleryFor(items,context).count).toBe(0);expect(JSON.stringify(items)).toBe(before);
});
