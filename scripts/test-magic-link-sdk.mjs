import { createInternalNeonAuth } from '@neondatabase/auth'
import { BetterAuthVanillaAdapter } from '@neondatabase/auth/vanilla/adapters'

const authUrl =
  process.env.VITE_NEON_AUTH_URL ??
  'https://ep-twilight-night-a7tu7koe.neonauth.ap-southeast-2.aws.neon.tech/neondb/auth'

const client = createInternalNeonAuth(authUrl, {
  adapter: BetterAuthVanillaAdapter(),
}).adapter

try {
  const result = await client.signIn.magicLink({
    email: 'test@example.com',
    callbackURL: 'http://localhost:5173/auth/callback',
    errorCallbackURL: 'http://localhost:5173/login',
  })
  console.log('magicLink OK:', JSON.stringify(result, null, 2))
} catch (error) {
  console.log('magicLink error:', error instanceof Error ? error.message : error)
}
