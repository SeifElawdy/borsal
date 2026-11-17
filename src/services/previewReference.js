// Derived appearance reference only. Original pixels, geometry and files stay untouched.
const sharp=require('sharp');
const {invertHomography,applyHomographyToPolygon,computeScaleInfo}=require('../geometry/homography');
const {boundingBox,validateWithHoles}=require('../geometry/polygon');
async function fabricReference(original,source){
 const normalized=await sharp(original).rotate().png().toBuffer(),meta=await sharp(normalized).metadata();
 try{
  const basis=source.geometry?.basis||source.currentAnalysis;
  if(!basis||basis.photoPath!==source.selectedPhoto?.photoPath)throw Error('PHOTO_BASIS_UNAVAILABLE');
  const originalMeta=await sharp(original).metadata();
  if(originalMeta.orientation&&originalMeta.orientation!==1&&basis.calibrationEvidence?.coordinateFrame!=='EXIF-normalized original image')throw Error('PHOTO_COORDINATE_FRAME_UNVERIFIED');
  const H=basis.calibrationEvidence?.calibration?.H||computeScaleInfo(basis.markerCornersPx,basis.markerSizeCm).H;
  if(!validateWithHoles(source.polygonCm,source.holes||[]).valid)throw Error('INVALID_SOURCE_POLYGON');
  const inverse=invertHomography(H),polygon=applyHomographyToPolygon(inverse,source.polygonCm),holes=(source.holes||[]).map(p=>applyHomographyToPolygon(inverse,p));
  if([...polygon,...holes.flat()].some(p=>p.some(n=>!Number.isFinite(n))||p[0]<0||p[1]<0||p[0]>meta.width||p[1]>meta.height))throw Error('POLYGON_OUTSIDE_PHOTO');
  const b=boundingBox(polygon),left=Math.floor(b.minX),top=Math.floor(b.minY),width=Math.min(meta.width,Math.ceil(b.maxX))-left,height=Math.min(meta.height,Math.ceil(b.maxY))-top;
  if(width<8||height<8)throw Error('FABRIC_REGION_TOO_SMALL');
  const path=[polygon,...holes].map(p=>'M'+p.map(([x,y])=>(x-left)+','+(y-top)).join('L')+'Z').join('');
  const mask=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><path d="${path}" fill="white" fill-rule="evenodd"/></svg>`);
  const masked=await sharp(normalized).extract({left,top,width,height}).ensureAlpha().composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
  // Flatten AFTER compositing: Sharp otherwise applies flatten before dest-in.
  const bytes=await sharp(masked).flatten({background:'#efeee9'}).png().toBuffer();
  return {bytes,info:{mode:'GEOMETRY_MASKED_FABRIC_REGION',cropPx:{left,top,width,height},coordinateFrame:'EXIF-normalized original image',limitation:'Visual isolation uses the stored contour; physical measurements/materials remain unverified'}};
 }catch{
  // Legacy photos without a recoverable transform remain usable; never guess a crop.
  return {bytes:normalized,info:{mode:'FULL_PHOTO_FALLBACK',limitation:'A safe fabric-only region could not be derived; background exclusion relies on prompting'}};
 }
}
module.exports={fabricReference};
