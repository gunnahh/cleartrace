import { useState, type FormEvent, type ReactNode } from 'react'
import { Button, Link as TextLink, Text, TextField } from '@radix-ui/themes'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, CircleAlert, LockKeyhole, Mail } from 'lucide-react'
import { authApi } from '../api'
import { AuthCard, AuthDivider, AuthHeader, GoogleButton } from './AuthCard'

export function LoginView() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!email.includes('@')) return setError('Enter a valid email address.')
    if (password.length < 8) return setError('Password must contain at least 8 characters.')
    setPending(true)
    try {
      await authApi.login({ email, password })
      await navigate({ to: '/assignments', search: { q: '', status: 'ALL' } })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthCard>
      <AuthHeader
        eyebrow="Secure access"
        title="Welcome back"
        description="Sign in to your secure research workspace."
      />
      <GoogleButton
        disabled={pending}
        onUnavailable={() => setError('Google sign-in requires OAuth configuration.')}
      />
      <AuthDivider />
      <form className="auth-form" onSubmit={submit} noValidate aria-busy={pending}>
        <label className="auth-field" htmlFor="login-email">
          <Text className="auth-field__label" size="2" weight="bold">
            Email
          </Text>
          <TextField.Root
            id="login-email"
            className="auth-control"
            name="email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="email"
            required
            placeholder="name@company.com"
            disabled={pending}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          >
            <TextField.Slot>
              <Mail size={16} aria-hidden="true" />
            </TextField.Slot>
          </TextField.Root>
        </label>
        <label className="auth-field" htmlFor="login-password">
          <FlexLabel>
            <Text className="auth-field__label" size="2" weight="bold">
              Password
            </Text>
            <TextLink asChild size="2">
              <Link to="/forgot-password">Forgot password?</Link>
            </TextLink>
          </FlexLabel>
          <TextField.Root
            id="login-password"
            className="auth-control"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            placeholder="Enter your password"
            disabled={pending}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          >
            <TextField.Slot>
              <LockKeyhole size={16} aria-hidden="true" />
            </TextField.Slot>
          </TextField.Root>
        </label>
        {error && (
          <div className="auth-feedback auth-feedback--error" role="alert">
            <CircleAlert size={17} aria-hidden="true" />
            <Text color="red" size="2">
              {error}
            </Text>
          </div>
        )}
        <Button
          className="auth-submit"
          type="submit"
          size="3"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? 'Signing in…' : 'Sign in'}
          {!pending && <ArrowRight size={17} aria-hidden="true" />}
        </Button>
      </form>
      <Text className="auth-switch" size="2" align="center" color="gray">
        Don’t have an account?{' '}
        <TextLink asChild>
          <Link to="/register">Create account</Link>
        </TextLink>
      </Text>
    </AuthCard>
  )
}

function FlexLabel({ children }: { children: ReactNode }) {
  return <span className="auth-label-row">{children}</span>
}
