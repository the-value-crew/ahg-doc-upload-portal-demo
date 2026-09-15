import { useSearchParams } from 'react-router-dom';
import DefaultLayout from '../layouts/default.layout'

function NotFoundPage() {
    const [searchParams] = useSearchParams()
    let uid = searchParams.get("uid")

    return (
        <DefaultLayout>
            <div className="container py-20 text-center">
                <div className="max-w-md mx-auto bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">
                    <span className="inline-block px-3 py-1 bg-[#FEF2F2] text-[#EF4444] text-xs font-bold rounded-full mb-4">
                        Merchant Reference Error
                    </span>
                    <h1 className="text-4xl font-black text-[#000000] mb-4 uppercase tracking-tight">
                        Link Expired or Not Found
                    </h1>

                    <p className="text-sm text-[#4B5563] mb-6 leading-relaxed">
                        The requested merchant portal session <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-xs font-bold text-[#1A1A1A]">{uid || "unknown"}</code> is invalid or has expired.
                    </p>

                    <a
                        href={`/?uid=${uid || "AHG-DEMO-MERCHANT"}`}
                        className="inline-block bg-[#02F1DE] text-[#000000] font-bold text-sm px-6 py-3 rounded hover:bg-[#00dbc9] transition-all shadow-sm"
                    >
                        Return to Merchant Vault
                    </a>
                </div>
            </div>
        </DefaultLayout>
    )
}

export default NotFoundPage;