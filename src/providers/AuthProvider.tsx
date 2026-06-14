import type { ReactNode } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { NeonAuthUIProvider } from '@neondatabase/auth/react/ui'
import { ADMIN_CALLBACK_PATH, authClient } from '@/lib/authClient'

type AuthProviderProps = {
  children: ReactNode
}

function Link({
  href,
  ...props
}: { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <RouterLink to={href} {...props} />
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate()

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={(path) => navigate(path)}
      replace={(path) => navigate(path, { replace: true })}
      Link={Link}
      redirectTo={ADMIN_CALLBACK_PATH}
    >
      {children}
    </NeonAuthUIProvider>
  )
}
