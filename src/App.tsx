import { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import {
  AuthCallback as NeonAuthCallback,
  AuthUIContext,
} from '@neondatabase/auth/react/ui'
import { SpeechTherapyStudio } from '@/components/SpeechTherapyStudio'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { LoginPage } from '@/components/auth/LoginPage'
import { ADMIN_CALLBACK_PATH } from '@/lib/authClient'

function RootRedirect() {
  const { hooks } = useContext(AuthUIContext)
  const { data, isPending } = hooks.useSession()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <Navigate to={data ? ADMIN_CALLBACK_PATH : '/login'} replace />
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/auth/callback"
        element={<NeonAuthCallback redirectTo={ADMIN_CALLBACK_PATH} />}
      />
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
