import { describe, it, expect } from 'vitest';
const { VERSION, designSchema } = require('./schema');
const { loadExamples, evaluate } = require('./evaluate');
const examples = loadExamples();
const mutate = (change) => { const value = structuredClone(examples[0]); change(value); return value; };
const reject = (change) => expect(designSchema.safeParse(mutate(change)).success).toBe(false);

describe('Experimental design language 0.1 structural validation', () => {
  it('contains eight manually authored examples, split into four shoulder bags and four totes', () => {
    expect(examples).toHaveLength(8);
    expect(examples.filter((d) => d.category === 'SHOULDER_BAG')).toHaveLength(4);
    expect(examples.filter((d) => d.category === 'TOTE_BAG')).toHaveLength(4);
    expect(new Set(examples.map((d) => d.id)).size).toBe(8);
  });
  it.each(examples.map((example) => [example.id, example]))('%s parses with its limitations intact', (_id, example) => {
    const parsed = designSchema.parse(example);
    expect(parsed).toEqual(example);
    expect(parsed.limitations.some((item) => item.status === 'UNSUPPORTED')).toBe(true);
    for (const item of parsed.limitations) {
      expect(item.reason.length).toBeGreaterThan(0);
      expect(item.missingInformation.length).toBeGreaterThan(0);
    }
    expect(parsed.technical.evidence).toBe('ILLUSTRATIVE_ONLY');
    expect(evaluate(parsed).manufacturingVerified).toBe(false);
  });
  it.each([
    ['wrong dimension unit', (d) => { d.technical.dimensionUnit = 'mm'; }],
    ['zero width', (d) => { d.technical.overallDimensions.width = 0; }],
    ['negative height', (d) => { d.technical.overallDimensions.height = -1; }],
    ['infinite depth', (d) => { d.technical.overallDimensions.depth = Infinity; }],
    ['NaN dimension', (d) => { d.technical.overallDimensions.width = NaN; }],
    ['string dimension', (d) => { d.technical.overallDimensions.width = '28'; }],
    ['wrong material quantity unit', (d) => { d.technical.bom[0].quantity.unit = 'cm'; }],
    ['unrecognized unit', (d) => { d.technical.bom[0].quantity.unit = 'yards'; }],
    ['zero quantity', (d) => { d.technical.bom[0].quantity.value = 0; }],
    ['negative seam allowance', (d) => { d.technical.patternPieces[0].seamAllowanceCm = -1; }],
    ['nonfinite curve endpoint', (d) => { d.technical.patternPieces[0].outline.segments[0].to[0] = Infinity; }],
    ['missing required creative description', (d) => { delete d.creative.description; }],
    ['malformed pattern structure', (d) => { d.technical.patternPieces = {}; }],
    ['unclosed outline', (d) => { d.technical.patternPieces[0].outline.segments.at(-1).to = [1, 1]; }],
    ['unknown geometry primitive', (d) => { d.technical.patternPieces[0].outline.segments[0].type = 'NURBS'; }],
    ['unknown material identifier', (d) => { d.technical.bom[0].material.type = 'MAGIC_FABRIC'; }],
    ['missing material specification', (d) => { delete d.technical.bom[0].material.specs.weightGsm; }],
    ['wrong material specification type', (d) => { d.technical.bom[0].material.specs.weightGsm = 'heavy'; }],
    ['unknown nested field', (d) => { d.technical.patternPieces[0].secretInstruction = 'silently ignore'; }],
    ['missing limitations ledger', (d) => { delete d.limitations; }],
    ['empty limitation reason', (d) => { d.limitations[0].reason = ' '; }],
    ['missing deterministic information', (d) => { d.limitations[0].missingInformation = []; }],
    ['manufacturing approval label', (d) => { d.technical.evidence = 'VALIDATED_DESIGN'; }],
  ])('rejects %s', (_name, change) => reject(change));
  it('rejects duplicate component identifiers', () => reject((d) => { d.technical.components.push(structuredClone(d.technical.components[0])); }));
  it('rejects duplicate pattern piece identifiers', () => reject((d) => { d.technical.patternPieces.push(structuredClone(d.technical.patternPieces[0])); }));
  it('rejects duplicate edge identifiers within a pattern', () => reject((d) => { d.technical.patternPieces[0].outline.segments[1].id = 'bottom'; }));
  it.each([
    ['component to missing piece', (d) => { d.technical.components[0].pieceIds[0] = 'missing-piece'; }],
    ['feature to missing component', (d) => { d.technical.features[0].componentIds[0] = 'missing-component'; }],
    ['piece to missing BOM entry', (d) => { d.technical.patternPieces[0].bomId = 'missing-bom'; }],
    ['feature to missing BOM entry', (d) => { d.technical.features[0].bomIds = ['missing-bom']; }],
    ['assembly to missing piece', (d) => { d.technical.assembly[0].sides[0].pieceId = 'missing-piece'; }],
    ['assembly to missing edge', (d) => { d.technical.assembly[0].sides[0].edgeIds = ['missing-edge']; }],
    ['assembly to missing cut copy', (d) => { d.technical.assembly[0].sides[0].copy = 3; }],
    ['attachment thread to fabric entry', (d) => { d.technical.assembly[0].threadBomId = 'outer-fabric'; }],
    ['limitation to missing feature', (d) => { d.limitations[0].featureId = 'missing-feature'; }],
    ['scrap to unknown source', (d) => { d.technical.bom[0].source.scrapId = 'different-scrap'; }],
    ['pattern owned twice', (d) => { d.technical.components.push({ id: 'duplicate-owner', role: 'BODY', pieceIds: ['body-panel'] }); }],
  ])('rejects invalid reference: %s', (_name, change) => reject(change));
  it('distinguishes SCRAP from STOCK without assuming stock availability', () => {
    for (const example of examples) {
      const t = designSchema.parse(example).technical;
      expect(t.scrapSources).toHaveLength(1);
      expect(t.bom.some((entry) => entry.source.kind === 'SCRAP')).toBe(true);
      for (const entry of t.bom) {
        if (entry.source.kind === 'SCRAP') expect(entry.source.scrapId).toBe(t.scrapSources[0].id);
        else expect(entry.source).toEqual({ kind: 'STOCK', availability: 'NOT_CHECKED' });
      }
    }
    reject((d) => { d.technical.bom[1].source = { kind: 'STOCK', availability: 'AVAILABLE' }; });
    reject((d) => { d.technical.bom[1].source = { kind: 'SCRAP', scrapId: 'scrap-one' }; });
  });
  it('rejects a second scrap or an unused token scrap', () => {
    reject((d) => { d.technical.scrapSources.push({ id: 'scrap-two' }); });
    reject((d) => { d.technical.bom.push({ ...structuredClone(d.technical.bom[0]), id: 'stock-fabric', source: { kind: 'STOCK', availability: 'NOT_CHECKED' } }); d.technical.patternPieces[0].bomId = 'stock-fabric'; });
  });
  it('preserves unsupported creative intent instead of silently discarding it', () => {
    const value = mutate((d) => {
      d.technical.features.push({ id: 'unmodeled-weaving', kind: 'SURFACE', intent: 'Hand-woven relief across the shell', componentIds: ['shell'], bomIds: [] });
      d.limitations.push({ id: 'weaving-limit', featureId: 'unmodeled-weaving', status: 'UNSUPPORTED', reason: 'No weave-path or additional-yarn material model', missingInformation: ['Yarn specification and weave paths'] });
    });
    const parsed = designSchema.parse(value);
    expect(parsed.limitations.at(-1)).toEqual(value.limitations.at(-1));
    expect(evaluate(parsed).unsupported).toContain('unmodeled-weaving');
  });
  it('validates the exact experimental version', () => {
    expect(VERSION).toBe('borsal.design/0.1');
    reject((d) => { d.schemaVersion = 'borsal.design/1.0'; });
    reject((d) => { delete d.schemaVersion; });
  });
  it('requires both cubic control points and keeps curves distinct from line segments', () => {
    const curved = structuredClone(examples[2]);
    const curve = curved.technical.patternPieces[0].outline.segments[0];
    expect(designSchema.safeParse(curved).success).toBe(true);
    delete curve.control1;
    expect(designSchema.safeParse(curved).success).toBe(false);
  });
});
