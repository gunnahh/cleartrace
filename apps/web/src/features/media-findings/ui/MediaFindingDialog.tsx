import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { Button, Select, Text, TextArea, TextField, Theme } from '@radix-ui/themes'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, useWatch, type UseFormReturn } from 'react-hook-form'
import { Field } from '../../../components/Field'
import {
  mediaFindingFormSchema,
  mediaFindingLabel,
  type MediaFindingInput,
  type MediaFinding,
} from '../../../entities/media-finding'
import { api, assignmentKeys } from '../../../lib/api'
import type { Assignment } from '../../assignments/model'
import {
  mediaCheckLabel,
  mediaFindingDefaultsForCheck,
  type MediaCheckMatch,
} from '../model/media-checks'

export function MediaFindingDialog({
  assignment,
  mediaChecks,
  onOpenChange,
  onSaved,
  finding,
}: {
  assignment: Assignment
  mediaChecks: MediaCheckMatch[]
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  finding?: MediaFinding | null
}) {
  const queryClient = useQueryClient()
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null)
  const form = useForm<MediaFindingInput>({
    resolver: zodResolver(mediaFindingFormSchema),
    defaultValues: finding
      ? mediaFindingInput(finding)
      : mediaFindingDefaultsForCheck(mediaChecks[0]),
  })
  const mutation = useMutation({
    mutationFn: (input: MediaFindingInput) =>
      finding
        ? api.updateMediaFinding(assignment.id, finding.id, input)
        : api.addMediaFinding(assignment.id, input),
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
      onSaved()
      onOpenChange(false)
    },
  })
  const selectedResearchCheckKey = useWatch({
    control: form.control,
    name: 'researchCheckKey',
  })
  const selectedCheck = mediaChecks.find((check) => check.key === selectedResearchCheckKey)

  return (
    <Dialog.Root open onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Theme>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content ref={setPortalContainer} className="dialog media-dialog">
            <div className="sectionhead">
              <div>
                <Dialog.Title>{finding ? 'Edit media' : 'Add media'}</Dialog.Title>
                <Dialog.Description>
                  Capture the article, summaries, source, and supporting document.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" aria-label="Close media form">
                  <X />
                </Button>
              </Dialog.Close>
            </div>

            <form onSubmit={form.handleSubmit((input) => mutation.mutate(input))} noValidate>
              {form.formState.submitCount > 0 && !form.formState.isValid && (
                <div className="errorsummary" role="alert">
                  <span>
                    <strong>Review the highlighted fields.</strong>
                    The finding has not been saved yet.
                  </span>
                </div>
              )}

              <fieldset>
                <legend>Linked media check</legend>
                <Controller
                  control={form.control}
                  name="researchCheckKey"
                  render={({ field, fieldState }) => (
                    <Field
                      id="media-check"
                      label="Record-found media search"
                      required
                      error={fieldState.error?.message}
                    >
                      <Select.Root
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          const check = mediaChecks.find((item) => item.key === value)
                          form.setValue(
                            'sentiment',
                            check?.category === 'MEDIA_NEGATIVE' ? 'NEGATIVE' : 'NEUTRAL',
                            { shouldValidate: true },
                          )
                        }}
                      >
                        <Select.Trigger
                          id="media-check"
                          aria-label="Record-found media search"
                          aria-required="true"
                          aria-invalid={fieldState.invalid || undefined}
                          aria-describedby={fieldState.error ? 'media-check-error' : undefined}
                          placeholder="Select a media check"
                        />
                        <Select.Content container={portalContainer ?? undefined}>
                          {mediaChecks.map((check) => (
                            <Select.Item value={check.key} key={check.key}>
                              {mediaCheckLabel(assignment, check)}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Field>
                  )}
                />
              </fieldset>

              <fieldset>
                <legend>Article details</legend>
                <div className="grid2">
                  <div className="case-field-wide">
                    <MediaTextField
                      form={form}
                      name="articleTitle"
                      label="Article title"
                      required
                    />
                  </div>
                  <MediaTextField form={form} name="publisher" label="Publisher" required />
                  <MediaTextField
                    form={form}
                    name="publishedAt"
                    label="Publication date"
                    type="date"
                    required
                  />
                  <Controller
                    control={form.control}
                    name="sentiment"
                    render={({ field, fieldState }) => (
                      <Field
                        id="media-sentiment"
                        label="Sentiment"
                        required
                        error={fieldState.error?.message}
                      >
                        <Select.Root value={field.value} onValueChange={field.onChange}>
                          <Select.Trigger
                            id="media-sentiment"
                            aria-label="Sentiment"
                            aria-required="true"
                            aria-invalid={fieldState.invalid || undefined}
                            aria-describedby={
                              fieldState.error ? 'media-sentiment-error' : undefined
                            }
                          />
                          <Select.Content container={portalContainer ?? undefined}>
                            {(selectedCheck?.category === 'MEDIA_NEGATIVE'
                              ? ['NEGATIVE']
                              : ['POSITIVE', 'NEUTRAL']
                            ).map((sentiment) => (
                              <Select.Item value={sentiment} key={sentiment}>
                                {mediaFindingLabel(sentiment)}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      </Field>
                    )}
                  />
                </div>
              </fieldset>

              <fieldset>
                <legend>Research summaries</legend>
                <div className="grid2">
                  <MediaTextArea
                    form={form}
                    name="summaryOriginal"
                    label="Original-language summary"
                  />
                  <MediaTextArea form={form} name="summaryEnglish" label="English summary" />
                </div>
              </fieldset>

              <fieldset>
                <legend>Source and evidence</legend>
                <div className="grid2">
                  <div className="case-field-wide">
                    <MediaTextField
                      form={form}
                      name="sourceUrl"
                      label="Source URL"
                      type="url"
                      required
                    />
                  </div>
                  <div className="case-field-wide">
                    <Field
                      id="media-supporting-document"
                      label="Supporting screenshot or document"
                      required
                      error={form.formState.errors.supportingDocument?.message}
                      hint="PNG, JPG, or PDF"
                    >
                      <input
                        id="media-supporting-document"
                        className="file"
                        type="file"
                        accept="image/png,image/jpeg,.pdf"
                        aria-required="true"
                        aria-invalid={form.formState.errors.supportingDocument ? true : undefined}
                        aria-describedby={`media-supporting-document-hint${
                          form.formState.errors.supportingDocument
                            ? ' media-supporting-document-error'
                            : ''
                        }`}
                        onChange={(event) =>
                          form.setValue('supportingDocument', event.target.files?.[0]?.name ?? '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              </fieldset>

              {mutation.isError && (
                <Text color="red" role="alert">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : 'The media finding could not be saved.'}
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
                    ? 'Saving finding…'
                    : finding
                      ? 'Update media finding'
                      : 'Save media finding'}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Theme>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function mediaFindingInput(finding: MediaFinding): MediaFindingInput {
  return {
    researchCheckKey: finding.researchCheckKey,
    articleTitle: finding.articleTitle,
    publisher: finding.publisher,
    publishedAt: finding.publishedAt,
    sentiment: finding.sentiment,
    summaryOriginal: finding.summaryOriginal,
    summaryEnglish: finding.summaryEnglish,
    sourceUrl: finding.sourceUrl,
    supportingDocument: finding.supportingDocument,
  }
}

type MediaTextName = 'articleTitle' | 'publisher' | 'publishedAt' | 'sourceUrl'

function MediaTextField({
  form,
  name,
  label,
  type = 'text',
  required = false,
}: {
  form: UseFormReturn<MediaFindingInput>
  name: MediaTextName
  label: string
  type?: 'text' | 'date' | 'url'
  required?: boolean
}) {
  const id = `media-${name}`
  const error = form.formState.errors[name]?.message
  return (
    <Field id={id} label={label} required={required} error={error}>
      <TextField.Root
        type={type}
        id={id}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...form.register(name)}
      />
    </Field>
  )
}

function MediaTextArea({
  form,
  name,
  label,
}: {
  form: UseFormReturn<MediaFindingInput>
  name: 'summaryOriginal' | 'summaryEnglish'
  label: string
}) {
  const id = `media-${name}`
  const error = form.formState.errors[name]?.message
  return (
    <Field id={id} label={label} required error={error}>
      <TextArea
        rows={5}
        id={id}
        aria-required="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...form.register(name)}
      />
    </Field>
  )
}
