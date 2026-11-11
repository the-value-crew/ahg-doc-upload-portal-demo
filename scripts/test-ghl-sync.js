import assert from 'assert'
import { parseOpportunity } from '../worker/lib/ghl.ts'
import { generateSyncToken, verifySyncToken } from '../worker/lib/syncToken.ts'

const fieldMap = {
  industry_type: { id: 'iT881KYvOCWyTSXzqFEe', fieldKey: 'opportunity.industry_type' },
  processor: { id: 'hhQbzTtgTFsFT1ngiHCt', fieldKey: 'opportunity.processor' },
}

const stageList = [
  { value: 1, name: 'Onboarding booked', aliases: ['96f0eb52-c557-45c8-b467-d2cce611ffb2'] },
  { value: 2, name: 'Doc Collection', aliases: ['c0a4f6f4-1160-4286-8725-a5a4b38beed1'] },
  { value: 3, name: 'Application in review', aliases: ['3d89d46a-064b-4da0-8126-fd4685b84955'] },
  { value: 4, name: 'Approved', aliases: ['49522dbe-98b8-4f9e-8eee-06ae6d153955'] },
  { value: 5, name: 'Live and processing', aliases: ['fdbd8d76-3cb9-481a-8bed-dc8d9b75cb0a'] },
]

const industryMap = {
  'hemp': 'hemp',
  'kratom/kava': 'kratom',
  'mushroom': 'mushroom',
  'nutraceuticals': 'general',
  'telehealth': 'medical_telehealth',
  'service-based': 'general',
  'high-ticket': 'general',
  'rd peptides': 'peptide',
  'other': 'general',
}

const processorList = [
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

console.log('🧪 Running GHL Opportunity & Token Unit Tests...')

// 1. Full Opportunity parsing
{
  const opp = {
    id: 'NFha2ki0NyXDTtZOB6el',
    name: 'Bluum Peptides LLC',
    pipelineStageId: 'c0a4f6f4-1160-4286-8725-a5a4b38beed1', // Doc Collection (2)
    customFields: [
      { id: 'iT881KYvOCWyTSXzqFEe', fieldValueString: 'RD Peptides' },
      { id: 'hhQbzTtgTFsFT1ngiHCt', fieldValueString: 'West Town' },
    ],
  }

  const result = parseOpportunity(opp, fieldMap, stageList, industryMap, processorList)
  assert.strictEqual(result.name, 'Bluum Peptides LLC')
  assert.strictEqual(result.status, 2)
  assert.strictEqual(result.industry, 'peptide')
  assert.strictEqual(result.processor, 'West Town')
  console.log('✅ Full opportunity mapped accurately')
}

// 2. Case-insensitive processor & stage 5 (Live and processing)
{
  const opp = {
    id: 'test-2',
    name: 'Coastal Hemp Corp',
    pipelineStageId: 'fdbd8d76-3cb9-481a-8bed-dc8d9b75cb0a', // Live and processing (5)
    customFields: [
      { id: 'iT881KYvOCWyTSXzqFEe', fieldValue: 'Hemp' },
      { id: 'hhQbzTtgTFsFT1ngiHCt', fieldValue: 'west town' }, // lowercase match
    ],
  }

  const result = parseOpportunity(opp, fieldMap, stageList, industryMap, processorList)
  assert.strictEqual(result.status, 5)
  assert.strictEqual(result.industry, 'hemp')
  assert.strictEqual(result.processor, 'West Town') // canonical case preserved
  console.log('✅ Canonical processor preserved & stage 5 mapped')
}

// 3. Telehealth & Nuvei
{
  const opp = {
    id: 'test-3',
    name: 'Evergreen Telehealth MD',
    pipelineStageId: '3d89d46a-064b-4da0-8126-fd4685b84955', // Application in review (3)
    customFields: [
      { id: 'iT881KYvOCWyTSXzqFEe', fieldValueString: 'Telehealth' },
      { id: 'hhQbzTtgTFsFT1ngiHCt', fieldValueString: 'Nuvei' },
    ],
  }

  const result = parseOpportunity(opp, fieldMap, stageList, industryMap, processorList)
  assert.strictEqual(result.status, 3)
  assert.strictEqual(result.industry, 'medical_telehealth')
  assert.strictEqual(result.processor, 'Nuvei')
  console.log('✅ Telehealth & Nuvei mapped')
}

// 4. "Other" industry and null processor -> defaults to 'general' and null processor
{
  const opp = {
    id: 'test-4',
    name: 'General Solutions Inc',
    pipelineStageId: 'unknown-stage-id',
    customFields: [
      { id: 'iT881KYvOCWyTSXzqFEe', fieldValueString: 'Other' },
      { id: 'hhQbzTtgTFsFT1ngiHCt', fieldValueString: 'Unknown Processor' },
    ],
  }

  const result = parseOpportunity(opp, fieldMap, stageList, industryMap, processorList)
  assert.strictEqual(result.status, 1) // default to 1
  assert.strictEqual(result.industry, 'general')
  assert.strictEqual(result.processor, null)
  console.log('✅ Other industry and null processor fallback to general and null')
}

// 5. Missing industry -> defaults to 'general'
{
  const opp = {
    id: 'test-5',
    name: 'No Industry Merchant',
    customFields: [],
  }

  const result = parseOpportunity(opp, fieldMap, stageList, industryMap, processorList)
  assert.strictEqual(result.industry, 'general')
  assert.strictEqual(result.processor, null)
  assert.strictEqual(result.status, 1)
  console.log('✅ Missing industry defaults to general')
}

// 6. Missing name throws 422
{
  const opp = {
    id: 'test-6',
    name: '   ',
    customFields: [],
  }

  assert.throws(() => {
    parseOpportunity(opp, fieldMap, stageList, industryMap, processorList)
  }, /Opportunity name is missing/)
  console.log('✅ Missing name throws validation error')
}

// 7. Sync Token generation & verification
async function testSyncToken() {
  const secret = 'super-secret-salt-12345'
  const merchantId = 'NFha2ki0NyXDTtZOB6el'

  const token = await generateSyncToken(merchantId, secret)
  assert.ok(token && token.includes('.'), 'Token format valid')

  // Verify valid token
  const valid = await verifySyncToken(token, merchantId, secret)
  assert.strictEqual(valid, true, 'Valid token passes verification')

  // Wrong merchant ID
  const wrongMerchant = await verifySyncToken(token, 'WrongMerchantId12345', secret)
  assert.strictEqual(wrongMerchant, false, 'Wrong merchant ID fails verification')

  // Wrong secret
  const wrongSecret = await verifySyncToken(token, merchantId, 'wrong-secret')
  assert.strictEqual(wrongSecret, false, 'Wrong secret fails verification')

  // Tampered payload
  const parts = token.split('.')
  const tamperedToken = 'tampered' + parts[0].slice(8) + '.' + parts[1]
  const tampered = await verifySyncToken(tamperedToken, merchantId, secret)
  assert.strictEqual(tampered, false, 'Tampered token fails verification')

  console.log('✅ Sync token HMAC verification & security checks passed')
}

await testSyncToken()

console.log('🎉 All unit tests passed cleanly!')

