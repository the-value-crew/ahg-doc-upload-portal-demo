function Footer() {
    return (
        <footer className="w-full bg-[#F9FAFB] text-[#4B5563] mt-20 border-t border-[#E5E7EB]">
            <div className="container py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#E5E7EB]">
                    {/* AHG mark first and dominant, 1px gray divider, co-branding secondary */}
                    <div className="flex flex-wrap items-center gap-4">
                        <img
                            src="https://s3.us-west-1.amazonaws.com/hyfin.app/uploads/prod/App/6a4c6ed97642e3ccb1be6002/7989e026-738c-4931-80ed-27d38fc9dbe0/primary.png?ts=1783649431327"
                            alt="AHG Pay"
                            className="h-9 w-auto object-contain"
                        />
                        <div className="hidden sm:block h-6 w-[1px] bg-[#D1D5DB]"></div>
                        <div className="text-xs text-[#4B5563] font-medium">
                            <span className="font-semibold text-[#1A1A1A]">High-Risk Payment Processing & Underwriting</span>
                            <span className="hidden md:inline mx-2 text-[#9CA3AF]">•</span>
                            <span className="block md:inline text-[#6B7280]">U.S. Hemp Roundtable Member</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6 text-xs font-semibold text-[#4B5563]">
                        <a href="mailto:sales@ahgpay.com" className="hover:text-[#000000] transition-colors">
                            sales@ahgpay.com
                        </a>
                        <span>+1-754-732-3744</span>
                        <a
                            href="https://ahgpay.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1A1A1A] hover:underline font-bold"
                        >
                            ahgpay.com
                        </a>
                    </div>
                </div>

                <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-[#6B7280] gap-4">
                    <p>
                        © {new Date().getFullYear()} AHG Pay. All rights reserved. No contracts. 95%+ client retention.
                    </p>
                    <p>
                        215 S Olive Ave., Ste. 400, West Palm Beach, FL 33401
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;