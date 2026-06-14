import { createInternalNeonAuth } from '@neondatabase/auth'
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters'

const authUrl = import.meta.env.VITE_NEON_AUTH_URL

if (!authUrl) {
  console.warn(
    'Neon Auth env var missing. Set VITE_NEON_AUTH_URL in .env',
  )
}

export const neonAuth = createInternalNeonAuth(authUrl ?? '', {
  adapter: BetterAuthReactAdapter(),
})

/** Neon Auth client — magic link, session hooks, sign-out. */
export const authClient = neonAuth.adapter

export const ADMIN_CALLBACK_PATH = '/dashboard'

export function adminCallbackUrl(): string {
  if (typeof window === 'undefined') {
    return ADMIN_CALLBACK_PATH
  }
  return `${window.location.origin}${ADMIN_CALLBACK_PATH}`
}
