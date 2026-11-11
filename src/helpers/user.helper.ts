import { UserStatus } from "../enums"

export interface StatusInfo {
    name: string
    color: string
    bgColor: string
}

export const statusInfo = (
    status: number | UserStatus,
    customStageName?: string
): StatusInfo => {
    const s = Number(status)

    const stageColors: Record<number, { name: string; color: string; bgColor: string }> = {
        1: { name: "Onboarding booked", color: '#4B5563', bgColor: '#F3F4F6' },
        2: { name: "Doc Collection", color: '#1E40AF', bgColor: '#DBEAFE' },
        3: { name: "Application in review", color: '#92400E', bgColor: '#FEF3C7' },
        4: { name: "Approved", color: '#065F46', bgColor: '#D1FAE5' },
        5: { name: "Live and processing", color: '#065F46', bgColor: '#D1FAE5' },
    }

    const current = stageColors[s] || {
        name: `Stage ${s}`,
        color: '#4B5563',
        bgColor: '#F3F4F6',
    }

    if (customStageName) {
        return {
            ...current,
            name: customStageName,
        }
    }

    return current
}
