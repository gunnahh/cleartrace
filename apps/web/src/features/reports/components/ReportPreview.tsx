import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Badge, Button, Card, Heading, Spinner, Text } from '@radix-ui/themes'
import { ArrowLeft, CheckCircle2, Printer, TriangleAlert } from 'lucide-react'
import { isHttpUrl, legalCaseLabel } from '../../../entities/legal-case'
import { mediaFindingLabel, type MediaFinding } from '../../../entities/media-finding'
import { api, assignmentKeys } from '../../../lib/api'
import { submissionIssues } from '../../assignments/model'

export function ReportPreview({ assignmentId }: { assignmentId: string }) {
  const q = useQuery({
      queryKey: assignmentKeys.report(assignmentId),
      queryFn: () => api.get(assignmentId),
    }),
    qc = useQueryClient(),
    nav = useNavigate()
  const submit = useMutation({
    mutationFn: () => api.submit(assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.all })
      nav({ to: '/reports/submitted' })
    },
  })
  if (q.isPending)
    return (
      <div className="state">
        <Spinner />
        Generating report preview…
      </div>
    )
  if (q.isError) return <div className="state error">Report could not be generated.</div>
  const a = q.data,
    issues = submissionIssues(a)
  return (
    <div className="page reportpage">
      <div className="reportactions">
        <Button asChild variant="ghost">
          <Link to="/assignments/$assignmentId" params={{ assignmentId }}>
            <ArrowLeft />
            Back to research
          </Link>
        </Button>
        <span />
        <Button variant="soft" onClick={() => window.print()}>
          <Printer />
          Print / Save PDF
        </Button>
        <Button disabled={!!issues.length || submit.isPending} onClick={() => submit.mutate()}>
          <CheckCircle2 />
          Mark as submitted
        </Button>
      </div>
      {issues.length > 0 && (
        <Card className="completion" role="alert">
          <TriangleAlert />
          <div>
            <Heading size="4">Report is not ready to submit</Heading>
            <Text>Complete the following items before submission.</Text>
            <ul>
              {issues.map((x) => (
                <li key={x}>
                  <Link to="/assignments/$assignmentId" params={{ assignmentId }}>
                    {x}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
      <article className="report">
        <header>
          <Text>CONFIDENTIAL RESEARCH REPORT</Text>
          <Heading size="8">{a.nameEnglish}</Heading>
          <Text>{a.nameThai}</Text>
          <div>
            <span>Assignment {a.referenceId}</span>
            <span>
              Research period {a.researchFrom} – {a.researchTo}
            </span>
          </div>
        </header>
        <ReportSection n="01" title="Subject company information">
          <dl>
            <dt>Registration number</dt>
            <dd>{a.registrationNumber}</dd>
            <dt>Incorporation date</dt>
            <dd>{a.incorporationDate}</dd>
            <dt>Registered address</dt>
            <dd>
              {a.addressEnglish}
              <br />
              {a.addressThai}
            </dd>
            <dt>Business</dt>
            <dd>
              {a.businessEnglish}
              <br />
              {a.businessThai}
            </dd>
            <dt>Registered capital</dt>
            <dd>
              {a.currency} {Number(a.registeredCapital).toLocaleString()}
            </dd>
          </dl>
        </ReportSection>
        <ReportSection n="02" title="Checked parties">
          <table>
            <thead>
              <tr>
                <th>Party</th>
                <th>Type</th>
                <th>Identifier</th>
              </tr>
            </thead>
            <tbody>
              {a.targets.map((t) => (
                <tr key={t.id}>
                  <td>
                    {t.nameEnglish}
                    <small>{t.nameThai}</small>
                  </td>
                  <td>{t.targetType.replaceAll('_', ' ')}</td>
                  <td>{t.identificationNumber || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportSection>
        <ReportSection n="03" title="Legal record matches">
          <Text>
            {a.cases.length
              ? `${a.cases.length} structured legal cases recorded.`
              : 'No structured legal cases recorded.'}
          </Text>
        </ReportSection>
        <ReportSection n="04" title="Detailed legal cases">
          {a.cases.length ? (
            <div className="report-case-list">
              {a.cases.map((legalCase, index) => (
                <article
                  className="report-case"
                  key={legalCase.id || `${legalCase.caseNumber}-${index}`}
                >
                  <div className="row">
                    <Heading size="4">{legalCase.caseNumber}</Heading>
                    <Badge>{legalCaseLabel(legalCase.verdictStatus || 'Unknown')}</Badge>
                  </div>
                  <dl>
                    <dt>Classification</dt>
                    <dd>
                      {legalCaseLabel(legalCase.classification || legalCase.category || 'Legal')}
                    </dd>
                    <dt>Court</dt>
                    <dd>
                      {legalCase.courtName}
                      {legalCase.originatingCourt
                        ? ` · Originating court: ${legalCase.originatingCourt}`
                        : ''}
                    </dd>
                    <dt>Target role</dt>
                    <dd>{legalCaseLabel(legalCase.targetRole)}</dd>
                    <dt>Registered</dt>
                    <dd>{legalCase.registrationDate || 'Not recorded'}</dd>
                    <dt>Parties</dt>
                    <dd>
                      Plaintiffs / appellants: {legalCase.plaintiffs || 'Not recorded'}
                      <br />
                      Defendants / appellees: {legalCase.defendants || 'Not recorded'}
                    </dd>
                    <dt>Background</dt>
                    <dd>{legalCase.caseBackground || 'Not recorded'}</dd>
                    <dt>Petition</dt>
                    <dd>{legalCase.petition || 'Not recorded'}</dd>
                    <dt>Verdict</dt>
                    <dd>
                      {legalCase.verdictOutcome}
                      {legalCase.verdictDate ? ` (${legalCase.verdictDate})` : ''}
                    </dd>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <Text color="gray">No detailed legal cases recorded.</Text>
          )}
        </ReportSection>
        <ReportSection n="05" title="Media match summary">
          <Text>
            {a.media.length} media findings across positive/neutral and negative searches.
          </Text>
        </ReportSection>
        <ReportSection n="06" title="Positive / neutral news">
          <ReportMediaFindings
            findings={a.media.filter((finding) => finding.sentiment !== 'NEGATIVE')}
            targets={a.targets}
          />
        </ReportSection>
        <ReportSection n="07" title="Negative news">
          <ReportMediaFindings
            findings={a.media.filter((finding) => finding.sentiment === 'NEGATIVE')}
            targets={a.targets}
          />
        </ReportSection>
        <ReportSection n="08" title="Sources and limitations">
          <Text>
            Results reflect recorded searches during the stated research period. Absence of a match
            is not a legal conclusion. Source availability and name variations may affect coverage.
          </Text>
        </ReportSection>
        <ReportSection n="09" title="Appendix: no-result screenshot evidence">
          <div className="appendix">
            {a.attempts
              .filter((x) => x.result === 'NO_RESULT')
              .map((x) => (
                <Card key={x.id}>
                  <Badge>{x.searchLanguage}</Badge>
                  <strong>{x.sourceName}</strong>
                  <span>Query: {x.searchQuery}</span>
                  <small>{x.evidence.join(', ')}</small>
                </Card>
              ))}
          </div>
        </ReportSection>
      </article>
    </div>
  )
}

function ReportMediaFindings({
  findings,
  targets,
}: {
  findings: MediaFinding[]
  targets: { id: string; nameEnglish: string; nameThai: string }[]
}) {
  if (!findings.length) return <Text color="gray">No findings recorded.</Text>

  return (
    <div className="report-media-list">
      {findings.map((finding) => {
        const target = targets.find((item) => item.id === finding.targetId)
        return (
          <article className="report-media" key={finding.id}>
            <div className="row">
              <Heading size="4">{finding.articleTitle || 'Untitled legacy finding'}</Heading>
              <Badge color={finding.sentiment === 'NEGATIVE' ? 'red' : 'gray'}>
                {mediaFindingLabel(finding.sentiment)}
              </Badge>
            </div>
            <dl>
              <dt>Checked party</dt>
              <dd>
                {target?.nameEnglish || 'Not linked'}
                {target?.nameThai ? ` · ${target.nameThai}` : ''}
              </dd>
              <dt>Publisher / date</dt>
              <dd>
                {finding.publisher || 'Not recorded'} · {finding.publishedAt || 'Date not recorded'}
              </dd>
              <dt>Original summary</dt>
              <dd>{finding.summaryOriginal || 'Not recorded'}</dd>
              <dt>English summary</dt>
              <dd>{finding.summaryEnglish || 'Not recorded'}</dd>
              <dt>Supporting document</dt>
              <dd>{finding.supportingDocument || 'Not recorded'}</dd>
              {isHttpUrl(finding.sourceUrl) && (
                <>
                  <dt>Source</dt>
                  <dd>
                    <a href={finding.sourceUrl}>{finding.sourceUrl}</a>
                  </dd>
                </>
              )}
            </dl>
          </article>
        )
      })}
    </div>
  )
}

function ReportSection({
  n,
  title,
  children,
}: {
  n: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="reporttitle">
        <span>{n}</span>
        <Heading size="5">{title}</Heading>
      </div>
      {children}
    </section>
  )
}
