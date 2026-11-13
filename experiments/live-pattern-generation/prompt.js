const {contractText}=require('../design-language/ai-spike/prompt');
const fixture=require('../pattern-feasibility/synthetic-fabric.json');
const {area}=require('../../src/geometry/polygon');
function sourceConcept(){
  return {path:'experiments/live-pattern-generation/prompt.js#experiment-brief',data:{schemaVersion:'borsal.manual-concept/0.1',id:'burgundy-accessory-experiment',authorship:'HUMAN',
    brief:{id:'one-creative-accessory',text:'Propose ONE original small fabric-based accessory using explicitly proposed cutting geometry constrained by the saved synthetic burgundy scrap. No fixed product template.',
      requirements:['One original small fabric-based accessory, not a full invented parent bag','Explicit centimeter cutting polygons and separate stitching geometry; dimensions are hypotheses','One supplied synthetic scrap; no invented stock, fabric properties or physical approval','Preserve unsupported creative/construction details and needed measurements explicitly']},
    creative:{shapeIntent:'The model chooses the accessory and silhouette; no pattern template is prescribed',visualIntent:['Creative freedom within explicit available geometry'],modelDescription:'Human-authored experiment brief; model response is recorded separately'}}};
}
function fabric(){return {id:'synthetic-scrap',geometry:{polygonCm:structuredClone(fixture.polygonCm)}};}
function messages(){
  const lines=contractText().split('\n');
  const types=lines.filter(l=>/^(Source|Material|BOM|EdgeRef|Anchor|Fold|Piece|Component|Assembly|Feature|Limitation|Creative|Technical|Root)=/.test(l));
  return [{role:'system',content:[
    'Return exactly ONE JSON object: {"design": Root, "instances": CuttingInstance[]}. No Markdown, commentary, padding or manufactured evidence. Root below describes ONLY the design member, not the response envelope.',
    'All listed fields required unless ?. No unknown fields. ID=lowercase ^[a-z][a-z0-9-]*$; TEXT=nonempty string; N=finite number; I=positive integer; P=[N,N]. Every point is [x,y], never {x,y}. Units cm in the supplied coordinate frame. Instances use local coordinates; software nests them automatically.',
    ...types,
    'CuttingInstance={id:ID,pieceId:ID,copy:I,cuttingPolygonCm:P[] min=3,allowancesIncluded:true,grainToleranceDeg?:N between 0 and 90,allowedRotationsDeg?:N[] min=1 max=16}. Provide each physical copy explicitly. Cutting polygons implicitly close: do NOT repeat first point. Design SEAM_LINE outlines explicitly close: final segment.to equals outline.start. Separately author cutting and stitching geometry; the scalar allowance does not create a cutting offset.',
    'Unique IDs within each array, edge IDs within a piece. Each design piece belongs to exactly one component; all BOM/component/piece/edge/feature/limitation references must exist; copy=1..cutCount. SEAM sides need existing contiguous edges and direction; SEAM/ATTACH need a THREAD BOM ID. Assembly anchors must be inside the referenced local cutting polygon.',
    'One scrapSources id=synthetic-scrap; SCRAP BOM points to it. STOCK availability is NOT_CHECKED, never AVAILABLE. Units: fabric/lining/interfacing cm2; thread/webbing cm; button/hardware/zipper integer piece. No stock snapshot, fabricated property or approval field is allowed in the response.',
    'Known: ONLY the supplied synthetic polygon/area and burgundy appearance label. Fiber, weave, weight, physical scale accuracy, grain, confirmation, revisions, stock and strength are UNKNOWN. Never invent these facts. If the legacy schema requires an unknown property, OMIT that field and record it in limitations; CONCEPT_ONLY is an honest result. Material requirements/quantities, design dimensions and assembly intent are unverified hypotheses, not measurements or available inventory.',
    'Existing category enum is SHOULDER_BAG|TOTE_BAG: use an explicitly illustrative parent context for your accessory; do not invent a full bag or unrequested handles/buttons. No fixed bag/pattern template. Choose your own small accessory and outline, keeping output concise.',
    'Root limitations must reference named features and contain informative reasons and missingInformation. Preserve creative requirements; never claim schema success establishes fit or manufacture. Prefer LINE stitching edges for the current polygon bridge; curves remain unsupported for feasibility. No geometry repair will be applied.',
  ].join('\n')},{role:'user',content:JSON.stringify({brief:sourceConcept().data.brief,fabricId:'synthetic-scrap',polygonCm:fixture.polygonCm,areaCm2:area(fixture.polygonCm),provenance:fixture.provenance,physicalAccuracy:'UNVERIFIED',materialProperties:'UNKNOWN',stock:'UNKNOWN',grain:'UNKNOWN'})}];
}
module.exports={sourceConcept,fabric,messages};
