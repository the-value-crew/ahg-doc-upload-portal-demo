import Info from './Info'
import { getRequiredStatementMonths } from '../../helpers/statementPeriod.helper'
import { IndustryConfig } from '../../../shared/types'

interface AppIntroProps {
  industryConfig?: IndustryConfig
}

function AppIntro({ industryConfig }: AppIntroProps) {
  const statementPeriod = getRequiredStatementMonths()

  const industryName = industryConfig?.label || 'Merchant Onboarding'
  const introText =
    industryConfig?.intro ||
    'Please submit the required core corporate records, financial statements, and industry-specific underwriting compliance items below.'
  const licensingText =
    industryConfig?.licensingNote ||
    'State regulatory licenses, trade registrations, and applicable professional permits.'

  return (
    <>
      <div className="flex items-center space-x-2 mb-3">
        <span className="uppercase text-xs font-bold tracking-widest text-gray-500">
          {industryName}
        </span>
      </div>

      <h1 className="text-3xl md:text-5xl font-black text-[#1A1A1A] mb-4 tracking-tight uppercase">
        Merchant{' '}
        <span className="text-[#02F1DE] relative inline-block">
          Onboarding
          <span className="absolute bottom-1 left-0 w-full h-[6px] bg-[#02F1DE] -z-10 opacity-70"></span>
        </span>
      </h1>

      <p className="text-base text-gray-600 leading-relaxed mb-6 font-normal">
        {introText}
      </p>

      <Info />

      <h2 className="text-xl font-bold text-[#1A1A1A] mb-3">Workflow Overview</h2>
      <ul className="space-y-3 text-sm text-gray-600 mb-4">
        <li className="flex items-start">
          <span className="font-bold text-[#1A1A1A] mr-2">1.</span>
          <span>
            <strong className="text-[#1A1A1A]">Core Entity Records:</strong> Articles of Incorporation, SS4/EIN Letter,{' '}
            <strong>Signed Bank Letter</strong> (or pre-printed voided check), Owner IDs, and Operating Agreement/Bylaws.
          </span>
        </li>
        <li className="flex items-start">
          <span className="font-bold text-[#1A1A1A] mr-2">2.</span>
          <div>
            <strong className="text-[#1A1A1A]">Financial History:</strong> 3 most recent consecutive months of business bank
            statements and processing statements:
            <span className="inline-block font-semibold text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded text-xs ml-1.5 my-1">
              Required: {statementPeriod.formattedText}
            </span>
            {statementPeriod.rollOverNotice && (
              <p className="text-xs text-amber-700 mt-1 italic">{statementPeriod.rollOverNotice}</p>
            )}
          </div>
        </li>
        <li className="flex items-start">
          <span className="font-bold text-[#1A1A1A] mr-2">3.</span>
          <span>
            <strong className="text-[#1A1A1A]">Specific Licensing Related to the Industry:</strong> {licensingText}
          </span>
        </li>
      </ul>
    </>
  )
}

export default AppIntro
