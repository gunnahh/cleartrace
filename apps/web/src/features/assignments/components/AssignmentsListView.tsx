import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { EyeOpenIcon, TrashIcon } from '@radix-ui/react-icons'
import { Link } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  ScrollArea,
  Select,
  Spinner,
  Table,
  Text,
  TextField,
} from '@radix-ui/themes'
import {
  Activity,
  CircleCheck,
  Clock3,
  FileCheck2,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { DeleteConfirmationDialog } from '../../../components/DeleteConfirmationDialog'
import { api, assignmentKeys } from '../../../lib/api'
import { assignmentStatuses, assignmentStatusColor, formatAssignmentStatus } from '../model'
const currentTime = new Date('2026-08-09T00:00:00Z').getTime()
const rowsPerPage = 6

export type AssignmentFilters = {
  q: string
  status: 'ALL' | 'DRAFT' | 'IN_PROGRESS' | 'READY_TO_SUBMIT' | 'SUBMITTED'
}

type AssignmentsListViewProps = {
  filters: AssignmentFilters
  onFiltersChange: (filters: AssignmentFilters) => void
}

export function AssignmentsListView({ filters, onFiltersChange }: AssignmentsListViewProps) {
  const [page, setPage] = useState(1)
  const [assignmentToDelete, setAssignmentToDelete] = useState<
    { id: string; referenceId: string; nameEnglish: string } | undefined
  >()
  const queryClient = useQueryClient()
  const q = useQuery({ queryKey: assignmentKeys.list(filters), queryFn: api.list })
  const deleteAssignment = useMutation({
    mutationFn: api.deleteAssignment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assignmentKeys.all }),
  })
  const rows = (q.data || []).filter(
    (a) =>
      (!filters.q ||
        `${a.referenceId} ${a.nameEnglish} ${a.nameThai}`
          .toLowerCase()
          .includes(filters.q.toLowerCase())) &&
      (filters.status === 'ALL' || a.status === filters.status),
  )
  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const paginatedRows = rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const counts = {
    progress: q.data?.filter((x) => x.status === 'IN_PROGRESS').length || 0,
    due:
      q.data?.filter(
        (x) => new Date(x.dueDate).getTime() - currentTime < 6048e5 && x.status !== 'SUBMITTED',
      ).length || 0,
    ready: q.data?.filter((x) => x.status === 'READY_TO_SUBMIT').length || 0,
    submitted: q.data?.filter((x) => x.status === 'SUBMITTED').length || 0,
  }
  return (
    <div className="page">
      <div className="pagehead">
        <div>
          <Heading size="7">Assignments</Heading>
          <Text color="gray">Manage company research assignments and reports</Text>
        </div>
        <Button asChild size="3">
          <Link to="/assignments/new">
            <Plus />
            New assignment
          </Link>
        </Button>
      </div>
      <section className="stats" aria-label="Assignment summary">
        {[
          { label: 'In progress', value: counts.progress, tone: 'progress', icon: Activity },
          { label: 'Due soon', value: counts.due, tone: 'due', icon: Clock3 },
          { label: 'Ready to submit', value: counts.ready, tone: 'ready', icon: CircleCheck },
          { label: 'Submitted', value: counts.submitted, tone: 'submitted', icon: FileCheck2 },
        ].map(({ label, value, tone, icon: Icon }) => (
          <div className={`stat-card stat-card--${tone}`} key={label}>
            <div className="stat-card__header">
              <Text className="stat-card__label" size="2">
                {label}
              </Text>
              <span className="stat-card__icon" aria-hidden="true">
                <Icon size={18} strokeWidth={1.8} />
              </span>
            </div>
            <div className="stat-card__metric">
              <strong>{value}</strong>
              <span>assignments</span>
            </div>
          </div>
        ))}
      </section>
      <Card className="panel" variant="ghost">
        <Flex
          className="assignment-toolbar"
          direction={{ initial: 'column', sm: 'row' }}
          gap="3"
          role="search"
          aria-label="Filter assignments"
        >
          <Box className="assignment-search-wrap">
            <TextField.Root
              className="assignment-search"
              size="3"
              aria-label="Search assignments"
              placeholder="Search ID or company…"
              value={filters.q}
              onChange={(event) => {
                setPage(1)
                onFiltersChange({ ...filters, q: event.target.value })
              }}
            >
              <TextField.Slot>
                <Search size={16} />
              </TextField.Slot>
            </TextField.Root>
          </Box>
          <Box className="assignment-status-wrap">
            <SlidersHorizontal className="assignment-status-icon" size={16} aria-hidden="true" />
            <Select.Root
              size="3"
              value={filters.status}
              onValueChange={(status) => {
                setPage(1)
                onFiltersChange({ ...filters, status: status as AssignmentFilters['status'] })
              }}
            >
              <Select.Trigger className="assignment-status-trigger" aria-label="Filter by status" />
              <Select.Content>
                {(['ALL', ...assignmentStatuses] as const).map((x) => (
                  <Select.Item key={x} value={x}>
                    {x === 'ALL' ? 'All statuses' : formatAssignmentStatus(x)}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>
        </Flex>
        {deleteAssignment.isError && (
          <div className="state error" role="alert">
            Assignment could not be deleted. Please try again.
          </div>
        )}
        {q.isPending ? (
          <div className="state">
            <Spinner />
            Loading assignments…
          </div>
        ) : q.isError ? (
          <div className="state error">Could not load assignments. Please try again.</div>
        ) : !rows.length ? (
          <div className="state">
            <Heading size="4">No assignments found</Heading>
            <Text color="gray">Create an assignment or change your filters.</Text>
          </div>
        ) : (
          <Box px="4" pb="4">
            <ScrollArea className="assignments-table-scroll" type="auto" scrollbars="horizontal">
              <Box minWidth="800px">
                <Table.Root>
                  <Table.Header style={{ backgroundColor: 'var(--iris-3)' }}>
                    <Table.Row>
                      <Table.ColumnHeaderCell className="sequence-cell" justify="center">
                        No.
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell justify="center">Assignment</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell justify="center">
                        Subject company
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell justify="center">
                        Research scope
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell justify="center">Due date</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell justify="center">Status</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell justify="center">Action</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {paginatedRows.map((a, index) => (
                      <Table.Row key={a.id}>
                        <Table.Cell className="sequence-cell" justify="center">
                          {(currentPage - 1) * rowsPerPage + index + 1}
                        </Table.Cell>
                        <Table.Cell justify="center">
                          <strong>{a.referenceId}</strong>
                        </Table.Cell>
                        <Table.Cell justify="center">
                          {a.nameEnglish}
                          <small>{a.nameThai}</small>
                        </Table.Cell>
                        <Table.Cell justify="center">{a.categories.length} categories</Table.Cell>
                        <Table.Cell justify="center">
                          {new Date(a.dueDate).toLocaleDateString()}
                        </Table.Cell>
                        <Table.Cell justify="center">
                          <Badge color={assignmentStatusColor(a.status)}>
                            {formatAssignmentStatus(a.status)}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell justify="center">
                          <Flex align="center" justify="center" gap="2">
                            <Button asChild size="1" variant="soft">
                              <Link
                                to="/assignments/$assignmentId"
                                params={{ assignmentId: a.id }}
                                aria-label={`Open assignment ${a.referenceId}`}
                                title="Open assignment"
                              >
                                <EyeOpenIcon />
                              </Link>
                            </Button>
                            <Button
                              size="1"
                              color="red"
                              variant="soft"
                              disabled={
                                a.status === 'SUBMITTED' ||
                                (deleteAssignment.isPending && deleteAssignment.variables === a.id)
                              }
                              aria-label={`Delete assignment ${a.referenceId}`}
                              title={
                                a.status === 'SUBMITTED'
                                  ? 'Submitted assignments cannot be deleted'
                                  : 'Delete assignment'
                              }
                              onClick={() => {
                                setAssignmentToDelete(a)
                              }}
                            >
                              <TrashIcon />
                            </Button>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </ScrollArea>
            <nav className="pagination" aria-label="Assignments pagination">
              <Flex gap="2" align="center">
                <Button
                  size="1"
                  variant="soft"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    size="1"
                    variant={pageNumber === currentPage ? 'solid' : 'soft'}
                    aria-label={`Page ${pageNumber}`}
                    aria-current={pageNumber === currentPage ? 'page' : undefined}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                ))}
                <Button
                  size="1"
                  variant="soft"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </Button>
              </Flex>
            </nav>
          </Box>
        )}
      </Card>
      <DeleteConfirmationDialog
        open={Boolean(assignmentToDelete)}
        title="Delete assignment?"
        description={
          assignmentToDelete
            ? `This will permanently delete assignment ${assignmentToDelete.referenceId} for ${assignmentToDelete.nameEnglish}.`
            : ''
        }
        pending={deleteAssignment.isPending}
        onOpenChange={(open) => {
          if (!open) setAssignmentToDelete(undefined)
        }}
        onConfirm={() => {
          if (assignmentToDelete) deleteAssignment.mutate(assignmentToDelete.id)
        }}
      />
    </div>
  )
}
