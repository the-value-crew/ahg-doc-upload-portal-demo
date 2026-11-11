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
  pipelineId?: string
  pipelineStageId?: string
  status?: string
  customFields?: GhlCustomField[]
  [key: string]: unknown
}

export interface ParsedGhlMerchant {
  name: string
  status: number
  industry: string
  processor: string | null
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
  let status = 1 // default to 1 (Onboarding booked) if unmapped
  const pipelineStageId = (opp.pipelineStageId || '').trim()
  if (pipelineStageId) {
    for (const stage of stageList) {
      if (Array.isArray(stage.aliases) && stage.aliases.includes(pipelineStageId)) {
        status = Number(stage.value)
        break
      }
    }
  }

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
    const opp = data.opportunity || data
    return opp as GhlOpportunity
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('HighLevel API request timed out after 8 seconds')
    }
    throw err
  }
}
