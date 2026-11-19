import React, { useState } from 'react'
import { FiUploadCloud, FiPlus, FiX } from 'react-icons/fi'
import { UploadRulesConfig } from '../../../types/appConfig'
import { SectionHeading, FieldLabel } from './common'

interface UploadRulesSectionProps {
  uploadRules: UploadRulesConfig
  onUpdateRules: (updated: UploadRulesConfig) => void
}

export function UploadRulesSection({ uploadRules, onUpdateRules }: UploadRulesSectionProps) {
  const [newExt, setNewExt] = useState('')
  const [newMime, setNewMime] = useState('')

  const maxMb = Math.round(uploadRules.maxBytes / (1024 * 1024))

  const handleMaxMbChange = (mb: number) => {
    onUpdateRules({
      ...uploadRules,
      maxBytes: mb * 1024 * 1024,
    })
  }

  const handleAddExtension = () => {
    let val = newExt.trim().toLowerCase()
    if (!val) return
    if (!val.startsWith('.')) val = '.' + val
    if (!uploadRules.acceptedExtensions.includes(val)) {
      onUpdateRules({
        ...uploadRules,
        acceptedExtensions: [...uploadRules.acceptedExtensions, val],
      })
    }
    setNewExt('')
  }

  const handleRemoveExtension = (ext: string) => {
    onUpdateRules({
      ...uploadRules,
      acceptedExtensions: uploadRules.acceptedExtensions.filter((e: string) => e !== ext),
    })
  }

  const handleAddMime = () => {
    const val = newMime.trim().toLowerCase()
    if (!val) return
    if (!uploadRules.acceptedMimeTypes.includes(val)) {
      onUpdateRules({
        ...uploadRules,
        acceptedMimeTypes: [...uploadRules.acceptedMimeTypes, val],
      })
    }
    setNewMime('')
  }

  const handleRemoveMime = (mime: string) => {
    onUpdateRules({
      ...uploadRules,
      acceptedMimeTypes: uploadRules.acceptedMimeTypes.filter((m: string) => m !== mime),
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-2xs">
      <SectionHeading
        icon={FiUploadCloud}
        title="File Upload Rules & Restrictions"
        description="Configure client-side file upload limits, supported file extensions, and security MIME type validations."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Max File Size */}
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
          <FieldLabel>Max File Size Limit (MB)</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="100"
              value={maxMb}
              onChange={(e) => handleMaxMbChange(parseInt(e.target.value, 10) || 1)}
              className="w-24 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-sm font-semibold text-gray-700">MB per file</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Equivalent to {uploadRules.maxBytes.toLocaleString()} bytes.
          </p>
        </div>

        {/* Accepted File Extensions */}
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 md:col-span-2 space-y-3">
          <FieldLabel>Accepted File Extensions</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {uploadRules.acceptedExtensions.map((ext: string) => (
              <span
                key={ext}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-white border border-gray-300 text-gray-800 shadow-2xs"
              >
                <span>{ext}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveExtension(ext)}
                  className="text-gray-400 hover:text-rose-600 transition-colors"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            ))}

            <div className="inline-flex items-center gap-1">
              <input
                type="text"
                placeholder="e.g. .pdf"
                value={newExt}
                onChange={(e) => setNewExt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddExtension()
                  }
                }}
                className="w-24 px-2 py-1 text-xs font-mono bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddExtension}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-200 text-xs"
              >
                <FiPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Accepted MIME Types */}
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 md:col-span-3 space-y-3">
          <FieldLabel>Validated MIME Types</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {uploadRules.acceptedMimeTypes.map((mime: string) => (
              <span
                key={mime}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-white border border-gray-300 text-gray-800 shadow-2xs"
              >
                <span>{mime}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMime(mime)}
                  className="text-gray-400 hover:text-rose-600 transition-colors"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            ))}

            <div className="inline-flex items-center gap-1">
              <input
                type="text"
                placeholder="e.g. application/pdf"
                value={newMime}
                onChange={(e) => setNewMime(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddMime()
                  }
                }}
                className="w-48 px-2 py-1 text-xs font-mono bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddMime}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-200 text-xs"
              >
                <FiPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
