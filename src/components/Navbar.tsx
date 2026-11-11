import { BrandingConfig } from '../../shared/types'

interface NavbarProps {
  branding?: BrandingConfig
}

function Navbar({ branding }: NavbarProps) {
  const brandName = branding?.brandName || 'AHG Pay'
  const websiteUrl = branding?.websiteUrl || 'https://ahgpay.com'
  const logoUrl =
    branding?.logoUrl ||
    'https://s3.us-west-1.amazonaws.com/hyfin.app/uploads/prod/App/6a4c6ed97642e3ccb1be6002/7989e026-738c-4931-80ed-27d38fc9dbe0/primary.png?ts=1783649431327'

  return (
    <header className="w-full bg-white text-[#1A1A1A] border-b border-gray-200 shadow-2xs sticky top-0 z-40">
      <div className="container py-4 md:py-5 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4 sm:space-x-6 min-w-0">
          <a href="/" className="flex items-center flex-shrink-0" title={`${brandName} Merchant Vault`}>
            <img
              src={logoUrl}
              alt={`${brandName} Logo`}
              className="h-10 sm:h-12 md:h-14 w-auto object-contain transition-transform hover:scale-105"
            />
          </a>

          <div className="hidden sm:block h-8 w-[1px] bg-gray-200 flex-shrink-0"></div>
          <div className="hidden sm:flex flex-col min-w-0">
            <span className="text-xs font-bold tracking-widest text-[#1A1A1A] uppercase truncate">
              Merchant Documents Upload Portal
            </span>
            <span className="text-[11px] text-gray-500 truncate">
              {branding?.tagline || 'High-Risk Compliance & Underwriting'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-xs font-bold text-black bg-[#02F1DE] hover:bg-[#00dbc9] px-3.5 py-2 rounded-md transition-all shadow-sm items-center gap-1 flex-shrink-0"
          >
            <span>Visit {brandName}</span>
          </a>
        </div>
      </div>

      <div className="w-full h-[2px] bg-[#02F1DE]"></div>
    </header>
  )
}

export default Navbar
