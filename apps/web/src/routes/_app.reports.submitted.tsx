import { createFileRoute } from '@tanstack/react-router'
import { SubmittedReportsView } from '../features/reports/components/SubmittedReportsView'

export const Route = createFileRoute('/_app/reports/submitted')({
  component: SubmittedReportsRoute,
})

function SubmittedReportsRoute() {
  return <SubmittedReportsView />
}
