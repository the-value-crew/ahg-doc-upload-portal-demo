import {
  BrandingConfig,
  IndustryConfig,
  MerchantStageConfig,
  PortalDefaultsConfig,
  SupportContactConfig,
  UploadRulesConfig,
  SectionConfig,
  DocumentItemConfig,
} from '../../shared/types'

export type {
  BrandingConfig,
  IndustryConfig,
  MerchantStageConfig,
  PortalDefaultsConfig,
  SupportContactConfig,
  UploadRulesConfig,
  SectionConfig,
  DocumentItemConfig,
}

export interface GhlFieldMapItem {
  id: string
  fieldKey: string
}

export interface GhlFieldMapConfig {
  industry_type: GhlFieldMapItem
  processor: GhlFieldMapItem
  [key: string]: GhlFieldMapItem | undefined
}

export type GhlIndustryMapConfig = Record<string, string>

export interface AppConfigState {
  industries: Record<string, IndustryConfig>
  upload_rules: UploadRulesConfig
  portal_defaults: PortalDefaultsConfig
  branding: BrandingConfig
  support_contact: SupportContactConfig
  admin_password?: string
  merchant_stages: MerchantStageConfig[]
  processors: string[]
  ghl_field_map: GhlFieldMapConfig
  ghl_industry_map: GhlIndustryMapConfig
}
