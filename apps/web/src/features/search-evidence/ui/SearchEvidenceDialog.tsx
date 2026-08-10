import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { Button, Select, Text, TextArea, TextField, Theme } from '@radix-ui/themes'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, useWatch, type UseFormReturn } from 'react-hook-form'
import { Field } from '../../../components/Field'
import {
  createSearchEvidenceDefaults,
  searchCategoryLabel,
  searchEvidenceSchema,
  type SearchAttempt,
  type SearchCategory,
  type SearchEvidenceInput,
  type SearchEvidencePreset,
} from '../../../entities/search-attempt'
import { api, assignmentKeys } from '../../../lib/api'
import type { Assignment } from '../../assignments/model'

export function SearchEvidenceDialog({
  assignment,
  preset,
  onOpenChange,
  onSaved,
  attempt,
}: {
  assignment: Assignment
  preset: SearchEvidencePreset
  onOpenChange: (open: boolean) => void
  onSaved?: (attempt: SearchAttempt) => void
  attempt?: SearchAttempt | null
}) {
  const queryClient = useQueryClient()
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null)
  const availableCategories = assignment.categories
  const defaultCategory = availableCategories.includes(preset.category as SearchCategory)
    ? preset.category
    : availableCategories[0]
  const form = useForm<SearchEvidenceInput>({
    resolver: zodResolver(searchEvidenceSchema),
    defaultValues: attempt
      ? searchAttemptInput(attempt)
      : createSearchEvidenceDefaults({
          ...preset,
          targetId: preset.targetId ?? assignment.targets[0]?.id ?? '',
          category: defaultCategory ?? 'LITIGATION',
        }),
  })
  const mutation = useMutation({
    mutationFn: (input: SearchEvidenceInput) =>
      attempt
        ? api.updateSearchEvidence(assignment.id, attempt.id, input)
        : api.addSearchEvidence(assignment.id, input),
    onSuccess: async (attempt) => {
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
      onSaved?.(attempt)
      onOpenChange(false)
    },
  })
  const result = useWatch({ control: form.control, name: 'result' })

  return (
    <Dialog.Root open onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Theme>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content ref={setPortalContainer} className="dialog evidence-dialog">
            <div className="sectionhead">
              <div>
                <Dialog.Title>
                  {attempt ? 'Edit search evidence' : 'Add search evidence'}
                </Dialog.Title>
                <Dialog.Description>
                  Record the exact query, result, and supporting proof.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" aria-label="Close evidence form">
                  <X />
                </Button>
              </Dialog.Close>
            </div>

            <form onSubmit={form.handleSubmit((input) => mutation.mutate(input))} noValidate>
              {form.formState.submitCount > 0 && !form.formState.isValid && (
                <div className="errorsummary" role="alert">
                  <span>
                    <strong>Review the highlighted fields.</strong>
                    The evidence has not been saved yet.
                  </span>
                </div>
              )}

              <div className="grid2">
                <EvidenceSelectField
                  form={form}
                  name="targetId"
                  label="Checked party"
                  portalContainer={portalContainer}
                  options={assignment.targets.map((target) => ({
                    value: target.id,
                    label: target.nameThai
                      ? `${target.nameEnglish} · ${target.nameThai}`
                      : target.nameEnglish,
                  }))}
                />
                <EvidenceSelectField
                  form={form}
                  name="category"
                  label="Check category"
                  portalContainer={portalContainer}
                  options={availableCategories.map((category) => ({
                    value: category,
                    label: searchCategoryLabel(category),
                  }))}
                />
                <Field
                  id="evidence-source-name"
                  label="Search source"
                  required
                  error={form.formState.errors.sourceName?.message}
                >
                  <TextField.Root
                    {...fieldA11y(
                      'evidence-source-name',
                      form.formState.errors.sourceName?.message,
                      true,
                    )}
                    {...form.register('sourceName')}
                  />
                </Field>
                <EvidenceSelectField
                  form={form}
                  name="searchLanguage"
                  label="Search language"
                  portalContainer={portalContainer}
                  options={[
                    { value: 'EN', label: 'English' },
                    { value: 'TH', label: 'Thai' },
                    { value: 'OTHER', label: 'Other' },
                  ]}
                />
                <Field
                  id="evidence-search-query"
                  label="Search query"
                  required
                  error={form.formState.errors.searchQuery?.message}
                >
                  <TextField.Root
                    {...fieldA11y(
                      'evidence-search-query',
                      form.formState.errors.searchQuery?.message,
                      true,
                    )}
                    {...form.register('searchQuery')}
                  />
                </Field>
                <Field
                  id="evidence-searched-at"
                  label="Search date"
                  required
                  error={form.formState.errors.searchedAt?.message}
                >
                  <TextField.Root
                    type="date"
                    {...fieldA11y(
                      'evidence-searched-at',
                      form.formState.errors.searchedAt?.message,
                      true,
                    )}
                    {...form.register('searchedAt')}
                  />
                </Field>
                <EvidenceSelectField
                  form={form}
                  name="result"
                  label="Result"
                  portalContainer={portalContainer}
                  options={[
                    { value: 'NO_RESULT', label: 'No result found' },
                    { value: 'RECORD_FOUND', label: 'Record found' },
                    { value: 'SOURCE_UNAVAILABLE', label: 'Source unavailable' },
                  ]}
                />
                <span aria-hidden="true" />
                {result === 'RECORD_FOUND' && (
                  <div className="case-field-wide">
                    <Field
                      id="evidence-source-url"
                      label="Source URL"
                      required
                      error={form.formState.errors.sourceUrl?.message}
                    >
                      <TextField.Root
                        type="url"
                        placeholder="https://…"
                        {...fieldA11y(
                          'evidence-source-url',
                          form.formState.errors.sourceUrl?.message,
                          true,
                        )}
                        {...form.register('sourceUrl')}
                      />
                    </Field>
                  </div>
                )}
                {result === 'NO_RESULT' && (
                  <div className="case-field-wide">
                    <Field
                      id="evidence-result-page-url"
                      label="Result-page URL"
                      required
                      error={form.formState.errors.resultPageUrl?.message}
                    >
                      <TextField.Root
                        type="url"
                        placeholder="https://…"
                        {...fieldA11y(
                          'evidence-result-page-url',
                          form.formState.errors.resultPageUrl?.message,
                          true,
                        )}
                        {...form.register('resultPageUrl')}
                      />
                    </Field>
                  </div>
                )}
                {result === 'SOURCE_UNAVAILABLE' && (
                  <div className="case-field-wide">
                    <Field
                      id="evidence-unavailable-reason"
                      label="Reason source is unavailable"
                      required
                      error={form.formState.errors.reason?.message}
                    >
                      <TextArea
                        rows={3}
                        {...fieldA11y(
                          'evidence-unavailable-reason',
                          form.formState.errors.reason?.message,
                          true,
                        )}
                        {...form.register('reason')}
                      />
                    </Field>
                  </div>
                )}
                <div className="case-field-wide">
                  <Field
                    id="evidence-files"
                    label="Screenshots or source documents"
                    required
                    error={form.formState.errors.evidence?.message as string | undefined}
                    hint="One or more PNG, JPG, or PDF files"
                  >
                    <input
                      id="evidence-files"
                      className="file"
                      type="file"
                      accept="image/png,image/jpeg,.pdf"
                      multiple
                      aria-required="true"
                      aria-invalid={form.formState.errors.evidence ? true : undefined}
                      aria-describedby={`evidence-files-hint${form.formState.errors.evidence ? ' evidence-files-error' : ''}`}
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? [])
                        form.setValue(
                          'evidence',
                          files.map((file) => file.name),
                          { shouldDirty: true, shouldValidate: true },
                        )
                        void createImagePreviews(files).then((evidencePreviews) =>
                          form.setValue('evidencePreviews', evidencePreviews, {
                            shouldDirty: true,
                          }),
                        )
                      }}
                    />
                  </Field>
                </div>
                <Field
                  id="evidence-notes-original"
                  label="Notes in original language"
                  error={form.formState.errors.notesOriginal?.message}
                >
                  <TextArea
                    rows={4}
                    {...fieldA11y(
                      'evidence-notes-original',
                      form.formState.errors.notesOriginal?.message,
                    )}
                    {...form.register('notesOriginal')}
                  />
                </Field>
                <Field
                  id="evidence-translation-english"
                  label="English translation"
                  error={form.formState.errors.translationEnglish?.message}
                >
                  <TextArea
                    rows={4}
                    {...fieldA11y(
                      'evidence-translation-english',
                      form.formState.errors.translationEnglish?.message,
                    )}
                    {...form.register('translationEnglish')}
                  />
                </Field>
              </div>

              {mutation.isError && (
                <Text color="red" role="alert">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : 'The evidence could not be saved.'}
                </Text>
              )}

              <div className="formactions">
                <Dialog.Close asChild>
                  <Button type="button" variant="soft">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending
                    ? 'Saving evidence…'
                    : attempt
                      ? 'Update evidence'
                      : 'Save evidence'}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Theme>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function searchAttemptInput(attempt: SearchAttempt): SearchEvidenceInput {
  return {
    targetId: attempt.targetId,
    category: attempt.category,
    sourceName: attempt.sourceName,
    sourceUrl: attempt.sourceUrl,
    resultPageUrl: attempt.resultPageUrl,
    searchQuery: attempt.searchQuery,
    searchLanguage: attempt.searchLanguage,
    searchedAt: attempt.searchedAt,
    result: attempt.result,
    reason: attempt.reason,
    evidence: attempt.evidence,
    evidencePreviews: attempt.evidencePreviews ?? [],
    notesOriginal: attempt.notesOriginal,
    translationEnglish: attempt.translationEnglish,
  }
}

