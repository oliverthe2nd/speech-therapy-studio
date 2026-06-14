import { useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { adminCallbackUrl, authClient } from '@/lib/authClient'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setStatus('sending')
    setErrorMessage(null)

    const { error } = await authClient.signIn.magicLink({
      email: trimmed,
      callbackURL: adminCallbackUrl(),
    })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message ?? 'Could not send magic link.')
      return
    }

    setStatus('sent')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">SpeakFlow Studio</CardTitle>
          <CardDescription>
            Sign in with a passwordless magic link sent to your email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'sent' ? (
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
                onClick={() => setStatus('idle')}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
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
              <Button
                type="submit"
                className="w-full"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending link…' : 'Email me a magic link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
