import React, { useState, useEffect, useMemo } from 'react'
import {
  FiArrowLeft,
  FiRefreshCw,
  FiSave,
  FiCheck,
  FiLayers,
  FiFileText,
  FiGlobe,
  FiPhone,
  FiUploadCloud,
  FiSliders,
  FiSettings,
} from 'react-icons/fi'
import { toast } from 'react-toastify'
import { AppConfigState } from '../../types/appConfig'
import { DEFAULT_APP_CONFIG } from '../../config/appConfig'
import { fetchAppConfig, saveAppConfig, resetAppConfig } from '../../services/appConfig.service'
import { MerchantStagesSection } from './components/MerchantStagesSection'
import { IndustriesSection } from './components/IndustriesSection'
import { BrandingSection } from './components/BrandingSection'
import { SupportContactSection } from './components/SupportContactSection'
import { UploadRulesSection } from './components/UploadRulesSection'
import { ProcessorsGhlSection } from './components/ProcessorsGhlSection'

interface AppConfigDashboardProps {
  onBack: () => void
  adminToken?: string | null
}

type TabType = 'all' | 'stages' | 'industries' | 'branding' | 'support' | 'rules' | 'processors'

export function AppConfigDashboard({ onBack, adminToken }: AppConfigDashboardProps) {
  const [loading, setLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [isSaved, setIsSaved] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<TabType>('all')

  const [config, setConfig] = useState<AppConfigState>(DEFAULT_APP_CONFIG)
  const [initialSnapshot, setInitialSnapshot] = useState<string>('')

  // Load configuration straight from backend on mount
  useEffect(() => {
    let mounted = true
    setLoading(true)
    setLoadError(null)

    fetchAppConfig(adminToken)
      .then((data) => {
        if (mounted) {
          setConfig(data)
          setInitialSnapshot(JSON.stringify(data))
        }
      })
      .catch((err: any) => {
        if (mounted) {
          const msg = err?.message || 'Failed to load application configuration from server'
          setLoadError(msg)
          toast.error(msg)
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [adminToken])

  // Dirty state tracking
  const currentSnapshot = useMemo(() => {
    return JSON.stringify(config)
  }, [config])

  const hasChanges = Boolean(initialSnapshot && currentSnapshot !== initialSnapshot)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await saveAppConfig(config, adminToken)
      if (res.success) {
        setInitialSnapshot(currentSnapshot)
        setIsSaved(true)
        toast.success('App configuration saved to database')
      } else {
        toast.error(res.error || 'Failed to save configuration')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error saving configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (window.confirm('Reset all configuration values on the database to 0003 seed migration defaults?')) {
      setSaving(true)
      try {
        const resetDefaults = await resetAppConfig(adminToken)
        setConfig(resetDefaults)
        setInitialSnapshot(JSON.stringify(resetDefaults))
        setIsSaved(true)
        toast.info('App configuration reset to migration defaults on database')
      } catch (err: any) {
        toast.error(err?.message || 'Failed to reset configuration')
      } finally {
        setSaving(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-gray-200 shadow-2xs">
        <FiRefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
        <p className="text-sm font-semibold text-gray-700">Loading configuration from server...</p>
      </div>
    )
  }

  if (loadError && !initialSnapshot) {
    return (
      <div className="max-w-7xl mx-auto p-12 flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border border-gray-200 shadow-2xs text-center">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm max-w-md">
          <p className="font-bold">Failed to load configuration</p>
          <p className="mt-1 text-xs text-rose-600">{loadError}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Merchants
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black mb-2 transition-colors"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Merchants</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
              <FiSettings className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              App Config
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-2xl">
            Manage merchant underwriting stages, document requirements, portal branding, and GoHighLevel CRM mappings.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg transition-colors shadow-2xs"
            title="Reset to 0003 seed migration defaults"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${
              hasChanges
                ? 'bg-[#02F1DE] hover:bg-[#00dbc9] text-black shadow-md cursor-pointer'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-70'
            }`}
          >
            {saving ? (
              <>
                <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : isSaved && !hasChanges ? (
              <>
                <FiCheck className="w-3.5 h-3.5 text-green-700 font-extrabold" />
                <span className="text-green-800">Saved</span>
              </>
            ) : (
              <>
                <FiSave className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-200 text-xs font-bold">
        {[
          { id: 'all', label: 'All Sections', icon: FiLayers },
          { id: 'stages', label: 'Merchant Stages', icon: FiLayers },
          { id: 'industries', label: 'Industries & Docs', icon: FiFileText },
          { id: 'branding', label: 'Branding & Theme', icon: FiGlobe },
          { id: 'support', label: 'Support Contact', icon: FiPhone },
          { id: 'rules', label: 'Upload Rules', icon: FiUploadCloud },
          { id: 'processors', label: 'Processors & GHL', icon: FiSliders },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-black text-white shadow-2xs'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-end text-xs text-gray-500 px-1">
        <div>
          {hasChanges ? (
            <span className="inline-flex items-center gap-1.5 text-amber-600 font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Unsaved changes pending
            </span>
          ) : isSaved ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
              <FiCheck className="h-3.5 w-3.5 text-emerald-600" />
              All changes saved and active
            </span>
          ) : (
            <span className="text-gray-400">Up to date</span>
          )}
        </div>
      </div>

      {/* Section Content */}
      <div className="space-y-8">
        {(activeTab === 'all' || activeTab === 'stages') && (
          <MerchantStagesSection
            stages={config.merchant_stages}
            onUpdateStageName={(idx, name) => {
              const updated = [...config.merchant_stages]
              updated[idx] = { ...updated[idx], name }
              setConfig({ ...config, merchant_stages: updated })
            }}
            onAddAlias={(sIdx, alias) => {
              const updated = [...config.merchant_stages]
              const currentAliases = updated[sIdx].aliases || []
              if (!currentAliases.includes(alias)) {
                updated[sIdx] = { ...updated[sIdx], aliases: [...currentAliases, alias] }
                setConfig({ ...config, merchant_stages: updated })
              }
            }}
            onRemoveAlias={(sIdx, aIdx) => {
              const updated = [...config.merchant_stages]
              const currentAliases = (updated[sIdx].aliases || []).filter((_, i) => i !== aIdx)
              updated[sIdx] = { ...updated[sIdx], aliases: currentAliases }
              setConfig({ ...config, merchant_stages: updated })
            }}
            onAddStage={(name) => {
              const nextVal =
                config.merchant_stages.length > 0
                  ? Math.max(...config.merchant_stages.map((s) => s.value)) + 1
                  : 1
              const newStage = {
                value: nextVal,
                name: name.trim(),
                aliases: [`stage_${nextVal}`, name.trim().toLowerCase()],
              }
              setConfig({
                ...config,
                merchant_stages: [...config.merchant_stages, newStage],
              })
              toast.info(`Added stage "${name}"`)
            }}
            onDeleteStage={(idx) => {
              if (config.merchant_stages.length <= 1) {
                toast.warning('At least one stage is required')
                return
              }
              const stageName = config.merchant_stages[idx].name
              const updated = config.merchant_stages
                .filter((_, i) => i !== idx)
                .map((stage, i) => ({
                  ...stage,
                  value: i + 1,
                }))
              setConfig({
                ...config,
                merchant_stages: updated,
              })
              toast.info(`Removed stage "${stageName}"`)
            }}
          />
        )}

        {(activeTab === 'all' || activeTab === 'industries') && (
          <IndustriesSection
            industries={config.industries}
            onUpdateIndustry={(indKey, updatedInd) => {
              setConfig({
                ...config,
                industries: {
                  ...config.industries,
                  [indKey]: updatedInd,
                },
              })
            }}
          />
        )}

        {(activeTab === 'all' || activeTab === 'branding') && (
          <BrandingSection
            branding={config.branding}
            portalDefaults={config.portal_defaults}
            onUpdateBranding={(field, value) => {
              setConfig({
                ...config,
                branding: {
                  ...config.branding,
                  [field]: value,
                },
              })
            }}
            onUpdatePortalDefaults={(field, value) => {
              setConfig({
                ...config,
                portal_defaults: {
                  ...config.portal_defaults,
                  [field]: value,
                },
              })
            }}
          />
        )}

        {(activeTab === 'all' || activeTab === 'support') && (
          <SupportContactSection
            contact={config.support_contact}
            onUpdateContact={(field, value) => {
              setConfig({
                ...config,
                support_contact: {
                  ...config.support_contact,
                  [field]: value,
                },
              })
            }}
          />
        )}

        {(activeTab === 'all' || activeTab === 'rules') && (
          <UploadRulesSection
            uploadRules={config.upload_rules}
            onUpdateRules={(updatedRules) => {
              setConfig({
                ...config,
                upload_rules: updatedRules,
              })
            }}
          />
        )}

        {(activeTab === 'all' || activeTab === 'processors') && (
          <ProcessorsGhlSection
            processors={config.processors}
            ghlFieldMap={config.ghl_field_map}
            ghlIndustryMap={config.ghl_industry_map}
            onUpdateProcessors={(processors) => {
              setConfig({
                ...config,
                processors,
              })
            }}
            onUpdateGhlFieldMap={(ghl_field_map) => {
              setConfig({
                ...config,
                ghl_field_map,
              })
            }}
            onUpdateGhlIndustryMap={(ghl_industry_map) => {
              setConfig({
                ...config,
                ghl_industry_map,
              })
            }}
          />
        )}
      </div>

      {/* Footer Save & Changes summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {hasChanges && (
            <span className="text-amber-600 font-semibold">
              You have unsaved changes in this session. Don't forget to save.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
          >
            Back to Merchants
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${
              hasChanges
                ? 'bg-[#02F1DE] hover:bg-[#00dbc9] text-black shadow-md'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-70'
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
