import type { Assignment, AssignmentInput } from '../features/assignments/model'
import { mapPartyTypeToBackend } from '../features/assignments/model'
import {
  createResearchCheckKey,
  isHttpUrl,
  legalCaseDefaults,
  legalCaseFormSchema,
  type LegalCase,
  type LegalCaseInput,
} from '../entities/legal-case'
import {
  createMediaResearchCheckKey,
  isMediaResearchCategory,
  mediaFindingDefaults,
  mediaFindingFormSchema,
  type MediaFinding,
  type MediaFindingInput,
  type MediaResearchCategory,
  type MediaSentiment,
} from '../entities/media-finding'
import {
  createSearchEvidenceDefaults,
  searchCategories,
  searchEvidenceSchema,
  searchLanguages,
  searchResults,
  type SearchAttempt,
  type SearchCategory,
  type SearchEvidenceInput,
  type SearchLanguage,
  type SearchResult,
} from '../entities/search-attempt'

const KEY = 'cleartrace.assignments.v1'
const wait = () => new Promise((r) => setTimeout(r, 350))
const seed: Assignment[] = [
  {
    id: 'demo-1',
    referenceId: 'CTR-2026-014',
    status: 'IN_PROGRESS',
    createdAt: '2026-08-02',
    nameEnglish: 'Siam Meridian Foods Co., Ltd.',
    nameThai: 'บริษัท สยาม เมอริเดียน ฟู้ดส์ จำกัด',
    registrationNumber: '0105568123456',
    incorporationDate: '2017-04-12',
    formerNames: [],
    addressEnglish: '88 Fictional Road, Bangkok',
    addressThai: '88 ถนนตัวอย่าง กรุงเทพมหานคร',
    website: 'https://example.com',
    registeredCapital: '50000000',
    paidUpCapital: '50000000',
    currency: 'THB',
    businessEnglish: 'Food distribution',
    businessThai: 'การจัดจำหน่ายอาหาร',
    clientName: 'Northstar Advisory',
    dueDate: '2026-08-15',
    researchFrom: '2016-08-09',
    researchTo: '2026-08-09',
    categories: ['LITIGATION', 'BANKRUPTCY', 'MEDIA_NEGATIVE'],
    parties: [],
    targets: [
      {
        id: 't1',
        targetType: 'SUBJECT_COMPANY',
        nameEnglish: 'Siam Meridian Foods Co., Ltd.',
        nameThai: 'บริษัท สยาม เมอริเดียน ฟู้ดส์ จำกัด',
        identificationNumber: '0105568123456',
      },
      {
        id: 't2',
        targetType: 'DIRECTOR',
        nameEnglish: 'Narin Sample',
        nameThai: 'นรินทร์ ตัวอย่าง',
      },
    ],
    attempts: [
      {
        id: 'e1',
        targetId: 't1',
        category: 'LITIGATION',
        sourceName: 'Court Records Demo',
        sourceUrl: '',
        resultPageUrl: 'https://example.com/search',
        searchQuery: 'Siam Meridian Foods',
        searchLanguage: 'EN',
        searchedAt: '2026-08-05',
        result: 'NO_RESULT',
        reason: '',
        evidence: ['no-results-en.png'],
        notesOriginal: '',
        translationEnglish: '',
        createdAt: '2026-08-05T00:00:00.000Z',
      },
    ],
    cases: [],
    media: [],
  },
]
function load() {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!Array.isArray(parsed)) return seed
    return parsed
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map(normalizeAssignment)
  } catch {
    return seed
  }
}

