import {describe,it,expect} from 'vitest';
const fs=require('fs');
const path=require('path');
const os=require('os');
const sharp=require('sharp');
const {matProfile,renderMatSvg}=require('./mat');
const {measurePhoto,saveMeasurement,observationsSchema,compare}=require('./measurement');
const template=require('./physical-observations.template.json');
const profile=matProfile(40,4);
const observations=()=>structuredClone(template);
async function scene(shape='<rect x="240" y="280" width="320" height="240" fill="#315578"/>'){
  return sharp(Buffer.from(renderMatSvg(profile))).resize(800,800).composite([{input:Buffer.from('<svg width="800" height="800">'+shape+'</svg>')}]).png().toBuffer();
}
describe('Offline physical measurement preparation',()=>{
  it('ships a reference-free template with no invented measurements',()=>{
    expect(observationsSchema.parse(template)).toEqual(template);
    expect(Object.values(template.reference).every(v=>v===null)).toBe(true);
  });
  it('measures an independent synthetic rectangle through automatic markers and the existing extraction',async()=>{
    const {report}=await measurePhoto(await scene(),profile,observations());
    expect(report.measurementStatus,JSON.stringify(report)).toBe('COMPUTED_UNVERIFIED');
    expect(report.computed.widthCm).toBeCloseTo(20,0);
    expect(report.computed.heightCm).toBeCloseTo(15,0);
    expect(report.computed.areaCm2).toBeGreaterThan(290);expect(report.computed.areaCm2).toBeLessThan(310);
    expect(report.errors).toEqual({widthCm:null,heightCm:null,areaCm2:null});
    expect(report.polygonCm.every(([x,y])=>x>4&&y>4&&x<36&&y<36)).toBe(true);
    expect(report.observations.reference.method).toBe(null);
  });
  it('computes errors only against explicitly supplied independent references',()=>{
    const r={widthCm:20,heightCm:null,areaCm2:300,method:'Synthetic test-only rectangle values'};
    expect(compare({widthCm:19,heightCm:15,areaCm2:294},r)).toEqual({widthCm:{reference:20,absoluteError:1,percentageError:5},heightCm:null,areaCm2:{reference:300,absoluteError:6,percentageError:2}});
    expect(compare(null,r)).toEqual({widthCm:null,heightCm:null,areaCm2:null});
  });
  it('requires independent measurement methods and rejects nonphysical numbers',()=>{
    const o=observations();o.reference.widthCm=20;expect(observationsSchema.safeParse(o).success).toBe(false);
    o.reference.method='Ruler';for(const value of [0,-1,NaN,Infinity]){o.reference.widthCm=value;expect(observationsSchema.safeParse(o).success).toBe(false);}
  });
  it('requires print measurements before declaring ruler verification',()=>{
    const o=observations();o.printScale.status='RULER_CHECKED';expect(observationsSchema.safeParse(o).success).toBe(false);
  });
  it('never returns dimensions or errors when a marker is obstructed',async()=>{
    const input=await scene('<rect x="45" y="45" width="72" height="72" fill="white"/><rect x="240" y="280" width="320" height="240" fill="#315578"/>');
    const o=observations();o.reference={widthCm:20,heightCm:15,areaCm2:300,method:'Synthetic rectangle fixture, not a real measurement'};
    const {report}=await measurePhoto(input,profile,o);
    expect(report.detection.ok).toBe(false);expect(report.computed).toBe(null);expect(report.polygonCm).toBe(null);
    expect(Object.values(report.errors).every(v=>v===null)).toBe(true);expect(report.paths.fabricOverlay).toBe(null);
  });
  it('refuses measurements on an explicitly rejected physical print',async()=>{
    const o=observations();o.printScale.status='REJECTED';
    const {report}=await measurePhoto(await scene(),profile,o);
    expect(report.reason).toBe('PRINT_SCALE_REJECTED');expect(report.computed).toBe(null);
  });
  it('does not report zero fabric dimensions when the inner mat is empty',async()=>{
    const {report}=await measurePhoto(await scene(''),profile,observations());
    expect(report.detection.ok).toBe(true);expect(report.reason).toBe('FABRIC_EXTRACTION_FAILED');expect(report.computed).toBe(null);
  });
  it('rejects fabric contours clipped by the inner working region',async()=>{
    const {report}=await measurePhoto(await scene('<rect x="120" y="220" width="430" height="300" fill="#315578"/>'),profile,observations());
    expect(report.reason).toBe('FABRIC_TOO_CLOSE_TO_INNER_ROI_EDGE');expect(report.computed).toBe(null);
  });
  it('saves a reusable report and decodable overlays without overwriting evidence',async()=>{
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-physical-'));
    try{
      const image=path.join(root,'image.png'),obs=path.join(root,'observations.json'),out=path.join(root,'result');
      fs.writeFileSync(image,await scene());fs.writeFileSync(obs,JSON.stringify(template));
      const r=await saveMeasurement(image,profile,obs,out);
      expect(JSON.parse(fs.readFileSync(path.join(out,'measurement-report.json'))).imageSha256).toBe(r.imageSha256);
      for(const file of ['oriented.png','overlay.png','fabric-overlay.png','fabric-mask.png'])expect((await sharp(path.join(out,file)).metadata()).width).toBe(800);
      await expect(saveMeasurement(image,profile,obs,out)).rejects.toThrow('already exists');
    }finally{
      if(path.dirname(root)!==os.tmpdir()||!path.basename(root).startsWith('borsal-physical-'))throw Error('Unsafe test cleanup');
      fs.rmSync(root,{recursive:true,force:true});
    }
  });
});
