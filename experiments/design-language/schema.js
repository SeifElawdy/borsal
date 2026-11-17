// Experimental description language only: no persistence or manufacturing approval.
const { z } = require('zod');
const VERSION = 'borsal.design/0.1';
const text = z.string().trim().min(1);
const id = z.string().regex(/^[a-z][a-z0-9-]*$/);
const positive = z.number().finite().positive();
const nonnegative = z.number().finite().nonnegative();
const count = z.number().int().positive();
const point = z.tuple([z.number().finite(), z.number().finite()]);
const object = (shape) => z.object(shape).strict();
const fiber = z.enum(['COTTON', 'POLYESTER', 'BLEND']);
const material = z.discriminatedUnion('type', [
  object({ type: z.literal('WOVEN_FABRIC'), specs: object({ fiber, weave: z.enum(['PLAIN', 'TWILL', 'SATIN']), weightGsm: positive }) }),
  object({ type: z.literal('LINING_FABRIC'), specs: object({ fiber, weightGsm: positive }) }),
  object({ type: z.literal('WEBBING'), specs: object({ fiber, widthCm: positive }) }),
  object({ type: z.literal('ZIPPER'), specs: object({ lengthCm: positive, toothType: z.enum(['COIL', 'METAL']), endType: z.enum(['CLOSED', 'OPEN']) }) }),
  object({ type: z.literal('THREAD'), specs: object({ fiber, tex: positive }) }),
  object({ type: z.literal('BUTTON'), specs: object({ diameterCm: positive, material: z.enum(['METAL', 'RESIN', 'WOOD']) }) }),
  object({ type: z.literal('HARDWARE'), specs: object({ kind: z.enum(['D_RING', 'SWIVEL_HOOK', 'MAGNETIC_SNAP', 'TURN_LOCK', 'RIVET', 'BAG_FOOT']), finish: z.enum(['BRASS', 'NICKEL', 'BLACK']), sizeCm: positive }) }),
  object({ type: z.literal('INTERFACING'), specs: object({ weightGsm: positive, bond: z.enum(['FUSIBLE', 'SEW_IN']) }) }),
]);
const source = z.discriminatedUnion('kind', [
  object({ kind: z.literal('SCRAP'), scrapId: id }),
  object({ kind: z.literal('STOCK'), availability: z.literal('NOT_CHECKED') }),
]);
const bomEntry = object({ id, source, material, quantity: object({ value: positive, unit: z.enum(['cm', 'cm2', 'piece']) }) });
const segment = z.discriminatedUnion('type', [
  object({ id, type: z.literal('LINE'), to: point }),
  object({ id, type: z.literal('CUBIC_BEZIER'), control1: point, control2: point, to: point }),
]);
const piece = object({
  id, bomId: id, cutCount: count,
  outlineBasis: z.literal('SEAM_LINE'),
  outline: object({ start: point, segments: z.array(segment).min(2) }),
  seamAllowanceCm: nonnegative,
  grainDirectionDeg: z.number().finite().min(0).lt(180),
  folds: z.array(object({ id, type: z.enum(['HEM', 'BOX', 'PLEAT']), from: point, to: point, allowanceCm: positive })),
});
const instance = { pieceId: id, copy: count };
const edgeRef = object({ ...instance, edgeIds: z.array(id).min(1), direction: z.enum(['FORWARD', 'REVERSE']) });
const anchor = object({ ...instance, point });
const assembly = z.discriminatedUnion('type', [
  object({ id, type: z.literal('SEAM'), sides: z.tuple([edgeRef, edgeRef]), threadBomId: id }),
  object({ id, type: z.literal('ATTACH'), from: anchor, to: anchor, threadBomId: id }),
  object({ id, type: z.literal('INSTALL'), bomId: id, anchors: z.array(anchor).min(1) }),
]);
const designSchema = object({
  schemaVersion: z.literal(VERSION),
  id, name: text, category: z.enum(['SHOULDER_BAG', 'TOTE_BAG']),
  creative: object({ description: text, aesthetic: z.array(text).min(1), intendedUse: text }),
  technical: object({
    dimensionUnit: z.literal('cm'), evidence: z.literal('ILLUSTRATIVE_ONLY'),
    overallDimensions: object({ width: positive, height: positive, depth: positive }),
    // One physical scrap today. Source IDs and BOM references allow future versioned expansion.
    scrapSources: z.array(object({ id })).length(1),
    bom: z.array(bomEntry).min(1),
    components: z.array(object({ id, role: z.enum(['BODY', 'GUSSET', 'BASE', 'POCKET', 'FLAP', 'STRAP', 'HANDLE', 'LINING', 'DIVIDER', 'REINFORCEMENT']), pieceIds: z.array(id).min(1) })).min(1),
    patternPieces: z.array(piece).min(1),
    assembly: z.array(assembly),
    features: z.array(object({
      id, kind: z.enum(['BODY', 'GUSSET', 'FOLD', 'POCKET', 'FLAP', 'CLOSURE', 'STRAP', 'HANDLE', 'COMPARTMENT', 'STRUCTURE', 'SURFACE']),
      intent: text, componentIds: z.array(id), bomIds: z.array(id),
    })).min(1),
  }),
  // Required even when empty: unsupported intent must be recorded, never stripped.
  limitations: z.array(object({ id, featureId: id, status: z.enum(['PARTIAL', 'UNSUPPORTED']), reason: text, missingInformation: z.array(text).min(1) })),
}).superRefine((design, ctx) => {
  const t = design.technical;
  const issue = (message) => ctx.addIssue({ code: 'custom', message });
  const unique = (items, label) => {
    const seen = new Set();
    for (const item of items) {
      if (seen.has(item.id)) issue('Duplicate ' + label + ' identifier: ' + item.id);
      seen.add(item.id);
    }
  };
  for (const key of ['scrapSources', 'bom', 'components', 'patternPieces', 'assembly', 'features']) unique(t[key], key);
  unique(design.limitations, 'limitation');
  const pieces = new Map(t.patternPieces.map((item) => [item.id, item]));
  const bom = new Map(t.bom.map((item) => [item.id, item]));
  const components = new Set(t.components.map((item) => item.id));
  const features = new Set(t.features.map((item) => item.id));
  const scrapIds = new Set(t.scrapSources.map((item) => item.id));
  const ref = (exists, label) => { if (!exists) issue('Unknown reference: ' + label); };
  const owners = new Map();
  for (const component of t.components) for (const pieceId of component.pieceIds) {
    ref(pieces.has(pieceId), pieceId);
    owners.set(pieceId, (owners.get(pieceId) || 0) + 1);
  }
  let scrapEntries = 0;
  const areaMaterials = ['WOVEN_FABRIC', 'LINING_FABRIC', 'INTERFACING'];
  for (const entry of t.bom) {
    const type = entry.material.type;
    const expectedUnit = areaMaterials.includes(type) ? 'cm2' : ['THREAD', 'WEBBING'].includes(type) ? 'cm' : 'piece';
    if (entry.quantity.unit !== expectedUnit) issue('Wrong quantity unit for ' + type + ': expected ' + expectedUnit);
    if (expectedUnit === 'piece' && !Number.isInteger(entry.quantity.value)) issue('Piece quantities must be integers');
    if (entry.source.kind === 'SCRAP') {
      scrapEntries++;
      ref(scrapIds.has(entry.source.scrapId), entry.source.scrapId);
      if (type !== 'WOVEN_FABRIC') issue('This version supports woven fabric SCRAP only');
    }
  }
  if (!scrapEntries) issue('At least one SCRAP BOM entry is required');
  if (!t.patternPieces.some((p) => bom.get(p.bomId)?.source.kind === 'SCRAP')) issue('At least one pattern piece must use the single scrap');
  for (const p of t.patternPieces) {
    unique(p.outline.segments, 'edge in ' + p.id);
    unique(p.folds, 'fold in ' + p.id);
    ref(bom.has(p.bomId), p.bomId);
    if (bom.has(p.bomId) && !areaMaterials.includes(bom.get(p.bomId).material.type)) issue('Pattern pieces require area-based fabric/interfacing material');
    if (owners.get(p.id) !== 1) issue('Pattern piece must belong to exactly one component: ' + p.id);
    const last = p.outline.segments.at(-1).to;
    if (last[0] !== p.outline.start[0] || last[1] !== p.outline.start[1]) issue('Outline must explicitly close: ' + p.id);
  }
  const checkInstance = (value) => {
    const p = pieces.get(value.pieceId);
    ref(Boolean(p), value.pieceId);
    if (p && value.copy > p.cutCount) issue('Invalid cut-copy reference: ' + value.pieceId);
    return p;
  };
  for (const relation of t.assembly) {
    if (relation.type === 'SEAM') {
      for (const side of relation.sides) {
        const p = checkInstance(side);
        if (p) for (const edgeId of side.edgeIds) ref(p.outline.segments.some((edge) => edge.id === edgeId), side.pieceId + '.' + edgeId);
      }
    } else if (relation.type === 'ATTACH') {
      checkInstance(relation.from); checkInstance(relation.to);
    } else {
      ref(bom.has(relation.bomId), relation.bomId);
      relation.anchors.forEach(checkInstance);
    }
    if (relation.threadBomId && bom.get(relation.threadBomId)?.material.type !== 'THREAD') issue('Seam/attachment must reference a THREAD BOM entry');
  }
  for (const feature of t.features) {
    for (const componentId of feature.componentIds) ref(components.has(componentId), componentId);
    for (const bomId of feature.bomIds) ref(bom.has(bomId), bomId);
  }
  for (const limitation of design.limitations) ref(features.has(limitation.featureId), limitation.featureId);
});

module.exports = { VERSION, designSchema };
