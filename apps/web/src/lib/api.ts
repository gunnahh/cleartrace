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
  {
    id: 'demo-complete',
    referenceId: 'CTR-2026-015',
    status: 'READY_TO_SUBMIT',
    createdAt: '2026-08-10',
    nameEnglish: 'Aurora Pacific Logistics Co., Ltd.',
    nameThai: 'บริษัท ออโรร่า แปซิฟิก โลจิสติกส์ จำกัด',
    registrationNumber: '0105569123457',
    incorporationDate: '2019-03-18',
    formerNames: [
      { language: 'EN', name: 'Aurora Freight Solutions Co., Ltd.' },
      { language: 'TH', name: 'บริษัท ออโรร่า เฟรท โซลูชั่นส์ จำกัด' },
    ],
    addressEnglish: '99/12 Example Tower, Sathorn Road, Bangkok 10120, Thailand',
    addressThai: '99/12 อาคารตัวอย่าง ถนนสาทร กรุงเทพมหานคร 10120',
    website: 'https://example.com/aurora-logistics',
    registeredCapital: '100000000',
    paidUpCapital: '100000000',
    currency: 'THB',
    businessEnglish: 'International freight forwarding, warehousing, and logistics consulting',
    businessThai: 'บริการขนส่งสินค้าระหว่างประเทศ คลังสินค้า และที่ปรึกษาด้านโลจิสติกส์',
    clientName: 'Northstar Advisory (Thailand)',
    dueDate: '2026-08-20',
    researchFrom: '2016-08-10',
    researchTo: '2026-08-10',
    categories: ['LITIGATION', 'BANKRUPTCY', 'MEDIA_POSITIVE_NEUTRAL', 'MEDIA_NEGATIVE'],
    parties: [
      {
        partyType: 'INDIVIDUAL',
        nameEnglish: 'Pimchanok Rattanakul',
        nameThai: 'พิมพ์ชนก รัตนกุล',
        identificationNumber: '1103700123456',
        dateOfBirth: '1982-11-09',
        ownershipPercentage: '',
        relationshipNote: 'Managing director and authorised signatory',
      },
      {
        partyType: 'COMPANY',
        nameEnglish: 'Aurora Holdings (Thailand) Co., Ltd.',
        nameThai: 'บริษัท ออโรร่า โฮลดิ้งส์ (ประเทศไทย) จำกัด',
        identificationNumber: '0105567123499',
        dateOfBirth: '',
        ownershipPercentage: '75',
        relationshipNote: 'Major shareholder and ultimate parent',
      },
    ],
    targets: [
      {
        id: 'mock-subject',
        targetType: 'SUBJECT_COMPANY',
        nameEnglish: 'Aurora Pacific Logistics Co., Ltd.',
        nameThai: 'บริษัท ออโรร่า แปซิฟิก โลจิสติกส์ จำกัด',
        identificationNumber: '0105569123457',
      },
      {
        id: 'mock-director',
        targetType: 'DIRECTOR',
        nameEnglish: 'Pimchanok Rattanakul',
        nameThai: 'พิมพ์ชนก รัตนกุล',
        identificationNumber: '1103700123456',
      },
      {
        id: 'mock-parent',
        targetType: 'ULTIMATE_PARENT',
        nameEnglish: 'Aurora Holdings (Thailand) Co., Ltd.',
        nameThai: 'บริษัท ออโรร่า โฮลดิ้งส์ (ประเทศไทย) จำกัด',
        identificationNumber: '0105567123499',
        ownershipPercentage: '75',
      },
    ],
    attempts: createCompleteMockAttempts(),
    cases: [
      {
        id: 'mock-case-1',
        researchCheckKey: 'mock-subject:LITIGATION',
        targetId: 'mock-subject',
        category: 'LITIGATION',
        caseNumber: 'Civil Case No. B.E. 2567/1842',
        classification: 'CIVIL',
        courtLevel: 'FIRST_INSTANCE',
        courtName: 'Bangkok South Civil Court',
        originatingCourt: '',
        registrationDate: '2024-04-22',
        targetRole: 'DEFENDANT',
        plaintiffs: 'Example Commercial Bank Public Company Limited',
        defendants: 'Aurora Pacific Logistics Co., Ltd.',
        caseBackground: 'A fictional contractual dispute concerning logistics service fees.',
        petition: 'The plaintiff claims THB 2,450,000 plus contractual interest and costs.',
        verdictDate: '2025-01-17',
        verdictStatus: 'FINAL',
        verdictOutcome: 'The parties reached a settlement and the court dismissed the case.',
        relatedCases: 'None identified',
        sourceUrl: 'https://example.com/court/mock-case-2567-1842',
        originalSourceDocument: 'mock-court-record-th.pdf',
        englishTranslatedDocument: 'mock-court-record-en.pdf',
        createdAt: '2026-08-10T03:15:00.000Z',
      },
    ],
    media: [
      {
        id: 'mock-media-1',
        researchCheckKey: 'mock-subject:MEDIA_NEGATIVE',
        targetId: 'mock-subject',
        category: 'MEDIA_NEGATIVE',
        articleTitle: 'Logistics operator responds to fictional delivery-delay complaints',
        publisher: 'Bangkok Business Example',
        publishedAt: '2025-09-14',
        sentiment: 'NEGATIVE',
        summaryOriginal:
          'บทความตัวอย่างกล่าวถึงข้อร้องเรียนเรื่องความล่าช้าในการจัดส่ง โดยบริษัทชี้แจงว่าเกิดจากเหตุขัดข้องชั่วคราว',
        summaryEnglish:
          'The fictional article reports delivery-delay complaints. The company attributed them to a temporary operational disruption and stated that remediation was completed.',
        sourceUrl: 'https://example.com/news/aurora-delivery-delay',
        supportingDocument: 'mock-negative-media-article.pdf',
        createdAt: '2026-08-10T03:20:00.000Z',
      },
    ],
  },
]
function load() {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!Array.isArray(parsed)) return seed
    const stored = parsed
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map(normalizeAssignment)
    const missingDemoAssignments = seed.filter(
      (demo) => !stored.some((assignment) => assignment.id === demo.id),
    )
    return [...stored, ...missingDemoAssignments]
  } catch {
    return seed
  }
}

