import { Badge, Button, Card, Heading, Text } from '@radix-ui/themes'
import { Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import { FileSearch, Plus } from 'lucide-react'
import {
  searchCategoryLabel,
  type SearchAttempt,
  type SearchEvidencePreset,
} from '../../../entities/search-attempt'
import type { Assignment } from '../../assignments/model'

const legalCategories = ['LITIGATION', 'BANKRUPTCY'] as const

export function LegalMatchesTab({
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
  const configuredCategories = legalCategories.filter((category) =>
    assignment.categories.includes(category),
  )
  const canEdit = assignment.status !== 'SUBMITTED'

  return (
    <Card className="panel research-panel">
      <div className="sectionhead">
        <div>
          <Heading size="4">Legal matches &amp; evidence</Heading>
          <Text size="2" color="gray">
            Record each court and bankruptcy search with its supporting proof.
          </Text>
        </div>
        {canEdit && configuredCategories.length > 0 && (
          <Button
            onClick={() =>
              onAddEvidence({
                targetId: assignment.targets[0]?.id,
                category: configuredCategories[0],
              })
            }
          >
            <Plus />
            Add legal evidence
          </Button>
        )}
      </div>

      {configuredCategories.length === 0 ? (
        <div className="research-empty">
          <FileSearch aria-hidden="true" />
          <Heading size="4">No legal checks configured</Heading>
          <Text color="gray">
            This assignment does not include litigation or bankruptcy research.
          </Text>
        </div>
      ) : assignment.targets.length === 0 ? (
        <div className="research-empty">
          <FileSearch aria-hidden="true" />
          <Heading size="4">No checked parties</Heading>
          <Text color="gray">Add a checked party before recording search evidence.</Text>
        </div>
      ) : (
        <div className="legal-target-list">
          {assignment.targets.map((target) => (
            <article className="legal-target-card" key={target.id}>
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
              </header>

              <div className="legal-check-grid">
                {configuredCategories.map((category) => {
                  const attempts = assignment.attempts.filter(
                    (attempt) => attempt.targetId === target.id && attempt.category === category,
                  )
                  return (
                    <section className="legal-check" key={category}>
                      <div className="legal-check-heading">
                        <div>
                          <Text size="1" weight="bold" color="gray">
                            {searchCategoryLabel(category)}
                          </Text>
                          <Text size="2">
                            {attempts.filter((attempt) => attempt.result === 'RECORD_FOUND').length}{' '}
                            matches · {attempts.length} searches
                          </Text>
                        </div>
                        {canEdit && (
                          <Button
                            size="1"
                            variant="soft"
                            onClick={() => onAddEvidence({ targetId: target.id, category })}
                          >
                            <Plus />
                            Add evidence
                          </Button>
                        )}
                      </div>

                      {attempts.length ? (
                        <ul className="evidence-list">
                          {attempts.map((attempt) => (
                            <li key={attempt.id}>
                              <span>
                                <strong>{attempt.sourceName}</strong>
                                <small>
                                  {attempt.searchQuery} · {attempt.searchLanguage} ·{' '}
                                  {attempt.searchedAt}
                                </small>
                              </span>
                              <Badge color={attempt.result === 'RECORD_FOUND' ? 'green' : 'gray'}>
                                {attempt.result.replaceAll('_', ' ')}
                              </Badge>
                              <small>{attempt.evidence.join(', ')}</small>
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
                      ) : (
                        <Text size="2" color="gray">
                          No evidence recorded.
                        </Text>
                      )}
                    </section>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  )
}
