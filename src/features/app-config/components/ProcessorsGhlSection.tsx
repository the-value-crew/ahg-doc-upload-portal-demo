import React, { useState } from 'react'
import { FiSliders, FiPlus, FiX, FiTrash2 } from 'react-icons/fi'
import { GhlFieldMapConfig, GhlIndustryMapConfig } from '../../../types/appConfig'
import { SectionHeading, FieldLabel } from './common'

interface ProcessorsGhlSectionProps {
  processors: string[]
  ghlFieldMap: GhlFieldMapConfig
  ghlIndustryMap: GhlIndustryMapConfig
  onUpdateProcessors: (processors: string[]) => void
  onUpdateGhlFieldMap: (map: GhlFieldMapConfig) => void
  onUpdateGhlIndustryMap: (map: GhlIndustryMapConfig) => void
}

export function ProcessorsGhlSection({
  processors,
  ghlFieldMap,
  ghlIndustryMap,
  onUpdateProcessors,
  onUpdateGhlFieldMap,
  onUpdateGhlIndustryMap,
}: ProcessorsGhlSectionProps) {
  const [newProcessor, setNewProcessor] = useState('')
  const [newCrmKey, setNewCrmKey] = useState('')
  const [newInternalVal, setNewInternalVal] = useState('peptide')

  const handleAddProcessor = () => {
    const val = newProcessor.trim()
    if (!val || processors.includes(val)) return
    onUpdateProcessors([...processors, val])
    setNewProcessor('')
  }

  const handleRemoveProcessor = (proc: string) => {
    onUpdateProcessors(processors.filter((p) => p !== proc))
  }

  const handleUpdateFieldMap = (
    key: 'industry_type' | 'processor',
    field: 'id' | 'fieldKey',
    value: string
  ) => {
    onUpdateGhlFieldMap({
      ...ghlFieldMap,
      [key]: {
        ...ghlFieldMap[key],
        [field]: value,
      },
    })
  }

  const handleAddIndustryMapping = () => {
    const crmKey = newCrmKey.trim().toLowerCase()
    if (!crmKey) return
    onUpdateGhlIndustryMap({
      ...ghlIndustryMap,
      [crmKey]: newInternalVal,
    })
    setNewCrmKey('')
  }

  const handleRemoveIndustryMapping = (crmKey: string) => {
    const updated = { ...ghlIndustryMap }
    delete updated[crmKey]
    onUpdateGhlIndustryMap(updated)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-2xs">
      <SectionHeading
        icon={FiSliders}
        title="Payment Processors & CRM Mappings"
        description="Manage the selectable underwriting payment processors and GoHighLevel custom field identifiers and industry tags."
      />

      {/* Processors List */}
      <div className="space-y-3">
        <FieldLabel>Active Payment Processors</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {processors.map((proc) => (
            <span
              key={proc}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 transition-colors shadow-2xs"
            >
              <span>{proc}</span>
              <button
                type="button"
                onClick={() => handleRemoveProcessor(proc)}
                className="text-gray-400 hover:text-rose-600 transition-colors"
                title="Remove processor"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          <div className="inline-flex items-center gap-1.5">
            <input
              type="text"
              placeholder="e.g. Argyle - Nuvei"
              value={newProcessor}
              onChange={(e) => setNewProcessor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddProcessor()
                }
              }}
              className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-44"
            />
            <button
              type="button"
              onClick={handleAddProcessor}
              className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <FiPlus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* GHL Field Map */}
      <div className="pt-4 border-t border-gray-200 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
          GoHighLevel Custom Field Keys
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
            <span className="text-xs font-bold text-gray-900 block">Industry Type Field</span>
            <div>
              <FieldLabel>GHL Custom Field ID</FieldLabel>
              <input
                type="text"
                value={ghlFieldMap.industry_type?.id || ''}
                onChange={(e) => handleUpdateFieldMap('industry_type', 'id', e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-800"
              />
            </div>
            <div>
              <FieldLabel>Field Key</FieldLabel>
              <input
                type="text"
                value={ghlFieldMap.industry_type?.fieldKey || ''}
                onChange={(e) => handleUpdateFieldMap('industry_type', 'fieldKey', e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-800"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
            <span className="text-xs font-bold text-gray-900 block">Processor Field</span>
            <div>
              <FieldLabel>GHL Custom Field ID</FieldLabel>
              <input
                type="text"
                value={ghlFieldMap.processor?.id || ''}
                onChange={(e) => handleUpdateFieldMap('processor', 'id', e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-800"
              />
            </div>
            <div>
              <FieldLabel>Field Key</FieldLabel>
              <input
                type="text"
                value={ghlFieldMap.processor?.fieldKey || ''}
                onChange={(e) => handleUpdateFieldMap('processor', 'fieldKey', e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* GHL Industry Value Map */}
      <div className="pt-4 border-t border-gray-200 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
          GoHighLevel Opportunity Industry Text Mappings
        </h3>
        <p className="text-xs text-gray-500">
          Maps CRM opportunity industry text or dropdown values to portal internal industry keys.
        </p>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">CRM Opportunity Value</th>
                <th className="py-2.5 px-4">Internal Industry Key</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(ghlIndustryMap).map(([crmVal, internalKey]) => (
                <tr key={crmVal} className="hover:bg-gray-50/80">
                  <td className="py-2.5 px-4 font-mono font-medium text-gray-900">{crmVal}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono font-bold">
                      {internalKey}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveIndustryMapping(crmVal)}
                      className="text-gray-400 hover:text-rose-600 p-1"
                      title="Remove mapping"
                    >
                      <FiTrash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add industry mapping */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="CRM text (e.g. rd peptides)"
            value={newCrmKey}
            onChange={(e) => setNewCrmKey(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg w-48 font-mono"
          />
          <span className="text-xs text-gray-400">&rarr;</span>
          <select
            value={newInternalVal}
            onChange={(e) => setNewInternalVal(e.target.value)}
            className="py-1.5 pl-3 pr-8 text-xs bg-white border border-gray-300 rounded-lg font-mono cursor-pointer"
          >
            <option value="peptide">peptide</option>
            <option value="hemp">hemp</option>
            <option value="general">general</option>
            <option value="kratom">kratom</option>
            <option value="mushroom">mushroom</option>
            <option value="medical_telehealth">medical_telehealth</option>
            <option value="nonprofit">nonprofit</option>
          </select>
          <button
            type="button"
            onClick={handleAddIndustryMapping}
            className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-lg flex items-center gap-1"
          >
            <FiPlus className="w-3 h-3" />
            <span>Add Mapping</span>
          </button>
        </div>
      </div>
    </div>
  )
}
