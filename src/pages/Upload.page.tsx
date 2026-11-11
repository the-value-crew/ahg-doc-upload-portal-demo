import DefaultLayout from '../layouts/default.layout'
import Dropzone from '../components/Dropzone'
import UploadTable from '../components/UploadTable/UploadTable'
import { DropzoneMode, UserStatus } from '../enums'
import AppIntro from '../components/AppIntro/AppIntro'
import UploadInfo from '../components/UploadTable/UploadInfo'
import StatusPieChart from '../components/StatusPieChart'
import UploadPageSkeleton from '../components/UploadPageSkeleton'
import UserStatusStepper from '../components/UserStatusStepper'
import ContactBanner from '../components/ContactBanner'
import { usePortalData } from '../hooks/usePortalData'
import NotFoundPage from './NotFound.page'

function UploadPage() {
  const searchParams = new URLSearchParams(window.location.search)
  const merchantId = searchParams.get('merchant')

  const { config, checklist, stats, merchantStatus, loading, isSyncingGhl, error, is404, refresh, reload } =
    usePortalData(merchantId)

  if (!merchantId || is404) {
    return <NotFoundPage />
  }

  if (error && !config) {
    return (
      <DefaultLayout>
        <div className="container py-20 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Not found</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={reload}
            className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-black text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
          >
            Retry Verification
          </button>
        </div>
      </DefaultLayout>
    )
  }

  if (loading || isSyncingGhl || !config) {
    return (
      <DefaultLayout>
        <UploadPageSkeleton />
      </DefaultLayout>
    )
  }

  const sections = config.industry?.sections || []

  return (
    <DefaultLayout branding={config.branding} supportContact={config.supportContact}>
      <div className="space-y-10 md:space-y-14">
        {/* Support Point of Contact Banner */}
        <ContactBanner supportContact={config.supportContact} />

        {/* Hero Section with Status Pie Chart */}
        <section className="container pt-2 md:pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-7">
              <AppIntro industryConfig={config.industry} />
            </div>

            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <StatusPieChart stats={stats} userStatus={merchantStatus as UserStatus} stages={config.stages} />
            </div>
          </div>

          {/* Stepper Pipeline */}
          <div className="mt-12">
            <UserStatusStepper status={merchantStatus} stages={config.stages} />
          </div>
        </section>

        {/* Express Document Submission Dropzone Section */}
        <section className="container">
          <Dropzone
            mode={DropzoneMode.LARGE}
            onFileUpload={refresh}
            merchantId={merchantId}
            checklist={checklist}
            uploadRules={config.uploadRules}
          />

          <UploadInfo />
        </section>

        {/* Dynamic Industry-Specific Document Tables Section */}
        <section className="container pb-20">
          <div className="space-y-12">
            {sections.map((section) => {
              const sectionItems = checklist.filter((item) => item.sectionId === section.id)
              return (
                <UploadTable
                  key={section.id}
                  sectionTitle={section.title}
                  sectionDescription={section.description}
                  items={sectionItems}
                  merchantId={merchantId}
                  supportContact={config.supportContact}
                  onFileUpload={refresh}
                  onRefresh={refresh}
                  adminMode={false}
                />
              )
            })}
          </div>
        </section>
      </div>
    </DefaultLayout>
  )
}

export default UploadPage
