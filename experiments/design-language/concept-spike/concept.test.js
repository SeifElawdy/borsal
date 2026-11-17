import { describe, it, expect, vi } from 'vitest';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { conceptSchema, technicalReviewQueue, REQUIRED_CHECKS } = require('./schema');
const cases = require('./cases.json');
const briefs = require('../ai-spike/briefs.json');
const { designSchema } = require('../schema');
const clone = () => structuredClone(cases[0]);
const brief = briefs.find(b=>b.id==='simple-shoulder');
describe('Offline staged concept proof',()=>{
  for(const c of cases) {
    it('preserves original requirements and source response for '+c.id,()=>{
      expect(conceptSchema.safeParse(c).success).toBe(true);
      expect(c.originalBrief).toEqual({id:brief.id,text:brief.brief,requirements:brief.requirements});
      expect(c.requirements.map(r=>r.briefRequirement)).toEqual(brief.requirements);
      const r=require('../ai-spike/fixtures/'+(c.id==='concept-eight-b'?'shoulder-003':'shoulder-70b')+'.json');
      const a=r.results[0].attempts[0];
      expect(crypto.createHash('sha256').update(a.text).digest('hex')).toBe(c.provenance.responseSha256);
      expect(c.creative.modelDescription).toBe(a.automated.proposal.creative.description);
      expect(designSchema.safeParse(a.automated.proposal).success).toBe(false);
    });
    it('does not turn concept validity into technical approval for '+c.id,()=>{
      const queue=technicalReviewQueue(c);
      expect(queue.status).toBe('NOT_APPROVED');
      expect(queue.manufacturingVerified).toBe(false);
      expect(queue.checks.map(x=>x.id)).toEqual(REQUIRED_CHECKS);
      expect(queue.checks.every(x=>x.status==='UNVERIFIED')).toBe(true);
      expect(c.connections.every(x=>x.status==='UNVERIFIED')).toBe(true);
    });
  }
  it('preserves a missing model requirement rather than dropping it',()=>{
    const c=clone();c.requirements[1].coverage='MISSING';
    expect(conceptSchema.parse(c).requirements[1].briefRequirement).toBe(brief.requirements[1]);
    c.requirements.splice(1,1);expect(conceptSchema.safeParse(c).success).toBe(false);
  });
  it('rejects changed requirement text',()=>{const c=clone();c.requirements[0].briefRequirement='Symmetric';expect(conceptSchema.safeParse(c).success).toBe(false);});
  it('keeps required accessories separate from unverified model allocations',()=>{
    for(const c of cases){expect(c.scrapCount).toBe(1);expect(c.materials.map(m=>[m.type,m.source])).toEqual([['WOVEN_FABRIC','SCRAP'],['WEBBING','STOCK'],['BUTTON','STOCK']]);expect(c.materials.every(m=>m.availability==='NOT_CHECKED')).toBe(true);}
  });
  it('rejects invented coordinates',()=>{const c=clone();c.connections[0].point=[1,2];expect(conceptSchema.safeParse(c).success).toBe(false);});
  it('rejects quantities masquerading as concept evidence',()=>{const c=clone();c.materials[0].quantity=50;expect(conceptSchema.safeParse(c).success).toBe(false);});
  it('rejects unsupported version',()=>{const c=clone();c.schemaVersion='borsal.concept/9';expect(conceptSchema.safeParse(c).success).toBe(false);});
  it('rejects unknown connection targets',()=>{const c=clone();c.connections[0].to='missing';expect(conceptSchema.safeParse(c).success).toBe(false);});
  it('rejects duplicate element identifiers',()=>{const c=clone();c.elements.push(c.elements[0]);expect(conceptSchema.safeParse(c).success).toBe(false);});
  it('requires informative unresolved details',()=>{const c=clone();c.limitations[0].missingInformation=[];expect(conceptSchema.safeParse(c).success).toBe(false);});
  it('refuses claimed verified attachment locations',()=>{const c=clone();c.connections[0].status='PASS';expect(conceptSchema.safeParse(c).success).toBe(false);});
  it('allows original shapes and tote concepts without a template',()=>{const c=clone();c.category='TOTE_BAG';c.creative.shapeIntent='A sculptural spiralling silhouette, construction undecided.';expect(conceptSchema.safeParse(c).success).toBe(true);});
  it('retains reviewed offline source fixtures and schema byte-for-byte',()=>{
    for(const [file,hash] of Object.entries(require('./protected-hashes.json'))){expect(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(file),'utf8').replace(/\r\n/g,'\n')).digest('hex'),file).toBe(hash);}
  });
  it('queues offline review without network or provider access',()=>{
    const spy=vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('Network prohibited'));
    try{cases.forEach(technicalReviewQueue);expect(spy).not.toHaveBeenCalled();}finally{spy.mockRestore();}
  });
});
