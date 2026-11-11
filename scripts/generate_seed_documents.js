import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// 1. Read merchants from migrations/0004_seed_merchants.sql
const mContent = fs.readFileSync(path.join(rootDir, 'migrations/0004_seed_merchants.sql'), 'utf8')
const mRegex = /\(\x27([^\x27]+)\x27,\s*\x27([^\x27]+)\x27,\s*\x27([^\x27]+)\x27,\s*(\d+)/g
let match
const merchants = []
while ((match = mRegex.exec(mContent)) !== null) {
  merchants.push({
    id: match[1],
    name: match[2],
    industry: match[3],
    status: parseInt(match[4], 10),
  })
}

// 2. Read industries config from migrations/0003_seed_app_config.sql
const appConfig = fs.readFileSync(path.join(rootDir, 'migrations/0003_seed_app_config.sql'), 'utf8')
const indMatch = appConfig.match(/\(\x27industries\x27,\s*\x27({.*?})\x27\)/s)
const industries = JSON.parse(indMatch[1].replace(/\x27\x27/g, "\x27"))

// 3. Document types per industry
const industryDocMap = {}
for (const [indKey, conf] of Object.entries(industries)) {
  const reqDocs = []
  const optDocs = []
  for (const s of conf.sections || []) {
    for (const d of s.documents || []) {
      if (d.required !== false) {
        reqDocs.push(d.type)
      } else {
        optDocs.push(d.type)
      }
    }
  }
  industryDocMap[indKey] = { reqDocs, optDocs }
}

const DOC_FILENAMES = {
  101: ['articles_of_incorporation.pdf', 'certificate_of_formation.pdf', 'articles_org.pdf', 'formation_filing.pdf'],
  102: ['ss4_ein_letter.pdf', 'irs_ein_confirmation.pdf', 'federal_tax_id_notice.pdf'],
  103: ['voided_check.pdf', 'signed_bank_letter.pdf', 'bank_account_verification.pdf'],
  104: ['owner_passport_scan.pdf', 'drivers_license_color.pdf', 'state_id_card.pdf', 'owner_government_id.pdf'],
  105: ['operating_agreement_executed.pdf', 'corporate_bylaws_signed.pdf', 'company_operating_agreement.pdf'],
  106: ['utility_bill_electric.pdf', 'office_lease_agreement.pdf', 'address_verification_bill.pdf'],
  107: ['irs_501c3_determination_letter.pdf', 'tax_exempt_approval.pdf'],
  108: ['board_of_directors_roster.pdf', 'board_governance_roster.pdf'],
  109: ['board_minutes_signed.pdf', 'annual_meeting_minutes.pdf'],
  201: ['bank_statements_3_months.pdf', 'operating_account_statements.pdf', 'checking_statements_recent.pdf'],
  202: ['processing_statements_3m.pdf', 'merchant_processing_history.pdf', 'prior_processing_statements.pdf'],
  203: ['two_years_tax_returns.pdf', 'balance_sheet_pnl.pdf', 'corporate_tax_returns.pdf'],
  301: ['website_compliance_audit.pdf', 'terms_and_privacy_review.pdf', 'online_disclaimers_audit.pdf'],
  302: ['3pl_fulfillment_agreement.pdf', 'warehouse_fulfillment_contract.pdf', 'logistics_sla.pdf'],
  303: ['inventory_facility_photos.pdf', 'warehouse_stock_photos.pdf', 'packaging_facility_photos.pdf'],
  304: ['kyc_beneficial_ownership_form.pdf', 'kyc_compliance_questionnaire.pdf'],
  305: ['safety_data_sheets_sds.pdf', 'sds_compliance_pack.pdf'],
  306: ['vendor_commercial_invoices.pdf', 'supplier_invoices_recent.pdf'],
  307: ['domain_registration_receipt.pdf', 'domain_ownership_whois.pdf', 'domain_ssl_certificate.pdf'],
  308: ['top_10_customers_summary.pdf', 'revenue_concentration_breakdown.pdf'],
  309: ['product_catalog_pricing.pdf', 'retail_coa_archive.pdf', 'complete_sku_list.pdf'],
  310: ['legitscript_certification_seal.pdf', 'legitscript_approval_certificate.pdf'],
  311: ['state_pharmacy_board_license.pdf', 'pharmacy_dispensing_permits.pdf'],
  312: ['physician_medical_license.pdf', 'supervising_practitioner_license.pdf'],
  313: ['telehealth_intake_protocol.pdf', 'telehealth_clinical_questionnaire.pdf'],
  314: ['fiscal_sponsorship_agreement.pdf', 'party_agreement_signed.pdf'],
  401: ['third_party_lab_coa_full_panel.pdf', 'batch_certificate_of_analysis.pdf', 'lab_coa_results.pdf'],
  402: ['state_hemp_grower_license.pdf', 'hemp_food_establishment_permit.pdf', 'dept_ag_retail_license.pdf'],
  501: ['compliance_monitoring_authorization.pdf', 'compliance_monitoring_agreement.pdf'],
  502: ['reserve_policy_acknowledgement.pdf', 'rolling_reserve_schedule_signed.pdf'],
  503: ['peptide_underwriting_addendum.pdf', 'peptide_industry_terms_signed.pdf'],
  504: ['wtp_sole_member_affidavit.pdf', 'single_member_llc_affidavit.pdf'],
  505: ['argyle_kratom_addendum_signed.pdf', 'kratom_processing_addendum.pdf'],
  506: ['argyle_mushroom_addendum_signed.pdf', 'functional_mushroom_addendum.pdf'],
  507: ['argyle_hemp_edd_worksheet.pdf', 'enhanced_due_diligence_worksheet.pdf'],
  508: ['argyle_file_build_form.pdf', 'terminal_deployment_form.pdf'],
  509: ['argyle_free_terminal_form.pdf', 'terminal_placement_agreement.pdf'],
  510: ['ssb_policy_exception_waiver.pdf', 'no_reserve_waiver_request.pdf'],
  511: ['argyle_nabco_cross_corp_agreement.pdf', 'cross_corporate_guaranty.pdf'],
}

const REJECTION_NOTES = {
  101: "Articles of Incorporation missing the official state filing stamp or certification seal.",
  102: "EIN confirmation letter legal entity name does not match the legal name on bank record.",
  103: "Voided check is a starter check without pre-printed company name. Please submit a signed bank officer letter.",
  104: "Driver's license scan is blurry or expired. Please upload an active, unexpired government-issued photo ID.",
  105: "Operating agreement is missing signature page or exhibit schedules.",
  106: "Utility bill is older than 90 days. Please provide recent electric, gas, or water bill.",
  201: "Bank statements missing page 3 of 4. Please provide complete statements for all 3 consecutive months.",
  202: "Processing statements truncated processing volume and chargeback rates. Please provide full monthly summary.",
  301: "Website compliance review failed: Missing clear refund policy and customer support contact phone/email in footer.",
  302: "Fulfillment agreement is unsigned or missing the active service term duration.",
  307: "Proof of domain ownership must show the legal company name or registered owner.",
  401: "Lab COA results are older than 12 months. Please provide current full-panel certificate for active product batches.",
  402: "State hemp license has lapsed. Please provide current renewed Department of Agriculture license.",
  default: "Document scan does not meet minimum underwriting legibility standards. Please provide high-resolution color PDF.",
}

function cleanSlug(name) {
  return name
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 25)
}

