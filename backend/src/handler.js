import { previews } from './previews.js';
import { generateReply, providerStatus, ProviderError } from './gemma.js';
const MAX_BODY_BYTES=32_768;
async function readBody(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new ProviderError('Send application/json.',415);
  if (Number(request.headers.get('content-length'))>MAX_BODY_BYTES) throw new ProviderError('Request is too large.',413);
  const reader=request.body?.getReader();if(!reader) throw new ProviderError('A request body is required.',400);
  const chunks=[];let length=0;
  try {while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>MAX_BODY_BYTES){await reader.cancel();throw new ProviderError('Request is too large.',413);}chunks.push(value);}}
  finally {reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try {return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new ProviderError('Invalid JSON.',400);}
}
function validateMessages(body) {
  const messages=body?.messages;
  if(!Array.isArray(messages)||messages.length<1||messages.length>23||messages.length%2!==1) throw new ProviderError('Send up to 12 user turns, ending with a user message.',400);
  let total=0;
  const clean=messages.map((message,index)=>{
    if(!message||message.role!==(index%2===0?'user':'assistant')||typeof message.content!=='string'||!message.content.trim()||message.content.length>4000) throw new ProviderError('Messages must alternate user/assistant and contain 1–4000 characters.',400);
    total+=message.content.length;return {role:message.role,content:message.content.trim()};
  });
  if(total>16000) throw new ProviderError('Conversation is too long. Start a new conversation.',400);
  return clean;
}
export async function handleRequest(request, env = {}, dependencies = {}) {
  const {pathname,origin}=new URL(request.url);
  const responseHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  const json=(data,status=200,extra={})=>Response.json(data,{status,headers:{...responseHeaders,...extra}});
  if(!pathname.startsWith('/api/')&&env.ASSETS)return env.ASSETS.fetch(request);
  const browserOrigin=request.headers.get('Origin');
  const allowed=(env.ALLOWED_ORIGINS||'').split(',').map(value=>value.trim()).filter(Boolean);
  if(browserOrigin&&browserOrigin!==origin&&!allowed.includes(browserOrigin))return json({error:'Origin not allowed'},403);
  if(browserOrigin&&allowed.includes(browserOrigin)){responseHeaders['Access-Control-Allow-Origin']=browserOrigin;responseHeaders.Vary='Origin';}
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...responseHeaders,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
  if(pathname==='/api/chat') {
    if(request.method!=='POST')return json({error:'Method not allowed'},405,{Allow:'POST'});
    try {
      const messages=validateMessages(await readBody(request));
      if(env.CHAT_RATE_LIMITER){const limit=await env.CHAT_RATE_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'local'});if(!limit.success)return json({error:'Too many messages. Please wait a minute.'},429,{'Retry-After':'60'});}
      const result=await generateReply(messages,env,request.signal,dependencies.fetcher);
      return json({...result,requestId:crypto.randomUUID()});
    } catch(error) {return json({error:error instanceof ProviderError?error.message:'Chat could not complete. Please try again.'},error instanceof ProviderError?error.status:503);}
  }
  if(request.method!=='GET')return json({error:'Method not allowed'},405,{Allow:'GET'});
  if(pathname==='/api/health'){const providers=providerStatus(env);return json({status:'ok',service:'ijwi-api',capabilities:{preview:true,gemma:providers.cloudflare||providers.google,screening:false},providers});}
  const match=pathname.match(/^\/api\/preview\/(case|conversation|summary)$/);
  if(match)return json({...previews[match[1]],mode:'sample'});
  return json({error:'Not found'},404);
}
export default {fetch:(request,env)=>handleRequest(request,env)};
