import { Env } from '../types'
import { buildPortalPayload } from '../lib/portalPayload'
import { generateSyncToken } from '../lib/syncToken'
import { isValidMerchantId, syncMerchantFromGhl, syncMerchantStatusFromGhl } from '../lib/ghl'

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
  if (!isValidMerchantId(merchantId)) {
    return new Response(JSON.stringify({ error: 'Invalid merchant identifier format' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // 1. Check if merchant exists in D1
    let payload = await buildPortalPayload(env, merchantId)

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

    // 2. Not found in D1 -> automatically sync from GHL if configured
    if (env.GHL_PRIVATE_TOKEN) {
      const syncRes = await syncMerchantFromGhl(env, merchantId)
      if (syncRes.ok) {
        payload = await buildPortalPayload(env, merchantId)
        if (payload) {
          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
            },
          })
        }
      } else if (syncRes.status === 404) {
        return new Response(
          JSON.stringify({
            error: syncRes.error,
            code: syncRes.code,
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
            },
          }
        )
      }
    }

    // 3. Fallback: generate short-lived signed sync token for 2-step flow
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

/**
 * POST /api/merchants/:id/sync-status
 * Lightweight background check to sync only the merchant's underwriting stage from HighLevel.
 */
export async function handleSyncMerchantStatus(
  _request: Request,
  env: Env,
  merchantId: string
): Promise<Response> {
  try {
    const res = await syncMerchantStatusFromGhl(env, merchantId)
    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: res.error }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      })
    }

    return new Response(
      JSON.stringify({ ok: true, status: res.status, updated: res.updated }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      }
    )
  } catch (err: any) {
    console.error('handleSyncMerchantStatus error:', err)
    return new Response(JSON.stringify({ ok: false, error: err?.message || 'Status sync failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
