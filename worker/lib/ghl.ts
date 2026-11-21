import type { Env } from '../types'

export interface GhlCustomField {
  id: string
  fieldValueString?: string
  fieldValueNumber?: number
  fieldValueDate?: number | string
  fieldValueArray?: string[]
  fieldValue?: string | number | string[]
  value?: string | number | string[]
  fieldKey?: string
  fieldName?: string
  name?: string
  [key: string]: unknown
}

export interface GhlOpportunity {
  id: string
  name: string
  locationId?: string
  pipelineId?: string
  pipelineStageId?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  customFields?: GhlCustomField[]
  [key: string]: unknown
}

export interface ParsedGhlMerchant {
  name: string
  status: number
  industry: string
  processor: string | null
}

export interface MerchantRow {
  id: string
  name: string
  industry: string
  status: number
  processor: string | null
  created_at: string
  updated_at: string
}

export type SyncMerchantResult =
  | { ok: true; merchant: MerchantRow }
  | { ok: false; status: 400 | 404 | 422 | 502 | 503; code: string; error: string }

export const DEFAULT_FIELD_MAP: {
  industry_type: { id: string; fieldKey: string }
  processor: { id: string; fieldKey: string }
} = {
  industry_type: { id: 'iT881KYvOCWyTSXzqFEe', fieldKey: 'opportunity.industry_type' },
  processor: { id: 'hhQbzTtgTFsFT1ngiHCt', fieldKey: 'opportunity.processor' },
}

export const DEFAULT_STAGE_LIST: Array<{ value: number; name: string; aliases?: string[] }> = [
  { value: 1, name: 'Onboarding booked', aliases: ['96f0eb52-c557-45c8-b467-d2cce611ffb2'] },
  { value: 2, name: 'Doc Collection', aliases: ['c0a4f6f4-1160-4286-8725-a5a4b38beed1'] },
  { value: 3, name: 'Application in review', aliases: ['3d89d46a-064b-4da0-8126-fd4685b84955'] },
  { value: 4, name: 'Approved', aliases: ['49522dbe-98b8-4f9e-8eee-06ae6d153955'] },
  { value: 5, name: 'Live and processing', aliases: ['fdbd8d76-3cb9-481a-8bed-dc8d9b75cb0a'] },
]

export const DEFAULT_INDUSTRY_MAP: Record<string, string> = {
  hemp: 'hemp',
  'kratom/kava': 'kratom',
  kratom: 'kratom',
  kava: 'kratom',
  mushroom: 'mushroom',
  nutraceuticals: 'general',
  telehealth: 'medical_telehealth',
  'service-based': 'general',
  'high-ticket': 'general',
  'rd peptides': 'peptide',
  'rd peptide': 'peptide',
  peptides: 'peptide',
  peptide: 'peptide',
  nonprofit: 'nonprofit',
  ach: 'general',
  other: 'general',
}

export const DEFAULT_PROCESSORS: string[] = [
  'Argyle - NABCO',
  'Argyle - SSB',
  'Argyle - PB&T',
  'West Town',
  'North',
  'Nuvei',
  'ACH Processing',
  'WIZLO',
  'RedFish',
]

export function isValidMerchantId(id: string): boolean {
  return /^[a-zA-Z0-9]{20}$/.test(id)
}

export function extractFieldValue(field: GhlCustomField | undefined | null): string {
  if (!field) return ''
  if (Array.isArray(field.fieldValueArray) && field.fieldValueArray.length > 0) {
    return String(field.fieldValueArray[0]).trim()
  }
  if (typeof field.fieldValueString === 'string' && field.fieldValueString.trim()) {
    return field.fieldValueString.trim()
  }
  if (typeof field.fieldValue === 'string' && field.fieldValue.trim()) {
    return field.fieldValue.trim()
  }
  if (typeof field.value === 'string' && field.value.trim()) {
    return field.value.trim()
  }
  if (field.fieldValue !== undefined && field.fieldValue !== null && String(field.fieldValue).trim()) {
    return String(field.fieldValue).trim()
  }
  if (field.value !== undefined && field.value !== null && String(field.value).trim()) {
    return String(field.value).trim()
  }
  return ''
}

