import DefaultLayout from '../layouts/default.layout'

function NotFoundPage() {
  const searchParams = new URLSearchParams(window.location.search)
  const merchantId = searchParams.get('merchant')

  return (
    <DefaultLayout>
      <div className="container py-20 text-center">
        <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <span className="inline-block px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full mb-4 border border-red-200">
            Merchant Reference Error
          </span>
          <h1 className="text-3xl font-black text-black mb-4 uppercase tracking-tight">
            Portal Not Found
          </h1>

          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            The requested merchant portal identifier{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-bold text-black">
              {merchantId || 'missing'}
            </code>{' '}
            is invalid, inactive, or not registered in our underwriting system.
          </p>

          <p className="text-xs text-gray-500">
            Please verify the personalized portal link sent in your onboarding email or contact your assigned account manager.
          </p>
        </div>
      </div>
    </DefaultLayout>
  )
}

export default NotFoundPage
