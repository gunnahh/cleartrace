import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import {
  AssignmentsListView,
  type AssignmentFilters,
} from '../features/assignments/components/AssignmentsListView'

const assignmentSearchSchema = z.object({
  q: z.string().catch(''),
  status: z.enum(['ALL', 'DRAFT', 'IN_PROGRESS', 'READY_TO_SUBMIT', 'SUBMITTED']).catch('ALL'),
})

export const Route = createFileRoute('/_app/assignments/')({
  validateSearch: assignmentSearchSchema,
  component: AssignmentsRoute,
})

function AssignmentsRoute() {
  const filters = Route.useSearch()
  const navigate = Route.useNavigate()

  const updateFilters = (nextFilters: AssignmentFilters) => {
    void navigate({ search: nextFilters, replace: true })
  }

  return <AssignmentsListView filters={filters} onFiltersChange={updateFilters} />
}
