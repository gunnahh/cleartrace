import { Badge, Button, Card, Heading, Text } from '@radix-ui/themes'
import { Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import { Plus } from 'lucide-react'
import type { SearchAttempt, SearchEvidencePreset } from '../../../entities/search-attempt'
import { categories, type Assignment } from '../../assignments/model'

export function CheckedPartiesTab({
  assignment,
  onAddEvidence,
  onEditEvidence,
  onDeleteEvidence,
}: {
  assignment: Assignment
  onAddEvidence: (preset: SearchEvidencePreset) => void
  onEditEvidence?: (attempt: SearchAttempt) => void
  onDeleteEvidence?: (attempt: SearchAttempt) => void
}) {
  const canEdit = assignment.status !== 'SUBMITTED'
  return (
    <Card className="panel research-panel">
      <div className="sectionhead">
        <div>
          <Heading size="4">Checked parties</Heading>
          <Text size="2" color="gray">
            Search coverage for the subject company and every related party.
          </Text>
        </div>
        {canEdit && assignment.targets.length > 0 && assignment.categories.length > 0 && (
          <Button
            onClick={() =>
              onAddEvidence({
                targetId: assignment.targets[0]?.id,
                category: assignment.categories[0],
              })
            }
          >
            <Plus />
            Add evidence
          </Button>
        )}
      </div>
      <div className="party-list">
        {assignment.targets.map((target) => {
          const searches = assignment.attempts.filter((attempt) => attempt.targetId === target.id)
          const required = assignment.categories
            .flatMap((category) => [
              target.nameEnglish ? { category, language: 'EN' as const } : null,
              target.nameThai ? { category, language: 'TH' as const } : null,
            ])
            .filter(
              (
                item,
              ): item is {
                category: (typeof categories)[number]
                language: 'EN' | 'TH'
              } => item !== null,
            )
          const completed = required.filter((requirement) =>
            searches.some(
              (attempt) =>
                attempt.category === requirement.category &&
                attempt.searchLanguage === requirement.language,
            ),
          ).length

          return (
            <article className="party-card" key={target.id}>
              <header>
                <div>
                  <Badge variant="soft">{target.targetType.replaceAll('_', ' ')}</Badge>
                  <Heading size="4">{target.nameEnglish}</Heading>
                  {target.nameThai && (
                    <Text size="2" color="gray">
                      {target.nameThai}
                    </Text>
                  )}
                </div>
                <Badge color={completed === required.length ? 'green' : 'gray'}>
                  {completed} of {required.length} required
                </Badge>
              </header>
              <dl>
                {target.identificationNumber && (
                  <div>
                    <dt>ID / registration</dt>
                    <dd>{target.identificationNumber}</dd>
                  </div>
                )}
                {target.ownershipPercentage && (
                  <div>
                    <dt>Ownership</dt>
                    <dd>{target.ownershipPercentage}%</dd>
                  </div>
                )}
                <div>
                  <dt>Searches recorded</dt>
                  <dd>{searches.length}</dd>
                </div>
              </dl>
              {searches.length > 0 && (
                <ul className="evidence-list compact-evidence-list">
                  {searches.map((attempt) => (
                    <li key={attempt.id}>
                      <span>
                        <strong>{attempt.sourceName}</strong>
                        <small>
                          {attempt.category.replaceAll('_', ' ')} · {attempt.searchLanguage} ·{' '}
                          {attempt.searchedAt}
                        </small>
                      </span>
                      {canEdit && (
                        <span className="record-actions">
                          <Button
                            size="1"
                            variant="soft"
                            aria-label="Edit search evidence"
                            title="Edit"
                            onClick={() => onEditEvidence?.(attempt)}
                          >
                            <Pencil1Icon />
                          </Button>
                          <Button
                            size="1"
                            variant="soft"
                            color="red"
                            aria-label="Delete search evidence"
                            title="Delete"
                            onClick={() => onDeleteEvidence?.(attempt)}
                          >
                            <TrashIcon />
                          </Button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canEdit && assignment.categories.length > 0 && (
                <Button
                  size="1"
                  variant="soft"
                  onClick={() =>
                    onAddEvidence({
                      targetId: target.id,
                      category: assignment.categories[0],
                    })
                  }
                >
                  <Plus />
                  Add evidence for this party
                </Button>
              )}
            </article>
          )
        })}
      </div>
    </Card>
  )
}
