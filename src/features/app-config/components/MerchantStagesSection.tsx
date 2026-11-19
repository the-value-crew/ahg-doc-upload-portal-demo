import React, { useState } from 'react'
import { FiLayers, FiPlus, FiX } from 'react-icons/fi'
import { MerchantStageConfig } from '../../../types/appConfig'
import { SectionHeading, FieldLabel, CurrentPreview } from './common'
import UserStatusStepper from '../../../components/UserStatusStepper'

interface MerchantStagesSectionProps {
  stages: MerchantStageConfig[]
  onUpdateStageName: (index: number, name: string) => void
  onAddAlias: (stageIndex: number, alias: string) => void
  onRemoveAlias: (stageIndex: number, aliasIndex: number) => void
}

export function MerchantStagesSection({
  stages,
  onUpdateStageName,
  onAddAlias,
  onRemoveAlias,
}: MerchantStagesSectionProps) {
  const [newAliasInputs, setNewAliasInputs] = useState<Record<number, string>>({})

  const handleAddAlias = (stageIndex: number) => {
    const val = (newAliasInputs[stageIndex] || '').trim()
    if (!val) return
    onAddAlias(stageIndex, val)
    setNewAliasInputs((prev) => ({ ...prev, [stageIndex]: '' }))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-2xs">
      <SectionHeading
        icon={FiLayers}
        title="Merchant Stages & Pipeline"
        description="Configure merchant underwriting progression stages, display titles, and GoHighLevel pipeline stage aliases."
      />

      {/* Live Preview */}
      <CurrentPreview title="Live Pipeline Progression Stepper (Preview at Stage 3)">
        <UserStatusStepper status={3} stages={stages} />
      </CurrentPreview>

      {/* Stages Editor List */}
      <div className="space-y-4">
        {stages.map((stage: MerchantStageConfig, sIdx: number) => {
          const aliases = stage.aliases || []
          return (
            <div
              key={stage.value}
              className="p-4 md:p-5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                    {stage.value}
                  </span>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Stage {stage.value}
                  </span>
                </div>

                <div className="flex-1">
                  <FieldLabel>Display Name</FieldLabel>
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => onUpdateStageName(sIdx, e.target.value)}
                    placeholder="e.g. Onboarding booked"
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>
              </div>

              {/* Aliases */}
              <div className="pt-2 border-t border-gray-200/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <FieldLabel>GoHighLevel Pipeline Aliases & Stage UUIDs</FieldLabel>
                  <span className="text-[11px] text-gray-400">
                    Matches incoming CRM webhooks and opportunity stages
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {aliases.map((alias: string, aIdx: number) => (
                    <span
                      key={aIdx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-white border border-gray-300 text-gray-800 shadow-2xs"
                    >
                      <span className="truncate max-w-[220px] sm:max-w-xs">{alias}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveAlias(sIdx, aIdx)}
                        className="text-gray-400 hover:text-rose-600 transition-colors"
                        title="Remove alias"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {/* Add Alias Input */}
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Add stage UUID / alias..."
                      value={newAliasInputs[sIdx] || ''}
                      onChange={(e) =>
                        setNewAliasInputs((prev) => ({ ...prev, [sIdx]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddAlias(sIdx)
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-mono bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 w-44"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddAlias(sIdx)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-200 text-xs transition-colors"
                      title="Add alias"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
