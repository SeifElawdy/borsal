const {boundingBox}=require('../../src/geometry/polygon');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const fixed=n=>Number(n.toFixed(4));
function renderPreview(report,{friendlyLabels=false}={}){
  const pieces=report.cuttingPieces,boxes=pieces.map(p=>boundingBox([...p.polygonCm,...(p.stitchingOutline?[p.stitchingOutline.start,...p.stitchingOutline.segments.flatMap(s=>s.type==='LINE'?[s.to]:[s.control1,s.control2,s.to])]:[])]));
  const width=Math.max(26,...boxes.map(b=>b.maxX-b.minX+6));
  const height=6+boxes.reduce((sum,b)=>sum+b.maxY-b.minY+5,0);
  let y=6;
  const sections=pieces.map((p,i)=>{
    const box=boxes[i],tx=2-box.minX,ty=y-box.minY;
    const outline=p.stitchingOutline;
    const path=outline?'M '+outline.start.join(' ')+' '+outline.segments.map(s=>s.type==='LINE'?'L '+s.to.join(' '):'C '+s.control1.join(' ')+' '+s.control2.join(' ')+' '+s.to.join(' ')).join(' ')+' Z':null;
    const group=`<text x="1" y="${fixed(y-1.2)}">${friendlyLabels?'Piece '+(i+1)+' / copy '+p.sourceCopy:escape(p.id)+' — source '+escape(p.sourcePieceId)+' / copy '+p.sourceCopy}</text>
<text x="1" y="${fixed(y-0.5)}">Cut bbox ${fixed(p.dimensions.widthCm)} × ${fixed(p.dimensions.heightCm)} cm; area ${fixed(p.areaCm2)} cm²</text>
<g transform="translate(${fixed(tx)} ${fixed(ty)})">
<polygon points="${p.polygonCm.map(v=>v.join(',')).join(' ')}" fill="#f4e6eb" stroke="#7b233e" stroke-width="0.035"/>
${path?`<path d="${path}" fill="none" stroke="#1f618d" stroke-width="0.025" stroke-dasharray="0.15 0.1"/>`:""}
${(p.folds||[]).map(f=>`<line data-fold-id="${escape(f.id)}" x1="${f.from[0]}" y1="${f.from[1]}" x2="${f.to[0]}" y2="${f.to[1]}" stroke="#227744" stroke-width="0.025" stroke-dasharray="0.08 0.08"><title>${escape(f.id)}: ${escape(f.type)}; allowance ${f.allowanceCm} cm; physical fold UNVERIFIED</title></line>`).join('\n')}
</g>
<text x="1" y="${fixed(y+box.maxY-box.minY+0.8)}">Grain ${p.grainDirectionDeg}°; tolerance ${p.grainToleranceDeg===null?'UNRESOLVED':p.grainToleranceDeg+'°'}; declared seam allowance ${p.seamAllowanceCm} cm</text>
<text x="1" y="${fixed(y+box.maxY-box.minY+1.5)}">${friendlyLabels?'Stitching':'Stitch edges'}: ${escape(friendlyLabels?(outline?'Supplied stitching outline':'Unresolved; no stitching geometry inferred'):outline?outline.segments.map(s=>s.id).join(', '):'UNRESOLVED ? no stitching geometry inferred')}</text>`;
    y+=box.maxY-box.minY+5;return group;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${fixed(width)}cm" height="${fixed(height)}cm" viewBox="0 0 ${fixed(width)} ${fixed(height)}">
<title>Authored technical pattern preview — UNVERIFIED</title>
<desc>Solid burgundy: supplied cutting outline. Dashed blue: supplied stitching outline. Local centimeter coordinates, y down. Not a nesting layout or print-validated cutting pattern.</desc>
<metadata>${escape(JSON.stringify({conceptSha256:report.provenance.concept.sha256,designSha256:report.provenance.design.sha256,status:report.status,verdict:report.verdict,manufacturingVerified:false}))}</metadata>
<rect width="100%" height="100%" fill="white"/>
<g font-family="sans-serif" font-size="0.38" fill="#222">
<text x="1" y="0.8">MANUALLY AUTHORED DRAFT — ${escape(report.status)} / ${escape(report.verdict)}</text>
<text x="1" y="1.6">Solid: cutting; blue dashed: stitching; green dotted: fold axes. Unit cm.</text>
<text x="1" y="2.4">Illustrative preview only — NOT manufacturing approval or verified print scale.</text>
<text x="1" y="3.2">Creative fidelity and physical construction remain UNVERIFIED.</text>
${sections}
</g></svg>\n`;
}
module.exports={renderPreview};
