const {nest}=require('./nesting');
const {nestingExamples}=require('./nesting-examples');
function examples(){
  const prior=nestingExamples(),request=structuredClone(prior.requests.synthetic),result=nest(request);
  const woven={type:'WOVEN_FABRIC',specs:{fiber:'COTTON',weave:'PLAIN',weightGsm:200}};
  const thread={type:'THREAD',specs:{fiber:'COTTON',tex:20}},strap={type:'WEBBING',specs:{fiber:'POLYESTER',widthCm:0.5}},button={type:'BUTTON',specs:{diameterCm:0.5,material:'WOOD'}},loop={type:'WEBBING',specs:{fiber:'POLYESTER',widthCm:0.2}};
  const stockBom=(id,material,value,unit)=>({id,source:{kind:'STOCK',availability:'NOT_CHECKED'},material,quantity:{value,unit},stockId:id+'-stock'});
  const bom=[{id:'outer',source:{kind:'SCRAP',scrapId:'synthetic-scrap'},material:woven,quantity:{value:4,unit:'cm2'}},stockBom('thread',thread,100,'cm'),stockBom('strap',strap,30,'cm'),stockBom('button',button,1,'piece'),stockBom('loop',loop,5,'cm')];
  const valid={schemaVersion:'borsal.material-precheck/0.1',unit:'cm',fabric:{id:'synthetic-scrap',geometry:{...request.fabric,confirmed:true,version:1},material:woven,grainDirectionDeg:0},nesting:{request,result},
    pattern:{pieces:request.pieces.map(p=>({id:p.id,bomId:'outer',stitchingPolygonCm:[[0.2,0.2],[1.4,0.2],[0.2,1.4]],edges:['bottom','diagonal','left'].map((id,segmentIndex)=>({id,basis:'STITCHING',segmentIndex}))})),
      components:[{id:'body',role:'BODY',pieceIds:request.pieces.map(p=>p.id),bomIds:['outer']},...['strap','button','loop'].map(id=>({id,role:id.toUpperCase(),pieceIds:[],bomIds:[id]}))],
      assembly:[{id:'body-seam',type:'SEAM',threadBomId:'thread',sides:[{pieceId:'triangle-a',copy:1,edgeIds:['bottom'],direction:'FORWARD'},{pieceId:'triangle-b',copy:1,edgeIds:['bottom'],direction:'REVERSE'}]},
        {id:'strap-install',type:'INSTALL',bomId:'strap',anchors:[{pieceId:'triangle-a',copy:1,point:[0.3,0.3]},{pieceId:'triangle-b',copy:1,point:[0.3,0.3]}]},
        {id:'button-install',type:'INSTALL',bomId:'button',anchors:[{pieceId:'triangle-a',copy:1,point:[0.4,0.5]}]},
        {id:'loop-install',type:'INSTALL',bomId:'loop',anchors:[{pieceId:'triangle-b',copy:1,point:[0.5,0.5]}]}],
      connections:[{id:'shoulder-mount',kind:'STRAP',fromComponentId:'strap',toComponentId:'body',assemblyIds:['strap-install'],complete:true},{id:'button-loop',kind:'CLOSURE',fromComponentId:'button',toComponentId:'loop',assemblyIds:['button-install','loop-install'],complete:true}],
      physicalClaims:['Load capacity, seam strength and assembled closure alignment are not engineered'],unsupportedClaims:[]},bom,
    stock:{complete:true,items:bom.filter(b=>b.source.kind==='STOCK').map(b=>({id:b.stockId,material:structuredClone(b.material),quantity:{value:b.material.type==='BUTTON'?10:500,unit:b.quantity.unit},availability:'AVAILABLE'}))}};
  // Grain belongs to the fabric record, not the strict geometry object.
  delete valid.fabric.geometry.grainDirectionDeg;
  const structural=structuredClone(valid);structural.pattern.components=structural.pattern.components.filter(c=>c.id==='body');
  structural.pattern.assembly=structural.pattern.assembly.filter(a=>a.type==='SEAM');structural.pattern.connections=[];structural.pattern.physicalClaims=[];
  structural.bom=structural.bom.filter(b=>['outer','thread'].includes(b.id));structural.stock.items=structural.stock.items.filter(s=>s.id==='thread-stock');
  const insufficient=structuredClone(valid);insufficient.stock.items.find(s=>s.id==='thread-stock').quantity.value=10;
  const incomplete=structuredClone(valid);delete incomplete.fabric.grainDirectionDeg;delete incomplete.nesting.request.fabric.grainDirectionDeg;
  for(const p of incomplete.nesting.request.pieces){delete p.grain;delete p.outlineBasis;delete p.seamAllowanceStatus;}
  incomplete.nesting.result=nest(incomplete.nesting.request);incomplete.stock.complete=false;incomplete.stock.items=incomplete.stock.items.filter(s=>s.id!=='button-stock');
  return {provenance:prior.provenance,assumptions:'Confirmed flag/revision, material specifications, grain, allowance inclusion, assembly metadata and stock are OFFLINE SYNTHETIC declarations, not real inventory or independently engineered facts.',requests:{structural,valid,insufficient,incomplete}};
}
module.exports={examples};