import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleRequest} from '../src/handler.js';
const request = (path,method='GET') => handleRequest(new Request(`http://localhost${path}`,{method}));
test('health reports only implemented capabilities',async()=>{
 const res=await request('/api/health');assert.equal(res.status,200);
 const data=await res.json();assert.equal(data.status,'ok');
 assert.deepEqual(data.capabilities,{preview:true,gemma:false,screening:false});
});
test('every preview satisfies the frontend contract and is labeled sample',async()=>{
 for (const tab of ['case','conversation','summary']) {
  const res=await request(`/api/preview/${tab}`);assert.equal(res.status,200);
  const data=await res.json();assert.equal(data.mode,'sample');
  for(const key of ['title','description','eyebrow','note']) assert.equal(typeof data[key],'string');
  assert(Array.isArray(data.rows));assert(Array.isArray(data.messages));
  for(const row of data.rows){assert.equal(typeof row.label,'string');assert.equal(typeof row.value,'string');}
  for(const message of data.messages){assert(['user','assistant'].includes(message.role));assert.equal(typeof message.text,'string');}
 }
});
test('unknown endpoints and methods fail explicitly',async()=>{
 assert.equal((await request('/api/preview/unknown')).status,404);
 const res=await request('/api/health','POST');assert.equal(res.status,405);assert.equal(res.headers.get('Allow'),'GET');
});

test('combined Worker delegates frontend requests to assets and keeps API responses separate',async()=>{
 const env={ASSETS:{fetch:async()=>new Response('frontend asset')}};
 assert.equal(await (await handleRequest(new Request('http://localhost/'),env)).text(),'frontend asset');
 const api=await handleRequest(new Request('http://localhost/api/health'),env);
 assert.equal((await api.json()).service,'ijwi-api');
});
