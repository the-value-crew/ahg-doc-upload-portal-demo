import { FileTypes, IndustryType } from "../enums"
import { FileInfo, IndustrySection } from "../interfaces";

export const validateFile = (file: File): null | string => {
    let errorMessage = null;
    const validMimes = [
        // Images
        'image/jpeg',
        'image/png',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (file.size / (1024 * 1024) > 50) errorMessage = "File size must be 50MB or less";
    else if (!validMimes.includes(file.type)) errorMessage = "File format isn't supported. Please upload PDF, PNG, JPG, DOC, or CSV.";

    if (errorMessage) console.log(file.type, file.size);
    return errorMessage;
}

export const fileInfoByType = (fileType: FileTypes): FileInfo => {
    const infoDict: Record<number, FileInfo> = {
        // --- CORE DOCS ---
        [FileTypes.Articles_Of_Incorporation]: {
            name: "Articles of Incorporation",
            iframeLink: "https://ahgpay.com/",
            section: "CORE DOCS",
            description: "State-filed formation documents for the registered corporate entity or LLC."
        },
        [FileTypes.SS4_EIN_Letter]: {
            name: "SS4 / EIN Letter",
            iframeLink: "https://ahgpay.com/",
            section: "CORE DOCS",
            description: "Official IRS EIN confirmation letter (Form SS-4) or signed Federal W-9."
        },
        [FileTypes.Voided_Check_Or_Bank_Letter]: {
            name: "Voided Check OR Signed Bank Letter",
            iframeLink: "https://ahgpay.com/",
            section: "CORE DOCS",
            description: "Pre-printed voided check or signed bank officer letter verifying settlement routing & account numbers."
        },
        [FileTypes.Drivers_Licenses]: {
            name: "Driver's Licenses (up to 4)",
            iframeLink: "https://ahgpay.com/",
            section: "CORE DOCS",
            description: "Color government-issued photo ID for authorized signers and all 25%+ equity owners."
        },
        [FileTypes.Operating_Agreement_Or_Bylaws]: {
            name: "Operating Agreement (LLC) / Bylaws (Corp)",
            iframeLink: "https://ahgpay.com/",
            section: "CORE DOCS",
            description: "Fully executed Operating Agreement or Corporate Bylaws with signature pages."
        },

        // --- FINANCIAL DOCS ---
        [FileTypes.Bank_Statements_3_Months]: {
            name: "3 Months Bank Statements",
            iframeLink: "https://ahgpay.com/",
            section: "FINANCIAL DOCS",
            description: "Last 3 consecutive months of business bank statements (or personal if new business)."
        },
        [FileTypes.Processing_Statements_3_Months]: {
            name: "3 Months Most Recent Processing Statements",
            iframeLink: "https://ahgpay.com/",
            section: "FINANCIAL DOCS",
            description: "Last 3 consecutive merchant processing statements showing volume, refunds, and chargeback ratio."
        },
        [FileTypes.Financials_2_Years]: {
            name: "2 Years Financials for all Applications",
            iframeLink: "https://ahgpay.com/",
            section: "FINANCIAL DOCS",
            description: "Last 2 years of corporate tax returns, balance sheets, and profit & loss statements."
        },

        // --- PEPTIDE-SPECIFIC DOCS ---
        [FileTypes.Website_Compliance]: {
            name: "Website Compliance Review",
            iframeLink: "https://ahgpay.com/",
            section: "INDUSTRY-SPECIFIC DOCS",
            description: "Verification of checkout flow, Terms of Service, Refund Policy, Privacy Policy, and research/compliance disclaimers."
        },
        [FileTypes.Fulfillment_Agreement_3PL]: {
            name: "Fulfillment Agreement (if using 3PL)",
            iframeLink: "https://ahgpay.com/",
            section: "INDUSTRY-SPECIFIC DOCS",
            description: "Executed warehouse or 3PL fulfillment contract with shipping SLA terms."
        },
        [FileTypes.Site_Inventory_Photos]: {
            name: "Site / Inventory Photos",
            iframeLink: "https://ahgpay.com/",
            section: "INDUSTRY-SPECIFIC DOCS",
            description: "Photos of business premises, physical inventory, and packaging area."
        },
        [FileTypes.KYC_Doc_Google_Form]: {
            name: "KYC Doc (Completed via Google Form)",
            iframeLink: "https://docs.google.com/forms",
            section: "PEPTIDE-SPECIFIC DOCS",
            description: "Complete the online digital merchant KYC profile and upload confirmation receipt.",
            formUrl: "https://docs.google.com/forms",
            isExternalForm: true
        },
        [FileTypes.Safety_Data_Sheet]: {
            name: "Safety Data Sheet (if no COAs)",
            iframeLink: "https://docs.google.com/forms",
            section: "PEPTIDE-SPECIFIC DOCS",
            description: "Chemical safety data sheet (SDS) or product safety sheet via Google Form submission.",
            formUrl: "https://docs.google.com/forms",
            isExternalForm: true
        },
        [FileTypes.Outside_Vendor_Invoices]: {
            name: "Outside Vendor Invoices",
            iframeLink: "https://ahgpay.com/",
            section: "PEPTIDE-SPECIFIC DOCS",
            description: "Recent invoices from peptide synthesis labs, raw material suppliers, or API manufacturers."
        },
        [FileTypes.Proof_Of_Domain_Ownership]: {
            name: "Proof of Domain Ownership",
            iframeLink: "https://ahgpay.com/",
            section: "PEPTIDE-SPECIFIC DOCS",
            description: "Registrar invoice or WHOIS account screenshot verifying domain ownership."
        },
        [FileTypes.Top_10_Customer_List]: {
            name: "Top 10 Customer List",
            iframeLink: "https://ahgpay.com/",
            section: "PEPTIDE-SPECIFIC DOCS",
            description: "List of top 10 recurring B2B clients or anonymized customer sales breakdown."
        },

        // --- HEMP-SPECIFIC DOCS ---
        [FileTypes.Hemp_COAs_12_Months]: {
            name: "COAs (12 months if not on website)",
            iframeLink: "https://ahgpay.com/",
            section: "HEMP-SPECIFIC DOCS",
            description: "Full-panel third-party lab Certificate of Analysis for all SKUs tested within the last 12 months."
        },
        [FileTypes.Hemp_License_Or_Food_Permit]: {
            name: "Hemp License OR Hemp Food Permit",
            iframeLink: "https://ahgpay.com/",
            section: "HEMP-SPECIFIC DOCS",
            description: "State Department of Agriculture hemp license, handler permit, or retail food manufacturing permit."
        },

        // --- SIGNATURE DOCS ---
        [FileTypes.Compliance_Monitoring_Form]: {
            name: "Compliance Monitoring Form",
            iframeLink: "https://ahgpay.com/",
            section: "SIGNATURE DOCS",
            description: "Signed compliance monitoring and recurring card network audit agreement.",
            isSignatureDoc: true
        },
        [FileTypes.Reserve_Acknowledgement]: {
            name: "Reserve Acknowledgement",
            iframeLink: "https://ahgpay.com/",
            section: "SIGNATURE DOCS",
            description: "Signed underwriting rolling reserve or risk hold schedule agreement.",
            isSignatureDoc: true
        },
        [FileTypes.Peptide_Addendum]: {
            name: "Peptide Addendum",
            iframeLink: "https://ahgpay.com/",
            section: "SIGNATURE DOCS",
            description: "Signed research peptide merchant processing terms and compliance addendum.",
            isSignatureDoc: true
        },
        [FileTypes.WTP_Sole_Member_Affidavit]: {
            name: "WTP Sole Member Affidavit (single-member LLC)",
            iframeLink: "https://ahgpay.com/",
            section: "SIGNATURE DOCS",
            description: "Notarized / signed affidavit of single-member LLC beneficial ownership.",
            isSignatureDoc: true
        },
    };

    return infoDict[fileType] || {
        name: "Merchant Document",
        iframeLink: "https://ahgpay.com/",
        section: "CORE DOCS",
        description: "Standard merchant onboarding document"
    };
};

export const getSectionsByIndustry = (industry: IndustryType): IndustrySection[] => {
    switch (industry) {
        case IndustryType.PEPTIDE:
            return [
                {
                    id: "core-docs",
                    title: "CORE DOCS",
                    description: "Articles of Incorporation, SS4/EIN, Voided Check, Owner IDs, and Operating Agreement.",
                    fileTypes: [
                        FileTypes.Articles_Of_Incorporation,
                        FileTypes.SS4_EIN_Letter,
                        FileTypes.Voided_Check_Or_Bank_Letter,
                        FileTypes.Drivers_Licenses,
                        FileTypes.Operating_Agreement_Or_Bylaws,
                    ]
                },
                {
                    id: "financial-docs",
                    title: "FINANCIAL DOCS",
                    description: "3 Months Bank Statements, Processing Statements, and 2 Years Financials.",
                    fileTypes: [
                        FileTypes.Bank_Statements_3_Months,
                        FileTypes.Processing_Statements_3_Months,
                        FileTypes.Financials_2_Years,
                    ]
                },
                {
                    id: "peptide-docs",
                    title: "PEPTIDE-SPECIFIC DOCS",
                    description: "Website compliance, 3PL agreements, site photos, KYC, SDS, invoices, and domain proof.",
                    fileTypes: [
                        FileTypes.Website_Compliance,
                        FileTypes.Fulfillment_Agreement_3PL,
                        FileTypes.Site_Inventory_Photos,
                        FileTypes.KYC_Doc_Google_Form,
                        FileTypes.Safety_Data_Sheet,
                        FileTypes.Outside_Vendor_Invoices,
                        FileTypes.Proof_Of_Domain_Ownership,
                        FileTypes.Top_10_Customer_List,
                    ]
                },
                {
                    id: "signature-docs",
                    title: "SIGNATURE DOCS",
                    description: "Executed compliance monitoring form, reserve acknowledgement, and peptide addendum.",
                    fileTypes: [
                        FileTypes.Compliance_Monitoring_Form,
                        FileTypes.Reserve_Acknowledgement,
                        FileTypes.Peptide_Addendum,
                    ]
                }
            ];

        case IndustryType.HEMP:
            return [
                {
                    id: "core-docs",
                    title: "CORE DOCS",
                    description: "Articles of Incorporation, SS4/EIN, Voided Check, Owner IDs, and Operating Agreement.",
                    fileTypes: [
                        FileTypes.Articles_Of_Incorporation,
                        FileTypes.SS4_EIN_Letter,
                        FileTypes.Voided_Check_Or_Bank_Letter,
                        FileTypes.Drivers_Licenses,
                        FileTypes.Operating_Agreement_Or_Bylaws,
                    ]
                },
                {
                    id: "financial-docs",
                    title: "FINANCIAL DOCS",
                    description: "3 Months Bank Statements and 3 Months Most Recent Processing Statements.",
                    fileTypes: [
                        FileTypes.Bank_Statements_3_Months,
                        FileTypes.Processing_Statements_3_Months,
                    ]
                },
                {
                    id: "hemp-docs",
                    title: "HEMP-SPECIFIC DOCS",
                    description: "12 Months COAs, Hemp License/Food Permit, website compliance, and inventory photos.",
                    fileTypes: [
                        FileTypes.Hemp_COAs_12_Months,
                        FileTypes.Hemp_License_Or_Food_Permit,
                        FileTypes.Website_Compliance,
                        FileTypes.Fulfillment_Agreement_3PL,
                        FileTypes.Site_Inventory_Photos,
                    ]
                },
                {
                    id: "signature-docs",
                    title: "SIGNATURE DOCS",
                    description: "WTP Sole Member Affidavit (single-member LLC) and underwriting authorizations.",
                    fileTypes: [
                        FileTypes.WTP_Sole_Member_Affidavit,
                    ]
                }
            ];

        case IndustryType.GENERAL:
        default:
            return [
                {
                    id: "core-docs",
                    title: "CORE DOCS",
                    description: "Articles of Incorporation, SS4/EIN, Voided Check, Owner IDs, and Operating Agreement.",
                    fileTypes: [
                        FileTypes.Articles_Of_Incorporation,
                        FileTypes.SS4_EIN_Letter,
                        FileTypes.Voided_Check_Or_Bank_Letter,
                        FileTypes.Drivers_Licenses,
                        FileTypes.Operating_Agreement_Or_Bylaws,
                    ]
                },
                {
                    id: "financial-docs",
                    title: "FINANCIAL DOCS",
                    description: "3 Months Bank Statements and 3 Months Most Recent Processing Statements.",
                    fileTypes: [
                        FileTypes.Bank_Statements_3_Months,
                        FileTypes.Processing_Statements_3_Months,
                    ]
                }
            ];
    }
};

export const getFileTypesByIndustry = (industry: IndustryType): FileTypes[] => {
    const sections = getSectionsByIndustry(industry);
    return sections.flatMap(sec => sec.fileTypes);
};

export const totalFileTypesByIndustry = (industry: IndustryType): number => {
    return getFileTypesByIndustry(industry).length;
};

export const fileTypeSelectOptionsByIndustry = (industry: IndustryType) => {
    const fileTypes = getFileTypesByIndustry(industry);
    return fileTypes.map(fileType => ({
        label: fileInfoByType(fileType).name,
        value: fileType
    }));
};

// Backwards compatibility helpers
export const totalFileTypes = () => totalFileTypesByIndustry(IndustryType.HEMP);
export const allFileTypes = () => getFileTypesByIndustry(IndustryType.HEMP);
export const fileTypeSelectOptions = () => fileTypeSelectOptionsByIndustry(IndustryType.HEMP);