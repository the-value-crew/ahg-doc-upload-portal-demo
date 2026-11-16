import { Env } from '../types'
import { isTrustedEmbedRequest, issueAdminToken } from '../routes/adminLogin'

/**
 * Intercepts /admin* requests and serves index.html with Content-Security-Policy: frame-ancestors
 */
export async function handleAdminShell(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  // Fetch SPA index.html via the ASSETS binding without forwarding conditional cache headers
  const assetReq = new Request(`${url.origin}/index.html`, {
    method: 'GET',
  })
  let assetRes = await env.ASSETS.fetch(assetReq)

  // Follow redirect if ASSETS redirects /index.html -> /
  if (assetRes.status >= 300 && assetRes.status < 400) {
    const redirectLocation = assetRes.headers.get('Location')
    if (redirectLocation) {
      const targetUrl = new URL(redirectLocation, url.origin)
      assetRes = await env.ASSETS.fetch(new Request(targetUrl, {
        method: 'GET',
      }))
    }
  }

  const headers = new Headers(assetRes.headers)
  headers.set('Content-Security-Policy', 'frame-ancestors *;')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  headers.delete('X-Frame-Options') // Avoid conflicting with frame-ancestors

  if (isTrustedEmbedRequest(request)) {
    const { token } = await issueAdminToken(env)
    const html = await assetRes.text()
    const tokenScript = `<script>window.__AHG_ADMIN_TOKEN__=${JSON.stringify(token)};</script>`
    const injectedHtml = html.includes('</head>')
      ? html.replace('</head>', `${tokenScript}</head>`)
      : `${tokenScript}${html}`

    headers.delete('Content-Length')
    headers.delete('Content-Encoding')
    headers.delete('ETag')
    headers.set('Content-Type', 'text/html; charset=utf-8')

    return new Response(injectedHtml, {
      status: 200,
      headers,
    })
  }

  return new Response(assetRes.body, {
    status: 200,
    headers,
  })
}
