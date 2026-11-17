import {it,expect} from 'vitest';
const sharp=require('sharp');
const {presetProfile,renderMatSvg}=require('./mat');
const {measurePhoto}=require('./measurement');
for(const name of ['a4','large'])it('automatically measures '+name+' without observations',async()=>{
  const p=presetProfile(name),size=800;
  const base=await sharp(Buffer.from(renderMatSvg(p))).resize({width:size}).png().toBuffer();
  const meta=await sharp(base).metadata();
  const rect=Buffer.from(`<svg width="800" height="${meta.height}"><rect x="320" y="${Math.floor(meta.height/2)-60}" width="160" height="120" fill="#315578"/></svg>`);
  const image=await sharp(base).composite([{input:rect}]).png().toBuffer();
  const {report}=await measurePhoto(image,p);
  expect(report.measurementStatus,JSON.stringify(report)).toBe('COMPUTED_UNVERIFIED');
  expect(report.computed.widthCm).toBeCloseTo(160/(800/p.page.widthCm),0);
  expect(report.polygonCm.length).toBeGreaterThanOrEqual(4);
  expect(Object.values(report.errors).every(v=>v===null)).toBe(true);
  expect(Object.values(report.observations.reference).every(v=>v===null)).toBe(true);
  expect(report.limitations.length).toBeGreaterThan(0);
});
it('returns explicit calibration failure without observations or fabricated dimensions',async()=>{
  const image=await sharp({create:{width:800,height:800,channels:3,background:'white'}}).png().toBuffer();
  const {report}=await measurePhoto(image,presetProfile());
  expect(report.reason).toBe('ALL_FOUR_VISIBLE_MARKERS_REQUIRED');expect(report.computed).toBe(null);expect(report.polygonCm).toBe(null);
});
it('returns explicit segmentation failure without observations',async()=>{
  const p=presetProfile(),image=await sharp(Buffer.from(renderMatSvg(p))).resize({width:800}).png().toBuffer();
  const {report}=await measurePhoto(image,p);
  expect(report.reason).toBe('FABRIC_EXTRACTION_FAILED');expect(report.computed).toBe(null);
});

it('runs measure CLI without an observations file and saves all artifacts',async()=>{
  const fs=require('fs'),os=require('os'),path=require('path');
  const {main}=require('./run');const p=presetProfile();
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-auto-'));
  try{
    const image=path.join(root,'image.png'),output=path.join(root,'result');
    const base=await sharp(Buffer.from(renderMatSvg(p))).resize({width:800}).png().toBuffer();
    const meta=await sharp(base).metadata();
    const rect=Buffer.from('<svg width="800" height="'+meta.height+'"><rect x="320" y="500" width="160" height="120" fill="#315578"/></svg>');
    fs.writeFileSync(image,await sharp(base).composite([{input:rect}]).png().toBuffer());
    await main(['measure','--preset=a4','--image='+image,'--output='+output]);
    const r=JSON.parse(fs.readFileSync(path.join(output,'measurement-report.json')));
    expect(r.observationsFile).toBe(null);expect(r.computed).not.toBe(null);
    for(const file of ['overlay.png','fabric-overlay.png','fabric-mask.png','oriented.png'])expect(fs.existsSync(path.join(output,file))).toBe(true);
  }finally{if(path.dirname(root)!==os.tmpdir()||!path.basename(root).startsWith('borsal-auto-'))throw Error('Unsafe cleanup');fs.rmSync(root,{recursive:true,force:true});}
});
