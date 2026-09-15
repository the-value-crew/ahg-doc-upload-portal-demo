import { useState } from 'react'
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from 'recharts'
import { StatsData } from '../interfaces'
import { UserStatus } from '../enums'
import { statusInfo } from '../helpers/user.helper'

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, value, name, color } = props;

    return (
        <g>
            <text x={cx} y={cy - 8} textAnchor="middle" fill="#000000" fontWeight="800" fontSize="13px">
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
    );
}

interface StatusPieChartProps {
    stats: StatsData,
    userStatus: UserStatus
}

function StatusPieChart({ stats, userStatus }: StatusPieChartProps) {
    // Dashboard status colors: green #10B981, amber #F59E0B, red #EF4444
    const data = [
        { name: 'Upload Required', value: stats.required, color: '#EF4444' },
        { name: 'Pending Review', value: stats.pending, color: '#F59E0B' },
        { name: 'Verified', value: stats.confirmed, color: '#10B981' }
    ];

    const [activeIndex, setActiveIndex] = useState(0)
    const handleMouseEnter = (_: any, index: any) => {
        setActiveIndex(index);
    }

    const totalDocs = stats.pending + stats.confirmed + stats.required;
    const uploadedDocs = stats.pending + stats.confirmed;
    const percentage = totalDocs > 0 ? Math.round((stats.confirmed / totalDocs) * 100) : 0;

    return (
        <div className="w-full max-w-sm bg-white rounded-2xl p-7 shadow-sm flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
                <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#02F1DE]"></span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                        Compliance Status
                    </h3>
                </div>
                <span className="text-xs font-extrabold text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full">
                    {percentage}% Verified
                </span>
            </div>

            <div className="w-[260px] h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={72}
                            outerRadius={92}
                            fill="#10B981"
                            dataKey="value"
                            onMouseEnter={handleMouseEnter}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="text-center w-full mt-1">
                <p className="text-sm font-bold text-[#1A1A1A]">
                    {uploadedDocs} of {totalDocs} Underwriting Items Submitted
                </p>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#F3F4F6] text-center">
                    <div className="p-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA]">
                        <span className="block text-[10px] font-bold text-[#991B1B] uppercase">Required</span>
                        <span className="text-sm font-extrabold text-[#991B1B]">{stats.required}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#FFFBEB] border border-[#FDE68A]">
                        <span className="block text-[10px] font-bold text-[#92400E] uppercase">Review</span>
                        <span className="text-sm font-extrabold text-[#92400E]">{stats.pending}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
                        <span className="block text-[10px] font-bold text-[#065F46] uppercase">Verified</span>
                        <span className="text-sm font-extrabold text-[#065F46]">{stats.confirmed}</span>
                    </div>
                </div>
            </div>

            {statusInfo(userStatus) ? (
                <div className="mt-5 w-full">
                    <div
                        className="w-full text-center rounded-lg py-2 text-xs font-bold tracking-wide uppercase shadow-sm"
                        style={{
                            backgroundColor: statusInfo(userStatus).bgColor,
                            color: statusInfo(userStatus).color
                        }}
                    >
                        Current Stage: {statusInfo(userStatus).name}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default StatusPieChart;