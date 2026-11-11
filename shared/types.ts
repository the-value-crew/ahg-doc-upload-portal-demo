// Shared types between Frontend and Cloudflare Worker backend

export enum FileStatus {
  NOT_UPLOADED = 'not-uploaded',
  PENDING = 1,
  VERIFIED = 2,
  REJECTED = 3,
  // Backward-compatible aliases:
  REQUIRED = 'not-uploaded',
  CONFIRMED = 2,
}

export enum MerchantStatus {
  ONBOARDING_BOOKED = 1,
  DOC_COLLECTION = 2,
  APPLICATION_IN_REVIEW = 3,
  APPROVED = 4,
  LIVE_AND_PROCESSING = 5,
  // Backward-compatible aliases:
  ONBOARDING_CALL_COMPLETED = 1,
  DOCS_SUBMITTED_REVIEWED = 2,
  APPLICATION_SUBMITTED = 3,
  GATEWAY_SETUP = 4,
  ACCOUNT_ACTIVE_LIVE = 5,
}

export const UserStatus = MerchantStatus
export type UserStatus = MerchantStatus

export interface MerchantStageConfig {
  value: number
  name: string
  aliases?: string[]
}

export interface DocumentItemConfig {
  type: number
  name: string
  description?: string
  required?: boolean
  tag?: string | null
  formUrl?: string
}

export interface SectionConfig {
  id: string
  title: string
  description: string
  documents: DocumentItemConfig[]
}

export interface IndustryConfig {
  label: string
  description: string
  intro?: string
  licensingNote?: string
  sections: SectionConfig[]
}

export interface UploadRulesConfig {
  maxBytes: number
  acceptedMimeTypes: string[]
  acceptedExtensions: string[]
}

export interface PortalDefaultsConfig {
  primaryColor: string
  accentColor: string
  title: string
  description: string
}

export interface BrandingConfig {
  brandName: string
  logoUrl: string
  websiteUrl: string
  tagline: string
  footerText: string
}

export interface SupportContactConfig {
  name: string
  role: string
  email: string
  phone: string
  helpText: string
}

export interface MerchantDto {
  id: string
  name: string
  industry: string
  industryLabel?: string
  status: number
  processor?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ChecklistItem {
  type: number
  name: string
  description?: string
  tag?: string | null
  required: boolean
  formUrl?: string
  sectionId: string
  sectionTitle: string
  status: FileStatus | 'not-uploaded' | number
  filename?: string
  uploadedAt?: string
  note?: string | null
  sharepointItemId?: string
}

export interface ChecklistStats {
  totalItems: number
  notUploaded: number
  pending: number
  confirmed: number
  rejected: number
}

export interface PortalConfigSuccess {
  found: true
  merchant: MerchantDto
  brand: PortalDefaultsConfig
  branding: BrandingConfig
  supportContact: SupportContactConfig
  industry: IndustryConfig
  uploadRules: UploadRulesConfig
  checklist: ChecklistItem[]
  stats: ChecklistStats
  stages: MerchantStageConfig[]
  documents: MerchantDocumentRecord[]
}

export interface PortalConfigNotFound {
  found: false
  syncToken: string
}

export type PortalConfigResponse = PortalConfigSuccess | PortalConfigNotFound

export interface MerchantDocumentRecord {
  merchantId: string
  documentType: number
  status: FileStatus | number
  note?: string | null
  uploadedAt: string
  statusUpdatedAt: string
  filename?: string
  sharepointItemId?: string
}

// Admin API types
export interface AdminMerchantItem {
  id: string
  name: string
  industry: string
  industryLabel: string
  status: number
  processor?: string | null
  stats: ChecklistStats
  lastUploadedAt: string | null
}

export interface AdminMerchantsResponse {
  data: AdminMerchantItem[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

// Iframe PostMessage Protocol Types
export type HostToIframeMessage =
  | { type: 'AUTH_TOKEN'; token: string }
  | { type: 'FILTER_TENANT'; tenant: string }

export type IframeToHostMessage =
  | { type: 'IFRAME_MOUNTED' }
  | { type: 'RESIZE'; height: number }
  | { type: 'DOC_SELECTED'; document: { merchantId: string; documentType: number; filename?: string; sharepointItemId?: string } }
