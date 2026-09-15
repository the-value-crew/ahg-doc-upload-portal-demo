export enum FileStatus {
    REQUIRED = 1,
    PENDING = 2,
    CONFIRMED = 3,
}

// 5-step Underwriting Pipeline
export enum UserStatus {
    APPLICATION_SUBMITTED = 1,
    DOCS_SUBMITTED = 2,
    UNDERWRITING_REVIEW = 3,
    GATEWAY_SETUP = 4,
    ACCOUNT_LIVE = 5
}

export enum DropzoneMode { SMALL, LARGE }

export enum IndustryType {
    HEMP = "hemp",
    PEPTIDE = "peptide",
    GENERAL = "general"
}

// Industry-Specific Document Types
export enum FileTypes {
    // --- CORE DOCS ---
    Articles_Of_Incorporation = 101,
    SS4_EIN_Letter = 102,
    Voided_Check_Or_Bank_Letter = 103,
    Drivers_Licenses = 104,
    Operating_Agreement_Or_Bylaws = 105,

    // --- FINANCIAL DOCS ---
    Bank_Statements_3_Months = 201,
    Processing_Statements_3_Months = 202,
    Financials_2_Years = 203,

    // --- PEPTIDE-SPECIFIC DOCS ---
    Website_Compliance = 301,
    Fulfillment_Agreement_3PL = 302,
    Site_Inventory_Photos = 303,
    KYC_Doc_Google_Form = 304,
    Safety_Data_Sheet = 305,
    Outside_Vendor_Invoices = 306,
    Proof_Of_Domain_Ownership = 307,
    Top_10_Customer_List = 308,

    // --- HEMP-SPECIFIC DOCS ---
    Hemp_COAs_12_Months = 401,
    Hemp_License_Or_Food_Permit = 402,

    // --- SIGNATURE DOCS ---
    Compliance_Monitoring_Form = 501,
    Reserve_Acknowledgement = 502,
    Peptide_Addendum = 503,
    WTP_Sole_Member_Affidavit = 504,
}

export default FileTypes;