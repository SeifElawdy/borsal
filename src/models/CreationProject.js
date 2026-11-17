const mongoose=require('mongoose');
const projectSchema=new mongoose.Schema({
  name:{type:String,required:true},scope:{type:String,enum:['USER','TEST_FIXTURE'],default:'USER',immutable:true},
  fabricId:{type:mongoose.Schema.Types.ObjectId,default:undefined},
  selection:{type:mongoose.Schema.Types.Mixed,default:()=>({stage:0,showUpload:true})},
  designVersions:{type:[mongoose.Schema.Types.Mixed],default:()=>[]},activeDesignFingerprint:String,
  observations:{type:[mongoose.Schema.Types.Mixed],default:()=>[]},
},{timestamps:true,optimisticConcurrency:true});
projectSchema.index({fabricId:1},{unique:true,partialFilterExpression:{fabricId:{$type:'objectId'}}});
const operationSchema=new mongoose.Schema({
  projectId:{type:mongoose.Schema.Types.ObjectId,required:true,immutable:true},requestKey:{type:String,required:true,immutable:true},
  kind:{type:String,enum:['CONCEPTS','IMAGE','TECHNICAL'],required:true,immutable:true},requestHash:{type:String,required:true,immutable:true},
  campaignId:{type:String,required:true,unique:true,immutable:true},state:{type:String,enum:['PENDING','SUCCEEDED','FAILED'],default:'PENDING'},
  sourceHash:String,conceptId:String,runId:mongoose.Schema.Types.ObjectId,proposalId:mongoose.Schema.Types.ObjectId,
  result:mongoose.Schema.Types.Mixed,failure:mongoose.Schema.Types.Mixed,httpStatus:Number,
  execution:{type:String,enum:['LIVE','TEST_FIXTURE'],required:true,immutable:true},
},{timestamps:true});
operationSchema.index({projectId:1,requestKey:1},{unique:true});
operationSchema.index({projectId:1,kind:1},{unique:true,partialFilterExpression:{state:'PENDING'}});
const settingsSchema=new mongoose.Schema({_id:{type:String},verifiedAt:Date,expiresAt:Date,remainingNeurons:Number,revision:{type:Number,default:0},
  method:{type:String,enum:['OWNER_DASHBOARD_ATTESTATION','TEST_FIXTURE']},paidPlan:{type:Boolean,default:false},blockedReason:String,
},{timestamps:true});
module.exports={Project:mongoose.model('CreationProject',projectSchema),Operation:mongoose.model('CreationOperation',operationSchema),Settings:mongoose.model('LocalAISettings',settingsSchema)};
