import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SpeechTherapyStudio } from '@/components/SpeechTherapyStudio'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { AuthCallback } from '@/components/auth/AuthCallback'
import { LoginPage } from '@/components/auth/LoginPage'
import { ADMIN_CALLBACK_PATH, authClient } from '@/lib/authClient'

function RootRedirect() {
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
        Loading…
      </div>
    )
  }

  return (
    <Navigate
      to={authenticated ? ADMIN_CALLBACK_PATH : '/login'}
      replace
    />
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path={ADMIN_CALLBACK_PATH}
        element={
          <AuthGuard>
            <SpeechTherapyStudio />
          </AuthGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
