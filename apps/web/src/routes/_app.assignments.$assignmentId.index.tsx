import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import {
  AssignmentResearchWorkspace,
  assignmentWorkspaceTabs,
  type AssignmentWorkspaceTab,
} from '../features/research'

const searchSchema = z.object({ tab: z.enum(assignmentWorkspaceTabs).optional() }).catch({})

export const Route = createFileRoute('/_app/assignments/$assignmentId/')({
  validateSearch: searchSchema,
  component: AssignmentDetailRoute,
})

function AssignmentDetailRoute() {
  const { assignmentId } = Route.useParams()
  const { tab = 'parties' } = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <AssignmentResearchWorkspace
      assignmentId={assignmentId}
      activeTab={tab}
      onTabChange={(nextTab: AssignmentWorkspaceTab) => {
        void navigate({ search: (previous) => ({ ...previous, tab: nextTab }), replace: true })
      }}
    />
  )
}
