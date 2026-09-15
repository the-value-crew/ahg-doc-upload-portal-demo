import Info from "./Info"
import { IndustryType } from "../../enums"

interface AppIntroProps {
  industry: IndustryType
}

function AppIntro({ industry }: AppIntroProps) {
  const getIndustryName = () => {
    switch (industry) {
      case IndustryType.PEPTIDE:
        return "Peptide & Research Chemical Brands";
      case IndustryType.HEMP:
        return "Hemp & CBD Merchant Processing";
      case IndustryType.GENERAL:
      default:
        return "High-Risk & B2B Merchant Brands";
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2 mb-3">
        <span className="inline-block w-2.5 h-2.5 bg-[#02F1DE] rounded-full"></span>
        <span className="uppercase text-xs font-bold tracking-widest text-[#4B5563]">
          AHG Pay • {getIndustryName()}
        </span>
      </div>

      <h1 className="text-3xl md:text-5xl font-black text-[#1A1A1A] mb-4 tracking-tight uppercase">
        Merchant <span className="text-[#02F1DE] relative inline-block">
          Onboarding
          <span className="absolute bottom-1 left-0 w-full h-[6px] bg-[#02F1DE] -z-10 opacity-70"></span>
        </span>
      </h1>

      <p className="text-base text-[#4B5563] leading-relaxed mb-6 font-normal">
        Welcome to AHG Pay — the payments and growth partner for hemp, telehealth, peptides, and high-risk B2B brands.
        Please submit the required core corporate records, financial statements, and industry-specific underwriting compliance items below.
      </p>

      <Info />

      <h2 className="text-xl font-bold text-[#1A1A1A] mb-3">
        Workflow Overview
      </h2>
      <ul className="space-y-2 text-sm text-[#4B5563] mb-4">
        <li className="flex items-start">
          <span className="font-bold text-[#1A1A1A] mr-2">1.</span>
          <span><strong>Core Entity Records:</strong> Articles of Incorporation, SS4/EIN Letter, Voided Check/Bank Letter, Owner IDs, and Operating Agreement/Bylaws.</span>
        </li>
        <li className="flex items-start">
          <span className="font-bold text-[#1A1A1A] mr-2">2.</span>
          <span><strong>Financial History:</strong> 3 months business bank statements, 3 months processing statements{industry === IndustryType.PEPTIDE ? ', and 2 years financials' : ''}.</span>
        </li>
        <li className="flex items-start">
          <span className="font-bold text-[#1A1A1A] mr-2">3.</span>
          <span><strong>{industry === IndustryType.PEPTIDE ? 'Peptide-Specific & Signature Docs' : industry === IndustryType.HEMP ? 'Hemp-Specific & Signature Docs' : 'Industry Verification'}:</strong> Specialized compliance certifications, fulfillment agreements, lab testing, and signed addenda.</span>
        </li>
      </ul>
    </>
  )
}

export default AppIntro;