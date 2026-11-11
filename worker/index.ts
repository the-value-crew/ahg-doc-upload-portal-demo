import { Env } from './types'
import { handleAdminShell } from './middleware/adminShell'
import { handlePortalConfig } from './routes/portalConfig'
import { handleFindMerchantOnGhl } from './routes/findMerchantOnGhl'
import { handleUpload } from './routes/upload'
import { handleAdminLogin } from './routes/adminLogin'
import {
  handleAdminGetMerchants,
  handleAdminGetMerchantDetail,
  handleAdminUpdateMerchantStatus,
  handleAdminUpdateStatus,
  handleCreateSignedDownloadUrl,
  handleMerchantSignedDownloadUrl,
  handleAdminDownloadDocument,
} from './routes/documents'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname

    try {
      // 1. Intercept /admin* web requests before static assets
      if (pathname === '/admin' || pathname.startsWith('/admin/')) {
        return await handleAdminShell(request, env)
      }

      // 2. API Routes
      // Portal Config
      if (pathname === '/api/portal-config' && request.method === 'GET') {
        return await handlePortalConfig(request, env)
      }

      // POST /api/find-merchant-on-ghl
      if (pathname === '/api/find-merchant-on-ghl' && request.method === 'POST') {
        return await handleFindMerchantOnGhl(request, env)
      }

      // GET /api/merchants/:id/documents/:type/download-url (Merchant Portal signed download)
      const merchantDownloadUrlMatch = pathname.match(/^\/api\/merchants\/([^/]+)\/documents\/([^/]+)\/download-url$/)
      if (merchantDownloadUrlMatch && request.method === 'GET') {
        const merchantId = decodeURIComponent(merchantDownloadUrlMatch[1])
        const docTypeStr = decodeURIComponent(merchantDownloadUrlMatch[2])
        return await handleMerchantSignedDownloadUrl(request, env, merchantId, docTypeStr)
      }

      // POST /api/upload
      if (pathname === '/api/upload' && request.method === 'POST') {
        return await handleUpload(request, env)
      }

      // POST /api/admin/login
      if (pathname === '/api/admin/login' && request.method === 'POST') {
        return await handleAdminLogin(request, env)
      }

      // GET /api/admin/merchants (Search & Paginated)
      if (pathname === '/api/admin/merchants' && request.method === 'GET') {
        return await handleAdminGetMerchants(request, env)
      }

      // PATCH /api/admin/merchants/:id/status
      const merchantStatusMatch = pathname.match(/^\/api\/admin\/merchants\/([^/]+)\/status$/)
      if (merchantStatusMatch && request.method === 'PATCH') {
        const merchantId = decodeURIComponent(merchantStatusMatch[1])
        return await handleAdminUpdateMerchantStatus(request, env, merchantId)
      }

      // GET /api/admin/merchants/:id (Detail view)
      const merchantDetailMatch = pathname.match(/^\/api\/admin\/merchants\/([^/]+)$/)
      if (merchantDetailMatch && request.method === 'GET') {
        const merchantId = decodeURIComponent(merchantDetailMatch[1])
        return await handleAdminGetMerchantDetail(request, env, merchantId)
      }

      // POST /api/admin/documents/download-url (Admin signed download URL)
      if (pathname === '/api/admin/documents/download-url' && request.method === 'POST') {
        return await handleCreateSignedDownloadUrl(request, env)
      }

      // GET /api/documents/download (Signed download delivery)
      if (pathname === '/api/documents/download' && request.method === 'GET') {
        return await handleAdminDownloadDocument(request, env)
      }

      // PATCH /api/admin/documents/status or /api/documents/status
      if (
        (pathname === '/api/admin/documents/status' || pathname === '/api/documents/status') &&
        request.method === 'PATCH'
      ) {
        return await handleAdminUpdateStatus(request, env)
      }

      // 3. Fallback for unmatched /api/* routes
      if (pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // 4. Fallback to Cloudflare Workers Static Assets binding
      return await env.ASSETS.fetch(request)
    } catch (err: any) {
      console.error(`Unhandled Worker error at ${request.method} ${pathname}:`, err)
      return new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}
