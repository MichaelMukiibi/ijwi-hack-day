import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { handleRequest } from './handler.js';
const envFile=fileURLToPath(new URL('../.env',import.meta.url));
if(existsSync(envFile))process.loadEnvFile(envFile);
const port=Number(process.env.PORT||8787);
// Only the Node development adapter adds local Vite origins; the deployed Worker remains strict.
const developmentEnv={...process.env,ALLOWED_ORIGINS:[process.env.ALLOWED_ORIGINS,'http://127.0.0.1:5173','http://localhost:5173'].filter(Boolean).join(',')};
createServer(async(req,res)=>{
 const abort=new AbortController();res.on('close',()=>{if(!res.writableEnded)abort.abort();});
 try{
  const headers=new Headers();for(const [key,value]of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
  const options={method:req.method,headers,signal:abort.signal};
  if(!['GET','HEAD'].includes(req.method)){options.body=req;options.duplex='half';}
  const request=new Request(`http://127.0.0.1:${port}${req.url}`,options);
  const response=await handleRequest(request,developmentEnv);
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
 }catch{res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Internal server error'}));}
}).listen(port,'127.0.0.1',()=>console.log(`Ijwi backend: http://127.0.0.1:${port}`));
