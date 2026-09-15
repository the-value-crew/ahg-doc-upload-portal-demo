import { FileStatus, FileTypes, UserStatus } from "../enums";
import { ERCFile } from "../interfaces";

export interface MockUserFile {
    type: number;
    status: FileStatus;
    filename: string;
    createdAt: number;
}

const STORAGE_KEY = "ahg_pay_mock_user_files_v3";

const INITIAL_MOCK_FILES: MockUserFile[] = [
    // --- CORE DOCS ---
    {
        type: FileTypes.Articles_Of_Incorporation,
        status: FileStatus.CONFIRMED,
        filename: "Articles_Of_Incorporation_State_Filed.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    },
    {
        type: FileTypes.SS4_EIN_Letter,
        status: FileStatus.CONFIRMED,
        filename: "IRS_SS4_EIN_Confirmation_Form_W9.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    },
    {
        type: FileTypes.Voided_Check_Or_Bank_Letter,
        status: FileStatus.CONFIRMED,
        filename: "Voided_Business_Check_Settlement.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    },
    {
        type: FileTypes.Drivers_Licenses,
        status: FileStatus.PENDING,
        filename: "Drivers_Licenses_Signers_Color.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 18,
    },

    // --- FINANCIAL DOCS ---
    {
        type: FileTypes.Bank_Statements_3_Months,
        status: FileStatus.CONFIRMED,
        filename: "Business_Bank_Statements_Last_3_Months.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    },
    {
        type: FileTypes.Processing_Statements_3_Months,
        status: FileStatus.CONFIRMED,
        filename: "Merchant_Processing_Statements_Q1_Q2.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    },
    {
        type: FileTypes.Financials_2_Years,
        status: FileStatus.PENDING,
        filename: "Corporate_Financials_Tax_Returns_2_Years.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 12,
    },

    // --- PEPTIDE-SPECIFIC DOCS ---
    {
        type: FileTypes.Website_Compliance,
        status: FileStatus.CONFIRMED,
        filename: "Website_Terms_Refund_Policy_Audit.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    },
    {
        type: FileTypes.Fulfillment_Agreement_3PL,
        status: FileStatus.CONFIRMED,
        filename: "Executed_3PL_Fulfillment_Contract.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    },
    {
        type: FileTypes.KYC_Doc_Google_Form,
        status: FileStatus.CONFIRMED,
        filename: "Digital_KYC_Profile_Confirmation.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    },
    {
        type: FileTypes.Proof_Of_Domain_Ownership,
        status: FileStatus.CONFIRMED,
        filename: "Domain_Registrar_Ownership_Proof.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    },

    // --- HEMP-SPECIFIC DOCS ---
    {
        type: FileTypes.Hemp_COAs_12_Months,
        status: FileStatus.CONFIRMED,
        filename: "Full_Panel_ThirdParty_Lab_COAs_12mo.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    },
    {
        type: FileTypes.Hemp_License_Or_Food_Permit,
        status: FileStatus.CONFIRMED,
        filename: "State_Department_Ag_Hemp_License.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    },

    // --- SIGNATURE DOCS ---
    {
        type: FileTypes.Compliance_Monitoring_Form,
        status: FileStatus.CONFIRMED,
        filename: "Signed_Compliance_Monitoring_Agreement.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    },
    {
        type: FileTypes.Reserve_Acknowledgement,
        status: FileStatus.CONFIRMED,
        filename: "Signed_Reserve_Acknowledgement_Schedule.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    },
    {
        type: FileTypes.WTP_Sole_Member_Affidavit,
        status: FileStatus.CONFIRMED,
        filename: "Signed_WTP_Sole_Member_Affidavit.pdf",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    },
];

const getStoredFiles = (): MockUserFile[] => {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {
        // Fallback
    }
    return [...INITIAL_MOCK_FILES];
};

const saveStoredFiles = (files: MockUserFile[]) => {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch {
        // Ignore storage errors
    }
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockVerifyUid = async (uid: string): Promise<{ status: UserStatus; uid: string } | false> => {
    await delay(300);
    if (uid === "invalid" || uid === "404") {
        return false;
    }
    return {
        status: UserStatus.UNDERWRITING_REVIEW,
        uid: uid || "AHG-DEMO-MERCHANT",
    };
};

export const mockGetUserFiles = async (): Promise<MockUserFile[]> => {
    await delay(250);
    return getStoredFiles();
};

export const mockGetFileUploadUrl = async (file: ERCFile): Promise<string | false> => {
    await delay(150);
    if (!file) return false;
    return `mock://ahgpay-vault.s3/merchants/uploads/${encodeURIComponent(file.name || "doc")}.${file.fileExt || "pdf"}`;
};

export const mockUploadFileToS3 = async (
    _url: string,
    file: ERCFile,
    uploadProgressCallback: (progress: number) => void,
    uploadCompleteCallback: () => void
): Promise<boolean> => {
    try {
        const steps = [15, 35, 60, 85, 100];
        for (const progress of steps) {
            await delay(100);
            uploadProgressCallback(progress);
        }

        if (file.fileType !== null && file.fileType !== undefined) {
            const currentFiles = getStoredFiles();
            const existingIndex = currentFiles.findIndex((f) => Number(f.type) === Number(file.fileType));
            const newFile: MockUserFile = {
                type: Number(file.fileType),
                status: FileStatus.PENDING,
                filename: `${file.name}.${file.fileExt}`,
                createdAt: Date.now(),
            };

            if (existingIndex >= 0) {
                currentFiles[existingIndex] = newFile;
            } else {
                currentFiles.push(newFile);
            }
            saveStoredFiles(currentFiles);
        }

        uploadCompleteCallback();
        return true;
    } catch (e) {
        console.error("Mock upload failed", e);
        return false;
    }
};

export const mockDownloadFile = async (filename: string): Promise<boolean> => {
    await delay(200);
    try {
        const blobContent = `--- AHG Pay Merchant Document Vault ---\nDocument: ${filename}\nStatus: Verified by AHG Underwriting Team\nTimestamp: ${new Date().toISOString()}\nOrganization: AHG Pay (American Hemp Group LLC)\nMerchant Processing Support: sales@ahgpay.com | +1-754-732-3744`;
        const blob = new Blob([blobContent], { type: "text/plain" });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename.endsWith(".txt") || filename.includes(".") ? filename : `${filename}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        return true;
    } catch (e) {
        console.error("Mock download failed", e);
        return false;
    }
};
