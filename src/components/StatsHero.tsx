import { ChecklistStats } from '../../shared/types'
import { UserStatus } from '../enums'
import StatusPieChart from './StatusPieChart'
import UserStatusStepper from './UserStatusStepper'

interface StatsHeroProps {
  stats: ChecklistStats
  userStatus: UserStatus
  stages?: Array<{ value: number; name: string }>
  title?: string
  subtitle?: string
}

export default function StatsHero({
  stats,
  userStatus,
  stages,
  title = 'Underwriting Progress',
  subtitle = 'Track submitted and verified documentation through the underwriting pipeline.',
}: StatsHeroProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
      {/* Left: Interactive Doughnut Status Pie Chart */}
      <div className="lg:col-span-5 flex justify-center items-center">
        <StatusPieChart stats={stats} userStatus={userStatus} stages={stages} />
      </div>

      {/* Right: Stepper Pipeline & Underwriting Snapshot */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">{title}</h3>
            </div>
            <span className="text-xs font-bold text-gray-500">Stage {userStatus} of 5</span>
          </div>

          <p className="text-xs text-gray-500 mb-6">{subtitle}</p>

          <div className="py-2 mb-6">
            <UserStatusStepper status={userStatus} stages={stages} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100 text-center">
          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Items</div>
            <div className="text-lg font-extrabold text-gray-900 mt-0.5">{stats.totalItems}</div>
          </div>
          <div className="p-2.5 bg-[#ECFDF5] rounded-xl border border-[#A7F3D0]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#065F46]">Verified</div>
            <div className="text-lg font-extrabold text-[#065F46] mt-0.5">{stats.confirmed}</div>
          </div>
          <div className="p-2.5 bg-[#FFFBEB] rounded-xl border border-[#FDE68A]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#92400E]">Pending</div>
            <div className="text-lg font-extrabold text-[#92400E] mt-0.5">{stats.pending}</div>
          </div>
          <div className="p-2.5 bg-[#FFF1F2] rounded-xl border border-[#FECDD3]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#BE123C]">Rejected</div>
            <div className="text-lg font-extrabold text-[#BE123C] mt-0.5">{stats.rejected}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

