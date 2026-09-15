import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { ReactElement } from "react"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css';

interface DefaultLayoutProps {
    children: ReactElement
}

function DefaultLayout({ children }: DefaultLayoutProps) {
    return (
        <>
            <div className="flex flex-col h-screen justify-between">
                <Navbar />
                <main>{children}</main>
                <Footer />
            </div>
            <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar
                newestOnTop={false}
                closeOnClick
                rtl={false}
                draggable
                theme="light" />
        </>
    )
}

export default DefaultLayout;