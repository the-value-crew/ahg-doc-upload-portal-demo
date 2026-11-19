import { Env } from '../types'
import { requireAdminAuth } from '../middleware/auth'

export async function handleAdminGetConfig(request: Request, env: Env): Promise<Response> {
  const auth = await requireAdminAuth(request, env)
  if (auth instanceof Response) return auth

  try {
    const rows = await env.DB.prepare('SELECT key, value FROM app_config').all<{
      key: string
      value: string
    }>()

    const config: Record<string, any> = {}
    for (const row of rows.results || []) {
      try {
        config[row.key] = JSON.parse(row.value)
      } catch {
        config[row.key] = row.value
      }
    }

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to read config', details: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function handleAdminSaveConfig(request: Request, env: Env): Promise<Response> {
  const auth = await requireAdminAuth(request, env)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json<Record<string, any>>()
    const statements = []

    for (const [key, value] of Object.entries(body)) {
      const valStr = typeof value === 'string' ? value : JSON.stringify(value)
      statements.push(
        env.DB.prepare('INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)').bind(key, valStr)
      )
    }

    if (statements.length > 0) {
      await env.DB.batch(statements)
    }

    return new Response(JSON.stringify({ success: true, updatedKeys: Object.keys(body) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to save config', details: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
