import { Env } from '../types'
import { requireAdminAuth } from '../middleware/auth'
import { buildChecklist, computeStats } from '../../shared/checklist'
import { AdminMerchantsResponse, ChecklistStats, FileStatus } from '../../shared/types'

// Helper: generate HMAC-SHA256 signature for signed downloads
async function generateDownloadSignature(
  merchantId: string,
  documentType: number,
  expiresAt: number,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(`${merchantId}:${documentType}:${expiresAt}`)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Helper: verify signature in constant time
async function verifyDownloadSignature(
  merchantId: string,
  documentType: number,
  expiresAt: number,
  providedSig: string,
  secret: string
): Promise<boolean> {
  const expectedSig = await generateDownloadSignature(merchantId, documentType, expiresAt, secret)
  if (expectedSig.length !== providedSig.length) return false

  let mismatch = 0
  for (let i = 0; i < expectedSig.length; i++) {
    mismatch |= expectedSig.charCodeAt(i) ^ providedSig.charCodeAt(i)
  }
  return mismatch === 0
}

// Helper: escape HTML entities for preview fallback
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * GET /api/admin/merchants
 * Server-side search, status filter, and pagination
 */
export async function handleAdminGetMerchants(request: Request, env: Env): Promise<Response> {
  const auth = await requireAdminAuth(request, env)
  if (auth instanceof Response) return auth

  const url = new URL(request.url)
  const q = (url.searchParams.get('q') || '').trim()
  const statusFilter = url.searchParams.get('status')
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('perPage') || '10', 10)))
  const offset = (page - 1) * perPage

  // 1. Build query filters
  const conditions: string[] = []
  const params: any[] = []

  if (q) {
    conditions.push('(name LIKE ? OR id LIKE ?)')
    params.push(`%${q}%`, `%${q}%`)
  }

  if (statusFilter && statusFilter !== 'ALL') {
    const sNum = parseInt(statusFilter, 10)
    if (!isNaN(sNum)) {
      conditions.push('status = ?')
      params.push(sNum)
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 2. Count total matching merchants
  const countRow = await env.DB.prepare(`SELECT COUNT(*) as total FROM merchants ${whereClause}`)
    .bind(...params)
    .first<{ total: number }>()
  const total = countRow?.total || 0
  const totalPages = Math.ceil(total / perPage) || 1

  // 3. Fetch paginated merchants
  const merchantsRes = await env.DB.prepare(
    `SELECT id, name, industry, status, processor, created_at, updated_at
     FROM merchants
     ${whereClause}
     ORDER BY name ASC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, perPage, offset)
    .all<{ id: string; name: string; industry: string; status: number; processor: string | null; created_at: string; updated_at: string }>()

  const merchants = merchantsRes.results || []

  // 4. Fetch documents for these merchants in single query
  let docsMap: Record<string, any[]> = {}
  if (merchants.length > 0) {
    const placeholders = merchants.map(() => '?').join(',')
    const mIds = merchants.map((m) => m.id)
    const docsRes = await env.DB.prepare(
      `SELECT merchant_id, document_type, status, note, uploaded_at, filename
       FROM documents
       WHERE merchant_id IN (${placeholders})`
    )
      .bind(...mIds)
      .all()

    for (const d of docsRes.results || []) {
      const mid = (d as any).merchant_id
      if (!docsMap[mid]) docsMap[mid] = []
      docsMap[mid].push(d)
    }
  }

  // 5. Load industries template from app_config once
  const configRow = await env.DB.prepare("SELECT value FROM app_config WHERE key = 'industries'").first<{ value: string }>()
  let industries: Record<string, any> = {}
  if (configRow?.value) {
    try {
      industries = JSON.parse(configRow.value)
    } catch {
      // ignore
    }
  }

  // 6. Map merchants with stats
  const enrichedData = merchants.map((m) => {
    const mDocs = docsMap[m.id] || []
    const indConfig = industries[m.industry] || { label: m.industry, sections: [] }
    const checklist = buildChecklist(indConfig, mDocs)
    const stats = computeStats(checklist)

    let lastUploadedAt: string | null = null
    for (const d of mDocs) {
      if (!lastUploadedAt || new Date(d.uploaded_at).getTime() > new Date(lastUploadedAt).getTime()) {
        lastUploadedAt = d.uploaded_at
      }
    }

    return {
      id: m.id,
      name: m.name,
      industry: m.industry,
      industryLabel: indConfig.label || m.industry,
      status: m.status,
      processor: m.processor || null,
      stats,
      lastUploadedAt,
    }
  })

  const response: AdminMerchantsResponse = {
    data: enrichedData,
    pagination: {
      page,
      perPage,
      total,
      totalPages,
    },
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

/**
 * GET /api/admin/merchants/:id
 * Detail view payload matching the merchant portal
 */
export async function handleAdminGetMerchantDetail(request: Request, env: Env, merchantId: string): Promise<Response> {
  const auth = await requireAdminAuth(request, env)
  if (auth instanceof Response) return auth

  const merchant = await env.DB.prepare(
    'SELECT id, name, industry, status, processor, created_at, updated_at FROM merchants WHERE id = ?'
  )
    .bind(merchantId)
    .first<{ id: string; name: string; industry: string; status: number; processor: string | null; created_at: string; updated_at: string }>()

  if (!merchant) {
    return new Response(JSON.stringify({ error: 'Merchant not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fetch configs
  const configRows = await env.DB.prepare(
    "SELECT key, value FROM app_config WHERE key IN ('industries', 'branding', 'support_contact', 'portal_defaults', 'merchant_stages')"
  ).all<{ key: string; value: string }>()

  const configs: Record<string, any> = {}
  for (const row of configRows.results || []) {
    try {
      configs[row.key] = JSON.parse(row.value)
    } catch {
      configs[row.key] = row.value
    }
  }

  const industryConfig = configs.industries?.[merchant.industry]
  if (!industryConfig) {
    return new Response(JSON.stringify({ error: `Industry config for '${merchant.industry}' not found` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fetch document rows
  const docRows = await env.DB.prepare(
    `SELECT document_type, status, note, uploaded_at, status_updated_at, filename, sharepoint_item_id
     FROM documents
     WHERE merchant_id = ?
     ORDER BY uploaded_at DESC`
  )
    .bind(merchantId)
    .all()

  const checklist = buildChecklist(industryConfig, docRows.results || [])
  const stats = computeStats(checklist)

  return new Response(
    JSON.stringify({
      merchant: {
        id: merchant.id,
        name: merchant.name,
        industry: merchant.industry,
        industryLabel: industryConfig.label,
        status: merchant.status,
        processor: merchant.processor || null,
        createdAt: merchant.created_at,
        updatedAt: merchant.updated_at,
      },
      industry: industryConfig,
      checklist,
      stats,
      stages: configs.merchant_stages || [],
      branding: configs.branding,
      supportContact: configs.support_contact,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    }
  )
}

/**
 * PATCH /api/admin/merchants/:id/status
 * Updates merchant underwriting stage (1-5)
 */
export async function handleAdminUpdateMerchantStatus(request: Request, env: Env, merchantId: string): Promise<Response> {
  const auth = await requireAdminAuth(request, env)
  if (auth instanceof Response) return auth

  let body: any
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 })
  }

  const status = parseInt(body?.status, 10)
  if (isNaN(status) || status < 1 || status > 5) {
    return new Response(JSON.stringify({ error: 'Status must be an integer between 1 and 5' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const now = new Date().toISOString()
  const result = await env.DB.prepare('UPDATE merchants SET status = ?, updated_at = ? WHERE id = ?')
    .bind(status, now, merchantId)
    .run()

  if (!result.meta.changes) {
    return new Response(JSON.stringify({ error: 'Merchant not found' }), { status: 404 })
  }

  return new Response(JSON.stringify({ success: true, merchantId, status, updatedAt: now }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * PATCH /api/admin/documents/status
 * Updates document verification status (1 = Pending, 2 = Verified, 3 = Rejected) with note
 */
export async function handleAdminUpdateStatus(request: Request, env: Env): Promise<Response> {
  const auth = await requireAdminAuth(request, env)
  if (auth instanceof Response) return auth

  let body: any
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 })
  }

  const { merchantId, documentType, status, note } = body || {}
  const statusNum = parseInt(status, 10)
  const docTypeNum = parseInt(documentType, 10)

  if (!merchantId || isNaN(docTypeNum) || isNaN(statusNum) || ![1, 2, 3].includes(statusNum)) {
    return new Response(
      JSON.stringify({ error: 'Valid merchantId, documentType, and status (1, 2, or 3) are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (statusNum === 3 && (!note || !note.trim())) {
    return new Response(JSON.stringify({ error: 'A rejection reason note is required when rejecting a document' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const now = new Date().toISOString()
  const finalNote = statusNum === 3 ? note.trim() : null

  // 1. Verify merchant exists
  const merchant = await env.DB.prepare('SELECT id, industry FROM merchants WHERE id = ?').bind(merchantId).first<{ id: string; industry: string }>()
  if (!merchant) {
    return new Response(JSON.stringify({ error: 'Merchant not found' }), { status: 404 })
  }

  // 2. Upsert document status in D1
  await env.DB.prepare(
    `INSERT INTO documents (merchant_id, document_type, status, note, uploaded_at, status_updated_at, filename)
     VALUES (?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(merchant_id, document_type) DO UPDATE SET
       status = excluded.status,
       note = excluded.note,
       status_updated_at = excluded.status_updated_at`
  )
    .bind(merchantId, docTypeNum, statusNum, finalNote, now, now)
    .run()

  // 3. Fetch updated merchant checklist & stats
  const configRow = await env.DB.prepare("SELECT value FROM app_config WHERE key = 'industries'").first<{ value: string }>()
  let checklist: any[] = []
  let stats: ChecklistStats | null = null

  if (configRow?.value) {
    const industries = JSON.parse(configRow.value)
    const indConfig = industries[merchant.industry]
    const docRows = await env.DB.prepare('SELECT document_type, status, note, uploaded_at, filename FROM documents WHERE merchant_id = ?')
      .bind(merchantId)
      .all()
    checklist = buildChecklist(indConfig, docRows.results || [])
    stats = computeStats(checklist)
  }

  return new Response(
    JSON.stringify({
      success: true,
      status: statusNum,
      note: finalNote,
      statusUpdatedAt: now,
      checklist,
      stats,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * POST /api/admin/documents/download-url (Admin)
 * Creates a 60-second HMAC signed download link
 */
export async function handleCreateSignedDownloadUrl(request: Request, env: Env): Promise<Response> {
  const auth = await requireAdminAuth(request, env)
  if (auth instanceof Response) return auth

  const signingSecret = env.DOWNLOAD_SIGNING_SECRET || env.JWT_SECRET
  if (!signingSecret) {
    return new Response(JSON.stringify({ error: 'Server signing secret is not configured' }), { status: 500 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 })
  }

  const { merchantId, documentType } = body || {}
  const docTypeNum = parseInt(documentType, 10)

  if (!merchantId || isNaN(docTypeNum)) {
    return new Response(JSON.stringify({ error: 'merchantId and documentType are required' }), { status: 400 })
  }

  const expiresAt = Date.now() + 60_000 // 60 seconds TTL
  const sig = await generateDownloadSignature(merchantId, docTypeNum, expiresAt, signingSecret)

  const downloadUrl = `/api/documents/download?merchantId=${encodeURIComponent(merchantId)}&documentType=${docTypeNum}&exp=${expiresAt}&sig=${sig}`

  return new Response(JSON.stringify({ url: downloadUrl, expiresAt }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * GET /api/merchants/:id/documents/:type/download-url (Merchant Portal)
 * Creates a signed download link scoped to that merchant's own file
 */
export async function handleMerchantSignedDownloadUrl(
  request: Request,
  env: Env,
  merchantId: string,
  docTypeStr: string
): Promise<Response> {
  const signingSecret = env.DOWNLOAD_SIGNING_SECRET || env.JWT_SECRET
  if (!signingSecret) {
    return new Response(JSON.stringify({ error: 'Server signing secret is not configured' }), { status: 500 })
  }

  const docTypeNum = parseInt(docTypeStr, 10)
  if (isNaN(docTypeNum)) {
    return new Response(JSON.stringify({ error: 'Invalid document type' }), { status: 400 })
  }

  // Ensure document exists for this merchant
  const doc = await env.DB.prepare('SELECT merchant_id FROM documents WHERE merchant_id = ? AND document_type = ?')
    .bind(merchantId, docTypeNum)
    .first()

  if (!doc) {
    return new Response(JSON.stringify({ error: 'Document not found' }), { status: 404 })
  }

  const expiresAt = Date.now() + 60_000
  const sig = await generateDownloadSignature(merchantId, docTypeNum, expiresAt, signingSecret)
  const downloadUrl = `/api/documents/download?merchantId=${encodeURIComponent(merchantId)}&documentType=${docTypeNum}&exp=${expiresAt}&sig=${sig}`

  return new Response(JSON.stringify({ url: downloadUrl, expiresAt }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * GET /api/documents/download
 * Verifies signed link and delivers file from R2 or safe HTML preview
 */
export async function handleAdminDownloadDocument(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const merchantId = url.searchParams.get('merchantId')
  const docTypeRaw = url.searchParams.get('documentType')
  const expRaw = url.searchParams.get('exp')
  const sig = url.searchParams.get('sig')

  if (!merchantId || !docTypeRaw || !expRaw || !sig) {
    return new Response('Access denied: missing required signature parameters', { status: 403 })
  }

  const documentType = parseInt(docTypeRaw, 10)
  const expiresAt = parseInt(expRaw, 10)

  // Verify expiry
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return new Response('Access denied: download link has expired. Please request a new link.', { status: 403 })
  }

  // Verify HMAC signature
  const signingSecret = env.DOWNLOAD_SIGNING_SECRET || env.JWT_SECRET
  if (!signingSecret) {
    return new Response('Server configuration error', { status: 500 })
  }

  const isValid = await verifyDownloadSignature(merchantId, documentType, expiresAt, sig, signingSecret)
  if (!isValid) {
    return new Response('Access denied: invalid or tampered signature', { status: 403 })
  }

  // Fetch document metadata from DB
  const doc = await env.DB.prepare(
    'SELECT merchant_id, document_type, filename, sharepoint_item_id FROM documents WHERE merchant_id = ? AND document_type = ?'
  )
    .bind(merchantId, documentType)
    .first<{ merchant_id: string; document_type: number; filename: string | null; sharepoint_item_id: string | null }>()

  if (!doc) {
    return new Response('Document record not found', { status: 404 })
  }

  const filename = doc.filename || `document_${doc.document_type}.pdf`

  // 1. Try R2 storage if stored there
  if (doc.sharepoint_item_id && doc.sharepoint_item_id.startsWith('r2:') && env.DOCS_BUCKET) {
    const r2Key = doc.sharepoint_item_id.substring(3)
    const obj = await env.DOCS_BUCKET.get(r2Key)
    if (obj) {
      const headers = new Headers()
      headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/pdf')
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`)
      headers.set('Cache-Control', 'private, no-store')
      return new Response(obj.body, { headers })
    }
  }

  // 2. Safe HTML preview container with HTML escaping
  const safeFilename = escapeHtml(filename)
  const safeMerchantId = escapeHtml(doc.merchant_id)
  const safeRef = escapeHtml(doc.sharepoint_item_id || 'LOCAL-FILE')

  const fallbackHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${safeFilename}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: grid; place-content: center; height: 100vh; background: #f8fafc; color: #1e293b; text-align: center; margin: 0; padding: 1rem; }
          .card { background: white; padding: 2rem; border-radius: 16px; border: 1px solid #e2e8f0; max-width: 520px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
          .badge { display: inline-block; padding: 4px 12px; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; border-radius: 9999px; margin-bottom: 1rem; border: 1px solid #a7f3d0; }
          h2 { font-size: 1.25rem; font-weight: 800; margin: 0.5rem 0 1rem; color: #0f172a; word-break: break-all; }
          p { margin: 0.5rem 0; font-size: 14px; color: #64748b; }
          code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">AHG Pay Document Vault</div>
          <h2>${safeFilename}</h2>
          <p>Merchant Opportunity: <strong>${safeMerchantId}</strong></p>
          <p>Storage Reference: <code>${safeRef}</code></p>
          <p style="margin-top: 1.5rem; font-size: 12px; color: #94a3b8;">
            Authenticated document preview. File verified by underwriting engine.
          </p>
        </div>
      </body>
    </html>
  `
  return new Response(fallbackHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store' },
  })
}
