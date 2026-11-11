import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const migrationsDir = path.resolve(__dirname, '../migrations')

function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const iterations = 100000
  const derived = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256')
  return 'pbkdf2$' + iterations + '$' + salt.toString('base64') + '$' + derived.toString('base64')
}

const escapeSql = (str) => (str ? str.replace(/'/g, "''") : '')

// 1. Industries Definition
const industriesData = {
  peptide: {
    label: "Peptides & Research Chemicals",
    description: "Standard compliance, legal, and operational document requirements for peptide and research chemical merchants.",
    intro: "Welcome to AHG Pay — the payments and growth partner for peptide and research chemical brands. Submit the required corporate records, bank statements, and lab/compliance verification items below.",
    licensingNote: "Peptide vendor invoices, safety data sheets (SDS if no COAs), 3PL fulfillment agreements, and website research compliance disclaimers. Contact for West Town Checking Accounts: Ross Sloan (rsloan@dartbank.com), Caitlin Berlin (cberlin@dartbank.com).",
    sections: [
      {
        id: "core",
        title: "Core Documents",
        description: "Essential legal identification for business entity and owners.",
        documents: [
          { type: 101, name: "Articles of Incorporation", description: "State-filed formation document.", required: true, tag: null },
          { type: 102, name: "SS4/EIN Letter", description: "Official IRS tax ID confirmation.", required: true, tag: null },
          { type: 103, name: "Voided Check OR Signed Bank Letter", description: "Pre-printed check or signed bank officer letter for settlements.", required: true, tag: null },
          { type: 104, name: "Driver's Licenses (up to 4)", description: "Color photo ID for all 25%+ equity owners.", required: true, tag: null },
          { type: 105, name: "Operating Agreement(LLC) Bylaws (Corp)", description: "Internal governance and signatory authority docs.", required: false, tag: null }
        ]
      },
      {
        id: "financial",
        title: "Financial Documents",
        description: "Required to establish volume tiers and underwriting limits.",
        documents: [
          { type: 201, name: "3 Months Bank Statements (personal if no business)", description: "All pages of primary operating account (personal if no business).", required: true, tag: null },
          { type: 202, name: "3 Months Most Recent Processing Statements", description: "Current/prior merchant processing history (or N/A).", required: false, tag: null },
          { type: 203, name: "2 Years Financials for all Applications", description: "Balance sheet, P&L, or signed tax filings for underwriting review.", required: false, tag: null }
        ]
      },
      {
        id: "peptide_compliance",
        title: "Peptide-Specific Documents",
        description: "Critical risk mitigation documents required for high-risk underwriting.",
        documents: [
          { type: 301, name: "Website Compliance", description: "Terms of Service, Privacy Policy, and Refund Policy with legal entity name matching government filings; phone and customer service email in contact area; research disclaimer audit.", required: true, tag: null },
          { type: 302, name: "Fulfillment Agreement (if using 3PL)", description: "Proof of warehousing and fulfillment logistics (if using 3PL).", required: false, tag: null },
          { type: 303, name: "Site/Inventory Photos", description: "Clear photos of current inventory, storage, and packaging facility.", required: false, tag: null },
          { type: 304, name: "KYC Doc (Completed via Google Form)", description: "Detailed beneficial owner and product questionnaire.", required: true, tag: "Google Form", formUrl: "https://docs.google.com/forms" },
          { type: 305, name: "Safety Data Sheet if no COAs (Google Form)", description: "Manufacturer or supplier SDS for primary catalog items (if no COAs).", required: false, tag: "Google Form" },
          { type: 306, name: "Outside Vendor Invoices", description: "Recent commercial invoices from active suppliers.", required: false, tag: null },
          { type: 307, name: "Proof of Domain Ownership", description: "Registrar receipt or WHOIS record showing company as owner.", required: true, tag: null },
          { type: 308, name: "Top 10 Customer List", description: "Brief summary of revenue concentration and best-selling SKUs.", required: false, tag: null }
        ]
      },
      {
        id: "signatures",
        title: "Signature Documents",
        description: "Standard merchant agreements requiring verified e-signatures.",
        documents: [
          { type: 501, name: "Compliance Monitoring Form", description: "Monthly third-party web compliance scan authorization.", required: true, tag: "Signature Doc" },
          { type: 502, name: "Reserve Acknowledgement", description: "Rolling reserve policy terms and sign-off.", required: true, tag: "Signature Doc" },
          { type: 503, name: "Peptide Addendum", description: "Specialized peptide industry terms and conditions.", required: true, tag: "Signature Doc" },
          { type: 504, name: "WTP Sole Member Affidavit (single-member LLC)", description: "Required for single-member LLCs or sole proprietorships.", required: false, tag: "Signature Doc" }
        ]
      }
    ]
  },
  hemp: {
    label: "Hemp & CBD Industry",
    description: "Farm Bill compliance, COA certificates, and state licensing requirements for Hemp/CBD merchants.",
    intro: "Welcome to AHG Pay — the payments and growth partner for hemp and CBD brands. Please submit your core corporate filings, recent banking statements, full-panel lab certificates, and required addenda below.",
    licensingNote: "Hemp grower/processor licenses or state food permits (required for edibles in CO, CT, FL, TX, GA, IA, ME, MI, RI), third-party lab COAs (<0.3% Delta-9 THC; 12 months for West Town, 23 months for Argyle), online COAs, and complete product list. Mandatory FDA footer disclaimer on all pages. Contact for West Town Checking Accounts: Ross Sloan (rsloan@dartbank.com), Caitlin Berlin (cberlin@dartbank.com).",
    sections: [
      {
        id: "core",
        title: "Core Documents",
        description: "Essential legal identification for business entity and owners.",
        documents: [
          { type: 101, name: "Articles of Incorporation", description: "State-filed formation document.", required: true, tag: null },
          { type: 102, name: "SS4/EIN Letter", description: "Official IRS tax ID confirmation.", required: true, tag: null },
          { type: 103, name: "Voided Check OR Signed Bank Letter", description: "Pre-printed check or signed bank officer letter for settlements.", required: true, tag: null },
          { type: 104, name: "Driver's Licenses (up to 4)", description: "Color photo ID for all 25%+ equity owners.", required: true, tag: null },
          { type: 105, name: "Operating Agreement(LLC) Bylaws (Corp)", description: "Internal governance and signatory authority docs.", required: false, tag: null }
        ]
      },
      {
        id: "financial",
        title: "Financial Documents",
        description: "Required to establish volume tiers and underwriting limits.",
        documents: [
          { type: 201, name: "3 Months Bank Statements (personal if no business)", description: "All pages of primary operating account (personal if no business).", required: true, tag: null },
          { type: 202, name: "3 Months Most Recent Processing Statements", description: "Current/prior merchant processing history (if available).", required: false, tag: null },
          { type: 203, name: "2 Years Financials for all Applications", description: "Balance sheet, P&L, or signed tax filings for high limits.", required: false, tag: null }
        ]
      },
      {
        id: "hemp_compliance",
        title: "Hemp-Specific Documents",
        description: "Mandatory agricultural and lab testing documentation.",
        documents: [
          { type: 401, name: "COAs (12 months if not on website)", description: "Third-party lab certificates of analysis showing < 0.3% Delta-9 THC (12 months for West Town, 23 months for Argyle).", required: true, tag: null },
          { type: 402, name: "Hemp License OR Hemp Food Permit", description: "State Department of Agriculture license or registration (mandatory for edibles in CO, CT, FL, TX, GA, IA, ME, MI, RI).", required: true, tag: null },
          { type: 301, name: "Website Compliance", description: "Terms of Service, Privacy Policy, and Refund Policy matching legal entity; phone & email in contact area; mandatory FDA footer statement: 'These statements have not been evaluated by the FDA. Products are not intended to diagnose, treat, cure, or prevent any disease. Products contain <0.3% Delta-9 THC, compliant with 2018 Farm Bill. Consult healthcare provider before use if pregnant, nursing, taking medications, or have medical conditions. Use responsibly.'", required: true, tag: null },
          { type: 302, name: "Fulfillment Agreement (if using 3PL)", description: "Proof of warehousing and fulfillment logistics (if using 3PL).", required: false, tag: null },
          { type: 303, name: "Site/Inventory Photos", description: "Photos of inventory, storage, and packaging facility.", required: false, tag: null },
          { type: 309, name: "Product List for eComm / COA Zip File for Retail", description: "Complete product catalog of all alternative products (CBD, THC, hemp) or retail COA ZIP file.", required: false, tag: null },
          { type: 307, name: "Proof of Domain Ownership", description: "Registrar receipt showing company as registrant.", required: true, tag: null }
        ]
      },
      {
        id: "signatures",
        title: "Signature Documents",
        description: "Standard merchant agreements requiring verified e-signatures.",
        documents: [
          { type: 501, name: "Compliance Monitoring Form", description: "Monthly third-party web compliance scan authorization.", required: true, tag: "Signature Doc" },
          { type: 502, name: "Reserve Acknowledgement", description: "Rolling reserve policy terms and sign-off.", required: true, tag: "Signature Doc" },
          { type: 504, name: "WTP Sole Member Affidavit (single-member LLC)", description: "Required for single-member LLCs or sole proprietorships.", required: false, tag: "Signature Doc" },
          { type: 507, name: "Argyle Hemp EDD Worksheet", description: "Enhanced due diligence worksheet for Argyle processing.", required: false, tag: "Signature Doc" },
          { type: 508, name: "Argyle File Build Form (retail w/ terminal)", description: "Retail setup form with physical card terminal (if applicable).", required: false, tag: "Signature Doc" },
          { type: 509, name: "Argyle Free Terminal Form (if marked by Sales)", description: "Free terminal agreement (if marked by sales).", required: false, tag: "Signature Doc" },
          { type: 511, name: "Argyle NABCO Cross-Corp Agreement", description: "Cross-corporate indemnity for multiple related entities.", required: false, tag: "Signature Doc" }
        ]
      }
    ]
  },
  general: {
    label: "General High-Risk Industry",
    description: "Standard compliance requirements for general high-risk e-commerce, nutraceuticals, services, and ACH accounts.",
    intro: "Welcome to AHG Pay — high-risk payment processing and underwriting partner. Please submit the required core corporate records and financial documentation below.",
    licensingNote: "State regulatory licenses, trade registrations, and applicable professional permits. Policies must display legal entity name, phone, and customer service email. Contact for West Town Checking Accounts: Ross Sloan (rsloan@dartbank.com), Caitlin Berlin (cberlin@dartbank.com).",
    sections: [
      {
        id: "core",
        title: "Core Documents",
        description: "Essential legal identification for business entity and owners.",
        documents: [
          { type: 101, name: "Articles of Incorporation", description: "State-filed formation document.", required: true, tag: null },
          { type: 102, name: "SS4/EIN Letter or Tax Return", description: "Official IRS tax ID confirmation or completed tax return.", required: true, tag: null },
          { type: 103, name: "Voided Check OR Signed Bank Letter", description: "Pre-printed check or signed bank officer letter for settlements.", required: true, tag: null },
          { type: 104, name: "Driver's Licenses (up to 4)", description: "Color photo ID for all 25%+ equity owners.", required: true, tag: null },
          { type: 105, name: "Operating Agreement(LLC) Bylaws (Corp)", description: "Internal company governance and signatory authority docs.", required: false, tag: null },
          { type: 106, name: "Utility Bill for Business Address", description: "Recent utility bill for physical business address verification (for ACH / Low-Risk accounts).", required: false, tag: null }
        ]
      },
      {
        id: "financial",
        title: "Financial Documents",
        description: "Required to establish volume tiers and underwriting limits.",
        documents: [
          { type: 201, name: "3 Months Bank Statements (personal if no business)", description: "Recent primary operating account statements (2 months for ACH, 3 months for card processing; personal if no business).", required: true, tag: null },
          { type: 202, name: "3 Months Most Recent Processing Statements", description: "Current/prior merchant processing history (if available).", required: false, tag: null },
          { type: 203, name: "2 Years Financials for all Applications", description: "Balance sheet, P&L, or signed tax filings for high limits.", required: false, tag: null }
        ]
      },
      {
        id: "compliance",
        title: "Compliance Documents",
        description: "Operational, inventory, and online compliance verification.",
        documents: [
          { type: 301, name: "Website Compliance", description: "Terms of Service, Privacy Policy, and Refund Policy with legal entity name matching government filings; phone and customer service email in contact area.", required: true, tag: null },
          { type: 302, name: "Fulfillment Agreement (if using 3PL)", description: "Proof of warehousing and fulfillment logistics (if using 3PL).", required: false, tag: null },
          { type: 303, name: "Site/Inventory Photos", description: "Photos of inventory, storage, and packaging facility.", required: false, tag: null },
          { type: 307, name: "Proof of Domain Ownership", description: "Registrar receipt showing company as registrant.", required: true, tag: null }
        ]
      },
      {
        id: "signatures",
        title: "Signature Documents",
        description: "Standard merchant agreements requiring verified e-signatures.",
        documents: [
          { type: 501, name: "Compliance Monitoring Form", description: "Monthly third-party web compliance scan authorization.", required: true, tag: "Signature Doc" },
          { type: 502, name: "Reserve Acknowledgement", description: "Rolling reserve policy terms and sign-off.", required: true, tag: "Signature Doc" },
          { type: 504, name: "WTP Sole Member Affidavit (single-member LLC)", description: "Required for single-member LLCs or sole proprietorships.", required: false, tag: "Signature Doc" }
        ]
      }
    ]
  },
  kratom: {
    label: "Kratom Products",
    description: "Farm Bill & state botanical compliance, lab COAs, and underwriting requirements for Kratom merchants.",
    intro: "Welcome to AHG Pay — the payments and growth partner for kratom and botanical brands. Please submit your core corporate filings, recent banking statements, full-panel lab COAs, and merchant compliance addenda below.",
    licensingNote: "12-23 months third-party lab COAs for all kratom alkaloid profiles, online COA portal links, complete e-commerce product catalog, and state AKA compliance verification. Contact for West Town Checking Accounts: Ross Sloan (rsloan@dartbank.com), Caitlin Berlin (cberlin@dartbank.com).",
    sections: [
      {
        id: "core",
        title: "Core Documents",
        description: "Essential legal identification for business entity and owners.",
        documents: [
          { type: 101, name: "Articles of Incorporation", description: "State-filed formation document.", required: true, tag: null },
          { type: 102, name: "SS4/EIN Letter", description: "Official IRS tax ID confirmation.", required: true, tag: null },
          { type: 103, name: "Voided Check OR Signed Bank Letter", description: "Pre-printed check or signed bank officer letter for settlements.", required: true, tag: null },
          { type: 104, name: "Driver's Licenses (max 2-4)", description: "Color photo ID for all 25%+ equity owners.", required: true, tag: null },
          { type: 105, name: "Operating Agreement(LLC) Bylaws (Corp)", description: "Internal governance and signatory authority docs.", required: false, tag: null }
        ]
      },
      {
        id: "financial",
        title: "Financial Documents",
        description: "Required to establish volume tiers and underwriting limits.",
        documents: [
          { type: 201, name: "3 Months Bank Statements (personal if no business)", description: "All pages of primary operating account (personal if no business).", required: true, tag: null },
          { type: 202, name: "3 Months Most Recent Processing Statements", description: "Current/prior merchant processing history (if available).", required: false, tag: null },
          { type: 203, name: "2 Years Financials for all Applications", description: "Balance sheet, P&L, or signed tax filings for high limits.", required: false, tag: null }
        ]
      },
      {
        id: "kratom_compliance",
        title: "Kratom-Specific Documents",
        description: "Mandatory botanical lab testing, product listings, and risk mitigation.",
        documents: [
          { type: 401, name: "COAs (12 months if not on website / 23 months for Argyle)", description: "Third-party lab certificates showing alkaloid breakdown, heavy metals, and microbials (12 months for West Town, 23 months for Argyle).", required: true, tag: null },
          { type: 309, name: "Product List for eComm / COA Zip File for Retail", description: "Complete product catalog of all kratom strains and formats (or retail COA ZIP file).", required: true, tag: null },
          { type: 301, name: "Website Compliance", description: "Terms of Service, Privacy Policy, and Refund Policy matching legal entity; phone & email in contact area; AKA and state age restriction disclosures audit.", required: true, tag: null },
          { type: 302, name: "Fulfillment Agreement (if using 3PL)", description: "Proof of warehousing, packaging, and fulfillment logistics (if using 3PL).", required: false, tag: null },
          { type: 303, name: "Site/Inventory Photos", description: "Clear photos of current inventory whether merchant or 3PL ships.", required: false, tag: null },
          { type: 307, name: "Proof of Domain Ownership", description: "Registrar receipt or WHOIS record showing company as registrant.", required: true, tag: null }
        ]
      },
      {
        id: "signatures",
        title: "Signature Documents",
        description: "Standard merchant agreements requiring verified e-signatures.",
        documents: [
          { type: 501, name: "Compliance Monitoring Form", description: "Monthly third-party web compliance scan authorization.", required: true, tag: "Signature Doc" },
          { type: 502, name: "Reserve Acknowledgement", description: "Rolling reserve policy terms and sign-off.", required: true, tag: "Signature Doc" },
          { type: 505, name: "Argyle Kratom Addendum", description: "Specialized kratom industry terms and processing addendum.", required: true, tag: "Signature Doc" },
          { type: 504, name: "WTP Sole Member Affidavit (single-member LLC)", description: "Required for single-member LLCs or sole proprietorships.", required: false, tag: "Signature Doc" },
          { type: 508, name: "Argyle File Build Form (retail w/ terminal)", description: "Retail setup form with physical card terminal (if applicable).", required: false, tag: "Signature Doc" },
          { type: 509, name: "Argyle Free Terminal Form (if marked by Sales)", description: "Free terminal agreement (if marked by sales).", required: false, tag: "Signature Doc" },
          { type: 511, name: "Argyle NABCO Cross-Corp Agreement", description: "Cross-corporate indemnity for multiple related entities.", required: false, tag: "Signature Doc" },
          { type: 510, name: "SSB Policy Exception Waiver (No Reserve)", description: "Exception request waiver for qualifying high-volume merchants.", required: false, tag: "Signature Doc" }
        ]
      }
    ]
  },
  mushroom: {
    label: "Metocin & Functional Mushroom",
    description: "Specialty compliance, lab testing, and underwriting for metocin, amanita, and functional mushroom vendors.",
    intro: "Welcome to AHG Pay — payments and underwriting for functional mushroom and specialty botanical merchants. Submit your corporate records, banking history, third-party lab certificates, and required addenda below.",
    licensingNote: "Third-party COAs (<0.3% Delta-9 THC / compliant alkaloids; 12 months for West Town, 23 months for Argyle), published online product catalog, and mandatory website shipping disclaimer: 'We do not ship Amanita products to the state of Louisiana.' Contact for West Town Checking Accounts: Ross Sloan (rsloan@dartbank.com), Caitlin Berlin (cberlin@dartbank.com).",
    sections: [
      {
        id: "core",
        title: "Core Documents",
        description: "Essential legal identification for business entity and owners.",
        documents: [
          { type: 101, name: "Articles of Incorporation", description: "State-filed formation document.", required: true, tag: null },
          { type: 102, name: "SS4/EIN Letter", description: "Official IRS tax ID confirmation.", required: true, tag: null },
          { type: 103, name: "Voided Check OR Signed Bank Letter", description: "Pre-printed check or signed bank officer letter for settlements.", required: true, tag: null },
          { type: 104, name: "Driver's Licenses (max 2-4)", description: "Color photo ID for all 25%+ equity owners.", required: true, tag: null },
          { type: 105, name: "Operating Agreement(LLC) Bylaws (Corp)", description: "Internal governance and signatory authority docs.", required: false, tag: null }
        ]
      },
      {
        id: "financial",
        title: "Financial Documents",
        description: "Required to establish volume tiers and underwriting limits.",
        documents: [
          { type: 201, name: "3 Months Bank Statements (personal if no business)", description: "All pages of primary operating account (personal if no business).", required: true, tag: null },
          { type: 202, name: "3 Months Most Recent Processing Statements", description: "Current/prior merchant processing history (if available).", required: false, tag: null },
          { type: 203, name: "2 Years Financials for all Applications", description: "Balance sheet, P&L, or signed tax filings for high limits.", required: false, tag: null }
        ]
      },
      {
        id: "mushroom_compliance",
        title: "Mushroom-Specific Documents",
        description: "Critical risk mitigation, full panel COAs, and product catalog audits.",
        documents: [
          { type: 401, name: "COAs (12 months if not on website / 23 months for Argyle)", description: "Third-party lab certificates of analysis for all functional mushroom & alkaloid formulations (12 months for West Town, 23 months for Argyle).", required: true, tag: null },
          { type: 309, name: "Product List for eComm / COA Zip File for Retail", description: "Complete list of all alternative products sold online (or retail COA ZIP file).", required: true, tag: null },
          { type: 301, name: "Website Compliance", description: "Terms of Service, Privacy Policy, and Refund Policy matching legal entity; phone & email in contact area; mandatory Louisiana shipping restriction audit: 'We do not ship Amanita products to the state of Louisiana.'", required: true, tag: null },
          { type: 302, name: "Fulfillment Agreement (if using 3PL)", description: "Proof of warehousing, packaging, and fulfillment logistics (if using 3PL).", required: false, tag: null },
          { type: 303, name: "Site/Inventory Photos", description: "Clear photos of current inventory and packaging facility.", required: false, tag: null },
          { type: 307, name: "Proof of Domain Ownership", description: "Registrar receipt or WHOIS record showing company as registrant.", required: true, tag: null }
        ]
      },
      {
        id: "signatures",
        title: "Signature Documents",
        description: "Standard merchant agreements requiring verified e-signatures.",
        documents: [
          { type: 501, name: "Compliance Monitoring Form", description: "Monthly third-party web compliance scan authorization.", required: true, tag: "Signature Doc" },
          { type: 502, name: "Reserve Acknowledgement", description: "Rolling reserve policy terms and sign-off.", required: true, tag: "Signature Doc" },
          { type: 506, name: "Argyle Mushroom Addendum", description: "Specialized functional mushroom terms and conditions.", required: true, tag: "Signature Doc" },
          { type: 504, name: "WTP Sole Member Affidavit (single-member LLC)", description: "Required for single-member LLCs or sole proprietorships.", required: false, tag: "Signature Doc" },
          { type: 508, name: "Argyle File Build Form (retail w/ terminal)", description: "Retail setup form with physical card terminal (if applicable).", required: false, tag: "Signature Doc" },
          { type: 509, name: "Argyle Free Terminal Form (if marked by Sales)", description: "Free terminal agreement (if marked by sales).", required: false, tag: "Signature Doc" },
          { type: 511, name: "Argyle NABCO Cross-Corp Agreement", description: "Cross-corporate indemnity for multiple related entities.", required: false, tag: "Signature Doc" }
        ]
      }
    ]
  },
  medical_telehealth: {
    label: "Medical & Telehealth",
    description: "Healthcare practitioner licensing, pharmacy board registration, and LegitScript compliance for telehealth.",
    intro: "Welcome to AHG Pay — dedicated underwriting and merchant processing for medical practices, clinics, and telehealth providers. Please submit your medical licenses, pharmacy board registrations, LegitScript credentials, and corporate records below.",
    licensingNote: "LegitScript healthcare merchant certification, active state board of pharmacy licenses for each state served, practitioner licensing for owners, and clinical compliance policies. Contact for West Town Checking Accounts: Ross Sloan (rsloan@dartbank.com), Caitlin Berlin (cberlin@dartbank.com).",
    sections: [
      {
        id: "core",
        title: "Core Documents",
        description: "Essential legal identification for business entity and owners.",
        documents: [
          { type: 101, name: "Articles of Incorporation", description: "State-filed professional corporation (PC/PLLC) or LLC formation.", required: true, tag: null },
          { type: 102, name: "SS4/EIN Letter", description: "Official IRS tax ID confirmation.", required: true, tag: null },
          { type: 103, name: "Voided Check OR Signed Bank Letter", description: "Pre-printed check or signed bank officer letter for settlements.", required: true, tag: null },
          { type: 104, name: "Driver's Licenses (up to 4)", description: "Color photo ID for all 25%+ equity owners and managing physicians.", required: true, tag: null },
          { type: 105, name: "Operating Agreement(LLC) Bylaws (Corp)", description: "Professional entity bylaws or operating agreement.", required: false, tag: null }
        ]
      },
      {
        id: "financial",
        title: "Financial Documents",
        description: "Required to establish volume tiers and underwriting limits.",
        documents: [
          { type: 201, name: "3 Months Bank Statements (personal if no business)", description: "All pages of primary business operating account (personal if no business).", required: true, tag: null },
          { type: 202, name: "3 Months Most Recent Processing Statements", description: "Current/prior merchant processing history (if available).", required: false, tag: null },
          { type: 203, name: "2 Years Financials for all Applications", description: "Balance sheet, P&L, or signed tax filings for high volume limits.", required: false, tag: null }
        ]
      },
      {
        id: "telehealth_compliance",
        title: "Telehealth-Specific Documents",
        description: "Mandatory clinical credentials, pharmacy licensing, and telehealth protocols.",
        documents: [
          { type: 313, name: "Telehealth & Online Pharmacy Questionnaire", description: "Clinical protocols, intake forms, and prescription fulfillment workflow questionnaire.", required: true, tag: "Google Form", formUrl: "https://docs.google.com/forms" },
          { type: 310, name: "LegitScript Certification", description: "LegitScript Healthcare Merchant Certification seal and approval letter.", required: true, tag: null },
          { type: 311, name: "State Board Pharmacy Licenses", description: "Active state board pharmacy licenses for each state in which medications are dispensed.", required: false, tag: "Wait to Request" },
          { type: 312, name: "Copy of Pharmacy / Practitioner License (Each Owner)", description: "Copy of active medical or pharmacy licenses for all owners and supervising practitioners.", required: true, tag: null },
          { type: 301, name: "Website Compliance", description: "Terms of Service, Privacy Policy, HIPAA statement, and consultation workflow; phone & email in contact area; legal entity matching government filings.", required: true, tag: null },
          { type: 302, name: "Fulfillment Agreement (if using 3PL)", description: "Contract with partner dispensing pharmacy or 3PL logistics provider.", required: false, tag: null },
          { type: 307, name: "Proof of Domain Ownership", description: "Registrar receipt showing company or practice as domain owner.", required: true, tag: null }
        ]
      },
      {
        id: "signatures",
        title: "Signature Documents",
        description: "Standard merchant agreements requiring verified e-signatures.",
        documents: [
          { type: 501, name: "Compliance Monitoring Form", description: "Monthly third-party web compliance scan authorization.", required: true, tag: "Signature Doc" },
          { type: 502, name: "Reserve Acknowledgement", description: "Rolling reserve policy terms and sign-off.", required: true, tag: "Signature Doc" },
          { type: 504, name: "WTP Sole Member Affidavit (single-member LLC)", description: "Required for single-member LLCs or sole proprietorships.", required: false, tag: "Signature Doc" }
        ]
      }
    ]
  },
  nonprofit: {
    label: "Nonprofit Organizations",
    description: "501(c)(3)/(4) verification, board governance, and donation processing underwriting.",
    intro: "Welcome to AHG Pay — secure donation and payment processing for non-profit and charitable organizations. Please submit your IRS determination letter, board documentation, bank records, and governance bylaws below.",
    licensingNote: "IRS 501(c)(3) or 501(c)(4) tax-exempt determination letter, current Board of Directors roster and meeting minutes, and donation transparency disclosures.",
    sections: [
      {
        id: "core",
        title: "Core Documents",
        description: "Essential legal identification and IRS status for non-profit entities.",
        documents: [
          { type: 101, name: "Articles of Incorporation", description: "State-filed non-profit charter or articles of incorporation.", required: true, tag: null },
          { type: 102, name: "SS4/EIN Letter", description: "Official IRS tax ID confirmation.", required: true, tag: null },
          { type: 103, name: "Voided Check OR Signed Bank Letter", description: "Pre-printed check or signed bank officer letter for settlements.", required: true, tag: null },
          { type: 104, name: "Driver's Licenses of Responsible Party", description: "Color photo ID for Executive Director, President, or authorized officer.", required: true, tag: null },
          { type: 105, name: "Bylaws (Corp) / Operating Agreement", description: "Signed organization bylaws detailing officer authority and voting rules.", required: true, tag: null },
          { type: 107, name: "Proof of Non-Profit Status (501(c)(3) or (4))", description: "IRS Tax-Exempt Status Determination Letter.", required: true, tag: null },
          { type: 108, name: "Doc Indicating Board of Directors if not Apparent", description: "Current roster of Board of Directors and document indicating board of directors if not apparent.", required: true, tag: null },
          { type: 109, name: "Minutes", description: "Recent meeting minutes of board meetings.", required: false, tag: null }
        ]
      },
      {
        id: "financial",
        title: "Financial Documents",
        description: "Operating account banking history and grant or sponsorship records.",
        documents: [
          { type: 201, name: "3 Months Bank Statements (personal if no business)", description: "All pages of primary non-profit checking account (personal if no business).", required: true, tag: null },
          { type: 202, name: "3 Months Most Recent Processing Statements", description: "Current donation processing or merchant statements (if available).", required: false, tag: null },
          { type: 314, name: "Copy of Agreement Between Parties", description: "Copy of agreement between parties or fiscal sponsorship memorandum.", required: false, tag: null }
        ]
      },
      {
        id: "nonprofit_compliance",
        title: "Nonprofit-Specific Documents",
        description: "Public donor disclosures, refund policies, and governance transparency.",
        documents: [
          { type: 301, name: "Website Compliance", description: "Donation refund policy, privacy policy, 501(c) disclosure, phone and email in contact area.", required: true, tag: null },
          { type: 307, name: "Proof of Domain Ownership", description: "Registrar receipt showing organization as domain owner.", required: true, tag: null }
        ]
      },
      {
        id: "signatures",
        title: "Signature Documents",
        description: "Standard merchant agreements requiring verified e-signatures.",
        documents: [
          { type: 501, name: "Compliance Monitoring Form", description: "Monthly web compliance and donation processing authorization.", required: true, tag: "Signature Doc" },
          { type: 502, name: "Reserve Acknowledgement", description: "Settlement terms and payout schedule sign-off.", required: true, tag: "Signature Doc" }
        ]
      }
    ]
  }
}

// 2. Global Configurations
const uploadRules = {
  maxBytes: 26214400,
  acceptedMimeTypes: [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv"
  ],
  acceptedExtensions: [".pdf", ".png", ".jpg", ".jpeg", ".docx", ".xlsx", ".csv"]
}

const portalDefaults = {
  primaryColor: "#02F1DE",
  accentColor: "#1A1A1A",
  title: "Merchant Document Upload Portal",
  description: "Secure underwriting and merchant document upload portal."
}

const branding = {
  brandName: "AHG Pay",
  logoUrl: "https://s3.us-west-1.amazonaws.com/hyfin.app/uploads/prod/App/6a4c6ed97642e3ccb1be6002/7989e026-738c-4931-80ed-27d38fc9dbe0/primary.png?ts=1783649431327",
  websiteUrl: "https://ahgpay.com",
  tagline: "The payments and growth partner for high-risk, peptide, and hemp brands.",
  footerText: "High-Risk Payment Processing & Underwriting"
}

const supportContact = {
  name: "Greg Garfinkel",
  role: "Dedicated Onboarding Specialist",
  email: "ggarfinkel@ahgpay.com ",
  phone: "+1-754-732-3744",
  helpText: "Need help? Contact AHG Underwriting Support at support@ahgpay.com or call +1-754-732-3744."
}

const adminPasswordHash = hashPassword("admin1234")

// 2b. HighLevel Deal Stages Mapping (1..5)
const merchantStages = [
  { value: 1, name: "Onboarding booked", aliases: ["96f0eb52-c557-45c8-b467-d2cce611ffb2"] },
  { value: 2, name: "Doc Collection", aliases: ["c0a4f6f4-1160-4286-8725-a5a4b38beed1"] },
  { value: 3, name: "Application in review", aliases: ["3d89d46a-064b-4da0-8126-fd4685b84955"] },
  { value: 4, name: "Approved", aliases: ["49522dbe-98b8-4f9e-8eee-06ae6d153955"] },
  { value: 5, name: "Live and processing", aliases: ["fdbd8d76-3cb9-481a-8bed-dc8d9b75cb0a"] }
]

// 2c. Canonical Processors List
const processors = [
  "Argyle - NABCO",
  "Argyle - SSB",
  "Argyle - PB&T",
  "West Town",
  "North",
  "Nuvei",
  "ACH Processing",
  "WIZLO",
  "RedFish"
]

// 2d. HighLevel Field Mapping
const ghlFieldMap = {
  industry_type: {
    id: "iT881KYvOCWyTSXzqFEe",
    fieldKey: "opportunity.industry_type"
  },
  processor: {
    id: "hhQbzTtgTFsFT1ngiHCt",
    fieldKey: "opportunity.processor"
  }
}

// 2e. HighLevel Industry Type to Industry Key Mapping
const ghlIndustryMap = {
  "hemp": "hemp",
  "kratom/kava": "kratom",
  "mushroom": "mushroom",
  "nutraceuticals": "general",
  "telehealth": "medical_telehealth",
  "service-based": "general",
  "high-ticket": "general",
  "rd peptides": "peptide",
  "other": "general"
}

// 3. Merchants with 20-character GHL Opportunity IDs
const merchantsData = [
  {
    "id": "HSMXZscgy7SwyCmz9QbF",
    "name": "Drift Peptides",
    "industry": "peptide",
    "status": 1,
    "processor": "West Town"
  },
  {
    "id": "paEsR4kb92LwvXbx1NJA",
    "name": "The Health Depot of Doral",
    "industry": "medical_telehealth",
    "status": 1,
    "processor": "West Town"
  },
  {
    "id": "SRGg3SnZGzq82VEXgCL0",
    "name": "Onyx BioLabs",
    "industry": "peptide",
    "status": 1,
    "processor": "Argyle - PB&T"
  },
  {
    "id": "8hBomfETaBEIt1EWFiBP",
    "name": "Strng Seeds",
    "industry": "hemp",
    "status": 5,
    "processor": "West Town"
  },
  {
    "id": "qQrzh2Wy4aqRyoGU7InW",
    "name": "HyperBloom USA",
    "industry": "general",
    "status": 1,
    "processor": "West Town"
  },
  {
    "id": "aLLgccuTI6BgFDa6DAUQ",
    "name": "Yuno RX - WIZLO",
    "industry": "medical_telehealth",
    "status": 5,
    "processor": "WIZLO"
  },
  {
    "id": "MhHv54RkIdTo2uJK36O6",
    "name": "Illinois Healthy Alternative Associations",
    "industry": "general",
    "status": 5,
    "processor": "West Town"
  },
  {
    "id": "knPbz2fLoYTzxX6IqIG6",
    "name": "Not Your Bakery",
    "industry": "hemp",
    "status": 1,
    "processor": "West Town"
  },
  {
    "id": "l4pmGJLuof4m7bKTMuaR",
    "name": "Veyron Biologics",
    "industry": "peptide",
    "status": 1,
    "processor": "Argyle - PB&T"
  },
  {
    "id": "Bxhi3Zxh9HNHqDEAePRS",
    "name": "Luxe RX",
    "industry": "general",
    "status": 1,
    "processor": "West Town"
  },
  {
    "id": "SQW7muSTaBoKUmVocFpO",
    "name": "Bluum Peptides",
    "industry": "peptide",
    "status": 5,
    "processor": "Argyle - PB&T"
  },
  {
    "id": "l1FctLH2ym7kII8ayy0k",
    "name": "Margo MD - WIZLO",
    "industry": "medical_telehealth",
    "status": 5,
    "processor": "WIZLO"
  },
  {
    "id": "uzkcWBZM8PrGnYaAaROd",
    "name": "Ignite Dispensary Bismarck",
    "industry": "hemp",
    "status": 5,
    "processor": "West Town"
  },
  {
    "id": "fTbnC2XJ9NKrjuJtj4U5",
    "name": "Ignite Dispensary Milwaukee",
    "industry": "hemp",
    "status": 5,
    "processor": "West Town"
  },
  {
    "id": "2rqjXaSYnZuJHxKHULD4",
    "name": "Peptidestrips",
    "industry": "peptide",
    "status": 1,
    "processor": "Argyle - PB&T"
  },
  {
    "id": "ZOoZi3VdxgrERke4XXjx",
    "name": "Verified Peptides Source",
    "industry": "peptide",
    "status": 1,
    "processor": "ACH Processing"
  },
  {
    "id": "5xdewYW14SGjIh2ShleI",
    "name": "Forge Labs",
    "industry": "peptide",
    "status": 1,
    "processor": "Argyle - PB&T"
  },
  {
    "id": "Eh5Gj2odWnvdajzTeCHe",
    "name": "Global BioProtect",
    "industry": "general",
    "status": 1,
    "processor": "ACH Processing"
  },
  {
    "id": "s5J7DcTHuWzXUip6UVnR",
    "name": "Peptides - Dean Kozora",
    "industry": "peptide",
    "status": 1,
    "processor": "Argyle - PB&T"
  }
]

// Assert that every merchant industry exists in industriesData
for (const m of merchantsData) {
  if (!industriesData[m.industry]) {
    throw new Error(`Merchant ${m.name} has unknown industry: ${m.industry}`)
  }
}

// 4. Documents Data with mix of Verified (2), Pending (1), and Rejected (3 with note)
const documentsData = [
  {
    "merchant_id": "SQW7muSTaBoKUmVocFpO",
    "document_type": 101,
    "status": 2,
    "note": null,
    "filename": "articles-bluum-llc.pdf",
    "daysAgo": 14
  },
  {
    "merchant_id": "SQW7muSTaBoKUmVocFpO",
    "document_type": 102,
    "status": 2,
    "note": null,
    "filename": "BluumLLC_ein_federal.pdf",
    "daysAgo": 14
  },
  {
    "merchant_id": "SQW7muSTaBoKUmVocFpO",
    "document_type": 103,
    "status": 2,
    "note": null,
    "filename": "boa-verification-letter-signed.pdf",
    "daysAgo": 12
  },
  {
    "merchant_id": "SQW7muSTaBoKUmVocFpO",
    "document_type": 104,
    "status": 3,
    "note": "Document scan is blurry. Please provide a high-resolution color PDF or scan of the front and back.",
    "filename": "nick-passport-blurry.pdf",
    "daysAgo": 10
  },
  {
    "merchant_id": "SQW7muSTaBoKUmVocFpO",
    "document_type": 201,
    "status": 2,
    "note": null,
    "filename": "Bank_eStmt_Last_3_Months.pdf",
    "daysAgo": 8
  },
  {
    "merchant_id": "SQW7muSTaBoKUmVocFpO",
    "document_type": 301,
    "status": 1,
    "note": null,
    "filename": "bluum-website-ownership-audit.pdf",
    "daysAgo": 3
  },
  {
    "merchant_id": "SQW7muSTaBoKUmVocFpO",
    "document_type": 302,
    "status": 1,
    "note": null,
    "filename": "fulfillment-3pl-agreement.pdf",
    "daysAgo": 2
  },
  {
    "merchant_id": "SQW7muSTaBoKUmVocFpO",
    "document_type": 501,
    "status": 2,
    "note": null,
    "filename": "compliance-monitoring-signed.pdf",
    "daysAgo": 5
  },
  {
    "merchant_id": "HSMXZscgy7SwyCmz9QbF",
    "document_type": 101,
    "status": 2,
    "note": null,
    "filename": "Drift_Articles_Of_Incorporation.pdf",
    "daysAgo": 20
  },
  {
    "merchant_id": "HSMXZscgy7SwyCmz9QbF",
    "document_type": 102,
    "status": 2,
    "note": null,
    "filename": "Drift_EIN_SS4.pdf",
    "daysAgo": 20
  },
  {
    "merchant_id": "HSMXZscgy7SwyCmz9QbF",
    "document_type": 103,
    "status": 2,
    "note": null,
    "filename": "Drift_Bank_Letter.pdf",
    "daysAgo": 18
  },
  {
    "merchant_id": "HSMXZscgy7SwyCmz9QbF",
    "document_type": 104,
    "status": 2,
    "note": null,
    "filename": "Drift_Owner_Passports.pdf",
    "daysAgo": 18
  },
  {
    "merchant_id": "HSMXZscgy7SwyCmz9QbF",
    "document_type": 201,
    "status": 2,
    "note": null,
    "filename": "Drift_Chase_Statements_3M.pdf",
    "daysAgo": 15
  },
  {
    "merchant_id": "HSMXZscgy7SwyCmz9QbF",
    "document_type": 301,
    "status": 2,
    "note": null,
    "filename": "Drift_Website_Review.pdf",
    "daysAgo": 12
  },
  {
    "merchant_id": "HSMXZscgy7SwyCmz9QbF",
    "document_type": 302,
    "status": 2,
    "note": null,
    "filename": "Drift_3PL_Logistics_Contract.pdf",
    "daysAgo": 10
  },
  {
    "merchant_id": "HSMXZscgy7SwyCmz9QbF",
    "document_type": 304,
    "status": 2,
    "note": null,
    "filename": "Drift_KYC_Questionnaire.pdf",
    "daysAgo": 8
  },
  {
    "merchant_id": "HSMXZscgy7SwyCmz9QbF",
    "document_type": 307,
    "status": 2,
    "note": null,
    "filename": "Drift_Domain_Ownership.pdf",
    "daysAgo": 8
  },
  {
    "merchant_id": "HSMXZscgy7SwyCmz9QbF",
    "document_type": 501,
    "status": 2,
    "note": null,
    "filename": "Drift_Monitoring_Agreement.pdf",
    "daysAgo": 7
  },
  {
    "merchant_id": "HSMXZscgy7SwyCmz9QbF",
    "document_type": 502,
    "status": 2,
    "note": null,
    "filename": "Drift_Reserve_Schedule.pdf",
    "daysAgo": 7
  },
  {
    "merchant_id": "HSMXZscgy7SwyCmz9QbF",
    "document_type": 503,
    "status": 2,
    "note": null,
    "filename": "Drift_Peptide_Addendum.pdf",
    "daysAgo": 7
  },
  {
    "merchant_id": "SRGg3SnZGzq82VEXgCL0",
    "document_type": 101,
    "status": 1,
    "note": null,
    "filename": "Onyx_Articles.pdf",
    "daysAgo": 2
  },
  {
    "merchant_id": "SRGg3SnZGzq82VEXgCL0",
    "document_type": 102,
    "status": 1,
    "note": null,
    "filename": "Onyx_EIN.pdf",
    "daysAgo": 2
  },
  {
    "merchant_id": "l4pmGJLuof4m7bKTMuaR",
    "document_type": 101,
    "status": 2,
    "note": null,
    "filename": "Veyron_Formation.pdf",
    "daysAgo": 25
  },
  {
    "merchant_id": "l4pmGJLuof4m7bKTMuaR",
    "document_type": 102,
    "status": 2,
    "note": null,
    "filename": "Veyron_EIN.pdf",
    "daysAgo": 25
  },
  {
    "merchant_id": "l4pmGJLuof4m7bKTMuaR",
    "document_type": 103,
    "status": 2,
    "note": null,
    "filename": "Veyron_Bank_Verification.pdf",
    "daysAgo": 24
  },
  {
    "merchant_id": "l4pmGJLuof4m7bKTMuaR",
    "document_type": 104,
    "status": 2,
    "note": null,
    "filename": "Veyron_Owner_ID.pdf",
    "daysAgo": 24
  },
  {
    "merchant_id": "l4pmGJLuof4m7bKTMuaR",
    "document_type": 201,
    "status": 2,
    "note": null,
    "filename": "Veyron_Bank_Statements.pdf",
    "daysAgo": 20
  },
  {
    "merchant_id": "l4pmGJLuof4m7bKTMuaR",
    "document_type": 301,
    "status": 2,
    "note": null,
    "filename": "Veyron_Web_Compliance.pdf",
    "daysAgo": 15
  },
  {
    "merchant_id": "l4pmGJLuof4m7bKTMuaR",
    "document_type": 302,
    "status": 2,
    "note": null,
    "filename": "Veyron_3PL_Agreement.pdf",
    "daysAgo": 15
  },
  {
    "merchant_id": "l4pmGJLuof4m7bKTMuaR",
    "document_type": 304,
    "status": 2,
    "note": null,
    "filename": "Veyron_KYC_Submission.pdf",
    "daysAgo": 14
  },
  {
    "merchant_id": "l4pmGJLuof4m7bKTMuaR",
    "document_type": 307,
    "status": 2,
    "note": null,
    "filename": "Veyron_Domain_Proof.pdf",
    "daysAgo": 14
  },
  {
    "merchant_id": "l4pmGJLuof4m7bKTMuaR",
    "document_type": 501,
    "status": 2,
    "note": null,
    "filename": "Veyron_Compliance_Agreement.pdf",
    "daysAgo": 12
  },
  {
    "merchant_id": "l4pmGJLuof4m7bKTMuaR",
    "document_type": 502,
    "status": 2,
    "note": null,
    "filename": "Veyron_Reserve_Schedule.pdf",
    "daysAgo": 12
  },
  {
    "merchant_id": "l4pmGJLuof4m7bKTMuaR",
    "document_type": 503,
    "status": 2,
    "note": null,
    "filename": "Veyron_Peptide_Addendum.pdf",
    "daysAgo": 12
  },
  {
    "merchant_id": "8hBomfETaBEIt1EWFiBP",
    "document_type": 101,
    "status": 2,
    "note": null,
    "filename": "StrngSeeds_Articles.pdf",
    "daysAgo": 18
  },
  {
    "merchant_id": "8hBomfETaBEIt1EWFiBP",
    "document_type": 102,
    "status": 2,
    "note": null,
    "filename": "StrngSeeds_EIN.pdf",
    "daysAgo": 18
  },
  {
    "merchant_id": "8hBomfETaBEIt1EWFiBP",
    "document_type": 103,
    "status": 2,
    "note": null,
    "filename": "StrngSeeds_ACH_Letter.pdf",
    "daysAgo": 16
  },
  {
    "merchant_id": "8hBomfETaBEIt1EWFiBP",
    "document_type": 104,
    "status": 2,
    "note": null,
    "filename": "StrngSeeds_Cameron_ID.jpg",
    "daysAgo": 16
  },
  {
    "merchant_id": "8hBomfETaBEIt1EWFiBP",
    "document_type": 201,
    "status": 2,
    "note": null,
    "filename": "StrngSeeds_Bank_Statements.pdf",
    "daysAgo": 12
  },
  {
    "merchant_id": "8hBomfETaBEIt1EWFiBP",
    "document_type": 401,
    "status": 2,
    "note": null,
    "filename": "Hemp_COA_Batch2026.pdf",
    "daysAgo": 10
  },
  {
    "merchant_id": "8hBomfETaBEIt1EWFiBP",
    "document_type": 402,
    "status": 2,
    "note": null,
    "filename": "Hemp_Retail_License.pdf",
    "daysAgo": 10
  },
  {
    "merchant_id": "8hBomfETaBEIt1EWFiBP",
    "document_type": 301,
    "status": 2,
    "note": null,
    "filename": "Website_Compliance_Audit.pdf",
    "daysAgo": 8
  },
  {
    "merchant_id": "8hBomfETaBEIt1EWFiBP",
    "document_type": 307,
    "status": 2,
    "note": null,
    "filename": "Domain_Receipt.pdf",
    "daysAgo": 8
  },
  {
    "merchant_id": "8hBomfETaBEIt1EWFiBP",
    "document_type": 501,
    "status": 2,
    "note": null,
    "filename": "Compliance_Monitoring.pdf",
    "daysAgo": 6
  },
  {
    "merchant_id": "8hBomfETaBEIt1EWFiBP",
    "document_type": 502,
    "status": 2,
    "note": null,
    "filename": "Reserve_Acknowledgement.pdf",
    "daysAgo": 6
  },
  {
    "merchant_id": "knPbz2fLoYTzxX6IqIG6",
    "document_type": 101,
    "status": 2,
    "note": null,
    "filename": "NYB_Articles.pdf",
    "daysAgo": 9
  },
  {
    "merchant_id": "knPbz2fLoYTzxX6IqIG6",
    "document_type": 102,
    "status": 2,
    "note": null,
    "filename": "NYB_EIN.pdf",
    "daysAgo": 9
  },
  {
    "merchant_id": "knPbz2fLoYTzxX6IqIG6",
    "document_type": 103,
    "status": 1,
    "note": null,
    "filename": "NYB_Voided_Check.pdf",
    "daysAgo": 4
  },
  {
    "merchant_id": "knPbz2fLoYTzxX6IqIG6",
    "document_type": 104,
    "status": 3,
    "note": "Driver's license expired. Please upload an active, unexpired government-issued ID.",
    "filename": "NYB_Driver_License_Expired.pdf",
    "daysAgo": 4
  },
  {
    "merchant_id": "knPbz2fLoYTzxX6IqIG6",
    "document_type": 201,
    "status": 1,
    "note": null,
    "filename": "NYB_Operating_Statements.pdf",
    "daysAgo": 3
  },
  {
    "merchant_id": "knPbz2fLoYTzxX6IqIG6",
    "document_type": 401,
    "status": 1,
    "note": null,
    "filename": "NYB_Lab_COA.pdf",
    "daysAgo": 2
  },
  {
    "merchant_id": "MhHv54RkIdTo2uJK36O6",
    "document_type": 101,
    "status": 2,
    "note": null,
    "filename": "ILHAA_Articles.pdf",
    "daysAgo": 35
  },
  {
    "merchant_id": "MhHv54RkIdTo2uJK36O6",
    "document_type": 102,
    "status": 2,
    "note": null,
    "filename": "ILHAA_EIN.pdf",
    "daysAgo": 35
  },
  {
    "merchant_id": "MhHv54RkIdTo2uJK36O6",
    "document_type": 103,
    "status": 2,
    "note": null,
    "filename": "ILHAA_Check.pdf",
    "daysAgo": 32
  },
  {
    "merchant_id": "MhHv54RkIdTo2uJK36O6",
    "document_type": 104,
    "status": 2,
    "note": null,
    "filename": "ILHAA_Driver_License.pdf",
    "daysAgo": 32
  },
  {
    "merchant_id": "MhHv54RkIdTo2uJK36O6",
    "document_type": 201,
    "status": 2,
    "note": null,
    "filename": "ILHAA_Bank_Statements.pdf",
    "daysAgo": 30
  },
  {
    "merchant_id": "MhHv54RkIdTo2uJK36O6",
    "document_type": 501,
    "status": 2,
    "note": null,
    "filename": "ILHAA_Compliance.pdf",
    "daysAgo": 28
  },
  {
    "merchant_id": "MhHv54RkIdTo2uJK36O6",
    "document_type": 502,
    "status": 2,
    "note": null,
    "filename": "ILHAA_Reserve.pdf",
    "daysAgo": 28
  },
  {
    "merchant_id": "paEsR4kb92LwvXbx1NJA",
    "document_type": 101,
    "status": 2,
    "note": null,
    "filename": "health-depot-articles.pdf",
    "daysAgo": 10
  },
  {
    "merchant_id": "paEsR4kb92LwvXbx1NJA",
    "document_type": 102,
    "status": 2,
    "note": null,
    "filename": "health-depot-ein.pdf",
    "daysAgo": 10
  },
  {
    "merchant_id": "paEsR4kb92LwvXbx1NJA",
    "document_type": 103,
    "status": 1,
    "note": null,
    "filename": "health-depot-bank-letter.pdf",
    "daysAgo": 4
  },
  {
    "merchant_id": "paEsR4kb92LwvXbx1NJA",
    "document_type": 104,
    "status": 1,
    "note": null,
    "filename": "allan-gutierrez-id.pdf",
    "daysAgo": 4
  },
  {
    "merchant_id": "paEsR4kb92LwvXbx1NJA",
    "document_type": 201,
    "status": 1,
    "note": null,
    "filename": "bank-statements-3m.pdf",
    "daysAgo": 3
  },
  {
    "merchant_id": "paEsR4kb92LwvXbx1NJA",
    "document_type": 310,
    "status": 2,
    "note": null,
    "filename": "legitscript-certification.pdf",
    "daysAgo": 5
  },
  {
    "merchant_id": "paEsR4kb92LwvXbx1NJA",
    "document_type": 311,
    "status": 1,
    "note": null,
    "filename": "pharmacy-licenses.pdf",
    "daysAgo": 3
  },
  {
    "merchant_id": "paEsR4kb92LwvXbx1NJA",
    "document_type": 312,
    "status": 2,
    "note": null,
    "filename": "practitioner-medical-license.pdf",
    "daysAgo": 5
  },
  {
    "merchant_id": "paEsR4kb92LwvXbx1NJA",
    "document_type": 313,
    "status": 1,
    "note": null,
    "filename": "telehealth-intake-form.pdf",
    "daysAgo": 2
  },
  {
    "merchant_id": "paEsR4kb92LwvXbx1NJA",
    "document_type": 301,
    "status": 2,
    "note": null,
    "filename": "website-review.pdf",
    "daysAgo": 6
  },
  {
    "merchant_id": "paEsR4kb92LwvXbx1NJA",
    "document_type": 307,
    "status": 2,
    "note": null,
    "filename": "domain-ownership.pdf",
    "daysAgo": 6
  },
  {
    "merchant_id": "paEsR4kb92LwvXbx1NJA",
    "document_type": 501,
    "status": 1,
    "note": null,
    "filename": "compliance-monitoring.pdf",
    "daysAgo": 2
  },
  {
    "merchant_id": "paEsR4kb92LwvXbx1NJA",
    "document_type": 502,
    "status": 1,
    "note": null,
    "filename": "reserve-schedule.pdf",
    "daysAgo": 2
  },
  {
    "merchant_id": "aLLgccuTI6BgFDa6DAUQ",
    "document_type": 101,
    "status": 2,
    "note": null,
    "filename": "YunoRX_Articles.pdf",
    "daysAgo": 30
  },
  {
    "merchant_id": "aLLgccuTI6BgFDa6DAUQ",
    "document_type": 102,
    "status": 2,
    "note": null,
    "filename": "YunoRX_EIN.pdf",
    "daysAgo": 30
  },
  {
    "merchant_id": "aLLgccuTI6BgFDa6DAUQ",
    "document_type": 103,
    "status": 2,
    "note": null,
    "filename": "YunoRX_Bank_Letter.pdf",
    "daysAgo": 28
  },
  {
    "merchant_id": "aLLgccuTI6BgFDa6DAUQ",
    "document_type": 104,
    "status": 2,
    "note": null,
    "filename": "YunoRX_Owner_ID.pdf",
    "daysAgo": 28
  },
  {
    "merchant_id": "aLLgccuTI6BgFDa6DAUQ",
    "document_type": 201,
    "status": 2,
    "note": null,
    "filename": "YunoRX_Bank_Statements.pdf",
    "daysAgo": 25
  },
  {
    "merchant_id": "aLLgccuTI6BgFDa6DAUQ",
    "document_type": 310,
    "status": 2,
    "note": null,
    "filename": "YunoRX_LegitScript.pdf",
    "daysAgo": 20
  },
  {
    "merchant_id": "aLLgccuTI6BgFDa6DAUQ",
    "document_type": 312,
    "status": 2,
    "note": null,
    "filename": "YunoRX_Medical_License.pdf",
    "daysAgo": 20
  },
  {
    "merchant_id": "aLLgccuTI6BgFDa6DAUQ",
    "document_type": 501,
    "status": 2,
    "note": null,
    "filename": "YunoRX_Compliance.pdf",
    "daysAgo": 15
  },
  {
    "merchant_id": "aLLgccuTI6BgFDa6DAUQ",
    "document_type": 502,
    "status": 2,
    "note": null,
    "filename": "YunoRX_Reserve.pdf",
    "daysAgo": 15
  }
]

// ==========================================
// File Writers
// ==========================================

// 1. 0001_init.sql
const initSql = `-- 0001_init.sql: D1 Schema Initialization
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS industries (
  key   TEXT PRIMARY KEY,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS merchants (
  id         TEXT PRIMARY KEY,                       -- GHL opportunity id, 20 alnum chars
  name       TEXT NOT NULL,
  industry   TEXT NOT NULL REFERENCES industries(key),
  status     INTEGER NOT NULL DEFAULT 1 CHECK (status BETWEEN 1 AND 5),
  processor  TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  merchant_id         TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  document_type       INTEGER NOT NULL,
  status              INTEGER NOT NULL DEFAULT 1 CHECK (status IN (1, 2, 3)),
  note                TEXT NULL,                            -- rejection reason / reviewer note
  uploaded_at         TEXT NOT NULL,
  status_updated_at   TEXT NOT NULL,
  filename            TEXT,
  sharepoint_item_id  TEXT,
  PRIMARY KEY (merchant_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
`
fs.writeFileSync(path.join(migrationsDir, '0001_init.sql'), initSql.trim() + '\n')

// 2. 0002_seed_industries.sql
const industriesSql = `-- 0002_seed_industries.sql: Lookup table for supported industries
INSERT OR REPLACE INTO industries (key, label) VALUES
  ('peptide', 'Peptides & Research Chemicals'),
  ('hemp', 'Hemp & CBD Industry'),
  ('general', 'General High-Risk Industry'),
  ('kratom', 'Kratom Products'),
  ('mushroom', 'Metocin & Functional Mushroom'),
  ('medical_telehealth', 'Medical & Telehealth'),
  ('nonprofit', 'Nonprofit Organizations');
`
fs.writeFileSync(path.join(migrationsDir, '0002_seed_industries.sql'), industriesSql.trim() + '\n')

// 3. 0003_seed_app_config.sql
const appConfigSql = `-- 0003_seed_app_config.sql: Global Application Configuration
INSERT OR REPLACE INTO app_config (key, value) VALUES
  ('industries', '${escapeSql(JSON.stringify(industriesData))}'),
  ('upload_rules', '${escapeSql(JSON.stringify(uploadRules))}'),
  ('portal_defaults', '${escapeSql(JSON.stringify(portalDefaults))}'),
  ('branding', '${escapeSql(JSON.stringify(branding))}'),
  ('support_contact', '${escapeSql(JSON.stringify(supportContact))}'),
  ('admin_password', '${escapeSql(adminPasswordHash)}'),
  ('merchant_stages', '${escapeSql(JSON.stringify(merchantStages))}'),
  ('processors', '${escapeSql(JSON.stringify(processors))}'),
  ('ghl_field_map', '${escapeSql(JSON.stringify(ghlFieldMap))}'),
  ('ghl_industry_map', '${escapeSql(JSON.stringify(ghlIndustryMap))}');
`
fs.writeFileSync(path.join(migrationsDir, '0003_seed_app_config.sql'), appConfigSql.trim() + '\n')

// 4. 0004_seed_merchants.sql (preserve 228 GHL merchants if already present)
if (!fs.existsSync(path.join(migrationsDir, '0004_seed_merchants.sql'))) {
  let merchantsSql = `-- 0004_seed_merchants.sql: Seed Merchants with GHL Opportunity IDs
INSERT OR REPLACE INTO merchants (id, name, industry, status, processor, created_at, updated_at) VALUES\n`
  merchantsSql += merchantsData
    .map(
      (m) =>
        `  ('${escapeSql(m.id)}', '${escapeSql(m.name)}', '${escapeSql(m.industry)}', ${m.status}, ${m.processor ? `'${escapeSql(m.processor)}'` : 'NULL'}, datetime('now', '-30 days'), datetime('now'))`
    )
    .join(',\n') + ';\n'
  fs.writeFileSync(path.join(migrationsDir, '0004_seed_merchants.sql'), merchantsSql)
}

// 5. 0005_seed_documents.sql
let docsSql = `-- 0005_seed_documents.sql: Seed Uploaded Documents with Status and Notes
INSERT OR REPLACE INTO documents (merchant_id, document_type, status, note, uploaded_at, status_updated_at, filename, sharepoint_item_id) VALUES\n`
docsSql += documentsData
  .map(
    (d) =>
      `  ('${escapeSql(d.merchant_id)}', ${d.document_type}, ${d.status}, ${d.note ? `'${escapeSql(d.note)}'` : 'NULL'}, datetime('now', '-${d.daysAgo} days'), datetime('now', '-${d.daysAgo} days'), '${escapeSql(d.filename)}', 'sp-${d.merchant_id.slice(0, 6)}-${d.document_type}')`
  )
  .join(',\n') + ';\n'
fs.writeFileSync(path.join(migrationsDir, '0005_seed_documents.sql'), docsSql)

console.log('✅ Generated 5 clean migration files in migrations/:')
console.log(' - 0001_init.sql')
console.log(' - 0002_seed_industries.sql')
console.log(' - 0003_seed_app_config.sql')
console.log(' - 0004_seed_merchants.sql')
console.log(' - 0005_seed_documents.sql')
