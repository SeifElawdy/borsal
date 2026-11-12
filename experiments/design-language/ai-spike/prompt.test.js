import { describe, it, expect } from 'vitest';
const { z } = require('zod');
const { designSchema, VERSION } = require('../schema');
const { initialMessages, repairMessages, contractText, groupErrors } = require('./prompt');
const briefs = require('./briefs.json');
const oldCampaign = require('./fixtures/shoulder-001.json');
const source = z.toJSONSchema(designSchema, { target: 'draft-7' });
const contract = contractText();
const definition = (name) => contract.split('\n').find((line) => line.startsWith(name + '='));

describe('Schema-derived compact prompt contract', () => {
  it('keeps correct required root and technical nesting from the real schema', () => {
    for (const name of source.required) expect(definition('Root')).toContain(name + ':');
    for (const name of source.properties.technical.required) expect(definition('Technical')).toContain(name + ':');
    expect(definition('Root')).toContain('limitations:Limitation[]');
    expect(definition('Technical')).not.toContain('limitations:');
    expect(contract).toContain('Every listed field is REQUIRED unless marked ?');
    expect(contract).toContain(VERSION);
  });
  it('derives exact component roles and feature kinds instead of merging the enums', () => {
    const roles = source.properties.technical.properties.components.items.properties.role.enum;
    const kinds = source.properties.technical.properties.features.items.properties.kind.enum;
    for (const role of roles) expect(definition('Component')).toContain(JSON.stringify(role));
    for (const kind of kinds) expect(definition('Feature')).toContain(JSON.stringify(kind));
    expect(definition('Component')).not.toContain('CLOSURE');
    expect(definition('Feature')).toContain('CLOSURE');
    expect(contract).toContain('CLOSURE is a Feature kind, NOT a Component role');
  });
  it('describes exact assembly shapes, cut copies, anchors and THREAD references', () => {
    expect(definition('EdgeRef')).toContain('{pieceId:ID,copy:I>0,edgeIds:ID[] min=1,direction:');
    expect(definition('Anchor')).toBe('Anchor={pieceId:ID,copy:I>0,point:P}');
    expect(definition('Assembly')).toContain('type:"SEAM",sides:[EdgeRef,EdgeRef],threadBomId:ID');
    expect(definition('Assembly')).toContain('type:"ATTACH",from:Anchor,to:Anchor,threadBomId:ID');
    expect(definition('Assembly')).toContain('type:"INSTALL",bomId:ID,anchors:Anchor[] min=1');
    expect(contract).toContain('copy is 1..cutCount');
    expect(contract).toContain('Every edgeId must match a segment.id');
    expect(contract).toContain('THREAD BOM entry, never outer fabric');
  });
  it('covers every real material discriminator and required specification', () => {
    const materials = source.properties.technical.properties.bom.items.properties.material.oneOf;
    for (const material of materials) {
      expect(definition('Material')).toContain('type:' + JSON.stringify(material.properties.type.const));
      for (const field of material.properties.specs.required) expect(definition('Material')).toContain(field + ':');
    }
    expect(contract).toContain('WOVEN_FABRIC/LINING_FABRIC/INTERFACING -> cm2');
    expect(contract).toContain('WEBBING/THREAD -> cm');
    expect(contract).toContain('ZIPPER/BUTTON/HARDWARE -> integer piece');
  });
  it('includes every actual enum and literal without embedding the runtime implementation', () => {
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.const !== undefined) expect(contract).toContain(JSON.stringify(node.const));
      for (const value of node.enum || []) expect(contract).toContain(JSON.stringify(value));
      Object.values(node).forEach((child) => Array.isArray(child) ? child.forEach(visit) : visit(child));
    };
    visit(source);
    for (const fragment of ['require(', 'z.object(', 'z.enum(', 'z.discriminatedUnion(', 'superRefine', 'ctx.addIssue', 'const designSchema =', 'function validate']) expect(contract).not.toContain(fragment);
  });
  it('distinguishes one fabric scrap, unchecked stock and accessories without invented patterns', () => {
    expect(definition('Source')).toContain('kind:"SCRAP",scrapId:ID');
    expect(definition('Source')).toContain('kind:"STOCK",availability:"NOT_CHECKED"');
    expect(definition('Technical')).toContain('scrapSources:{id:ID}[] len=1');
    expect(contract).toContain('at least one pattern piece uses it');
    expect(contract).toContain('Ready-made webbing/buttons/hardware are BOM entries used by INSTALL and Feature, NOT fabric patterns');
  });
  it('states closure, curve, bounds and scoped reference rules rather than claiming geometry verification', () => {
    expect(contract).toContain('final segment.to equals outline.start');
    expect(definition('Piece')).toContain('control1:P,control2:P,to:P');
    expect(definition('Piece')).toContain('seamAllowanceCm:N>=0');
    expect(definition('Piece')).toContain('grainDirectionDeg:N>=0<180');
    expect(contract).toContain('Each piece belongs to exactly one component');
    expect(contract).toContain('never claim manufacturing feasibility');
  });
  it('preserves root limitations and requires informative nonempty missing information', () => {
    expect(definition('Limitation')).toContain('status:"PARTIAL"|"UNSUPPORTED"');
    expect(definition('Limitation')).toContain('missingInformation:TEXT[] min=1');
    expect(contract).toContain('limitations is REQUIRED at the JSON ROOT, never technical.limitations');
    expect(contract).toContain('reason and EVERY missingInformation entry must be informative nonempty text');
    expect(contract).toContain('do not invent unrequested requirements as limitations');
  });
  it.each(briefs.map((brief) => [brief.id, brief]))('%s retains the entire brief and every creative requirement', (_id, brief) => {
    const messages = initialMessages(brief);
    expect(messages[1].content).toContain(JSON.stringify(brief));
    expect(messages[0].content).toContain('Preserve EVERY brief requirement technically where supported');
    expect(messages[0].content).toContain('Creative prose alone is insufficient');
    expect(messages[0].content).toContain('body-connected anchors for straps/closures');
    expect(messages[0].content).toContain('keep a named Feature and honest PARTIAL/UNSUPPORTED limitation');
    expect(messages[0].content).not.toContain('Ochre Ribbon Shoulder');
  });
  it('groups duplicate messages while retaining all exact codes, paths and messages', () => {
    const errors = oldCampaign.results[0].attempts[0].automated.errors;
    const grouped = groupErrors(errors);
    expect(grouped.length).toBeLessThan(errors.length);
    const restored = grouped.flatMap((entry) => entry.paths ? entry.paths.map((path) => ({ code: entry.code, path, message: entry.message })) : [entry]);
    expect(restored.map(JSON.stringify).sort()).toEqual(errors.map(JSON.stringify).sort());
    expect(errors).toEqual(oldCampaign.results[0].attempts[0].automated.errors);
  });
  it('retains original brief/response and exact error locations in a single concise repair request', () => {
    const attempt = oldCampaign.results[0].attempts[0];
    const messages = initialMessages(oldCampaign.results[0].brief);
    const repaired = repairMessages(messages, attempt.text, attempt.automated.errors);
    expect(repaired.slice(0, 2)).toEqual(messages);
    expect(repaired[2].content).toBe(attempt.text);
    expect(repaired).toHaveLength(4);
    expect(repaired[3].content).toContain('One repair only');
    expect(repaired[3].content).toContain('["technical","components",2,"role"]');
    expect(repaired[3].content).toContain('["limitations"]');
    expect(repaired[3].content).toContain('unsupported feature; do not remove intent');
    expect(repaired[3].content.length).toBeLessThan(2496);
  });
  it('reduces initial and equivalent-repair prompt size against the measured previous implementation', () => {
    const first = oldCampaign.results[0].attempts[0];
    const messages = initialMessages(oldCampaign.results[0].brief);
    const chars = (items) => items.reduce((n, item) => n + item.content.length, 0);
    expect(messages[0].content.length).toBeLessThan(9669);
    expect(chars(messages)).toBeLessThan(10063);
    expect(chars(repairMessages(messages, first.text, first.automated.errors))).toBeLessThan(16241);
  });
});
