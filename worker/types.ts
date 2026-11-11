export interface Env {
  ASSETS: Fetcher
  DB: D1Database
  DOCS_BUCKET?: R2Bucket
  ALLOWED_PARENT_ORIGINS?: string
  MAX_UPLOAD_BYTES?: string
  JWT_SECRET?: string
  DOWNLOAD_SIGNING_SECRET?: string
  SYNC_TOKEN_SALT?: string
  GHL_PRIVATE_TOKEN?: string
  GHL_LOCATION_ID?: string
  AZURE_TENANT_ID?: string
  AZURE_CLIENT_ID?: string
  AZURE_CLIENT_SECRET?: string
  SHAREPOINT_URL?: string
}

