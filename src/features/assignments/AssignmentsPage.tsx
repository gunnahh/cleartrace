import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch, Link } from '@tanstack/react-router'
import { Badge, Button, Card, Heading, Select, Spinner, Text, TextField } from '@radix-ui/themes'
import { Plus, Search, ArrowRight } from 'lucide-react'
import { api, assignmentKeys } from '../../lib/api'
const currentTime = new Date('2026-08-09T00:00:00Z').getTime()
export function AssignmentsPage() {
  const filters = useSearch({ from: '/app/assignments' })
  const nav = useNavigate({ from: '/assignments' })
  const q = useQuery({ queryKey: assignmentKeys.list(filters), queryFn: api.list })
  const rows = (q.data || []).filter(
    (a) =>
      (!filters.q ||
        `${a.referenceId} ${a.nameEnglish} ${a.nameThai}`
          .toLowerCase()
          .includes(filters.q.toLowerCase())) &&
      (filters.status === 'ALL' || a.status === filters.status),
  )
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
          ['In progress', counts.progress],
          ['Due soon', counts.due],
          ['Ready to submit', counts.ready],
          ['Submitted', counts.submitted],
        ].map(([x, n]) => (
          <Card key={x}>
            <Text size="2" color="gray">
              {x}
            </Text>
            <strong>{n}</strong>
          </Card>
        ))}
      </section>
      <Card className="panel">
        <div className="filters">
          <TextField.Root
            aria-label="Search assignments"
            placeholder="Search ID or company…"
            value={filters.q}
            onChange={(e) => nav({ search: (p) => ({ ...p, q: e.target.value }), replace: true })}
          >
            <TextField.Slot>
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
          <Select.Root
            value={filters.status}
            onValueChange={(status) => nav({ search: (p) => ({ ...p, status }), replace: true })}
          >
            <Select.Trigger aria-label="Filter by status" />
            <Select.Content>
              {['ALL', 'DRAFT', 'IN_PROGRESS', 'READY_TO_SUBMIT', 'SUBMITTED'].map((x) => (
                <Select.Item key={x} value={x}>
                  {x === 'ALL' ? 'All statuses' : x.replaceAll('_', ' ')}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>
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
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Subject company</th>
                  <th>Research scope</th>
                  <th>Due date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.referenceId}</strong>
                    </td>
                    <td>
                      {a.nameEnglish}
                      <small>{a.nameThai}</small>
                    </td>
                    <td>{a.categories.length} categories</td>
                    <td>{new Date(a.dueDate).toLocaleDateString()}</td>
                    <td>
                      <Badge color={a.status === 'SUBMITTED' ? 'green' : 'iris'}>
                        {a.status.replaceAll('_', ' ')}
                      </Badge>
                    </td>
                    <td>
                      <Button asChild variant="ghost">
                        <Link to="/assignments/$assignmentId" params={{ assignmentId: a.id }}>
                          Open <ArrowRight />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
