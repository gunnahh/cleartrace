import { createFileRoute } from '@tanstack/react-router'
import { ReportPreview } from '../features/reports/components/ReportPreview'

export const Route = createFileRoute('/_app/assignments/$assignmentId/report')({
  component: ReportPreviewRoute,
})

function ReportPreviewRoute() {
  const { assignmentId } = Route.useParams()
  return <ReportPreview assignmentId={assignmentId} />
}