function normalizeAssignment(value: Record<string, unknown>): Assignment {
  const assignment = value as unknown as Assignment
  const storedCases = Array.isArray(value.cases) ? value.cases : []
  const storedAttempts = Array.isArray(value.attempts) ? value.attempts : []
  const attempts = storedAttempts
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item, index) => normalizeSearchAttempt(assignment, item, index))
  const storedMedia = Array.isArray(value.media) ? value.media : []
  return {
    ...assignment,
    categories: Array.isArray(value.categories) ? assignment.categories : [],
    formerNames: Array.isArray(value.formerNames) ? assignment.formerNames : [],
    parties: Array.isArray(value.parties) ? assignment.parties : [],
    targets: Array.isArray(value.targets) ? assignment.targets : [],
    attempts,
    media: storedMedia
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item, index) => normalizeMediaFinding(assignment, attempts, item, index)),
    cases: storedCases
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item, index) => normalizeLegalCase(assignment, item, index)),
  }
}

function normalizeSearchAttempt(
  assignment: Assignment,
  value: Record<string, unknown>,
  index: number,
): SearchAttempt {
  const category = isSearchCategory(value.category) ? value.category : 'LITIGATION'
  const result = isSearchResult(value.result) ? value.result : 'NO_RESULT'
  const searchLanguage = isSearchLanguage(value.searchLanguage) ? value.searchLanguage : 'EN'
  const defaults = createSearchEvidenceDefaults({ category, result, searchLanguage })
  return {
    ...defaults,
    id: stringValue(value.id) || `legacy-evidence-${assignment.id}-${index}`,
    targetId: stringValue(value.targetId),
    category,
    sourceName: stringValue(value.sourceName),
    sourceUrl: safeUrl(value.sourceUrl),
    resultPageUrl: safeUrl(value.resultPageUrl),
    searchQuery: stringValue(value.searchQuery),
    searchLanguage,
    searchedAt: stringValue(value.searchedAt),
    result,
    reason: stringValue(value.reason),
    evidence: Array.isArray(value.evidence)
      ? value.evidence.filter((item): item is string => typeof item === 'string')
      : [],
    notesOriginal: stringValue(value.notesOriginal),
    translationEnglish: stringValue(value.translationEnglish),
    createdAt: stringValue(value.createdAt) || assignment.createdAt || '',
  }
}

function normalizeMediaFinding(
  assignment: Assignment,
  attempts: SearchAttempt[],
  value: Record<string, unknown>,
  index: number,
): MediaFinding {
  const sentiment = isMediaSentiment(value.sentiment) ? value.sentiment : 'NEUTRAL'
  const requestedCategory = isMediaResearchCategory(stringValue(value.category))
    ? (value.category as MediaResearchCategory)
    : sentiment === 'NEGATIVE'
      ? 'MEDIA_NEGATIVE'
      : 'MEDIA_POSITIVE_NEUTRAL'
  const compatibleChecks = uniqueMediaChecks(
    attempts.filter(
      (attempt) => attempt.result === 'RECORD_FOUND' && attempt.category === requestedCategory,
    ),
  )
  const inferredCheck = compatibleChecks.length === 1 ? compatibleChecks[0] : undefined
  const targetId = stringValue(value.targetId) || inferredCheck?.targetId || ''
  const category = inferredCheck?.category || requestedCategory
  const researchCheckKey =
    stringValue(value.researchCheckKey) ||
    (inferredCheck
      ? createMediaResearchCheckKey(inferredCheck.targetId, inferredCheck.category)
      : '')

  return {
    ...mediaFindingDefaults,
    id: stringValue(value.id) || `legacy-media-${assignment.id}-${index}`,
    researchCheckKey,
    targetId,
    category,
    articleTitle: stringValue(value.articleTitle) || stringValue(value.title),
    publisher: stringValue(value.publisher),
    publishedAt: stringValue(value.publishedAt),
    sentiment,
    summaryOriginal: stringValue(value.summaryOriginal),
    summaryEnglish: stringValue(value.summaryEnglish),
    sourceUrl: safeUrl(value.sourceUrl),
    supportingDocument: stringValue(value.supportingDocument),
    createdAt: stringValue(value.createdAt) || assignment.createdAt || '',
  }
}

