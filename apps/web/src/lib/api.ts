import type { Assignment, AssignmentInput, EvidenceInput } from '../features/assignments/model'
import { mapPartyTypeToBackend } from '../features/assignments/model'
import {
  createResearchCheckKey,
  isHttpUrl,
  legalCaseDefaults,
  legalCaseFormSchema,
  type LegalCase,
  type LegalCaseInput,
} from '../entities/legal-case'

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
  return {
    ...assignment,
    categories: Array.isArray(value.categories) ? assignment.categories : [],
    formerNames: Array.isArray(value.formerNames) ? assignment.formerNames : [],
    parties: Array.isArray(value.parties) ? assignment.parties : [],
    targets: Array.isArray(value.targets) ? assignment.targets : [],
    attempts: Array.isArray(value.attempts) ? assignment.attempts : [],
    media: Array.isArray(value.media) ? assignment.media : [],
    cases: storedCases
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item, index) => normalizeLegalCase(assignment, item, index)),
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
  async evidence(id: string, v: EvidenceInput) {
    await wait()
    const all = load()
    const a = all.find((x) => x.id === id)
    if (!a) throw Error('Not found')
    a.attempts.push({ ...v, id: crypto.randomUUID() })
    save(all)
    return a
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
export const assignmentKeys = {
  all: ['assignments'] as const,
  lists: () => ['assignments', 'list'] as const,
  list: (filters: unknown) => ['assignments', 'list', filters] as const,
  detail: (id: string) => ['assignments', 'detail', id] as const,
  targets: (id: string) => ['assignments', 'detail', id, 'targets'] as const,
  checks: (id: string) => ['assignments', 'detail', id, 'checks'] as const,
  report: (id: string) => ['assignments', 'detail', id, 'report'] as const,
}
