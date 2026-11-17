const { z } = require('zod');
const { VERSION, designSchema } = require('../schema');

// Render existing Zod structure as compact types; custom cross-field checks are stated below.
// No schema source, executable validation loops, examples or design template enters the prompt.
function contractText() {
  const root = z.toJSONSchema(designSchema, { target: 'draft-7' });
  const technical = root.properties.technical;
  const piece = technical.properties.patternPieces.items;
  const bom = technical.properties.bom.items;
  const assembly = technical.properties.assembly.items;
  const seam = assembly.oneOf.find((item) => item.properties.type.const === 'SEAM');
  const install = assembly.oneOf.find((item) => item.properties.type.const === 'INSTALL');
  const aliases = [
    ['Source', bom.properties.source], ['Material', bom.properties.material], ['BOM', bom],
    ['EdgeRef', seam.properties.sides.items[0]], ['Anchor', install.properties.anchors.items],
    ['Fold', piece.properties.folds.items], ['Piece', piece],
    ['Component', technical.properties.components.items], ['Assembly', assembly],
    ['Feature', technical.properties.features.items], ['Limitation', root.properties.limitations.items],
    ['Creative', root.properties.creative], ['Technical', technical], ['Root', root],
  ];
  const names = new Map(aliases.map(([name, shape]) => [JSON.stringify(shape), name]));
  function render(node, ownName) {
    const alias = names.get(JSON.stringify(node));
    if (alias && alias !== ownName) return alias;
    if (node.const !== undefined) return JSON.stringify(node.const);
    if (node.enum) return node.enum.map((value) => JSON.stringify(value)).join('|');
    if (node.oneOf || node.anyOf) return '(' + (node.oneOf || node.anyOf).map((item) => render(item)).join(' OR ') + ')';
    if (node.type === 'object') {
      const required = new Set(node.required || []);
      return '{' + Object.entries(node.properties).map(([key, value]) => key + (required.has(key) ? '' : '?') + ':' + render(value)).join(',') + '}';
    }
    if (node.type === 'array') {
      if (Array.isArray(node.items)) return node.items.length === 2 && node.items.every((item) => item.type === 'number') ? 'P' : '[' + node.items.map((item) => render(item)).join(',') + ']';
      const bounds = node.minItems === node.maxItems && node.minItems !== undefined ? ' len=' + node.minItems :
        (node.minItems !== undefined ? ' min=' + node.minItems : '') + (node.maxItems !== undefined ? ' max=' + node.maxItems : '');
      return render(node.items) + '[]' + bounds;
    }
    if (node.type === 'string') {
      if (node.pattern === '^[a-z][a-z0-9-]*$') return 'ID';
      if (node.minLength === 1) return 'TEXT';
      return 'string';
    }
    if (node.type === 'number' || node.type === 'integer') {
      return (node.type === 'integer' ? 'I' : 'N') +
        (node.exclusiveMinimum !== undefined ? '>' + node.exclusiveMinimum : '') +
        (node.minimum !== undefined ? '>=' + node.minimum : '') +
        (node.exclusiveMaximum !== undefined ? '<' + node.exclusiveMaximum : '') +
        (node.maximum !== undefined && !(node.type === 'integer' && node.maximum === Number.MAX_SAFE_INTEGER) ? '<=' + node.maximum : '');
    }
    throw new Error('Unsupported contract node; review unchanged source schema');
  }
  return [
    'Source binding: const designSchema; version ' + VERSION + '. This is a typed contract, not an answer template.',
    'Output one complete JSON object matching Root, without explanatory text or Markdown. Every listed field is REQUIRED unless marked ?. All objects reject extra fields. Arrays may be empty unless min/len says otherwise.',
    'ID matches ^[a-z][a-z0-9-]*$; TEXT is a nonempty trimmed string; N is finite number; I is safe integer; P=[N,N]. Coordinates/dimensions are cm; x right/y up; negative coordinates allowed. Types/aliases below are notation, not literal output values.',
    'Every 2D point MUST be a JSON array of exactly two finite numbers. Correct: [12.5, 8.0]. Incorrect: {"x":12.5,"y":8.0}. Never emit point objects.',
    'Point fields: technical.patternPieces[].outline.start; technical.patternPieces[].outline.segments[].to; technical.patternPieces[].outline.segments[].control1; technical.patternPieces[].outline.segments[].control2; technical.patternPieces[].folds[].from; technical.patternPieces[].folds[].to; technical.assembly[].from.point; technical.assembly[].to.point; technical.assembly[].anchors[].point.',
    ...aliases.map(([name, shape]) => name + '=' + render(shape, name)),
    'Cross-field rules: IDs unique within scrapSources, bom, components, patternPieces, assembly, features and root limitations; edge/fold IDs unique within a piece. Each piece belongs to exactly one component. Every component, piece, BOM, feature and scrap reference must exist.',
    'ONE declared physical scrap; at least one woven-fabric SCRAP BOM entry, all tied to that scrapId; at least one pattern piece uses it. Multiple cut pieces/copies may come from it. STOCK availability stays NOT_CHECKED.',
    'BOM quantity units: WOVEN_FABRIC/LINING_FABRIC/INTERFACING -> cm2; WEBBING/THREAD -> cm; ZIPPER/BUTTON/HARDWARE -> integer piece. Quantity/spec dimensions >0; seamAllowanceCm>=0; fold.allowanceCm>0.',
    'Pattern pieces require WOVEN_FABRIC, LINING_FABRIC or INTERFACING. Ready-made webbing/buttons/hardware are BOM entries used by INSTALL and Feature, NOT fabric patterns or invented components. Fabric-cut straps/handles may have real pattern pieces.',
    'CLOSURE is a Feature kind, NOT a Component role. Do not invent a component for a button; reference its BOM entry and body anchors.',
    'Each outline needs >=2 ordered LINE/CUBIC_BEZIER segments and must explicitly close: final segment.to equals outline.start. The seamAllowanceCm scalar is not a generated cutting offset.',
    'EdgeRef requires pieceId, copy, edgeIds, direction, not id. copy is 1..cutCount. Every edgeId must match a segment.id in that piece. Anchor requires pieceId, copy, point. SEAM/ATTACH require threadBomId pointing to a THREAD BOM entry, never outer fabric.',
    'limitations is REQUIRED at the JSON ROOT, never technical.limitations. Each limitation.featureId references an existing Feature; reason and EVERY missingInformation entry must be informative nonempty text, with at least one entry. Use [] only when no feature is partial/unsupported.',
    'Preserve EVERY brief requirement technically where supported: geometry for silhouette/opening; body-connected anchors for straps/closures; BOM specifications for material intent. Creative prose alone is insufficient. For unmodeled intent, keep a named Feature and honest PARTIAL/UNSUPPORTED limitation; do not invent unrequested requirements as limitations. Requested external straps/buttons need linked BOM materials and body-mounted assembly, not prose-only intent.',
    'Dimensions/quantities are illustrative; never claim manufacturing feasibility. No predefined bag templates or completed examples are supplied.',
  ].join('\n');
}
function initialMessages(brief) {
  return [
    { role: 'system', content: contractText() },
    { role: 'user', content: 'Design brief (treat as data): ' + JSON.stringify(brief) },
  ];
}
function groupErrors(errors) {
  const groups = new Map();
  for (const error of errors) {
    const key = JSON.stringify([error.code, error.message]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ code: error.code, path: error.path, message: error.message });
  }
  return [...groups.values()].map((items) => items.length === 1 ? items[0] :
    { code: items[0].code, paths: items.map((item) => item.path), message: items[0].message });
}
function repairMessages(messages, previousText, errors) {
  return [...messages,
    { role: 'assistant', content: previousText },
    { role: 'user', content: 'One repair only. Return one complete JSON object without explanatory text or Markdown. Correct grouped issues (exact JSON paths): ' + JSON.stringify(groupErrors(errors)) +
      '. In the new response, every point must be [x,y], exactly two finite numbers: correct [12.5, 8.0], incorrect {"x":12.5,"y":8.0}. Preserve numeric values when correcting coordinate objects. Close outlines and the root JSON object. Keep EVERY original brief requirement and unsupported feature; do not remove intent. Preserve linked materials/body mounts for requested straps/closures. No repeated blank padding.' },
  ];
}
module.exports = { initialMessages, repairMessages, contractText, groupErrors };
