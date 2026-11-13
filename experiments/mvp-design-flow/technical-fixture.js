// Explicitly authored SYNTHETIC fixture. Bind its scrap references to the API alias;
// never use this helper to repair an imported model proposal or real material data.
function proposal(scrapId){
  const r=require('../technical-drafting/examples').examples().complete;
  r.design.data.technical.scrapSources=[{id:scrapId}];
  for(const b of r.design.data.technical.bom)if(b.source.kind==='SCRAP')b.source.scrapId=scrapId;
  const {fabric,...context}=r.context;
  return {design:r.design,context,fabricMaterialDeclaration:{basis:'SYNTHETIC_FIXTURE',material:fabric.material}};
}
function concepts(sourceId){
  const {petal,leaf}=require('../staged-concept/examples').concepts();
  petal.id='synthetic-accessory-pocket';petal.productIdea={name:'Synthetic accessory pocket',description:'An explicitly authored open-top pocket for a future bag'};petal.intendedUse='Organize small objects inside a future bag';
  petal.distinctiveFeatures=[{id:'open-top',description:'Two flat panels joined along three sides, leaving the top open'}];
  petal.unresolvedRequirements=[{id:'physical-checks',description:'Opening finish and physical construction remain unverified',neededInformation:['Independent dimensions and seam strength','Actual material behavior']}];
  for(const c of [petal,leaf])c.sourceReferences=[sourceId];return [petal,leaf];
}
module.exports={proposal,concepts};
