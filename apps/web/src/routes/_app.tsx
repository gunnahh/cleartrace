import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '../components/layout/AppLayout'
import { authApi } from '../features/auth/api'

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    try {
      await authApi.me()
    } catch {
      throw redirect({ to: '/login' })
    }
  },
  component: AppLayout,
})
