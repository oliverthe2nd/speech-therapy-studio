import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { authClient } from '@/lib/authClient'

type AuthGuardProps = {
  children: ReactNode
}

/** Protects admin routes — validates Neon Auth cookie session via getSession(). */
export function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation()
  const [pending, setPending] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    let cancelled = false

    authClient.getSession().then((result) => {
      if (cancelled) return
      setAuthenticated(Boolean(result.data?.session))
      setPending(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (pending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Verifying your session…
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
