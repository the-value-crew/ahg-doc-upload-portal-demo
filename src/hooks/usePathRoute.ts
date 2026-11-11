import { useState, useEffect } from 'react'

export function usePathRoute() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (to: string, replace = false) => {
    if (replace) {
      window.history.replaceState({}, '', to)
    } else {
      window.history.pushState({}, '', to)
    }
    setPathname(window.location.pathname)
  }

  return { pathname, navigate }
}

