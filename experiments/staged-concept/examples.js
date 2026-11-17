const {assess,handoff,generateConcept}=require('./workflow');
function concepts(){
  const petal={schemaVersion:'borsal.creative-concept/0.1',id:'petal-cable-nest',productIdea:{name:'Burgundy Petal Cable Nest',description:'A soft accessory with overlapping petal-like tabs that cradle a coiled cable'},intendedUse:'Keep a coiled cable together in a bag',
    distinctiveFeatures:[{id:'petal-silhouette',description:'A layered petal silhouette rather than a conventional straight band'},{id:'tuck-intent',description:'Tabs tuck around the coil; workable retention still needs review'}],sourceReferences:['burgundy-scrap'],constraints:['Only the supplied synthetic burgundy scrap is referenced','Material behavior, dimensions and fit are unknown'],
    unresolvedRequirements:[{id:'retention',description:'Retention and edge finish are undecided',neededInformation:['A technical pattern and independent retention test','Actual material properties and fraying behavior']},{id:'scale',description:'Physical size and scrap accuracy remain unverified',neededInformation:['Independent measurements and user needs']}]};
  const leaf=structuredClone(petal);leaf.id='leaf-bookmark-beacon';leaf.productIdea={name:'Folded Leaf Bookmark Beacon',description:'A soft corner bookmark with a layered leaf-like silhouette that peeks beyond a page'};leaf.intendedUse='Mark a page corner without a metal clip';
  leaf.distinctiveFeatures=[{id:'leaf-marker',description:'Offset leaf layers create an identifiable marker silhouette'}];leaf.unresolvedRequirements[0]={id:'page-contact',description:'Page contact and fabric edge behavior are unknown',neededInformation:['Review of page protection, retention and edge finish']};
  return {petal,leaf};
}
function decision(rawText,value='APPROVED_FOR_DRAFTING'){
  const a=assess(rawText),p=a.proposal;
  return {decision:value,reviewer:'OFFLINE_DEMO_REVIEWER',rationale:'Simulated review fixture only; not a real project-owner approval or manufacturing decision',proposalSha256:a.provenance.proposalSha256,sourceHashes:Object.fromEntries(a.provenance.sources.map(s=>[s.id,s.sha256])),
    ...(value==='APPROVED_FOR_DRAFTING'?{draftingBrief:{schemaVersion:'borsal.manual-concept/0.1',id:'reviewed-'+p.id,authorship:'HUMAN',brief:{id:p.id,text:'Reviewer-authored drafting brief for '+p.productIdea.name,requirements:[p.intendedUse,...p.distinctiveFeatures.map(f=>f.description),'Keep all unresolved requirements open until technical review']},creative:{shapeIntent:p.productIdea.description,visualIntent:p.distinctiveFeatures.map(f=>f.description),modelDescription:'Human-authored demo review brief derived from a separately preserved OFFLINE MOCK proposal; no live model output'}}}:{})};
}
async function demos(){
  const c=concepts(),out={};
  for(const [id,proposal,reviewDecision]of [['approved',c.petal,'APPROVED_FOR_DRAFTING'],['revise',c.leaf,'REVISE'],['rejected',c.leaf,'REJECTED']]){
    const rawText=JSON.stringify(proposal),generation=await generateConcept({provider:{mode:'MOCK',model:'explicit-offline-fixture',generate:async()=>({text:rawText,usage:null})}}),review=decision(rawText,reviewDecision);
    out[id]={generation,review,result:handoff(rawText,review)};
  }
  const incomplete=structuredClone(c.petal);delete incomplete.intendedUse;
  out.incomplete={result:assess(JSON.stringify(incomplete))};
  out.malformed={result:assess(JSON.stringify({...c.petal,cuttingPolygonCm:[[0,0],[1,0],[0,1]]}))};
  return out;
}
module.exports={concepts,decision,demos};
