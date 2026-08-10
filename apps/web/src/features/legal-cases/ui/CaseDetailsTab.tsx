import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { Badge, Button, Card, Heading, Select, Text, TextArea, TextField } from '@radix-ui/themes'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, FileText, Gavel, Plus, X } from 'lucide-react'
import { Controller, useForm, type UseFormReturn } from 'react-hook-form'
import { Field } from '../../../components/Field'
import {
  courtLevels,
  createResearchCheckKey,
  legalCaseClassifications,
  legalCaseDefaults,
  legalCaseFormSchema,
  legalCaseLabel,
  isHttpUrl,
  legalTargetRoles,
  verdictStatuses,
  type LegalCaseInput,
  type LegalResearchCategory,
} from '../../../entities/legal-case'
import { api, assignmentKeys } from '../../../lib/api'
import type { Assignment, SearchAttempt } from '../../assignments/model'

type LegalCheckMatch = {
  key: string
  targetId: string
  category: LegalResearchCategory
  attempts: SearchAttempt[]
}

export function CaseDetailsTab({
  assignment,
  onAddLegalEvidence,
  onReviewLegalMatches,
}: {
  assignment: Assignment
  onAddLegalEvidence?: () => void
  onReviewLegalMatches: () => void
}) {
  const [open, setOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const queryClient = useQueryClient()
  const legalChecks = getLegalCheckMatches(assignment.attempts)
  const form = useForm<LegalCaseInput>({
    resolver: zodResolver(legalCaseFormSchema),
    defaultValues: { ...legalCaseDefaults, researchCheckKey: legalChecks[0]?.key ?? '' },
  })
  const mutation = useMutation({
    mutationFn: (input: LegalCaseInput) => api.addLegalCase(assignment.id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: assignmentKeys.detail(assignment.id),
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: assignmentKeys.report(assignment.id),
          exact: true,
        }),
      ])
      setOpen(false)
      setAnnouncement('Legal case saved.')
      form.reset({ ...legalCaseDefaults, researchCheckKey: legalChecks[0]?.key ?? '' })
    },
  })

  const openCaseForm = () => {
    mutation.reset()
    setAnnouncement('')
    if (!form.formState.isDirty)
      form.reset({ ...legalCaseDefaults, researchCheckKey: legalChecks[0]?.key ?? '' })
    setOpen(true)
  }

  return (
    <>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
      <Card className="panel case-panel">
        <div className="sectionhead">
          <div>
            <div className="case-heading-row">
              <Heading size="4">Case details</Heading>
              <Badge variant="soft">
                {assignment.cases.length} {assignment.cases.length === 1 ? 'case' : 'cases'}
              </Badge>
            </div>
            <Text size="2" color="gray">
              Structured court records linked to a recorded legal match.
            </Text>
          </div>
          {assignment.status !== 'SUBMITTED' && legalChecks.length > 0 && (
            <div className="actions">
              {onAddLegalEvidence && (
                <Button variant="soft" onClick={onAddLegalEvidence}>
                  <Plus />
                  Add evidence
                </Button>
              )}
              <Button onClick={openCaseForm}>
                <Plus />
                Add legal case
              </Button>
            </div>
          )}
        </div>

        {assignment.cases.length > 0 ? (
          <div className="case-list">
            {assignment.cases.map((legalCase, index) => {
              const target = assignment.targets.find((item) => item.id === legalCase.targetId)
              return (
                <article
                  className="case-card"
                  key={legalCase.id || `${legalCase.caseNumber}-${index}`}
                >
                  <header>
                    <div className="case-title">
                      <span className="case-icon" aria-hidden="true">
                        <FileText />
                      </span>
                      <div>
                        <Text size="1" color="gray">
                          {legalCaseLabel(
                            legalCase.classification || legalCase.category || 'Legal',
                          )}
                        </Text>
                        <Heading size="4">{legalCase.caseNumber}</Heading>
                      </div>
                    </div>
                    <Badge color={legalCase.verdictStatus === 'FINAL' ? 'green' : 'gray'}>
                      {legalCaseLabel(legalCase.verdictStatus || 'Unknown')}
                    </Badge>
                  </header>

                  <dl className="case-summary">
                    <div>
                      <dt>Checked party</dt>
                      <dd>{target?.nameEnglish || 'Not recorded'}</dd>
                    </div>
                    <div>
                      <dt>Target role</dt>
                      <dd>{legalCaseLabel(legalCase.targetRole)}</dd>
                    </div>
                    <div>
                      <dt>Court</dt>
                      <dd>{legalCase.courtName}</dd>
                    </div>
                    <div>
                      <dt>Registered</dt>
                      <dd>{legalCase.registrationDate || 'Not recorded'}</dd>
                    </div>
                  </dl>

                  <div className="case-outcome">
                    <Text size="1" weight="bold" color="gray">
                      Verdict outcome
                    </Text>
                    <Text size="2">{legalCase.verdictOutcome}</Text>
                  </div>

                  <div className="case-documents">
                    <Text size="1" weight="bold" color="gray">
                      Supporting documents
                    </Text>
                    <span>
                      <FileText aria-hidden="true" />
                      {legalCase.originalSourceDocument || 'Original document not recorded'}
                    </span>
                    {legalCase.englishTranslatedDocument && (
                      <span>
                        <FileText aria-hidden="true" />
                        {legalCase.englishTranslatedDocument}
                      </span>
                    )}
                  </div>

                  {isHttpUrl(legalCase.sourceUrl) && (
                    <a href={legalCase.sourceUrl} target="_blank" rel="noreferrer">
                      View recorded source <ExternalLink aria-hidden="true" />
                    </a>
                  )}
                </article>
              )
            })}
          </div>
        ) : legalChecks.length === 0 ? (
          <div className="case-empty">
            <Gavel aria-hidden="true" />
            <Heading size="4">Record a legal match first</Heading>
            <Text color="gray">
              Add record-found evidence for a litigation or bankruptcy check before creating a
              structured case.
            </Text>
            {assignment.status !== 'SUBMITTED' && (
              <div className="case-empty-actions">
                {onAddLegalEvidence && (
                  <Button onClick={onAddLegalEvidence}>
                    <Plus />
                    Add legal evidence
                  </Button>
                )}
                <Button variant="soft" onClick={onReviewLegalMatches}>
                  Review legal matches
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="case-empty">
            <FileText aria-hidden="true" />
            <Heading size="4">No case details recorded</Heading>
            <Text color="gray">
              {legalChecks.length} recorded legal{' '}
              {legalChecks.length === 1 ? 'check is' : 'checks are'} ready to be documented.
            </Text>
            {assignment.status !== 'SUBMITTED' && (
              <Button onClick={openCaseForm}>Add first case</Button>
            )}
          </div>
        )}
      </Card>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="dialog case-dialog">
            <div className="sectionhead">
              <div>
                <Dialog.Title>Add legal case</Dialog.Title>
                <Dialog.Description>
                  Capture the court record in structured fields for reporting and review.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" aria-label="Close legal case form">
                  <X />
                </Button>
              </Dialog.Close>
            </div>

            <form onSubmit={form.handleSubmit((input) => mutation.mutate(input))} noValidate>
              {form.formState.submitCount > 0 && !form.formState.isValid && (
                <div className="errorsummary" role="alert">
                  <span>
                    <strong>Review the highlighted fields.</strong>
                    The case has not been saved yet.
                  </span>
                </div>
              )}
              <fieldset className="case-form-section">
                <legend>Legal check</legend>
                <Controller
                  control={form.control}
                  name="researchCheckKey"
                  render={({ field, fieldState }) => (
                    <div className="field">
                      <span id="legal-case-check-label">
                        Linked research check
                        <em aria-hidden="true"> *</em>
                      </span>
                      <Select.Root value={field.value} onValueChange={field.onChange}>
                        <Select.Trigger
                          id="legal-case-check"
                          aria-labelledby="legal-case-check-label"
                          aria-required="true"
                          aria-invalid={fieldState.invalid || undefined}
                          aria-describedby={`legal-case-check-hint${fieldState.error ? ' legal-case-check-error' : ''}`}
                          placeholder="Select a legal check"
                        />
                        <Select.Content>
                          {legalChecks.map((check) => (
                            <Select.Item value={check.key} key={check.key}>
                              {legalCheckLabel(assignment, check)}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                      <small id="legal-case-check-hint">
                        Only record-found litigation and bankruptcy searches are available.
                      </small>
                      {fieldState.error && (
                        <small className="error" id="legal-case-check-error" role="alert">
                          {fieldState.error.message}
                        </small>
                      )}
                    </div>
                  )}
                />
              </fieldset>

              <fieldset className="case-form-section">
                <legend>Case and court</legend>
                <div className="grid2">
                  <Field
                    id="legal-case-number"
                    label="Case number"
                    required
                    error={form.formState.errors.caseNumber?.message}
                  >
                    <TextField.Root
                      placeholder="e.g. CIV-123/2026"
                      {...fieldA11y(
                        'legal-case-number',
                        form.formState.errors.caseNumber?.message,
                        true,
                      )}
                      {...form.register('caseNumber')}
                    />
                  </Field>
                  <SelectField
                    label="Classification"
                    name="classification"
                    values={legalCaseClassifications}
                    form={form}
                  />
                  <SelectField
                    label="Court level"
                    name="courtLevel"
                    values={courtLevels}
                    form={form}
                  />
                  <Field
                    id="legal-case-court-name"
                    label="Court name"
                    required
                    error={form.formState.errors.courtName?.message}
                  >
                    <TextField.Root
                      {...fieldA11y(
                        'legal-case-court-name',
                        form.formState.errors.courtName?.message,
                        true,
                      )}
                      {...form.register('courtName')}
                    />
                  </Field>
                  <Field
                    id="legal-case-originating-court"
                    label="Originating court"
                    error={form.formState.errors.originatingCourt?.message}
                  >
                    <TextField.Root
                      {...fieldA11y(
                        'legal-case-originating-court',
                        form.formState.errors.originatingCourt?.message,
                      )}
                      {...form.register('originatingCourt')}
                    />
                  </Field>
                  <Field
                    id="legal-case-registration-date"
                    label="Registration date"
                    required
                    error={form.formState.errors.registrationDate?.message}
                  >
                    <TextField.Root
                      type="date"
                      {...fieldA11y(
                        'legal-case-registration-date',
                        form.formState.errors.registrationDate?.message,
                        true,
                      )}
                      {...form.register('registrationDate')}
                    />
                  </Field>
                </div>
              </fieldset>

              <fieldset className="case-form-section">
                <legend>Parties and role</legend>
                <div className="grid2">
                  <SelectField
                    label="Target role"
                    name="targetRole"
                    values={legalTargetRoles}
                    form={form}
                  />
                  <span aria-hidden="true" />
                  <Field
                    id="legal-case-plaintiffs"
                    label="Plaintiffs / appellants"
                    required
                    error={form.formState.errors.plaintiffs?.message}
                    hint="Enter one party per line."
                  >
                    <TextArea
                      rows={4}
                      {...fieldA11y(
                        'legal-case-plaintiffs',
                        form.formState.errors.plaintiffs?.message,
                        true,
                        true,
                      )}
                      {...form.register('plaintiffs')}
                    />
                  </Field>
                  <Field
                    id="legal-case-defendants"
                    label="Defendants / appellees"
                    required
                    error={form.formState.errors.defendants?.message}
                    hint="Enter one party per line."
                  >
                    <TextArea
                      rows={4}
                      {...fieldA11y(
                        'legal-case-defendants',
                        form.formState.errors.defendants?.message,
                        true,
                        true,
                      )}
                      {...form.register('defendants')}
                    />
                  </Field>
                </div>
              </fieldset>

              <fieldset className="case-form-section">
                <legend>Case narrative</legend>
                <div className="grid2">
                  <Field
                    id="legal-case-background"
                    label="Case background"
                    required
                    error={form.formState.errors.caseBackground?.message}
                  >
                    <TextArea
                      rows={5}
                      {...fieldA11y(
                        'legal-case-background',
                        form.formState.errors.caseBackground?.message,
                        true,
                      )}
                      {...form.register('caseBackground')}
                    />
                  </Field>
                  <Field
                    id="legal-case-petition"
                    label="Petition / claim"
                    required
                    error={form.formState.errors.petition?.message}
                  >
                    <TextArea
                      rows={5}
                      {...fieldA11y(
                        'legal-case-petition',
                        form.formState.errors.petition?.message,
                        true,
                      )}
                      {...form.register('petition')}
                    />
                  </Field>
                </div>
              </fieldset>

              <fieldset className="case-form-section">
                <legend>Verdict</legend>
                <div className="grid2">
                  <Field
                    id="legal-case-verdict-date"
                    label="Verdict date"
                    error={form.formState.errors.verdictDate?.message}
                  >
                    <TextField.Root
                      type="date"
                      {...fieldA11y(
                        'legal-case-verdict-date',
                        form.formState.errors.verdictDate?.message,
                      )}
                      {...form.register('verdictDate')}
                    />
                  </Field>
                  <SelectField
                    label="Verdict status"
                    name="verdictStatus"
                    values={verdictStatuses}
                    form={form}
                  />
                  <div className="case-field-wide">
                    <Field
                      id="legal-case-verdict-outcome"
                      label="Verdict outcome"
                      required
                      error={form.formState.errors.verdictOutcome?.message}
                      hint="For pending matters, state that no verdict has been issued."
                    >
                      <TextArea
                        rows={4}
                        {...fieldA11y(
                          'legal-case-verdict-outcome',
                          form.formState.errors.verdictOutcome?.message,
                          true,
                          true,
                        )}
                        {...form.register('verdictOutcome')}
                      />
                    </Field>
                  </div>
                  <div className="case-field-wide">
                    <Field
                      id="legal-case-related-cases"
                      label="Related cases"
                      error={form.formState.errors.relatedCases?.message}
                    >
                      <TextArea
                        rows={3}
                        placeholder="Enter related case numbers, one per line"
                        {...fieldA11y(
                          'legal-case-related-cases',
                          form.formState.errors.relatedCases?.message,
                        )}
                        {...form.register('relatedCases')}
                      />
                    </Field>
                  </div>
                </div>
              </fieldset>

              <fieldset className="case-form-section">
                <legend>Source and documents</legend>
                <div className="grid2">
                  <div className="case-field-wide">
                    <Field
                      id="legal-case-source-url"
                      label="Source URL"
                      required
                      error={form.formState.errors.sourceUrl?.message}
                    >
                      <TextField.Root
                        type="url"
                        {...fieldA11y(
                          'legal-case-source-url',
                          form.formState.errors.sourceUrl?.message,
                          true,
                        )}
                        {...form.register('sourceUrl')}
                      />
                    </Field>
                  </div>
                  <Field
                    id="legal-case-original-document"
                    label="Original source document"
                    required
                    error={form.formState.errors.originalSourceDocument?.message}
                    hint="PNG, JPG, or PDF"
                  >
                    <input
                      {...fieldA11y(
                        'legal-case-original-document',
                        form.formState.errors.originalSourceDocument?.message,
                        true,
                        true,
                      )}
                      className="file"
                      type="file"
                      accept="image/png,image/jpeg,.pdf"
                      onChange={(event) =>
                        form.setValue(
                          'originalSourceDocument',
                          event.target.files?.[0]?.name ?? '',
                          { shouldDirty: true, shouldValidate: true },
                        )
                      }
                    />
                  </Field>
                  <Field
                    id="legal-case-translated-document"
                    label="English translated document"
                    error={form.formState.errors.englishTranslatedDocument?.message}
                    hint="Optional · PNG, JPG, or PDF"
                  >
                    <input
                      {...fieldA11y(
                        'legal-case-translated-document',
                        form.formState.errors.englishTranslatedDocument?.message,
                        false,
                        true,
                      )}
                      className="file"
                      type="file"
                      accept="image/png,image/jpeg,.pdf"
                      onChange={(event) =>
                        form.setValue(
                          'englishTranslatedDocument',
                          event.target.files?.[0]?.name ?? '',
                          { shouldDirty: true },
                        )
                      }
                    />
                  </Field>
                </div>
              </fieldset>

              {mutation.isError && (
                <Text color="red" role="alert">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : 'The legal case could not be saved.'}
                </Text>
              )}

              <div className="formactions">
                <Dialog.Close asChild>
                  <Button type="button" variant="soft">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving case…' : 'Save legal case'}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

type SelectFieldName = 'classification' | 'courtLevel' | 'targetRole' | 'verdictStatus'

function SelectField({
  label,
  name,
  values,
  form,
}: {
  label: string
  name: SelectFieldName
  values: readonly string[]
  form: UseFormReturn<LegalCaseInput>
}) {
  const controlId = `legal-case-${name}`
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="field">
          <span id={`${controlId}-label`}>
            {label}
            <em aria-hidden="true"> *</em>
          </span>
          <Select.Root value={field.value} onValueChange={field.onChange}>
            <Select.Trigger
              id={controlId}
              aria-labelledby={`${controlId}-label`}
              aria-required="true"
              aria-invalid={fieldState.invalid || undefined}
              aria-describedby={fieldState.error ? `${controlId}-error` : undefined}
            />
            <Select.Content>
              {values.map((value) => (
                <Select.Item value={value} key={value}>
                  {legalCaseLabel(value)}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          {fieldState.error && (
            <small className="error" id={`${controlId}-error`} role="alert">
              {fieldState.error.message}
            </small>
          )}
        </div>
      )}
    />
  )
}

function fieldA11y(id: string, error?: string, required = false, hasHint = false) {
  const describedBy = [hasHint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ')
  return {
    id,
    'aria-required': required || undefined,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  }
}

function isLegalMatch(
  attempt: SearchAttempt,
): attempt is SearchAttempt & { category: LegalResearchCategory } {
  return (
    attempt.result === 'RECORD_FOUND' &&
    (attempt.category === 'LITIGATION' || attempt.category === 'BANKRUPTCY')
  )
}

function getLegalCheckMatches(attempts: SearchAttempt[]) {
  const matches = new Map<string, LegalCheckMatch>()
  for (const attempt of attempts.filter(isLegalMatch)) {
    const key = createResearchCheckKey(attempt.targetId, attempt.category)
    const existing = matches.get(key)
    if (existing) existing.attempts.push(attempt)
    else
      matches.set(key, {
        key,
        targetId: attempt.targetId,
        category: attempt.category,
        attempts: [attempt],
      })
  }
  return [...matches.values()]
}

function legalCheckLabel(assignment: Assignment, check: LegalCheckMatch) {
  const target = assignment.targets.find((item) => item.id === check.targetId)
  const languages = [...new Set(check.attempts.map((attempt) => attempt.searchLanguage))].join(', ')
  return `${target?.nameEnglish ?? 'Unknown party'} · ${legalCaseLabel(check.category)} · ${languages}`
}
