import { BrandingConfig, SupportContactConfig } from '../../shared/types'

interface FooterProps {
  branding?: BrandingConfig
  supportContact?: SupportContactConfig
}

function Footer({ branding, supportContact }: FooterProps) {
  const brandName = branding?.brandName || 'AHG Pay'
  const websiteUrl = branding?.websiteUrl || 'https://ahgpay.com'
  const logoUrl =
    branding?.logoUrl ||
    'https://s3.us-west-1.amazonaws.com/hyfin.app/uploads/prod/App/6a4c6ed97642e3ccb1be6002/7989e026-738c-4931-80ed-27d38fc9dbe0/primary.png?ts=1783649431327'

  return (
    <footer className="w-full bg-gray-50 text-gray-600 mt-20 border-t border-gray-200">
      <div className="container py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <img src={logoUrl} alt={brandName} className="h-9 w-auto object-contain" />
            <div className="hidden sm:block h-6 w-[1px] bg-gray-300"></div>
            <div className="text-xs text-gray-600 font-medium">
              <span className="font-semibold text-[#1A1A1A]">
                {branding?.footerText || 'High-Risk Payment Processing & Underwriting'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs font-semibold text-gray-600">
            {supportContact?.email && (
              <a href={`mailto:${supportContact.email}`} className="hover:text-black transition-colors">
                {supportContact.email}
              </a>
            )}
            {supportContact?.phone && <span>{supportContact.phone}</span>}
            <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A] hover:underline font-bold">
              {brandName}
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
