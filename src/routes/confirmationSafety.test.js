import {describe,it,expect,beforeAll,afterAll,vi} from 'vitest';
const request=require('supertest'),mongoose=require('mongoose'),fs=require('fs'),path=require('path'),os=require('os'),sharp=require('sharp');
const {randomUUID}=require('crypto');require('dotenv').config({quiet:true});
const run=randomUUID(),db='borsal-safe-'+run+'-test',uri=new URL(process.env.MONGODB_URI);uri.pathname='/'+db;
const uploads=path.join(os.tmpdir(),'borsal-safe-'+run);process.env.BORSAL_UPLOADS_DIR=uploads;
const app=require('../app'),Fabric=require('../models/FabricPiece');
const conflict={error:'Fabric changed; reload and retry',code:'FABRIC_VERSION_CONFLICT'};
const rect=[[0,0],[4,0],[4,3],[0,3]],other=[[0,0],[5,0],[5,4],[0,4]];
const json=x=>JSON.parse(JSON.stringify(x));let image;
beforeAll(async()=>{
  await mongoose.connect(uri.toString());
  const bg=await sharp({create:{width:200,height:200,channels:3,background:{r:255,g:220,b:0}}}).png().toBuffer();
  const cloth=await sharp({create:{width:80,height:70,channels:3,background:{r:30,g:60,b:140}}}).png().toBuffer();
  image=await sharp(bg).composite([{input:cloth,left:60,top:65}]).png().toBuffer();
});
afterAll(async()=>{
  vi.restoreAllMocks();if(mongoose.connection.name===db)await mongoose.connection.dropDatabase();await mongoose.disconnect();
  if(path.dirname(uploads)!==os.tmpdir()||path.basename(uploads)!=='borsal-safe-'+run)throw Error('Unsafe cleanup');
  fs.rmSync(uploads,{recursive:true,force:true});delete process.env.BORSAL_UPLOADS_DIR;
});
function photo(endpoint='/api/fabrics/from-photo'){
  let r=request(app).post(endpoint).field('markerCornersPx','[[10,10],[190,10],[190,190],[10,190]]').field('markerSizeCm','10');
  if(endpoint==='/api/fabrics/from-photo')r=r.field('name','Safety fixture');
  return r.attach('photo',image,{filename:'scrap.png',contentType:'image/png'});
}
async function registered(){const r=await photo();expect(r.status).toBe(201);return r.body.fabric;}
const confirm=(id,body)=>request(app).post('/api/fabrics/'+id+'/confirm-geometry').send(body);
const read=async id=>json(await Fabric.findById(id).lean());
function body(f,extra={}){return {polygonCm:f.analysis.suggestedPolygonCm,source:'suggested',basedOnAnalysisId:f.analysis.analysisId,...extra};}
function files(dir=uploads){return fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]).sort():[];}

// Hold both requests after their real DB reads; optionally force which save commits first.
async function race(id,requests,winner) {
  const originalFind=Fabric.findById.bind(Fabric),originalSave=Fabric.prototype.save;
  let releaseRead,releaseSave,reads=0,timedOut=false;
  const readGate=new Promise(resolve=>releaseRead=resolve),saveGate=new Promise(resolve=>releaseSave=resolve);
  const timer=setTimeout(()=>{timedOut=true;releaseRead();releaseSave();},3000);
  const find=vi.spyOn(Fabric,'findById').mockImplementation((value,...args)=>{
    const q=originalFind(value,...args);if(String(value)===id){const exec=q.exec.bind(q);q.exec=async()=>{const d=await exec();if(++reads===2)releaseRead();await readGate;return d;};}return q;
  });
  const save=vi.spyOn(Fabric.prototype,'save').mockImplementation(async function(...args){
    const kind=this.isModified('analysis')?'analysis':'geometry';
    if(winner&&String(this._id)===id&&kind!==winner)await saveGate;
    try{return await originalSave.apply(this,args);}finally{if(winner&&kind===winner)releaseSave();}
  });
  try{const results=await Promise.all(requests());expect(reads).toBe(2);expect(timedOut).toBe(false);return results;}
  finally{clearTimeout(timer);releaseRead();releaseSave();find.mockRestore();save.mockRestore();}
}

