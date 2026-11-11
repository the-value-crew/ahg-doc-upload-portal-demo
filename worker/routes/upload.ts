import { Env } from '../types'
import { uploadToSharepoint } from '../lib/sharepoint'

export async function handleUpload(request: Request, env: Env): Promise<Response> {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Invalid form data: ' + err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const file = formData.get('file') as File | null
  const merchantId = (formData.get('merchantId') || formData.get('merchant')) as string | null
  const documentTypeRaw = formData.get('documentType') as string | null

  if (!file || !merchantId || !documentTypeRaw) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters: file, merchantId, and documentType' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const documentType = parseInt(documentTypeRaw, 10)
  if (isNaN(documentType)) {
    return new Response(JSON.stringify({ error: 'documentType must be an integer' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 1. Verify merchant exists
  const merchant = await env.DB.prepare('SELECT id, name, industry FROM merchants WHERE id = ?')
    .bind(merchantId)
    .first<{ id: string; name: string; industry: string }>()

  if (!merchant) {
    return new Response(JSON.stringify({ error: 'Merchant not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2. Fetch upload rules and industry template from DB
  const configRows = await env.DB.prepare(
    "SELECT key, value FROM app_config WHERE key IN ('upload_rules', 'industries')"
  ).all<{ key: string; value: string }>()

  let uploadRules: any = null
  let industries: any = null
  for (const r of configRows.results || []) {
    try {
      if (r.key === 'upload_rules') uploadRules = JSON.parse(r.value)
      if (r.key === 'industries') industries = JSON.parse(r.value)
    } catch {
      // ignore
    }
  }

  // Check upload rules
  const maxBytes = uploadRules?.maxBytes || 26214400
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024))
    return new Response(JSON.stringify({ error: `File exceeds maximum allowed size of ${maxMb}MB` }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Validate documentType is defined in the merchant's industry template
  const indConfig = industries?.[merchant.industry]
  if (indConfig && Array.isArray(indConfig.sections)) {
    const validTypes: number[] = []
    for (const sec of indConfig.sections) {
      if (Array.isArray(sec.documents)) {
        for (const doc of sec.documents) {
          validTypes.push(doc.type)
        }
      }
    }
    if (!validTypes.includes(documentType)) {
      return new Response(
        JSON.stringify({ error: `Document type ${documentType} is not valid for ${indConfig.label}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // 3. Upload to Cloudflare R2 bucket
  if (!env.DOCS_BUCKET) {
    return new Response(JSON.stringify({ error: 'R2 bucket (DOCS_BUCKET) is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const filename = file.name || `document_${documentType}.pdf`
  const r2Key = `merchants/${merchant.id}/${documentType}_${Date.now()}_${filename}`

  try {
    await env.DOCS_BUCKET.put(r2Key, file.stream(), {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      },
      customMetadata: {
        merchantId: merchant.id,
        documentType: String(documentType),
        originalFilename: filename,
      },
    })
  } catch (r2Err: any) {
    console.error('R2 upload failed:', r2Err)
    return new Response(JSON.stringify({ error: 'Failed to upload document to R2 bucket: ' + r2Err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sharepointItemId = `r2:${r2Key}`

  // 4. Record/upsert document in D1 with status = 1 (Pending) and note = NULL (clears rejection note upon re-upload)
  const now = new Date().toISOString()
  const status = 1 // PENDING review upon upload

  try {
    await env.DB.prepare(
      `INSERT INTO documents (merchant_id, document_type, status, note, uploaded_at, status_updated_at, filename, sharepoint_item_id)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?)
       ON CONFLICT(merchant_id, document_type) DO UPDATE SET
         status = excluded.status,
         note = NULL,
         uploaded_at = excluded.uploaded_at,
         status_updated_at = excluded.status_updated_at,
         filename = excluded.filename,
         sharepoint_item_id = excluded.sharepoint_item_id`
    )
      .bind(merchant.id, documentType, status, now, now, filename, sharepointItemId || null)
      .run()
  } catch (err: any) {
    console.error('D1 database insert failure:', err)
    return new Response(JSON.stringify({ error: 'Database update failed: ' + err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({
      merchantId: merchant.id,
      documentType,
      status,
      filename,
      sharepointItemId,
      uploadedAt: now,
    }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
