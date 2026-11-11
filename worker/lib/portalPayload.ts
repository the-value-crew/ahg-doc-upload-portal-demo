import { Env } from '../types'
import {
  PortalConfigSuccess,
  BrandingConfig,
  PortalDefaultsConfig,
  SupportContactConfig,
  UploadRulesConfig,
  MerchantDocumentRecord,
  FileStatus,
  MerchantStageConfig,
} from '../../shared/types'
import { buildChecklist, computeStats } from '../../shared/checklist'

export async function buildPortalPayload(env: Env, merchantId: string): Promise<PortalConfigSuccess | null> {
  // 1. Fetch merchant from D1
  const merchant = await env.DB.prepare(
    'SELECT id, name, industry, status, processor, created_at, updated_at FROM merchants WHERE id = ?'
  )
    .bind(merchantId)
    .first<{
      id: string
      name: string
      industry: string
      status: number
      processor: string | null
      created_at: string
      updated_at: string
    }>()

  if (!merchant) {
    return null
  }

  // 2. Fetch app_config entries
  const configRows = await env.DB.prepare(
    "SELECT key, value FROM app_config WHERE key IN ('industries', 'upload_rules', 'portal_defaults', 'branding', 'support_contact', 'merchant_stages')"
  ).all<{ key: string; value: string }>()

  const configs: Record<string, any> = {}
  for (const row of configRows.results || []) {
    try {
      configs[row.key] = JSON.parse(row.value)
    } catch {
      configs[row.key] = row.value
    }
  }

  if (
    !configs.industries ||
    !configs.upload_rules ||
    !configs.portal_defaults ||
    !configs.branding ||
    !configs.support_contact
  ) {
    throw new Error('Required application configuration is missing in database')
  }

  const industryConfig = configs.industries[merchant.industry] || configs.industries.general
  if (!industryConfig) {
    throw new Error(`Industry configuration for '${merchant.industry}' not found`)
  }

  // 3. Fetch document rows for this merchant
  const docRows = await env.DB.prepare(
    `SELECT merchant_id, document_type, status, note, uploaded_at, status_updated_at, filename, sharepoint_item_id
     FROM documents
     WHERE merchant_id = ?
     ORDER BY uploaded_at DESC`
  )
    .bind(merchant.id)
    .all<{
      merchant_id: string
      document_type: number
      status: number
      note: string | null
      uploaded_at: string
      status_updated_at: string
      filename: string | null
      sharepoint_item_id: string | null
    }>()

  const rawDocs = docRows.results || []
  const checklist = buildChecklist(industryConfig, rawDocs)
  const stats = computeStats(checklist)

  const documents: MerchantDocumentRecord[] = rawDocs.map((r) => ({
    merchantId: r.merchant_id,
    documentType: r.document_type,
    status: r.status as FileStatus,
    note: r.note || undefined,
    uploadedAt: r.uploaded_at,
    statusUpdatedAt: r.status_updated_at,
    filename: r.filename || undefined,
    sharepointItemId: r.sharepoint_item_id || undefined,
  }))

  const stages: MerchantStageConfig[] = (configs.merchant_stages || []).map((s: any) => ({
    value: Number(s.value),
    name: String(s.name),
  }))

  return {
    found: true,
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
    brand: configs.portal_defaults as PortalDefaultsConfig,
    branding: configs.branding as BrandingConfig,
    supportContact: configs.support_contact as SupportContactConfig,
    industry: industryConfig,
    uploadRules: configs.upload_rules as UploadRulesConfig,
    checklist,
    stats,
    stages,
    documents,
  }
}

