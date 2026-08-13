import { useState, type FormEvent } from 'react'
import { Button, Link as TextLink, Text, TextField } from '@radix-ui/themes'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, CircleAlert, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { authApi } from '../api'
import { AuthCard, AuthDivider, AuthHeader, GoogleButton } from './AuthCard'

export function RegisterView() {
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
      await authApi.register({ email, password })
      await navigate({ to: '/assignments', search: { q: '', status: 'ALL' } })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create your account.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthCard>
      <AuthHeader
        eyebrow="Get started"
        title="Create your account"
        description="Start a secure company research workspace."
      />
      <GoogleButton
        disabled={pending}
        onUnavailable={() => setError('Google sign-up requires OAuth configuration.')}
      />
      <AuthDivider />
      <form className="auth-form" onSubmit={submit} noValidate aria-busy={pending}>
        <label className="auth-field" htmlFor="register-email">
          <Text className="auth-field__label" size="2" weight="bold">
            Email
          </Text>
          <TextField.Root
            id="register-email"
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
        <label className="auth-field" htmlFor="register-password">
          <Text className="auth-field__label" size="2" weight="bold">
            Password
          </Text>
          <TextField.Root
            id="register-password"
            className="auth-control"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="register-password-hint"
            placeholder="Create a secure password"
            disabled={pending}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          >
            <TextField.Slot>
              <LockKeyhole size={16} aria-hidden="true" />
            </TextField.Slot>
          </TextField.Root>
          <span className="auth-field__hint" id="register-password-hint">
            <ShieldCheck size={13} aria-hidden="true" />
            <Text size="1" color="gray">
              Use at least 8 characters.
            </Text>
          </span>
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
          {pending ? 'Creating account…' : 'Create account'}
          {!pending && <ArrowRight size={17} aria-hidden="true" />}
        </Button>
      </form>
      <Text className="auth-switch" size="2" align="center" color="gray">
        Already have an account?{' '}
        <TextLink asChild>
          <Link to="/login">Sign in</Link>
        </TextLink>
      </Text>
    </AuthCard>
  )
}
