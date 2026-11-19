import { DEFAULT_APP_CONFIG } from '../config/appConfig'
import { AppConfigState } from '../types/appConfig'

const LOCAL_STORAGE_KEY = 'ahg_app_config_override'

type Listener = (config: AppConfigState) => void
const listeners = new Set<Listener>()

function notifyListeners(config: AppConfigState) {
  listeners.forEach((listener) => {
    try {
      listener(config)
    } catch (e) {
      console.error('Error notifying app config subscriber:', e)
    }
  })
}

/**
 * Retrieves the active application configuration.
 * Prioritizes localStorage override, then defaults to DEFAULT_APP_CONFIG.
 */
export function getAppConfig(): AppConfigState {
  if (typeof window === 'undefined') {
    return DEFAULT_APP_CONFIG
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return DEFAULT_APP_CONFIG
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_APP_CONFIG,
      ...parsed,
      industries: {
        ...DEFAULT_APP_CONFIG.industries,
        ...(parsed.industries || {}),
      },
      upload_rules: {
        ...DEFAULT_APP_CONFIG.upload_rules,
        ...(parsed.upload_rules || {}),
      },
      portal_defaults: {
        ...DEFAULT_APP_CONFIG.portal_defaults,
        ...(parsed.portal_defaults || {}),
      },
      branding: {
        ...DEFAULT_APP_CONFIG.branding,
        ...(parsed.branding || {}),
      },
      support_contact: {
        ...DEFAULT_APP_CONFIG.support_contact,
        ...(parsed.support_contact || {}),
      },
      merchant_stages: parsed.merchant_stages || DEFAULT_APP_CONFIG.merchant_stages,
      processors: parsed.processors || DEFAULT_APP_CONFIG.processors,
      ghl_field_map: {
        ...DEFAULT_APP_CONFIG.ghl_field_map,
        ...(parsed.ghl_field_map || {}),
      },
      ghl_industry_map: {
        ...DEFAULT_APP_CONFIG.ghl_industry_map,
        ...(parsed.ghl_industry_map || {}),
      },
    }
  } catch (err) {
    console.warn('Failed to parse app config from localStorage:', err)
    return DEFAULT_APP_CONFIG
  }
}

/**
 * Saves all sections of App Config in localStorage and attempts remote synchronization.
 */
export async function saveAppConfig(newConfig: AppConfigState): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newConfig))
    } catch (err: any) {
      console.warn('Failed to save app config to localStorage:', err)
      return { success: false, error: err?.message || 'Storage error' }
    }
  }

  notifyListeners(newConfig)

  // Attempt backend persistence if available
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ahg_admin_token') : null
    if (token) {
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newConfig),
      }).catch(() => {
        // Backend might be offline in demo mode; silent fallback
      })
    }
  } catch {
    // ignore network errors in offline/demo mode
  }

  return { success: true }
}

/**
 * Resets local overrides and restores initial 0003_seed_app_config defaults.
 */
export async function resetAppConfig(): Promise<AppConfigState> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    } catch {
      // ignore
    }
  }
  notifyListeners(DEFAULT_APP_CONFIG)
  return DEFAULT_APP_CONFIG
}

/**
 * React hook or listener subscription for config changes
 */
export function subscribeAppConfig(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
