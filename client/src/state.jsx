import React,{createContext,useContext,useEffect,useState,useRef} from 'react';
import {api,request,errorText} from './api';
const Context=createContext(null);
export function Workspace({children}){
  const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[toast,setToast]=useState(null),[selection,setSelection]=useState({}),[restored,setRestored]=useState(false),[comparison,setComparison]=useState(null),[sourceStale,setSourceStale]=useState(false);
  const saveQueue=useRef(Promise.resolve()),dataRef=useRef(null),selectionRef=useRef(selection);dataRef.current=data;selectionRef.current=selection;
  const key=d=>'borsal-studio-v1:'+(d.workspaceKind==='USER'?'user-projects':d.databaseName);
  async function reload(next={}){setError('');try{const d=await api.bootstrap();dataRef.current=d;if(d.workspaceKind==='USER'&&Object.keys(next).length&&selectionRef.current.projectId){const p=d.projects.find(p=>p._id===selectionRef.current.projectId);if(p){const updatedSelection=Object.fromEntries(Object.entries({...selectionRef.current,...next}).filter(([k])=>['stage','showUpload','runId','conceptId','proposalId','previewId'].includes(k)));await (saveQueue.current=saveQueue.current.catch(()=>{}).then(async()=>{const current=dataRef.current.projects.find(x=>x._id===p._id),r=await request('/ui/projects/'+p._id,{method:'PATCH',body:{expectedVersion:current.__v,selection:updatedSelection}});d.projects=d.projects.map(x=>x._id===p._id?r.project:x);dataRef.current=d;}));}}setData(d);setSelection(s=>({...s,...next}));return d;}catch(e){setError(errorText(e));throw e;}finally{setLoading(false);}}
  useEffect(()=>{reload().catch(()=>{});},[]);
  useEffect(()=>{if(!data||restored)return;try{const saved=JSON.parse(localStorage.getItem(key(data))||'{}');const p=data.projects?.find(p=>p._id===saved.projectId);setSelection(data.workspaceKind==='USER'?(p?{projectId:p._id,fabricId:p.fabricId,...p.selection}:{}):saved);}catch{}setRestored(true);},[data,restored]);
  // Browser stores navigation identifiers only. Evidence and reviews stay in MongoDB.
  useEffect(()=>{if(!data||!restored)return;try{localStorage.setItem(key(data),JSON.stringify(selection));if(selection.fabricId)localStorage.setItem(key(data)+':'+selection.fabricId,JSON.stringify(selection));}catch{}},[selection,data,restored]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(null),7000);return()=>clearTimeout(t);},[toast]);
  const userMode=data?.workspaceKind==='USER',project=data?.projects?.find(p=>p._id===selection.projectId);
  const fabric=userMode?data?.fabrics.find(f=>f._id===project?.fabricId):data?.fabrics.find(f=>f._id===selection.fabricId)||data?.fabrics[0];
  const runs=data?.runs.filter(r=>String(r.fabricId)===fabric?._id)||[],run=runs.find(r=>r._id===selection.runId)||runs.find(r=>r._id===data?.preferredRunId)||runs[0];
  const concept=run?.concepts.find(c=>c.id===selection.conceptId)||(!userMode&&run?.concepts.find(c=>c.id==='a96f954a-3083-491b-9976-93d3bdbb7111'))||run?.concepts[0];
  const proposals=data?.proposals.filter(p=>String(p.fabricId)===fabric?._id&&String(p.runId)===run?._id&&p.conceptId===concept?.id)||[];
  const proposal=proposals.find(p=>p._id===selection.proposalId)||proposals.find(p=>p._id===data?.preferredProposalId)||proposals[0];
  useEffect(()=>{let active=true;setComparison(null);if(run)api.comparison(run._id).then(v=>active&&setComparison(v)).catch(()=>active&&setComparison({refreshRequired:true}));return()=>{active=false;};},[run?._id,run?.__v,fabric?.__v,data]);
  useEffect(()=>{let active=true;setSourceStale(!!proposal);if(proposal)api.proposal(proposal._id).then(v=>active&&setSourceStale(v.sourceStale||proposal.reviewVersion!==concept?.reviewVersion)).catch(()=>active&&setSourceStale(true));return()=>{active=false;};},[proposal?._id,concept?.reviewVersion,data]);
  function select(v){setSelection(s=>{const next={...s,...v};if(userMode&&project){const allowed=Object.fromEntries(Object.entries(next).filter(([k])=>['stage','showUpload','runId','conceptId','proposalId','previewId'].includes(k)));saveQueue.current=saveQueue.current.then(async()=>{const current=dataRef.current.projects.find(p=>p._id===project._id);const r=await request('/ui/projects/'+project._id,{method:'PATCH',body:{expectedVersion:current.__v,selection:allowed}});setData(d=>{const updated={...d,projects:d.projects.map(p=>p._id===r.project._id?r.project:p)};dataRef.current=updated;return updated;});}).catch(e=>{setToast({text:errorText(e),tone:'error'});});}return next;});}
  function openProject(p){setSelection({projectId:p._id,fabricId:p.fabricId,...p.selection});}
  async function newProject(name){const r=await request('/ui/projects',{method:'POST',body:{name}});await reload();openProject(r.project);}
  async function attachSource(fabricId){if(!userMode)return;const r=await request('/ui/projects/'+project._id+'/source',{method:'POST',body:{expectedVersion:project.__v,fabricId}});await reload();openProject(r.project);}
  function selectFabric(id){if(userMode){const p=data.projects.find(p=>p.fabricId===id);if(p)openProject(p);return;}let saved={};try{saved=JSON.parse(localStorage.getItem(key(data)+':'+id)||'{}');}catch{}setSelection({fabricId:id,stage:1,...saved});}
  return <Context.Provider value={{data,error,userMode,project,openProject,newProject,attachSource,loading:loading||!restored,reload,fabric,run,runs,concept,proposal,proposals,selection,stage:selection.stage??0,selectFabric,select,comparison,sourceStale,toast,notify:(text,tone='success')=>setToast({text,tone}),dismiss:()=>setToast(null)}}>{children}</Context.Provider>;
}
export const useWorkspace=()=>useContext(Context);
