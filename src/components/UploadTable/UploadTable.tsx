import { ChecklistItem, SupportContactConfig } from '../../../shared/types'
import TableRow from './TableRow'
import { FiRefreshCw } from 'react-icons/fi'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { toastConfig } from '../../helpers/toast.helper'

interface UploadTableProps {
  sectionTitle: string
  sectionDescription?: string
  items: ChecklistItem[]
  merchantId: string
  supportContact?: SupportContactConfig
  onFileUpload: () => void
  onRefresh: () => void
  adminMode?: boolean
  onStatusChange?: (docType: number, newStatus: number) => void
  onVerify?: (docType: number) => void
  onReject?: (docType: number) => void
  onReset?: (docType: number) => void
  onView?: (docType: number, filename?: string) => void
}

function UploadTable({
  sectionTitle,
  sectionDescription,
  items,
  merchantId,
  supportContact,
  onFileUpload,
  onRefresh,
  adminMode = false,
  onStatusChange,
  onVerify,
  onReject,
  onReset,
  onView,
}: UploadTableProps) {
  const [loading, setLoading] = useState<boolean>(false)

  const handleRefreshBtnClick = () => {
    setLoading(true)
    onRefresh()
    setTimeout(() => {
      setLoading(false)
      toast.success('Document status synchronized', toastConfig)
    }, 600)
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[#1A1A1A] uppercase tracking-tight">
            {sectionTitle}
          </h2>
          {sectionDescription && (
            <p className="text-xs text-gray-500 mt-0.5">{sectionDescription}</p>
          )}
        </div>

        {!adminMode && (
          <button
            disabled={loading}
            className={`w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-100 transition-colors shadow-2xs flex items-center justify-center ${
              loading ? 'animate-spin' : ''
            }`}
            onClick={handleRefreshBtnClick}
            title="Sync document statuses"
          >
            <FiRefreshCw className="w-4 h-4 text-gray-700" />
          </button>
        )}
      </div>

      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs bg-white mt-4">
        <table className="upload-table table-auto w-full text-left">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="w-1/2 py-3 px-4">Document Item & Requirements</th>
              <th className="w-1/6 py-3 px-4 whitespace-nowrap">Verification</th>
              <th className="w-1/3 py-3 px-4">{adminMode ? 'Submission & Actions' : 'Submission & Vault File'}</th>
              <th className="w-12 py-3 px-4 text-right"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {items.map((item, index) => (
              <TableRow
                key={`${item.type}-${index}`}
                item={item}
                merchantId={merchantId}
                supportContact={supportContact}
                onFileUpload={onFileUpload}
                adminMode={adminMode}
                onStatusChange={onStatusChange}
                onVerify={onVerify}
                onReject={onReject}
                onReset={onReset}
                onView={onView}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UploadTable