function createImagePreviews(files: File[]) {
  return Promise.all(
    files
      .filter((file) => file.type === 'image/png' || file.type === 'image/jpeg')
      .map(async (file) => ({ name: file.name, dataUrl: await readFileAsDataUrl(file) })),
  )
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not preview image'))
    reader.readAsDataURL(file)
  })
}

type SelectName = 'targetId' | 'category' | 'searchLanguage' | 'result'

function EvidenceSelectField({
  form,
  name,
  label,
  options,
  portalContainer,
}: {
  form: UseFormReturn<SearchEvidenceInput>
  name: SelectName
  label: string
  options: { value: string; label: string }[]
  portalContainer: HTMLDivElement | null
}) {
  const id = `evidence-${name}`
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field id={id} label={label} required error={fieldState.error?.message}>
          <Select.Root value={field.value} onValueChange={field.onChange}>
            <Select.Trigger
              id={id}
              aria-label={label}
              aria-required="true"
              aria-invalid={fieldState.invalid || undefined}
              aria-describedby={fieldState.error ? `${id}-error` : undefined}
            />
            <Select.Content container={portalContainer ?? undefined}>
              {options.map((option) => (
                <Select.Item value={option.value} key={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Field>
      )}
    />
  )
}

function fieldA11y(id: string, error?: string, required = false) {
  return {
    id,
    'aria-required': required || undefined,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  }
}
