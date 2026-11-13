// Reopen only an explicitly named isolated demo DB for local human selection/review.
require('dotenv').config({quiet:true});
const mongoose=require('mongoose');
const name=process.argv[2];
if(!/^borsal-mvp-demo-[a-f0-9-]{36}-test$/.test(name||''))throw Error('Provide the isolated demo databaseName from summary.json');
const uri=new URL(process.env.MONGODB_URI);uri.pathname='/'+name;
process.env.BORSAL_MVP_DESIGN_FLOW='1';delete process.env.BORSAL_CONCEPT_LIVE;
mongoose.connect(uri.toString()).then(()=>require('../../src/app').listen(Number(process.env.PORT||3001),'127.0.0.1',()=>console.log('Local concept review: http://127.0.0.1:'+(process.env.PORT||3001))))
  .catch(()=>{console.error('Isolated demo server failed');process.exitCode=1;});
