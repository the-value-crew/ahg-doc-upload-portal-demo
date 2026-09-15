import { UserStatus } from "../enums"

interface StatusInfo {
    name: string
    color: string
    bgColor: string
}

export const statusInfo = (status: UserStatus): StatusInfo => {
    switch (status) {
        case UserStatus.APPLICATION_SUBMITTED:
            return { name: "Application Submitted", color: '#4B5563', bgColor: '#F3F4F6' }
        case UserStatus.DOCS_SUBMITTED:
            return { name: "Documents Submitted", color: '#1E40AF', bgColor: '#DBEAFE' }
        case UserStatus.UNDERWRITING_REVIEW:
            return { name: "Underwriting Review", color: '#92400E', bgColor: '#FEF3C7' }
        case UserStatus.GATEWAY_SETUP:
            return { name: "Gateway Setup", color: '#065F46', bgColor: '#D1FAE5' }
        case UserStatus.ACCOUNT_LIVE:
            return { name: "Account Active & Live", color: '#065F46', bgColor: '#D1FAE5' }
        default:
            return { name: "Underwriting Review", color: '#92400E', bgColor: '#FEF3C7' }
    }
}