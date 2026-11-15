import {it,expect} from 'vitest';
const sharp=require('sharp'),{fabricReference}=require('./previewReference');
const source={selectedPhoto:{photoPath:'TEST_FIXTURE.png'},geometry:{basis:{photoPath:'TEST_FIXTURE.png',calibrationEvidence:{calibration:{H:[[1,0,0],[0,1,0],[0,0,1]]}}}},polygonCm:[[70,40],[140,50],[130,120],[80,110]],holes:[[[90,70],[110,70],[110,90],[90,90]]]};
const image=()=>sharp(Buffer.from('<svg width="200" height="160" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="160" fill="white"/><path d="M0,0H20V20H0ZM180,0H200V20H180ZM0,140H20V160H0ZM180,140H200V160H180Z" fill="black"/><path d="M70,40L140,50L130,120L80,110Z" fill="#781e40"/></svg>')).png().toBuffer();
it('derives a marker-free fabric region with holes without modifying the original or calibration geometry',async()=>{
 const original=await image(),copy=Buffer.from(original),before=JSON.stringify(source),r=await fabricReference(original,source),meta=await sharp(r.bytes).metadata();
 expect(r.info.mode).toBe('GEOMETRY_MASKED_FABRIC_REGION');expect([meta.width,meta.height]).toEqual([70,80]);
 const stats=await sharp(r.bytes).stats();expect(stats.channels[0].min).toBeGreaterThan(20);
 const hole=await sharp(r.bytes).extract({left:30,top:40,width:1,height:1}).removeAlpha().raw().toBuffer();expect([...hole]).toEqual([239,238,233]);expect(original.equals(copy)).toBe(true);expect(JSON.stringify(source)).toBe(before);
});
it('never guesses a fabric crop when photo linkage, transform or coordinates are invalid',async()=>{
 for(const bad of [{...source,geometry:{}},{...source,selectedPhoto:{photoPath:'different.png'}},{...source,polygonCm:[[400,400],[500,400],[500,500],[400,500]]}]){
  const r=await fabricReference(await image(),bad);expect(r.info.mode).toBe('FULL_PHOTO_FALLBACK');expect((await sharp(r.bytes).metadata()).width).toBe(200);
 }
});
