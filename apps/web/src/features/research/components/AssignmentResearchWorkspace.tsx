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
import { ArrowLeft, FileSearch, Plus, X } from 'lucide-react'
import { api, assignmentKeys } from '../../../lib/api'
import { categories, completion, evidenceSchema, type EvidenceInput } from '../../assignments/model'
import { Field } from '../../../components/Field'
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
export function AssignmentResearchWorkspace({ assignmentId }: { assignmentId: string }) {
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
      <Tabs.Root className="tabs" defaultValue="parties">
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
            <div className="targetgrid">
              {a.targets.map((t) => {
                const done = a.attempts.filter((x) => x.targetId === t.id).length
                return (
                  <Card key={t.id}>
                    <Badge variant="soft">{t.targetType.replaceAll('_', ' ')}</Badge>
                    <strong>{t.nameEnglish}</strong>
                    <span>{t.nameThai || 'No Thai name recorded'}</span>
                    <small>{t.identificationNumber || 'No ID recorded'}</small>
                    <Text size="2">{done} searches recorded</Text>
                  </Card>
                )
              })}
            </div>
          </Card>
        </Tabs.Content>
        <Tabs.Content value="legal">
          <Card className="panel">
            <Heading size="4">Legal matches & evidence</Heading>
            {a.targets.map((t) => (
              <div className="evidencerow" key={t.id}>
                <div>
                  <strong>{t.nameEnglish}</strong>
                  <small>{t.nameThai}</small>
                </div>
                <span>
                  Litigation:{' '}
                  {
                    a.attempts.filter((x) => x.targetId === t.id && x.category === 'LITIGATION')
                      .length
                  }
                </span>
                <span>
                  Bankruptcy:{' '}
                  {
                    a.attempts.filter((x) => x.targetId === t.id && x.category === 'BANKRUPTCY')
                      .length
                  }
                </span>
                <Button
                  variant="soft"
                  onClick={() => {
                    form.setValue('targetId', t.id)
                    setOpen(true)
                  }}
                >
                  Add evidence
                </Button>
              </div>
            ))}
          </Card>
        </Tabs.Content>
        <Tabs.Content value="cases">
          <Card className="state">
            <FileSearch />
            <Heading size="4">Structured case records</Heading>
            <Text color="gray">
              No matched legal cases have been added yet. Add record-found evidence to begin.
            </Text>
          </Card>
        </Tabs.Content>
        <Tabs.Content value="media">
          <Card className="state">
            <Heading size="4">Media findings</Heading>
            <Text color="gray">Positive/neutral and negative news findings will appear here.</Text>
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
