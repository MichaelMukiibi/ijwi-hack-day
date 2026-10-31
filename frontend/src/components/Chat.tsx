import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendChat } from '../lib/api';
import type { ChatMessage, ChatReply } from '../lib/api';
type DisplayMessage = ChatMessage & {metadata?: ChatReply};
const suggestions = ['What information should I collect before retinal screening?', 'Help me prepare a case for specialist review.'];
export function Chat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const mutation = useMutation({
    mutationFn: (history: ChatMessage[]) => {
      controller.current = new AbortController();
      return sendChat(history, controller.current.signal);
    },
    retry: false,
    onSuccess: (data, history) => {
      setMessages(previous => [...previous, history[history.length - 1], {role: 'assistant', content: data.reply, metadata: data}]);
      input.current?.focus();
    },
  });
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {if(messages.length || mutation.isPending) end.current?.scrollIntoView({block:'nearest'});}, [messages.length, mutation.isPending]);
  const atLimit = messages.length >= 24;
  const submitted = (mutation.isPending || mutation.isError) ? mutation.variables?.at(-1) : undefined;
  function send(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || mutation.isPending || atLimit) return;
    mutation.mutate([...messages.map(({role,content})=>({role,content})), {role:'user',content:draft.trim()}]);
    setDraft('');
  }
  function reset() {if(mutation.isPending)return;setMessages([]);setDraft('');mutation.reset();input.current?.focus();}
  return <section id="chat" className="chat-section wrap" aria-labelledby="chat-heading">
    <div className="chat-intro"><p className="eyebrow">03 / A CONVERSATION WITH GEMMA 4</p><h2 id="chat-heading">A question is<br/><em>a good place to start.</em></h2><p>Talk through the screening workflow, collect the missing context, and prepare for a clearer specialist handoff.</p><p className="chat-scope">Use synthetic examples. Do not enter patient names or identifying details. This chat does not process retinal images or make diagnoses.</p><div className="chat-tech"><span className="status-dot"/> Cloudflare Workers AI · Google fallback</div></div>
    <div className="chat-window"><div className="workspace-top"><span className="mini-brand">ijwi.</span><span className="sample-badge">GEMMA 4 CHAT</span><button className="chat-reset" onClick={reset} disabled={mutation.isPending}>New conversation</button></div>
      <div className="chat-log" role="log" aria-label="Conversation with Ijwi" aria-live="polite" aria-relevant="additions text">
        {!messages.length && !submitted && <div className="chat-welcome"><span className="welcome-eye" aria-hidden="true">◎</span><h3>What would you like to understand?</h3><p>I can help you organize a screening case and discuss the information still needed.</p><div className="chat-suggestions">{suggestions.map(text=><button key={text} onClick={()=>{setDraft(text);input.current?.focus();}}>{text}<span aria-hidden="true">↗</span></button>)}</div></div>}
        {messages.map((message,index)=><div className={`live-message ${message.role}`} key={index}><p className="chat-label">{message.role==='user'?'YOU':'IJWI · GEMMA 4'}</p><div className="chat-bubble">{message.content}</div>{message.metadata&&<p className="reply-source">{message.metadata.provider==='cloudflare'?'Cloudflare Workers AI':'Google API · fallback'} · {message.metadata.model}</p>}</div>)}
        {submitted && <div className="live-message user"><p className="chat-label">YOU</p><div className="chat-bubble">{submitted.content}</div></div>}
        {mutation.isPending && <p className="chat-progress" role="status">Gemma is preparing a response…</p>}
        <div ref={end}/>
      </div>
      {mutation.isError && <div className="chat-error" role="alert"><p>{mutation.error.name==='AbortError'?'Response stopped. You can retry or send another message.':mutation.error.message}</p><button onClick={()=>mutation.variables&&mutation.mutate(mutation.variables)}>Retry message</button></div>}
      {atLimit && <p className="chat-limit">This conversation has reached 12 turns. Start a new conversation to continue.</p>}
      <form className="chat-composer" onSubmit={send}><label className="sr-only" htmlFor="chat-message">Your message to Gemma</label><textarea ref={input} id="chat-message" value={draft} onChange={event=>setDraft(event.target.value)} maxLength={4000} rows={2} placeholder="Ask Ijwi a question…" disabled={mutation.isPending||atLimit} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();event.currentTarget.form?.requestSubmit();}}}/><div className="composer-actions"><span>{draft.length}/4000 · Enter to send</span>{mutation.isPending?<button type="button" className="button" onClick={()=>controller.current?.abort()}>Stop</button>:<button className="button" type="submit" disabled={!draft.trim()||atLimit}>Send message <span aria-hidden="true">↗</span></button>}</div></form>
      <p className="chat-footnote">AI responses require professional review. Conversation stays in this page’s memory and clears on reload. If Cloudflare is unavailable, the conversation is sent to Google as fallback.</p>
    </div>
  </section>;
}
