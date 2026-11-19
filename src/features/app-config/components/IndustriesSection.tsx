import React, { useState } from 'react'
import { FiFileText, FiPlus, FiTrash2, FiExternalLink, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { IndustryConfig, SectionConfig, DocumentItemConfig } from '../../../types/appConfig'
import { SectionHeading, FieldLabel } from './common'

interface IndustriesSectionProps {
  industries: Record<string, IndustryConfig>
  onUpdateIndustry: (key: string, updated: IndustryConfig) => void
}

export function IndustriesSection({ industries, onUpdateIndustry }: IndustriesSectionProps) {
  const industryKeys = Object.keys(industries)
  const [selectedKey, setSelectedKey] = useState<string>(industryKeys[0] || 'peptide')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    core: true,
    financial: true,
    peptide_compliance: true,
    hemp_compliance: true,
    compliance: true,
    kratom_compliance: true,
    mushroom_compliance: true,
    telehealth_compliance: true,
    nonprofit_compliance: true,
    signatures: true,
  })

  const currentIndustry = industries[selectedKey] || {
    label: '',
    description: '',
    intro: '',
    licensingNote: '',
    sections: [],
  }

  const toggleSection = (secId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }))
  }

  const handleUpdateIndustryField = (field: keyof IndustryConfig, value: any) => {
    onUpdateIndustry(selectedKey, {
      ...currentIndustry,
      [field]: value,
    })
  }

  const handleUpdateDocument = (
    sectionIndex: number,
    docIndex: number,
    field: keyof DocumentItemConfig,
    value: any
  ) => {
    const updatedSections = [...currentIndustry.sections]
    const updatedDocs = [...updatedSections[sectionIndex].documents]
    updatedDocs[docIndex] = {
      ...updatedDocs[docIndex],
      [field]: value,
    }
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      documents: updatedDocs,
    }
    onUpdateIndustry(selectedKey, {
      ...currentIndustry,
      sections: updatedSections,
    })
  }

  const handleAddDocument = (sectionIndex: number) => {
    const updatedSections = [...currentIndustry.sections]
    const currentDocs = updatedSections[sectionIndex].documents || []
    // Determine next unique type ID
    const maxType = currentDocs.reduce((max: number, d: DocumentItemConfig) => Math.max(max, d.type || 0), (sectionIndex + 1) * 100)
    const newDoc: DocumentItemConfig = {
      type: maxType + 1,
      name: 'New Document Requirement',
      description: 'Document details and specifications for underwriting review.',
      required: true,
      tag: null,
    }
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      documents: [...currentDocs, newDoc],
    }
    onUpdateIndustry(selectedKey, {
      ...currentIndustry,
      sections: updatedSections,
    })
  }

  const handleRemoveDocument = (sectionIndex: number, docIndex: number) => {
    const updatedSections = [...currentIndustry.sections]
    const updatedDocs = updatedSections[sectionIndex].documents.filter((_: DocumentItemConfig, i: number) => i !== docIndex)
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      documents: updatedDocs,
    }
    onUpdateIndustry(selectedKey, {
      ...currentIndustry,
      sections: updatedSections,
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-2xs">
      <SectionHeading
        icon={FiFileText}
        title="Industries & Document Requirements"
        description="Configure checklist documents, legal guidelines, and compliance requirements for each merchant industry sector."
      />

      {/* Industry Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {industryKeys.map((key) => {
          const ind = industries[key]
          const isSelected = key === selectedKey
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKey(key)}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
                isSelected
                  ? 'bg-black text-white shadow-2xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {ind.label || key}
            </button>
          )
        })}
      </div>

      {/* Industry General Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/70 p-4 md:p-5 rounded-xl border border-gray-200">
        <div>
          <FieldLabel>Industry Display Label</FieldLabel>
          <input
            type="text"
            value={currentIndustry.label || ''}
            onChange={(e) => handleUpdateIndustryField('label', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <FieldLabel>Description / Summary</FieldLabel>
          <input
            type="text"
            value={currentIndustry.description || ''}
            onChange={(e) => handleUpdateIndustryField('description', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel>Welcome Portal Intro Text</FieldLabel>
          <textarea
            rows={2}
            value={currentIndustry.intro || ''}
            onChange={(e) => handleUpdateIndustryField('intro', e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel>Licensing & Underwriting Note</FieldLabel>
          <textarea
            rows={2}
            value={currentIndustry.licensingNote || ''}
            onChange={(e) => handleUpdateIndustryField('licensingNote', e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
          />
        </div>
      </div>

      {/* Sections and Documents */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">
            Document Sections ({currentIndustry.sections?.length || 0})
          </h3>
        </div>

        {(currentIndustry.sections || []).map((section: SectionConfig, sIdx: number) => {
          const isExpanded = expandedSections[section.id] ?? true
          const docsCount = section.documents?.length || 0

          return (
            <div
              key={section.id}
              className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-2xs"
            >
              {/* Section Header Accordion */}
              <div
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-200"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{section.title}</span>
                    <span className="text-xs bg-gray-200/80 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                      {docsCount} {docsCount === 1 ? 'doc' : 'docs'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddDocument(sIdx)
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-2xs"
                  >
                    <FiPlus className="w-3 h-3 text-teal-600" />
                    <span>Add Doc</span>
                  </button>
                  <button type="button" className="p-1 text-gray-400 hover:text-gray-700">
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>
              </div>

              {/* Documents List */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  {docsCount === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400 italic">
                      No documents configured in this section.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {section.documents.map((doc: DocumentItemConfig, dIdx: number) => (
                        <div
                          key={doc.type}
                          className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/40 hover:bg-white transition-all space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            {/* Type Number badge */}
                            <span className="shrink-0 px-2 py-1 rounded bg-gray-100 border border-gray-300 text-xs font-mono font-bold text-gray-700 w-16 text-center">
                              #{doc.type}
                            </span>

                            {/* Document Name input */}
                            <div className="flex-1">
                              <input
                                type="text"
                                value={doc.name}
                                onChange={(e) =>
                                  handleUpdateDocument(sIdx, dIdx, 'name', e.target.value)
                                }
                                placeholder="Document Title"
                                className="w-full px-2.5 py-1 text-xs font-bold text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                            </div>

                            {/* Required toggle */}
                            <label className="flex items-center gap-1.5 shrink-0 text-xs font-semibold text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={doc.required !== false}
                                onChange={(e) =>
                                  handleUpdateDocument(sIdx, dIdx, 'required', e.target.checked)
                                }
                                className="rounded text-teal-600 focus:ring-teal-500"
                              />
                              <span>Required</span>
                            </label>

                            {/* Tag Select */}
                            <div className="shrink-0">
                              <select
                                value={doc.tag || ''}
                                onChange={(e) =>
                                  handleUpdateDocument(
                                    sIdx,
                                    dIdx,
                                    'tag',
                                    e.target.value ? e.target.value : null
                                  )
                                }
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-700"
                              >
                                <option value="">No Tag</option>
                                <option value="Signature Doc">Signature Doc</option>
                                <option value="Google Form">Google Form</option>
                                <option value="Wait to Request">Wait to Request</option>
                              </select>
                            </div>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveDocument(sIdx, dIdx)}
                              className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                              title="Delete document requirement"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Description input */}
                          <div>
                            <input
                              type="text"
                              value={doc.description || ''}
                              onChange={(e) =>
                                handleUpdateDocument(sIdx, dIdx, 'description', e.target.value)
                              }
                              placeholder="Description / guidance for merchant upload..."
                              className="w-full px-2.5 py-1 text-xs text-gray-600 bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </div>

                          {/* Form URL if Google Form */}
                          {doc.tag === 'Google Form' && (
                            <div className="flex items-center gap-2 bg-teal-50/50 p-2 rounded border border-teal-200/60">
                              <FiExternalLink className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span className="text-[11px] font-bold text-teal-800 shrink-0">
                                Form Link:
                              </span>
                              <input
                                type="text"
                                value={doc.formUrl || ''}
                                onChange={(e) =>
                                  handleUpdateDocument(sIdx, dIdx, 'formUrl', e.target.value)
                                }
                                placeholder="https://docs.google.com/forms/..."
                                className="flex-1 px-2 py-0.5 text-xs bg-white border border-gray-300 rounded font-mono text-gray-800"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
