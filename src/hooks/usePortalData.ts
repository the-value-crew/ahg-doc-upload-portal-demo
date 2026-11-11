import { useState, useEffect, useCallback, useRef } from 'react'
import { ChecklistItem, ChecklistStats, PortalConfigSuccess } from '../../shared/types'
import { fetchPortalConfig, findMerchantOnGhl } from '../services/api.client'

function isValidHexColor(color: string | null): boolean {
  if (!color) return false
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

export function usePortalData(merchantId: string | null) {
  const [config, setConfig] = useState<PortalConfigSuccess | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [stats, setStats] = useState<ChecklistStats>({
    totalItems: 0,
    notUploaded: 0,
    pending: 0,
    confirmed: 0,
    rejected: 0,
  })
  const [merchantStatus, setMerchantStatus] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [isSyncingGhl, setIsSyncingGhl] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [is404, setIs404] = useState<boolean>(false)

  const retryCountRef = useRef<number>(0)

  const applyPortalData = useCallback((data: PortalConfigSuccess) => {
    setConfig(data)
    setChecklist(data.checklist || [])
    setStats(
      data.stats || {
        totalItems: 0,
        notUploaded: 0,
        pending: 0,
        confirmed: 0,
        rejected: 0,
      }
    )
    setMerchantStatus(data.merchant.status || 1)

    // Dynamic CSS variables & document title
    if (data.brand) {
      if (data.brand.primaryColor && isValidHexColor(data.brand.primaryColor)) {
        document.documentElement.style.setProperty('--color-primary', data.brand.primaryColor)
      }
      if (data.brand.accentColor && isValidHexColor(data.brand.accentColor)) {
        document.documentElement.style.setProperty('--color-accent', data.brand.accentColor)
      }
      if (data.brand.title) {
        document.title = data.brand.title
      }
    }
  }, [])

  const loadData = useCallback(async (): Promise<void> => {
    if (!merchantId) {
      setIs404(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setIs404(false)
    setIsSyncingGhl(false)

    try {
      // Step 1: Look up merchant in local D1 database
      const firstRes = await fetchPortalConfig(merchantId)

      if (firstRes.found) {
        applyPortalData(firstRes)
        retryCountRef.current = 0
        setLoading(false)
        return
      }

      // Step 2: Merchant not in database -> Query HighLevel using signed sync token
      setIsSyncingGhl(true)
      try {
        const ghlRes = await findMerchantOnGhl(merchantId, firstRes.syncToken)
        applyPortalData(ghlRes)
        retryCountRef.current = 0
      } catch (ghlErr: any) {
        if (ghlErr.status === 401 && retryCountRef.current < 1) {
          // Token expired or clock skew -> retry once from step 1
          retryCountRef.current += 1
          await loadData()
          return
        }
        if (ghlErr.status === 404 || ghlErr.code === 'MERCHANT_NOT_FOUND_ON_GHL') {
          setIs404(true)
        } else {
          setError(ghlErr.message || 'Error syncing merchant opportunity from HighLevel')
        }
      }
    } catch (err: any) {
      if (err.status === 404 || err.message?.includes('not found') || err.message?.includes('404')) {
        setIs404(true)
      } else {
        setError(err.message || 'Failed to load merchant portal')
      }
    } finally {
      setLoading(false)
      setIsSyncingGhl(false)
    }
  }, [merchantId, applyPortalData])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Single unified refresh path reusing portal-config
  const refresh = useCallback(async () => {
    if (!merchantId) return
    try {
      const res = await fetchPortalConfig(merchantId)
      if (res.found) {
        applyPortalData(res)
      }
    } catch (err: any) {
      console.error('Failed to refresh portal data:', err)
    }
  }, [merchantId, applyPortalData])

  return {
    config,
    checklist,
    stats,
    merchantStatus,
    loading,
    isSyncingGhl,
    error,
    is404,
    refresh,
    reload: loadData,
  }
}
