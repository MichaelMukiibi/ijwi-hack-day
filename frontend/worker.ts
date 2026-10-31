interface Env { ASSETS: {fetch(request: Request): Promise<Response>}; BACKEND: {fetch(request: Request): Promise<Response>} }
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname.startsWith('/api/')) {
      try {return await env.BACKEND.fetch(request);}
      catch {return Response.json({error:'The Ijwi backend is unavailable. Please try again.'},{status:503,headers:{'Cache-Control':'no-store'}});}
    }
    return env.ASSETS.fetch(request);
  },
};
