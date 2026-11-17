// Experimental Borsal binary-square dictionary, NOT an ArUco dictionary.
// 4x4 payload + one black border cell; minimum rotational Hamming distance 6.
const CODES = Object.freeze([0x001f, 0x00e3, 0x016c, 0x02d4]);
const bits = code => Array.from({ length: 16 }, (_, i) => (code >> i) & 1);
const rotate = a => a.map((_, i) => a[(3 - i % 4) * 4 + Math.floor(i / 4)]);
// Square references remain independent of paper shape; larger presets can be added here.
const PRESETS = Object.freeze({
  a4: Object.freeze({spanCm:16,markerSizeCm:2,pageWidthCm:21,pageHeightCm:29.7}),
  large: Object.freeze({spanCm:40,markerSizeCm:4,pageWidthCm:50,pageHeightCm:50}),
});

function matProfile(spanCm, markerSizeCm, preset='custom') {
  if (![spanCm, markerSizeCm].every(n => Number.isFinite(n) && n > 0) ||
      spanCm < 4 * markerSizeCm || spanCm > 200 || markerSizeCm < 2) {
    throw new Error('Known mat dimensions required: span <= 200 cm, marker >= 2 cm, span >= 4 markers');
  }
  const known=PRESETS[preset];
  if(preset!=='custom'&&(!known||known.spanCm!==spanCm||known.markerSizeCm!==markerSizeCm))throw new Error('Unknown preset or dimensions do not match preset');
  const size=spanCm+2.5*markerSizeCm;
  const page={widthCm:known?known.pageWidthCm:size,heightCm:known?known.pageHeightCm:size};
  return { version: 'borsal.mat/0.1', preset, page, spanCm, markerSizeCm };
}

function presetProfile(name='a4') {
  if(!Object.hasOwn(PRESETS,name))throw new Error('Unknown mat preset; use a4 or large');
  const p=PRESETS[name];
  return matProfile(p.spanCm,p.markerSizeCm,name);
}

function markerCentersCm(p) {
  return [[0, 0], [p.spanCm, 0], [p.spanCm, p.spanCm], [0, p.spanCm]];
}

function markerCornersCm(p, id) {
  const [x, y] = markerCentersCm(p)[id], h = p.markerSizeCm / 2;
  return [[x-h,y-h],[x+h,y-h],[x+h,y+h],[x-h,y+h]];
}

function decode(payload) {
  let a = payload;
  for (let rotation = 0; rotation < 4; rotation++, a = rotate(a)) {
    const id = CODES.findIndex(code => bits(code).every((b, i) => b === a[i]));
    if (id >= 0) return { id, rotation };
  }
  return null; // No bit correction or guessing under occlusion.
}

function renderMatSvg(profile) {
  const p = matProfile(profile.spanCm, profile.markerSizeCm, profile.preset);
  const marginX=(p.page.widthCm-p.spanCm)/2, marginY=(p.page.heightCm-p.spanCm)/2;
  const cell = p.markerSizeCm / 6;
  let shapes = '';
  markerCentersCm(p).forEach(([x, y], id) => {
    const payload = bits(CODES[id]);
    for (let row = 0; row < 6; row++) for (let col = 0; col < 6; col++) {
      if (row === 0 || row === 5 || col === 0 || col === 5 || payload[(row-1)*4+col-1]) {
        shapes += `<rect x="${x+marginX-p.markerSizeCm/2+col*cell}" y="${y+marginY-p.markerSizeCm/2+row*cell}" width="${cell}" height="${cell}" fill="black"/>`;
      }
    }
  });
  // Physical SVG units are cm; no raster/AI generation is involved.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${p.page.widthCm}cm" height="${p.page.heightCm}cm" viewBox="0 0 ${p.page.widthCm} ${p.page.heightCm}"><rect width="100%" height="100%" fill="white"/>${shapes}</svg>`;
}

module.exports = { CODES, bits, rotate, decode, matProfile, presetProfile, markerCentersCm, markerCornersCm, renderMatSvg };
