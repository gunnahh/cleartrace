import { createFileRoute } from '@tanstack/react-router'
import { CreateAssignmentFlow } from '../features/assignments/components/CreateAssignmentFlow'

export const Route = createFileRoute('/_app/assignments/new')({
  component: CreateAssignmentFlow,
})
