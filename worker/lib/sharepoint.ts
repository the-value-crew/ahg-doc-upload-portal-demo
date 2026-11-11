import { Env } from '../types'

interface TokenCache {
  token: string
  expiresAt: number
}

let cachedToken: TokenCache | null = null

export async function getGraphAccessToken(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.expiresAt > now + 300) {
    return cachedToken.token
  }

  const tenantId = env.AZURE_TENANT_ID
  const clientId = env.AZURE_CLIENT_ID
  const clientSecret = env.AZURE_CLIENT_SECRET

  if (
    !tenantId ||
    !clientId ||
    !clientSecret ||
    tenantId === 'dev-tenant-id' ||
    clientId === 'dev-client-id'
  ) {
    // For local development mock/fallback when real Azure tenant credentials are not yet supplied
    console.warn('Azure credentials are in dev placeholder mode. Operating in local sandbox mock.')
    return 'mock-graph-token'
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
  const params = new URLSearchParams()
  params.append('grant_type', 'client_credentials')
  params.append('client_id', clientId)
  params.append('client_secret', clientSecret)
  params.append('scope', 'https://graph.microsoft.com/.default')

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Failed to obtain Microsoft Graph token: ${res.status} ${errText}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in,
  }
  return cachedToken.token
}

async function graphFetch(url: string, token: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Graph API error: ${res.status} ${res.statusText} - ${text}`)
  }
  return res.json()
}

/**
 * Sanitizes folder names for SharePoint forbidden characters: " * : < > ? / \ |
 */
export function sanitizeSharepointName(name: string): string {
  return name.replace(/["*:<>?/\\|]/g, '_').trim()
}

export interface SharepointContext {
  siteId: string
  driveId: string
  rootFolderPath: string
}

let cachedContext: SharepointContext | null = null

export async function resolveSharepointContext(env: Env, token: string): Promise<SharepointContext> {
  if (cachedContext) return cachedContext

  const sharepointUrl = env.SHAREPOINT_URL || 'https://contoso.sharepoint.com/sites/MerchantDocuments'
  const parsedUrl = new URL(sharepointUrl)
  const fullPath = decodeURIComponent(parsedUrl.pathname)

  const siteMatch = fullPath.match(/^(\/sites\/[^/]+)/)
  const sitePath = siteMatch ? siteMatch[1] : fullPath

  // Get site ID
  const siteUrl = `https://graph.microsoft.com/v1.0/sites/${parsedUrl.hostname}:${sitePath}`
  const siteData = await graphFetch(siteUrl, token)
  const siteId = siteData.id

  // Get drives
  const drivesData = await graphFetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives`, token)
  const drives = drivesData.value || []

  const pathAfterSite = fullPath.substring(sitePath.length).replace(/^\//, '')
  const segments = pathAfterSite.split('/').filter(Boolean)
  const firstSegment = segments[0]

  let matchedDrive = drives.find(
    (d: any) =>
      (firstSegment && d.name.toLowerCase() === firstSegment.toLowerCase()) ||
      (firstSegment && d.webUrl && d.webUrl.toLowerCase().endsWith('/' + firstSegment.toLowerCase()))
  )

  let folderPathInDrive = ''
  if (matchedDrive) {
    folderPathInDrive = segments.slice(1).join('/')
  } else {
    matchedDrive = drives.find((d: any) => d.name === 'Documents' || d.name === 'Shared Documents') || drives[0]
    folderPathInDrive = pathAfterSite
  }

  if (!matchedDrive) {
    throw new Error(`Could not find document library for site ${sitePath}`)
  }

  cachedContext = {
    siteId,
    driveId: matchedDrive.id,
    rootFolderPath: folderPathInDrive,
  }
  return cachedContext
}

/**
 * Uploads a file stream/buffer to SharePoint in merchant's folder
 */
export async function uploadToSharepoint(
  env: Env,
  merchantName: string,
  filename: string,
  fileStream: ReadableStream | ArrayBuffer
): Promise<{ id: string; name: string; webUrl: string }> {
  const token = await getGraphAccessToken(env)
  
  // If mock mode during initial testing without live credentials:
  if (token === 'mock-graph-token') {
    return {
      id: `sp-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: filename,
      webUrl: `https://sharepoint.example.com/docs/${encodeURIComponent(merchantName)}/${encodeURIComponent(filename)}`
    }
  }

  const ctx = await resolveSharepointContext(env, token)
  const safeMerchantName = sanitizeSharepointName(merchantName)
  const safeFileName = sanitizeSharepointName(filename)

  const basePath = ctx.rootFolderPath ? `${ctx.rootFolderPath}/${safeMerchantName}` : safeMerchantName
  const encodedPath = encodeURIComponent(`${basePath}/${safeFileName}`).replace(/%2F/g, '/')
  const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${ctx.driveId}/root:/${encodedPath}:/content?@microsoft.graph.conflictBehavior=replace`

  const headers = new Headers({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/octet-stream',
  })

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body: fileStream,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SharePoint file upload failed (${res.status}): ${err}`)
  }

  const data = (await res.json()) as { id: string; name: string; webUrl: string }
  return data
}
