// Cloudflare Pages Function — a read-only feed proxy for the Podcast app.
// Podcast feed XML is often served without CORS headers, so the browser can't
// fetch it directly. This runs on Cloudflare's edge (server-side, no CORS),
// fetches the requested feed, and returns it same-origin to the app.
//
// Deploys automatically with the Pages GitHub build (no wrangler/tokens). It is
// deliberately narrow: GET only, http(s) only, read-only (never forwards the
// caller's body/headers), short-cached. Not an open browsing proxy.
export async function onRequest(context) {
  const { request } = context
  const target = new URL(request.url).searchParams.get('url')

  if (!target) return new Response('missing ?url', { status: 400 })
  let u
  try {
    u = new URL(target)
  } catch {
    return new Response('bad url', { status: 400 })
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return new Response('unsupported protocol', { status: 400 })
  }

  try {
    const upstream = await fetch(u.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; HandMeDownPodcatcher/1.0)',
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    })
    const body = await upstream.arrayBuffer()
    return new Response(body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/xml; charset=utf-8',
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=900',
      },
    })
  } catch {
    return new Response('upstream fetch failed', { status: 502 })
  }
}
