// Offline CLI: no database or network imports. All physical dimensions are explicit.
const fs=require('fs');
const path=require('path');
const {matProfile,presetProfile,renderMatSvg}=require('./mat');
const {detectMat,debugOverlay}=require('./detect');

function profileFromOptions(options) {
  const hasSpan=options['span-cm']!==undefined, hasMarker=options['marker-cm']!==undefined;
  if(options.preset!==undefined&&(hasSpan||hasMarker))throw Error('Use a preset OR both explicit dimensions, not both');
  if(hasSpan!==hasMarker)throw Error('Explicit --span-cm and --marker-cm must be supplied together');
  return hasSpan?matProfile(Number(options['span-cm']),Number(options['marker-cm'])):presetProfile(options.preset);
}

async function main(args) {
  const [command,...pairs]=args, options={};
  for(const arg of pairs){const match=/^--(preset|span-cm|marker-cm|image|output|observations)=(.+)$/.exec(arg);if(!match||options[match[1]])throw Error('Unknown or duplicate option');options[match[1]]=match[2];}
  const profile=profileFromOptions(options);
  if(!options.output)throw Error('Explicit --output required');
  if(command==='print')fs.writeFileSync(options.output,renderMatSvg(profile),{flag:'wx'});
  else if(command==='detect'){
    if(!options.image)throw Error('--image required');
    const input=fs.readFileSync(options.image), result=await detectMat(input,profile);
    fs.mkdirSync(options.output); // Refuse overwriting any previous result directory.
    fs.writeFileSync(path.join(options.output,'result.json'),JSON.stringify(result,null,2)+'\n');
    fs.writeFileSync(path.join(options.output,'overlay.png'),await debugOverlay(input,result));
    console.log(JSON.stringify({ok:result.ok,reason:result.reason,markers:result.markers.length}));
    if(!result.ok)process.exitCode=2;
  } else if(command==='measure'){
    if(!options.image)throw Error('--image required');
    const {saveMeasurement}=require('./measurement');
    const report=await saveMeasurement(options.image,profile,options.observations,options.output);
    console.log(JSON.stringify({detectionSuccess:report.detection.ok,measurementStatus:report.measurementStatus,reason:report.reason}));
    if(!report.computed)process.exitCode=2;
  } else throw Error('Use print, detect or measure');
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={main,profileFromOptions};
