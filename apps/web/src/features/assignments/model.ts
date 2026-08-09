import { z } from 'zod'
import { createResearchCheckKey, type LegalCase } from '../../entities/legal-case'

// Backend target types
export const targetTypes = [
  'DIRECTOR',
  'SHAREHOLDER',
  'ULTIMATE_PARENT',
  'SUBSIDIARY',
  'OTHER',
] as const

// UI party types for checked parties form
export const partyTypes = ['COMPANY', 'INDIVIDUAL', 'SUBSIDIARY', 'OTHER'] as const
export type PartyType = (typeof partyTypes)[number]

export const categories = [
  'LITIGATION',
  'BANKRUPTCY',
  'MEDIA_POSITIVE_NEUTRAL',
  'MEDIA_NEGATIVE',
] as const
export type Category = (typeof categories)[number]
export type AssignmentStatus = 'DRAFT' | 'IN_PROGRESS' | 'READY_TO_SUBMIT' | 'SUBMITTED'

// Map UI party types to backend target types
export function mapPartyTypeToBackend(
  partyType: PartyType,
  isOwner?: boolean,
): (typeof targetTypes)[number] {
  if (partyType === 'COMPANY') return 'ULTIMATE_PARENT'
  if (partyType === 'INDIVIDUAL') return isOwner ? 'SHAREHOLDER' : 'DIRECTOR'
  if (partyType === 'SUBSIDIARY') return 'SUBSIDIARY'
  return 'OTHER'
}

const partySchema = z
  .object({
    partyType: z.enum(partyTypes),
    nameEnglish: z.string().min(1, 'English name is required'),
    nameThai: z.string(),
    identificationNumber: z.string(),
    dateOfBirth: z.string(),
    ownershipPercentage: z.string(),
    relationshipNote: z.string(),
  })
  .superRefine((party, ctx) => {
    // Ownership percentage required for companies with ownership (parent) or shareholders
    if (
      (party.partyType === 'COMPANY' || party.partyType === 'INDIVIDUAL') &&
      party.ownershipPercentage &&
      (Number(party.ownershipPercentage) < 0 || Number(party.ownershipPercentage) > 100)
    )
      ctx.addIssue({
        code: 'custom',
        path: ['ownershipPercentage'],
        message: 'Enter ownership between 0 and 100%',
      })
  })

export const assignmentSchema = z
  .object({
    nameEnglish: z.string().min(2, 'English company name is required'),
    nameThai: z.string().min(2, 'Thai company name is required'),
    registrationNumber: z.string().min(1, 'Registration number is required'),
    incorporationDate: z.string().min(1, 'Incorporation date is required'),
    formerNames: z.array(
      z.object({ language: z.enum(['EN', 'TH']), name: z.string().min(1, 'Name is required') }),
    ),
    addressEnglish: z.string().min(1, 'English address is required'),
    addressThai: z.string().min(1, 'Thai address is required'),
    website: z.union([z.literal(''), z.string().url('Enter a valid URL')]),
    registeredCapital: z.string().min(1, 'Registered capital is required'),
    paidUpCapital: z.string(),
    currency: z.string().min(1),
    businessEnglish: z.string().min(1, 'English line of business is required'),
    businessThai: z.string().min(1, 'Thai line of business is required'),
    clientName: z.string(),
    dueDate: z.string().min(1, 'Due date is required'),
    researchFrom: z.string().min(1),
    researchTo: z.string().min(1),
    categories: z.array(z.enum(categories)).min(1, 'Select at least one category'),
    parties: z.array(partySchema),
  })
  .superRefine((data, ctx) => {
    if (data.researchFrom > data.researchTo)
      ctx.addIssue({
        code: 'custom',
        path: ['researchTo'],
        message: 'End date must be after start date',
      })
  })
export type AssignmentInput = z.infer<typeof assignmentSchema>

export type SearchAttempt = {
  id: string
  targetId: string
  category: Category
  sourceName: string
  sourceUrl: string
  resultPageUrl: string
  searchQuery: string
  searchLanguage: 'EN' | 'TH' | 'OTHER'
  searchedAt: string
  result: 'RECORD_FOUND' | 'NO_RESULT' | 'SOURCE_UNAVAILABLE'
  reason: string
  evidence: string[]
}
export type Target = {
  id: string
  targetType: 'SUBJECT_COMPANY' | (typeof targetTypes)[number]
  nameEnglish: string
  nameThai: string
  identificationNumber?: string
  ownershipPercentage?: string
}
export type Assignment = AssignmentInput & {
  id: string
  referenceId: string
  status: AssignmentStatus
  createdAt: string
  targets: Target[]
  attempts: SearchAttempt[]
  cases: LegalCase[]
  media: { title: string; sentiment: string; publisher: string; summaryEnglish: string }[]
}

