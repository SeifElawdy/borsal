// One independently confirmed image per view. No templates or manufactured evidence.
const {area,dimensions}=require('../geometry/polygon');
const POLICY='borsal.product-preview/0.2';
const VIEWS={
  HERO:'Premium studio hero photograph of the complete finished product. Show its designed silhouette, opening/folding logic and purpose at a clear three-quarter angle, against a refined neutral background. No loose scrap or plain folded-cloth still life.',
  ALTERNATE:'Alternate-angle studio photograph of the exact same product, showing another side. Preserve its silhouette, proportions, color, texture, functional features and finishing choices; change the camera viewpoint, not the design.',
  DETAIL:'Close-up product-detail photograph of a meaningful functional feature described in this concept: opening, fold, closure, stitching or attachment. Keep enough surrounding product visible to explain the detail. Do not invent a new closure or redesign it for this shot.',
  IN_USE:'Realistic lifestyle photograph with this product actively performing its stated intended use. Show a clear interaction with the appropriate person, hands or item, only as required by that use. Keep the product prominent and its function immediately understandable; not an unused fabric rectangle beside props.'
};
function specification(concept,source,technical,visualNotes=''){
  return {product:concept.productIdea,intendedUse:concept.intendedUse,features:concept.distinctiveFeatures,
    constraints:concept.constraints,unresolved:concept.unresolvedRequirements,
    source:{...dimensions(source.polygonCm),usableAreaCm2:area(source.polygonCm)-(source.holes||[]).reduce((n,h)=>n+area(h),0),
      physicalAccuracy:'UNVERIFIED',appearance:'Follow the original fabric photograph or its source-linked hero reference; color and visible texture are approximate, not verified material properties.',materialProperties:'UNKNOWN'},
    technical,userVisualNotes:visualNotes};
}
function promptFor(spec,viewRole,hasReference=false){
  if(!VIEWS[viewRole])throw Error('INVALID_PREVIEW_VIEW');
  return ['Photorealistic ILLUSTRATIVE_AI_PREVIEW of one creative, useful fabric-upcycling product. Transform the scrap into a believable designed object, not an unmodified scrap, loose rectangle or meaningless folded cloth.',
    hasReference?'Image 0 is the selected source-linked HERO illustration. Render the SAME product identity, fabric appearance, silhouette and details consistently; do not copy its camera framing. It is a visual reference, not verified engineering.':'Image 0 is the original fabric appearance reference. Preserve its visible color, pattern and texture as closely as possible. Ignore the calibration mat, markers and photographic background; never print them on the product.',
    'Use this specific product name, actual intended use, approved creative features and any supplied technical evidence. Do not substitute a generic pouch, wrap or bag. Where construction is unresolved, visible finishing choices are illustrative hypotheses, not engineered facts.',
    JSON.stringify(spec),VIEWS[viewRole],
    'Keep the proposed product small enough to be plausible for the supplied scrap dimensions and area; do not depict a physically large product that contradicts them. Source measurements are not independently verified and finished dimensions are not established.',
    'No claims of verified seams, stretch, durability, available accessories, stock or manufacturing feasibility. Never imply food-contact safety, washability or hygiene. Do not add unsupported functional accessories. Exact texture fidelity and consistency across separate images cannot be guaranteed. No text, labels, watermark or cutting diagrams in the photograph.'].join('\n');
}
module.exports={POLICY,VIEWS,specification,promptFor};
