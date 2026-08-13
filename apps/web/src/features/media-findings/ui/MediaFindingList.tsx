import { Badge, Button, Heading, Text } from '@radix-ui/themes'
import { Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import {
  CalendarDays,
  ExternalLink,
  FileText,
  Newspaper,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { isHttpUrl } from '../../../entities/legal-case'
import { mediaFindingLabel, type MediaFinding } from '../../../entities/media-finding'
import type { Assignment } from '../../assignments/model'

export function MediaFindingList({
  title,
  findings,
  assignment,
  negative = false,
  canEdit = false,
  onEdit,
  onDelete,
}: {
  title: string
  findings: MediaFinding[]
  assignment: Assignment
  negative?: boolean
  canEdit?: boolean
  onEdit?: (finding: MediaFinding) => void
  onDelete?: (finding: MediaFinding) => void
}) {
  const SectionIcon = negative ? ShieldAlert : Sparkles
  return (
    <section className={`media-section${negative ? ' media-section--negative' : ''}`}>
      <div className="media-section-heading">
        <div className="media-section-heading__identity">
          <span className="media-section-heading__icon" aria-hidden="true">
            <SectionIcon size={17} strokeWidth={1.8} />
          </span>
          <Heading as="h3" size="4">
            {title}
          </Heading>
        </div>
        <Badge
          className="media-section-heading__count"
          color={negative ? 'red' : 'gray'}
          variant="soft"
        >
          {findings.length} {findings.length === 1 ? 'result' : 'results'}
        </Badge>
      </div>
      {findings.length === 0 ? (
        <div className="media-section__empty">
          <Newspaper size={17} aria-hidden="true" />
          <Text size="2" color="gray">
            No findings recorded yet.
          </Text>
        </div>
      ) : (
        <div className="media-list">
          {findings.map((finding) => {
            const target = assignment.targets.find((item) => item.id === finding.targetId)
            return (
              <article
                className={`media-card media-card--${finding.sentiment.toLowerCase()}${negative ? ' media-card-negative' : ''}`}
                key={finding.id}
              >
                <header>
                  <div className="media-card__headline">
                    <Badge
                      className="media-card__sentiment"
                      color={negative ? 'red' : finding.sentiment === 'POSITIVE' ? 'green' : 'gray'}
                      variant="soft"
                    >
                      {mediaFindingLabel(finding.sentiment)}
                    </Badge>
                    <Heading as="h4" size="5">
                      {finding.articleTitle || 'Untitled legacy finding'}
                    </Heading>
                  </div>
                  <div className="media-card__header-meta">
                    <span className="media-card__date">
                      <CalendarDays size={14} aria-hidden="true" />
                      <Text size="2" color="gray">
                        {finding.publishedAt || 'Date not recorded'}
                      </Text>
                    </span>
                    {canEdit && (
                      <div className="record-actions">
                        <Button
                          className="media-card__action"
                          size="1"
                          variant="soft"
                          aria-label={`Edit media finding ${finding.articleTitle || 'Untitled legacy finding'}`}
                          title="Edit"
                          onClick={() => onEdit?.(finding)}
                        >
                          <Pencil1Icon />
                        </Button>
                        <Button
                          className="media-card__action"
                          size="1"
                          variant="soft"
                          color="red"
                          aria-label={`Delete media finding ${finding.articleTitle || 'Untitled legacy finding'}`}
                          title="Delete"
                          onClick={() => onDelete?.(finding)}
                        >
                          <TrashIcon />
                        </Button>
                      </div>
                    )}
                  </div>
                </header>
                <dl className="media-summary">
                  <div>
                    <dt>Checked party</dt>
                    <dd>
                      {target?.nameEnglish || 'Not linked'}
                      {target?.nameThai && <small>{target.nameThai}</small>}
                    </dd>
                  </div>
                  <div>
                    <dt>Publisher</dt>
                    <dd>{finding.publisher || 'Not recorded'}</dd>
                  </div>
                </dl>
                <div className="media-copy-grid">
                  <div className="media-copy">
                    <Text size="1" weight="bold" color="gray">
                      Original-language summary
                    </Text>
                    <Text size="2">{finding.summaryOriginal || 'Not recorded'}</Text>
                  </div>
                  <div className="media-copy">
                    <Text size="1" weight="bold" color="gray">
                      English summary
                    </Text>
                    <Text size="2">{finding.summaryEnglish || 'Not recorded'}</Text>
                  </div>
                </div>
                <footer>
                  <span>
                    <FileText aria-hidden="true" />
                    {finding.supportingDocument || 'No document recorded'}
                  </span>
                  {isHttpUrl(finding.sourceUrl) && (
                    <a href={finding.sourceUrl} target="_blank" rel="noreferrer">
                      View source <ExternalLink aria-hidden="true" />
                    </a>
                  )}
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
