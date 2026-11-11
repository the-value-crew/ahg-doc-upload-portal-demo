import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ReactElement } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'
import { BrandingConfig, SupportContactConfig } from '../../shared/types'

interface DefaultLayoutProps {
  children: ReactElement
  branding?: BrandingConfig
  supportContact?: SupportContactConfig
}

function DefaultLayout({ children, branding, supportContact }: DefaultLayoutProps) {
  return (
    <>
      <div className="flex flex-col min-h-screen justify-between">
        <Navbar branding={branding} />
        <main>{children}</main>
        <Footer branding={branding} supportContact={supportContact} />
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        draggable
        theme="light"
      />
    </>
  )
}

export default DefaultLayout
