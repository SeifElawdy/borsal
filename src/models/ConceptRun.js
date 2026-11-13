const mongoose=require('mongoose');
// Append-only generation snapshots; reviews/handoffs are versioned inside this run.
const schema=new mongoose.Schema({
  fabricId:{type:mongoose.Schema.Types.ObjectId,ref:'FabricPiece',required:true,index:true},
  campaignId:{type:String,required:true,unique:true},mode:{type:String,enum:['MOCK','LIVE'],required:true},
  state:{type:String,enum:['REQUESTED','RECEIVED','INVALID_OUTPUT','FAILED'],default:'REQUESTED'},
  sourceSnapshot:{type:mongoose.Schema.Types.Mixed,required:true,immutable:true},
  sources:{type:mongoose.Schema.Types.Mixed,required:true,immutable:true},
  rawText:String,response:mongoose.Schema.Types.Mixed,validationErrors:{type:mongoose.Schema.Types.Mixed,default:[]},
  concepts:{type:mongoose.Schema.Types.Mixed,default:[]},failure:mongoose.Schema.Types.Mixed,
},{timestamps:true,optimisticConcurrency:true});
module.exports=mongoose.model('ConceptRun',schema);
