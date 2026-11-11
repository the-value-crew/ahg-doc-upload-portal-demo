import { Env } from '../types'
import { verifyPassword, signJwt } from '../lib/crypto'

export async function handleAdminLogin(request: Request, env: Env): Promise<Response> {
  let body: any
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { password } = body || {}
  if (!password || typeof password !== 'string') {
    return new Response(JSON.stringify({ error: 'Password is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const adminPasswordRow = await env.DB.prepare(
    "SELECT value FROM app_config WHERE key = 'admin_password'"
  ).first<{ value: string }>()

  if (!adminPasswordRow) {
    return new Response(JSON.stringify({ error: 'Admin authentication is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const valid = await verifyPassword(password, adminPasswordRow.value)
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const secret = env.JWT_SECRET || 'dev-secret-key-fallback'
  const exp = Math.floor(Date.now() / 1000) + 8 * 3600 // 8 hours
  const token = await signJwt({ sub: 'admin', role: 'administrator', exp }, secret)

  return new Response(JSON.stringify({ token, expiresIn: 8 * 3600 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

