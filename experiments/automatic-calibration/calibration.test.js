import {describe,it,expect} from 'vitest';
const fs=require('fs');
const path=require('path');
const sharp=require('sharp');
const {getCV}=require('../../src/vision/opencv');
const {applyHomography}=require('../../src/geometry/homography');
const {CODES,bits,rotate,decode,matProfile,renderMatSvg}=require('./mat');
const {detectMat,debugOverlay}=require('./detect');
const profile=matProfile(40,4);
async function fixture(p=profile){
  const base=await sharp(Buffer.from(renderMatSvg(p))).resize(800,800).png().toBuffer();
  const fabric=Buffer.from('<svg width="800" height="800"><polygon points="180,200 580,170 640,410 520,590 200,550 250,360" fill="#5d7084"/></svg>');
  return sharp(base).composite([{input:fabric}]).png().toBuffer();
}
async function cover(input,left,top,width,height){return sharp(input).composite([{input:await sharp({create:{width,height,channels:3,background:'white'}}).png().toBuffer(),left,top}]).png().toBuffer();}

describe('Offline physical-mat calibration prototype',()=>{
  it('uses rotationally distinct codes with minimum Hamming distance six',()=>{
    const variants=[];
    CODES.forEach(code=>{let b=bits(code);for(let r=0;r<4;r++,b=rotate(b))variants.push(b);});
    for(let i=0;i<variants.length;i++)for(let j=i+1;j<variants.length;j++)expect(variants[i].filter((b,k)=>b!==variants[j][k]).length).toBeGreaterThanOrEqual(6);
  });
  it('rejects bit damage rather than correcting or guessing a marker',()=>{
    const b=bits(CODES[0]);b[0]=1-b[0];expect(decode(b)).toBe(null);
  });
  it('detects four IDs around irregular fabric and recovers centimeter coordinates',async()=>{
    const r=await detectMat(await fixture(),profile);
    expect(r.ok,JSON.stringify(r)).toBe(true);
    expect(r.markers.map(m=>m.id)).toEqual([0,1,2,3]);
    expect(r.calibration.pxPerCmApprox).toBeCloseTo(16,0);
    const mapped=applyHomography(r.calibration.H,[400,400]);
    expect(mapped[0]).toBeCloseTo(20,0);expect(mapped[1]).toBeCloseTo(20,0);
    expect(r.diagnostics.maxCornerResidualCm).toBeLessThan(0.1);
    expect(r.diagnostics.physicalAccuracy).toBe('UNVERIFIED');
  });
  for(const angle of [90,180,27])it('recognizes printed marker orientation after photo rotation '+angle,async()=>{
    const image=await sharp(await fixture()).rotate(angle,{background:'white'}).png().toBuffer();
    const r=await detectMat(image,profile);expect(r.ok,JSON.stringify(r)).toBe(true);
    expect(r.markers.map(m=>m.id)).toEqual([0,1,2,3]);
  });
  it('supports explicit alternative mat dimensions without inventing a universal scale',async()=>{
    const p=matProfile(60,6),r=await detectMat(await fixture(p),p);
    expect(r.ok,JSON.stringify(r)).toBe(true);
    expect(r.calibration.pxPerCmApprox).toBeCloseTo(800/75,0);
  });
  it('detects a mildly perspective-warped mat and checks all observed corners',async()=>{
    const cv=await getCV();const {data}=await sharp(await fixture()).removeAlpha().raw().toBuffer({resolveWithObject:true});
    const src=cv.matFromArray(800,800,cv.CV_8UC3,data),dest=new cv.Mat();
    const a=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,799,0,799,799,0,799]);
    const b=cv.matFromArray(4,1,cv.CV_32FC2,[70,30,740,90,700,760,20,690]);
    const h=cv.getPerspectiveTransform(a,b);
    try{cv.warpPerspective(src,dest,h,new cv.Size(800,800),cv.INTER_LINEAR,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255));
      const image=await sharp(Buffer.from(dest.data),{raw:{width:800,height:800,channels:3}}).png().toBuffer();
      const r=await detectMat(image,profile);expect(r.ok,JSON.stringify(r)).toBe(true);
      expect(r.diagnostics.maxCornerResidualCm).toBeLessThan(profile.markerSizeCm*0.08);
    }finally{src.delete();dest.delete();a.delete();b.delete();h.delete();}
  });
  it('refuses calibration when part of one marker is covered',async()=>{
    const image=await cover(await fixture(),48,48,34,64),r=await detectMat(image,profile);
    expect(r.ok).toBe(false);expect(r.calibration).toBe(null);
    expect(r.reason).toBe('ALL_FOUR_VISIBLE_MARKERS_REQUIRED');
    expect(r.markers.some(m=>m.id===0)).toBe(false);
  });
  it('refuses calibration with one marker fully hidden',async()=>{
    const r=await detectMat(await cover(await fixture(),45,45,72,72),profile);
    expect(r.ok).toBe(false);expect(r.markers).toHaveLength(3);expect(r.calibration).toBe(null);
  });
  it('does not infer a marker corner obscured by fabric',async()=>{
    const r=await detectMat(await cover(await fixture(),48,48,12,12),profile);
    expect(r.ok).toBe(false);expect(r.calibration).toBe(null);
    expect(r.markers.some(m=>m.id===0)).toBe(false);
  });
  it('fails safely when the photograph crops the marker perimeter',async()=>{
    const cropped=await sharp(await fixture()).extract({left:80,top:0,width:720,height:800}).png().toBuffer();
    const r=await detectMat(cropped,profile);expect(r.ok).toBe(false);expect(r.calibration).toBe(null);
  });
  it('rejects duplicate IDs rather than choosing a convenient candidate',async()=>{
    const image=await fixture(),patch=await sharp(image).extract({left:45,top:45,width:72,height:72}).png().toBuffer();
    const modified=await sharp(image).composite([{input:patch,left:685,top:45}]).png().toBuffer();
    const r=await detectMat(modified,profile);expect(r.reason).toBe('DUPLICATE_MARKER_ID');expect(r.calibration).toBe(null);
  });
  it('rejects incorrect known marker size against the observed layout',async()=>{
    const r=await detectMat(await fixture(),matProfile(40,6));
    expect(r.reason).toBe('MARKER_LAYOUT_OR_PHYSICAL_DIMENSIONS_INCONSISTENT');expect(r.calibration).toBe(null);
  });
  it('returns no dimensions for a blank image',async()=>{
    const b=await sharp({create:{width:800,height:800,channels:3,background:'white'}}).png().toBuffer();
    const r=await detectMat(b,profile);expect(r.ok).toBe(false);expect(r.calibration).toBe(null);expect(r.markers).toHaveLength(0);
  });
  const legacy=path.resolve(__dirname,'../../data/test/TEST1.png');
  it.skipIf(!fs.existsSync(legacy))('does not invent new mat markers in existing TEST1',async()=>{
    const r=await detectMat(fs.readFileSync(legacy),profile);expect(r.ok).toBe(false);expect(r.calibration).toBe(null);
  });
  it('rejects missing or nonfinite physical dimensions',()=>{
    for(const args of [[undefined,4],[40,NaN],[40,-1],[10,4],[Infinity,4]])expect(()=>matProfile(...args)).toThrow();
  });
  it('writes decodable debug overlays on success and failure',async()=>{
    const image=await fixture();
    for(const input of [image,await cover(image,45,45,72,72)]){
      const r=await detectMat(input,profile),overlay=await debugOverlay(input,r);
      const meta=await sharp(overlay).metadata();expect(meta.width).toBe(800);expect(meta.height).toBe(800);
      expect(overlay.equals(input)).toBe(false);
    }
  });
  it('prints explicit centimeter dimensions and refuses invalid image data',async()=>{
    expect(renderMatSvg(profile)).toContain('width="50cm" height="50cm"');
    await expect(detectMat(Buffer.from('not an image'),profile)).rejects.toThrow();
  });
});
