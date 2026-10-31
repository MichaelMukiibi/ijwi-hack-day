import { createServer } from 'node:http';
import { handleRequest } from './handler.js';
const port = Number(process.env.PORT || 8787);
createServer(async (req,res)=>{
  try {
    const response=await handleRequest(new Request(`http://127.0.0.1:${port}${req.url}`,{method:req.method}));
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(await response.text());
  } catch {res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Internal server error'}));}
}).listen(port,'127.0.0.1',()=>console.log(`Ijwi backend: http://127.0.0.1:${port}`));
