// Physical-test wrapper only; production extraction and endpoints are unchanged.
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const sharp=require('sharp');
const {z}=require('zod');
const {detectMat,debugOverlay}=require('./detect');
const {invertHomography,applyHomographyToPolygon}=require('../../src/geometry/homography');
const {extractFabricContour}=require('../../src/vision/extractContour');
const nullableText=z.string().trim().min(1).nullable();
const measured=z.number().finite().positive().nullable();
const observationsSchema=z.object({
  reference:z.object({widthCm:measured,heightCm:measured,areaCm2:measured,method:nullableText}).strict(),
  printScale:z.object({status:z.enum(['PENDING','RULER_CHECKED','REJECTED']),horizontalSpanCm:measured,verticalSpanCm:measured,markerWidthCm:measured,method:nullableText}).strict(),
  conditions:z.object({lighting:nullableText,perspective:nullableText,printScaling:nullableText,suspectedIssues:z.array(z.string().trim().min(1))}).strict(),
}).strict().superRefine((o,ctx)=>{
  if(['widthCm','heightCm','areaCm2'].some(k=>o.reference[k]!==null)&&!o.reference.method)ctx.addIssue({code:'custom',message:'Independent reference measurement method required'});
  if(o.printScale.status==='RULER_CHECKED'&&['horizontalSpanCm','verticalSpanCm','markerWidthCm','method'].some(k=>o.printScale[k]===null))ctx.addIssue({code:'custom',message:'Ruler-checked printing requires measurements and method'});
});

function compare(computed,reference) {
  return Object.fromEntries(['widthCm','heightCm','areaCm2'].map(k=>[k,
    computed&&reference[k]!==null?{
      reference:reference[k],absoluteError:Math.abs(computed[k]-reference[k]),
      percentageError:Math.abs(computed[k]-reference[k])/reference[k]*100,
    }:null]));
}

async function measurePhoto(image,profile,observations) {
  const observed=observationsSchema.parse(observations===undefined?require('./physical-observations.template.json'):observations);
  // Normalize once so CV, extraction and overlays use identical EXIF coordinates.
  const oriented=await sharp(image,{limitInputPixels:24000000}).rotate().png().toBuffer();
  const detection=await detectMat(oriented,profile);
  const report={
    status:'PHYSICAL_ACCURACY_UNVERIFIED',imageSha256:crypto.createHash('sha256').update(image).digest('hex'),
    detection,observations:observed,computed:null,errors:compare(null,observed.reference),
    measurementStatus:'NOT_MEASURED',reason:detection.reason,
    dimensionConvention:'Mat-axis-aligned bounding box; gross outer-contour area, holes not subtracted',
    polygonCm:null,validation:null,warnings:[],
    limitations:['Physical accuracy and print scale are not established by recognition','Width/height are mat-axis bounding-box extents','Only the largest outer contour is measured; holes are not subtracted','Lighting, lens distortion, wrinkles and low contrast can affect measurements'],
    paths:{orientedImage:'oriented.png',calibrationOverlay:'overlay.png',fabricOverlay:null,fabricMask:null},
  };
  const artifacts={'oriented.png':oriented,'overlay.png':await debugOverlay(oriented,detection)};
  if(!detection.ok)return {report,artifacts}; // No extraction or dimensions without markers.
  if(observed.printScale.status==='REJECTED'){
    report.reason='PRINT_SCALE_REJECTED';return {report,artifacts};
  }
  const m=detection.profile.markerSizeCm,s=detection.profile.spanCm;
  // Keep the coded markers outside the extraction/background-sampling ROI.
  const innerCm=[[m,m],[s-m,m],[s-m,s-m],[m,s-m]];
  const innerPx=applyHomographyToPolygon(invertHomography(detection.calibration.H),innerCm);
  const fabric=await extractFabricContour(oriented,innerPx,s-2*m);
  report.validation=fabric.validation;report.warnings=fabric.warnings;
  report.paths.fabricOverlay='fabric-overlay.png';report.paths.fabricMask='fabric-mask.png';
  artifacts['fabric-overlay.png']=fabric.debug.overlayPng;artifacts['fabric-mask.png']=fabric.debug.maskPng;
  if(!fabric.ok||!fabric.validation.valid){report.reason='FABRIC_EXTRACTION_FAILED';return {report,artifacts};}
  // A clipped outline can still be a valid polygon; reject contact with the ROI edge.
  if(fabric.polygonCm.some(([x,y])=>x<0.6||y<0.6||x>s-2*m-0.6||y>s-2*m-0.6)){
    report.reason='FABRIC_TOO_CLOSE_TO_INNER_ROI_EDGE';return {report,artifacts};
  }
  report.computed={widthCm:fabric.stats.widthCm,heightCm:fabric.stats.heightCm,areaCm2:fabric.stats.areaCm2};
  report.polygonCm=fabric.polygonCm.map(([x,y])=>[x+m,y+m]);
  report.errors=compare(report.computed,observed.reference);
  report.measurementStatus='COMPUTED_UNVERIFIED';report.reason=null;
  if(observed.printScale.status==='PENDING')report.warnings.push('Physical print scale has not been independently ruler-checked');
  return {report,artifacts};
}

async function saveMeasurement(imageFile,profile,observationsFile,output) {
  const image=fs.readFileSync(imageFile),observations=observationsFile===undefined?undefined:JSON.parse(fs.readFileSync(observationsFile,'utf8'));
  if(fs.existsSync(output))throw Error('Output directory already exists; choose a new per-photo result directory');
  const {report,artifacts}=await measurePhoto(image,profile,observations);
  report.imageFile=path.resolve(imageFile);report.observationsFile=observationsFile===undefined?null:path.resolve(observationsFile);
  fs.mkdirSync(output);
  for(const [name,buffer]of Object.entries(artifacts))fs.writeFileSync(path.join(output,name),buffer,{flag:'wx'});
  fs.writeFileSync(path.join(output,'measurement-report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  return report;
}
module.exports={observationsSchema,compare,measurePhoto,saveMeasurement};
