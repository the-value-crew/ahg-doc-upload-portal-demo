/**
 * scripts/sync_initial_merchants.js
 * 
 * Reads raw GHL opportunity data from scripts/initial_merchants.json
 * and generates clean SQL seed statements in migrations/0004_seed_merchants.sql.
 * 
 * Fields extracted:
 * - id: opp.id
 * - name: opp.name
 * - industry: custom field "Industry Type" -> mapped to app_config industry key
 * - status: pipelineStageId -> mapped to deal stage number (1..5)
 * - processor: custom field "Processor" -> matched against canonical processor list
 * - created_at: opp.createdAt
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INPUT_PATH = path.resolve(__dirname, 'initial_merchants.json')
const OUTPUT_PATH = path.resolve(__dirname, '../migrations/0004_seed_merchants.sql')

// Canonical Processors
const PROCESSORS = [
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

// Pipeline Stage ID -> Deal Stage (1..5)
// Unmapped stages default to 1 (Onboarding booked)
const STAGE_MAP = {
  '96f0eb52-c557-45c8-b467-d2cce611ffb2': 1, // Onboarding booked
  'c0a4f6f4-1160-4286-8725-a5a4b38beed1': 2, // Doc Collection
  '3d89d46a-064b-4da0-8126-fd4685b84955': 3, // Application in review
  '49522dbe-98b8-4f9e-8eee-06ae6d153955': 4, // Approved
  'fdbd8d76-3cb9-481a-8bed-dc8d9b75cb0a': 5, // Live and processing
}

// GHL Industry Type -> Internal Industry Key
const INDUSTRY_MAP = {
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
  other: 'general',
  ach: 'general',
}

function extractCustomField(customFields, keyOrId) {
  if (!Array.isArray(customFields)) return ''
  const target = keyOrId.toLowerCase()
  const cf = customFields.find((f) => {
    const fId = (f.id || '').toLowerCase()
    const fKey = (f.fieldKey || '').toLowerCase()
    const fName = (f.name || f.fieldName || '').toLowerCase()
    return fId === target || fKey === target || fName === target
  })

  if (!cf) return ''
  if (Array.isArray(cf.fieldValueArray) && cf.fieldValueArray.length > 0) {
    return String(cf.fieldValueArray[0]).trim()
  }
  if (typeof cf.fieldValueString === 'string' && cf.fieldValueString.trim()) {
    return cf.fieldValueString.trim()
  }
  if (typeof cf.fieldValue === 'string' && cf.fieldValue.trim()) {
    return cf.fieldValue.trim()
  }
  if (typeof cf.value === 'string' && cf.value.trim()) {
    return cf.value.trim()
  }
  if (cf.fieldValue !== undefined && cf.fieldValue !== null) {
    return String(cf.fieldValue).trim()
  }
  return ''
}

function formatSqlDate(isoString) {
  if (!isoString) return new Date().toISOString().replace('T', ' ').replace(/\..+/, '')
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return new Date().toISOString().replace('T', ' ').replace(/\..+/, '')
  return d.toISOString().replace('T', ' ').replace(/\..+/, '')
}

function syncMerchants() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Input file not found: ${INPUT_PATH}`)
    process.exit(1)
  }

  const rawJson = fs.readFileSync(INPUT_PATH, 'utf8')
  const items = JSON.parse(rawJson)

  const rows = []
  const seenIds = new Set()

  for (const item of items) {
    const opp = item.opportunity
    if (!opp || !opp.id) continue

    const id = opp.id.trim()
    if (seenIds.has(id)) continue
    seenIds.add(id)

    // Name (escaped for SQL single-quote literals)
    const name = (opp.name || 'Unnamed Merchant').trim().replace(/'/g, "''")

    // Industry Type
    const rawIndustry = extractCustomField(opp.customFields, 'opportunity.industry_type').toLowerCase()
    const industry = INDUSTRY_MAP[rawIndustry] || 'general'

    // Status / Stage
    const stageId = (opp.pipelineStageId || '').trim()
    const status = STAGE_MAP[stageId] || 1

    // Processor
    const rawProcessor = extractCustomField(opp.customFields, 'opportunity.processor')
    let matchedProcessor = null
    if (rawProcessor) {
      const match = PROCESSORS.find((p) => p.toLowerCase() === rawProcessor.toLowerCase())
      if (match) {
        matchedProcessor = match
      }
    }
    const processorSql = matchedProcessor ? `'${matchedProcessor.replace(/'/g, "''")}'` : 'NULL'

    // Timestamps
    const createdAt = formatSqlDate(opp.createdAt)
    const updatedAt = formatSqlDate(opp.updatedAt || opp.createdAt)

    rows.push(`  ('${id}', '${name}', '${industry}', ${status}, ${processorSql}, '${createdAt}', '${updatedAt}')`)
  }

  const sqlContent = [
    '-- 0004_seed_merchants.sql: Seed Merchants from GHL Opportunities',
    'INSERT OR REPLACE INTO merchants (id, name, industry, status, processor, created_at, updated_at) VALUES',
    rows.join(',\n') + ';',
    '',
  ].join('\n')

  fs.writeFileSync(OUTPUT_PATH, sqlContent, 'utf8')
  console.log(`✅ Successfully generated ${rows.length} merchant records in ${OUTPUT_PATH}`)
}

syncMerchants()
