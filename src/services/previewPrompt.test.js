import {it,expect} from 'vitest';
const {VIEWS,specification,promptFor}=require('./previewPrompt');
const source={polygonCm:[[0,0],[8,0],[8,6],[0,6]],holes:[]};
const wrap={productIdea:{name:'Scrap Wrap',description:'Reusable small-item wrap'},intendedUse:'Wrap a small keepsake using overlapping folds',distinctiveFeatures:[{description:'Overlapping fabric folds'}],constraints:['One scrap'],unresolvedRequirements:['Fold retention is unverified']};
it('creates four purposeful views, including active use, without changing product identity',()=>{
 const spec=specification(wrap,source,null),prompts=Object.keys(VIEWS).map(v=>promptFor(spec,v));
 expect(new Set(prompts).size).toBe(4);for(const p of prompts){expect(p).toContain('Scrap Wrap');expect(p).toContain(wrap.intendedUse);expect(p).toContain('not an unmodified scrap');expect(p).toContain('not independently verified');}
 expect(prompts[3]).toContain('actively performing');expect(prompts[1]).toContain('change the camera viewpoint, not the design');expect(spec.source.usableAreaCm2).toBe(48);expect(spec.source.widthCm).toBe(8);
});
it('uses the actual selected purpose rather than generic wrap or purse instructions',()=>{
 const purse={...wrap,productIdea:{name:'Coin Purse',description:'Small coin holder'},intendedUse:'Store and retrieve coins through the stated opening'};
 const p=promptFor(specification(purse,source,null),'IN_USE');expect(p).toContain(purse.intendedUse);expect(p).not.toContain('Wrap a small keepsake');
});
it('supports the existing single-image reference contract while disclosing approximate fidelity',()=>{
 const spec=specification(wrap,source,{evidence:'UNVERIFIED_DESIGN_PROPOSAL'});
 expect(promptFor(spec,'DETAIL',true)).toContain('selected source-linked HERO');expect(promptFor(spec,'HERO')).toContain('original fabric appearance reference');
 expect(promptFor(spec,'IN_USE')).toContain('Never imply food-contact safety');expect(spec.source.materialProperties).toBe('UNKNOWN');expect(()=>promptFor(spec,'FOUR_CROPS')).toThrow();
});
it('makes the input reference board from both real fabric pixels and the Hero without another provider call',async()=>{
 const sharp=require('sharp'),{makeConditioning}=require('./productPreview'),solid=color=>sharp({create:{width:20,height:20,channels:3,background:color}}).png().toBuffer();
 const board=await makeConditioning(await solid('#781e40'),await solid('#00ff00'));
 const meta=await sharp(board).metadata(),pixel=x=>sharp(board).extract({left:x,top:512,width:1,height:1}).removeAlpha().raw().toBuffer();
 expect([meta.width,meta.height]).toEqual([1024,1024]);expect([...await pixel(256)]).toEqual([120,30,64]);expect([...await pixel(768)]).toEqual([0,255,0]);
 expect(promptFor(specification(wrap,source,null),'IN_USE',true)).toContain('never a collage');
});
it('locks one specific Coin Pouch silhouette, closure, scale and macro feature across all four prompts',()=>{
 const pouch={...wrap,productIdea:{name:'Coin Pouch',description:'Small pouch for coins'},intendedUse:'Storing small valuables',distinctiveFeatures:[{description:'Secure closure'}]},spec=specification(pouch,source,null),before=JSON.stringify(spec),prompts=Object.keys(VIEWS).map(role=>promptFor(spec,role,true));
 expect(spec.visualDesign.silhouette).toContain('rounded pouch');expect(spec.visualDesign.openingClosure).toContain('two matching knotted fabric ties');expect(spec.visualDesign.useAction).toContain('Place coins');expect(spec.visualDesign.approximateScale.proposedFaceWidthCm).toBeLessThan(source.polygonCm[1][0]);
 for(const p of prompts){expect(p).toContain(before);expect(p).toContain('ZERO calibration markers');expect(p).toContain('Hero background');expect(p).toContain('never product features');}
 expect(prompts[1]).toContain('30–45 degrees');expect(prompts[1]).toContain('Never show only the underside');expect(prompts[2]).toContain('80–95%');expect(prompts[2]).toContain('Not another full-product');expect(prompts[3]).toContain('Perform exactly');expect(JSON.stringify(spec)).toBe(before);
 const zip=specification({...pouch,distinctiveFeatures:[{description:'Zipper opening'}]},source,null);expect(zip.visualDesign.openingClosure).toContain('zipper');expect(zip.visualDesign.silhouette).not.toContain('gathered');
});
