import { IconContext } from "react-icons"
import { RiShieldCheckFill } from "react-icons/ri"

function Info() {
    return (
        <div className="bg-white text-[#1A1A1A] p-4 rounded-xl mb-8 border border-[#E5E7EB] border-l-4 border-l-[#02F1DE] shadow-xs">
            <div className="flex items-start">
                <div className="bg-[#ECFDF5] p-2.5 rounded-lg mr-3.5 mt-0.5 shrink-0 border border-[#A7F3D0]">
                    <IconContext.Provider value={{ className: "fill-[#059669] w-5 h-5" }}>
                        <RiShieldCheckFill />
                    </IconContext.Provider>
                </div>
                <div className="flex flex-col">
                    <h3 className="font-bold text-sm text-[#1A1A1A] mb-0.5">
                        Encrypted & Compliance-Secured Underwriting
                    </h3>
                    <p className="text-xs text-[#4B5563] leading-relaxed">
                        All uploads are encrypted with bank-grade 256-bit security directly to the AHG Pay underwriting vault. 95%+ client retention rate with zero long-term contracts.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Info;