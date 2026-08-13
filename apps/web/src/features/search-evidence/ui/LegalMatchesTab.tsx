import { Badge, Button, Card, Heading, Text } from '@radix-ui/themes'
import { Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import {
  Building2,
  FileCheck2,
  FileSearch,
  Gavel,
  Landmark,
  Paperclip,
  Plus,
  Scale,
  UserRound,
} from 'lucide-react'
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
  const legalAttempts = assignment.attempts.filter((attempt) =>
    configuredCategories.some((category) => category === attempt.category),
  )

  return (
    <Card className="panel research-panel legal-matches-panel">
      <div className="sectionhead feature-sectionhead legal-matches-sectionhead">
        <div className="feature-section-heading">
          <span
            className="feature-section-heading__icon legal-matches-heading__icon"
            aria-hidden="true"
          >
            <Scale size={20} strokeWidth={1.8} />
          </span>
          <div>
            <div className="feature-section-heading__eyebrow">
              Legal research
              <span aria-hidden="true">·</span>
              {configuredCategories.length}{' '}
              {configuredCategories.length === 1 ? 'category' : 'categories'}
              <span aria-hidden="true">·</span>
              {legalAttempts.length} {legalAttempts.length === 1 ? 'search' : 'searches'}
            </div>
            <Heading as="h2" className="feature-section-heading__title" size="5">
              Legal matches &amp; evidence
            </Heading>
            <Text size="2" color="gray">
              Record each court and bankruptcy search with its supporting proof.
            </Text>
          </div>
        </div>
        {canEdit && configuredCategories.length > 0 && assignment.targets.length > 0 && (
          <Button
            className="feature-section-action"
            size="3"
            onClick={() =>
              onAddEvidence({
                targetId: assignment.targets[0]?.id,
                category: configuredCategories[0],
              })
            }
          >
            <Plus size={18} aria-hidden="true" />
            Add legal evidence
          </Button>
        )}
      </div>

      {configuredCategories.length === 0 ? (
        <div className="research-empty premium-empty-state">
          <span className="premium-empty-state__icon" aria-hidden="true">
            <FileSearch />
          </span>
          <Text className="premium-empty-state__eyebrow">Legal research</Text>
          <Heading as="h3" size="5">
            No legal checks configured
          </Heading>
          <Text size="2" color="gray">
            This assignment does not include litigation or bankruptcy research.
          </Text>
        </div>
      ) : assignment.targets.length === 0 ? (
        <div className="research-empty premium-empty-state">
          <span className="premium-empty-state__icon" aria-hidden="true">
            <Building2 />
          </span>
          <Text className="premium-empty-state__eyebrow">Legal research</Text>
          <Heading as="h3" size="5">
            No checked parties
          </Heading>
          <Text color="gray">Add a checked party before recording search evidence.</Text>
        </div>
      ) : (
        <div className="legal-target-list">
          {assignment.targets.map((target) => {
            const targetAttempts = legalAttempts.filter((attempt) => attempt.targetId === target.id)
            const targetHasMatches = targetAttempts.some(
              (attempt) => attempt.result === 'RECORD_FOUND',
            )
            const TargetIcon =
              target.targetType === 'SUBJECT_COMPANY' ||
              target.targetType === 'ULTIMATE_PARENT' ||
              target.targetType === 'SUBSIDIARY'
                ? Building2
                : UserRound

            return (
              <article
                className={`legal-target-card${targetHasMatches ? ' legal-target-card--matched' : ''}`}
                key={target.id}
              >
                <header className="legal-target-card__header">
                  <div className="legal-target-card__identity">
                    <span className="legal-target-card__avatar" aria-hidden="true">
                      <TargetIcon size={19} strokeWidth={1.8} />
                    </span>
                    <div>
                      <Badge className="legal-target-card__type" variant="soft">
                        {target.targetType.replaceAll('_', ' ')}
                      </Badge>
                      <Heading as="h3" className="legal-target-card__name" size="4">
                        {target.nameEnglish}
                      </Heading>
                      {target.nameThai && (
                        <Text className="legal-target-card__thai" size="2" color="gray">
                          {target.nameThai}
                        </Text>
                      )}
                    </div>
                  </div>
                  <Badge className="legal-target-card__count" variant="soft" color="gray">
                    <FileCheck2 size={13} aria-hidden="true" />
                    {targetAttempts.length} {targetAttempts.length === 1 ? 'search' : 'searches'}
                  </Badge>
                </header>

                <div className="legal-check-grid">
                  {configuredCategories.map((category) => {
                    const attempts = assignment.attempts.filter(
                      (attempt) => attempt.targetId === target.id && attempt.category === category,
                    )
                    const matches = attempts.filter(
                      (attempt) => attempt.result === 'RECORD_FOUND',
                    ).length
                    const isClear =
                      attempts.length > 0 &&
                      attempts.every((attempt) => attempt.result === 'NO_RESULT')
                    const checkState = matches > 0 ? 'matched' : isClear ? 'clear' : 'pending'
                    const CategoryIcon = category === 'LITIGATION' ? Gavel : Landmark
                    return (
                      <section className={`legal-check legal-check--${checkState}`} key={category}>
                        <div className="legal-check-heading">
                          <div className="legal-check-heading__identity">
                            <span className="legal-check__icon" aria-hidden="true">
                              <CategoryIcon size={17} strokeWidth={1.8} />
                            </span>
                            <div>
                              <Text className="legal-check__eyebrow" size="1" weight="bold">
                                {searchCategoryLabel(category)}
                              </Text>
                              <Text className="legal-check__count" size="2">
                                <strong>{matches}</strong> {matches === 1 ? 'match' : 'matches'}
                                <span aria-hidden="true">·</span>
                                {attempts.length} {attempts.length === 1 ? 'search' : 'searches'}
                              </Text>
                            </div>
                          </div>
                          {canEdit && (
                            <Button
                              className="legal-check__add"
                              size="1"
                              variant="soft"
                              onClick={() => onAddEvidence({ targetId: target.id, category })}
                            >
                              <Plus size={14} aria-hidden="true" />
                              Add evidence
                            </Button>
                          )}
                        </div>

                        {attempts.length ? (
                          <ul className="evidence-list legal-evidence-list">
                            {attempts.map((attempt) => (
                              <li key={attempt.id}>
                                <div className="legal-evidence__details">
                                  <span className="legal-evidence__icon" aria-hidden="true">
                                    <FileSearch size={15} strokeWidth={1.8} />
                                  </span>
                                  <span>
                                    <strong>{attempt.sourceName}</strong>
                                    <small>
                                      {attempt.searchQuery} · {attempt.searchLanguage} ·{' '}
                                      {attempt.searchedAt}
                                    </small>
                                  </span>
                                </div>
                                <Badge
                                  className="legal-evidence__result"
                                  color={
                                    attempt.result === 'RECORD_FOUND'
                                      ? 'amber'
                                      : attempt.result === 'NO_RESULT'
                                        ? 'green'
                                        : 'gray'
                                  }
                                  variant="soft"
                                >
                                  {attempt.result.replaceAll('_', ' ')}
                                </Badge>
                                <small className="legal-evidence__files">
                                  <Paperclip size={13} aria-hidden="true" />
                                  {attempt.evidence.join(', ') || 'No supporting file recorded'}
                                </small>
                                {canEdit && (
                                  <span className="record-actions legal-evidence__actions">
                                    <Button
                                      size="1"
                                      variant="soft"
                                      aria-label={`Edit ${attempt.sourceName} evidence for ${target.nameEnglish}`}
                                      title="Edit"
                                      onClick={() => onEditEvidence?.(attempt)}
                                    >
                                      <Pencil1Icon />
                                    </Button>
                                    <Button
                                      size="1"
                                      variant="soft"
                                      color="red"
                                      aria-label={`Delete ${attempt.sourceName} evidence for ${target.nameEnglish}`}
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
                          <div className="legal-check__empty">
                            <FileSearch size={17} aria-hidden="true" />
                            <Text size="2" color="gray">
                              No evidence recorded.
                            </Text>
                          </div>
                        )}
                      </section>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </Card>
  )
}
