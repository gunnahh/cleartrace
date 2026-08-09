import type { Assignment, AssignmentInput, EvidenceInput } from '../features/assignments/model'
import { mapPartyTypeToBackend } from '../features/assignments/model'

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
    return (JSON.parse(localStorage.getItem(KEY) || 'null') as Assignment[]) || seed
  } catch {
    return seed
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
