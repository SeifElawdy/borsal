const {examples:bridgeExamples}=require('../design-feasibility/examples');
function examples(){
  const base=bridgeExamples().synthetic,context=structuredClone(base.context),design=structuredClone(base.source.data);
  const cutting=[[0,0],[6,0],[6,4],[0,4]];
  design.id='authored-accessory-pocket';design.name='Manually authored small accessory pocket draft';design.category='TOTE_BAG';
  design.creative={description:'A flat open-top two-panel accessory pocket, not a complete tote or approved product',aesthetic:['Simple rectangular accessory'],intendedUse:'Offline drafting demonstration for a potential future bag'};
  design.technical.overallDimensions={width:5,height:3,depth:0.2};
  design.technical.bom.find(b=>b.id==='outer').quantity.value=48;
  design.technical.bom.find(b=>b.id==='thread').quantity.value=200;
  design.technical.components=[{id:'pocket',role:'POCKET',pieceIds:['pocket-panel']}];
  design.technical.patternPieces=[{id:'pocket-panel',bomId:'outer',cutCount:2,outlineBasis:'SEAM_LINE',
    outline:{start:[0.5,0.5],segments:[{id:'top',type:'LINE',to:[5.5,0.5]},{id:'right',type:'LINE',to:[5.5,3.5]},{id:'bottom',type:'LINE',to:[0.5,3.5]},{id:'left',type:'LINE',to:[0.5,0.5]}]},
    seamAllowanceCm:0.5,grainDirectionDeg:0,folds:[]}];
  design.technical.assembly=[{id:'three-side-seam',type:'SEAM',threadBomId:'thread',sides:[
    {pieceId:'pocket-panel',copy:1,edgeIds:['right','bottom','left'],direction:'FORWARD'},
    {pieceId:'pocket-panel',copy:2,edgeIds:['left','bottom','right'],direction:'REVERSE'}]}];
  design.technical.features=[{id:'pocket-feature',kind:'POCKET',intent:'Two flat panels joined on three sides; top deliberately open',componentIds:['pocket'],bomIds:['outer','thread']}];
  design.limitations=[{id:'construction-review',featureId:'pocket-feature',status:'PARTIAL',reason:'Accessory draft only; opening finish, assembled depth and seam performance are not engineered',missingInformation:['Opening finish specification','Independent dimensional and seam-strength review','Full parent bag design, if required']}];
  context.instances=[1,2].map(copy=>({id:'pocket-panel-'+copy,pieceId:'pocket-panel',copy,cuttingPolygonCm:structuredClone(cutting),allowancesIncluded:true,grainToleranceDeg:5,allowedRotationsDeg:[0,180]}));
  context.stock.items[0].quantity.value=1000;
  const complete={schemaVersion:'borsal.technical-draft/0.1',
    sourceConcept:{path:'experiments/technical-drafting/examples.js#manual-concept',data:{schemaVersion:'borsal.manual-concept/0.1',id:'accessory-pocket-concept',authorship:'HUMAN',
      brief:{id:'small-accessory',text:'A small open-top two-panel accessory pocket for a potential future bag; not a complete handbag.',requirements:['Two explicitly authored cutting panels','Join three sides and leave the top open','Use the labeled synthetic burgundy scrap for mathematical testing only']},
      creative:{shapeIntent:'Flat small open-top accessory pocket',visualIntent:['Plain rectangular panels'],modelDescription:'No AI model was used; explicitly authored offline example'}}},
    design:{path:'experiments/technical-drafting/examples.js#accessory-pocket',data:design},context};
  const incomplete=structuredClone(complete);delete incomplete.design.data.technical.overallDimensions;delete incomplete.design.data.technical.patternPieces[0].seamAllowanceCm;delete incomplete.context.instances[0].grainToleranceDeg;
  const invalid=structuredClone(complete);invalid.context.instances[0].cuttingPolygonCm=[[0,0],[6,4],[0,4],[6,0]];
  return {complete,incomplete,invalid};
}
module.exports={examples};
