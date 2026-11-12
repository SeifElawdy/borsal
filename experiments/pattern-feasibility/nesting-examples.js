const {examples}=require('./examples');
function nestingExamples(){
  const demo=examples(),base=demo.layouts.pass;
  const request={schemaVersion:'borsal.nesting/0.1',unit:'cm',fabric:base.fabric,
    pieces:base.pieces.map(({placement,...p})=>({...p,allowedRotationsDeg:[0,180]})),
    search:{gridStepsCm:[2,1,0.5],maxCandidates:2000,maxBacktracks:20}};
  return {provenance:demo.provenance,assumptions:demo.assumptions,requests:{synthetic:request,bounded:{...request,search:{...request.search,maxCandidates:1}}}};
}
module.exports={nestingExamples};
