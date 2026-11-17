const mongoose=require('mongoose');
const {Schema}=mongoose,ref={type:Schema.Types.ObjectId,required:true,immutable:true},mixed={type:Schema.Types.Mixed,immutable:true};
const scope={type:String,enum:['REAL','TEST_FIXTURE'],required:true,immutable:true};
const reviewSchema=new Schema({proposalId:{...ref,unique:true},version:{type:Number,default:0},decision:String,history:{type:[Schema.Types.Mixed],default:[]}}, {timestamps:true,optimisticConcurrency:true});
const evidenceSchema=new Schema({proposalId:ref,scope,proposalHash:{type:String,immutable:true},sourceHash:{type:String,immutable:true},conceptReviewHash:{type:String,immutable:true},bundle:mixed,attestation:mixed}, {timestamps:true});
const stockSchema=new Schema({sku:{type:String,required:true,unique:true,immutable:true},scope,material:mixed,unit:{type:String,enum:['cm','cm2','piece'],required:true,immutable:true},
  receivedQuantity:{type:Number,min:0,required:true,immutable:true},availableQuantity:{type:Number,min:0,required:true},reservedQuantity:{type:Number,min:0,default:0},
  availability:{type:String,enum:['AVAILABLE','UNAVAILABLE','UNKNOWN'],required:true},receipt:mixed,attestation:mixed}, {timestamps:true,optimisticConcurrency:true});
const inventorySchema=new Schema({proposalId:{...ref,unique:true},fabricId:{...ref,unique:true},scope,
  idempotencyKey:{type:String,required:true,unique:true,immutable:true},requestHash:{type:String,required:true,immutable:true},
  state:{type:String,enum:['RESERVED_PRODUCTION_PLAN'],default:'RESERVED_PRODUCTION_PLAN',immutable:true},
  design:mixed,references:mixed,manufacturingDetails:mixed,approvalHistory:mixed,approvalVersion:{type:Number,immutable:true},reservation:mixed,readiness:mixed,
  productionAuthorized:{type:Boolean,immutable:true},manufacturingVerified:{type:Boolean,default:false,immutable:true},finishedProduct:{type:Boolean,default:false,immutable:true}}, {timestamps:true});
module.exports={
  DesignReview:mongoose.model('DesignReview',reviewSchema),ProductionEvidence:mongoose.model('ProductionEvidence',evidenceSchema),
  AccessoryStock:mongoose.model('AccessoryStock',stockSchema),InventoryItem:mongoose.model('InventoryItem',inventorySchema),
};
