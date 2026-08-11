import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Badge, Button, Card, Flex, Heading, Spinner, Text } from '@radix-ui/themes'
import { ArrowRight, FileCheck2 } from 'lucide-react'
import { api, assignmentKeys } from '../../../lib/api'

export function SubmittedReportsView() {
  const reportsQuery = useQuery({
    queryKey: assignmentKeys.lists(),
    queryFn: api.list,
  })
  const reports = (reportsQuery.data ?? [])
    .filter((assignment) => assignment.status === 'SUBMITTED')
    .sort(
      (left, right) =>
        new Date(right.submittedAt ?? right.createdAt).getTime() -
        new Date(left.submittedAt ?? left.createdAt).getTime(),
    )

  return (
    <div className="page">
      <Flex className="pagehead" align="end" justify="between" gap="4" wrap="wrap">
        <div>
          <Heading as="h1" size="7">
            Submitted reports
          </Heading>
          <Text color="gray">Completed reports retained as read-only research records.</Text>
        </div>
        {!reportsQuery.isPending && !reportsQuery.isError && (
          <Badge size="2" color="green" variant="soft">
            {reports.length} {reports.length === 1 ? 'report' : 'reports'}
          </Badge>
        )}
      </Flex>

      <Card className="panel">
        {reportsQuery.isPending ? (
          <div className="state" role="status">
            <Spinner />
            Loading submitted reports…
          </div>
        ) : reportsQuery.isError ? (
          <div className="state error" role="alert">
            Submitted reports could not be loaded.
          </div>
        ) : reports.length === 0 ? (
          <div className="state submitted-empty">
            <FileCheck2 aria-hidden="true" />
            <Heading as="h2" size="4">
              No submitted reports yet
            </Heading>
            <Text color="gray">Reports appear here after they are marked as submitted.</Text>
            <Button asChild variant="soft">
              <Link to="/assignments" search={{ q: '', status: 'READY_TO_SUBMIT' }}>
                Review ready assignments
              </Link>
            </Button>
          </div>
        ) : (
          <div className="tablewrap">
            <table>
              <caption className="sr-only">Submitted research reports</caption>
              <thead>
                <tr>
                  <th scope="col">Report</th>
                  <th scope="col">Subject company</th>
                  <th scope="col">Submitted</th>
                  <th scope="col">Evidence</th>
                  <th scope="col">Findings</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <strong>{report.referenceId}</strong>
                    </td>
                    <td>
                      {report.nameEnglish}
                      <small>{report.nameThai}</small>
                    </td>
                    <td>{formatDate(report.submittedAt ?? report.createdAt)}</td>
                    <td>{report.attempts.length} searches</td>
                    <td>
                      {report.cases.length} legal · {report.media.length} media
                    </td>
                    <td>
                      <Button asChild variant="soft">
                        <Link
                          to="/assignments/$assignmentId/report"
                          params={{ assignmentId: report.id }}
                          aria-label={`View submitted report ${report.referenceId}`}
                        >
                          View report <ArrowRight />
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
