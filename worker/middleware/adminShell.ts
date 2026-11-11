import { Env } from '../types'

/**
 * Intercepts /admin* requests and serves index.html with Content-Security-Policy: frame-ancestors
 */
export async function handleAdminShell(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  // Fetch SPA index.html via the ASSETS binding - use exact path
  const assetReq = new Request(`${url.origin}/index.html`, {
    headers: request.headers,
    method: 'GET',
  })
  let assetRes = await env.ASSETS.fetch(assetReq)

  // Follow redirect if ASSETS redirects /index.html -> /
  if (assetRes.status >= 300 && assetRes.status < 400) {
    const redirectLocation = assetRes.headers.get('Location')
    if (redirectLocation) {
      const targetUrl = new URL(redirectLocation, url.origin)
      assetRes = await env.ASSETS.fetch(new Request(targetUrl, {
        headers: request.headers,
        method: 'GET',
      }))
    }
  }

  // Parse allowed parent origins
  const rawOrigins = env.ALLOWED_PARENT_ORIGINS || ''
  const parsedOrigins = rawOrigins
    .split(/\s+/)
    .map((o) => o.trim())
    .filter((o) => {
      try {
        const u = new URL(o)
        return (u.protocol === 'https:' || u.protocol === 'http:') && !o.includes('*')
      } catch {
        return false
      }
    })
    .join(' ')

  const frameAncestorsDirective = parsedOrigins
    ? `frame-ancestors 'self' ${parsedOrigins};`
    : `frame-ancestors 'self';`

  const headers = new Headers(assetRes.headers)
  headers.set('Content-Security-Policy', frameAncestorsDirective)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  headers.delete('X-Frame-Options') // Avoid conflicting with frame-ancestors

  return new Response(assetRes.body, {
    status: 200,
    headers,
  })
}
