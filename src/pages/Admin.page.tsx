import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  AdminMerchantItem,
  ChecklistItem,
  FileStatus,
  HostToIframeMessage,
  IframeToHostMessage,
} from '../../shared/types'
import { UserStatus } from '../enums'
import {
  adminLogin,
  fetchAdminMerchants,
  fetchAdminMerchantDetail,
  updateAdminMerchantStatus,
  updateDocumentStatus,
  requestAdminDownloadUrl,
} from '../services/api.client'
import StatsHero from '../components/StatsHero'
import UploadTable from '../components/UploadTable/UploadTable'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  FiArrowLeft,
  FiExternalLink,
  FiSearch,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiRefreshCw,
  FiX,
  FiLogOut,
} from 'react-icons/fi'

export const MERCHANT_STATUS_LABELS: Record<number, string> = {
  1: 'Onboarding booked',
  2: 'Doc Collection',
  3: 'Application in review',
  4: 'Approved',
  5: 'Live and processing',
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ahg_admin_token')
    } catch {
      return null
    }
  })
  const [password, setPassword] = useState<string>('')
  const [loginError, setLoginError] = useState<string | null>(null)

  // Navigation: 'merchants' | 'detail'
  const [currentView, setCurrentView] = useState<'merchants' | 'detail'>('merchants')
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null)

  // Screen 1: Server-side search, status filter, and pagination
  const [merchants, setMerchants] = useState<AdminMerchantItem[]>([])
  const [merchantsLoading, setMerchantsLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(10)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)

  // Screen 2: Merchant Detail
  const [detailLoading, setDetailLoading] = useState<boolean>(false)
  const [detailData, setDetailData] = useState<any>(null)

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false)
  const [rejectingDocType, setRejectingDocType] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string>('')

  const containerRef = useRef<HTMLDivElement>(null)

  // 1. PostMessage Handshake & Listener
  useEffect(() => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'IFRAME_MOUNTED' } as IframeToHostMessage, '*')
    }

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as HostToIframeMessage
      if (!data || typeof data !== 'object') return

      if (data.type === 'AUTH_TOKEN' && data.token) {
        setToken(data.token)
        try {
          localStorage.setItem('ahg_admin_token', data.token)
        } catch {
          // ignore
        }
      } else if (data.type === 'FILTER_TENANT' && data.tenant) {
        if (data.tenant === 'ALL') {
          setSelectedMerchantId(null)
          setCurrentView('merchants')
        } else {
          setSelectedMerchantId(data.tenant)
          setCurrentView('detail')
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // 2. ResizeObserver for dynamic iframe height sizing
  useEffect(() => {
    if (!containerRef.current) return

    const emitResize = () => {
      const height = document.documentElement.scrollHeight
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'RESIZE', height } as IframeToHostMessage, '*')
      }
    }

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(emitResize)
    })

    observer.observe(containerRef.current)
    emitResize()

    return () => observer.disconnect()
  }, [currentView, merchants, detailData, token])

  // 3. Admin Authentication Handlers (Login & Persistent Logout)
  const handleLogout = useCallback(() => {
    setToken(null)
    setPassword('')
    setLoginError(null)
    try {
      localStorage.removeItem('ahg_admin_token')
    } catch {
      // ignore
    }
    toast.info('Logged out successfully')
  }, [])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    try {
      const res = await adminLogin(password)
      setToken(res.token)
      try {
        localStorage.setItem('ahg_admin_token', res.token)
      } catch (err) {
        console.error('Failed to save admin token in localStorage', err)
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed')
    }
  }

  // 4. Load Merchants List with server-side query parameters
  const loadMerchantsList = useCallback(async () => {
    if (!token) return
    setMerchantsLoading(true)
    try {
      const res = await fetchAdminMerchants(token, searchQuery, page, perPage, statusFilter)
      setMerchants(res.data || [])
      setTotalCount(res.pagination.total)
      setTotalPages(res.pagination.totalPages)
    } catch (err: any) {
      if (err.message && (err.message.includes('401') || err.message.includes('Unauthorized'))) {
        handleLogout()
        toast.error('Session expired. Please sign in again.')
        return
      }
      toast.error('Failed to load merchants: ' + err.message)
    } finally {
      setMerchantsLoading(false)
    }
  }, [token, searchQuery, page, perPage, statusFilter, handleLogout])

  useEffect(() => {
    if (token && currentView === 'merchants') {
      loadMerchantsList()
    }
  }, [token, currentView, loadMerchantsList])

  // 5. Navigation between screens with URL sync
  const handleViewMerchantDetail = (merchantId: string) => {
    setSelectedMerchantId(merchantId)
    setCurrentView('detail')
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('merchant', merchantId)
      window.history.pushState({}, '', url.toString())
    } catch {
      // ignore
    }
  }

  const handleBackToMerchants = () => {
    setCurrentView('merchants')
    setSelectedMerchantId(null)
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('merchant')
      window.history.pushState({}, '', url.toString())
    } catch {
      // ignore
    }
    loadMerchantsList()
  }

  // Sync initial URL on load
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search)
      const urlMerchant = params.get('merchant')
      if (urlMerchant && urlMerchant !== 'ALL') {
        setSelectedMerchantId(urlMerchant)
        setCurrentView('detail')
      } else {
        setSelectedMerchantId(null)
        setCurrentView('merchants')
      }
    }

    if (token) {
      syncFromUrl()
    }

    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [token])

  // 6. Load Detail View Data for Selected Merchant
  const loadMerchantDetail = useCallback(async () => {
    if (!token || !selectedMerchantId || currentView !== 'detail') return
    setDetailLoading(true)
    try {
      const data = await fetchAdminMerchantDetail(token, selectedMerchantId)
      setDetailData(data)
    } catch (err: any) {
      if (err.message && (err.message.includes('401') || err.message.includes('Unauthorized'))) {
        handleLogout()
        toast.error('Session expired. Please sign in again.')
        return
      }
      toast.error('Failed to load merchant details: ' + err.message)
    } finally {
      setDetailLoading(false)
    }
  }, [token, selectedMerchantId, currentView, handleLogout])

  useEffect(() => {
    if (token && selectedMerchantId && currentView === 'detail') {
      loadMerchantDetail()
    }
  }, [token, selectedMerchantId, currentView, loadMerchantDetail])

  // 7. Update Merchant Underwriting Stage
  const handleUpdateMerchantStatus = async (merchantId: string, newStatus: number) => {
    if (!token) return
    try {
      await updateAdminMerchantStatus(token, merchantId, newStatus)
      toast.success(`Merchant status updated to "${MERCHANT_STATUS_LABELS[newStatus]}"`)

      // Update in detail view state if active
      if (detailData && detailData.merchant.id === merchantId) {
        setDetailData({
          ...detailData,
          merchant: { ...detailData.merchant, status: newStatus },
        })
      }

      // Update in merchants list state if present
      setMerchants((prev) =>
        prev.map((m) => (m.id === merchantId ? { ...m, status: newStatus } : m))
      )
    } catch (err: any) {
      toast.error('Failed to update merchant status: ' + err.message)
    }
  }

  // 8. Document Action Handlers
  const handleViewDocument = async (docType: number, filename?: string) => {
    if (!token || !selectedMerchantId) return
    try {
      const { url } = await requestAdminDownloadUrl(token, selectedMerchantId, docType)
      window.open(url, '_blank')
    } catch (err: any) {
      toast.error('Failed to open document: ' + err.message)
    }
  }

  const handleDocumentStatusChange = async (docType: number, newStatus: number) => {
    if (!token || !selectedMerchantId) return

    if (newStatus === FileStatus.REJECTED || newStatus === 3) {
      handleOpenRejectModal(docType)
      return
    }

    try {
      const res = await updateDocumentStatus(token, selectedMerchantId, docType, newStatus)
      if (newStatus === FileStatus.VERIFIED || newStatus === 2) {
        toast.success('Document marked Verified')
      } else if (newStatus === FileStatus.PENDING || newStatus === 1) {
        toast.info('Document status set to Pending')
      }

      if (res.checklist && res.stats) {
        setDetailData((prev: any) => ({
          ...prev,
          checklist: res.checklist,
          stats: res.stats,
        }))
      } else {
        loadMerchantDetail()
      }
    } catch (err: any) {
      toast.error('Failed to update document status: ' + err.message)
    }
  }

  const handleVerifyDocument = async (docType: number) => {
    if (!token || !selectedMerchantId) return
    try {
      const res = await updateDocumentStatus(token, selectedMerchantId, docType, FileStatus.VERIFIED)
      toast.success('Document marked Verified')
      if (res.checklist && res.stats) {
        setDetailData((prev: any) => ({
          ...prev,
          checklist: res.checklist,
          stats: res.stats,
        }))
      } else {
        loadMerchantDetail()
      }
    } catch (err: any) {
      toast.error('Failed to verify document: ' + err.message)
    }
  }

  const handleResetDocument = async (docType: number) => {
    if (!token || !selectedMerchantId) return
    try {
      const res = await updateDocumentStatus(token, selectedMerchantId, docType, FileStatus.PENDING)
      toast.info('Document reset to Pending')
      if (res.checklist && res.stats) {
        setDetailData((prev: any) => ({
          ...prev,
          checklist: res.checklist,
          stats: res.stats,
        }))
      } else {
        loadMerchantDetail()
      }
    } catch (err: any) {
      toast.error('Failed to reset document: ' + err.message)
    }
  }

  const handleOpenRejectModal = (docType: number) => {
    setRejectingDocType(docType)
    setRejectionReason('')
    setRejectModalOpen(true)
  }

  const handleConfirmReject = async () => {
    if (!token || !selectedMerchantId || rejectingDocType === null) return
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason')
      return
    }

    try {
      const res = await updateDocumentStatus(
        token,
        selectedMerchantId,
        rejectingDocType,
        FileStatus.REJECTED,
        rejectionReason.trim()
      )
      toast.warn('Document rejected with reason recorded')
      setRejectModalOpen(false)
      setRejectingDocType(null)
      setRejectionReason('')

      if (res.checklist && res.stats) {
        setDetailData((prev: any) => ({
          ...prev,
          checklist: res.checklist,
          stats: res.stats,
        }))
      } else {
        loadMerchantDetail()
      }
    } catch (err: any) {
      toast.error('Failed to reject document: ' + err.message)
    }
  }

  // Login view
  if (!token) {
    return (
      <div ref={containerRef} className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="w-3 h-3 rounded-full bg-[#02F1DE]"></span>
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Admin Portal Login</h2>
          </div>
          <p className="text-xs text-gray-500 mb-6">
            Enter administrative password for underwriting review and management.
          </p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {loginError && <p className="text-xs text-red-600">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 font-sans">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* =========================================================================
          SCREEN 1: MERCHANTS PORTFOLIO OVERVIEW
          ========================================================================= */}
      {currentView === 'merchants' && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-200">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Doc Portal Admin</h1>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Merchant account portfolio, document review, and status management.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative w-56 sm:w-72">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="py-2 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="ALL">All Stages</option>
                <option value="1">1. Onboarding booked</option>
                <option value="2">2. Doc Collection</option>
                <option value="3">3. Application in review</option>
                <option value="4">4. Approved</option>
                <option value="5">5. Live and processing</option>
              </select>

              <button
                onClick={loadMerchantsList}
                disabled={merchantsLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg transition-colors shrink-0"
                title="Refresh Merchants"
              >
                <FiRefreshCw className={merchantsLoading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-gray-300 hover:border-rose-300 rounded-lg transition-colors shrink-0 shadow-2xs"
                title="Log Out of Admin Portal"
              >
                <FiLogOut className="text-sm" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>

          {/* Merchants Table */}
          {merchantsLoading ? (
            <div className="p-16 text-center text-gray-400 bg-white rounded-xl border border-gray-200">
              Loading merchant portfolio...
            </div>
          ) : merchants.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-xl border border-gray-200 text-gray-500">
              {searchQuery ? `No merchants found matching "${searchQuery}".` : 'No merchants registered yet.'}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-2xs border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Merchant</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Processor</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Stage</th>
                      <th className="py-3.5 px-4">Document Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {merchants.map((m) => {
                      return (
                        <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Merchant Name (Clickable link opening portal in new tab) */}
                          <td className="py-3.5 px-4">
                            <a
                              href={`/?merchant=${encodeURIComponent(m.id)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-gray-900 text-base hover:text-teal-700 hover:underline block"
                              title="Click to open Merchant Portal in new tab"
                            >
                              {m.name}
                            </a>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 font-medium">{m.industryLabel || m.industry}</span>
                            </div>
                          </td>

                          {/* Processor Column */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                            {m.processor ? (
                              <span className="font-semibold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md border border-gray-200">
                                {m.processor}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">None</span>
                            )}
                          </td>

                          {/* Underwriting Stage with Inline Admin Dropdown */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <select
                              value={m.status}
                              onChange={(e) => handleUpdateMerchantStatus(m.id, parseInt(e.target.value, 10))}
                              className="text-xs font-bold rounded-lg border border-gray-300 py-1.5 px-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                              <option value={1}>1. Onboarding booked</option>
                              <option value={2}>2. Doc Collection</option>
                              <option value={3}>3. Application in review</option>
                              <option value={4}>4. Approved</option>
                              <option value={5}>5. Live and processing</option>
                            </select>
                          </td>

                          {/* Status Breakdown (plain text format suitable for table cell) */}
                          <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                            <div className="space-y-0.5">
                              <span className="text-green-700 font-semibold">{m.stats.confirmed} Verified</span>
                              <span className="text-gray-300 mx-1.5">•</span>
                              <span className="text-amber-700 font-semibold">{m.stats.pending} Pending</span>
                              <span className="text-gray-300 mx-1.5">•</span>
                              <span className="text-rose-700 font-semibold">{m.stats.rejected} Rejected</span>
                              <span className="text-gray-300 mx-1.5">•</span>
                              <span className="text-gray-500 font-semibold">{m.stats.notUploaded} Not Uploaded</span>
                            </div>
                          </td>

                          {/* Actions: View Details and Merchant Upload Portal */}
                          <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleViewMerchantDetail(m.id)}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-black hover:bg-gray-800 rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
                            >
                              <span>View details</span>
                              <span>&rarr;</span>
                            </button>

                            <a
                              href={`/?merchant=${encodeURIComponent(m.id)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors inline-flex items-center gap-1"
                              title="Open Merchant Upload Portal in new tab"
                            >
                              <span>Portal</span>
                              <FiExternalLink className="w-3 h-3 text-gray-500" />
                            </a>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Server-Side Pagination Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span>
                    Showing {merchants.length > 0 ? (page - 1) * perPage + 1 : 0} to{' '}
                    {Math.min(page * perPage, totalCount)} of {totalCount} merchants
                  </span>
                  <span className="text-gray-300">|</span>
                  <label className="flex items-center gap-1.5">
                    <span>Per page:</span>
                    <select
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(parseInt(e.target.value, 10))
                        setPage(1)
                      }}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </label>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-semibold text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SCREEN 2: MERCHANT DETAIL & DOCUMENTS REVIEW
          ========================================================================= */}
      {currentView === 'detail' && (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Top Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToMerchants}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors shadow-2xs"
              >
                <FiArrowLeft className="text-sm" />
                <span>Back to Merchants</span>
              </button>

              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  {detailData?.merchant?.name || selectedMerchantId}
                </h1>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                    {detailData?.industry?.label || 'Standard Underwriting'}
                  </span>
                  {detailData?.merchant?.processor && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                      Processor: {detailData.merchant.processor}
                    </span>
                  )}
                  <span className="font-mono text-gray-400">ID: {selectedMerchantId}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Inline Underwriting Stage Selector in Header */}
              {detailData?.merchant && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 font-semibold">Stage:</span>
                  <select
                    value={detailData.merchant.status}
                    onChange={(e) => handleUpdateMerchantStatus(selectedMerchantId!, parseInt(e.target.value, 10))}
                    className="text-xs font-bold rounded-lg border border-gray-300 py-1.5 px-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={1}>1. Onboarding booked</option>
                    <option value={2}>2. Doc Collection</option>
                    <option value={3}>3. Application in review</option>
                    <option value={4}>4. Approved</option>
                    <option value={5}>5. Live and processing</option>
                  </select>
                </div>
              )}

              <a
                href={`/?merchant=${encodeURIComponent(selectedMerchantId || '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
              >
                <span>Open Merchant Portal</span>
                <FiExternalLink className="text-gray-500" />
              </a>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-gray-300 hover:border-rose-300 rounded-lg transition-colors shadow-2xs"
                title="Log Out of Admin Portal"
              >
                <FiLogOut className="text-xs" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>

          {detailLoading || !detailData ? (
            <div className="p-16 text-center text-gray-400 bg-white rounded-xl border border-gray-200">
              Loading merchant underwriting records...
            </div>
          ) : (
            <>
              {/* TOP SECTION: Shared Stats Hero with Doughnut Chart & Stepper */}
              <StatsHero
                stats={detailData.stats}
                userStatus={detailData.merchant.status as UserStatus}
                stages={detailData.stages}
                title="Underwriting Pipeline & Stats"
                subtitle={`Verification progress for ${detailData.merchant.name} (${detailData.industry?.label})`}
              />

              {/* BOTTOM SECTION: Sectioned Document Tables matching Portal layout */}
              <div className="space-y-8 pt-4">
                {(detailData.industry?.sections || []).map((section: any) => {
                  const sectionItems = (detailData.checklist || []).filter(
                    (it: ChecklistItem) => it.sectionId === section.id
                  )
                  return (
                    <UploadTable
                      key={section.id}
                      sectionTitle={section.title}
                      sectionDescription={section.description}
                      items={sectionItems}
                      merchantId={selectedMerchantId!}
                      supportContact={detailData.supportContact}
                      adminMode={true}
                      onFileUpload={() => { }}
                      onRefresh={loadMerchantDetail}
                      onView={handleViewDocument}
                      onStatusChange={handleDocumentStatusChange}
                      onVerify={handleVerifyDocument}
                      onReject={handleOpenRejectModal}
                      onReset={handleResetDocument}
                    />
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Rejection Reason Modal Dialog */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center space-x-2 text-rose-700">
                <FiXCircle className="w-5 h-5" />
                <h3 className="font-bold text-base text-gray-900">Reject Document</h3>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-gray-400 hover:text-black p-1 rounded-full"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Please enter the specific reason why this document is rejected. The merchant will see this notice on their
              portal and be prompted to re-upload a compliant file.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Rejection Reason / Note *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Document scan is blurry or expired. Please upload a high-resolution color copy..."
                className="w-full p-3 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-2xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
