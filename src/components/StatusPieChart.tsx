import { useState } from 'react'
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from 'recharts'
import { ChecklistStats } from '../../shared/types'
import { UserStatus } from '../enums'
import { statusInfo } from '../helpers/user.helper'

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, value, name, color } = props

  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#1A1A1A" fontWeight="800" fontSize="13px">
        {name}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={color} fontWeight="900" fontSize="16px">
        {value} {value === 1 ? 'doc' : 'docs'}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={color}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        fill={color}
      />
    </g>
  )
}

interface StatusPieChartProps {
  stats: ChecklistStats
  userStatus: number | UserStatus
  stages?: Array<{ value: number; name: string }>
}

function StatusPieChart({ stats, userStatus, stages }: StatusPieChartProps) {
  const customStageName = stages?.find((s) => Number(s.value) === Number(userStatus))?.name
  const stageDetails = statusInfo(userStatus, customStageName)

  const data = [
    { name: 'Not Uploaded', value: stats.notUploaded, color: '#9CA3AF' },
    { name: 'Pending', value: stats.pending, color: '#F59E0B' },
    { name: 'Verified', value: stats.confirmed, color: '#10B981' },
    { name: 'Rejected', value: stats.rejected, color: '#E11D48' },
  ].filter((d) => d.value > 0) // only include slices with data

  // Fallback slice if no docs yet
  const chartData = data.length > 0 ? data : [{ name: 'Not Uploaded', value: stats.totalItems || 1, color: '#E5E7EB' }]

  const [activeIndex, setActiveIndex] = useState(0)
  const handleMouseEnter = (_: any, index: any) => {
    setActiveIndex(index)
  }

  const totalSubmitted = stats.pending + stats.confirmed + stats.rejected

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
      <div className="w-full flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#02F1DE]"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
            Underwriting Status
          </h3>
        </div>
      </div>

      <div className="w-[260px] h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              fill="#10B981"
              dataKey="value"
              onMouseEnter={handleMouseEnter}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center w-full mt-1">
        <p className="text-sm font-bold text-[#1A1A1A]">
          {totalSubmitted} of {stats.totalItems} Underwriting Items Submitted
        </p>

        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-gray-100 text-center">
          <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-200">
            <span className="block text-[9px] font-bold text-gray-600 uppercase truncate">Not Uploaded</span>
            <span className="text-xs font-extrabold text-gray-800">{stats.notUploaded}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A]">
            <span className="block text-[9px] font-bold text-[#92400E] uppercase truncate">Pending</span>
            <span className="text-xs font-extrabold text-[#92400E]">{stats.pending}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
            <span className="block text-[9px] font-bold text-[#065F46] uppercase truncate">Verified</span>
            <span className="text-xs font-extrabold text-[#065F46]">{stats.confirmed}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-[#FFF1F2] border border-[#FECDD3]">
            <span className="block text-[9px] font-bold text-[#BE123C] uppercase truncate">Rejected</span>
            <span className="text-xs font-extrabold text-[#BE123C]">{stats.rejected}</span>
          </div>
        </div>
      </div>

      {stageDetails ? (
        <div className="mt-4 w-full">
          <div
            className="w-full text-center rounded-lg py-2 text-xs font-bold tracking-wide uppercase shadow-2xs"
            style={{
              backgroundColor: stageDetails.bgColor,
              color: stageDetails.color,
            }}
          >
            Current Stage: {stageDetails.name}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default StatusPieChart
