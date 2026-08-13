import { useState, type ReactNode } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TrashIcon } from '@radix-ui/react-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from '@tanstack/react-router'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Heading,
  Select,
  Text,
  TextArea,
  TextField,
} from '@radix-ui/themes'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarRange,
  Check,
  CircleAlert,
  ClipboardCheck,
  Gavel,
  Landmark,
  Languages,
  MapPin,
  Newspaper,
  Plus,
  SearchCheck,
  ShieldAlert,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react'
import {
  assignmentSchema,
  type AssignmentInput,
  categories,
  type Category,
  type PartyType,
} from '../model'
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
const assignmentSteps = [
  {
    title: 'Company profile',
    description: 'Corporate identity and registered information',
    icon: Building2,
  },
  {
    title: 'Checked parties',
    description: 'People and entities included in research',
    icon: UsersRound,
  },
  {
    title: 'Research scope',
    description: 'Timeline and required search categories',
    icon: SearchCheck,
  },
  {
    title: 'Review & create',
    description: 'Confirm the assignment before creation',
    icon: ClipboardCheck,
  },
] as const
const categoryDetails: Record<
  Category,
  { label: string; description: string; icon: typeof Gavel }
> = {
  LITIGATION: {
    label: 'Litigation',
    description: 'Civil and commercial court records',
    icon: Gavel,
  },
  BANKRUPTCY: {
    label: 'Bankruptcy',
    description: 'Insolvency and bankruptcy records',
    icon: Landmark,
  },
  MEDIA_POSITIVE_NEUTRAL: {
    label: 'Positive & neutral media',
    description: 'General news and corporate coverage',
    icon: Newspaper,
  },
  MEDIA_NEGATIVE: {
    label: 'Negative media',
    description: 'Adverse news and reputational risk',
    icon: ShieldAlert,
  },
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
        'formerNames',
      ],
      ['parties'],
      ['dueDate', 'researchFrom', 'researchTo', 'categories'],
    ]
    if (await methods.trigger(groups[step])) setStep((s) => s + 1)
  }
  return (
    <div className="page narrow create-assignment-page">
      <Button className="create-assignment-back" asChild variant="ghost">
        <Link to="/assignments" search={{ q: '', status: 'ALL' }}>
          <ArrowLeft size={16} aria-hidden="true" />
          Assignments
        </Link>
      </Button>
      <section className="create-assignment-hero" aria-labelledby="create-assignment-title">
        <span className="create-assignment-hero__icon" aria-hidden="true">
          <Sparkles size={22} />
        </span>
        <div>
          <span className="create-assignment-hero__eyebrow">New research engagement</span>
          <Heading id="create-assignment-title" as="h1" size="7">
            Create assignment
          </Heading>
          <Text color="gray">
            Set up the company, checked parties, and required research in four guided steps.
          </Text>
        </div>
        <Badge className="create-assignment-hero__progress" variant="soft" size="2">
          Step {step + 1} of {assignmentSteps.length}
        </Badge>
      </section>
      <nav className="assignment-stepper" aria-label="Assignment creation progress">
        <ol>
          {assignmentSteps.map((item, index) => {
            const StepIcon = item.icon
            const completed = index < step
            const current = index === step
            return (
              <li
                className={completed ? 'is-complete' : current ? 'is-current' : ''}
                aria-current={current ? 'step' : undefined}
                key={item.title}
              >
                <span className="assignment-stepper__marker" aria-hidden="true">
                  {completed ? <Check size={16} /> : <StepIcon size={16} />}
                </span>
                <span className="assignment-stepper__copy">
                  <small>Step {index + 1}</small>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </span>
              </li>
            )
          })}
        </ol>
      </nav>
      <FormProvider {...methods}>
        <form
          className="create-assignment-form"
          onSubmit={methods.handleSubmit((v) => mutation.mutate(v))}
        >
          <Card className="formcard create-assignment-card">
            {step === 0 && (
              <section className="assignment-form-step" aria-labelledby="assignment-step-title-1">
                <FormStepHeader
                  id="assignment-step-title-1"
                  icon={<Building2 />}
                  step="Step 1 of 4"
                  title="Company profile"
                  description="Capture the company’s legal identity and registered corporate information."
                />
                <div className="assignment-form-stack">
                  <section className="assignment-form-group">
                    <FormGroupHeader
                      icon={<BadgeCheck />}
                      title="Corporate identity"
                      description="Use the official names and registration details."
                    />
                    <div className="grid2 assignment-form-grid">
                      {input(methods, 'nameEnglish', 'Company name in English')}
                      {input(methods, 'nameThai', 'Company name in Thai')}
                      {input(methods, 'registrationNumber', 'Registration number')}
                      {input(methods, 'incorporationDate', 'Incorporation date', 'date')}
                    </div>
                  </section>

                  <section className="assignment-form-group">
                    <div className="assignment-form-group__topline">
                      <FormGroupHeader
                        icon={<Languages />}
                        title="Former names"
                        description="Add previous registered or trading names, if applicable."
                      />
                      <Button
                        className="assignment-form-add"
                        type="button"
                        variant="soft"
                        onClick={() => aliases.append({ language: 'EN', name: '' })}
                      >
                        <Plus size={15} aria-hidden="true" />
                        Add former name
                      </Button>
                    </div>
                    {aliases.fields.length ? (
                      <div className="former-name-list">
                        {aliases.fields.map((field, index) => (
                          <div className="former-name-row" key={field.id}>
                            <Select.Root
                              value={methods.watch(`formerNames.${index}.language`)}
                              onValueChange={(value) =>
                                methods.setValue(
                                  `formerNames.${index}.language`,
                                  value as 'EN' | 'TH',
                                )
                              }
                            >
                              <Select.Trigger aria-label={`Former name ${index + 1} language`} />
                              <Select.Content>
                                <Select.Item value="EN">English</Select.Item>
                                <Select.Item value="TH">Thai</Select.Item>
                              </Select.Content>
                            </Select.Root>
                            <div>
                              <TextField.Root
                                aria-label={`Former name ${index + 1}`}
                                placeholder="Enter the former company name"
                                {...methods.register(`formerNames.${index}.name`)}
                              />
                              {methods.formState.errors.formerNames?.[index]?.name?.message && (
                                <small className="error" role="alert">
                                  {methods.formState.errors.formerNames[index]?.name?.message}
                                </small>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="soft"
                              color="red"
                              aria-label={`Remove former name ${index + 1}`}
                              onClick={() => aliases.remove(index)}
                            >
                              <TrashIcon />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="assignment-inline-empty">
                        <Languages size={17} aria-hidden="true" />
                        <Text color="gray" size="2">
                          No former names added.
                        </Text>
                      </div>
                    )}
                  </section>

                  <section className="assignment-form-group">
                    <FormGroupHeader
                      icon={<MapPin />}
                      title="Registered profile"
                      description="Address, capital, website, and line of business."
                    />
                    <div className="grid2 assignment-form-grid">
                      <Field
                        label="Registered address in English"
                        error={methods.formState.errors.addressEnglish?.message}
                        required
                      >
                        <TextArea rows={3} {...methods.register('addressEnglish')} />
                      </Field>
                      <Field
                        label="Registered address in Thai"
                        error={methods.formState.errors.addressThai?.message}
                        required
                      >
                        <TextArea rows={3} lang="th" {...methods.register('addressThai')} />
                      </Field>
                      {input(methods, 'website', 'Website', 'url', false)}
                      {input(methods, 'registeredCapital', 'Registered capital', 'number')}
                      {input(methods, 'paidUpCapital', 'Paid-up capital', 'number', false)}
                      {input(methods, 'currency', 'Currency')}
                      <Field
                        label="Line of business in English"
                        error={methods.formState.errors.businessEnglish?.message}
                        required
                      >
                        <TextArea rows={3} {...methods.register('businessEnglish')} />
                      </Field>
                      <Field
                        label="Line of business in Thai"
                        error={methods.formState.errors.businessThai?.message}
                        required
                      >
                        <TextArea rows={3} lang="th" {...methods.register('businessThai')} />
                      </Field>
                    </div>
                  </section>
                </div>
              </section>
            )}
            {step === 1 && (
              <section className="assignment-form-step" aria-labelledby="assignment-step-title-2">
                <FormStepHeader
                  id="assignment-step-title-2"
                  icon={<UsersRound />}
                  step="Step 2 of 4"
                  title="Checked parties"
                  description="Add directors, shareholders, related companies, and other parties to research."
                  action={
                    <Button
                      className="assignment-form-add"
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
                      <Plus size={15} aria-hidden="true" />
                      Add checked party
                    </Button>
                  }
                />
                {parties.fields.length ? (
                  <div className="assignment-party-list">
                    {parties.fields.map((field, index) => {
                      const type = methods.watch(`parties.${index}.partyType`)
                      return (
                        <Card className="assignment-party-card" key={field.id}>
                          <header className="assignment-party-card__header">
                            <div className="assignment-party-card__identity">
                              <span aria-hidden="true">
                                {type === 'INDIVIDUAL' ? (
                                  <UserRound size={18} />
                                ) : (
                                  <Building2 size={18} />
                                )}
                              </span>
                              <div>
                                <Text as="p" size="1">
                                  Checked party
                                </Text>
                                <Heading as="h3" size="4">
                                  Party {index + 1}
                                </Heading>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              color="red"
                              aria-label={`Remove party ${index + 1}`}
                              onClick={() => parties.remove(index)}
                            >
                              <TrashIcon />
                              Remove
                            </Button>
                          </header>
                          <div className="grid2 assignment-form-grid assignment-party-grid">
                            <Field label="Party type" required>
                              <Select.Root
                                value={type}
                                onValueChange={(value) =>
                                  methods.setValue(
                                    `parties.${index}.partyType`,
                                    value as PartyType,
                                    { shouldValidate: true },
                                  )
                                }
                              >
                                <Select.Trigger aria-label={`Party ${index + 1} type`} />
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
                                type === 'INDIVIDUAL'
                                  ? 'ID number or Passport'
                                  : 'Registration number'
                              }
                            >
                              <TextField.Root
                                {...methods.register(`parties.${index}.identificationNumber`)}
                              />
                            </Field>
                            <Field
                              label="Name in English"
                              error={
                                methods.formState.errors.parties?.[index]?.nameEnglish?.message
                              }
                              required
                            >
                              <TextField.Root
                                {...methods.register(`parties.${index}.nameEnglish`)}
                              />
                            </Field>
                            <Field label="Name in Thai">
                              <TextField.Root
                                lang="th"
                                {...methods.register(`parties.${index}.nameThai`)}
                              />
                            </Field>
                            {(type === 'INDIVIDUAL' || type === 'OTHER') && (
                              <Field label="Date of birth (optional)">
                                <TextField.Root
                                  type="date"
                                  {...methods.register(`parties.${index}.dateOfBirth`)}
                                />
                              </Field>
                            )}
                            {(type === 'COMPANY' || type === 'INDIVIDUAL') && (
                              <Field
                                label="Ownership percentage (optional)"
                                error={
                                  methods.formState.errors.parties?.[index]?.ownershipPercentage
                                    ?.message
                                }
                              >
                                <TextField.Root
                                  type="number"
                                  placeholder="0–100"
                                  {...methods.register(`parties.${index}.ownershipPercentage`)}
                                />
                              </Field>
                            )}
                            <Field label="Relationship note (optional)">
                              <TextField.Root
                                {...methods.register(`parties.${index}.relationshipNote`)}
                              />
                            </Field>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="assignment-parties-empty">
                    <span aria-hidden="true">
                      <UsersRound size={24} />
                    </span>
                    <Heading as="h3" size="4">
                      No additional parties yet
                    </Heading>
                    <Text color="gray" size="2">
                      The subject company is included automatically. Add related people or entities
                      when they also need to be researched.
                    </Text>
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
                      <Plus size={15} aria-hidden="true" />
                      Add checked party
                    </Button>
                  </div>
                )}
              </section>
            )}
            {step === 2 && (
              <section className="assignment-form-step" aria-labelledby="assignment-step-title-3">
                <FormStepHeader
                  id="assignment-step-title-3"
                  icon={<SearchCheck />}
                  step="Step 3 of 4"
                  title="Research scope"
                  description="Define the delivery timeline, research period, and checks required for every party."
                />
                <div className="assignment-form-stack">
                  <section className="assignment-form-group">
                    <FormGroupHeader
                      icon={<CalendarRange />}
                      title="Schedule and client"
                      description="Set the delivery date and the historical period covered."
                    />
                    <div className="grid2 assignment-form-grid">
                      {input(methods, 'clientName', 'Client name (optional)', 'text', false)}
                      {input(methods, 'dueDate', 'Due date', 'date')}
                      {input(methods, 'researchFrom', 'Research from', 'date')}
                      {input(methods, 'researchTo', 'Research to', 'date')}
                    </div>
                  </section>
                  <fieldset className="research-category-fieldset">
                    <legend>Required categories</legend>
                    <Text as="p" size="2" color="gray">
                      Select each check that must be completed for every available name language.
                    </Text>
                    <div className="research-category-grid">
                      {categories.map((category) => {
                        const selected = methods.watch('categories').includes(category)
                        const details = categoryDetails[category]
                        const CategoryIcon = details.icon
                        return (
                          <label
                            className="research-category-option"
                            data-selected={selected || undefined}
                            key={category}
                          >
                            <Checkbox
                              checked={selected}
                              onCheckedChange={(checked) =>
                                methods.setValue(
                                  'categories',
                                  checked
                                    ? [...methods.getValues('categories'), category]
                                    : methods
                                        .getValues('categories')
                                        .filter((value) => value !== category),
                                  { shouldValidate: true },
                                )
                              }
                            />
                            <span className="research-category-option__icon" aria-hidden="true">
                              <CategoryIcon size={18} />
                            </span>
                            <span className="research-category-option__copy">
                              <strong>{details.label}</strong>
                              <small>{details.description}</small>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                    {methods.formState.errors.categories?.message && (
                      <small className="research-category-error error" role="alert">
                        {methods.formState.errors.categories.message}
                      </small>
                    )}
                  </fieldset>
                </div>
              </section>
            )}
            {step === 3 && (
              <section className="assignment-form-step" aria-labelledby="assignment-step-title-4">
                <FormStepHeader
                  id="assignment-step-title-4"
                  icon={<ClipboardCheck />}
                  step="Step 4 of 4"
                  title="Review and create"
                  description="Confirm the brief below before opening the research workspace."
                />
                <div className="assignment-form-stack">
                  <div className="assignment-review-intro">
                    <span aria-hidden="true">
                      <BriefcaseBusiness size={21} />
                    </span>
                    <div>
                      <Heading as="h3" size="4">
                        Ready to create the research brief
                      </Heading>
                      <Text as="p" color="gray" size="2">
                        The assignment will start in progress and can be refined in the workspace.
                      </Text>
                    </div>
                  </div>
                  <div className="assignment-review-grid">
                    <div className="assignment-review-card assignment-review-card--company">
                      <span className="assignment-review-card__icon" aria-hidden="true">
                        <Building2 size={18} />
                      </span>
                      <small>Subject company</small>
                      <strong>{methods.getValues('nameEnglish')}</strong>
                      <span lang="th">{methods.getValues('nameThai')}</span>
                    </div>
                    <div className="assignment-review-card">
                      <span className="assignment-review-card__icon" aria-hidden="true">
                        <UsersRound size={18} />
                      </span>
                      <small>Checked parties</small>
                      <strong>{methods.getValues('parties').length}</strong>
                      <span>Additional research subjects</span>
                    </div>
                    <div className="assignment-review-card">
                      <span className="assignment-review-card__icon" aria-hidden="true">
                        <CalendarRange size={18} />
                      </span>
                      <small>Research period</small>
                      <strong className="assignment-review-card__date">
                        {methods.getValues('researchFrom')} – {methods.getValues('researchTo')}
                      </strong>
                      <span>Due {methods.getValues('dueDate')}</span>
                    </div>
                    <div className="assignment-review-card assignment-review-card--categories">
                      <span className="assignment-review-card__icon" aria-hidden="true">
                        <SearchCheck size={18} />
                      </span>
                      <small>Research categories</small>
                      <strong>{methods.getValues('categories').length}</strong>
                      <div className="assignment-review-card__badges">
                        {methods.getValues('categories').map((category) => (
                          <Badge key={category} variant="soft">
                            {categoryDetails[category].label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
            {Object.keys(methods.formState.errors).length > 0 && (
              <div className="errorsummary create-assignment-errors" role="alert">
                <span aria-hidden="true">
                  <CircleAlert size={18} />
                </span>
                <div>
                  <strong>Review the highlighted fields.</strong>
                  <span>Some required information is missing or invalid.</span>
                </div>
              </div>
            )}
            {mutation.isError && (
              <div className="errorsummary create-assignment-errors" role="alert">
                <span aria-hidden="true">
                  <CircleAlert size={18} />
                </span>
                <div>
                  <strong>Assignment could not be created.</strong>
                  <span>Please review the information and try again.</span>
                </div>
              </div>
            )}
          </Card>
          <div className="formactions create-assignment-actions">
            <span className="create-assignment-actions__context">
              {assignmentSteps[step].title}
            </span>
            <div className="create-assignment-actions__buttons">
              {step > 0 && (
                <Button type="button" variant="soft" onClick={() => setStep((value) => value - 1)}>
                  <ArrowLeft size={16} aria-hidden="true" />
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={next}>
                  Continue
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
              ) : (
                <Button type="submit" disabled={mutation.isPending} aria-busy={mutation.isPending}>
                  {mutation.isPending ? 'Creating…' : 'Create assignment'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}

function FormStepHeader({
  id,
  icon,
  step,
  title,
  description,
  action,
}: {
  id: string
  icon: ReactNode
  step: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="assignment-form-step__header">
      <div className="assignment-form-step__identity">
        <span className="assignment-form-step__icon" aria-hidden="true">
          {icon}
        </span>
        <div>
          <span className="assignment-form-step__eyebrow">{step}</span>
          <Heading id={id} as="h2" size="5">
            {title}
          </Heading>
          <Text as="p" color="gray" size="2">
            {description}
          </Text>
        </div>
      </div>
      {action}
    </header>
  )
}

function FormGroupHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <header className="assignment-form-group__header">
      <span aria-hidden="true">{icon}</span>
      <div>
        <Heading as="h3" size="3">
          {title}
        </Heading>
        <Text as="p" color="gray" size="1">
          {description}
        </Text>
      </div>
    </header>
  )
}
