import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHealth, getPreview } from '../lib/api.js';
const tabs = [{id:'case',label:'The case'},{id:'conversation',label:'The conversation'},{id:'summary',label:'The handoff'}];
export function WorkspacePreview() {
  const [active, setActive] = useState('case');
  const refs = useRef([]);
  const health = useQuery({queryKey:['health'],queryFn:getHealth});
  const preview = useQuery({queryKey:['preview',active],queryFn:({signal}) => getPreview(active,signal)});
  function onKey(event,index) {
    let next;
    if (['ArrowRight','ArrowDown'].includes(event.key)) next=(index+1)%tabs.length;
    if (['ArrowLeft','ArrowUp'].includes(event.key)) next=(index+tabs.length-1)%tabs.length;
    if (event.key==='Home') next=0;
    if (event.key==='End') next=tabs.length-1;
    if (next!==undefined) {event.preventDefault();setActive(tabs[next].id);refs.current[next]?.focus();}
  }
  const state = health.isPending ? 'Checking backend…' : health.isError ? 'Backend unavailable' : 'Backend connected';
  return <><div className="preview-controls"><div className="preview-tabs" role="tablist" aria-label="Workspace preview" aria-orientation="vertical">{tabs.map((tab,index)=><button key={tab.id} ref={element=>{refs.current[index]=element;}} role="tab" id={`tab-${tab.id}`} aria-controls="preview-panel" aria-selected={active===tab.id} tabIndex={active===tab.id?0:-1} onClick={()=>setActive(tab.id)} onKeyDown={event=>onKey(event,index)}>0{index+1} <span>{tab.label}</span><span aria-hidden="true">↗</span></button>)}</div><p className="preview-disclaimer">Sample content served by the backend. No retinal inference or AI is called.</p><div className="connection"><span className="status-dot" data-state={health.isError?'offline':'online'} aria-hidden="true"/><span role="status">{state}</span>{health.isError&&<button onClick={()=>{health.refetch();preview.refetch();}}>Reconnect</button>}</div></div><div className="workspace"><div className="workspace-top"><span className="mini-brand">ijwi.</span><span className="sample-badge">SAMPLE CONTENT</span><span className="window-dots" aria-hidden="true">•••</span></div><div className="workspace-body" id="preview-panel" role="tabpanel" aria-labelledby={`tab-${active}`} tabIndex={0} aria-busy={preview.isFetching}>{preview.isPending?<div role="status"><p className="workspace-eyebrow">CONNECTING THE WORKSPACE</p><h3>Fetching the preview…</h3><div className="loading-lines" aria-hidden="true"/></div>:preview.isError?<div className="workspace-error" role="alert"><p className="workspace-eyebrow">CONNECTION INTERRUPTED</p><h3>We couldn’t reach the preview.</h3><p>{preview.error.message} Start the backend, then try again.</p><button className="retry-button" onClick={()=>preview.refetch()}>Try again</button></div>:<PreviewContent data={preview.data}/>}</div><div className="workspace-bottom"><span className="status-dot"/> Designed for a human in the loop</div></div></>;
}
function PreviewContent({data}) {
  return <><p className="workspace-eyebrow">{data.eyebrow}</p><h3>{data.title}</h3><p className="workspace-text">{data.description}</p>{data.messages.map((message,index)=><div key={index}><div className="chat-label">{message.role==='user'?'HEALTH WORKER':'IJWI'} · SAMPLE MESSAGE</div><div className={`chat-bubble ${message.role==='user'?'user':''}`}>{message.text}</div></div>)}{data.rows.map(row=><div className="sample-row" key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}<div className="workspace-callout"><span aria-hidden="true">◎</span><p>{data.note}</p></div></>;
}
