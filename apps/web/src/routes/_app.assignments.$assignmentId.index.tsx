import { createFileRoute } from '@tanstack/react-router'
import { AssignmentResearchWorkspace } from '../features/research/components/AssignmentResearchWorkspace'

export const Route = createFileRoute('/_app/assignments/$assignmentId/')({
  component: AssignmentDetailRoute,
})

function AssignmentDetailRoute() {
  const { assignmentId } = Route.useParams()
  return <AssignmentResearchWorkspace assignmentId={assignmentId} />
}
