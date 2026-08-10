import { Badge, Button, Heading, Text } from '@radix-ui/themes'
import { Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import { ExternalLink, FileText } from 'lucide-react'
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
  return (
    <section>
      <div className="media-section-heading">
        <Heading size="4">{title}</Heading>
        <Badge color={negative ? 'red' : 'gray'}>{findings.length} findings</Badge>
      </div>
      {findings.length === 0 ? (
        <Text color="gray">No findings recorded yet.</Text>
      ) : (
        <div className="media-list">
          {findings.map((finding) => {
            const target = assignment.targets.find((item) => item.id === finding.targetId)
            return (
              <article
                className={`media-card${negative ? ' media-card-negative' : ''}`}
                key={finding.id}
              >
                <header>
                  <div>
                    <Badge
                      color={negative ? 'red' : finding.sentiment === 'POSITIVE' ? 'green' : 'gray'}
                    >
                      {mediaFindingLabel(finding.sentiment)}
                    </Badge>
                    <Heading size="4">{finding.articleTitle || 'Untitled legacy finding'}</Heading>
                  </div>
                  <Text size="2" color="gray">
                    {finding.publishedAt || 'Date not recorded'}
                  </Text>
                </header>
                {canEdit && (
                  <div className="record-actions">
                    <Button
                      size="1"
                      variant="soft"
                      aria-label="Edit media finding"
                      title="Edit"
                      onClick={() => onEdit?.(finding)}
                    >
                      <Pencil1Icon />
                    </Button>
                    <Button
                      size="1"
                      variant="soft"
                      color="red"
                      aria-label="Delete media finding"
                      title="Delete"
                      onClick={() => onDelete?.(finding)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                )}
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