export function findCustomField(
  customFields: GhlCustomField[] | undefined,
  fieldRef?: { id?: string; fieldKey?: string }
): GhlCustomField | undefined {
  if (!Array.isArray(customFields) || !fieldRef) return undefined

  const targetId = (fieldRef.id || '').toLowerCase()
  const targetKey = (fieldRef.fieldKey || '').toLowerCase()

  return customFields.find((cf) => {
    const cfId = (cf.id || '').toLowerCase()
    const cfKey = (cf.fieldKey || '').toLowerCase()
    const cfName = (cf.name || cf.fieldName || '').toLowerCase()

    if (targetId && cfId === targetId) return true
    if (targetKey && (cfKey === targetKey || cfName === targetKey)) return true
    return false
  })
}

/**
 * Pure parsing function mapping GHL opportunity to merchant record.
 */
export function parseOpportunity(
  opp: GhlOpportunity,
  fieldMap: {
    industry_type?: { id?: string; fieldKey?: string }
    processor?: { id?: string; fieldKey?: string }
  },
  stageList: Array<{ value: number; name: string; aliases?: string[] }>,
  industryMap: Record<string, string>,
  processorList: string[]
): ParsedGhlMerchant {
  // 1. Merchant Name
  const rawName = (opp.name || '').trim()
  if (!rawName) {
    throw new Error('Opportunity name is missing on HighLevel')
  }

  // 2. Stage mapping (pipelineStageId -> value 1..5)
  const status = resolveMerchantStageStatus(opp.pipelineStageId, stageList)

  // 3. Industry Type mapping (fallback to 'general')
  let industry = 'general'
  const customFields = opp.customFields || []
  const industryField = findCustomField(customFields, fieldMap.industry_type)
  const rawIndustry = extractFieldValue(industryField).toLowerCase()

  if (rawIndustry && industryMap[rawIndustry]) {
    industry = industryMap[rawIndustry]
  }

  // 4. Processor canonical matching (fallback to null)
  let processor: string | null = null
  const processorField = findCustomField(customFields, fieldMap.processor)
  const rawProcessor = extractFieldValue(processorField).trim()

  if (rawProcessor) {
    const matched = processorList.find(
      (p) => p.toLowerCase() === rawProcessor.toLowerCase()
    )
    if (matched) {
      processor = matched
    }
  }

  return {
    name: rawName,
    status,
    industry,
    processor,
  }
}

/**
 * Fetches opportunity by ID from HighLevel API v2.
 */
export async function fetchGhlOpportunity(env: Env, opportunityId: string): Promise<GhlOpportunity | null> {
  if (!env.GHL_PRIVATE_TOKEN) {
    throw new Error('GHL_PRIVATE_TOKEN is not configured')
  }

  const url = `https://services.leadconnectorhq.com/opportunities/${encodeURIComponent(opportunityId)}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.GHL_PRIVATE_TOKEN}`,
        Version: '2021-07-28',
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (res.status === 404) {
      return null
    }

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`HighLevel API error (${res.status}): ${errBody}`)
    }

    const data: any = await res.json()
    // Support either { opportunity: { ... } } or flat { id, name, ... }
    const opp = (data?.opportunity || data) as GhlOpportunity | null
    if (!opp || !opp.id) {
      return null
    }
    if (env.GHL_LOCATION_ID && opp.locationId && opp.locationId !== env.GHL_LOCATION_ID) {
      return null
    }
    return opp
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('HighLevel API request timed out after 8 seconds')
    }
    throw err
  }
}

/**
 * Fetches an opportunity from HighLevel by ID, maps fields using app_config,
 * upserts it into the D1 `merchants` table, and returns the persisted row.
 */
