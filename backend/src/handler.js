import { previews } from './previews.js';
export async function handleRequest(request, env = {}) {
  const {pathname} = new URL(request.url);
  const headers = {'Cache-Control':'no-store'};
  const json = (data,status=200) => Response.json(data,{status,headers});
  if (!pathname.startsWith('/api/') && env.ASSETS) return env.ASSETS.fetch(request);
  if (request.method !== 'GET') return Response.json({error:'Method not allowed'},{status:405,headers:{...headers,Allow:'GET'}});
  if (pathname === '/api/health') return json({status:'ok',service:'ijwi-api',capabilities:{preview:true,gemma:false,screening:false}});
  const match = pathname.match(/^\/api\/preview\/(case|conversation|summary)$/);
  if (match) return json({...previews[match[1]],mode:'sample'});
  return json({error:'Not found'},404);
}
export default {fetch:handleRequest};