export const evidenceSchema = z
  .object({
    targetId: z.string().min(1),
    category: z.enum(categories),
    sourceName: z.string().min(1, 'Source name is required'),
    sourceUrl: z.string(),
    resultPageUrl: z.string(),
    searchQuery: z.string().min(1, 'Search query is required'),
    searchLanguage: z.enum(['EN', 'TH', 'OTHER']),
    searchedAt: z.string().min(1),
    result: z.enum(['RECORD_FOUND', 'NO_RESULT', 'SOURCE_UNAVAILABLE']),
    reason: z.string(),
    evidence: z.array(z.string()),
  })
  .superRefine((v, ctx) => {
    if (v.result === 'NO_RESULT' && !v.resultPageUrl)
      ctx.addIssue({
        code: 'custom',
        path: ['resultPageUrl'],
        message: 'Result-page URL is required',
      })
    if (v.result === 'RECORD_FOUND' && !v.sourceUrl)
      ctx.addIssue({
        code: 'custom',
        path: ['sourceUrl'],
        message: 'Source URL is required for a record found',
      })
    if (v.result === 'SOURCE_UNAVAILABLE' && !v.reason)
      ctx.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'Explain why the source was unavailable',
      })
    if (v.evidence.length === 0)
      ctx.addIssue({
        code: 'custom',
        path: ['evidence'],
        message:
          v.result === 'NO_RESULT'
            ? 'Upload a screenshot showing the search query and no-result message.'
            : v.result === 'SOURCE_UNAVAILABLE'
              ? 'Upload a screenshot showing the unavailable page.'
              : 'Upload a screenshot or source document.',
      })
  })
export type EvidenceInput = z.infer<typeof evidenceSchema>

export function completion(a: Assignment) {
  const required = a.targets.flatMap((t) =>
    a.categories.flatMap((category) =>
      [
        t.nameEnglish && { t: t.id, category, language: 'EN' },
        t.nameThai && { t: t.id, category, language: 'TH' },
      ].filter(Boolean),
    ),
  ) as { t: string; category: Category; language: string }[]
  const complete = required.filter((r) =>
    a.attempts.some(
      (x) => x.targetId === r.t && x.category === r.category && x.searchLanguage === r.language,
    ),
  ).length
  return {
    complete,
    total: required.length,
    percent: required.length ? Math.round((complete / required.length) * 100) : 0,
  }
}
export function submissionIssues(a: Assignment) {
  const p = completion(a)
  const issues: string[] = []
  if (p.complete < p.total)
    issues.push(`${p.total - p.complete} required language searches are incomplete`)
  if (a.attempts.some((x) => !x.evidence.length))
    issues.push('Every search attempt needs supporting evidence')
  const legalCheckKeys = new Set(
    a.attempts
      .filter(
        (attempt) =>
          attempt.result === 'RECORD_FOUND' &&
          (attempt.category === 'LITIGATION' || attempt.category === 'BANKRUPTCY'),
      )
      .map((attempt) =>
        createResearchCheckKey(attempt.targetId, attempt.category as 'LITIGATION' | 'BANKRUPTCY'),
      ),
  )
  const documentedLegalChecks = new Set(a.cases.map((legalCase) => legalCase.researchCheckKey))
  const undocumentedLegalChecks = [...legalCheckKeys].filter(
    (key) => !documentedLegalChecks.has(key),
  )
  if (undocumentedLegalChecks.length)
    issues.push(
      `${undocumentedLegalChecks.length} legal record ${undocumentedLegalChecks.length === 1 ? 'match needs' : 'matches need'} a linked structured case`,
    )

  const hasMediaMatch = a.attempts.some(
    (attempt) =>
      attempt.result === 'RECORD_FOUND' &&
      (attempt.category === 'MEDIA_POSITIVE_NEUTRAL' || attempt.category === 'MEDIA_NEGATIVE'),
  )
  if (hasMediaMatch && !a.media.length)
    issues.push('Record-found media searches need a structured media finding')
  return issues
}
