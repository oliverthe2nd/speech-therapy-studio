import { useContext, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthUIContext } from '@neondatabase/auth/react/ui'

type AuthGuardProps = {
  children: ReactNode
}

/** Protects admin routes using Neon Auth session from the UI provider. */
export function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation()
  const { hooks } = useContext(AuthUIContext)
  const { data, isPending } = hooks.useSession()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Verifying your session…
      </div>
    )
  }

  if (!data) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
