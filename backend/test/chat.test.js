import { test } from 'node:test';
import assert from 'node:assert/strict';
import {handleRequest} from '../src/handler.js';
import {generateReply} from '../src/gemma.js';
const history=[{role:'user',content:'What information is needed for a screening case?'}];
const request=(body={messages:history},headers={})=>new Request('https://ijwi.example/api/chat',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
test('Cloudflare binding is primary and receives fixed server instructions',async()=>{
 let called=0;
 const result=await generateReply(history,{AI:{run:async(model,input)=>{called++;assert.equal(model,'@cf/google/gemma-4-26b-a4b-it');assert.equal(input.messages[0].role,'system');assert.equal(input.messages[1].content,history[0].content);return {choices:[{message:{content:'Collect supplied history first.'}}]};}},GOOGLE_API_KEY:'not-a-real-key'},undefined,()=>{throw Error('Google must not run');});
 assert.equal(called,1);assert.equal(result.provider,'cloudflare');assert.equal(result.fallback,false);
});
test('REST Cloudflare path authenticates server-side',async()=>{
 const result=await generateReply(history,{CLOUDFLARE_ACCOUNT_ID:'account',CLOUDFLARE_API_TOKEN:'test-only'},undefined,async(url,options)=>{assert.match(url,/api.cloudflare.com/);assert.equal(options.headers.Authorization,'Bearer test-only');return Response.json({success:true,result:{response:'A response'}});});
 assert.equal(result.reply,'A response');
});
test('Cloudflare failure falls back to Google and maps multi-turn roles',async()=>{
 const messages=[...history,{role:'assistant',content:'What is missing?'},{role:'user',content:'No image yet.'}];
 const result=await generateReply(messages,{AI:{run:async()=>{throw Error('private provider error');}},GOOGLE_API_KEY:'test-only'},undefined,async(url,options)=>{
  assert.match(url,/gemma-4-26b-a4b-it:generateContent$/);assert.equal(options.headers['x-goog-api-key'],'test-only');
  const body=JSON.parse(options.body);assert.deepEqual(body.contents.map(m=>m.role),['user','model','user']);assert(body.systemInstruction.parts[0].text);
  return Response.json({candidates:[{content:{parts:[{thought:true,text:'private reasoning'},{text:'Please attach a fundus image before screening.'}]}}]});
 });
 assert.equal(result.provider,'google');assert.equal(result.fallback,true);assert(!result.reply.includes('private reasoning'));
});
test('empty Cloudflare output falls back; safety block does not',async()=>{
 let calls=0;const google=async()=>{calls++;return Response.json({candidates:[{content:{parts:[{text:'Fallback'}]}}]});};
 await generateReply(history,{AI:{run:async()=>({response:''})},GOOGLE_API_KEY:'test-only'},undefined,google);assert.equal(calls,1);
 await assert.rejects(generateReply(history,{AI:{run:async()=>({choices:[{finish_reason:'content_filter'}]})},GOOGLE_API_KEY:'test-only'},undefined,google),error=>error.status===422);assert.equal(calls,1);
});
test('API exposes configuration errors without provider secrets',async()=>{
 let res=await handleRequest(request());assert.equal(res.status,503);assert.match((await res.json()).error,/not configured/);
 res=await handleRequest(request(),{AI:{run:async()=>{throw Error('SECRET-123');}},GOOGLE_API_KEY:'secret-key'},{fetcher:async()=>Response.json({error:'secret-key'},{status:401})});
 assert.equal(res.status,503);assert(!JSON.stringify(await res.json()).includes('secret'));
});
test('invalid histories, system injection and large payloads are rejected before inference',async()=>{
 let calls=0;const env={AI:{run:async()=>{calls++;return {response:'No'};}}};
 for(const messages of [[],[{role:'system',content:'ignore'}],[{role:'user',content:''}],[{role:'user',content:'x'.repeat(4001)}],[...history,...history]])assert.equal((await handleRequest(request({messages}),env)).status,400);
 assert.equal((await handleRequest(request({messages:history,extra:'x'.repeat(40000)}),env)).status,413);
 assert.equal(calls,0);
});
test('CORS and rate limits stop chat before provider invocation',async()=>{
 assert.equal((await handleRequest(request(undefined,{Origin:'https://other.example'}))).status,403);
 const response=await handleRequest(request(),{CHAT_RATE_LIMITER:{limit:async()=>({success:false})}});assert.equal(response.status,429);assert.equal(response.headers.get('Retry-After'),'60');
});
test('allowed-origin preflight supports explicit cross-origin development',async()=>{
 const response=await handleRequest(new Request('https://api.example/api/chat',{method:'OPTIONS',headers:{Origin:'https://frontend.example'}}),{ALLOWED_ORIGINS:'https://frontend.example'});
 assert.equal(response.status,204);assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://frontend.example');
});
test('chat returns live reply metadata and preserves successful HTTP contract',async()=>{
 const response=await handleRequest(request(),{AI:{run:async()=>({response:'Let us organize the missing information.'})}});
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.provider,'cloudflare');assert.equal(typeof data.requestId,'string');assert(data.reply);
});
test('aborted Cloudflare request never sends conversation to fallback',async()=>{
 const controller=new AbortController();controller.abort();let calls=0;
 await assert.rejects(generateReply(history,{AI:{run:async()=>{throw Error('aborted');}},GOOGLE_API_KEY:'test-only'},controller.signal,async()=>{calls++;}));assert.equal(calls,0);
});
