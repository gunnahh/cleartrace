import { createFileRoute } from '@tanstack/react-router'
import { ContentPage } from '../components/layout/ContentPage'

export const Route = createFileRoute('/_app/profile')({
  component: ProfileRoute,
})

function ProfileRoute() {
  return <ContentPage title="Profile" description="Freelance researcher · Bangkok (UTC+7)" />
}
