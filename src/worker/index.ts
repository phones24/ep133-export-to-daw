export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // const url = new URL(request.url);

    // if (url.pathname.startsWith('/api/')) {
    //   console.log(url);
    //   return new Response(JSON.stringify({ name: 'Cloudflare' }), {
    //     headers: { 'Content-Type': 'application/json' },
    //   });
    // }

    return env.ASSETS.fetch(request);
  },
};
