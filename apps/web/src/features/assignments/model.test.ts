import { describe, expect, it } from 'vitest'
import {
  assignmentSchema,
  evidenceSchema,
  completion,
  submissionIssues,
  type Assignment,
} from './model'
describe('conditional evidence validation', () => {
  const base = {
    targetId: 't',
    category: 'LITIGATION' as const,
    sourceName: 'Court',
    sourceUrl: '',
    resultPageUrl: 'https://example.com',
    searchQuery: 'Acme',
    searchLanguage: 'EN' as const,
    searchedAt: '2026-08-09',
    result: 'NO_RESULT' as const,
    reason: '',
    evidence: ['proof.png'],
  }
  it('requires a no-result screenshot with exact copy', () => {
    const r = evidenceSchema.safeParse({ ...base, evidence: [] })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe(
      'Upload a screenshot showing the search query and no-result message.',
    )
  })
  it('requires source URL for a found record', () => {
    expect(
      evidenceSchema.safeParse({ ...base, result: 'RECORD_FOUND', sourceUrl: '' }).success,
    ).toBe(false)
  })
  it('requires reason and screenshot when unavailable', () => {
    expect(
      evidenceSchema.safeParse({ ...base, result: 'SOURCE_UNAVAILABLE', reason: '', evidence: [] })
        .success,
    ).toBe(false)
  })
})
describe('assignment schema', () => {
  it('requires shareholder ownership', () => {
    const r = assignmentSchema.safeParse({
      parties: [
        {
          targetType: 'SHAREHOLDER',
          nameEnglish: 'A',
          nameThai: '',
          identificationNumber: '',
          dateOfBirth: '',
          ownershipPercentage: '',
          relationshipNote: '',
        },
      ],
    })
    expect(r.success).toBe(false)
  })
})
describe('completion', () => {
  it('counts each language/category pair', () => {
    const a = {
      targets: [{ id: 't', targetType: 'SUBJECT_COMPANY', nameEnglish: 'A', nameThai: 'ก' }],
      categories: ['LITIGATION'],
      attempts: [
        {
          targetId: 't',
          category: 'LITIGATION',
          searchLanguage: 'EN',
          evidence: ['proof.png'],
          result: 'NO_RESULT',
          sourceName: 'x',
          sourceUrl: '',
          resultPageUrl: 'x',
          searchQuery: 'A',
          searchedAt: '2026-01-01',
          reason: '',
        },
      ],
      cases: [],
      media: [],
    } as unknown as Assignment
    expect(completion(a)).toEqual({ complete: 1, total: 2, percent: 50 })
    expect(submissionIssues(a)[0]).toContain('1 required')
  })
})

describe('submission issues for legal matches', () => {
  it('requires one structured case per legal check while deduplicating language attempts', () => {
    const legalAttempt = {
      category: 'LITIGATION',
      result: 'RECORD_FOUND',
      evidence: ['match.pdf'],
      sourceName: 'Court',
      sourceUrl: 'https://example.com/court',
      resultPageUrl: '',
      searchQuery: 'Example',
      searchedAt: '2026-08-01',
      reason: '',
    }
    const assignment = {
      targets: [],
      categories: [],
      attempts: [
        { ...legalAttempt, id: 'en', targetId: 'target-1', searchLanguage: 'EN' },
        { ...legalAttempt, id: 'th', targetId: 'target-1', searchLanguage: 'TH' },
        { ...legalAttempt, id: 'other', targetId: 'target-2', searchLanguage: 'EN' },
      ],
      cases: [{ researchCheckKey: 'target-1:LITIGATION' }],
      media: [],
    } as unknown as Assignment

    expect(submissionIssues(assignment)).toContain(
      '1 legal record match needs a linked structured case',
    )

    assignment.cases.push({
      researchCheckKey: 'target-2:LITIGATION',
    } as Assignment['cases'][number])
    expect(submissionIssues(assignment).some((issue) => issue.includes('legal record'))).toBe(false)
  })
})
