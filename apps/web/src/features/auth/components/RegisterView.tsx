import { useState, type FormEvent } from 'react'
import { Button, Heading, Link as TextLink, Text, TextField } from '@radix-ui/themes'
import { Link, useNavigate } from '@tanstack/react-router'
import { authApi } from '../api'
import { AuthCard, AuthDivider, GoogleButton } from './AuthCard'

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
      <Heading align="center">Create your account</Heading>
      <Text as="p" align="center" color="gray">
        Start a secure company research workspace.
      </Text>
      <GoogleButton
        onUnavailable={() => setError('Google sign-up requires OAuth configuration.')}
      />
      <AuthDivider />
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
        <label>
          <Text size="2" weight="bold">
            Password
          </Text>
          <TextField.Root
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Text size="1" color="gray">
            Use at least 8 characters.
          </Text>
        </label>
        {error && (
          <Text color="red" size="2" role="alert">
            {error}
          </Text>
        )}
        <Button type="submit" size="3" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <Text size="2" align="center" color="gray">
        Already have an account?{' '}
        <TextLink asChild>
          <Link to="/login">Sign in</Link>
        </TextLink>
      </Text>
    </AuthCard>
  )
}
