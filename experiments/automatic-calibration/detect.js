// Offline only. Reuses the production CV loader and pure homography functions.
const sharp = require('sharp');
const { getCV } = require('../../src/vision/opencv');
const { computeHomography, computeScaleInfo, applyHomography, reprojectionErrorCm } = require('../../src/geometry/homography');
const { decode, matProfile, markerCornersCm } = require('./mat');

function orderedQuad(data) {
  const pts = Array.from({length:4}, (_, i) => [data[2*i], data[2*i+1]]);
  const center = pts.reduce((s,p)=>[s[0]+p[0]/4,s[1]+p[1]/4], [0,0]);
  pts.sort((a,b)=>Math.atan2(a[1]-center[1],a[0]-center[0])-Math.atan2(b[1]-center[1],b[0]-center[0]));
  const start = pts.reduce((best,p,i)=>p[0]+p[1]<pts[best][0]+pts[best][1]?i:best,0);
  return pts.map((_,i)=>pts[(i+start)%4]);
}

async function detectMat(imageBuffer, profile) {
  const p = matProfile(profile.spanCm, profile.markerSizeCm, profile.preset);
  const {data,info} = await sharp(imageBuffer, {limitInputPixels:24000000}).rotate().removeAlpha().greyscale().raw().toBuffer({resolveWithObject:true});
  const cv = await getCV(), mats = [];
  const keep = m => { mats.push(m); return m; };
  const markers = [], rejected = { geometry:0, payload:0, clipped:0 };
  let candidateCount = 0;
  try {
    const gray = keep(cv.matFromArray(info.height,info.width,cv.CV_8UC1,data));
    const binary = keep(new cv.Mat()), contours = keep(new cv.MatVector()), hierarchy = keep(new cv.Mat());
    cv.threshold(gray,binary,0,255,cv.THRESH_BINARY_INV|cv.THRESH_OTSU);
    cv.findContours(binary,contours,hierarchy,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
    for(let i=0;i<contours.size();i++) {
      const contour = contours.get(i), approx = new cv.Mat();
      try {
        const area = Math.abs(cv.contourArea(contour));
        if(area < 400 || area > info.width*info.height*0.2) continue;
        cv.approxPolyDP(contour,approx,0.025*cv.arcLength(contour,true),true);
        if(approx.rows !== 4 || !cv.isContourConvex(approx)) continue;
        candidateCount++;
        const quad = orderedQuad(approx.data32S);
        if(quad.some(([x,y])=>x<2||y<2||x>=info.width-2||y>=info.height-2)){ rejected.clipped++; continue; }
        const lengths = quad.map((a,j)=>Math.hypot(a[0]-quad[(j+1)%4][0],a[1]-quad[(j+1)%4][1]));
        if(Math.min(...lengths)<24 || Math.max(...lengths)/Math.min(...lengths)>2.5){rejected.geometry++;continue;}
        const src = cv.matFromArray(4,1,cv.CV_32FC2,quad.flat());
        const dst = cv.matFromArray(4,1,cv.CV_32FC2,[0,0,59,0,59,59,0,59]);
        const transform = cv.getPerspectiveTransform(src,dst), warped = new cv.Mat();
        try {
          cv.warpPerspective(gray,warped,transform,new cv.Size(60,60),cv.INTER_LINEAR,cv.BORDER_CONSTANT,new cv.Scalar(255));
          const samples = [];
          for(let row=0;row<6;row++) for(let col=0;col<6;col++) {
            let sum=0;
            for(let y=row*10+3;y<row*10+7;y++)for(let x=col*10+3;x<col*10+7;x++)sum+=warped.data[y*60+x];
            samples.push(sum/16);
          }
          const lo=Math.min(...samples), hi=Math.max(...samples), threshold=(lo+hi)/2;
          if(hi-lo<100 || samples.some(v=>Math.abs(v-threshold)<(hi-lo)*0.2)){rejected.payload++;continue;}
          const black = samples.map(v=>v<threshold?1:0);
          if(black.some((b,j)=>(j<6||j>=30||j%6===0||j%6===5)&&b!==1)){rejected.payload++;continue;}
          const payload=[]; for(let y=1;y<5;y++)for(let x=1;x<5;x++)payload.push(black[y*6+x]);
          const decoded = decode(payload);
          if(!decoded){rejected.payload++;continue;}
          // Decode orientation before assigning physical marker corners.
          const cornersPx=quad.map((_,j)=>quad[(j-decoded.rotation+4)%4]);
          const localToImage=computeHomography([[0,0],[1,0],[1,1],[0,1]],cornersPx);
          const centerPx=applyHomography(localToImage,[0.5,0.5]);
          markers.push({id:decoded.id,cornersPx,centerPx,contrast:hi-lo});
        } finally { src.delete(); dst.delete(); transform.delete(); warped.delete(); }
      } finally { contour.delete(); approx.delete(); }
    }
  } finally { mats.reverse().forEach(m=>m.delete()); }
  const diagnostics={candidateCount,rejected,decodedIds:markers.map(m=>m.id),physicalAccuracy:'UNVERIFIED',confidence:'NOT_CALIBRATED'};
  const fail = reason => ({ok:false,reason,profile:p,markers,calibration:null,diagnostics,imageSize:{width:info.width,height:info.height}});
  if(new Set(markers.map(m=>m.id)).size !== markers.length) return fail('DUPLICATE_MARKER_ID');
  if(markers.length!==4) return fail('ALL_FOUR_VISIBLE_MARKERS_REQUIRED');
  markers.sort((a,b)=>a.id-b.id);
  try {
    const scale=computeScaleInfo(markers.map(m=>m.centerPx),p.spanCm);
    const maxCornerResidualCm=Math.max(...markers.map(m=>reprojectionErrorCm(scale.H,m.cornersPx,markerCornersCm(p,m.id))));
    diagnostics.maxCornerResidualCm=maxCornerResidualCm;
    // Extra 16 observed corners check the four-center fit; not an accuracy claim.
    if(!Number.isFinite(maxCornerResidualCm)||maxCornerResidualCm>p.markerSizeCm*0.08) return fail('MARKER_LAYOUT_OR_PHYSICAL_DIMENSIONS_INCONSISTENT');
    diagnostics.confidence='EXACT_CODES_AND_LAYOUT_CONSISTENT';
    return {ok:true,reason:null,profile:p,markers,calibration:{...scale,unit:'cm',origin:'marker-0-center',markerCentersPx:markers.map(m=>m.centerPx)},diagnostics,imageSize:{width:info.width,height:info.height}};
  } catch { return fail('DEGENERATE_MARKER_LAYOUT'); }
}

async function debugOverlay(imageBuffer,result) {
  const {width,height}=result.imageSize;
  const shapes=result.markers.map(m=>`<polygon points="${m.cornersPx.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${result.ok?'lime':'orange'}" stroke-width="3"/><text x="${m.centerPx[0]}" y="${m.centerPx[1]}" font-size="18" fill="red">${m.id}</text>`).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${shapes}<rect x="0" y="0" width="${width}" height="25" fill="white"/><text x="4" y="19" fill="black" font-size="16">${result.ok?'CALIBRATION PROTOTYPE - UNVERIFIED':result.reason}</text></svg>`;
  return sharp(imageBuffer).rotate().composite([{input:Buffer.from(svg)}]).png().toBuffer();
}

module.exports={detectMat,debugOverlay};
