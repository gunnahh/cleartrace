import { useState, type FormEvent } from 'react'
import { Button, Heading, Link as TextLink, Text, TextField } from '@radix-ui/themes'
import { Link } from '@tanstack/react-router'
import { authApi } from '../api'
import { AuthCard } from './AuthCard'

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
      <Heading align="center">Reset your password</Heading>
      <Text as="p" align="center" color="gray">
        Enter your email and we’ll send password reset instructions if an account exists.
      </Text>
      {sent ? (
        <Text color="green" align="center" role="status">
          Check your email for password reset instructions.
        </Text>
      ) : (
        <form className="auth-form" onSubmit={submit} noValidate>
          <label>
            <Text size="2" weight="bold">
              Email
            </Text>
            <TextField.Root
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {error && (
            <Text color="red" size="2" role="alert">
              {error}
            </Text>
          )}
          <Button type="submit" size="3" disabled={pending}>
            {pending ? 'Sending…' : 'Send reset instructions'}
          </Button>
        </form>
      )}
      <Text align="center">
        <TextLink asChild>
          <Link to="/login">Back to sign in</Link>
        </TextLink>
      </Text>
    </AuthCard>
  )
}
