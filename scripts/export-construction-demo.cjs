// Read-only export from the running isolated mock UI. Does not dispatch inference.
const fs=require('fs'),path=require('path');
async function main(){
 const base='http://127.0.0.1:5173',boot=await fetch(base+'/ui/bootstrap').then(r=>r.json());
 if(boot.mode!=='USER / TEST_FIXTURE PROVIDERS')throw Error('An isolated mock workspace is required');
 const project=boot.projects.find(p=>p.name==='TEST_FIXTURE Woven geometry-first'),proposal=boot.proposals.find(p=>p._id===project?.selection?.proposalId);
 if(!proposal?.provenance.derivation?.constructionIntent||!proposal.previewSvg||!proposal.nestingSvg)throw Error('Select a construction alternative through the UI first');
 const source=JSON.parse(boot.runs.find(r=>r._id===String(proposal.runId))?JSON.stringify(boot.runs.find(r=>r._id===String(proposal.runId)).sourceSnapshot):'null');
 const endpoint=`/ui/projects/${project._id}/runs/${proposal.runId}/concepts/${proposal.conceptId}/proposals/${proposal._id}/construction`,report=await fetch(base+endpoint).then(r=>{if(!r.ok)throw Error('Construction report unavailable');return r.json();});
 const out=path.resolve('data/emergency-demo-results/'+Date.now());fs.mkdirSync(out,{recursive:true});
 const files={'proposal.json':JSON.stringify(proposal,null,2),'source.json':JSON.stringify(source,null,2),'construction-report.json':JSON.stringify(report,null,2),
  'cutting-pattern.svg':proposal.previewSvg,'nesting-layout.svg':proposal.nestingSvg,'construction-evidence.svg':report.annotationSvg,
  'bom.json':JSON.stringify(proposal.originalInput.proposal.design.data.technical.bom,null,2),'assembly-instructions.json':JSON.stringify(report.proposedAssembly,null,2)};
 for(const [name,bytes]of Object.entries(files))fs.writeFileSync(path.join(out,name),bytes,{flag:'wx'});
 const evidence={out,execution:'TEST_FIXTURE / ENGINE_DERIVED',proposalId:proposal._id,sourceHash:proposal.provenance.fabricSourceHash,geometry:proposal.assessment.preliminaryGeometry.status,area:proposal.assessment.preliminaryGeometry.result.areaSummary,
  assemblyReferences:report.precheck?.layers.assembly.status,construction:report.construction,creativeCoverage:report.creativeCoverage,manufacturingVerified:false,inferenceRequests:0};
 fs.writeFileSync(path.join(out,'demo-summary.json'),JSON.stringify(evidence,null,2),{flag:'wx'});console.log(JSON.stringify(evidence));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={main};
