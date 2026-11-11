import { useState } from 'react'
import { FiMail, FiPhone, FiCopy, FiCheck, FiUserCheck } from 'react-icons/fi'
import { SupportContactConfig } from '../../shared/types'

interface ContactBannerProps {
  supportContact?: SupportContactConfig
}

export default function ContactBanner({ supportContact }: ContactBannerProps) {
  const [copied, setCopied] = useState(false)

  if (!supportContact) return null

  const initials = supportContact.name
    ? supportContact.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    : 'US'

  const copyEmail = () => {
    if (supportContact.email) {
      navigator.clipboard.writeText(supportContact.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 py-3.5 shadow-2xs">
      <div className="container flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#065F46] font-bold text-sm shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-1">
                {supportContact.name}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {supportContact.role}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {supportContact.email && (
            <>
              <a
                href={`mailto:${supportContact.email}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-colors"
              >
                <FiMail className="w-3.5 h-3.5 text-gray-600" />
                <span>{supportContact.email}</span>
              </a>

              <button
                onClick={copyEmail}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                title="Copy email to clipboard"
              >
                {copied ? (
                  <>
                    <FiCheck className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-green-600 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </>
          )}

          {supportContact.phone && (
            <a
              href={`tel:${supportContact.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-colors"
            >
              <FiPhone className="w-3.5 h-3.5 text-gray-600" />
              <span>{supportContact.phone}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
