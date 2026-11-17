const {fingerprint}=require('./adapter');
function envelope(sourceConcept,proposal,origin='MANUAL_FIXTURE',attribution={}){
  return {schemaVersion:'borsal.ai-pattern-proposal/0.1',sourceConcept,...(proposal===undefined?{}:{proposal}),
    provenance:{origin,sourcePath:origin==='MANUAL_FIXTURE'?'experiments/ai-pattern-proposals/examples.js#manual':sourceConcept.path,
      conceptSha256:fingerprint(sourceConcept),proposalSha256:fingerprint(proposal??null),...attribution}};
}
function examples(){
  const authored=require('../technical-drafting/examples').examples(),requests={};
  for(const concept of require('../design-language/concept-spike/cases.json'))requests[concept.id]=envelope({path:'experiments/design-language/concept-spike/cases.json#'+concept.id,data:concept},undefined,'CONCEPT_ONLY');
  for(const [name,r]of Object.entries(authored))requests[name]=envelope(r.sourceConcept,{design:r.design,context:r.context});
  const small=structuredClone(authored.complete);small.context.fabric.geometry.polygonCm=[[0,0],[7,0],[7,5],[0,5]];small.context.fabric.geometry.holes=[];
  requests['insufficient-fabric']=envelope(small.sourceConcept,{design:small.design,context:small.context});
  const stock=structuredClone(authored.complete);stock.context.stock.items[0].quantity.value=10;
  requests['insufficient-material']=envelope(stock.sourceConcept,{design:stock.design,context:stock.context});
  const bad=structuredClone(authored.complete);bad.design.data.technical.assembly[0].sides[0].edgeIds=['missing'];
  requests['invalid-reference']=envelope(bad.sourceConcept,{design:bad.design,context:bad.context});
  return requests;
}
module.exports={examples,envelope};
