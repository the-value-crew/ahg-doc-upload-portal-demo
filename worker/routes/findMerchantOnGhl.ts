import { Env } from '../types'
import { verifySyncToken } from '../lib/syncToken'
import { buildPortalPayload } from '../lib/portalPayload'
import { ensureMerchantExists, isValidMerchantId } from '../lib/ghl'

export async function handleFindMerchantOnGhl(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const merchantId = (body?.merchant || '').trim()
  const syncToken = (body?.syncToken || '').trim()

  if (!merchantId || !syncToken) {
    return new Response(JSON.stringify({ error: 'Missing merchant identifier or syncToken' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Format check
  if (!isValidMerchantId(merchantId)) {
    return new Response(JSON.stringify({ error: 'Invalid merchant identifier format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Verify HMAC sync token
  const salt = env.SYNC_TOKEN_SALT || env.DOWNLOAD_SIGNING_SECRET || 'dev-sync-token-salt'
  const isValid = await verifySyncToken(syncToken, merchantId, salt)
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid or expired sync token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Ensure merchant exists in D1 or fetch & sync from HighLevel
    const ensured = await ensureMerchantExists(env, merchantId)
    if (!ensured.ok) {
      return new Response(
        JSON.stringify({
          error: ensured.error,
          code: ensured.code,
        }),
        {
          status: ensured.status,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Return complete portal payload
    const payload = await buildPortalPayload(env, merchantId)
    if (!payload) {
      throw new Error('Failed to load portal configuration after merchant creation')
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    console.error('handleFindMerchantOnGhl unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

