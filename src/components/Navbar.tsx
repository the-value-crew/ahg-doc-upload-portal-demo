function Navbar() {
    return (
        <header className="w-full bg-white text-[#1A1A1A] border-b border-[#E5E7EB] shadow-xs">
            <div className="container py-5 md:py-6 flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    <a href="/" className="flex items-center">
                        <img
                            src="https://s3.us-west-1.amazonaws.com/hyfin.app/uploads/prod/App/6a4c6ed97642e3ccb1be6002/7989e026-738c-4931-80ed-27d38fc9dbe0/primary.png?ts=1783649431327"
                            alt="AHG Pay Logo"
                            className="h-12 md:h-14 w-auto object-contain transition-transform hover:scale-105"
                        />
                    </a>
                    
                    {/* 1px gray divider and co-branding descriptor */}
                    <div className="hidden sm:block h-8 w-[1px] bg-[#E5E7EB]"></div>
                    <div className="hidden sm:flex flex-col">
                        <span className="text-xs font-bold tracking-widest text-[#1A1A1A] uppercase">
                            Merchant Document Vault
                        </span>
                        <span className="text-[11px] text-[#6B7280]">
                            High-Risk Compliance & Underwriting
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <span className="hidden md:inline-flex items-center text-xs font-semibold text-[#4B5563]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] mr-2"></span>
                        95%+ Client Retention
                    </span>
                    <a
                        href="https://ahgpay.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#000000] bg-[#02F1DE] hover:bg-[#00dbc9] px-4 py-2 rounded-md transition-all shadow-sm"
                    >
                        Visit ahgpay.com
                    </a>
                </div>
            </div>

            {/* Scalpel Cyan Accent Line */}
            <div className="w-full h-[2px] bg-[#02F1DE]"></div>
        </header>
    );
}

export default Navbar;