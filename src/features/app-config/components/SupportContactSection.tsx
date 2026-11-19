import React from 'react'
import { FiPhone } from 'react-icons/fi'
import { SupportContactConfig } from '../../../types/appConfig'
import { SectionHeading, FieldLabel, CurrentPreview } from './common'
import ContactBanner from '../../../components/ContactBanner'

interface SupportContactSectionProps {
  contact: SupportContactConfig
  onUpdateContact: (field: keyof SupportContactConfig, value: string) => void
}

export function SupportContactSection({
  contact,
  onUpdateContact,
}: SupportContactSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-2xs">
      <SectionHeading
        icon={FiPhone}
        title="Support & Underwriting Contact"
        description="Configure the merchant onboarding specialist contact info displayed in the portal banner and document checklist."
      />

      {/* Live Preview */}
      <CurrentPreview title="Live Merchant Support Banner (Preview)">
        <ContactBanner supportContact={contact} />
      </CurrentPreview>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Specialist Name</FieldLabel>
          <input
            type="text"
            value={contact.name || ''}
            onChange={(e) => onUpdateContact('name', e.target.value)}
            placeholder="e.g. Scott Kaapke"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
          />
        </div>

        <div>
          <FieldLabel>Role Title</FieldLabel>
          <input
            type="text"
            value={contact.role || ''}
            onChange={(e) => onUpdateContact('role', e.target.value)}
            placeholder="Merchant Onboarding Specialist"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <FieldLabel>Support Email</FieldLabel>
          <input
            type="email"
            value={contact.email || ''}
            onChange={(e) => onUpdateContact('email', e.target.value)}
            placeholder="support@ahgpay.com"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <FieldLabel>Direct Phone Line</FieldLabel>
          <input
            type="text"
            value={contact.phone || ''}
            onChange={(e) => onUpdateContact('phone', e.target.value)}
            placeholder="+1-754-732-3744"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel>Portal Help & Underwriting Notice</FieldLabel>
          <textarea
            rows={2}
            value={contact.helpText || ''}
            onChange={(e) => onUpdateContact('helpText', e.target.value)}
            placeholder="Need help? Contact AHG Underwriting Support..."
            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
          />
        </div>
      </div>
    </div>
  )
}
