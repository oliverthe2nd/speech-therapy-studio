const base =
  'https://ep-twilight-night-a7tu7koe.neonauth.ap-southeast-2.aws.neon.tech/neondb/auth'

const callbacks = [
  'http://localhost:5173/auth/callback',
  'http://127.0.0.1:5173/auth/callback',
  'https://speech-therapy-studio.vercel.app/auth/callback',
]

for (const callbackURL of callbacks) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch(`${base}/sign-in/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        callbackURL,
        errorCallbackURL: 'http://localhost:5173/login',
      }),
      signal: controller.signal,
    })
    const body = await response.text()
    console.log(`callback=${callbackURL}`)
    console.log(`  status=${response.status} body=${body.slice(0, 300)}`)
  } catch (error) {
    console.log(`callback=${callbackURL}`)
    console.log(`  error=${error.name}: ${error.message}`)
  } finally {
    clearTimeout(timer)
  }
}
