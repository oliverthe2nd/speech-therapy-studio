import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { ADMIN_CALLBACK_PATH, adminCallbackUrl, authClient } from '@/lib/authClient'

/**
 * Handles magic-link return tokens when Neon Auth redirects through the app.
 */
export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setReady(true)
      return
    }

    let cancelled = false

    authClient.magicLink
      .verify({
        query: {
          token,
          callbackURL: adminCallbackUrl(),
        },
      })
      .then(({ error }) => {
        if (cancelled) return
        if (error) {
          setFailed(true)
        }
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
          setReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [searchParams])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Completing sign-in…
      </div>
    )
  }

  if (failed) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={ADMIN_CALLBACK_PATH} replace />
}
