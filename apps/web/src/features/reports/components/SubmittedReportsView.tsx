import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Badge, Button, Card, Heading, ScrollArea, Spinner, Text } from '@radix-ui/themes'
import {
  ArrowRight,
  CalendarDays,
  FileCheck2,
  Newspaper,
  Search,
  ShieldCheck,
  Scale,
} from 'lucide-react'
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
    <div className="page submitted-reports-page">
      <section className="submitted-reports-hero" aria-labelledby="submitted-reports-title">
        <div className="submitted-reports-hero__heading">
          <span className="submitted-reports-hero__icon" aria-hidden="true">
            <FileCheck2 size={22} />
          </span>
          <div>
            <span className="submitted-reports-hero__eyebrow">Report archive</span>
            <Heading id="submitted-reports-title" as="h1" size="7">
              Submitted reports
            </Heading>
            <Text color="gray">Completed reports retained as read-only research records.</Text>
          </div>
        </div>
        {!reportsQuery.isPending && !reportsQuery.isError && (
          <Badge className="submitted-reports-hero__count" size="2" color="green" variant="soft">
            <span aria-hidden="true" />
            {reports.length} {reports.length === 1 ? 'report' : 'reports'}
          </Badge>
        )}
      </section>

      <Card className="panel submitted-reports-panel">
        <div className="submitted-reports-panel__header">
          <span aria-hidden="true">
            <ShieldCheck size={18} />
          </span>
          <div>
            <Heading as="h2" size="4">
              Completed research records
            </Heading>
            <Text size="2" color="gray">
              Finalized dossiers available for review and export.
            </Text>
          </div>
        </div>
        <div className="submitted-reports-panel__body">
          {reportsQuery.isPending ? (
            <div className="state submitted-reports-state" role="status">
              <Spinner />
              Loading submitted reports…
            </div>
          ) : reportsQuery.isError ? (
            <div className="state error submitted-reports-state" role="alert">
              Submitted reports could not be loaded.
            </div>
          ) : reports.length === 0 ? (
            <div className="state submitted-empty">
              <span className="submitted-empty__icon" aria-hidden="true">
                <FileCheck2 />
              </span>
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
            <ScrollArea
              className="submitted-reports-scrollarea"
              type="auto"
              scrollbars="horizontal"
            >
              <div className="submitted-reports-table-wrap">
                <table className="submitted-reports-table">
                  <caption className="sr-only">Submitted research reports</caption>
                  <thead>
                    <tr>
                      <th scope="col">No.</th>
                      <th scope="col">Report</th>
                      <th scope="col">Subject company</th>
                      <th scope="col">Submitted</th>
                      <th scope="col">Evidence</th>
                      <th scope="col">Findings</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, index) => (
                      <tr key={report.id}>
                        <td className="submitted-report__number">{index + 1}</td>
                        <td>
                          <div className="submitted-report__reference">
                            <span aria-hidden="true">
                              <FileCheck2 size={15} />
                            </span>
                            <strong>{report.referenceId}</strong>
                          </div>
                        </td>
                        <td className="submitted-report__company">
                          <strong>{report.nameEnglish}</strong>
                          {report.nameThai && <small lang="th">{report.nameThai}</small>}
                        </td>
                        <td>
                          <span className="submitted-report__date">
                            <CalendarDays size={14} aria-hidden="true" />
                            {formatDate(report.submittedAt ?? report.createdAt)}
                          </span>
                        </td>
                        <td>
                          <span className="submitted-report__metric">
                            <Search size={14} aria-hidden="true" />
                            <strong>{report.attempts.length}</strong> searches
                          </span>
                        </td>
                        <td>
                          <div className="submitted-report__findings">
                            <span>
                              <Scale size={13} aria-hidden="true" />
                              {report.cases.length} legal
                            </span>
                            <span>
                              <Newspaper size={13} aria-hidden="true" />
                              {report.media.length} media
                            </span>
                          </div>
                        </td>
                        <td>
                          <Button className="submitted-report__action" asChild variant="soft">
                            <Link
                              to="/assignments/$assignmentId/report"
                              params={{ assignmentId: report.id }}
                              aria-label={`View submitted report ${report.referenceId}`}
                            >
                              View report <ArrowRight size={15} aria-hidden="true" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}
        </div>
      </Card>
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date not available'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
