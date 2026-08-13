import { useState, type FormEvent } from 'react'
import { Button, Heading, Link as TextLink, Text, TextField } from '@radix-ui/themes'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, CircleAlert, Mail, MailCheck } from 'lucide-react'
import { authApi } from '../api'
import { AuthCard, AuthHeader } from './AuthCard'

export function ForgotPasswordView() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!email.includes('@')) return setError('Enter a valid email address.')
    setPending(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to request a password reset.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthCard>
      <AuthHeader
        eyebrow="Account recovery"
        title="Reset your password"
        description="Enter your email and we’ll send password reset instructions if an account exists."
      />
      {sent ? (
        <div className="auth-success" role="status">
          <span className="auth-success__icon" aria-hidden="true">
            <MailCheck size={24} />
          </span>
          <div>
            <Heading as="h2" size="4">
              Check your email
            </Heading>
            <Text color="green" size="2">
              Check your email for password reset instructions.
            </Text>
          </div>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit} noValidate aria-busy={pending}>
          <label className="auth-field" htmlFor="forgot-email">
            <Text className="auth-field__label" size="2" weight="bold">
              Email
            </Text>
            <TextField.Root
              id="forgot-email"
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
            {pending ? 'Sending…' : 'Send reset instructions'}
            {!pending && <ArrowRight size={17} aria-hidden="true" />}
          </Button>
        </form>
      )}
      <Text className="auth-switch" align="center">
        <TextLink asChild>
          <Link to="/login">
            <ArrowLeft size={14} aria-hidden="true" />
            Back to sign in
          </Link>
        </TextLink>
      </Text>
    </AuthCard>
  )
}
