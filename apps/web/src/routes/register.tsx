import { createFileRoute } from '@tanstack/react-router'
import { RegisterView } from '../features/auth/components/RegisterView'

export const Route = createFileRoute('/register')({
  component: RegisterView,
})
