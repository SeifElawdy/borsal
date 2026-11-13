import {describe,it,expect,vi} from 'vitest';
const {evaluateProposal,fingerprint}=require('./adapter');
const {examples,envelope}=require('./examples');
const {draft}=require('../technical-drafting/draft');
const input=(name='complete')=>structuredClone(examples()[name]);
const reseal=r=>{r.provenance.conceptSha256=fingerprint(r.sourceConcept);r.provenance.proposalSha256=fingerprint(r.proposal??null);return r;};
describe('Offline AI-pattern proposal intake',()=>{
  for(const name of ['concept-eight-b','concept-seventy-b'])it('preserves '+name+' requirements and source provenance without drafting missing geometry',()=>{
    const r=input(name),out=evaluateProposal(r);expect(out.status).toBe('CONCEPT_ONLY');expect(out.verdict).toBe('UNVERIFIED');
    expect(out.sourceSnapshot.sourceConcept).toEqual(r.sourceConcept);expect(out.creativeReview.requirementLedger).toEqual(r.sourceConcept.data.requirements);
    expect(out.creativeReview.connections).toEqual(r.sourceConcept.data.connections);expect(out.creativeReview.limitations).toEqual(r.sourceConcept.data.limitations);
    expect(out.unresolved.filter(x=>x.code==='CREATIVE_REQUIREMENT_UNVERIFIED')).toHaveLength(4);expect(out.draft.bridge).toBe(null);expect(out.draft.cuttingPieces).toEqual([]);expect(out.liveInferencePerformed).toBe(false);
  });
  it('hands explicit authored geometry to 5B unchanged and preserves all feasibility evidence',()=>{
    const r=input(),out=evaluateProposal(r);expect(out.status).toBe('CHECKED');expect(out.verdict).toBe('UNVERIFIED');
    expect(out.draft).toEqual(draft({schemaVersion:'borsal.technical-draft/0.1',sourceConcept:r.sourceConcept,...r.proposal}));
    expect(out.draft.bridge.pipeline.layers.geometry.status).toBe('PASS');expect(out.draft.cuttingPieces.map(p=>p.polygonCm)).toEqual(r.proposal.context.instances.map(i=>i.cuttingPolygonCm));
    expect(out.provenance.integrity).toBe('PASS');expect(out.provenance.origin).toBe('MANUAL_FIXTURE');expect(out.manufacturingVerified).toBe(false);
  });
  it('preserves missing dimensions, allowance and grain as unresolved with exact paths',()=>{
    const r=input('incomplete'),out=evaluateProposal(r);expect(out.status).toBe('CONCEPT_ONLY');expect(out.draft.bridge).toBe(null);expect(out.draft.previewSvg).toBe(null);
    expect(out.unresolved.some(i=>i.path?.includes('overallDimensions'))).toBe(true);expect(out.unresolved.some(i=>i.path?.includes('seamAllowanceCm'))).toBe(true);
    expect(out.unresolved.some(i=>i.code==='GRAIN_TOLERANCE_REQUIRED')).toBe(true);
  });
  it('rejects malformed cutting geometry and invalid references rather than repairing them',()=>{
    for(const name of ['invalid','invalid-reference']){const out=evaluateProposal(input(name));expect(out.status).toBe('REJECTED');expect(out.verdict).toBe('FAIL');expect(out.errors.length).toBeGreaterThan(0);expect(out.draft.previewSvg).toBe(null);}
  });
  it('returns checked necessary-area failure for insufficient fabric without claiming global impossibility',()=>{
    const out=evaluateProposal(input('insufficient-fabric'));expect(out.status).toBe('CHECKED');expect(out.verdict).toBe('FAIL');
    const p=out.draft.bridge.pipeline;expect(p.layers.geometry.status).toBe('FAIL');expect(p.evidence.nesting.reason).toBe('AREA_PRECHECK_FAILED');expect(p.globalFeasibility).toBe('NOT_ASSESSED');expect(p.placements).toEqual([]);
  });
  it('returns checked material shortage without replacing the BOM or consuming supplied stock',()=>{
    const r=input('insufficient-material'),before=JSON.stringify(r),out=evaluateProposal(r);expect(out.status).toBe('CHECKED');expect(out.verdict).toBe('FAIL');
    expect(out.draft.bridge.pipeline.layers.geometry.status).toBe('PASS');expect(out.draft.bridge.pipeline.layers.materials.status).toBe('FAIL');
    expect(out.draft.bridge.pipeline.evidence.precheck.stockChecks.find(s=>s.stockId==='thread-stock')).toMatchObject({required:200,available:10,unit:'cm'});expect(JSON.stringify(r)).toBe(before);
  });
  it('refuses altered concept/proposal payloads before any drafting handoff',()=>{
    const a=input();a.sourceConcept.data.brief.text+=' changed';const x=evaluateProposal(a);expect(x.errors[0].code).toBe('CONCEPT_HASH_MISMATCH');expect(x.draft).toBe(null);
    const b=input();b.proposal.context.instances[0].cuttingPolygonCm[0][0]=0.1;const y=evaluateProposal(b);expect(y.errors[0].code).toBe('PROPOSAL_HASH_MISMATCH');expect(y.draft).toBe(null);
  });
  it('keeps provenance independent of structural validation and never treats a matching hash as approval',()=>{
    const r=input();r.provenance.origin='SAVED_AI_OUTPUT';r.provenance.modelId='offline-attribution-test';r.provenance.campaignId='offline-fixture-no-request';
    const out=evaluateProposal(r);expect(out.status).toBe('CHECKED');expect(out.provenance.authorship).toBe('NOT_INDEPENDENTLY_VERIFIED');expect(out.liveInferencePerformed).toBe(false);expect(out.creativeReview.status).toBe('UNVERIFIED');expect(out.verdict).toBe('UNVERIFIED');
  });
  it('rejects missing or contradictory attribution, hashes, versions and extra fields',()=>{
    for(const edit of [r=>delete r.provenance,r=>r.provenance.proposalSha256='bad',r=>r.provenance.sourcePath='  ',r=>r.schemaVersion='bad',r=>r.extra=true,r=>r.provenance.origin='CONCEPT_ONLY',r=>r.provenance.modelId='fake',r=>{r.provenance.origin='SAVED_AI_OUTPUT';}]){
      const r=input();edit(r);const out=evaluateProposal(r);expect(out.status).toBe('REJECTED');expect(out.errors[0].code).toBe('INVALID_PROPOSAL_ENVELOPE');expect(out.draft).toBe(null);
    }
  });
  it('does not trust claimed creative coverage as independent proof of preservation',()=>{
    const r=input('concept-eight-b');r.sourceConcept.data.requirements[0].coverage='CLAIMED';reseal(r);
    const out=evaluateProposal(r);expect(out.creativeReview.status).toBe('UNVERIFIED');expect(out.unresolved.some(i=>i.requirementId===r.sourceConcept.data.requirements[0].id&&i.coverage==='CLAIMED')).toBe(true);
  });
  it('rejects wrong units, malformed dimensions and impossible attachments after integrity succeeds',()=>{
    for(const edit of [r=>r.proposal.design.data.technical.dimensionUnit='mm',r=>r.proposal.design.data.technical.overallDimensions.width=-1,r=>r.proposal.context.instances[0].cuttingPolygonCm[0][0]=Infinity,
      r=>r.proposal.design.data.technical.assembly.push({id:'attach',type:'ATTACH',threadBomId:'thread',from:{pieceId:'pocket-panel',copy:1,point:[99,99]},to:{pieceId:'pocket-panel',copy:2,point:[1,1]}})]){
      const r=input();edit(r);reseal(r);const out=evaluateProposal(r);expect(out.status).toBe('REJECTED');expect(out.provenance.integrity).toBe('PASS');expect(out.errors.length).toBeGreaterThan(0);
    }
  });
  it('rejects unserializable payloads safely without inference or opaque crashes',()=>{
    const r=input();r.proposal.context.circular=r.proposal;const out=evaluateProposal(r);expect(out.status).toBe('REJECTED');expect(out.errors[0].code).toBe('NON_JSON_PROVENANCE_PAYLOAD');expect(out.draft).toBe(null);
  });
  it('preserves missing stock, allowance geometry and attachment points rather than inventing them',()=>{
    for(const edit of [r=>delete r.proposal.context.stock,r=>r.proposal.context.instances=[],r=>r.proposal.design.data.technical.assembly.push({id:'attach',type:'ATTACH',threadBomId:'thread',from:{pieceId:'pocket-panel',copy:1},to:{pieceId:'pocket-panel',copy:2,point:[1,1]}})]){
      const r=input();edit(r);reseal(r);const out=evaluateProposal(r);expect(out.status).toBe('CONCEPT_ONLY');expect(out.unresolved.length).toBeGreaterThan(0);expect(out.draft.bridge?.pipeline??null).toBe(null);
    }
  });
  it('preserves bounded search uncertainty and unsupported construction details',()=>{
    const r=input();r.proposal.context.search.maxCandidates=1;reseal(r);const out=evaluateProposal(r);expect(out.status).toBe('CHECKED');expect(out.verdict).toBe('UNVERIFIED');expect(out.draft.bridge.pipeline.evidence.nesting.reason).toBe('CANDIDATE_LIMIT');
    expect(out.draft.technicalMetadata.limitations[0].missingInformation).toContain('Opening finish specification');
  });
  it('preserves original saved invalid model outputs without an implicit repair',()=>{
    for(const [file,modelId]of [['shoulder-003','@cf/meta/llama-3.1-8b-instruct'],['shoulder-70b','@cf/meta/llama-3.3-70b-instruct-fp8-fast']]){
      const r=input(file==='shoulder-003'?'concept-eight-b':'concept-seventy-b'),fixture=require('../design-language/ai-spike/fixtures/'+file+'.json');
      const proposal={design:{path:'experiments/design-language/ai-spike/fixtures/'+file+'.json#initial',data:fixture.results[0].attempts[0].automated.proposal}};
      const envelopeInput=envelope(r.sourceConcept,proposal,'SAVED_AI_OUTPUT',{modelId,campaignId:r.sourceConcept.data.provenance.campaignId});const before=JSON.stringify(envelopeInput),out=evaluateProposal(envelopeInput);
      expect(out.status).toBe('REJECTED');expect(out.draft.bridge).toBe(null);expect(JSON.stringify(envelopeInput)).toBe(before);
    }
  });
  it('is deterministic, immutable, detached from subsequent edits and network-free',()=>{
    const r=input(),before=JSON.stringify(r),spy=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('Network prohibited'));
    try{const out=evaluateProposal(r);expect(out).toEqual(evaluateProposal(r));expect(JSON.stringify(r)).toBe(before);expect(spy).not.toHaveBeenCalled();r.proposal.context.stock.items[0].quantity.value=0;expect(out.sourceSnapshot.proposal.context.stock.items[0].quantity.value).toBe(1000);}finally{spy.mockRestore();}
  });
  it('runs reproducible demo and actual JSON-file CLI outcomes offline',()=>{
    const {main}=require('./run'),demo=main(['--demo']);expect(demo.results.complete.status).toBe('CHECKED');expect(demo.results['insufficient-fabric'].verdict).toBe('FAIL');
    const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-proposal-'));
    try{for(const [name,exit]of [['complete',3],['concept-eight-b',3],['invalid-reference',2],['insufficient-material',2]]){
      const file=path.join(root,name+'.json');fs.writeFileSync(file,JSON.stringify(input(name)));const result=cp.spawnSync(process.execPath,[path.join(__dirname,'run.js'),file],{encoding:'utf8'});expect(result.status).toBe(exit);expect(JSON.parse(result.stdout).liveInferencePerformed).toBe(false);
    }}finally{if(path.dirname(root)!==os.tmpdir()||!path.basename(root).startsWith('borsal-proposal-'))throw Error('Unsafe cleanup');fs.rmSync(root,{recursive:true,force:true});}
  });
});
