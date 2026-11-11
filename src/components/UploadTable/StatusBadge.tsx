import { FileStatus } from "../../enums/index"

interface StatusBadgeProps {
    status: FileStatus | 'not-uploaded' | number
}

function StatusBadge({ status }: StatusBadgeProps) {
    const statusConfig: Record<string | number, { label: string; classNames: string; dotColor: string }> = {
        [FileStatus.NOT_UPLOADED]: {
            label: 'Not Uploaded',
            classNames: 'bg-gray-100 text-gray-700 border border-gray-200',
            dotColor: '#9CA3AF'
        },
        [FileStatus.PENDING]: {
            label: 'Pending',
            classNames: 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]',
            dotColor: '#F59E0B'
        },
        [FileStatus.VERIFIED]: {
            label: 'Verified',
            classNames: 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]',
            dotColor: '#10B981'
        },
        [FileStatus.REJECTED]: {
            label: 'Rejected',
            classNames: 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]',
            dotColor: '#E11D48'
        }
    }

    const current = statusConfig[status] || statusConfig[FileStatus.NOT_UPLOADED];

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
