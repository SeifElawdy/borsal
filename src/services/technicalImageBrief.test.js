import {it,expect,vi,afterEach} from 'vitest';
const {build}=require('./technicalImageBrief'),{specification,promptFor,VIEWS}=require('./previewPrompt');
const design={projectId:'p',conceptId:'c',proposalId:'q',proposalVersion:2,fingerprint:'d2',version:3,sourceHash:'source',conflicts:[],product:{name:'Selected alternative',intendedFunction:'Protect one small keepsake in an open sleeve',silhouette:'Two flat panels',closure:{kind:'NONE',description:'Open top; no closure'},distinctiveDetails:['Double-turn top hem']},construction:{method:'TWO_PANEL_OPEN_SLEEVE'},unresolved:['Physical construction unverified']};
const proposal={_id:'q',version:2,status:'CONCEPT_ONLY',previewSvg:'<svg/>',provenance:{fabricSourceHash:'source',inputSha256:'input',derivation:{explicitlySelected:true,candidate:{pieces:[{name:'panels',quantity:2,cuttingPolygon:[[0,0],[5,0],[5,7],[0,7]]}],materials:[{name:'thread'}],assembly:[{type:'SEAM'}],instructions:['Double-turn top hem','Sew sides and bottom; leave top open']}}},assessment:{errors:[],constructionPlan:{instructions:['Double-turn top hem','Sew sides and bottom; leave top open']}}};
afterEach(()=>vi.restoreAllMocks());
it('deterministically grounds four views in the selected alternative, without network calls or fabricated depth',()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('NO_NETWORK')),before=JSON.stringify(proposal),b=build(proposal,design);
 expect(build(proposal,design)).toEqual(b);expect(b.forbidden).toContain('No zipper.');expect(b.forbidden).toContain('Open top; no closure of any kind.');expect(b.forbidden.join(' ')).toContain('No gusset');
 const spec=specification({productIdea:{name:'Original organizer'}},{polygonCm:[[0,0],[10,0],[10,20],[0,20]]},null,'',design,b);
 for(const role of Object.keys(VIEWS)){const prompt=promptFor(spec,role,true);expect(prompt).toContain(JSON.stringify(b));expect(prompt).toContain('SELECTED TECHNICAL DESIGN IS AUTHORITATIVE');expect(prompt).not.toContain('Show volume and purposeful');expect(prompt).not.toContain('Original organizer');}
 expect(b.manufacturingVerified).toBe(false);expect(JSON.stringify(proposal)).toBe(before);expect(fetch).not.toHaveBeenCalled();
});
it('rejects invalid, incomplete or conflicting selected designs',()=>{
 for(const change of [{status:'REJECTED'},{previewSvg:null},{assessment:{errors:[{code:'INVALID_ENGINEERING_PLAN'}]}}])expect(()=>build({...proposal,...change},design)).toThrow();
 expect(()=>build(proposal,{...design,conflicts:[{}]})).toThrow();expect(()=>build(proposal,{...design,proposalVersion:1})).toThrow();
 expect(()=>build({...proposal,provenance:{...proposal.provenance,derivation:{}}},design)).toThrow();
});
it('keeps prior technical previews historical and requires brief-bound identity',async()=>{
 const {galleryFor}=await import('../../client/src/previewGallery.mjs'),b=build(proposal,design),context={sourceHash:'source',reviewVersion:1,proposalId:'q',designFingerprint:'d2',requireIdentity:true},p={...context,previewPolicy:'borsal.product-preview/0.4',viewRole:'HERO',technicalImageBrief:b,technicalImageBriefHash:b.hash},image={_id:'hero',result:{preview:p}};
 expect(galleryFor([image],context).count).toBe(1);expect(galleryFor([image],{...context,proposalId:'new'}).count).toBe(0);expect(galleryFor([{...image,result:{preview:{...p,technicalImageBriefHash:null}}}],context).count).toBe(0);expect(galleryFor([{...image,result:{preview:{...p,stale:true}}}],context).count).toBe(0);
});
