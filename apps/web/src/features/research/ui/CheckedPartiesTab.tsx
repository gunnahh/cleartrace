import { Badge, Button, Card, Heading, Progress, Text } from '@radix-ui/themes'
import { Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import { Building2, Check, FileSearch, Plus, UserRound, UsersRound } from 'lucide-react'
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
    <Card className="panel research-panel checked-parties-panel">
      <div className="sectionhead checked-parties-sectionhead">
        <div className="checked-parties-heading">
          <span className="checked-parties-heading__icon" aria-hidden="true">
            <UsersRound size={20} strokeWidth={1.8} />
          </span>
          <div>
            <div className="checked-parties-heading__eyebrow">
              Research coverage
              <span aria-hidden="true">·</span>
              {assignment.targets.length} {assignment.targets.length === 1 ? 'party' : 'parties'}
            </div>
            <Heading as="h2" className="checked-parties-heading__title" size="5">
              Checked parties
            </Heading>
            <Text size="2" color="gray">
              Search coverage for the subject company and every related party.
            </Text>
          </div>
        </div>
        {canEdit && assignment.targets.length > 0 && assignment.categories.length > 0 && (
          <Button
            className="checked-parties-add"
            size="3"
            onClick={() =>
              onAddEvidence({
                targetId: assignment.targets[0]?.id,
                category: assignment.categories[0],
              })
            }
          >
            <Plus size={18} aria-hidden="true" />
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
          const isComplete = required.length > 0 && completed === required.length
          const coveragePercent = required.length
            ? Math.round((completed / required.length) * 100)
            : 0
          const TargetIcon =
            target.targetType === 'SUBJECT_COMPANY' ||
            target.targetType === 'ULTIMATE_PARENT' ||
            target.targetType === 'SUBSIDIARY'
              ? Building2
              : UserRound

          return (
            <article
              className={`party-card${isComplete ? ' party-card--complete' : ''}`}
              key={target.id}
            >
              <header>
                <div className="party-card__identity">
                  <span className="party-card__avatar" aria-hidden="true">
                    <TargetIcon size={19} strokeWidth={1.8} />
                  </span>
                  <div>
                    <Badge className="party-card__type" variant="soft">
                      {target.targetType.replaceAll('_', ' ')}
                    </Badge>
                    <Heading as="h3" className="party-card__name" size="4">
                      {target.nameEnglish}
                    </Heading>
                    {target.nameThai && (
                      <Text className="party-card__thai" size="2" color="gray">
                        {target.nameThai}
                      </Text>
                    )}
                  </div>
                </div>
                <div className="party-card__coverage">
                  <Badge color={isComplete ? 'green' : 'gray'} variant="soft">
                    {isComplete && <Check size={12} aria-hidden="true" />}
                    {completed} of {required.length} required
                  </Badge>
                  <Progress
                    className="party-card__coverage-bar"
                    size="1"
                    color={isComplete ? 'green' : 'iris'}
                    value={coveragePercent}
                    aria-label={`Search coverage for ${target.nameEnglish}`}
                    aria-valuetext={`${completed} of ${required.length} required searches completed`}
                  />
                </div>
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
                      <div className="party-evidence__details">
                        <span className="party-evidence__icon" aria-hidden="true">
                          <FileSearch size={16} strokeWidth={1.8} />
                        </span>
                        <span>
                          <strong>{attempt.sourceName}</strong>
                          <small>
                            {attempt.category.replaceAll('_', ' ')} · {attempt.searchLanguage} ·{' '}
                            {attempt.searchedAt}
                          </small>
                        </span>
                      </div>
                      {canEdit && (
                        <span className="record-actions">
                          <Button
                            className="party-evidence__action"
                            size="1"
                            variant="soft"
                            aria-label={`Edit ${attempt.sourceName} evidence for ${target.nameEnglish}`}
                            title="Edit"
                            onClick={() => onEditEvidence?.(attempt)}
                          >
                            <Pencil1Icon />
                          </Button>
                          <Button
                            className="party-evidence__action"
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
              )}
              {canEdit && assignment.categories.length > 0 && (
                <Button
                  className="party-card__add"
                  size="1"
                  variant="soft"
                  aria-label={`Add evidence for ${target.nameEnglish}`}
                  onClick={() =>
                    onAddEvidence({
                      targetId: target.id,
                      category: assignment.categories[0],
                    })
                  }
                >
                  <Plus size={15} aria-hidden="true" />
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