// Pseudo-random number generator for reproducibility
function createPrng(seedStr) {
  let hash = 0
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i)
    hash |= 0
  }
  let s = Math.abs(hash) || 123456789
  return function () {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const allDocuments = []

for (const merchant of merchants) {
  const prng = createPrng(merchant.id + '_docs')
  const { reqDocs = [], optDocs = [] } = industryDocMap[merchant.industry] || {
    reqDocs: [101, 102, 103, 104, 201, 301, 307, 501, 502],
    optDocs: [105, 202, 302, 303],
  }

  // Determine how many documents to generate based on merchant status
  let minDocs = 2
  let maxDocs = 4
  let statusWeights = { 1: 0.6, 2: 0.3, 3: 0.1 } // 1: Pending, 2: Verified, 3: Rejected
  let daysAgoMin = 2
  let daysAgoMax = 12

  if (merchant.status === 5) {
    // Live and processing
    minDocs = Math.min(7, reqDocs.length)
    maxDocs = Math.min(reqDocs.length + 3, reqDocs.length + optDocs.length)
    statusWeights = { 1: 0.05, 2: 0.95, 3: 0.0 }
    daysAgoMin = 15
    daysAgoMax = 45
  } else if (merchant.status === 4) {
    // Approved
    minDocs = Math.min(6, reqDocs.length)
    maxDocs = Math.min(reqDocs.length + 2, reqDocs.length + optDocs.length)
    statusWeights = { 1: 0.15, 2: 0.85, 3: 0.0 }
    daysAgoMin = 10
    daysAgoMax = 35
  } else if (merchant.status === 3) {
    // Application in review
    minDocs = Math.min(5, reqDocs.length)
    maxDocs = Math.min(reqDocs.length + 1, reqDocs.length + optDocs.length)
    statusWeights = { 1: 0.3, 2: 0.6, 3: 0.1 }
    daysAgoMin = 5
    daysAgoMax = 25
  } else if (merchant.status === 2) {
    // Doc collection
    minDocs = Math.min(4, reqDocs.length)
    maxDocs = Math.min(reqDocs.length, reqDocs.length + optDocs.length)
    statusWeights = { 1: 0.45, 2: 0.35, 3: 0.2 }
    daysAgoMin = 3
    daysAgoMax = 20
  } else {
    // Onboarding booked (status 1)
    minDocs = 2
    maxDocs = Math.min(5, reqDocs.length)
    statusWeights = { 1: 0.6, 2: 0.3, 3: 0.1 }
    daysAgoMin = 1
    daysAgoMax = 14
  }

  // Ensure multiple documents: at least 2, at most available docs
  const targetCount = Math.max(2, Math.floor(prng() * (maxDocs - minDocs + 1)) + minDocs)

  // Shuffle required docs first, then optional docs
  const shuffledReq = [...reqDocs].sort(() => prng() - 0.5)
  const shuffledOpt = [...optDocs].sort(() => prng() - 0.5)
  const candidateTypes = [...shuffledReq, ...shuffledOpt]
  const selectedTypes = candidateTypes.slice(0, targetCount)

  const mSlug = cleanSlug(merchant.name)

  for (const docType of selectedTypes) {
    // Choose status based on weights
    const roll = prng()
    let docStatus = 1
    if (roll < statusWeights[1]) {
      docStatus = 1 // Pending
    } else if (roll < statusWeights[1] + statusWeights[2]) {
      docStatus = 2 // Verified / Approved
    } else {
      docStatus = 3 // Rejected
    }

    const note = docStatus === 3 ? (REJECTION_NOTES[docType] || REJECTION_NOTES.default) : null

    // Upload date
    const daysAgo = Math.floor(prng() * (daysAgoMax - daysAgoMin + 1)) + daysAgoMin

    // Filename
    const fNames = DOC_FILENAMES[docType] || [`document_${docType}.pdf`]
    const baseName = fNames[Math.floor(prng() * fNames.length)]
    const filename = `${mSlug}_${baseName}`

    allDocuments.push({
      merchant_id: merchant.id,
      document_type: docType,
      status: docStatus,
      note,
      daysAgo,
      filename,
      sharepoint_item_id: `sp-${merchant.id.slice(0, 6)}-${docType}`,
    })
  }
}

// Generate SQL
const escapeSql = (str) => (str ? str.replace(/'/g, "''") : '')

let sql = `-- 0005_seed_documents.sql: Seed Uploaded Documents with Status and Notes\n`

// Chunk into batches of 100 to ensure fast parsing and no SQLite/D1 limits
const BATCH_SIZE = 100
for (let i = 0; i < allDocuments.length; i += BATCH_SIZE) {
  const batch = allDocuments.slice(i, i + BATCH_SIZE)
  sql += `INSERT OR REPLACE INTO documents (merchant_id, document_type, status, note, uploaded_at, status_updated_at, filename, sharepoint_item_id) VALUES\n`
  sql += batch
    .map(
      (d) =>
        `  ('${escapeSql(d.merchant_id)}', ${d.document_type}, ${d.status}, ${
          d.note ? `'${escapeSql(d.note)}'` : 'NULL'
        }, datetime('now', '-${d.daysAgo} days'), datetime('now', '-${d.daysAgo} days'), '${escapeSql(
          d.filename
        )}', '${escapeSql(d.sharepoint_item_id)}')`
    )
    .join(',\n')
  sql += ';\n\n'
}

const outputPath = path.join(rootDir, 'migrations/0005_seed_documents.sql')
fs.writeFileSync(outputPath, sql.trim() + '\n')

console.log(`✅ Successfully generated ${allDocuments.length} document records for ${merchants.length} merchants.`)
console.log(`Written to ${outputPath}`)