export async function syncMerchantFromGhl(env: Env, merchantId: string): Promise<SyncMerchantResult> {
  const trimmedId = (merchantId || '').trim()

  if (!isValidMerchantId(trimmedId)) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_MERCHANT_ID',
      error: 'Invalid merchant identifier format',
    }
  }

  if (!env.GHL_PRIVATE_TOKEN) {
    return {
      ok: false,
      status: 503,
      code: 'GHL_NOT_CONFIGURED',
      error: 'HighLevel API token is not configured on server',
    }
  }

  let opp: GhlOpportunity | null
  try {
    opp = await fetchGhlOpportunity(env, trimmedId)
  } catch (fetchErr: any) {
    console.error('HighLevel fetch error:', fetchErr)
    return {
      ok: false,
      status: 502,
      code: 'GHL_FETCH_ERROR',
      error: fetchErr?.message || 'Error communicating with HighLevel API',
    }
  }

  if (!opp) {
    return {
      ok: false,
      status: 404,
      code: 'MERCHANT_NOT_FOUND_ON_GHL',
      error: 'Merchant opportunity not found on HighLevel',
    }
  }

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

  const fieldMap =
    configs.ghl_field_map && typeof configs.ghl_field_map === 'object'
      ? { ...DEFAULT_FIELD_MAP, ...configs.ghl_field_map }
      : DEFAULT_FIELD_MAP
  const stages =
    Array.isArray(configs.merchant_stages) && configs.merchant_stages.length > 0
      ? configs.merchant_stages
      : DEFAULT_STAGE_LIST
  const industryMap: Record<string, string> = {
    ...DEFAULT_INDUSTRY_MAP,
    ...(configs.ghl_industry_map && typeof configs.ghl_industry_map === 'object' ? configs.ghl_industry_map : {}),
  }
  const processors: string[] =
    Array.isArray(configs.processors) && configs.processors.length > 0
      ? configs.processors
      : DEFAULT_PROCESSORS

  let parsed: ParsedGhlMerchant
  try {
    parsed = parseOpportunity(opp, fieldMap, stages, industryMap, processors)
  } catch (parseErr: any) {
    return {
      ok: false,
      status: 422,
      code: 'GHL_PARSE_VALIDATION_ERROR',
      error: parseErr?.message || 'Validation error while parsing HighLevel opportunity',
    }
  }

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
    .bind(trimmedId, parsed.name, parsed.industry, parsed.status, parsed.processor)
    .run()

  const merchant = await env.DB.prepare(
    'SELECT id, name, industry, status, processor, created_at, updated_at FROM merchants WHERE id = ?'
  )
    .bind(trimmedId)
    .first<MerchantRow>()

  if (!merchant) {
    throw new Error('Failed to load merchant record after upsert')
  }

  return { ok: true, merchant }
}

/**
 * Ensures a merchant exists in D1. If missing, automatically fetches and syncs it from HighLevel.
 */
export async function ensureMerchantExists(env: Env, merchantId: string): Promise<SyncMerchantResult> {
  const trimmedId = (merchantId || '').trim()
  if (!trimmedId) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_MERCHANT_ID',
      error: 'Invalid merchant identifier format',
    }
  }

  const existing = await env.DB.prepare(
    'SELECT id, name, industry, status, processor, created_at, updated_at FROM merchants WHERE id = ?'
  )
    .bind(trimmedId)
    .first<MerchantRow>()

  if (existing) {
    return { ok: true, merchant: existing }
  }

  return await syncMerchantFromGhl(env, trimmedId)
}

/**
 * Resolves a HighLevel pipelineStageId to our 1..5 merchant status.
 * Any stage beyond 5 (Live and processing) is clamped to 5.
 * If unmapped and the merchant is already at 5, keeps 5.
 */
export function resolveMerchantStageStatus(
  pipelineStageId: string | undefined,
  stageList: Array<{ value: number; name: string; aliases?: string[] }>,
  currentStatus?: number
): number {
  const trimmedStage = (pipelineStageId || '').trim()
  if (trimmedStage) {
    for (const stage of stageList) {
      if (Array.isArray(stage.aliases) && stage.aliases.includes(trimmedStage)) {
        return Math.min(5, Math.max(1, Number(stage.value)))
      }
    }
  }
  if (currentStatus !== undefined && currentStatus >= 5) {
    return 5
  }
  return currentStatus !== undefined ? Math.min(5, Math.max(1, currentStatus)) : 1
}

export async function loadStageList(
  env: Env
): Promise<Array<{ value: number; name: string; aliases?: string[] }>> {
  const row = await env.DB.prepare("SELECT value FROM app_config WHERE key = 'merchant_stages'").first<{
    value: string
  }>()
  if (row?.value) {
    try {
      const parsed = JSON.parse(row.value)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    } catch {
      // fall back to default
    }
  }
  return DEFAULT_STAGE_LIST
}

/**
 * Syncs ONLY the merchant's status from HighLevel into D1.
 * Clamps any stage beyond 5 (Live and processing) to 5.
 */