function createCompleteMockAttempts(): SearchAttempt[] {
  const targets = [
    {
      id: 'mock-subject',
      en: 'Aurora Pacific Logistics Co., Ltd.',
      th: 'บริษัท ออโรร่า แปซิฟิก โลจิสติกส์ จำกัด',
    },
    { id: 'mock-director', en: 'Pimchanok Rattanakul', th: 'พิมพ์ชนก รัตนกุล' },
    {
      id: 'mock-parent',
      en: 'Aurora Holdings (Thailand) Co., Ltd.',
      th: 'บริษัท ออโรร่า โฮลดิ้งส์ (ประเทศไทย) จำกัด',
    },
  ]
  const categories: SearchCategory[] = [
    'LITIGATION',
    'BANKRUPTCY',
    'MEDIA_POSITIVE_NEUTRAL',
    'MEDIA_NEGATIVE',
  ]
  let index = 0
  return targets.flatMap((target) =>
    categories.flatMap((category) =>
      (['EN', 'TH'] as const).map((searchLanguage) => {
        index += 1
        const isLegalMatch =
          target.id === 'mock-subject' && category === 'LITIGATION' && searchLanguage === 'EN'
        const isMediaMatch =
          target.id === 'mock-subject' && category === 'MEDIA_NEGATIVE' && searchLanguage === 'EN'
        const result: SearchResult = isLegalMatch || isMediaMatch ? 'RECORD_FOUND' : 'NO_RESULT'
        const query = searchLanguage === 'EN' ? target.en : target.th
        const evidenceName = `mock-search-${index}.png`
        return {
          id: `mock-attempt-${index}`,
          targetId: target.id,
          category,
          sourceName: category.startsWith('MEDIA')
            ? 'Example News Archive'
            : 'Example Public Records Portal',
          sourceUrl:
            result === 'RECORD_FOUND' ? `https://example.com/source/mock-result-${index}` : '',
          resultPageUrl:
            result === 'NO_RESULT' ? `https://example.com/search/mock-no-result-${index}` : '',
          searchQuery: `"${query}"`,
          searchLanguage,
          searchedAt: '2026-08-10',
          result,
          reason: '',
          evidence: [evidenceName],
          evidencePreviews: [
            {
              name: evidenceName,
              dataUrl: createMockScreenshot({
                sourceName: category.startsWith('MEDIA')
                  ? 'Example News Archive'
                  : 'Example Public Records Portal',
                query,
                category,
                result,
                searchLanguage,
              }),
            },
          ],
          notesOriginal: searchLanguage === 'TH' ? `ผลการค้นหาตัวอย่างสำหรับ ${query}` : '',
          translationEnglish: searchLanguage === 'TH' ? `Mock search result for ${target.en}` : '',
          createdAt: `2026-08-10T02:${String(index).padStart(2, '0')}:00.000Z`,
        }
      }),
    ),
  )
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
  const evidence = Array.isArray(value.evidence)
    ? value.evidence.filter((item): item is string => typeof item === 'string')
    : []
  const storedPreviews = Array.isArray(value.evidencePreviews)
    ? value.evidencePreviews.filter(isEvidencePreview)
    : []
  const evidencePreviews =
    storedPreviews.length > 0 || assignment.id !== 'demo-complete'
      ? storedPreviews
      : evidence
          .filter((name) => /^mock-search-\d+\.png$/i.test(name))
          .map((name) => ({
            name,
            dataUrl: createMockScreenshot({
              sourceName: stringValue(value.sourceName),
              query: stringValue(value.searchQuery),
              category,
              result,
              searchLanguage,
            }),
          }))
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
    evidence,
    evidencePreviews,
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
  async updateSearchEvidence(id: string, attemptId: string, v: SearchEvidenceInput) {
    await wait()
    const input = searchEvidenceSchema.parse(v)
    const all = load()
    const assignment = writableAssignment(all, id)
    const index = assignment.attempts.findIndex((attempt) => attempt.id === attemptId)
    if (index < 0) throw Error('Search evidence not found')
    assignment.attempts[index] = { ...assignment.attempts[index], ...input }
    save(all)
    return assignment.attempts[index]
  },
  async deleteSearchEvidence(id: string, attemptId: string) {
    await wait()
    const all = load()
    const assignment = writableAssignment(all, id)
    const attempt = assignment.attempts.find((item) => item.id === attemptId)
    if (!attempt) throw Error('Search evidence not found')
    const checkKey = `${attempt.targetId}:${attempt.category}`
    assignment.attempts = assignment.attempts.filter((item) => item.id !== attemptId)
    if (
      !assignment.attempts.some(
        (item) =>
          `${item.targetId}:${item.category}` === checkKey && item.result === 'RECORD_FOUND',
      )
    ) {
      assignment.cases = assignment.cases.filter((item) => item.researchCheckKey !== checkKey)
      assignment.media = assignment.media.filter((item) => item.researchCheckKey !== checkKey)
    }
    save(all)
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
  async updateLegalCase(id: string, caseId: string, v: LegalCaseInput) {
    await wait()
    const input = legalCaseFormSchema.parse(v)
    const all = load()
    const assignment = writableAssignment(all, id)
    const index = assignment.cases.findIndex((item) => item.id === caseId)
    if (index < 0) throw Error('Legal case not found')
    const attempt = assignment.attempts.find(
      (item) =>
        item.result === 'RECORD_FOUND' &&
        (item.category === 'LITIGATION' || item.category === 'BANKRUPTCY') &&
        createResearchCheckKey(item.targetId, item.category) === input.researchCheckKey,
    )
    if (!attempt || (attempt.category !== 'LITIGATION' && attempt.category !== 'BANKRUPTCY'))
      throw Error('Select a record-found litigation or bankruptcy match')
    assignment.cases[index] = {
      ...assignment.cases[index],
      ...input,
      targetId: attempt.targetId,
      category: attempt.category,
    }
    save(all)
    return assignment.cases[index]
  },
  async deleteLegalCase(id: string, caseId: string) {
    await wait()
    const all = load()
    const assignment = writableAssignment(all, id)
    if (!assignment.cases.some((item) => item.id === caseId)) throw Error('Legal case not found')
    assignment.cases = assignment.cases.filter((item) => item.id !== caseId)
    save(all)
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
  async updateMediaFinding(id: string, findingId: string, v: MediaFindingInput) {
    await wait()
    const input = mediaFindingFormSchema.parse(v)
    const all = load()
    const assignment = writableAssignment(all, id)
    const index = assignment.media.findIndex((item) => item.id === findingId)
    if (index < 0) throw Error('Media finding not found')
    const attempt = assignment.attempts.find(
      (item) =>
        item.result === 'RECORD_FOUND' &&
        (item.category === 'MEDIA_POSITIVE_NEUTRAL' || item.category === 'MEDIA_NEGATIVE') &&
        createMediaResearchCheckKey(item.targetId, item.category) === input.researchCheckKey,
    )
    if (
      !attempt ||
      (attempt.category !== 'MEDIA_POSITIVE_NEUTRAL' && attempt.category !== 'MEDIA_NEGATIVE')
    )
      throw Error('Select a record-found media match')
    assignment.media[index] = {
      ...assignment.media[index],
      ...input,
      targetId: attempt.targetId,
      category: attempt.category,
    }
    save(all)
    return assignment.media[index]
  },
  async deleteMediaFinding(id: string, findingId: string) {
    await wait()
    const all = load()
    const assignment = writableAssignment(all, id)
    if (!assignment.media.some((item) => item.id === findingId))
      throw Error('Media finding not found')
    assignment.media = assignment.media.filter((item) => item.id !== findingId)
    save(all)
  },
  async submit(id: string) {
    await wait()
    const all = load()
    const a = all.find((x) => x.id === id)
    if (!a) throw Error('Not found')
    a.status = 'SUBMITTED'
    a.submittedAt = new Date().toISOString()
    save(all)
    return a
  },
}

function writableAssignment(all: Assignment[], id: string) {
  const assignment = all.find((item) => item.id === id)
  if (!assignment) throw Error('Assignment not found')
  if (assignment.status === 'SUBMITTED') throw Error('Submitted assignments are read-only')
  return assignment
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

function isEvidencePreview(value: unknown): value is { name: string; dataUrl: string } {
  if (!value || typeof value !== 'object') return false
  const preview = value as Record<string, unknown>
  return (
    typeof preview.name === 'string' &&
    typeof preview.dataUrl === 'string' &&
    preview.dataUrl.startsWith('data:image/')
  )
}

function createMockScreenshot({
  sourceName,
  query,
  category,
  result,
  searchLanguage,
}: {
  sourceName: string
  query: string
  category: SearchCategory
  result: SearchResult
  searchLanguage: SearchLanguage
}) {
  const resultLabel = result === 'RECORD_FOUND' ? '1 matching record found' : 'No records found'
  const resultColor = result === 'RECORD_FOUND' ? '#18864b' : '#667085'
  const safe = (text: string) =>
    text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
    <rect width="1200" height="720" fill="#f5f6f8"/>
    <rect x="48" y="38" width="1104" height="644" rx="12" fill="white" stroke="#d8dce3"/>
    <rect x="48" y="38" width="1104" height="76" rx="12" fill="#292a3a"/>
    <text x="82" y="86" fill="white" font-family="Arial, sans-serif" font-size="26" font-weight="700">${safe(sourceName)}</text>
    <text x="82" y="164" fill="#667085" font-family="Arial, sans-serif" font-size="18">SEARCH CATEGORY</text>
    <text x="82" y="197" fill="#252536" font-family="Arial, sans-serif" font-size="24" font-weight="700">${safe(category.replaceAll('_', ' '))}</text>
    <text x="1010" y="185" fill="#667085" font-family="Arial, sans-serif" font-size="20">${searchLanguage}</text>
    <rect x="82" y="235" width="1036" height="64" rx="8" fill="#fafafd" stroke="#cfd3da"/>
    <text x="106" y="276" fill="#252536" font-family="Arial, sans-serif" font-size="22">${safe(query)}</text>
    <rect x="82" y="345" width="1036" height="190" rx="10" fill="#fafafa" stroke="#e1e3e8"/>
    <circle cx="126" cy="397" r="13" fill="${resultColor}"/>
    <text x="158" y="406" fill="${resultColor}" font-family="Arial, sans-serif" font-size="28" font-weight="700">${resultLabel}</text>
    <text x="126" y="459" fill="#667085" font-family="Arial, sans-serif" font-size="20">Search completed on 10 August 2026</text>
    <text x="126" y="497" fill="#667085" font-family="Arial, sans-serif" font-size="18">Fictional screenshot generated for ClearTrace demonstration.</text>
    <text x="82" y="631" fill="#98a2b3" font-family="Arial, sans-serif" font-size="16">DEMO EVIDENCE · NOT A REAL SEARCH RESULT</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
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
