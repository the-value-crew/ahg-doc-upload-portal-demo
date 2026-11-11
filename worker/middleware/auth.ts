import { Env } from '../types'
import { verifyJwt } from '../lib/crypto'

export interface AuthContext {
  sub: string
  role?: string
}

export async function requireAdminAuth(request: Request, env: Env): Promise<Response | AuthContext> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing or malformed Authorization header' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer error="invalid_token"',
      },
    })
  }

  const token = authHeader.substring(7).trim()
  const secret = env.JWT_SECRET || 'dev-secret-key-fallback'
  const payload = await verifyJwt(token, secret)

  if (!payload) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer error="invalid_token"',
      },
    })
  }

  return { sub: payload.sub, role: payload.role }
}

