import { createFileRoute } from '@tanstack/react-router'
import { ContentPage } from '../components/layout/ContentPage'

export const Route = createFileRoute('/_app/reports/submitted')({
  component: SubmittedReportsRoute,
})

function SubmittedReportsRoute() {
  return (
    <ContentPage
      title="Submitted reports"
      description="Completed reports are retained here for reference."
    />
  )
}
