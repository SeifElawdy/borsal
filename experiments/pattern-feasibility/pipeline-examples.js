const {examples}=require('./precheck-examples');
function pipelineExamples(){
  const prior=examples(),requests={};
  for(const [name,r]of Object.entries(prior.requests)){
    requests[name]={schemaVersion:'borsal.feasibility-pipeline/0.1',unit:'cm',fabric:r.fabric,
      pieces:r.nesting.request.pieces,search:r.nesting.request.search,pattern:r.pattern,bom:r.bom,stock:r.stock,
      provenance:{label:'SYNTHETIC_BURGUNDY_FABRIC_TEST_FIXTURE',source:'experiments/pattern-feasibility/synthetic-fabric.json',assumptions:prior.assumptions}};
  }
  requests.bounded=structuredClone(requests.structural);requests.bounded.search.maxCandidates=1;
  requests.invalid=structuredClone(requests.structural);requests.invalid.pieces[0].polygonCm=[[0,0],[2,2],[0,2],[2,0]];
  requests.references=structuredClone(requests.structural);requests.references.pattern.assembly[0].threadBomId='missing';
  return {sourceProvenance:prior.provenance,requests};
}
module.exports={pipelineExamples};