function normalizeLegalCase(
  assignment: Assignment,
  value: Record<string, unknown>,
  index: number,
): LegalCase {
  const legacy = value as Partial<LegalCase>
  const category = legacy.category === 'BANKRUPTCY' ? 'BANKRUPTCY' : 'LITIGATION'
  const targetId = typeof legacy.targetId === 'string' ? legacy.targetId : ''
  const sourceUrl =
    typeof legacy.sourceUrl === 'string' && isHttpUrl(legacy.sourceUrl) ? legacy.sourceUrl : ''
  return {
    ...legalCaseDefaults,
    ...legacy,
    id: typeof legacy.id === 'string' ? legacy.id : `legacy-${assignment.id}-${index}`,
    targetId,
    category,
    sourceUrl,
    researchCheckKey:
      typeof legacy.researchCheckKey === 'string'
        ? legacy.researchCheckKey
        : targetId
          ? createResearchCheckKey(targetId, category)
          : '',
    createdAt: typeof legacy.createdAt === 'string' ? legacy.createdAt : assignment.createdAt || '',
  }
}
function save(v: Assignment[]) {
  localStorage.setItem(KEY, JSON.stringify(v))
}
export const api = {
  async list() {
    await wait()
    return load()
  },
  async get(id: string) {
    await wait()
    const x = load().find((a) => a.id === id)
    if (!x) throw new Error('Assignment not found')
    return x
  },
  async create(v: AssignmentInput) {
    await wait()
    const id = crypto.randomUUID()
    const a: Assignment = {
      ...v,
      id,
      referenceId: `CTR-2026-${String(load().length + 15).padStart(3, '0')}`,
      status: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
      targets: [
        {
          id: crypto.randomUUID(),
          targetType: 'SUBJECT_COMPANY',
          nameEnglish: v.nameEnglish,
          nameThai: v.nameThai,
          identificationNumber: v.registrationNumber,
        },
        ...v.parties.map((p) => ({
          id: crypto.randomUUID(),
          targetType: mapPartyTypeToBackend(p.partyType, !!p.ownershipPercentage),
          nameEnglish: p.nameEnglish,
          nameThai: p.nameThai,
          identificationNumber: p.identificationNumber,
          ownershipPercentage: p.ownershipPercentage,
        })),
      ],
      attempts: [],
      cases: [],
      media: [],
    }
    save([a, ...load()])
    return a
  },
  async addSearchEvidence(id: string, v: SearchEvidenceInput) {
    await wait()
    const input = searchEvidenceSchema.parse(v)
    const all = load()
    const assignment = all.find((item) => item.id === id)
    if (!assignment) throw Error('Assignment not found')
    if (assignment.status === 'SUBMITTED') throw Error('Submitted assignments are read-only')
    if (!assignment.targets.some((target) => target.id === input.targetId))
      throw Error('Select a checked party from this assignment')
    if (!assignment.categories.includes(input.category))
      throw Error('Select a research category configured for this assignment')

    const attempt: SearchAttempt = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    assignment.attempts.push(attempt)
    save(all)
    return attempt
  },
  async addLegalCase(id: string, v: LegalCaseInput) {
    await wait()
    const input = legalCaseFormSchema.parse(v)
    const all = load()
    const assignment = all.find((item) => item.id === id)
    if (!assignment) throw Error('Assignment not found')
    if (assignment.status === 'SUBMITTED') throw Error('Submitted assignments are read-only')

    const attempt = assignment.attempts.find((item) => {
      if (
        item.result !== 'RECORD_FOUND' ||
        (item.category !== 'LITIGATION' && item.category !== 'BANKRUPTCY')
      )
        return false
      return createResearchCheckKey(item.targetId, item.category) === input.researchCheckKey
    })
    if (
      !attempt ||
      attempt.result !== 'RECORD_FOUND' ||
      (attempt.category !== 'LITIGATION' && attempt.category !== 'BANKRUPTCY')
    )
      throw Error('Select a record-found litigation or bankruptcy match')

    const legalCase = {
      ...input,
      id: crypto.randomUUID(),
      targetId: attempt.targetId,
      category: attempt.category,
      createdAt: new Date().toISOString(),
    }
    assignment.cases ??= []
    assignment.cases.push(legalCase)
    save(all)
    return legalCase
  },
  async addMediaFinding(id: string, v: MediaFindingInput) {
    await wait()
    const input = mediaFindingFormSchema.parse(v)
    const all = load()
    const assignment = all.find((item) => item.id === id)
    if (!assignment) throw Error('Assignment not found')
    if (assignment.status === 'SUBMITTED') throw Error('Submitted assignments are read-only')

    const attempt = assignment.attempts.find((item) => {
      if (
        item.result !== 'RECORD_FOUND' ||
        (item.category !== 'MEDIA_POSITIVE_NEUTRAL' && item.category !== 'MEDIA_NEGATIVE')
      )
        return false
      return createMediaResearchCheckKey(item.targetId, item.category) === input.researchCheckKey
    })
    if (
      !attempt ||
      attempt.result !== 'RECORD_FOUND' ||
      (attempt.category !== 'MEDIA_POSITIVE_NEUTRAL' && attempt.category !== 'MEDIA_NEGATIVE')
    )
      throw Error('Select a record-found media match')

    if (attempt.category === 'MEDIA_NEGATIVE' && input.sentiment !== 'NEGATIVE')
      throw Error('Negative-media checks require negative sentiment')
    if (attempt.category === 'MEDIA_POSITIVE_NEUTRAL' && input.sentiment === 'NEGATIVE')
      throw Error('Positive/neutral media checks cannot use negative sentiment')

    const finding: MediaFinding = {
      ...input,
      id: crypto.randomUUID(),
      targetId: attempt.targetId,
      category: attempt.category,
      createdAt: new Date().toISOString(),
    }
    assignment.media.push(finding)
    save(all)
    return finding
  },
  async submit(id: string) {
    await wait()
    const all = load()
    const a = all.find((x) => x.id === id)
    if (!a) throw Error('Not found')
    a.status = 'SUBMITTED'
    save(all)
    return a
  },
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function safeUrl(value: unknown) {
  const candidate = stringValue(value)
  return candidate && isHttpUrl(candidate) ? candidate : ''
}

function isSearchCategory(value: unknown): value is SearchCategory {
  return searchCategories.some((category) => category === value)
}

function isSearchResult(value: unknown): value is SearchResult {
  return searchResults.some((result) => result === value)
}

function isSearchLanguage(value: unknown): value is SearchLanguage {
  return searchLanguages.some((language) => language === value)
}

function isMediaSentiment(value: unknown): value is MediaSentiment {
  return value === 'POSITIVE' || value === 'NEUTRAL' || value === 'NEGATIVE'
}

function uniqueMediaChecks(attempts: SearchAttempt[]) {
  const checks = new Map<string, { targetId: string; category: MediaResearchCategory }>()
  for (const attempt of attempts) {
    if (attempt.category !== 'MEDIA_POSITIVE_NEUTRAL' && attempt.category !== 'MEDIA_NEGATIVE')
      continue
    const key = createMediaResearchCheckKey(attempt.targetId, attempt.category)
    checks.set(key, { targetId: attempt.targetId, category: attempt.category })
  }
  return [...checks.values()]
}
export const assignmentKeys = {
  all: ['assignments'] as const,
  lists: () => ['assignments', 'list'] as const,
  list: (filters: unknown) => ['assignments', 'list', filters] as const,
  detail: (id: string) => ['assignments', 'detail', id] as const,
  targets: (id: string) => ['assignments', 'detail', id, 'targets'] as const,
  checks: (id: string) => ['assignments', 'detail', id, 'checks'] as const,
  report: (id: string) => ['assignments', 'detail', id, 'report'] as const,
}
