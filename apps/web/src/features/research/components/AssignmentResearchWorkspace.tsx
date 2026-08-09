import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import * as Tabs from '@radix-ui/react-tabs'
import * as Dialog from '@radix-ui/react-dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Badge,
  Button,
  Card,
  Heading,
  Progress,
  Select,
  Spinner,
  Text,
  TextArea,
  TextField,
} from '@radix-ui/themes'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { api, assignmentKeys } from '../../../lib/api'
import { categories, completion, evidenceSchema, type EvidenceInput } from '../../assignments/model'
import { Field } from '../../../components/Field'
import { CaseDetailsTab } from '../../legal-cases'
import type { AssignmentWorkspaceTab } from '../model/assignment-workspace-tab'
const defaults: EvidenceInput = {
  targetId: '',
  category: 'LITIGATION',
  sourceName: '',
  sourceUrl: '',
  resultPageUrl: '',
  searchQuery: '',
  searchLanguage: 'EN',
  searchedAt: new Date().toISOString().slice(0, 10),
  result: 'NO_RESULT',
  reason: '',
  evidence: [],
}
export function AssignmentResearchWorkspace({
  assignmentId,
  activeTab,
  onTabChange,
}: {
  assignmentId: string
  activeTab: AssignmentWorkspaceTab
  onTabChange: (tab: AssignmentWorkspaceTab) => void
}) {
  const q = useQuery({
    queryKey: assignmentKeys.detail(assignmentId),
    queryFn: () => api.get(assignmentId),
  })
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const form = useForm<EvidenceInput>({
    resolver: zodResolver(evidenceSchema),
    defaultValues: defaults,
  })
  const mutation = useMutation({
    mutationFn: (v: EvidenceInput) => api.evidence(assignmentId, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.detail(assignmentId) })
      setOpen(false)
      form.reset(defaults)
    },
  })
  if (q.isPending)
    return (
      <div className="state">
        <Spinner />
        Loading research workspace…
      </div>
    )
  if (q.isError) return <div className="state error">Assignment could not be loaded.</div>
  const a = q.data,
    p = completion(a)
  return (
    <div className="page">
      <Button asChild variant="ghost">
        <Link to="/assignments" search={{ q: '', status: 'ALL' }}>
          <ArrowLeft />
          Assignments
        </Link>
      </Button>
      <div className="pagehead">
        <div>
          <Text size="2" color="gray">
            {a.referenceId}
          </Text>
          <Heading size="7">{a.nameEnglish}</Heading>
          <Text color="gray">{a.nameThai}</Text>
        </div>
        <div className="actions">
          <Badge size="2">{a.status.replaceAll('_', ' ')}</Badge>
          <Button variant="soft">Save draft</Button>
          <Button asChild>
            <Link to="/assignments/$assignmentId/report" params={{ assignmentId }}>
              Preview report
            </Link>
          </Button>
        </div>
      </div>
      <Card className="progresscard">
        <div className="row">
          <strong>Research completion</strong>
          <span>
            {p.complete} of {p.total} required searches · {p.percent}%
          </span>
        </div>
        <Progress value={p.percent} />
        <Text size="2" color="gray">
          Progress counts every required category and available English/Thai name.
        </Text>
      </Card>
      <Tabs.Root
        className="tabs"
        value={activeTab}
        onValueChange={(value) => onTabChange(value as AssignmentWorkspaceTab)}
      >
        <Tabs.List>
          <Tabs.Trigger value="parties">Checked parties</Tabs.Trigger>
          <Tabs.Trigger value="legal">Legal matches</Tabs.Trigger>
          <Tabs.Trigger value="cases">Case details</Tabs.Trigger>
          <Tabs.Trigger value="media">Media news</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="parties">
          <Card className="panel">
            <div className="sectionhead">
              <Heading size="4">Checked parties</Heading>
              <Button onClick={() => setOpen(true)}>
                <Plus />
                Add evidence
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {a.targets
                .filter((t) => t.targetType !== 'SUBJECT_COMPANY')
                .map((t) => {
                  const searches = a.attempts.filter((x) => x.targetId === t.id)
                  const required = a.categories
                    .flatMap((category) => [
                      t.nameEnglish ? { category, language: 'EN' as const } : null,
                      t.nameThai ? { category, language: 'TH' as const } : null,
                    ])
                    .filter(
                      (x): x is { category: (typeof categories)[number]; language: 'EN' | 'TH' } =>
                        x !== null,
                    )
                  const completed = required.filter((r) =>
                    searches.some(
                      (x) => x.category === r.category && x.searchLanguage === r.language,
                    ),
                  ).length
                  return (
                    <Card key={t.id} style={{ padding: '1rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'start',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div>
                          <Badge variant="soft">{t.targetType.replaceAll('_', ' ')}</Badge>
                          <Heading size="4" style={{ margin: '0.5rem 0 0 0' }}>
                            {t.nameEnglish}
                          </Heading>
                          {t.nameThai && (
                            <Text size="2" color="gray">
                              {t.nameThai}
                            </Text>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Badge color={completed === required.length ? 'green' : 'gray'}>
                            {completed} of {required.length} required
                          </Badge>
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '1rem',
                          fontSize: '0.875rem',
                          marginTop: '0.5rem',
                        }}
                      >
                        {t.identificationNumber && (
                          <div>
                            <Text size="1" color="gray">
                              ID / Registration
                            </Text>
                            <Text size="2">{t.identificationNumber}</Text>
                          </div>
                        )}
                        {t.ownershipPercentage && (
                          <div>
                            <Text size="1" color="gray">
                              Ownership
                            </Text>
                            <Text size="2">{t.ownershipPercentage}%</Text>
                          </div>
                        )}
                        <div>
                          <Text size="1" color="gray">
                            Searches recorded
                          </Text>
                          <Text size="2">{searches.length}</Text>
                        </div>
                      </div>
                    </Card>
                  )
                })}
            </div>
          </Card>
        </Tabs.Content>
        <Tabs.Content value="legal">
          <Card className="panel">
            <Heading size="4">Legal matches & evidence</Heading>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}
            >
              {a.targets
                .filter((t) => t.targetType !== 'SUBJECT_COMPANY')
                .map((t) => {
                  const litigation = a.attempts.filter(
                    (x) => x.targetId === t.id && x.category === 'LITIGATION',
                  )
                  const bankruptcy = a.attempts.filter(
                    (x) => x.targetId === t.id && x.category === 'BANKRUPTCY',
                  )
                  const litigationRecords = litigation.filter((x) => x.result === 'RECORD_FOUND')
                  const bankruptcyRecords = bankruptcy.filter((x) => x.result === 'RECORD_FOUND')
                  return (
                    <Card key={t.id} style={{ padding: '1rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'start',
                          marginBottom: '1rem',
                        }}
                      >
                        <div>
                          <Heading size="4">{t.nameEnglish}</Heading>
                          {t.nameThai && (
                            <Text size="2" color="gray">
                              {t.nameThai}
                            </Text>
                          )}
                        </div>
                        <Button
                          variant="soft"
                          onClick={() => {
                            form.setValue('targetId', t.id)
                            form.setValue('category', 'LITIGATION')
                            setOpen(true)
                          }}
                        >
                          <Plus />
                          Add evidence
                        </Button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ borderLeft: '2px solid var(--iris-5)', paddingLeft: '1rem' }}>
                          <Text size="1" weight="bold" color="gray">
                            Litigation
                          </Text>
                          <Text size="3" weight="bold" style={{ marginTop: '0.25rem' }}>
                            {litigationRecords.length}
                          </Text>
                          <Text size="1" color="gray" style={{ marginTop: '0.25rem' }}>
                            {litigation.length} total searches
                          </Text>
                        </div>
                        <div style={{ borderLeft: '2px solid var(--iris-5)', paddingLeft: '1rem' }}>
                          <Text size="1" weight="bold" color="gray">
                            Bankruptcy
                          </Text>
                          <Text size="3" weight="bold" style={{ marginTop: '0.25rem' }}>
                            {bankruptcyRecords.length}
                          </Text>
                          <Text size="1" color="gray" style={{ marginTop: '0.25rem' }}>
                            {bankruptcy.length} total searches
                          </Text>
                        </div>
                      </div>
                    </Card>
                  )
                })}
            </div>
          </Card>
        </Tabs.Content>
        <Tabs.Content value="cases">
          <CaseDetailsTab assignment={a} onReviewLegalMatches={() => onTabChange('legal')} />
        </Tabs.Content>
        <Tabs.Content value="media">
          <Card className="panel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <Heading size="4">Positive & neutral news</Heading>
                <Text size="2" color="gray" style={{ marginBottom: '1rem' }}>
                  {a.media.filter((m) => m.sentiment !== 'NEGATIVE').length} findings
                </Text>
                {a.media.filter((m) => m.sentiment !== 'NEGATIVE').length === 0 ? (
                  <Text color="gray">No positive or neutral findings recorded yet.</Text>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {a.media
                      .filter((m) => m.sentiment !== 'NEGATIVE')
                      .map((m, i) => (
                        <Card key={i} style={{ padding: '1rem' }}>
                          <Heading size="4">{m.title}</Heading>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '1rem',
                              marginTop: '0.5rem',
                              fontSize: '0.875rem',
                            }}
                          >
                            <div>
                              <Text size="1" color="gray">
                                Publisher
                              </Text>
                              <Text size="2">{m.publisher}</Text>
                            </div>
                            <div>
                              <Text size="1" color="gray">
                                Publication date
                              </Text>
                              <Text size="2">{m.publisher}</Text>
                            </div>
                          </div>
                          <div style={{ marginTop: '0.5rem' }}>
                            <Text size="1" color="gray">
                              Summary
                            </Text>
                            <Text size="2" style={{ marginTop: '0.25rem' }}>
                              {m.summaryEnglish}
                            </Text>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
              <div>
                <Heading size="4">Negative news</Heading>
                <Text size="2" color="gray" style={{ marginBottom: '1rem' }}>
                  {a.media.filter((m) => m.sentiment === 'NEGATIVE').length} findings
                </Text>
                {a.media.filter((m) => m.sentiment === 'NEGATIVE').length === 0 ? (
                  <Text color="gray">No negative findings recorded yet.</Text>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {a.media
                      .filter((m) => m.sentiment === 'NEGATIVE')
                      .map((m, i) => (
                        <Card
                          key={i}
                          style={{
                            padding: '1rem',
                            borderLeftColor: '#fc5757',
                            borderLeftWidth: '3px',
                          }}
                        >
                          <Heading size="4">{m.title}</Heading>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '1rem',
                              marginTop: '0.5rem',
                              fontSize: '0.875rem',
                            }}
                          >
                            <div>
                              <Text size="1" color="gray">
                                Publisher
                              </Text>
                              <Text size="2">{m.publisher}</Text>
                            </div>
                            <div>
                              <Text size="1" color="gray">
                                Publication date
                              </Text>
                              <Text size="2">{m.publisher}</Text>
                            </div>
                          </div>
                          <div style={{ marginTop: '0.5rem' }}>
                            <Text size="1" color="gray">
                              Summary
                            </Text>
                            <Text size="2" style={{ marginTop: '0.25rem' }}>
                              {m.summaryEnglish}
                            </Text>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="dialog">
            <div className="sectionhead">
              <div>
                <Dialog.Title>Add search evidence</Dialog.Title>
                <Dialog.Description>
                  Record the exact query and attach proof of the result.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" aria-label="Close">
                  <X />
                </Button>
              </Dialog.Close>
            </div>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
              <div className="grid2">
                <Field
                  label="Checked party"
                  required
                  error={form.formState.errors.targetId?.message}
                >
                  <Select.Root
                    value={form.watch('targetId')}
                    onValueChange={(v) => form.setValue('targetId', v)}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      {a.targets.map((t) => (
                        <Select.Item value={t.id} key={t.id}>
                          {t.nameEnglish}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Field>
                <Field label="Check category" required>
                  <Select.Root
                    value={form.watch('category')}
                    onValueChange={(v) => form.setValue('category', v as EvidenceInput['category'])}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      {categories.map((c) => (
                        <Select.Item value={c} key={c}>
                          {c.replaceAll('_', ' ')}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Field>
                <Field
                  label="Search source"
                  required
                  error={form.formState.errors.sourceName?.message}
                >
                  <TextField.Root {...form.register('sourceName')} />
                </Field>
                <Field label="Search language" required>
                  <Select.Root
                    value={form.watch('searchLanguage')}
                    onValueChange={(v) =>
                      form.setValue('searchLanguage', v as EvidenceInput['searchLanguage'])
                    }
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="EN">English</Select.Item>
                      <Select.Item value="TH">Thai</Select.Item>
                      <Select.Item value="OTHER">Other</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Field>
                <Field
                  label="Search query"
                  required
                  error={form.formState.errors.searchQuery?.message}
                >
                  <TextField.Root {...form.register('searchQuery')} />
                </Field>
                <Field label="Search date" required>
                  <TextField.Root type="date" {...form.register('searchedAt')} />
                </Field>
                <Field label="Result" required>
                  <Select.Root
                    value={form.watch('result')}
                    onValueChange={(v) => form.setValue('result', v as EvidenceInput['result'])}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="NO_RESULT">No result found</Select.Item>
                      <Select.Item value="RECORD_FOUND">Record found</Select.Item>
                      <Select.Item value="SOURCE_UNAVAILABLE">Source unavailable</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Field>
                <Field label="Source URL" error={form.formState.errors.sourceUrl?.message}>
                  <TextField.Root type="url" {...form.register('sourceUrl')} />
                </Field>
                <Field label="Result-page URL" error={form.formState.errors.resultPageUrl?.message}>
                  <TextField.Root type="url" {...form.register('resultPageUrl')} />
                </Field>
                {form.watch('result') === 'SOURCE_UNAVAILABLE' && (
                  <Field label="Reason" required error={form.formState.errors.reason?.message}>
                    <TextArea {...form.register('reason')} />
                  </Field>
                )}
                <Field
                  label="Screenshot or source document"
                  required
                  error={form.formState.errors.evidence?.message as string}
                  hint="PNG, JPG, or PDF"
                >
                  <input
                    className="file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      form.setValue(
                        'evidence',
                        e.target.files?.[0] ? [e.target.files[0].name] : [],
                        { shouldValidate: true },
                      )
                    }
                  />
                </Field>
              </div>
              <Field label="Notes in original language">
                <TextArea />
              </Field>
              <Field label="English translation">
                <TextArea />
              </Field>
              <div className="formactions">
                <Dialog.Close asChild>
                  <Button type="button" variant="soft">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving…' : 'Save evidence'}
                </Button>
              </div>
            </form>
            <div className="history">
              <Heading size="3">Evidence history</Heading>
              {a.attempts.length ? (
                a.attempts.map((x) => (
                  <div className="evidencerow" key={x.id}>
                    <span>
                      <strong>{x.sourceName}</strong>
                      <small>
                        {x.searchQuery} · {x.searchLanguage}
                      </small>
                    </span>
                    <Badge color={x.result === 'RECORD_FOUND' ? 'green' : 'gray'}>
                      {x.result.replaceAll('_', ' ')}
                    </Badge>
                    <span>{x.evidence[0]}</span>
                  </div>
                ))
              ) : (
                <Text color="gray">No evidence recorded yet.</Text>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
