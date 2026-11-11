import { Env } from '../types'
import { buildPortalPayload } from '../lib/portalPayload'
import { generateSyncToken } from '../lib/syncToken'

export async function handlePortalConfig(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const merchantId = (url.searchParams.get('merchant') || '').trim()

  if (!merchantId) {
    return new Response(JSON.stringify({ error: 'Missing merchant identifier parameter' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Validate format (GHL opportunity ID: 20 alphanumeric chars)
  const isValidFormat = /^[a-zA-Z0-9]{20}$/.test(merchantId)
  if (!isValidFormat) {
    return new Response(JSON.stringify({ error: 'Invalid merchant identifier format' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // 1. Check if merchant exists in D1
    const payload = await buildPortalPayload(env, merchantId)

    if (payload) {
      // Found in database - return full portal payload
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      })
    }

    // 2. Not found in database - generate short-lived signed sync token
    const salt = env.SYNC_TOKEN_SALT || env.DOWNLOAD_SIGNING_SECRET || 'dev-sync-token-salt'
    const syncToken = await generateSyncToken(merchantId, salt)

    return new Response(
      JSON.stringify({
        found: false,
        syncToken,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (err: any) {
    console.error('handlePortalConfig error:', err)
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
