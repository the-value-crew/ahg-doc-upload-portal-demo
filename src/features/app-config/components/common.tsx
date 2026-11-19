import React, { ReactNode } from 'react'
import { IconType } from 'react-icons'
import { FiInfo } from 'react-icons/fi'

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
      {children}
    </label>
  )
}

export function SectionHeading({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: IconType
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-gray-200 pb-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-[#02F1DE]/15 p-2 text-teal-800 border border-teal-200/50">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900">{title}</h2>
          <p className="mt-0.5 text-xs text-gray-500 leading-relaxed max-w-3xl">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CurrentPreview({
  children,
  title = 'Current live view',
}: {
  children: ReactNode
  title?: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-4 overflow-hidden">
      <div className="mb-3 flex items-center gap-1.5 text-gray-500">
        <FiInfo className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          {title}
        </span>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs">
        {children}
      </div>
    </div>
  )
}
