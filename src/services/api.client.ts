import {
  AdminMerchantsResponse,
  PortalConfigResponse,
  PortalConfigSuccess,
} from '../../shared/types'

export async function fetchPortalConfig(merchantId: string): Promise<PortalConfigResponse> {
  const res = await fetch(`/api/portal-config?merchant=${encodeURIComponent(merchantId)}`)
  if (!res.ok) {
    if (res.status === 404) {
      const err = new Error('Merchant not found')
      ;(err as any).status = 404
      throw err
    }
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `Failed to load portal configuration: ${res.status}`)
  }
  return res.json()
}

export async function findMerchantOnGhl(merchantId: string, syncToken: string): Promise<PortalConfigSuccess> {
  const res = await fetch('/api/find-merchant-on-ghl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant: merchantId, syncToken }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    const err = new Error(errData.error || `HighLevel lookup failed (${res.status})`)
    ;(err as any).status = res.status
    ;(err as any).code = errData.code
    throw err
  }

  return res.json()
}

export function uploadDocumentFile(
  merchantId: string,
  documentType: number,
  file: File,
  onProgress?: (progress: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('merchantId', merchantId)
    formData.append('documentType', documentType.toString())
    formData.append('file', file)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentage = Math.round((e.loaded / e.total) * 100)
        onProgress(percentage)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch {
          resolve(xhr.responseText)
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err.error || `Upload failed with status ${xhr.status}`))
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during file upload'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'))
    })

    xhr.open('POST', '/api/upload')
    xhr.send(formData)
  })
}

export async function adminLogin(password: string): Promise<{ token: string; expiresIn: number }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Login failed')
  }
  return res.json()
}

export async function fetchAdminMerchants(
  token: string,
  q?: string,
  page: number = 1,
  perPage: number = 10,
  status?: string
): Promise<AdminMerchantsResponse> {
  const params = new URLSearchParams()
  if (q && q.trim()) params.set('q', q.trim())
  if (page) params.set('page', String(page))
  if (perPage) params.set('perPage', String(perPage))
  if (status && status !== 'ALL') params.set('status', status)

  const res = await fetch(`/api/admin/merchants?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch merchants: ${res.status}`)
  }
  return res.json()
}

export async function fetchAdminMerchantDetail(token: string, merchantId: string): Promise<any> {
  const res = await fetch(`/api/admin/merchants/${encodeURIComponent(merchantId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch merchant details: ${res.status}`)
  }
  return res.json()
}

export async function updateAdminMerchantStatus(token: string, merchantId: string, status: number): Promise<any> {
  const res = await fetch(`/api/admin/merchants/${encodeURIComponent(merchantId)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Failed to update merchant status: ${res.status}`)
  }
  return res.json()
}

export async function updateDocumentStatus(
  token: string,
  merchantId: string,
  documentType: number,
  status: number,
  note?: string
): Promise<any> {
  const res = await fetch('/api/admin/documents/status', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ merchantId, documentType, status, note }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Failed to update status: ${res.status}`)
  }
  return res.json()
}

export async function requestAdminDownloadUrl(
  token: string,
  merchantId: string,
  documentType: number
): Promise<{ url: string; expiresAt: number }> {
  const res = await fetch('/api/admin/documents/download-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ merchantId, documentType }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to generate download URL')
  }
  return res.json()
}

export async function requestMerchantDownloadUrl(
  merchantId: string,
  documentType: number
): Promise<{ url: string; expiresAt: number }> {
  const res = await fetch(
    `/api/merchants/${encodeURIComponent(merchantId)}/documents/${encodeURIComponent(documentType)}/download-url`
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to generate download URL')
  }
  return res.json()
}
