import React,{createContext,useContext,useEffect,useState} from 'react';
import {api,errorText} from './api';
const Context=createContext(null);
export function Workspace({children}){
  const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[toast,setToast]=useState(null),[selection,setSelection]=useState({}),[restored,setRestored]=useState(false),[comparison,setComparison]=useState(null),[sourceStale,setSourceStale]=useState(false);
  const key=d=>'borsal-studio-v1:'+d.databaseName;
  async function reload(next={}){setError('');try{const d=await api.bootstrap();setData(d);setSelection(s=>({...s,...next}));return d;}catch(e){setError(errorText(e));throw e;}finally{setLoading(false);}}
  useEffect(()=>{reload().catch(()=>{});},[]);
  useEffect(()=>{if(!data||restored)return;try{setSelection(JSON.parse(localStorage.getItem(key(data))||'{}'));}catch{}setRestored(true);},[data,restored]);
  // Browser stores navigation identifiers only. Evidence and reviews stay in MongoDB.
  useEffect(()=>{if(!data||!restored)return;try{localStorage.setItem(key(data),JSON.stringify(selection));if(selection.fabricId)localStorage.setItem(key(data)+':'+selection.fabricId,JSON.stringify(selection));}catch{}},[selection,data,restored]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(null),7000);return()=>clearTimeout(t);},[toast]);
  const fabric=data?.fabrics.find(f=>f._id===selection.fabricId)||data?.fabrics[0];
  const runs=data?.runs.filter(r=>String(r.fabricId)===fabric?._id)||[],run=runs.find(r=>r._id===selection.runId)||runs.find(r=>r._id===data?.preferredRunId)||runs[0];
  const concept=run?.concepts.find(c=>c.id===selection.conceptId)||run?.concepts.find(c=>c.id==='a96f954a-3083-491b-9976-93d3bdbb7111')||run?.concepts[0];
  const proposals=data?.proposals.filter(p=>String(p.fabricId)===fabric?._id&&String(p.runId)===run?._id&&p.conceptId===concept?.id)||[];
  const proposal=proposals.find(p=>p._id===selection.proposalId)||proposals.find(p=>p._id===data?.preferredProposalId)||proposals[0];
  useEffect(()=>{let active=true;setComparison(null);if(run)api.comparison(run._id).then(v=>active&&setComparison(v)).catch(()=>active&&setComparison({refreshRequired:true}));return()=>{active=false;};},[run?._id,run?.__v,fabric?.__v,data]);
  useEffect(()=>{let active=true;setSourceStale(!!proposal);if(proposal)api.proposal(proposal._id).then(v=>active&&setSourceStale(v.sourceStale||proposal.reviewVersion!==concept?.reviewVersion)).catch(()=>active&&setSourceStale(true));return()=>{active=false;};},[proposal?._id,concept?.reviewVersion,data]);
  function select(v){setSelection(s=>({...s,...v}));}
  function selectFabric(id){let saved={};try{saved=JSON.parse(localStorage.getItem(key(data)+':'+id)||'{}');}catch{}setSelection({fabricId:id,stage:1,...saved});}
  return <Context.Provider value={{data,error,loading:loading||!restored,reload,fabric,run,runs,concept,proposal,proposals,selection,stage:selection.stage??0,selectFabric,select,comparison,sourceStale,toast,notify:(text,tone='success')=>setToast({text,tone}),dismiss:()=>setToast(null)}}>{children}</Context.Provider>;
}
export const useWorkspace=()=>useContext(Context);