describe('Confirmation freshness and atomic save safety',()=>{
  it('rejects stale analysis IDs and unbound edits, but accepts edits bound to the current analysis',async()=>{
    const f=await registered();expect((await photo('/api/fabrics/'+f._id+'/analyze-photo')).status).toBe(200);
    const before=await read(f._id),edited=structuredClone(before.analysis.suggestedPolygonCm);edited[0][0]+=0.3;
    const stale=await confirm(f._id,body(f));expect(stale.status).toBe(409);expect(stale.body.code).toBe('STALE_ANALYSIS');
    const unknown=await confirm(f._id,body(f,{basedOnAnalysisId:randomUUID()}));expect(unknown.status).toBe(400);
    const unbound=await confirm(f._id,{polygonCm:edited,source:'manual'});expect(unbound.status).toBe(409);expect(unbound.body.code).toBe('CURRENT_ANALYSIS_REQUIRED');
    expect(await read(f._id)).toEqual(before);
    const accepted=await confirm(f._id,body(before,{polygonCm:edited,source:'manual',expectedGeometryVersion:0}));expect(accepted.status).toBe(200);
    expect(accepted.body.fabric.geometry.basis.analysisId).toBe(before.analysis.analysisId);
    expect(accepted.body.fabric.geometry.basis.photoPath).toBe(before.analysis.photoPath);
    expect(accepted.body.fabric.geometry.basis.matchesSuggestion).toBe(false);
    expect(fs.existsSync(f.analysis.photoPath)).toBe(true);
  });
  it('safely accepts an exact current suggestion without an analysis ID, including cyclic vertices',async()=>{
    const f=await registered(),p=f.analysis.suggestedPolygonCm;
    const r=await confirm(f._id,{polygonCm:[...p.slice(1),p[0]],source:'suggested'});
    expect(r.status).toBe(200);expect(r.body.fabric.geometry.basis.analysisId).toBe(f.analysis.analysisId);
  });
  it('rejects stale geometry revisions and known historical replays, allowing an explicit current-version edit',async()=>{
    const created=await request(app).post('/api/fabrics').send({name:'Geometry revision'}),id=created.body._id;
    expect((await confirm(id,{polygonCm:rect,source:'manual',expectedGeometryVersion:0})).status).toBe(200);
    const changed=await request(app).put('/api/fabrics/'+id+'/geometry').send({polygonCm:other});expect(changed.status).toBe(200);
    const before=await read(id);
    const stale=await confirm(id,{polygonCm:rect,source:'manual',expectedGeometryVersion:1});expect(stale.status).toBe(409);expect(stale.body).toEqual(conflict);
    const replay=await confirm(id,{polygonCm:rect,source:'manual'});expect(replay.status).toBe(409);expect(replay.body.code).toBe('CURRENT_GEOMETRY_REQUIRED');
    expect(await read(id)).toEqual(before);
    const fresh=await confirm(id,{polygonCm:rect,source:'manual',expectedGeometryVersion:2});expect(fresh.status).toBe(200);
    expect(fresh.body.fabric.geometry.version).toBe(3);expect(fresh.body.fabric.geometryHistory).toHaveLength(2);
  });
  it('preserves repeated confirmation while rejecting retries with an obsolete expected version',async()=>{
    const f=await registered();const first=await confirm(f._id,body(f,{expectedGeometryVersion:0}));expect(first.status).toBe(200);
    const retry=await confirm(f._id,body(f,{expectedGeometryVersion:0}));expect(retry.status).toBe(409);expect(retry.body).toEqual(conflict);
    expect((await read(f._id)).geometryHistory).toHaveLength(0);
    const repeated=await confirm(f._id,body(f,{expectedGeometryVersion:1}));expect(repeated.status).toBe(200);
    expect(repeated.body.fabric.geometry.version).toBe(2);expect(repeated.body.fabric.geometryHistory).toEqual([first.body.fabric.geometry]);
  });
  it('requires the current geometry revision for hole edits as well as outline edits',async()=>{
    const created=await request(app).post('/api/fabrics').send({name:'Hole revision'}),id=created.body._id;
    expect((await confirm(id,{polygonCm:rect,source:'manual'})).status).toBe(200);
    const holes=[[[1,1],[2,1],[2,2],[1,2]]],before=await read(id);
    const missing=await confirm(id,{polygonCm:rect,holes,source:'manual'});expect(missing.status).toBe(409);expect(missing.body.code).toBe('CURRENT_GEOMETRY_REQUIRED');
    expect(await read(id)).toEqual(before);
    const edited=await confirm(id,{polygonCm:rect,holes,source:'manual',expectedGeometryVersion:1});expect(edited.status).toBe(200);
    expect(edited.body.summary.areaCm2).toBe(12);expect(edited.body.summary.netAreaCm2).toBe(11);
    expect(edited.body.fabric.geometryHistory).toEqual([before.geometry]);
  });
  it('returns a stable 409 for simultaneous modern confirmations without duplicate history',async()=>{
    const f=await registered(),results=await race(f._id,()=>[confirm(f._id,body(f)),confirm(f._id,body(f))]);
    expect(results.map(r=>r.status).sort()).toEqual([200,409]);expect(results.find(r=>r.status===409).body).toEqual(conflict);
    const current=await read(f._id);expect(current.geometry.version).toBe(1);expect(current.geometryHistory).toHaveLength(0);
  });
  for(const winner of ['analysis','geometry'])it('atomically resolves confirmation versus reanalysis when '+winner+' saves first',async()=>{
    const f=await registered();expect((await confirm(f._id,body(f))).status).toBe(200);
    const before=await read(f._id),beforeFiles=files();
    const results=await race(f._id,()=>[confirm(f._id,body(f,{expectedGeometryVersion:1})),photo('/api/fabrics/'+f._id+'/analyze-photo')],winner);
    const [confirmation,analysis]=results;
    expect((winner==='analysis'?analysis:confirmation).status).toBe(200);
    const rejected=winner==='analysis'?confirmation:analysis;expect(rejected.status).toBe(409);expect(rejected.body).toEqual(conflict);
    const current=await read(f._id);expect(fs.existsSync(before.analysis.photoPath)).toBe(true);
    if(winner==='analysis'){
      expect(current.geometry).toEqual(before.geometry);expect(current.geometryHistory).toEqual(before.geometryHistory);
      expect(current.analysis.analysisId).not.toBe(before.analysis.analysisId);expect(current.analysisHistory).toEqual([before.analysis]);
      expect(files()).toHaveLength(beforeFiles.length+1);
    }else{
      expect(current.analysis).toEqual(before.analysis);expect(current.analysisHistory).toEqual(before.analysisHistory);
      expect(current.geometry.version).toBe(2);expect(current.geometryHistory).toEqual([before.geometry]);
      expect(files()).toEqual(beforeFiles); // Losing reanalysis photo has been removed.
    }
  });
  it('allows only one of two concurrent reanalyses and removes the losing upload',async()=>{
    const f=await registered(),before=await read(f._id),beforeFiles=files();
    const endpoint='/api/fabrics/'+f._id+'/analyze-photo';
    const results=await race(f._id,()=>[photo(endpoint),photo(endpoint)]);
    expect(results.map(r=>r.status).sort()).toEqual([200,409]);expect(results.find(r=>r.status===409).body).toEqual(conflict);
    const current=await read(f._id);expect(current.analysisHistory).toEqual([before.analysis]);expect(files()).toHaveLength(beforeFiles.length+1);
  });
  it('guards concurrent geometry PUT versus confirmation with a single history append',async()=>{
    const created=await request(app).post('/api/fabrics').send({name:'PUT race'}),id=created.body._id;
    expect((await confirm(id,{polygonCm:rect,source:'manual'})).status).toBe(200);const before=await read(id);
    const results=await race(id,()=>[confirm(id,{polygonCm:rect,source:'manual'}),request(app).put('/api/fabrics/'+id+'/geometry').send({polygonCm:other})]);
    expect(results.map(r=>r.status).sort()).toEqual([200,409]);expect(results.find(r=>r.status===409).body).toEqual(conflict);
    const current=await read(id);expect(current.geometry.version).toBe(2);expect(current.geometryHistory).toEqual([before.geometry]);
    expect(current.status).toBe(current.geometry.confirmed?'CONFIRMED':'DRAFT');
  });
  it('protects concurrent first saves on legacy records without __v or availabilityStatus',async()=>{
    const {insertedId}=await Fabric.collection.insertOne({name:'Raw legacy'}),id=String(insertedId);
    const results=await race(id,()=>[confirm(id,{polygonCm:rect,source:'manual'}),confirm(id,{polygonCm:rect,source:'manual'})]);
    expect(results.map(r=>r.status).sort()).toEqual([200,409]);expect(results.find(r=>r.status===409).body).toEqual(conflict);
    const current=await read(id);expect(current.geometry.version).toBe(1);expect(current.geometryHistory).toHaveLength(0);
    expect((await confirm(id,{polygonCm:rect,source:'manual',expectedGeometryVersion:1})).status).toBe(200);
  });
  it('rejects a reservation that becomes visible between read and confirmation save without partial geometry',async()=>{
    const created=await request(app).post('/api/fabrics').send({name:'Freeze race'}),id=created.body._id;
    const original=Fabric.findById.bind(Fabric);const stub=vi.spyOn(Fabric,'findById').mockImplementation((value,...args)=>{
      const q=original(value,...args);if(String(value)===id){const exec=q.exec.bind(q);q.exec=async()=>{const d=await exec();await Fabric.collection.updateOne({_id:d._id},{$set:{availabilityStatus:'RESERVED'}});return d;};}return q;
    });
    let r;try{r=await confirm(id,{polygonCm:rect,source:'manual'});}finally{stub.mockRestore();}
    expect(r.status).toBe(409);expect(r.body).toEqual(conflict);
    const current=await read(id);expect(current.availabilityStatus).toBe('RESERVED');expect(current.geometry).toBeUndefined();expect(current.geometryHistory).toHaveLength(0);expect(current.status).toBe('DRAFT');
  });
});
