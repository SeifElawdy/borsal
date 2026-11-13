import {describe,it,expect,vi} from 'vitest';
const {creativeConceptSchema}=require('./schema');
const {sourceRecords,messages,assess,reviewConcept,handoff,generateConcept}=require('./workflow');
const {concepts,decision,demos}=require('./examples');
const {cloudflareProvider}=require('../design-language/ai-spike/provider');
const raw=()=>JSON.stringify(concepts().petal);
describe('Offline staged creative concepts and review',()=>{
  it('accepts useful concept-only content and preserves exact raw text/source hashes',()=>{
    const text=' \n'+raw()+'\n',r=assess(text);expect(r.schemaValid).toBe(true);expect(r.status).toBe('CONCEPT_ONLY');expect(r.verdict).toBe('UNVERIFIED');expect(r.reviewGate).toBe('PENDING_REVIEW');expect(r.rawText).toBe(text);expect(r.proposal.productIdea.name).toBe('Burgundy Petal Cable Nest');expect(r.provenance.proposalSha256).toMatch(/^[a-f0-9]{64}$/);expect(r.provenance.sources[0].data).toEqual(require('../pattern-feasibility/synthetic-fabric.json'));expect(r.manufacturingVerified).toBe(false);
  });
  it('generates one offline mocked concept through the existing provider interface without retries',async()=>{
    const provider={mode:'MOCK',model:'fixture-only',generate:vi.fn(async()=>({text:raw(),usage:null}))};const r=await generateConcept({provider});
    expect(provider.generate).toHaveBeenCalledTimes(1);expect(provider.generate).toHaveBeenCalledWith(messages());expect(r).toMatchObject({mode:'MOCK',requests:1,liveRequests:0,repairs:0});expect(r.assessment.schemaValid).toBe(true);expect(r.response.text).toBe(raw());
  });
  it('prevents every live provider call, including the real adapter with an injected HTTP mock',async()=>{
    const fetchImpl=vi.fn(),provider=cloudflareProvider({accountId:'mock',apiToken:'mock',freeTierConfirmed:true,fetchImpl});await expect(generateConcept({provider})).rejects.toThrow('LIVE_GENERATION_DISABLED');expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('stops on mock provider failure without leaking messages or retrying',async()=>{
    const provider={mode:'MOCK',generate:vi.fn(async()=>{throw Error('SECRET_MUST_NOT_LEAK');})};const r=await generateConcept({provider});expect(r.status).toBe('PROVIDER_FAILED');expect(provider.generate).toHaveBeenCalledTimes(1);expect(JSON.stringify(r)).not.toContain('SECRET_MUST_NOT_LEAK');
  });
  it('provides known synthetic geometry only as prompt context without a fixed template or technical output fields',()=>{
    const prompt=messages(),data=JSON.parse(prompt[1].content);expect(data.sources[0].geometry).toEqual(require('../pattern-feasibility/synthetic-fabric.json'));expect(data.sources[0].areaCm2).toBeCloseTo(162.045910493827,8);
    expect(prompt[0].content).toContain('no cutting polygons');expect(prompt[0].content).toContain('no fixed product or bag template');expect(prompt[0].content).not.toContain('seamAllowanceCm');expect(prompt[0].content).not.toContain('TOTE_BAG');expect(Buffer.byteLength(JSON.stringify(prompt))).toBeLessThan(6000);
  });
  it('rejects malformed JSON, wrong versions, blank fields and extra numeric technical properties',()=>{
    expect(assess('```json\n{}\n```').status).toBe('REJECTED');
    for(const change of [p=>p.schemaVersion='bad',p=>p.intendedUse=' ',p=>p.productIdea.widthCm=10,p=>p.cuttings=[[0,0],[1,1],[0,1]],p=>p.stock={available:true},p=>p.material={fiber:'COTTON'},p=>p.review={decision:'APPROVED_FOR_DRAFTING'}]){
      const p=concepts().petal;change(p);const r=assess(JSON.stringify(p));expect(r.status).toBe('REJECTED');expect(r.schemaValid).toBe(false);expect(r.handoff).toBe(null);
    }
  });
  it('keeps missing fields incomplete and actionable rather than inventing a product use',()=>{
    const p=concepts().petal;delete p.intendedUse;const r=assess(JSON.stringify(p));expect(r.status).toBe('CONCEPT_ONLY');expect(r.reviewGate).toBe('INCOMPLETE');expect(r.missingRequirements[0].path).toEqual(['intendedUse']);expect(r.schemaValid).toBe(false);
  });
  it('rejects duplicate IDs/references, unknown source IDs and empty unresolved details',()=>{
    for(const change of [p=>p.distinctiveFeatures.push(p.distinctiveFeatures[0]),p=>p.sourceReferences.push(p.sourceReferences[0]),p=>p.sourceReferences=['missing-source'],p=>p.unresolvedRequirements[0].neededInformation=[],p=>p.unresolvedRequirements=[]]){const p=concepts().petal;change(p);expect(assess(JSON.stringify(p)).status).toBe('REJECTED');}
  });
  it('permits original non-bag products and unusual features without a manufacturing claim',()=>{
    const p=concepts().leaf;p.productIdea.name='Sculptural Folded Page Signal';p.distinctiveFeatures.push({id:'novel-feature',description:'An asymmetrical fabric gesture with construction undecided'});expect(creativeConceptSchema.safeParse(p).success).toBe(true);expect(assess(JSON.stringify(p)).manufacturingVerified).toBe(false);
  });
  it('records an explicit approval for drafting, never for manufacturing',()=>{
    const text=raw(),d=decision(text),r=reviewConcept(text,d);expect(r.reviewGate).toBe('APPROVED_FOR_DRAFTING');expect(r.status).toBe('CONCEPT_ONLY');expect(r.review.snapshot).toEqual(d);expect(r.review.reviewerIdentity).toBe('DECLARED_NOT_AUTHENTICATED');expect(r.manufacturingVerified).toBe(false);expect(r.handoff).toBe(null);
  });
  it('blocks unreviewed, revision and rejection states from the drafting handoff',()=>{
    const text=raw();expect(handoff(text,undefined).reviewGate).toBe('BLOCKED');
    const revised=handoff(text,decision(text,'REVISE'));expect(revised.reviewGate).toBe('REVISE');expect(revised.status).toBe('CONCEPT_ONLY');expect(revised.handoff).toBe(null);
    const rejected=handoff(text,decision(text,'REJECTED'));expect(rejected.reviewGate).toBe('REJECTED');expect(rejected.status).toBe('REJECTED');expect(rejected.handoff).toBe(null);
  });
  it('rejects missing reviewer/rationale, invalid decisions and forged manufacturing fields',()=>{
    for(const edit of [d=>d.reviewer=' ',d=>d.rationale='',d=>d.decision='APPROVED',d=>d.manufacturingVerified=true]){const text=raw(),d=decision(text);edit(d);const r=reviewConcept(text,d);expect(r.status).toBe('REJECTED');expect(r.reviewGate).toBe('BLOCKED');}
  });
  it('binds review to exact raw proposal bytes, even for whitespace-only edits',()=>{
    const text=raw(),d=decision(text);for(const changed of [text+'\n',text.replace('Petal Cable','Petal Cord')]){const r=reviewConcept(changed,d);expect(r.reviewGate).toBe('BLOCKED');expect(r.errors.some(e=>e.code==='STALE_REVIEW')).toBe(true);}
  });
  it('blocks stale or partial source hashes and changed geometry without changing real fixtures',()=>{
    const text=raw(),d=decision(text),sources=sourceRecords();sources[0].data.polygonCm[0][0]+=1;expect(reviewConcept(text,d,{sources}).reviewGate).toBe('BLOCKED');
    d.sourceHashes={};expect(reviewConcept(text,d).errors.some(e=>e.code==='STALE_REVIEW')).toBe(true);
  });
  it('cannot approve a malformed or incomplete concept even with matching hashes',()=>{
    const text=raw(),d=decision(text),p=concepts().petal;delete p.intendedUse;const changed=JSON.stringify(p);d.proposalSha256=assess(changed).provenance.proposalSha256;const r=reviewConcept(changed,d);expect(r.reviewGate).toBe('BLOCKED');expect(r.errors.some(e=>e.code==='CONCEPT_NOT_REVIEWABLE')).toBe(true);expect(r.handoff).toBe(null);
  });
  it('requires an explicitly reviewer-authored brief rather than relabeling a model concept HUMAN',()=>{
    const text=raw(),d=decision(text);delete d.draftingBrief;const r=handoff(text,d);expect(r.reviewGate).toBe('APPROVED_FOR_DRAFTING');expect(r.handoff).toBe(null);expect(r.missingRequirements[0].code).toBe('REVIEWER_AUTHORED_DRAFTING_BRIEF_REQUIRED');
  });
  it('hands approved review metadata to existing 5B while missing geometry stays CONCEPT_ONLY',()=>{
    const text=raw(),d=decision(text),r=handoff(text,d);expect(r.handoff.drafting.status).toBe('CONCEPT_ONLY');expect(r.handoff.drafting.bridge).toBe(null);expect(r.handoff.drafting.cuttingPieces).toEqual([]);
    expect(r.handoff.sourceProposalSha256).toBe(r.provenance.proposalSha256);expect(r.handoff.reviewSha256).toBe(r.review.sha256);expect(r.handoff.request.sourceConcept.data).toEqual(d.draftingBrief);
    expect(r.handoff.unresolvedCreativeRequirements).toEqual(concepts().petal.unresolvedRequirements);expect(r.handoff.drafting.unresolved.some(m=>m.code==='EXPLICIT_TECHNICAL_DESIGN_REQUIRED')).toBe(true);
  });
  it('delegates explicitly provided technical data to 5B without generating patterns or stock',()=>{
    const p=concepts().petal;p.productIdea={name:'Accessory Pocket',description:'An explicitly authored small pocket concept'};p.intendedUse='Carry a small item';const text=JSON.stringify(p),d=decision(text),technical=require('../technical-drafting/examples').examples().complete;
    const r=handoff(text,d,{design:technical.design,context:technical.context});expect(r.status).toBe('CHECKED');expect(r.verdict).toBe('UNVERIFIED');expect(r.handoff.drafting.bridge.pipeline.layers.geometry.status).toBe('PASS');expect(r.manufacturingVerified).toBe(false);
  });
  it('does not mutate inputs and snapshots remain detached from later edits',()=>{
    const text=raw(),d=decision(text),before=JSON.stringify(d),r=handoff(text,d);expect(JSON.stringify(d)).toBe(before);d.draftingBrief.brief.text='Changed later';expect(r.review.snapshot.draftingBrief.brief.text).not.toBe('Changed later');expect(r.handoff.request.sourceConcept.data.brief.text).not.toBe('Changed later');expect(r).toEqual(handoff(text,JSON.parse(before)));
  });
  it('runs generation/review demos without network or real budget changes',async()=>{
    const spy=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('Network forbidden'));
    try{const r=await demos();expect(r.approved.result.reviewGate).toBe('APPROVED_FOR_DRAFTING');expect(r.approved.result.handoff.drafting.status).toBe('CONCEPT_ONLY');expect(r.revise.result.reviewGate).toBe('REVISE');expect(r.rejected.result.status).toBe('REJECTED');expect(r.incomplete.result.status).toBe('CONCEPT_ONLY');expect(r.malformed.result.status).toBe('REJECTED');expect(spy).not.toHaveBeenCalled();}finally{spy.mockRestore();}
  });
  it('preserves raw proposal/review/reports with CLI overwrite protection and no live option',()=>{
    const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),root=fs.mkdtempSync(path.join(os.tmpdir(),'borsal-staged-'));
    try{const dir=path.join(root,'demo'),run=args=>cp.spawnSync(process.execPath,[path.join(__dirname,'run.js'),...args],{encoding:'utf8'}),first=run(['--demo',dir]);expect(first.status).toBe(0);const rawFile=path.join(dir,'approved-raw.txt'),reviewFile=path.join(dir,'approved-review.json');
      expect(fs.readFileSync(rawFile,'utf8')).toBe(raw());expect(JSON.parse(fs.readFileSync(reviewFile,'utf8')).decision).toBe('APPROVED_FOR_DRAFTING');const before=fs.readFileSync(path.join(dir,'approved-report.json'),'utf8');expect(run(['--demo',dir]).status).toBe(1);expect(fs.readFileSync(path.join(dir,'approved-report.json'),'utf8')).toBe(before);
      const reviewed=run(['--review',rawFile,reviewFile]);expect(reviewed.status).toBe(3);expect(JSON.parse(reviewed.stdout).reviewed.reviewGate).toBe('APPROVED_FOR_DRAFTING');expect(run(['--live']).status).toBe(1);
    }finally{if(path.dirname(root)!==os.tmpdir()||!path.basename(root).startsWith('borsal-staged-'))throw Error('Unsafe cleanup');fs.rmSync(root,{recursive:true,force:true});}
  });
});
