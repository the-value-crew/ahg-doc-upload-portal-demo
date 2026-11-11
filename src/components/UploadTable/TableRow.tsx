import { useState } from 'react'
import { ChecklistItem, FileStatus, SupportContactConfig } from '../../../shared/types'
import StatusBadge from './StatusBadge'
import Dropzone from '../Dropzone'
import { DropzoneMode } from '../../enums'
import {
  FiChevronDown,
  FiChevronUp,
  FiUploadCloud,
  FiX,
  FiFileText,
  FiDownload,
  FiExternalLink,
} from 'react-icons/fi'
import { requestMerchantDownloadUrl } from '../../services/api.client'
import { toast } from 'react-toastify'

interface TableRowProps {
  item: ChecklistItem
  merchantId: string
  supportContact?: SupportContactConfig
  onFileUpload: () => void
  adminMode?: boolean
  onStatusChange?: (docType: number, newStatus: number) => void
  onVerify?: (docType: number) => void
  onReject?: (docType: number) => void
  onReset?: (docType: number) => void
  onView?: (docType: number, filename?: string) => void
}

function TableRow({
  item,
  merchantId,
  supportContact,
  onFileUpload,
  adminMode = false,
  onStatusChange,
  onVerify,
  onReject,
  onReset,
  onView,
}: TableRowProps) {
  const [expanded, setExpanded] = useState<boolean>(false)
  const [dropzoneVisibility, setDropzoneVisibility] = useState<boolean>(false)

  const isUploaded = item.status !== FileStatus.NOT_UPLOADED && (item.status as any) !== 'not-uploaded' && item.status !== 0
  const isRejected = item.status === FileStatus.REJECTED || item.status === 3

  const handleMerchantDownload = async () => {
    if (!merchantId) return
    try {
      const res = await requestMerchantDownloadUrl(merchantId, item.type)
      window.open(res.url, '_blank')
    } catch (err: any) {
      toast.error('Download link error: ' + err.message)
    }
  }

  return (
    <>
      <tr
        className={`border-b border-gray-100 transition-colors ${
          expanded ? 'bg-gray-50/80' : 'bg-white hover:bg-gray-50/40'
        }`}
      >
        {/* 1. Document Name & Description */}
        <td className="py-4 px-4 align-top">
          <div className="flex items-start space-x-3">
            {/* Unified File Icon for all documents */}
            <div className="w-8 h-8 rounded-full mt-0.5 shrink-0 border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-700">
              <FiFileText className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                {!isUploaded ? (
                  <span className="font-bold text-sm text-[#1A1A1A]">{item.name}</span>
                ) : (
                  <button
                    type="button"
                    onClick={adminMode && onView ? () => onView(item.type, item.filename) : handleMerchantDownload}
                    className="font-bold text-sm text-[#1A1A1A] hover:text-black text-left underline flex items-center gap-1.5"
                    title={item.filename ? `Download ${item.filename}` : 'Download Document'}
                  >
                    <span>{item.name}</span>
                    <FiDownload className="inline w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}

                {/* Database-driven Tag chip (only rendered if tag exists in template) */}
                {item.tag && (
                  <span className="text-[10px] font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                    {item.tag}
                  </span>
                )}
              </div>

              {item.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
              )}

              {/* Show Rejection Reason Note if document is rejected */}
              {isRejected && item.note && (
                <div className="mt-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2 leading-relaxed">
                  <span className="font-bold block text-rose-900 mb-0.5">Rejection Notice:</span>
                  <span>{item.note}</span>
                </div>
              )}
            </div>
          </div>
        </td>

        {/* 2. Verification Status */}
        <td className="py-4 px-4 whitespace-nowrap align-top">
          <StatusBadge status={item.status} />
        </td>

        {/* 3. Submission / Vault File or Actions */}
        <td className="py-4 px-4 align-top">
          {adminMode ? (
            // Admin Mode View
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs">
                {isUploaded ? (
                  <div>
                    <span className="font-medium text-gray-800 block truncate max-w-[200px]" title={item.filename}>
                      {item.filename || 'Uploaded File'}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {item.uploadedAt ? new Date(item.uploadedAt).toLocaleString() : 'Uploaded'}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">Not uploaded yet</span>
                )}
              </div>

              {/* Admin Actions: View Button & Status Dropdown */}
              <div className="flex items-center gap-2 whitespace-nowrap">
                {isUploaded && onView && (
                  <button
                    onClick={() => onView(item.type, item.filename)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                  >
                    View
                  </button>
                )}

                {onStatusChange ? (
                  <select
                    value={item.status === 'not-uploaded' || (item.status as any) === FileStatus.NOT_UPLOADED ? 'not-uploaded' : Number(item.status)}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val !== 'not-uploaded') {
                        onStatusChange(item.type, parseInt(val, 10))
                      }
                    }}
                    className={`text-xs font-bold rounded-lg border py-1.5 px-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                      item.status === 2 || item.status === FileStatus.VERIFIED
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : item.status === 1 || item.status === FileStatus.PENDING
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : item.status === 3 || item.status === FileStatus.REJECTED
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-gray-50 text-gray-700 border-gray-300'
                    }`}
                  >
                    {!isUploaded && <option value="not-uploaded">Not Uploaded</option>}
                    <option value={1}>Pending</option>
                    <option value={2}>Verified</option>
                    <option value={3}>Rejected</option>
                  </select>
                ) : (
                  isUploaded && (
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      {item.status !== FileStatus.VERIFIED && item.status !== 2 && onVerify && (
                        <button
                          onClick={() => onVerify(item.type)}
                          className="px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                        >
                          Verify
                        </button>
                      )}
                      {item.status !== FileStatus.REJECTED && item.status !== 3 && onReject && (
                        <button
                          onClick={() => onReject(item.type)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                        >
                          Reject
                        </button>
                      )}
                      {(item.status === FileStatus.VERIFIED || item.status === 2 || item.status === FileStatus.REJECTED || item.status === 3) && onReset && (
                        <button
                          onClick={() => onReset(item.type)}
                          className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            // Merchant Portal Mode View
            <div>
              {!isUploaded || (isRejected && dropzoneVisibility) ? (
                <div className="flex items-center gap-2 max-w-md">
                  <div className="flex-1 min-w-0">
                    <Dropzone
                      mode={DropzoneMode.SMALL}
                      onFileUpload={onFileUpload}
                      fileType={item.type as any}
                      merchantId={merchantId}
                    />
                  </div>
                  {item.formUrl && (
                    <a
                      href={item.formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs font-bold text-[#1A1A1A] bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full border border-gray-200 transition-colors shrink-0"
                      title="Open online form"
                    >
                      <span>Form</span>
                      <FiExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {dropzoneVisibility && (
                    <button
                      onClick={() => setDropzoneVisibility(false)}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
                      title="Cancel"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 text-xs text-gray-600 font-medium">
                  {dropzoneVisibility ? (
                    <div className="flex items-center gap-2 w-full max-w-xs">
                      <div className="flex-1 min-w-0">
                        <Dropzone
                          mode={DropzoneMode.SMALL}
                          onFileUpload={() => {
                            setDropzoneVisibility(false)
                            onFileUpload()
                          }}
                          fileType={item.type as any}
                          merchantId={merchantId}
                        />
                      </div>
                      <button
                        onClick={() => setDropzoneVisibility(false)}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
                        title="Cancel Re-upload"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span>
                        {item.uploadedAt
                          ? `Uploaded: ${new Date(item.uploadedAt).toLocaleDateString()}`
                          : 'Uploaded'}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setDropzoneVisibility(true)}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-[#1A1A1A] bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors border border-gray-200"
                          title="Re-upload replacement document"
                        >
                          <FiUploadCloud className="w-3.5 h-3.5" />
                          <span>{isRejected ? 'Re-upload' : 'Replace'}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </td>

        {/* 4. Guidelines Caret */}
        <td className="py-4 px-4 text-right align-top">
          <button
            onClick={() => setExpanded(!expanded)}
            title="Document Guidelines"
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors ml-auto"
          >
            {expanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>

      {/* Accordion Expand for Guidelines */}
      {expanded && (
        <tr className="bg-gray-50/70 border-b border-gray-200">
          <td colSpan={4} className="p-4 sm:p-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-2xs">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-[#02F1DE] mr-2"></span>
                  Underwriting Requirement: {item.name}
                </h4>
                {item.formUrl && (
                  <a
                    href={item.formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-black bg-[#02F1DE] hover:bg-[#00dbc9] px-3 py-1 rounded-md transition-colors inline-flex items-center gap-1"
                  >
                    <span>Open External Form</span>
                    <FiExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">
                {item.description || 'Please provide clear, legible scans in PDF or image format.'}
              </p>
              {supportContact?.helpText && (
                <div className="text-[11px] text-gray-500">
                  {supportContact.helpText}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default TableRow
