import { useState } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TrashIcon } from '@radix-ui/react-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from '@tanstack/react-router'
import {
  Button,
  Card,
  Checkbox,
  Heading,
  Select,
  Text,
  TextArea,
  TextField,
} from '@radix-ui/themes'
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react'
import { assignmentSchema, type AssignmentInput, categories, type PartyType } from '../model'
import { api, assignmentKeys } from '../../../lib/api'
import { Field } from '../../../components/Field'
const today = new Date().toISOString().slice(0, 10),
  past = new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().slice(0, 10)
const defaults: AssignmentInput = {
  nameEnglish: '',
  nameThai: '',
  registrationNumber: '',
  incorporationDate: '',
  formerNames: [],
  addressEnglish: '',
  addressThai: '',
  website: '',
  registeredCapital: '',
  paidUpCapital: '',
  currency: 'THB',
  businessEnglish: '',
  businessThai: '',
  clientName: '',
  dueDate: '',
  researchFrom: past,
  researchTo: today,
  categories: ['LITIGATION', 'BANKRUPTCY'],
  parties: [],
}
const input = (
  r: ReturnType<typeof useForm<AssignmentInput>>,
  name: keyof AssignmentInput,
  label: string,
  type: 'text' | 'date' | 'number' | 'url' = 'text',
  required = true,
) => (
  <Field label={label} error={r.formState.errors[name]?.message as string} required={required}>
    <TextField.Root type={type} {...r.register(name)} />
  </Field>
)
export function CreateAssignmentFlow() {
  const [step, setStep] = useState(0)
  const methods = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  })
  const parties = useFieldArray({ control: methods.control, name: 'parties' }),
    aliases = useFieldArray({ control: methods.control, name: 'formerNames' })
  const qc = useQueryClient(),
    nav = useNavigate()
  const mutation = useMutation({
    mutationFn: api.create,
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: assignmentKeys.all })
      nav({ to: '/assignments/$assignmentId', params: { assignmentId: a.id } })
    },
  })
  const next = async () => {
    const groups: (keyof AssignmentInput)[][] = [
      [
        'nameEnglish',
        'nameThai',
        'registrationNumber',
        'incorporationDate',
        'addressEnglish',
        'addressThai',
        'website',
        'registeredCapital',
        'currency',
        'businessEnglish',
        'businessThai',
      ],
      ['parties'],
      ['dueDate', 'researchFrom', 'researchTo', 'categories'],
    ]
    if (await methods.trigger(groups[step])) setStep((s) => s + 1)
  }
  return (
    <div className="page narrow">
      <Button asChild variant="ghost">
        <Link to="/assignments" search={{ q: '', status: 'ALL' }}>
          <ArrowLeft />
          Assignments
        </Link>
      </Button>
      <Heading size="7">Create assignment</Heading>
      <Text color="gray">Set up the company, checked parties, and required research.</Text>
      <ol className="steps">
        {['Company profile', 'Checked parties', 'Research scope', 'Review & create'].map((x, i) => (
          <li className={i <= step ? 'current' : ''} key={x}>
            <span>{i + 1}</span>
            {x}
          </li>
        ))}
      </ol>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit((v) => mutation.mutate(v))}>
          <Card className="formcard">
            {step === 0 && (
              <>
                <Heading size="5">Company profile</Heading>
                <div className="grid2">
                  {input(methods, 'nameEnglish', 'Company name in English')}
                  {input(methods, 'nameThai', 'Company name in Thai')}
                  {input(methods, 'registrationNumber', 'Registration number')}
                  {input(methods, 'incorporationDate', 'Incorporation date', 'date')}
                </div>
                <Heading size="4">Former names</Heading>
                {aliases.fields.map((f, i) => (
                  <div className="arrayrow" key={f.id}>
                    <Select.Root
                      value={methods.watch(`formerNames.${i}.language`)}
                      onValueChange={(v) =>
                        methods.setValue(`formerNames.${i}.language`, v as 'EN' | 'TH')
                      }
                    >
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value="EN">English</Select.Item>
                        <Select.Item value="TH">Thai</Select.Item>
                      </Select.Content>
                    </Select.Root>
                    <TextField.Root
                      aria-label={`Former name ${i + 1}`}
                      {...methods.register(`formerNames.${i}.name`)}
                    />
                    <Button
                      type="button"
                      variant="soft"
                      color="red"
                      aria-label={`Remove former name ${i + 1}`}
                      onClick={() => aliases.remove(i)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="soft"
                  onClick={() => aliases.append({ language: 'EN', name: '' })}
                >
                  <Plus />
                  Add former name
                </Button>
                <div className="grid2">
                  <Field label="Registered address in English" required>
                    <TextArea {...methods.register('addressEnglish')} />
                  </Field>
                  <Field label="Registered address in Thai" required>
                    <TextArea {...methods.register('addressThai')} />
                  </Field>
                  {input(methods, 'website', 'Website', 'url', false)}
                  {input(methods, 'registeredCapital', 'Registered capital', 'number')}
                  {input(methods, 'paidUpCapital', 'Paid-up capital', 'number', false)}
                  {input(methods, 'currency', 'Currency')}
                  <Field label="Line of business in English" required>
                    <TextArea {...methods.register('businessEnglish')} />
                  </Field>
                  <Field label="Line of business in Thai" required>
                    <TextArea {...methods.register('businessThai')} />
                  </Field>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <Heading size="5">Checked parties</Heading>
                <Text color="gray">
                  Add directors, shareholders, related companies, and any other parties to research.
                </Text>
                {parties.fields.map((f, i) => {
                  const type = methods.watch(`parties.${i}.partyType`)
                  return (
                    <Card className="party" key={f.id}>
                      <div className="row">
                        <strong>Party {i + 1}</strong>
                        <Button
                          type="button"
                          variant="ghost"
                          color="red"
                          onClick={() => parties.remove(i)}
                        >
                          <TrashIcon />
                          Remove
                        </Button>
                      </div>
                      <div className="grid2">
                        <Field label="Party type" required>
                          <Select.Root
                            value={type}
                            onValueChange={(v) =>
                              methods.setValue(`parties.${i}.partyType`, v as PartyType)
                            }
                          >
                            <Select.Trigger />
                            <Select.Content>
                              <Select.Item value="COMPANY">Company</Select.Item>
                              <Select.Item value="INDIVIDUAL">Individual</Select.Item>
                              <Select.Item value="SUBSIDIARY">Subsidiary</Select.Item>
                              <Select.Item value="OTHER">Other</Select.Item>
                            </Select.Content>
                          </Select.Root>
                        </Field>
                        <Field
                          label={
                            type === 'INDIVIDUAL' ? 'ID number or Passport' : 'Registration number'
                          }
                        >
                          <TextField.Root
                            {...methods.register(`parties.${i}.identificationNumber`)}
                          />
                        </Field>
                        <Field label="Name in English" required>
                          <TextField.Root {...methods.register(`parties.${i}.nameEnglish`)} />
                        </Field>
                        <Field label="Name in Thai">
                          <TextField.Root {...methods.register(`parties.${i}.nameThai`)} />
                        </Field>
                        {(type === 'INDIVIDUAL' || type === 'OTHER') && (
                          <Field label="Date of birth (optional)">
                            <TextField.Root
                              type="date"
                              {...methods.register(`parties.${i}.dateOfBirth`)}
                            />
                          </Field>
                        )}
                        {(type === 'COMPANY' || type === 'INDIVIDUAL') && (
                          <Field
                            label="Ownership percentage (optional)"
                            error={
                              methods.formState.errors.parties?.[i]?.ownershipPercentage?.message
                            }
                          >
                            <TextField.Root
                              type="number"
                              placeholder="0-100"
                              {...methods.register(`parties.${i}.ownershipPercentage`)}
                            />
                          </Field>
                        )}
                        <Field label="Relationship note (optional)">
                          <TextField.Root {...methods.register(`parties.${i}.relationshipNote`)} />
                        </Field>
                      </div>
                    </Card>
                  )
                })}
                <Button
                  type="button"
                  variant="soft"
                  onClick={() =>
                    parties.append({
                      partyType: 'INDIVIDUAL',
                      nameEnglish: '',
                      nameThai: '',
                      identificationNumber: '',
                      dateOfBirth: '',
                      ownershipPercentage: '',
                      relationshipNote: '',
                    })
                  }
                >
                  <Plus />
                  Add checked party
                </Button>
              </>
            )}
            {step === 2 && (
              <>
                <Heading size="5">Research scope</Heading>
                <div className="grid2">
                  {input(methods, 'clientName', 'Client name (optional)')}
                  {input(methods, 'dueDate', 'Due date', 'date')}
                  {input(methods, 'researchFrom', 'Research from', 'date')}
                  {input(methods, 'researchTo', 'Research to', 'date')}
                </div>
                <fieldset>
                  <legend>Required categories</legend>
                  {categories.map((c) => (
                    <label className="check" key={c}>
                      <Checkbox
                        checked={methods.watch('categories').includes(c)}
                        onCheckedChange={(on) =>
                          methods.setValue(
                            'categories',
                            on
                              ? [...methods.getValues('categories'), c]
                              : methods.getValues('categories').filter((x) => x !== c),
                            { shouldValidate: true },
                          )
                        }
                      />
                      {c.replaceAll('_', ' ')}
                    </label>
                  ))}
                </fieldset>
              </>
            )}
            {step === 3 && (
              <>
                <Heading size="5">Review and create</Heading>
                <div className="review">
                  <div>
                    <small>Subject company</small>
                    <strong>{methods.getValues('nameEnglish')}</strong>
                    <span>{methods.getValues('nameThai')}</span>
                  </div>
                  <div>
                    <small>Checked parties</small>
                    <strong>{methods.getValues('parties').length}</strong>
                  </div>
                  <div>
                    <small>Research categories</small>
                    <strong>{methods.getValues('categories').length}</strong>
                  </div>
                  <div>
                    <small>Research period</small>
                    <strong>
                      {methods.getValues('researchFrom')} – {methods.getValues('researchTo')}
                    </strong>
                  </div>
                </div>
              </>
            )}{' '}
            {Object.keys(methods.formState.errors).length > 0 && (
              <div className="errorsummary" role="alert">
                <strong>Review the highlighted fields.</strong>
                <span>Some required information is missing or invalid.</span>
              </div>
            )}
          </Card>
          <div className="formactions">
            {step > 0 && (
              <Button type="button" variant="soft" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft />
                Back
              </Button>
            )}
            <span />
            {step < 3 ? (
              <Button type="button" onClick={next}>
                Continue
                <ArrowRight />
              </Button>
            ) : (
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating…' : 'Create assignment'}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
