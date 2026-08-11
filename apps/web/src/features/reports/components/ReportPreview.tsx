import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Badge, Box, Button, Card, Flex, Heading, Separator, Spinner, Text } from '@radix-ui/themes'
import { ArrowLeft, Printer, TriangleAlert } from 'lucide-react'
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
      <Flex className="reportactions" align="center" justify="between" gap="0" mb="5">
        <Button asChild variant="ghost">
          <Link to="/assignments/$assignmentId" params={{ assignmentId }}>
            <ArrowLeft />
            Back to research
          </Link>
        </Button>
        <Flex align="center" gap="2">
          <Button
            variant="soft"
            aria-label="Print or save report as PDF"
            title="Print / Save PDF"
            onClick={() => window.print()}
          >
            <Printer />
          </Button>
          <Button
            disabled={a.status === 'SUBMITTED' || !!issues.length || submit.isPending}
            onClick={() => submit.mutate()}
          >
            {a.status === 'SUBMITTED' ? 'Submitted' : 'Done'}
          </Button>
        </Flex>
      </Flex>
      {issues.length > 0 && (
        <Card className="completion" role="alert">
          <TriangleAlert />
          <div>
            <Heading as="h2" size="4">
              Report is not ready to submit
            </Heading>
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
      <Box
        asChild
        m="auto"
        style={{
          backgroundColor: 'var(--color-panel-solid)',
          borderRadius: 'var(--radius-4)',
          boxShadow: '0 8px 40px var(--black-a1), 0 12px 32px -16px var(--gray-a3)',
          overflow: 'hidden',
        }}
      >
        <article className="report">
          <Box asChild p="8" style={{ backgroundColor: 'var(--iris-2)' }}>
            <header>
              <Text weight="bold">CONFIDENTIAL RESEARCH REPORT</Text>
              <Heading as="h1" size="7">
                {a.nameEnglish}
              </Heading>
              <Text weight="bold">{a.nameThai}</Text>
              <div>
                <span>
                  <strong>Assignment:</strong> {a.referenceId}
                </span>
                <span>
                  <strong>Research period:</strong> {a.researchFrom} – {a.researchTo}
                </span>
              </div>
            </header>
          </Box>
          <Separator size="4" />
          <ReportSection n="01" title="Subject company information">
            <dl>
              <ReportTerm>Registration number</ReportTerm>
              <ReportDescription>{a.registrationNumber}</ReportDescription>
              <ReportTerm>Incorporation date</ReportTerm>
              <ReportDescription>{a.incorporationDate}</ReportDescription>
              <ReportTerm>Registered address</ReportTerm>
              <ReportDescription>
                {a.addressEnglish}
                <br />
                {a.addressThai}
              </ReportDescription>
              <ReportTerm>Business</ReportTerm>
              <ReportDescription>
                {a.businessEnglish}
                <br />
                {a.businessThai}
              </ReportDescription>
              <ReportTerm>Registered capital</ReportTerm>
              <ReportDescription>
                {a.currency} {Number(a.registeredCapital).toLocaleString()}
              </ReportDescription>
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
                      <Heading as="h3" size="4">
                        {legalCase.caseNumber}
                      </Heading>
                      <Badge>{legalCaseLabel(legalCase.verdictStatus || 'Unknown')}</Badge>
                    </div>
                    <dl>
                      <ReportTerm>Classification</ReportTerm>
                      <ReportDescription>
                        {legalCaseLabel(legalCase.classification || legalCase.category || 'Legal')}
                      </ReportDescription>
                      <ReportTerm>Court</ReportTerm>
                      <ReportDescription>
                        {legalCase.courtName}
                        {legalCase.originatingCourt
                          ? ` · Originating court: ${legalCase.originatingCourt}`
                          : ''}
                      </ReportDescription>
                      <ReportTerm>Target role</ReportTerm>
                      <ReportDescription>{legalCaseLabel(legalCase.targetRole)}</ReportDescription>
                      <ReportTerm>Registered</ReportTerm>
                      <ReportDescription>
                        {legalCase.registrationDate || 'Not recorded'}
                      </ReportDescription>
                      <ReportTerm>Parties</ReportTerm>
                      <ReportDescription>
                        Plaintiffs / appellants: {legalCase.plaintiffs || 'Not recorded'}
                        <br />
                        Defendants / appellees: {legalCase.defendants || 'Not recorded'}
                      </ReportDescription>
                      <ReportTerm>Background</ReportTerm>
                      <ReportDescription>
                        {legalCase.caseBackground || 'Not recorded'}
                      </ReportDescription>
                      <ReportTerm>Petition</ReportTerm>
                      <ReportDescription>{legalCase.petition || 'Not recorded'}</ReportDescription>
                      <ReportTerm>Verdict</ReportTerm>
                      <ReportDescription>
                        {legalCase.verdictOutcome}
                        {legalCase.verdictDate ? ` (${legalCase.verdictDate})` : ''}
                      </ReportDescription>
                      <ReportTerm>Supporting documents</ReportTerm>
                      <ReportDescription>
                        <ul className="report-document-list">
                          <li>
                            Original source: {legalCase.originalSourceDocument || 'Not recorded'}
                          </li>
                          {legalCase.englishTranslatedDocument && (
                            <li>English translation: {legalCase.englishTranslatedDocument}</li>
                          )}
                        </ul>
                      </ReportDescription>
                      {isHttpUrl(legalCase.sourceUrl) && (
                        <>
                          <ReportTerm>Recorded source</ReportTerm>
                          <ReportDescription>
                            <a href={legalCase.sourceUrl}>{legalCase.sourceUrl}</a>
                          </ReportDescription>
                        </>
                      )}
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
              Results reflect recorded searches during the stated research period. Absence of a
              match is not a legal conclusion. Source availability and name variations may affect
              coverage.
            </Text>
          </ReportSection>
          <ReportSection n="09" title="Appendix: search evidence">
            <div className="appendix">
              {a.attempts.map((x) => (
                <Card key={x.id}>
                  <div className="row">
                    <Badge>{x.searchLanguage}</Badge>
                    <Badge color={x.result === 'RECORD_FOUND' ? 'green' : 'gray'}>
                      {x.result.replaceAll('_', ' ')}
                    </Badge>
                  </div>
                  <strong>{x.sourceName}</strong>
                  <span>Query: {x.searchQuery}</span>
                  <div className="report-evidence-files">
                    {x.evidence.map((fileName) => {
                      const preview = x.evidencePreviews?.find((item) => item.name === fileName)
                      return preview ? (
                        <figure key={fileName}>
                          <img src={preview.dataUrl} alt={`Search evidence: ${fileName}`} />
                          <figcaption>{fileName}</figcaption>
                        </figure>
                      ) : (
                        <small key={fileName}>{fileName}</small>
                      )
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </ReportSection>
        </article>
      </Box>
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
              <Heading as="h3" size="4">
                {finding.articleTitle || 'Untitled legacy finding'}
              </Heading>
              <Badge color={finding.sentiment === 'NEGATIVE' ? 'red' : 'gray'}>
                {mediaFindingLabel(finding.sentiment)}
              </Badge>
            </div>
            <dl>
              <ReportTerm>Checked party</ReportTerm>
              <ReportDescription>
                {target?.nameEnglish || 'Not linked'}
                {target?.nameThai ? ` · ${target.nameThai}` : ''}
              </ReportDescription>
              <ReportTerm>Publisher / date</ReportTerm>
              <ReportDescription>
                {finding.publisher || 'Not recorded'} · {finding.publishedAt || 'Date not recorded'}
              </ReportDescription>
              <ReportTerm>Original summary</ReportTerm>
              <ReportDescription>{finding.summaryOriginal || 'Not recorded'}</ReportDescription>
              <ReportTerm>English summary</ReportTerm>
              <ReportDescription>{finding.summaryEnglish || 'Not recorded'}</ReportDescription>
              <ReportTerm>Supporting document</ReportTerm>
              <ReportDescription>{finding.supportingDocument || 'Not recorded'}</ReportDescription>
              {isHttpUrl(finding.sourceUrl) && (
                <>
                  <ReportTerm>Source</ReportTerm>
                  <ReportDescription>
                    <a href={finding.sourceUrl}>{finding.sourceUrl}</a>
                  </ReportDescription>
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
        <Badge size="3" radius="full" variant="soft" highContrast>
          <Text weight="bold">{Number(n)}</Text>
        </Badge>
        <Heading as="h2" size="5">
          {title}
        </Heading>
      </div>
      {children}
    </section>
  )
}

function ReportTerm({ children }: { children: React.ReactNode }) {
  return (
    <Text asChild weight="bold">
      <dt>{children}</dt>
    </Text>
  )
}

function ReportDescription({ children }: { children: React.ReactNode }) {
  return (
    <Text asChild m="0">
      <dd>{children}</dd>
    </Text>
  )
}
