import {describe,it,expect,beforeAll,afterAll,vi} from 'vitest';
const request=require('supertest');
const mongoose=require('mongoose');
const fs=require('fs');
const path=require('path');
const os=require('os');
const {randomUUID,createHash}=require('crypto');
const sharp=require('sharp');
require('dotenv').config({quiet:true});
const runId=randomUUID(),dbName='borsal-auto-'+runId+'-test';
const uri=new URL(process.env.MONGODB_URI);uri.pathname='/'+dbName;
const uploads=path.join(os.tmpdir(),'borsal-auto-registration-'+runId);
process.env.BORSAL_UPLOADS_DIR=uploads;
const app=require('../app');
const Fabric=require('../models/FabricPiece');
const {presetProfile,renderMatSvg}=require('../../experiments/automatic-calibration/mat');
let images={},empty;
beforeAll(async()=>{
  await mongoose.connect(uri.toString());
  for(const name of ['a4','large']){
    const base=await sharp(Buffer.from(renderMatSvg(presetProfile(name)))).resize({width:800}).png().toBuffer();
    if(name==='a4')empty=base;
    const meta=await sharp(base).metadata();
    const cloth=Buffer.from(`<svg width="800" height="${meta.height}"><rect x="320" y="${Math.floor(meta.height/2)-60}" width="160" height="120" fill="#315578"/></svg>`);
    images[name]=await sharp(base).composite([{input:cloth}]).png().toBuffer();
  }
});
afterAll(async()=>{
  vi.restoreAllMocks();
  if(mongoose.connection.name===dbName)await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if(path.dirname(uploads)!==os.tmpdir()||path.basename(uploads)!=='borsal-auto-registration-'+runId)throw Error('Unsafe cleanup');
  fs.rmSync(uploads,{recursive:true,force:true});delete process.env.BORSAL_UPLOADS_DIR;
});
function files(dir=uploads){return fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]).sort():[];}
function upload(fields={},image=images.a4){
  let r=request(app).post('/api/fabrics/from-photo').attach('photo',image,{filename:'../../unsafe.png',contentType:'image/png'});
  for(const [k,v]of Object.entries({name:'Automatic scrap',matPreset:'a4',...fields}))if(v!==null)r=r.field(k,String(v));
  return r;
}
async function rejected(fields,image,status){
  const count=await Fabric.countDocuments(),before=files();const r=await upload(fields,image);
  expect(r.status,JSON.stringify(r.body)).toBe(status);expect(await Fabric.countDocuments()).toBe(count);expect(files()).toEqual(before);return r;
}
describe('Phase 3B automatic image-first registration',()=>{
  for(const preset of ['a4','large'])it('registers '+preset+' without manual coordinates and persists original/calibration/suggestion',async()=>{
    const before=await Fabric.countDocuments();
    const r=await upload({matPreset:preset,massGrams:'15.5',fabricType:'cotton'},images[preset]);
    expect(r.status,JSON.stringify(r.body)).toBe(201);expect(await Fabric.countDocuments()).toBe(before+1);
    const f=r.body.fabric,a=f.analysis,p=presetProfile(preset);
    expect(f.status).toBe('DRAFT');expect(f.availabilityStatus).toBe('AVAILABLE');expect(f.registrationSource).toBe('photo');expect(f.geometry?.confirmed).not.toBe(true);
    expect(f.massGrams).toBe(15.5);expect(a.analysisId).toMatch(/^[a-f0-9-]{36}$/);expect(a.calibrationSource).toBe('auto-marker');
    expect(a.calibrationEvidence.profile).toEqual(p);expect(a.calibrationEvidence.markers.map(m=>m.id)).toEqual([0,1,2,3]);
    expect(a.calibrationEvidence.calibration.H).toHaveLength(3);expect(a.calibrationEvidence.status).toBe('PHYSICAL_ACCURACY_UNVERIFIED');
    expect(a.markerSizeCm).toBe(p.spanCm);expect(a.markerCornersPx).toEqual(a.calibrationEvidence.calibration.markerCentersPx);
    expect(fs.readFileSync(a.photoPath).equals(images[preset])).toBe(true);expect(path.dirname(path.dirname(a.photoPath))).toBe(uploads);
    expect(a.calibrationEvidence.originalPhotoSha256).toBe(createHash('sha256').update(images[preset]).digest('hex'));
    expect(a.suggestedPolygonCm).toEqual(r.body.suggestedPolygonCm);expect(a.stats.areaCm2).toBeGreaterThan(0);
    expect(r.body.analysisSummary.widthCm).toBeCloseTo(160/(800/p.page.widthCm),0);
    expect(r.body.validation.valid).toBe(true);expect(r.body.devNotice).toBeUndefined();expect(r.body.accuracyNote).toContain('unverified');
    const stored=await Fabric.findById(f._id).lean();expect(JSON.parse(JSON.stringify(stored.analysis.calibrationEvidence))).toEqual(a.calibrationEvidence);
    expect(stored.analysisHistory).toHaveLength(0);
  });
  it('preserves original JPEG bytes while documenting normalized-coordinate evidence',async()=>{
    const jpeg=await sharp(images.a4).jpeg().withMetadata({orientation:6}).toBuffer();
    const r=await request(app).post('/api/fabrics/from-photo').field('name','Oriented').field('matPreset','a4').attach('photo',jpeg,{filename:'original.jpg',contentType:'image/jpeg'});
    expect(r.status,JSON.stringify(r.body)).toBe(201);
    expect(fs.readFileSync(r.body.fabric.analysis.photoPath).equals(jpeg)).toBe(true);
    expect(r.body.calibration.coordinateFrame).toContain('EXIF-normalized');
  });
  it('rejects a renamed text file without persistence',async()=>{await rejected({},Buffer.from('not a photo'),400);});
  it('rejects a truncated PNG with valid magic without persistence',async()=>{await rejected({},Buffer.from([137,80,78,71,13,10,26,10]),400);});
  it('rejects an image missing all markers before persistence',async()=>{
    const blank=await sharp({create:{width:800,height:800,channels:3,background:'white'}}).png().toBuffer();
    const r=await rejected({},blank,422);expect(r.body.reason).toBe('ALL_FOUR_VISIBLE_MARKERS_REQUIRED');
  });
  it('rejects an obscured marker before persistence',async()=>{
    const patch=await sharp({create:{width:90,height:90,channels:3,background:'white'}}).png().toBuffer();
    const image=await sharp(images.a4).composite([{input:patch,left:50,top:215}]).png().toBuffer();await rejected({},image,422);
  });
  it('rejects empty calibrated fabric region without persistence',async()=>{
    const r=await rejected({},empty,422);expect(r.body.reason).toBe('FABRIC_EXTRACTION_FAILED');
  });
  it('rejects a contour clipped by the inner ROI without persisting invented dimensions',async()=>{
    const meta=await sharp(empty).metadata();
    const shape=Buffer.from(`<svg width="800" height="${meta.height}"><rect x="130" y="420" width="280" height="200" fill="#315578"/></svg>`);
    const input=await sharp(empty).composite([{input:shape}]).png().toBuffer();
    const r=await rejected({},input,422);expect(r.body.reason).toBe('FABRIC_TOO_CLOSE_TO_INNER_ROI_EDGE');
    expect(r.body.analysisSummary).toBeUndefined();expect(r.body.suggestedPolygonCm).toBeUndefined();
  });
  it.each([
    ['unsupported preset',{matPreset:'a3'}],['missing calibration',{matPreset:null}],
    ['mixed modes',{markerCornersPx:'[[0,0],[10,0],[10,10],[0,10]]',markerSizeCm:'10'}],
    ['server fields',{status:'CONFIRMED',analysis:'{}'}],['client evidence',{calibrationEvidence:'{}'}],
  ])('rejects %s without persistence',async(_name,fields)=>{await rejected(fields,images.a4,400);});
  it('cleans up a new original photo after database creation fails',async()=>{
    const stub=vi.spyOn(Fabric,'create').mockRejectedValueOnce(new Error('private simulated error'));
    try{const r=await rejected({},images.a4,500);expect(r.body).toEqual({error:'Internal server error'});expect(stub).toHaveBeenCalledOnce();}finally{stub.mockRestore();}
  });
  it('cleans up a partially written photo if photo persistence fails',async()=>{
    const original=fs.promises.writeFile.bind(fs.promises);
    const stub=vi.spyOn(fs.promises,'writeFile').mockImplementationOnce(async(...args)=>{await original(...args);throw Error('simulated write failure');});
    try{await rejected({},images.a4,500);expect(stub).toHaveBeenCalledOnce();}finally{stub.mockRestore();}
  });
  it('requires confirmation and preserves auto evidence in basis, analysis and geometry history',async()=>{
    const registered=await upload();expect(registered.status).toBe(201);
    const f=registered.body.fabric,id=f._id,first=f.analysis;
    const confirmed=await request(app).post('/api/fabrics/'+id+'/confirm-geometry').send({polygonCm:first.suggestedPolygonCm,source:'suggested'});
    expect(confirmed.status,JSON.stringify(confirmed.body)).toBe(200);
    const before=await Fabric.findById(id).lean();expect(before.geometry.basis.analysisId).toBe(first.analysisId);
    expect(JSON.parse(JSON.stringify(before.geometry.basis.calibrationEvidence))).toEqual(first.calibrationEvidence);
    const yellow=await sharp({create:{width:200,height:200,channels:3,background:{r:255,g:220,b:0}}}).png().toBuffer();
    const cloth=await sharp({create:{width:80,height:70,channels:3,background:{r:30,g:60,b:140}}}).png().toBuffer();
    const image=await sharp(yellow).composite([{input:cloth,left:60,top:65}]).png().toBuffer();
    const replacement=await request(app).post('/api/fabrics/'+id+'/analyze-photo').field('markerCornersPx','[[10,10],[190,10],[190,190],[10,190]]').field('markerSizeCm','10').attach('photo',image,{filename:'legacy.png',contentType:'image/png'});
    expect(replacement.status).toBe(200);expect(replacement.body.geometryBasedOnCurrentAnalysis).toBe(false);
    const after=await Fabric.findById(id).lean();expect(JSON.parse(JSON.stringify(after.analysisHistory[0].calibrationEvidence))).toEqual(first.calibrationEvidence);
    expect(after.geometry).toEqual(before.geometry);expect(fs.existsSync(first.photoPath)).toBe(true);
    const again=await request(app).post('/api/fabrics/'+id+'/confirm-geometry').send({polygonCm:first.suggestedPolygonCm,source:'suggested',basedOnAnalysisId:first.analysisId});
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('STALE_ANALYSIS');
    const refreshed=await request(app).post('/api/fabrics/'+id+'/confirm-geometry').send({polygonCm:first.suggestedPolygonCm,source:'manual',basedOnAnalysisId:after.analysis.analysisId,expectedGeometryVersion:1});
    expect(refreshed.status).toBe(200);const last=await Fabric.findById(id).lean();
    expect(JSON.parse(JSON.stringify(last.geometryHistory[0].basis.calibrationEvidence))).toEqual(first.calibrationEvidence);
    expect(last.geometry.basis.analysisId).toBe(after.analysis.analysisId);
    expect(last.geometry.basis.matchesSuggestion).toBe(false);
  });
});