export async function syncMerchantStatusFromGhl(
  env: Env,
  merchantId: string,
  preloadedStageList?: Array<{ value: number; name: string; aliases?: string[] }>
): Promise<{ ok: true; status: number; updated: boolean } | { ok: false; status: number; error: string }> {
  const trimmedId = (merchantId || '').trim()
  if (!isValidMerchantId(trimmedId)) {
    return { ok: false, status: 400, error: 'Invalid merchant identifier format' }
  }
  if (!env.GHL_PRIVATE_TOKEN) {
    return { ok: false, status: 503, error: 'HighLevel API token is not configured' }
  }

  const existing = await env.DB.prepare('SELECT id, status FROM merchants WHERE id = ?')
    .bind(trimmedId)
    .first<{ id: string; status: number }>()

  if (!existing) {
    return { ok: false, status: 404, error: 'Merchant not found' }
  }

  const opp = await fetchGhlOpportunity(env, trimmedId)
  if (!opp) {
    return { ok: false, status: 404, error: 'Merchant opportunity not found on HighLevel' }
  }

  const stageList = preloadedStageList || (await loadStageList(env))
  const nextStatus = resolveMerchantStageStatus(opp.pipelineStageId, stageList, existing.status)

  if (nextStatus !== existing.status) {
    await env.DB.prepare("UPDATE merchants SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(nextStatus, trimmedId)
      .run()
    return { ok: true, status: nextStatus, updated: true }
  }

  return { ok: true, status: nextStatus, updated: false }
}

/**
 * Daily CRON helper: syncs status only for all merchants in D1 from HighLevel.
 */
export async function syncAllMerchantStatusesFromGhl(
  env: Env
): Promise<{ total: number; updated: number; failed: number }> {
  if (!env.GHL_PRIVATE_TOKEN) {
    return { total: 0, updated: 0, failed: 0 }
  }

  const stageList = await loadStageList(env)
  const rows = await env.DB.prepare('SELECT id FROM merchants').all<{ id: string }>()
  const merchants = rows.results || []

  let updated = 0
  let failed = 0

  for (const m of merchants) {
    try {
      const res = await syncMerchantStatusFromGhl(env, m.id, stageList)
      if (res.ok) {
        if (res.updated) updated++
      } else {
        failed++
      }
    } catch (err) {
      console.error(`CRON status sync failed for merchant ${m.id}:`, err)
      failed++
    }
  }

  return { total: merchants.length, updated, failed }
}

function escapeHtmlBasic(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Sends an email notification to the merchant's HighLevel contact when a new document is requested.
 * Non-fatal: returns { sent: false, reason } if GHL is unconfigured or the request fails.
 */
export async function sendDocumentRequestEmail(
  env: Env,
  merchantId: string,
  merchantName: string,
  docName: string,
  docDescription: string,
  portalUrl: string
): Promise<{ sent: boolean; reason?: string }> {
  if (!env.GHL_PRIVATE_TOKEN) {
    return { sent: false, reason: 'GHL_PRIVATE_TOKEN is not configured' }
  }

  try {
    const opp = await fetchGhlOpportunity(env, merchantId)
    const contactId = typeof opp?.contactId === 'string' ? opp.contactId.trim() : ''
    if (!contactId) {
      return { sent: false, reason: 'No contactId found on HighLevel opportunity' }
    }

    const safeMerchant = escapeHtmlBasic(merchantName)
    const safeDocName = escapeHtmlBasic(docName)
    const safeDesc = docDescription ? `<p style="color:#4B5563;margin:8px 0 0;">${escapeHtmlBasic(docDescription)}</p>` : ''
    const safeUrl = escapeHtmlBasic(portalUrl)

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1A1A1A;">
        <h2 style="margin-bottom:12px;">Additional Document Requested</h2>
        <p>Hello,</p>
        <p>Your onboarding manager has requested an additional document for <strong>${safeMerchant}</strong>:</p>
        <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:14px 16px;margin:16px 0;">
          <strong style="font-size:15px;">${safeDocName}</strong>
          ${safeDesc}
        </div>
        <p>Please upload this document through your merchant portal:</p>
        <p style="margin:20px 0;">
          <a href="${safeUrl}" style="background:#1A1A1A;color:#FFFFFF;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
            Open Merchant Portal
          </a>
        </p>
        <p style="font-size:12px;color:#6B7280;">Or copy this link: ${safeUrl}</p>
      </div>
    `.trim()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const res = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GHL_PRIVATE_TOKEN}`,
        Version: '2021-04-15',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        type: 'Email',
        contactId,
        subject: `Document Requested: ${docName}`,
        html,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      return { sent: false, reason: `HighLevel email API error (${res.status}): ${errBody}` }
    }

    return { sent: true }
  } catch (err: any) {
    return { sent: false, reason: err?.message || 'Failed to send notification email' }
  }
}
