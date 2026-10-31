import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
let vite, worker;
before(async()=>{vite=await createServer({server:{middlewareMode:true},appType:'custom'});worker=(await vite.ssrLoadModule('/worker.ts')).default;});
after(async()=>{await vite?.close();});
test('same-origin browser chat is forwarded internally without the browser Origin',async()=>{
 const request=new Request('https://ijwi.example/api/chat',{method:'POST',headers:{Origin:'https://ijwi.example','Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'Hello'}]})});
 const response=await worker.fetch(request,{BACKEND:{fetch:async forwarded=>{assert.equal(forwarded.headers.get('Origin'),null);assert.equal(forwarded.headers.get('Content-Type'),'application/json');assert.equal(forwarded.method,'POST');assert.equal((await forwarded.json()).messages[0].content,'Hello');return Response.json({reply:'Connected'});}}});
 assert.equal(response.status,200);assert.equal((await response.json()).reply,'Connected');
});
test('foreign origins are rejected before the service binding is called',async()=>{
 let called=false;const response=await worker.fetch(new Request('https://ijwi.example/api/chat',{method:'POST',headers:{Origin:'https://unrelated.example'}}),{BACKEND:{fetch:async()=>{called=true;return new Response();}}});
 assert.equal(response.status,403);assert.equal(called,false);
});
test('service failure is still a readable 503 response',async()=>{
 const response=await worker.fetch(new Request('https://ijwi.example/api/health'),{BACKEND:{fetch:async()=>{throw Error('offline');}}});assert.equal(response.status,503);
});
