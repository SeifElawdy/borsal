const {pipelineExamples}=require('../pattern-feasibility/pipeline-examples');
function examples(){
  const p=pipelineExamples().requests.structural;
  const design={schemaVersion:'borsal.design/0.1',id:'synthetic-panels',name:'Synthetic two-panel reference test',category:'TOTE_BAG',
    creative:{description:'Two explicit flat triangular test panels; not a usable handbag',aesthetic:['Synthetic mathematical fixture'],intendedUse:'Offline adapter regression only'},
    technical:{dimensionUnit:'cm',evidence:'ILLUSTRATIVE_ONLY',overallDimensions:{width:2,height:2,depth:1},scrapSources:[{id:p.fabric.id}],
      bom:p.bom.map(({stockId,...b})=>b),components:[{id:'body',role:'BODY',pieceIds:['panel']}],
      patternPieces:[{id:'panel',bomId:'outer',cutCount:2,outlineBasis:'SEAM_LINE',outline:{start:[0.2,0.2],segments:[{id:'bottom',type:'LINE',to:[1.4,0.2]},{id:'diagonal',type:'LINE',to:[0.2,1.4]},{id:'left',type:'LINE',to:[0.2,0.2]}]},seamAllowanceCm:0.1,grainDirectionDeg:0,folds:[]}],
      assembly:[{id:'body-seam',type:'SEAM',threadBomId:'thread',sides:[{pieceId:'panel',copy:1,edgeIds:['bottom'],direction:'FORWARD'},{pieceId:'panel',copy:2,edgeIds:['bottom'],direction:'REVERSE'}]}],
      features:[{id:'body-feature',kind:'BODY',intent:'Two synthetic flat panels joined along a supplied stitching edge',componentIds:['body'],bomIds:['outer']}],},limitations:[]};
  const technical={schemaVersion:'borsal.design-bridge/0.1',source:{kind:'DESIGN',path:'experiments/design-feasibility/examples.js#synthetic-panels',data:design},
    context:{fabric:p.fabric,stock:p.stock,search:p.search,stockBindings:{thread:'thread-stock'},
      instances:p.pieces.map((piece,i)=>({id:piece.id,pieceId:'panel',copy:i+1,cuttingPolygonCm:piece.polygonCm,allowancesIncluded:true,grainToleranceDeg:piece.grain.toleranceDeg,allowedRotationsDeg:piece.allowedRotationsDeg}))}};
  const requests={};
  for(const concept of require('../design-language/concept-spike/cases.json'))requests[concept.id]={schemaVersion:'borsal.design-bridge/0.1',source:{kind:'CONCEPT',path:'experiments/design-language/concept-spike/cases.json#'+concept.id,data:concept}};
  for(const [name,file]of [['eight-b-original','shoulder-003'],['seventy-b-original','shoulder-70b']]){
    const fixture=require('../design-language/ai-spike/fixtures/'+file+'.json');
    requests[name]={schemaVersion:'borsal.design-bridge/0.1',source:{kind:'DESIGN',path:'experiments/design-language/ai-spike/fixtures/'+file+'.json#initial',data:fixture.results[0].attempts[0].automated.proposal}};
  }
  requests.synthetic=technical;
  requests.shortage=structuredClone(technical);requests.shortage.context.stock.items[0].quantity.value=10;
  requests.incomplete=structuredClone(technical);delete requests.incomplete.context.instances;
  requests.invalid=structuredClone(technical);requests.invalid.source.data.technical.assembly[0].threadBomId='missing';
  return requests;
}
module.exports={examples};
