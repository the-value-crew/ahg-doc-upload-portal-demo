import { IconContext } from "react-icons"
import { FiCheck } from "react-icons/fi"

interface UserStatusStepperProps {
    status: number
    stages?: Array<{ value: number; name: string }>
}

interface StepperStepProps {
    status: number
    statusName: string
    completed: boolean
    isCurrent: boolean
    isLast: boolean
    isFirst: boolean
}

function StepperStep({ status, statusName, completed, isCurrent, isLast, isFirst }: StepperStepProps) {
    return (
        <div className={`${!isLast ? 'flex-1' : ''} flex items-center`}>
            <div className="flex flex-col items-center relative group">
                <div
                    className={`rounded-full h-8 w-8 grid place-items-center transition-all ${completed
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
                    className={`absolute top-10 text-xs font-bold tracking-tight leading-snug w-24 sm:w-28 ${
                        isFirst
                            ? 'left-0 sm:left-1/2 sm:-translate-x-1/2 text-left sm:text-center'
                            : isLast
                                ? 'right-0 sm:left-1/2 sm:-translate-x-1/2 text-right sm:text-center'
                                : 'left-1/2 -translate-x-1/2 text-center'
                    }`}
                    style={{
                        color: isCurrent ? '#1A1A1A' : completed ? '#10B981' : '#9CA3AF',
                    }}
                >
                    {statusName}
                </div>
            </div>

            {!isLast && (
                <div
                    className={`flex-1 h-[2px] mx-2 sm:mx-3 transition-all ${completed ? 'bg-[#10B981]' : 'bg-[#E5E7EB]'
                        }`}
                ></div>
            )}
        </div>
    )
}

function UserStatusStepper({ status, stages }: UserStatusStepperProps) {
    const defaultStages = [
        "Onboarding booked",
        "Doc Collection",
        "Application in review",
        "Approved",
        "Live and processing",
    ]

    const statusKeys = stages && stages.length > 0
        ? stages.map((s) => s.name)
        : defaultStages

    return (
        <div className="w-full px-6 sm:px-10 md:px-12 py-6 sm:py-8">
            <div className="flex items-center w-full pt-1 pb-10">
                {statusKeys.map((statusName, index) => (
                    <StepperStep
                        key={index}
                        status={index + 1}
                        statusName={statusName}
                        completed={index + 1 < status}
                        isCurrent={index + 1 === status}
                        isFirst={index === 0}
                        isLast={index === statusKeys.length - 1}
                    />
                ))}
            </div>
        </div>
    )
}

export default UserStatusStepper;
