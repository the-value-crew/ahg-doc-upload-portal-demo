import { Env } from '../types'
import { verifySyncToken } from '../lib/syncToken'
import { buildPortalPayload } from '../lib/portalPayload'
import { fetchGhlOpportunity, parseOpportunity } from '../lib/ghl'

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
  if (!/^[a-zA-Z0-9]{20}$/.test(merchantId)) {
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
    // 1. Race condition / idempotency check in D1
    const existing = await buildPortalPayload(env, merchantId)
    if (existing) {
      return new Response(JSON.stringify(existing), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      })
    }

    // 2. Check if HighLevel integration is enabled
    if (!env.GHL_PRIVATE_TOKEN) {
      return new Response(
        JSON.stringify({
          error: 'HighLevel API token is not configured on server',
          code: 'GHL_NOT_CONFIGURED',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 3. Fetch opportunity from HighLevel
    let opp: any
    try {
      opp = await fetchGhlOpportunity(env, merchantId)
    } catch (fetchErr: any) {
      console.error('HighLevel fetch error:', fetchErr)
      return new Response(
        JSON.stringify({
          error: fetchErr.message || 'Error communicating with HighLevel API',
          code: 'GHL_FETCH_ERROR',
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (!opp) {
      return new Response(
        JSON.stringify({
          error: 'Merchant opportunity not found on HighLevel',
          code: 'MERCHANT_NOT_FOUND_ON_GHL',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 4. Load mappings from app_config
    const configRows = await env.DB.prepare(
      "SELECT key, value FROM app_config WHERE key IN ('ghl_field_map', 'merchant_stages', 'ghl_industry_map', 'processors')"
    ).all<{ key: string; value: string }>()

    const configs: Record<string, any> = {}
    for (const row of configRows.results || []) {
      try {
        configs[row.key] = JSON.parse(row.value)
      } catch {
        configs[row.key] = row.value
      }
    }

    const fieldMap = configs.ghl_field_map || {
      industry_type: { id: 'iT881KYvOCWyTSXzqFEe', fieldKey: 'opportunity.industry_type' },
      processor: { id: 'hhQbzTtgTFsFT1ngiHCt', fieldKey: 'opportunity.processor' },
    }
    const stages = configs.merchant_stages || []
    const industryMap = configs.ghl_industry_map || {}
    const processors = configs.processors || []

    // 5. Parse opportunity to merchant model
    let parsed
    try {
      parsed = parseOpportunity(opp, fieldMap, stages, industryMap, processors)
    } catch (parseErr: any) {
      return new Response(
        JSON.stringify({
          error: parseErr.message || 'Validation error while parsing HighLevel opportunity',
          code: 'GHL_PARSE_VALIDATION_ERROR',
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 6. Insert into merchants table
    await env.DB.prepare(
      `INSERT INTO merchants (id, name, industry, status, processor, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         industry = excluded.industry,
         status = excluded.status,
         processor = excluded.processor,
         updated_at = datetime('now')`
    )
      .bind(merchantId, parsed.name, parsed.industry, parsed.status, parsed.processor)
      .run()

    // 7. Return complete portal payload
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

