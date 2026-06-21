import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail } from 'lucide-react'
import {
  ADMIN_CALLBACK_PATH,
  adminCallbackUrl,
  authClient,
  loginErrorCallbackUrl,
} from '@/lib/authClient'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type Mode = 'magic-link' | 'email-code'
type Step = 'email' | 'code' | 'sent'

function readAuthError(searchParams: URLSearchParams): string | null {
  const error =
    searchParams.get('error') ??
    searchParams.get('error_description') ??
    searchParams.get('message')

  if (!error) return null

  return error.replace(/_/g, ' ').toLowerCase()
}

function formatAuthError(message: string): string {
  if (/invalid callbackurl/i.test(message)) {
    return 'This app URL is not allowed in Neon Auth yet. Add your site URL and /auth/callback under Neon Console → Auth → Configuration → Redirect URLs, then try again.'
  }
  if (/invalid token|expired/i.test(message)) {
    return 'That sign-in link is invalid or expired. Request a new one below.'
  }
  return message
}

async function runAuthRequest<T>(
  request: () => Promise<{ data?: T | null; error?: { message?: string } | null }>,
): Promise<T> {
  try {
    const result = await request()
    if (result.error) {
      throw new Error(result.error.message ?? 'Authentication request failed.')
    }
    return result.data as T
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('Authentication request failed.')
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<Mode>('magic-link')
  const [step, setStep] = useState<Step>('email')
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const authError = readAuthError(searchParams)
    if (authError) {
      setErrorMessage(formatAuthError(authError))
    }
  }, [searchParams])

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setBusy(true)
    setErrorMessage(null)

    try {
      await runAuthRequest(() =>
        authClient.signIn.magicLink({
          email: trimmed,
          callbackURL: adminCallbackUrl(),
          errorCallbackURL: loginErrorCallbackUrl(),
        }),
      )
      setStep('sent')
    } catch (error) {
      setErrorMessage(
        formatAuthError(
          error instanceof Error
            ? error.message
            : 'Could not send magic link.',
        ),
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setBusy(true)
    setErrorMessage(null)

    try {
      await runAuthRequest(() =>
        authClient.emailOtp.sendVerificationOtp({
          email: trimmed,
          type: 'sign-in',
        }),
      )
      setStep('code')
    } catch (error) {
      setErrorMessage(
        formatAuthError(
          error instanceof Error
            ? error.message
            : 'Could not send sign-in code.',
        ),
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedEmail = email.trim()
    const trimmedCode = code.trim()
    if (!trimmedEmail || !trimmedCode) return

    setBusy(true)
    setErrorMessage(null)

    try {
      await runAuthRequest(() =>
        authClient.signIn.emailOtp({
          email: trimmedEmail,
          otp: trimmedCode,
        }),
      )

      const session = await authClient.getSession()
      if (!session.data) {
        throw new Error('Sign-in succeeded but no session was created.')
      }

      navigate(ADMIN_CALLBACK_PATH, { replace: true })
    } catch (error) {
      setErrorMessage(
        formatAuthError(
          error instanceof Error
            ? error.message
            : 'That code did not work. Try again.',
        ),
      )
    } finally {
      setBusy(false)
    }
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode)
    setStep('email')
    setCode('')
    setErrorMessage(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">SpeakFlow Studio</CardTitle>
          <CardDescription>
            {step === 'sent'
              ? 'Check your inbox for the sign-in link.'
              : step === 'code'
                ? 'Enter the one-time code we emailed you.'
                : mode === 'magic-link'
                  ? 'Sign in with a passwordless magic link sent to your email.'
                  : 'Sign in with a one-time code sent to your email.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'sent' ? (
            <div className="space-y-3 text-center text-sm text-muted-foreground">
              <Mail className="mx-auto size-10 text-primary" aria-hidden />
              <p className="font-medium text-foreground">Check your inbox</p>
              <p>
                We sent a sign-in link to <strong>{email.trim()}</strong>.
                Click it to open your executive dashboard.
              </p>
              <Button
                type="button"
                variant="ghost"
                className="mt-2"
                onClick={() => {
                  setStep('email')
                  setErrorMessage(null)
                }}
              >
                Use a different email
              </Button>
            </div>
          ) : step === 'code' ? (
            <form className="space-y-4" onSubmit={handleVerifyCode}>
              <p className="text-center text-sm text-muted-foreground">
                Code sent to <strong>{email.trim()}</strong>
              </p>
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Sign-in code
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg tracking-widest shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                />
              </div>
              {errorMessage && (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Verifying…' : 'Sign in'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={busy}
                onClick={() => switchMode('email-code')}
              >
                Use a different email
              </Button>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={mode === 'magic-link' ? handleMagicLink : handleSendCode}
            >
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                />
              </div>
              {errorMessage && (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy
                  ? mode === 'magic-link'
                    ? 'Sending link…'
                    : 'Sending code…'
                  : mode === 'magic-link'
                    ? 'Email me a magic link'
                    : 'Email me a sign-in code'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={busy}
                onClick={() =>
                  switchMode(mode === 'magic-link' ? 'email-code' : 'magic-link')
                }
              >
                {mode === 'magic-link'
                  ? 'Use email code instead'
                  : 'Use magic link instead'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
