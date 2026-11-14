const mongoose=require('mongoose');
// Immutable proposal/report versions. Creating a new version never edits old evidence.
const schema=new mongoose.Schema({
  runId:{type:mongoose.Schema.Types.ObjectId,ref:'ConceptRun',required:true,immutable:true},
  conceptId:{type:String,required:true,immutable:true},fabricId:{type:mongoose.Schema.Types.ObjectId,ref:'FabricPiece',required:true,immutable:true},
  version:{type:Number,required:true,immutable:true},reviewVersion:{type:Number,required:true,immutable:true},
  origin:{type:String,enum:['AUTHORED','MODEL_OUTPUT','DERIVED','ENGINE_DERIVED'],required:true,immutable:true},sourceLabel:{type:String,required:true,immutable:true},
  originalInput:{type:mongoose.Schema.Types.Mixed,immutable:true},provenance:{type:mongoose.Schema.Types.Mixed,immutable:true},
  status:{type:String,enum:['CONCEPT_ONLY','REJECTED','CHECKED'],required:true,immutable:true},
  verdict:{type:String,enum:['PASS','FAIL','UNVERIFIED'],required:true,immutable:true},
  assessment:{type:mongoose.Schema.Types.Mixed,immutable:true},feasibility:{type:mongoose.Schema.Types.Mixed,default:null,immutable:true},
  previewSvg:{type:String,default:null,immutable:true},svgSha256:{type:String,default:null,immutable:true},
  nestingSvg:{type:String,default:null,immutable:true},nestingSvgSha256:{type:String,default:null,immutable:true},
  manufacturingVerified:{type:Boolean,default:false,immutable:true},
},{timestamps:true});
schema.index({runId:1,conceptId:1,version:1},{unique:true});
module.exports=mongoose.model('TechnicalProposal',schema);
