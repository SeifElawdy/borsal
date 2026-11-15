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
