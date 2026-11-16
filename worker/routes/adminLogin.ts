import { Env } from '../types'
import { verifyPassword, signJwt } from '../lib/crypto'

export const TRUSTED_EMBED_ORIGINS = new Set(['https://ahg-onboarding-hub.ahg-hub.workers.dev'])

export function normalizeOrigin(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
    return parsed.origin
  } catch {
    return trimmed.replace(/\/+$/, '') || null
  }
}

export function isTrustedEmbedRequest(request: Request, hostOrigin?: unknown): boolean {
  const candidates = [
    typeof hostOrigin === 'string' ? hostOrigin : null,
    request.headers.get('Referer'),
    request.headers.get('Origin'),
  ]
  return candidates.some((candidate) => {
    const normalized = normalizeOrigin(candidate)
    return normalized !== null && TRUSTED_EMBED_ORIGINS.has(normalized)
  })
}

export async function issueAdminToken(env: Env): Promise<{ token: string; expiresIn: number }> {
  const secret = env.JWT_SECRET || 'dev-secret-key-fallback'
  const expiresIn = 8 * 3600 // 8 hours
  const exp = Math.floor(Date.now() / 1000) + expiresIn
  const token = await signJwt({ sub: 'admin', role: 'administrator', exp }, secret)
  return { token, expiresIn }
}

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

  if (isTrustedEmbedRequest(request, body?.hostOrigin)) {
    const { token, expiresIn } = await issueAdminToken(env)
    return new Response(JSON.stringify({ token, expiresIn }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
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

  const { token, expiresIn } = await issueAdminToken(env)

  return new Response(JSON.stringify({ token, expiresIn }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

