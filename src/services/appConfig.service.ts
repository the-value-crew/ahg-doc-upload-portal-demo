import { DEFAULT_APP_CONFIG } from '../config/appConfig'
import { AppConfigState } from '../types/appConfig'

function getStoredAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('ahg_admin_token')
  } catch {
    return null
  }
}

/**
 * Merges backend config with default schema fields to ensure all required
 * sections and nested properties are always present for UI components.
 */
export function mergeWithDefaults(backendConfig: Partial<AppConfigState>): AppConfigState {
  return {
    ...DEFAULT_APP_CONFIG,
    ...backendConfig,
    industries: {
      ...DEFAULT_APP_CONFIG.industries,
      ...(backendConfig.industries || {}),
    },
    upload_rules: {
      ...DEFAULT_APP_CONFIG.upload_rules,
      ...(backendConfig.upload_rules || {}),
    },
    portal_defaults: {
      ...DEFAULT_APP_CONFIG.portal_defaults,
      ...(backendConfig.portal_defaults || {}),
    },
    branding: {
      ...DEFAULT_APP_CONFIG.branding,
      ...(backendConfig.branding || {}),
    },
    support_contact: {
      ...DEFAULT_APP_CONFIG.support_contact,
      ...(backendConfig.support_contact || {}),
    },
    merchant_stages: backendConfig.merchant_stages || DEFAULT_APP_CONFIG.merchant_stages,
    processors: backendConfig.processors || DEFAULT_APP_CONFIG.processors,
    ghl_field_map: {
      ...DEFAULT_APP_CONFIG.ghl_field_map,
      ...(backendConfig.ghl_field_map || {}),
    },
    ghl_industry_map: {
      ...DEFAULT_APP_CONFIG.ghl_industry_map,
      ...(backendConfig.ghl_industry_map || {}),
    },
  }
}

/**
 * Fetches application configuration directly from the backend API.
 */
export async function fetchAppConfig(token?: string | null): Promise<AppConfigState> {
  const authToken = token || getStoredAdminToken()
  const headers: Record<string, string> = {}
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const res = await fetch('/api/admin/config', { headers })
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`
    try {
      const errJson = await res.json()
      if (errJson && errJson.error) {
        errorMsg = errJson.error + (errJson.details ? `: ${errJson.details}` : '')
      }
    } catch {}
    throw new Error(errorMsg)
  }

  const data = await res.json()
  return mergeWithDefaults(data || {})
}

/**
 * Saves application configuration directly to the backend database.
 */
export async function saveAppConfig(
  newConfig: AppConfigState,
  token?: string | null
): Promise<{ success: boolean; error?: string }> {
  const authToken = token || getStoredAdminToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const res = await fetch('/api/admin/config', {
    method: 'POST',
    headers,
    body: JSON.stringify(newConfig),
  })

  if (!res.ok) {
    let errorMsg = `Failed to save configuration (${res.status})`
    try {
      const errJson = await res.json()
      if (errJson && errJson.error) {
        errorMsg = errJson.error + (errJson.details ? `: ${errJson.details}` : '')
      }
    } catch {}
    return { success: false, error: errorMsg }
  }

  return { success: true }
}

/**
 * Resets application configuration on the database to migration defaults.
 */
export async function resetAppConfig(token?: string | null): Promise<AppConfigState> {
  const res = await saveAppConfig(DEFAULT_APP_CONFIG, token)
  if (!res.success) {
    throw new Error(res.error || 'Failed to reset configuration on database')
  }
  return DEFAULT_APP_CONFIG
}
