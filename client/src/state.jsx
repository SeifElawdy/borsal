import React,{createContext,useContext,useEffect,useState} from 'react';
import {api,errorText} from './api';
const Context=createContext(null);
export function Workspace({children}){
  const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[toast,setToast]=useState(null),[selection,setSelection]=useState({});
  async function reload(next={}){setError('');try{const d=await api.bootstrap();setData(d);setSelection(s=>({...s,...next}));return d;}catch(e){setError(errorText(e));throw e;}finally{setLoading(false);}}
  useEffect(()=>{reload().catch(()=>{});},[]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(null),6500);return()=>clearTimeout(t);},[toast]);
  const fabric=data?.fabrics.find(f=>f._id===selection.fabricId)||data?.fabrics[0];
  const runs=data?.runs.filter(r=>String(r.fabricId)===fabric?._id)||[];
  const run=runs.find(r=>r._id===selection.runId)||runs.find(r=>r._id===data?.preferredRunId)||runs[0];
  const proposals=data?.proposals.filter(p=>String(p.fabricId)===fabric?._id)||[];
  const proposal=proposals.find(p=>p._id===selection.proposalId)||proposals.find(p=>p._id===data?.preferredProposalId)||proposals[0];
  return <Context.Provider value={{data,error,loading,reload,fabric,run,runs,proposal,proposals,selectFabric:id=>setSelection({fabricId:id}),select:v=>setSelection(s=>({...s,...v})),toast,notify:(text,tone='success')=>setToast({text,tone}),dismiss:()=>setToast(null)}}>{children}</Context.Provider>;
}
export const useWorkspace=()=>useContext(Context);
