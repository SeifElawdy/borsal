import {describe,it,expect} from 'vitest';
const fs=require('fs');
const path=require('path');
const os=require('os');
const sharp=require('sharp');
const {presetProfile,matProfile,markerCentersCm,renderMatSvg}=require('./mat');
const {detectMat,debugOverlay}=require('./detect');
const {measurePhoto}=require('./measurement');
const {main,profileFromOptions}=require('./run');
const observations=require('./physical-observations.template.json');
const a4=presetProfile('a4');
async function photo(){
  const fabric=Buffer.from('<svg width="630" height="891"><rect x="195" y="326" width="240" height="180" fill="#315578"/></svg>');
  return sharp(Buffer.from(renderMatSvg(a4))).resize(630,891).composite([{input:fabric}]).png().toBuffer();
}
describe('A4 MVP and larger calibration presets',()=>{
  it('defines an A4 page with a square reference and safe visible marker margins',()=>{
    expect(a4).toEqual({version:'borsal.mat/0.1',preset:'a4',page:{widthCm:21,heightCm:29.7},spanCm:16,markerSizeCm:2});
    const mx=(21-a4.spanCm)/2,my=(29.7-a4.spanCm)/2,quiet=a4.markerSizeCm/6;
    for(const [x,y]of markerCentersCm(a4)){
      expect(x+mx-a4.markerSizeCm/2).toBeGreaterThan(quiet);
      expect(y+my-a4.markerSizeCm/2).toBeGreaterThan(quiet);
      expect(x+mx+a4.markerSizeCm/2).toBeLessThan(21-quiet);
      expect(y+my+a4.markerSizeCm/2).toBeLessThan(29.7-quiet);
    }
    expect(a4.spanCm-2*a4.markerSizeCm).toBe(12);
  });
  it('keeps the printable A4 artifact identical to its preset renderer',()=>{
    const svg=fs.readFileSync(path.join(__dirname,'mat-a4.svg'),'utf8');
    expect(svg).toBe(renderMatSvg(a4));
    expect(svg).toContain('width="21cm" height="29.7cm" viewBox="0 0 21 29.7"');
  });
  it('defaults only the CLI to A4 and preserves explicit custom dimensions',()=>{
    expect(profileFromOptions({})).toEqual(a4);
    expect(profileFromOptions({preset:'a4'})).toEqual(a4);
    expect(profileFromOptions({'span-cm':'60','marker-cm':'6'})).toEqual(matProfile(60,6));
  });
  it('rejects unknown presets, conflicting selectors and incomplete dimensions',()=>{
    for(const options of [{preset:'unknown'},{preset:'a4','span-cm':'40','marker-cm':'4'},{'span-cm':'40'},{'marker-cm':'4'}])expect(()=>profileFromOptions(options)).toThrow();
    expect(()=>matProfile(40,4,'a4')).toThrow();
  });
  it('preserves the larger preset and its existing printable artwork exactly',()=>{
    const p=presetProfile('large');
    expect(p.spanCm).toBe(40);expect(p.markerSizeCm).toBe(4);expect(p.page).toEqual({widthCm:50,heightCm:50});
    expect(renderMatSvg(p)).toBe(fs.readFileSync(path.join(__dirname,'mat-40cm.svg'),'utf8'));
    expect(profileFromOptions({preset:'large'})).toEqual(p);
  });
  it('detects all A4 IDs with the correct centimeter scale and metadata',async()=>{
    const r=await detectMat(await photo(),a4);
    expect(r.ok,JSON.stringify(r)).toBe(true);expect(r.profile).toEqual(a4);
    expect(r.markers.map(m=>m.id)).toEqual([0,1,2,3]);
    expect(r.calibration.pxPerCmApprox).toBeCloseTo(30,0);
    expect(r.diagnostics.maxCornerResidualCm).toBeLessThan(0.1);
  });
  for(const angle of [90,23])it('detects A4 after photograph rotation '+angle,async()=>{
    const input=await sharp(await photo()).rotate(angle,{background:'white'}).png().toBuffer();
    expect((await detectMat(input,a4)).ok).toBe(true);
  });
  it('returns no calibration or measurements for an obstructed A4 marker',async()=>{
    const patch=await sharp({create:{width:70,height:70,channels:3,background:'white'}}).png().toBuffer();
    const image=await sharp(await photo()).composite([{input:patch,left:40,top:170}]).png().toBuffer();
    const {report}=await measurePhoto(image,a4,observations);
    expect(report.detection.ok).toBe(false);expect(report.detection.profile).toEqual(a4);
    expect(report.detection.calibration).toBe(null);expect(report.computed).toBe(null);
    expect(Object.values(report.errors).every(v=>v===null)).toBe(true);
  });
  it('rejects an A4 photograph analyzed with the incompatible large preset',async()=>{
    const r=await detectMat(await photo(),presetProfile('large'));
    expect(r.ok).toBe(false);expect(r.calibration).toBe(null);
    expect(r.reason).toBe('MARKER_LAYOUT_OR_PHYSICAL_DIMENSIONS_INCONSISTENT');
  });
  it('keeps A4 metadata in reports and measures a synthetic small fabric piece',async()=>{
    const {report}=await measurePhoto(await photo(),a4,observations);
    expect(report.measurementStatus,JSON.stringify(report)).toBe('COMPUTED_UNVERIFIED');
    expect(report.detection.profile).toEqual(a4);
    expect(report.computed.widthCm).toBeCloseTo(8,0);expect(report.computed.heightCm).toBeCloseTo(6,0);
    expect(report.computed.areaCm2).toBeGreaterThan(46);expect(report.computed.areaCm2).toBeLessThan(50);
    expect(Object.values(report.errors).every(v=>v===null)).toBe(true);
  });
  it('produces an A4 overlay at the oriented photograph dimensions',async()=>{
    const input=await photo(),result=await detectMat(input,a4);
    const meta=await sharp(await debugOverlay(input,result)).metadata();expect(meta.width).toBe(630);expect(meta.height).toBe(891);
  });
  it('runs default printing and preset-based detection/measurement through the offline CLI',async()=>{
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-a4-'));
    try{
      const image=path.join(root,'image.png'),obs=path.join(root,'observations.json');
      fs.writeFileSync(image,await photo());fs.writeFileSync(obs,JSON.stringify(observations));
      const svg=path.join(root,'a4.svg');await main(['print','--output='+svg]);expect(fs.readFileSync(svg,'utf8')).toBe(renderMatSvg(a4));
      const detection=path.join(root,'detected');await main(['detect','--preset=a4','--image='+image,'--output='+detection]);
      expect(JSON.parse(fs.readFileSync(path.join(detection,'result.json'))).profile).toEqual(a4);
      const measurement=path.join(root,'measured');await main(['measure','--preset=a4','--image='+image,'--observations='+obs,'--output='+measurement]);
      expect(JSON.parse(fs.readFileSync(path.join(measurement,'measurement-report.json'))).detection.profile).toEqual(a4);
      await expect(main(['print','--preset=a4','--output='+svg])).rejects.toThrow();
    }finally{
      if(path.dirname(root)!==os.tmpdir()||!path.basename(root).startsWith('borsal-a4-'))throw Error('Unsafe test cleanup');
      fs.rmSync(root,{recursive:true,force:true});
    }
  });
});
