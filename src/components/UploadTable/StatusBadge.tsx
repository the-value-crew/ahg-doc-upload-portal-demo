import { FileStatus } from "../../enums/index"

interface StatusBadgeProps {
    status: FileStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
    // Dashboard status colors: green #10B981, amber #F59E0B, red #EF4444
    const statusConfig = {
        [FileStatus.REQUIRED]: {
            label: 'Upload Required',
            classNames: 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]',
            dotColor: '#EF4444'
        },
        [FileStatus.PENDING]: {
            label: 'Under Review',
            classNames: 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]',
            dotColor: '#F59E0B'
        },
        [FileStatus.CONFIRMED]: {
            label: 'Verified',
            classNames: 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]',
            dotColor: '#10B981'
        }
    }

    const current = statusConfig[status] || statusConfig[FileStatus.REQUIRED];

    return (
        <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-tight ${current.classNames}`}>
            <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: current.dotColor }}
            ></span>
            <span>{current.label}</span>
        </div>
    );
}

export default StatusBadge;