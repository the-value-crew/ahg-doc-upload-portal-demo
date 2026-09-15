import { UserStatus } from "../enums";
import { IconContext } from "react-icons"
import { FiCheck } from "react-icons/fi"

interface UserStatusStepperProps {
    status: number
}

interface StepperStepProps {
    status: number
    statusName: string
    completed: boolean
    isCurrent: boolean
    isLast: boolean
}

function StepperStep({ status, statusName, completed, isCurrent, isLast }: StepperStepProps) {
    return (
        <div className={`${!isLast ? 'flex-1' : ''} flex items-center`}>
            <div className="flex flex-col items-center relative group">
                <div
                    className={`rounded-full h-8 w-8 grid place-items-center transition-all ${
                        completed
                            ? 'bg-[#10B981] text-white shadow-sm'
                            : isCurrent
                            ? 'bg-[#02F1DE] text-[#000000] border-2 border-[#1A1A1A] font-extrabold shadow-sm'
                            : 'bg-white border-2 border-[#E5E7EB] text-[#9CA3AF]'
                    }`}
                >
                    {completed ? (
                        <IconContext.Provider value={{ color: '#FFFFFF', className: 'inline w-4 h-4 stroke-[3]' }}>
                            <FiCheck />
                        </IconContext.Provider>
                    ) : (
                        <span className="text-xs font-bold">
                            {status}
                        </span>
                    )}
                </div>

                <div
                    className="absolute top-10 transform -translate-x-1/2 left-1/2 min-w-[130px] text-center text-xs font-bold tracking-tight"
                    style={{
                        color: isCurrent ? '#1A1A1A' : completed ? '#10B981' : '#9CA3AF',
                    }}
                >
                    {statusName}
                </div>
            </div>

            {!isLast && (
                <div
                    className={`flex-1 h-[2px] mx-3 transition-all ${
                        completed ? 'bg-[#10B981]' : 'bg-[#E5E7EB]'
                    }`}
                ></div>
            )}
        </div>
    )
}

function UserStatusStepper({ status }: UserStatusStepperProps) {
    const statusKeys = [
        "Application Submitted",
        "Documents Submitted",
        "Underwriting Review",
        "Gateway Setup",
        "Account Live"
    ];

    return (
        <div className="w-full bg-white rounded-2xl p-6 md:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#F3F4F6]">
                <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#02F1DE]"></span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                        Merchant Onboarding Pipeline
                    </h3>
                </div>
                <span className="text-xs font-bold text-[#000000] bg-[#02F1DE] px-3 py-1 rounded-full">
                    Step {status} of {statusKeys.length}
                </span>
            </div>
            <div className="flex items-center w-full pt-2 pb-8">
                {statusKeys.map((statusName, index) => (
                    <StepperStep
                        key={index}
                        status={index + 1}
                        statusName={statusName}
                        completed={index + 1 < status}
                        isCurrent={index + 1 === status}
                        isLast={index === statusKeys.length - 1}
                    />
                ))}
            </div>
        </div>
    )
}

export default UserStatusStepper;