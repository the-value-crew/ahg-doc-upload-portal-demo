import React from 'react'
import { FiGlobe } from 'react-icons/fi'
import { BrandingConfig, PortalDefaultsConfig } from '../../../types/appConfig'
import { SectionHeading, FieldLabel, CurrentPreview } from './common'
import Navbar from '../../../components/Navbar'

interface BrandingSectionProps {
  branding: BrandingConfig
  portalDefaults: PortalDefaultsConfig
  onUpdateBranding: (field: keyof BrandingConfig, value: string) => void
  onUpdatePortalDefaults: (field: keyof PortalDefaultsConfig, value: string) => void
}

export function BrandingSection({
  branding,
  portalDefaults,
  onUpdateBranding,
  onUpdatePortalDefaults,
}: BrandingSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-2xs">
      <SectionHeading
        icon={FiGlobe}
        title="Branding & Portal Defaults"
        description="Configure brand name, logos, website links, portal title, and visual theme colors used throughout the merchant portal."
      />

      {/* Live Preview */}
      <CurrentPreview title="Live Portal Header & Navigation Bar (Preview)">
        <Navbar branding={branding} />
      </CurrentPreview>

      {/* Grid of Branding fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Brand Name</FieldLabel>
          <input
            type="text"
            value={branding.brandName || ''}
            onChange={(e) => onUpdateBranding('brandName', e.target.value)}
            placeholder="e.g. AHG Pay"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
          />
        </div>

        <div>
          <FieldLabel>Official Website URL</FieldLabel>
          <input
            type="text"
            value={branding.websiteUrl || ''}
            onChange={(e) => onUpdateBranding('websiteUrl', e.target.value)}
            placeholder="https://ahgpay.com"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel>Logo Image URL</FieldLabel>
          <div className="flex items-center gap-3">
            {branding.logoUrl && (
              <div className="w-12 h-12 rounded-lg border border-gray-200 p-1 bg-gray-50 flex items-center justify-center shrink-0">
                <img
                  src={branding.logoUrl}
                  alt="Logo preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
            <input
              type="text"
              value={branding.logoUrl || ''}
              onChange={(e) => onUpdateBranding('logoUrl', e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div>
          <FieldLabel>Brand Tagline</FieldLabel>
          <input
            type="text"
            value={branding.tagline || ''}
            onChange={(e) => onUpdateBranding('tagline', e.target.value)}
            placeholder="The payments and growth partner..."
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <FieldLabel>Footer Text</FieldLabel>
          <input
            type="text"
            value={branding.footerText || ''}
            onChange={(e) => onUpdateBranding('footerText', e.target.value)}
            placeholder="High-Risk Payment Processing & Underwriting"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Portal Theme & Defaults */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
          Portal Visual Theme & SEO Metadata
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Primary Brand Color (Accent Bar & Highlights)</FieldLabel>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={portalDefaults.primaryColor || '#02F1DE'}
                onChange={(e) => onUpdatePortalDefaults('primaryColor', e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={portalDefaults.primaryColor || '#02F1DE'}
                onChange={(e) => onUpdatePortalDefaults('primaryColor', e.target.value)}
                placeholder="#02F1DE"
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Dark Accent Color</FieldLabel>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={portalDefaults.accentColor || '#1A1A1A'}
                onChange={(e) => onUpdatePortalDefaults('accentColor', e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={portalDefaults.accentColor || '#1A1A1A'}
                onChange={(e) => onUpdatePortalDefaults('accentColor', e.target.value)}
                placeholder="#1A1A1A"
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Browser Document Title</FieldLabel>
            <input
              type="text"
              value={portalDefaults.title || ''}
              onChange={(e) => onUpdatePortalDefaults('title', e.target.value)}
              placeholder="Merchant Document Upload Portal"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <FieldLabel>Portal Meta Description</FieldLabel>
            <input
              type="text"
              value={portalDefaults.description || ''}
              onChange={(e) => onUpdatePortalDefaults('description', e.target.value)}
              placeholder="Secure underwriting and merchant document upload portal."
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
