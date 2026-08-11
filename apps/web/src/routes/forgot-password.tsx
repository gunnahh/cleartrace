import { createFileRoute } from '@tanstack/react-router'
import { ForgotPasswordView } from '../features/auth/components/ForgotPasswordView'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordView,
})
