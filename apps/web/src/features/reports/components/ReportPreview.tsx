import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Badge, Button, Card, Heading, Spinner, Text } from '@radix-ui/themes'
import {
  ArrowLeft,
  ArrowUp,
  CircleCheck,
  ExternalLink,
  FileSearch,
  FileText,
  Gavel,
  Newspaper,
  Paperclip,
  Printer,
  Scale,
  Search,
  Send,
  ShieldCheck,
  TriangleAlert,
  UsersRound,
} from 'lucide-react'
import { isHttpUrl, legalCaseLabel } from '../../../entities/legal-case'
import { mediaFindingLabel, type MediaFinding } from '../../../entities/media-finding'
import { api, assignmentKeys } from '../../../lib/api'
import {
  assignmentStatusColor,
  formatAssignmentStatus,
  submissionIssues,
} from '../../assignments/model'

export function ReportPreview({ assignmentId }: { assignmentId: string }) {
  const [scrollTopVisible, setScrollTopVisible] = useState(false)
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
  useEffect(() => {
    const updateVisibility = () => {
      setScrollTopVisible(window.scrollY > 560)
    }

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    return () => window.removeEventListener('scroll', updateVisibility)
  }, [])

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  if (q.isPending)
    return (
      <div className="state report-state" role="status">
        <Spinner />
        Generating report preview…
      </div>
    )
  if (q.isError)
    return (
      <div className="state error report-state" role="alert">
        Report could not be generated.
      </div>
    )
  const a = q.data,
    issues = submissionIssues(a)
  return (
    <div className="page reportpage">
      <header className="report-toolbar">
        <Button className="report-toolbar__back" asChild variant="ghost">
          <Link to="/assignments/$assignmentId" params={{ assignmentId }}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to research
          </Link>
        </Button>
        <div className="report-toolbar__context">
          <Badge
            className="report-toolbar__status"
            color={assignmentStatusColor(a.status)}
            variant="soft"
          >
            <span className="report-toolbar__status-dot" aria-hidden="true" />
            {a.status === 'SUBMITTED' ? 'Submitted report' : 'Report preview'}
          </Badge>
          <Button
            className="report-toolbar__print"
            variant="soft"
            aria-label="Print or save report as PDF"
            title="Print / Save PDF"
            onClick={() => window.print()}
          >
            <Printer size={17} aria-hidden="true" />
            <span>Print / PDF</span>
          </Button>
          <Button
            className="report-toolbar__submit"
            disabled={a.status === 'SUBMITTED' || !!issues.length || submit.isPending}
            aria-busy={submit.isPending}
            onClick={() => submit.mutate()}
          >
            {a.status === 'SUBMITTED' ? (
              <>
                <CircleCheck size={17} aria-hidden="true" />
                Submitted
              </>
            ) : submit.isPending ? (
              <>
                <Spinner />
                Submitting…
              </>
            ) : (
              <>
                <Send size={17} aria-hidden="true" />
                Submit report
              </>
            )}
          </Button>
        </div>
      </header>
      {issues.length > 0 && (
        <Card className="completion report-readiness" role="alert">
          <span className="report-readiness__icon" aria-hidden="true">
            <TriangleAlert size={20} />
          </span>
          <div className="report-readiness__content">
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
      {submit.isError && (
        <Card className="report-submit-error" role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          Report submission failed. Please try again.
        </Card>
      )}
      <div className="report-shell">
        <article className="report report-document" aria-labelledby="report-title">
          <header className="report-cover">
            <div className="report-cover__topline">
              <div className="report-cover__eyebrow">
                <FileText size={15} aria-hidden="true" />
                ClearTrace · Due diligence research report
              </div>
              <Badge
                className="report-cover__status"
                color={assignmentStatusColor(a.status)}
                variant="soft"
              >
                {a.status === 'SUBMITTED' ? 'Final report' : formatAssignmentStatus(a.status)}
              </Badge>
            </div>
            <Heading id="report-title" className="report-cover__title" as="h1" size="8">
              {a.nameEnglish}
            </Heading>
            <Text className="report-cover__thai" as="p" size="3" lang="th">
              {a.nameThai}
            </Text>
            <dl className="report-cover__meta">
              <div>
                <dt>Assignment</dt>
                <dd>{a.referenceId}</dd>
              </div>
              <div>
                <dt>Research period</dt>
                <dd>
                  {a.researchFrom} – {a.researchTo}
                </dd>
              </div>
            </dl>
            <div className="report-cover__metrics" aria-label="Report summary">
              <ReportMetric
                icon={<UsersRound />}
                label="Checked parties"
                value={a.targets.length}
              />
              <ReportMetric icon={<Search />} label="Searches" value={a.attempts.length} />
              <ReportMetric icon={<Scale />} label="Legal cases" value={a.cases.length} />
              <ReportMetric icon={<Newspaper />} label="Media findings" value={a.media.length} />
            </div>
          </header>
          <ReportSection n="01" title="Subject company information">
            <dl className="report-definition-list">
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
                {formatRegisteredCapital(a.registeredCapital)} {a.currency}
              </ReportDescription>
            </dl>
          </ReportSection>
          <ReportSection n="02" title="Checked parties">
            {a.targets.length ? (
              <div className="report-table-scroll">
                <table className="report-table">
                  <caption className="sr-only">Checked parties</caption>
                  <thead>
                    <tr>
                      <th scope="col">Party</th>
                      <th scope="col">Type</th>
                      <th scope="col">Identifier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.targets.map((target) => (
                      <tr key={target.id}>
                        <td className="report-table__party">
                          <strong>{target.nameEnglish}</strong>
                          {target.nameThai && <small lang="th">{target.nameThai}</small>}
                        </td>
                        <td>
                          <Badge color="gray" variant="soft">
                            {target.targetType.replaceAll('_', ' ')}
                          </Badge>
                        </td>
                        <td className="report-table__identifier">
                          {target.identificationNumber || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ReportEmpty icon={<UsersRound />} text="No checked parties recorded." />
            )}
          </ReportSection>
          <ReportSection n="03" title="Legal record matches">
            <ReportSummary
              icon={<Scale />}
              value={a.cases.length}
              label={
                a.cases.length
                  ? 'structured legal cases recorded.'
                  : 'No structured legal cases recorded.'
              }
              tone="legal"
            />
          </ReportSection>
          <ReportSection n="04" title="Detailed legal cases">
            {a.cases.length ? (
              <div className="report-case-list">
                {a.cases.map((legalCase, index) => (
                  <article
                    className="report-record report-case"
                    data-verdict={legalCase.verdictStatus || 'UNKNOWN'}
                    key={legalCase.id || `${legalCase.caseNumber}-${index}`}
                  >
                    <div className="report-record__header">
                      <div className="report-record__identity">
                        <span className="report-record__icon" aria-hidden="true">
                          <Gavel size={18} />
                        </span>
                        <div>
                          <Text className="report-record__eyebrow" as="p" size="1">
                            Court record
                          </Text>
                          <Heading as="h3" size="4">
                            {legalCase.caseNumber}
                          </Heading>
                        </div>
                      </div>
                      <Badge>{legalCaseLabel(legalCase.verdictStatus || 'Unknown')}</Badge>
                    </div>
                    <dl className="report-record__details">
                      <ReportTerm>Checked party</ReportTerm>
                      <ReportDescription>
                        {a.targets.find((target) => target.id === legalCase.targetId)
                          ?.nameEnglish || 'Not linked'}
                      </ReportDescription>
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
                            <a className="report-source-link" href={legalCase.sourceUrl}>
                              View recorded source
                              <ExternalLink size={13} aria-hidden="true" />
                            </a>
                          </ReportDescription>
                        </>
                      )}
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <ReportEmpty icon={<Gavel />} text="No detailed legal cases recorded." />
            )}
          </ReportSection>
          <ReportSection n="05" title="Media match summary">
            <ReportSummary
              icon={<Newspaper />}
              value={a.media.length}
              label="media findings across positive/neutral and negative searches."
              tone="media"
            />
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
            <div className="report-limitation">
              <span className="report-limitation__icon" aria-hidden="true">
                <ShieldCheck size={19} />
              </span>
              <Text className="report-limitation__text">
                Results reflect recorded searches during the stated research period. Absence of a
                match is not a legal conclusion. Source availability and name variations may affect
                coverage.
              </Text>
            </div>
          </ReportSection>
          <ReportSection n="09" title="Appendix: search evidence">
            {a.attempts.length ? (
              <div className="report-appendix">
                {a.attempts.map((attempt) => (
                  <Card className="report-evidence-card" key={attempt.id}>
                    <div className="report-evidence-card__header">
                      <span className="report-evidence-card__icon" aria-hidden="true">
                        <FileSearch size={17} />
                      </span>
                      <div>
                        <span className="report-evidence-card__category">
                          {attempt.category.replaceAll('_', ' ')}
                        </span>
                        <strong>{attempt.sourceName}</strong>
                      </div>
                      <div className="report-evidence-card__badges">
                        <Badge variant="soft">{attempt.searchLanguage}</Badge>
                        <Badge color={attempt.result === 'RECORD_FOUND' ? 'green' : 'gray'}>
                          {attempt.result === 'RECORD_FOUND'
                            ? 'Record found'
                            : attempt.result === 'NO_RESULT'
                              ? 'No result'
                              : attempt.result.replaceAll('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="report-evidence-card__query">
                      <Search size={13} aria-hidden="true" />
                      <span>{attempt.searchQuery}</span>
                    </div>
                    <div className="report-evidence-files">
                      {attempt.evidence.map((fileName) => {
                        const preview = attempt.evidencePreviews?.find(
                          (item) => item.name === fileName,
                        )
                        return preview ? (
                          <figure key={fileName}>
                            <img src={preview.dataUrl} alt={'Search evidence: ' + fileName} />
                            <figcaption>
                              <Paperclip size={11} aria-hidden="true" />
                              {fileName}
                            </figcaption>
                          </figure>
                        ) : (
                          <small className="report-evidence-file" key={fileName}>
                            <Paperclip size={11} aria-hidden="true" />
                            {fileName}
                          </small>
                        )
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <ReportEmpty icon={<FileSearch />} text="No search evidence recorded." />
            )}
          </ReportSection>
        </article>
      </div>
      <Button
        className={'report-scroll-top' + (scrollTopVisible ? ' is-visible' : '')}
        type="button"
        variant="solid"
        aria-label="Go to top"
        aria-hidden={!scrollTopVisible}
        tabIndex={scrollTopVisible ? 0 : -1}
        title="Go to top"
        onClick={scrollToTop}
      >
        <ArrowUp size={20} aria-hidden="true" />
      </Button>
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
  if (!findings.length) return <ReportEmpty icon={<Newspaper />} text="No findings recorded." />

  return (
    <div className="report-media-list">
      {findings.map((finding) => {
        const target = targets.find((item) => item.id === finding.targetId)
        return (
          <article
            className="report-record report-media"
            data-sentiment={finding.sentiment}
            key={finding.id}
          >
            <div className="report-record__header">
              <div className="report-record__identity">
                <span className="report-record__icon" aria-hidden="true">
                  <Newspaper size={18} />
                </span>
                <div>
                  <Text className="report-record__eyebrow" as="p" size="1">
                    Media finding
                  </Text>
                  <Heading as="h3" size="4">
                    {finding.articleTitle || 'Untitled legacy finding'}
                  </Heading>
                </div>
              </div>
              <Badge
                color={
                  finding.sentiment === 'NEGATIVE'
                    ? 'red'
                    : finding.sentiment === 'POSITIVE'
                      ? 'green'
                      : 'gray'
                }
              >
                {mediaFindingLabel(finding.sentiment)}
              </Badge>
            </div>
            <dl className="report-record__details">
              <ReportTerm>Checked party</ReportTerm>
              <ReportDescription>
                {target?.nameEnglish || 'Not linked'}
                {target?.nameThai && (
                  <>
                    {' · '}
                    <span lang="th">{target.nameThai}</span>
                  </>
                )}
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
                    <a className="report-source-link" href={finding.sourceUrl}>
                      View article source
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
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
  const headingId = 'report-section-' + n
  return (
    <section className="report-section" aria-labelledby={headingId}>
      <header className="report-section__header">
        <span className="report-section__number" aria-hidden="true">
          {n}
        </span>
        <div>
          <span className="report-section__eyebrow">Report section</span>
          <Heading id={headingId} as="h2" size="5">
            {title}
          </Heading>
        </div>
      </header>
      <div className="report-section__body">{children}</div>
    </section>
  )
}

function ReportMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div>
      <span className="report-cover__metric-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ReportSummary({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode
  value: number
  label: string
  tone: 'legal' | 'media'
}) {
  return (
    <div className={'report-summary-callout report-summary-callout--' + tone}>
      <span className="report-summary-callout__icon" aria-hidden="true">
        {icon}
      </span>
      <strong>{value}</strong>
      <Text>{label}</Text>
    </div>
  )
}

function ReportEmpty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="report-empty">
      <span className="report-empty__icon" aria-hidden="true">
        {icon}
      </span>
      <Text className="report-empty__text" color="gray">
        {text}
      </Text>
    </div>
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

function formatRegisteredCapital(value: string) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toLocaleString() : value || 'Not recorded'
}
