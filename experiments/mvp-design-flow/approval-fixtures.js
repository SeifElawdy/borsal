// Mathematical TEST_FIXTURE values ONLY. Never independent real measurements/stock.
const {fingerprint}=require('../ai-pattern-proposals/adapter');
const {dimensions,validateWithHoles}=require('../../src/geometry/polygon');
const ref=label=>({reference:'TEST_FIXTURE/'+label+'-NOT-REAL',sha256:fingerprint({scope:'TEST_FIXTURE',label})});
function stocks(p){return p.assessment.handoff.drafting.technicalMetadata.bom.filter(b=>b.source.kind==='STOCK').map(b=>({bomId:b.id,body:{scope:'TEST_FIXTURE',sku:'fixture-'+p._id+'-'+b.id,material:b.material,quantity:b.quantity,availability:'AVAILABLE',receipt:ref(b.id+'-stock')}}));}
function evidence(p,hashes){
  const f=p.provenance.sourceSnapshot,d=dimensions(f.polygonCm),v=validateWithHoles(f.polygonCm,f.holes||[]);
  return {scope:'TEST_FIXTURE',proposalHash:hashes.proposalHash,sourceHash:hashes.sourceHash,conceptReviewHash:hashes.conceptReviewHash,observedBy:'TEST_FIXTURE_EXPECTED_VALUES_NOT_REAL_OBSERVER',
    measurements:{method:'TEST_FIXTURE',widthCm:d.widthCm,heightCm:d.heightCm,areaCm2:v.netAreaCm2,grainDirectionDeg:f.grainDirectionDeg,maxErrorCm:0.000001,maxAreaErrorCm2:0.000001,maxGrainErrorDeg:0,report:ref('mathematical-dimensions')},
    materials:{method:'TEST_FIXTURE',material:p.assessment.handoff.drafting.technicalMetadata.bom.find(b=>b.source.kind==='SCRAP').material,report:ref('assumed-material')},
    construction:{method:'TEST_FIXTURE',sampleReport:ref('simulated-physical-checks'),checks:{DIMENSIONS:'PASS',FOLD_FIT:'PASS',RING_RETENTION:'PASS',SEAM_STRENGTH:'PASS',ABRASION:'PASS'},resolvedBlockerHashes:p.feasibility.layers.construction.reasons.map(fingerprint)},photos:[]};
}
module.exports={stocks,evidence};
