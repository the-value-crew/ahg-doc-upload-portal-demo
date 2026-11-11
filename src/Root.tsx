import React from 'react'
import { usePathRoute } from './hooks/usePathRoute'
import UploadPage from './pages/Upload.page'
import AdminPage from './pages/Admin.page'
import NotFoundPage from './pages/NotFound.page'

export default function Root() {
  const { pathname } = usePathRoute()

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <AdminPage />
  }

  if (pathname === '/404') {
    return <NotFoundPage />
  }

  return <UploadPage />
}

