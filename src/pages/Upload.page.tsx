import { useEffect, useState } from "react"
import DefaultLayout from "../layouts/default.layout"
import Dropzone from "../components/Dropzone"
import UploadTable from "../components/UploadTable/UploadTable"
import { DropzoneMode, FileStatus, IndustryType } from "../enums"
import AppIntro from "../components/AppIntro/AppIntro"
import UploadInfo from "../components/UploadTable/UploadInfo"
import StatusPieChart from "../components/StatusPieChart"
import { StatsData, UploadTableData } from "../interfaces"
import { useNavigate, useSearchParams } from "react-router-dom"
import { verifyUid, getUserFiles } from "../helpers/api.helper"
import { getSectionsByIndustry, getFileTypesByIndustry } from "../helpers/file.helper"
import UploadPageSkeleton from "../components/UploadPageSkeleton"
import { UserStatus } from "../enums"
import UserStatusStepper from "../components/UserStatusStepper"
import BossWidget from "../components/BossWidget"

function UploadPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Industry workflow selection from URL query or state
  const industryParam = (searchParams.get("industry") as IndustryType) || IndustryType.PEPTIDE
  const [industry, setIndustry] = useState<IndustryType>(
    Object.values(IndustryType).includes(industryParam) ? industryParam : IndustryType.PEPTIDE
  )

  const [loading, setLoading] = useState<boolean>(false)
  const [statsData, setStatsData] = useState<StatsData>({
    pending: 0,
    confirmed: 0,
    required: 0,
  })
  const [userStatus, setUserStatus] = useState<UserStatus>(
    UserStatus.UNDERWRITING_REVIEW
  )
  const [fileList, setFileList] = useState<UploadTableData[]>([])

  const handleIndustryChange = (newIndustry: IndustryType) => {
    setIndustry(newIndustry)
    const currentParams = new URLSearchParams(searchParams)
    currentParams.set("industry", newIndustry)
    setSearchParams(currentParams, { replace: true })
  }

  const init = async (skipLoading = false, runUidVerification = true) => {
    if (!skipLoading) setLoading(true)

    // 1. verify uid
    let uid = searchParams.get("uid") || "AHG-DEMO-MERCHANT"

    if (runUidVerification && searchParams.get("uid")) {
      const data = await verifyUid(uid)
      if (data) {
        setUserStatus(data.status)
      } else {
        navigate(`/404?uid=${uid}`)
        return
      }
    }

    // 2. fetch files
    try {
      const data = await getUserFiles()
      const industryFileTypes = getFileTypesByIndustry(industry)

      // calculate stats for the active industry
      let stats = { required: 0, pending: 0, confirmed: 0 } as StatsData
      let _fileList: UploadTableData[] = []

      for (const ft of industryFileTypes) {
        const file = data.find((d) => Number(d.type) === Number(ft))
        if (file) {
          if (file.status === FileStatus.PENDING) stats.pending++
          else if (file.status === FileStatus.CONFIRMED) stats.confirmed++

          _fileList.push({
            fileType: Number(file.type),
            status: Number(file.status),
            filename: file.filename,
            createdAt: file.createdAt,
          })
        } else {
          stats.required++
          _fileList.push({
            fileType: Number(ft),
            status: FileStatus.REQUIRED,
          })
        }
      }

      setStatsData(stats)
      setFileList(_fileList)
    } catch (e) {
      console.error(e)
    }

    if (!skipLoading) setLoading(false)
  }

  useEffect(() => {
    ;(async () => await init())()
  }, [industry])

  const handleFileUpload = () => setTimeout(() => init(true), 400)
  const handleRefresh = () => init(true, false)

  const activeSections = getSectionsByIndustry(industry)

  const uploadUI = (
    <div className="space-y-12 md:space-y-16">
      {/* Industry Workflow Switcher Bar */}
      <div className="bg-[#FFFFFF] border-b border-[#E5E7EB] py-3.5 shadow-xs sticky top-0 z-30">
        <div className="container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
              Industry Workflow:
            </span>
          </div>

          <div className="flex items-center bg-[#F3F4F6] p-1 rounded-xl border border-[#E5E7EB] overflow-x-auto">
            <button
              onClick={() => handleIndustryChange(IndustryType.PEPTIDE)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                industry === IndustryType.PEPTIDE
                  ? 'bg-white text-[#000000] shadow-xs border border-[#E5E7EB]'
                  : 'text-[#6B7280] hover:text-[#1A1A1A]'
              }`}
            >
              Peptide Industry
            </button>

            <button
              onClick={() => handleIndustryChange(IndustryType.HEMP)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                industry === IndustryType.HEMP
                  ? 'bg-white text-[#000000] shadow-xs border border-[#E5E7EB]'
                  : 'text-[#6B7280] hover:text-[#1A1A1A]'
              }`}
            >
              Hemp Industry
            </button>

            <button
              onClick={() => handleIndustryChange(IndustryType.GENERAL)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                industry === IndustryType.GENERAL
                  ? 'bg-white text-[#000000] shadow-xs border border-[#E5E7EB]'
                  : 'text-[#6B7280] hover:text-[#1A1A1A]'
              }`}
            >
              General High-Risk
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section with Status Pie Chart */}
      <section className="container pt-4 md:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-7">
            <AppIntro industry={industry} />
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <StatusPieChart stats={statsData} userStatus={userStatus} />
          </div>
        </div>

        {/* Boss Widget integration */}
        <BossWidget />

        {/* Stepper Pipeline */}
        <div className="mt-12">
          <UserStatusStepper status={userStatus} />
        </div>
      </section>

      {/* Quick Upload Dropzone Section */}
      <section className="container">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4B5563] block mb-1">
            Express Document Submission
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-[#1A1A1A] uppercase tracking-tight">
            Upload Underwriting Documents
          </h2>
        </div>

        <Dropzone
          mode={DropzoneMode.LARGE}
          onFileUpload={handleFileUpload}
          industry={industry}
        />

        <UploadInfo />
      </section>

      {/* Industry-Specific Document Tables Section */}
      <section className="container pb-20">
        <div className="space-y-12">
          {activeSections.map((section) => (
            <UploadTable
              key={section.id}
              sectionKey={section.id}
              sectionTitle={section.title}
              sectionDescription={section.description}
              fileList={fileList}
              fileTypes={section.fileTypes}
              onFileUpload={handleFileUpload}
              onRefresh={handleRefresh}
              generic={false}
            />
          ))}
        </div>
      </section>
    </div>
  )

  return (
    <DefaultLayout>{loading ? <UploadPageSkeleton /> : uploadUI}</DefaultLayout>
  )
}

export default UploadPage
