interface Env { ASSETS: {fetch(request: Request): Promise<Response>}; BACKEND: {fetch(request: Request): Promise<Response>} }
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname.startsWith('/api/')) {
      const origin = request.headers.get('Origin');
      if (origin && origin !== new URL(request.url).origin) {
        return Response.json({error:'Origin not allowed'},{status:403,headers:{'Cache-Control':'no-store'}});
      }
      // Browser origin is checked at this public boundary. Internal service requests
      // must not compare the frontend Origin with the backend Worker's address.
      const internalRequest = new Request(request);
      internalRequest.headers.delete('Origin');
      try {return await env.BACKEND.fetch(internalRequest);}
      catch {return Response.json({error:'The Ijwi backend is unavailable. Please try again.'},{status:503,headers:{'Cache-Control':'no-store'}});}
    }
    return env.ASSETS.fetch(request);
  },
};
