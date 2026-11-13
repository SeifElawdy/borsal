const fs=require('fs'),path=require('path'),mongoose=require('mongoose'),{randomBytes}=require('crypto'),{pathToFileURL}=require('url');
async function main(){
  require('dotenv').config({quiet:true});const root=path.resolve(__dirname,'..'),dir=path.join(root,'data/local-mvp');fs.mkdirSync(dir,{recursive:true});
  const stateFile=path.join(dir,'workspace.json');let state;
  if(fs.existsSync(stateFile))state=JSON.parse(fs.readFileSync(stateFile,'utf8'));
  else{console.log('Preparing an isolated TEST_FIXTURE workspace from saved Borsal records…');const original=console.log;let seed;try{console.log=()=>{};seed=await require('../experiments/mvp-design-flow/keychain-feasibility-demo').main([path.join(dir,'seed-'+Date.now())]);}finally{console.log=original;}
    const ref=path.join(root,'data/mvp-approval-phase6f-002/summary.json');state={databaseName:seed.databaseName,preferredRunId:seed.runId,preferredProposalId:seed.proposalId,referenceDatabase:fs.existsSync(ref)?JSON.parse(fs.readFileSync(ref)).databaseName:null};fs.writeFileSync(stateFile,JSON.stringify(state,null,2),{flag:'wx'});}
  if(!/^borsal-mvp-demo-[a-f0-9-]{36}-test$/.test(state.databaseName))throw Error('Unsafe demo database');
  const uri=new URL(process.env.MONGODB_URI);uri.pathname='/'+state.databaseName;await mongoose.connect(uri.toString());
  if(!await require('../src/models/ConceptRun').exists({_id:state.preferredRunId}))throw Error('Saved demo is missing; no automatic reset performed');
  process.env.BORSAL_MVP_DESIGN_FLOW='1';process.env.BORSAL_INVENTORY_TEST_FIXTURES='1';process.env.BORSAL_UPLOADS_DIR=path.join(dir,'uploads');
  delete process.env.BORSAL_PRODUCTION_APPROVALS;delete process.env.BORSAL_CONCEPT_LIVE;delete process.env.BORSAL_TECHNICAL_LIVE;
  const token=randomBytes(32).toString('hex');process.env.BORSAL_APPROVAL_TOKEN=token;process.env.BORSAL_OPERATOR_ID='LOCAL_TEST_FIXTURE_OPERATOR';
  const app=require('../src/localMvp').createLocalMvp({...state,operatorToken:token});const server=await new Promise((resolve,reject)=>{const s=app.listen(3001,'127.0.0.1',()=>resolve(s));s.once('error',reject);});
  const {createServer}=await import(pathToFileURL(path.join(root,'client/node_modules/vite/dist/node/index.js')).href);
  const vite=await createServer({root:path.join(root,'client'),configFile:path.join(root,'client/vite.config.mjs')});try{await vite.listen();}catch(error){await new Promise(resolve=>server.close(resolve));throw error;}
  console.log('Borsal MVP → http://127.0.0.1:5173 · DEMO / TEST_FIXTURE · live inference disabled');
  async function close(){await vite.close();await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();process.exit(0);}process.once('SIGINT',close);process.once('SIGTERM',close);
}
if(require.main===module)main().catch(()=>{console.error('Local MVP stopped safely. Check MongoDB, client dependencies and ports 3001/5173. No inference or production writes.');process.exitCode=1;mongoose.disconnect();});
module.exports={main};
