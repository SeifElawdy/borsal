import {describe,it,expect,beforeAll,afterAll,vi} from 'vitest';
const request=require('supertest'),mongoose=require('mongoose'),fs=require('fs'),path=require('path'),os=require('os'),sharp=require('sharp');
const {randomUUID}=require('crypto');
require('dotenv').config({quiet:true});
const run=randomUUID(),db='borsal-3c-'+run+'-test',uri=new URL(process.env.MONGODB_URI);uri.pathname='/'+db;
const uploads=path.join(os.tmpdir(),'borsal-3c-'+run);process.env.BORSAL_UPLOADS_DIR=uploads;
const app=require('../app'),Fabric=require('../models/FabricPiece');
const {presetProfile,renderMatSvg}=require('../../experiments/automatic-calibration/mat');
const json=v=>JSON.parse(JSON.stringify(v));
const rectangle=[[0,0],[4,0],[4,3],[0,3]];
let photo,replacement;
beforeAll(async()=>{
  await mongoose.connect(uri.toString());
  const mat=await sharp(Buffer.from(renderMatSvg(presetProfile('large')))).resize(800,800).png().toBuffer();
  const cloth=Buffer.from('<svg width="800" height="800"><rect x="280" y="280" width="240" height="200" fill="#315578"/></svg>');
  photo=await sharp(mat).composite([{input:cloth}]).png().toBuffer();
  const bg=await sharp({create:{width:200,height:200,channels:3,background:{r:255,g:220,b:0}}}).png().toBuffer();
  const patch=await sharp({create:{width:80,height:70,channels:3,background:{r:30,g:60,b:140}}}).png().toBuffer();
  replacement=await sharp(bg).composite([{input:patch,left:60,top:65}]).png().toBuffer();
});
afterAll(async()=>{
  vi.restoreAllMocks();if(mongoose.connection.name===db)await mongoose.connection.dropDatabase();await mongoose.disconnect();
  if(path.dirname(uploads)!==os.tmpdir()||path.basename(uploads)!=='borsal-3c-'+run)throw Error('Unsafe cleanup');
  fs.rmSync(uploads,{recursive:true,force:true});delete process.env.BORSAL_UPLOADS_DIR;
});
async function registered(){
  const r=await request(app).post('/api/fabrics/from-photo').field('name','Audit').field('matPreset','large').attach('photo',photo,{filename:'mat.png',contentType:'image/png'});
  expect(r.status,JSON.stringify(r.body)).toBe(201);return r.body.fabric;
}
const confirm=(id,body)=>request(app).post('/api/fabrics/'+id+'/confirm-geometry').send(body);
describe('Phase 3C calibration semantics and confirmation audit',()=>{
  it('preserves 40 cm legacy reference semantics and 4 cm physical tags through repeated confirmation',async()=>{
    const f=await registered(),a=f.analysis;
    expect(a.markerSizeCm).toBe(40);expect(a.calibrationEvidence.profile.spanCm).toBe(40);
    expect(a.calibrationEvidence.profile.markerSizeCm).toBe(4);
    expect(a.markerCornersPx).toEqual(a.calibrationEvidence.calibration.markerCentersPx);
    const body={polygonCm:a.suggestedPolygonCm,source:'suggested',basedOnAnalysisId:a.analysisId};
    const first=await confirm(f._id,body);expect(first.status).toBe(200);
    const g=first.body.fabric.geometry;
    expect(g.version).toBe(1);expect(g.confirmed).toBe(true);expect(g.basis.matchesSuggestion).toBe(true);
    expect(g.basis.photoPath).toBe(a.photoPath);expect(g.basis.analysisId).toBe(a.analysisId);
    expect(g.basis.calibrationEvidence).toEqual(a.calibrationEvidence);
    const second=await confirm(f._id,body);expect(second.status).toBe(200);
    expect(second.body.fabric.geometry.version).toBe(2);expect(second.body.fabric.geometryHistory).toEqual([g]);
    expect(fs.readFileSync(a.photoPath).equals(photo)).toBe(true);
    expect(second.body.fabric.geometry.basis.calibrationEvidence.status).toBe('PHYSICAL_ACCURACY_UNVERIFIED');
  });
  it('keeps confirmed geometry immutable on reanalysis and exposes stale-polygon/current-basis semantics',async()=>{
    const f=await registered(),a=f.analysis,body={polygonCm:a.suggestedPolygonCm,source:'suggested',basedOnAnalysisId:a.analysisId};
    const first=await confirm(f._id,body);expect(first.status).toBe(200);
    const replaced=await request(app).post('/api/fabrics/'+f._id+'/analyze-photo').field('markerCornersPx','[[10,10],[190,10],[190,190],[10,190]]').field('markerSizeCm','10').attach('photo',replacement,{filename:'new.png',contentType:'image/png'});
    expect(replaced.status).toBe(200);expect(replaced.body.geometryBasedOnCurrentAnalysis).toBe(false);
    const current=json(await Fabric.findById(f._id).lean());expect(current.geometry).toEqual(first.body.fabric.geometry);
    expect(current.analysisHistory[0].analysisId).toBe(a.analysisId);expect(fs.existsSync(a.photoPath)).toBe(true);
    const invalid=await confirm(f._id,{...body,basedOnAnalysisId:randomUUID()});expect(invalid.status).toBe(400);
    expect(json(await Fabric.findById(f._id).lean())).toEqual(current);
    const stale=await confirm(f._id,{polygonCm:a.suggestedPolygonCm,source:'suggested'});
    expect(stale.status).toBe(409);expect(stale.body.code).toBe('CURRENT_ANALYSIS_REQUIRED');
    const explicitOld=await confirm(f._id,body);expect(explicitOld.status).toBe(409);
    expect(explicitOld.body.code).toBe('STALE_ANALYSIS');
    expect(json(await Fabric.findById(f._id).lean())).toEqual(current);
    const edited=await confirm(f._id,{polygonCm:a.suggestedPolygonCm,source:'manual',basedOnAnalysisId:current.analysis.analysisId,expectedGeometryVersion:1});
    expect(edited.status).toBe(200);expect(edited.body.geometryBasedOnCurrentAnalysis).toBe(true);
    expect(edited.body.fabric.geometry.basis.matchesSuggestion).toBe(false);
    expect(edited.body.fabric.geometryHistory[0].basis.calibrationEvidence).toEqual(a.calibrationEvidence);
  });
  it('leaves the persisted document unchanged when confirmation save fails',async()=>{
    const f=await registered(),before=json(await Fabric.findById(f._id).lean());
    const stub=vi.spyOn(Fabric.prototype,'save').mockRejectedValueOnce(Error('simulated failure'));
    try{const r=await confirm(f._id,{polygonCm:f.analysis.suggestedPolygonCm,source:'suggested'});expect(r.status).toBe(500);expect(r.body).toEqual({error:'Internal server error'});}finally{stub.mockRestore();}
    expect(json(await Fabric.findById(f._id).lean())).toEqual(before);
  });
  it('does not silently lose geometry when two confirmations read the same document version',async()=>{
    const created=await request(app).post('/api/fabrics').send({name:'Concurrency audit'});expect(created.status).toBe(201);const id=created.body._id;
    const original=Fabric.findById.bind(Fabric);let release,reads=0,timedOut=false;
    const gate=new Promise(resolve=>release=resolve),timer=setTimeout(()=>{timedOut=true;release();},2000);
    const stub=vi.spyOn(Fabric,'findById').mockImplementation((value,...args)=>{
      const q=original(value,...args);
      if(String(value)===id){const exec=q.exec.bind(q);q.exec=async()=>{const doc=await exec();if(++reads===2)release();await gate;return doc;};}
      return q;
    });
    let results;
    try{results=await Promise.all([confirm(id,{polygonCm:rectangle,source:'manual'}),confirm(id,{polygonCm:rectangle,source:'manual'})]);}finally{clearTimeout(timer);stub.mockRestore();}
    expect(timedOut).toBe(false);expect(reads).toBe(2);
    expect(results.filter(r=>r.status===200)).toHaveLength(1);
    expect(results.find(r=>r.status!==200).status).toBe(409);
    expect(results.find(r=>r.status!==200).body).toEqual({error:'Fabric changed; reload and retry',code:'FABRIC_VERSION_CONFLICT'});
    const stored=await Fabric.findById(id).lean();expect(stored.geometry.version).toBe(1);
    expect(stored.geometryHistory).toHaveLength(0);expect(stored.geometry.polygonCm).toEqual(rectangle);
  });
});
