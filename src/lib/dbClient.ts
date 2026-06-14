import { NeonPostgrestClient, fetchWithToken } from '@neondatabase/postgrest-js'
import { neonAuth } from './authClient'

const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL

if (!dataApiUrl) {
  console.warn(
    'Neon Data API env var missing. Set VITE_NEON_DATA_API_URL in .env (enable Data API in Neon Console).',
  )
}

/** Authenticated PostgREST client for Neon Data API. */
export const db = new NeonPostgrestClient({
  dataApiUrl: dataApiUrl ?? '',
  options: {
    global: {
      fetch: fetchWithToken(() => neonAuth.getJWTToken()),
    },
  },
})
