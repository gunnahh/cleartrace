import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './api'
import { legalCaseDefaults, type LegalCaseInput } from '../entities/legal-case'
import { mediaFindingDefaults } from '../entities/media-finding'
import { createSearchEvidenceDefaults } from '../entities/search-attempt'

const storageKey = 'cleartrace.assignments.v1'
const legalCase: LegalCaseInput = {
  ...legalCaseDefaults,
  researchCheckKey: 'target-1:LITIGATION',
  caseNumber: 'CIV-123/2026',
  courtName: 'Bangkok Civil Court',
  registrationDate: '2026-08-01',
  plaintiffs: 'Example Trading Co., Ltd.',
  defendants: 'Narin Sample',
  caseBackground: 'A fictional contractual dispute.',
  petition: 'Payment and legal costs.',
  verdictOutcome: 'Proceedings are pending.',
  sourceUrl: 'https://example.com/cases/CIV-123-2026',
  originalSourceDocument: 'court-record.pdf',
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  localStorage.setItem(
    storageKey,
    JSON.stringify([
      {
        id: 'assignment-1',
        status: 'IN_PROGRESS',
        createdAt: '2026-08-01T00:00:00.000Z',
        categories: ['LITIGATION', 'MEDIA_NEGATIVE'],
        targets: [
          {
            id: 'target-1',
            targetType: 'SUBJECT_COMPANY',
            nameEnglish: 'Example Co., Ltd.',
            nameThai: 'บริษัท ตัวอย่าง จำกัด',
          },
        ],
        attempts: [
          {
            id: 'attempt-1',
            targetId: 'target-1',
            category: 'LITIGATION',
            result: 'RECORD_FOUND',
          },
        ],
        cases: [],
        media: [],
      },
    ]),
  )
})

describe('mock search evidence persistence', () => {
  it('validates and persists evidence, original notes, and English translation', async () => {
    const request = api.addSearchEvidence('assignment-1', {
      ...createSearchEvidenceDefaults({
        targetId: 'target-1',
        category: 'LITIGATION',
        result: 'RECORD_FOUND',
      }),
      sourceName: 'Court archive',
      sourceUrl: 'https://example.com/court/case-1',
      searchQuery: 'Example Co., Ltd.',
      evidence: ['court-case.pdf'],
      notesOriginal: 'หมายเหตุ',
      translationEnglish: 'Translated note',
    })
    await vi.runAllTimersAsync()
    const saved = await request

    expect(saved).toEqual(
      expect.objectContaining({
        targetId: 'target-1',
        result: 'RECORD_FOUND',
        notesOriginal: 'หมายเหตุ',
        translationEnglish: 'Translated note',
      }),
    )

    const detailRequest = api.get('assignment-1')
    await vi.runAllTimersAsync()
    const assignment = await detailRequest
    expect(assignment.attempts).toHaveLength(2)
  })

  it('rejects evidence for an unknown party', async () => {
    const rejection = expect(
      api.addSearchEvidence('assignment-1', {
        ...createSearchEvidenceDefaults({
          targetId: 'unknown-target',
          category: 'LITIGATION',
          result: 'RECORD_FOUND',
        }),
        sourceName: 'Court archive',
        sourceUrl: 'https://example.com/court/case-1',
        searchQuery: 'Unknown party',
        evidence: ['court-case.pdf'],
      }),
    ).rejects.toThrow('Select a checked party from this assignment')
    await vi.runAllTimersAsync()
    await rejection
  })
})

afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

describe('mock legal case persistence', () => {
  it('supports multiple structured cases for the same recorded legal match', async () => {
    const first = api.addLegalCase('assignment-1', legalCase)
    await vi.runAllTimersAsync()
    await first

    const second = api.addLegalCase('assignment-1', {
      ...legalCase,
      caseNumber: 'CIV-456/2026',
    })
    await vi.runAllTimersAsync()
    await second

    const detail = api.get('assignment-1')
    await vi.runAllTimersAsync()
    const assignment = await detail

    expect(assignment.cases).toHaveLength(2)
    expect(assignment.cases.map((item) => item.caseNumber)).toEqual([
      'CIV-123/2026',
      'CIV-456/2026',
    ])
  })

  it('normalizes assignments and legal cases saved by the previous local schema', async () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify([
        {
          id: 'legacy-assignment',
          createdAt: '2026-01-01',
          targets: [],
          attempts: [],
          cases: [
            {
              caseNumber: 'LEGACY-001',
              targetRole: 'DEFENDANT',
              courtName: 'Example Court',
              verdictOutcome: 'Closed',
              sourceUrl: 'javascript:alert(1)',
            },
          ],
        },
      ]),
    )

    const detail = api.get('legacy-assignment')
    await vi.runAllTimersAsync()
    const assignment = await detail

    expect(assignment.cases[0]).toEqual(
      expect.objectContaining({
        id: 'legacy-legacy-assignment-0',
        caseNumber: 'LEGACY-001',
        classification: 'CIVIL',
        researchCheckKey: '',
        sourceUrl: '',
      }),
    )
  })
})

describe('mock media finding persistence', () => {
  it('persists multiple findings linked to a recorded media match', async () => {
    const evidenceRequest = api.addSearchEvidence('assignment-1', {
      ...createSearchEvidenceDefaults({
        targetId: 'target-1',
        category: 'MEDIA_NEGATIVE',
        result: 'RECORD_FOUND',
      }),
      sourceName: 'News archive',
      sourceUrl: 'https://example.com/news/search-result',
      searchQuery: 'Example Co., Ltd.',
      evidence: ['search-result.png'],
    })
    await vi.runAllTimersAsync()
    await evidenceRequest

    const finding = {
      ...mediaFindingDefaults,
      researchCheckKey: 'target-1:MEDIA_NEGATIVE',
      articleTitle: 'Example investigation',
      publisher: 'Example News',
      publishedAt: '2026-08-01',
      sentiment: 'NEGATIVE' as const,
      summaryOriginal: 'สรุปข่าวตัวอย่าง',
      summaryEnglish: 'An example news summary.',
      sourceUrl: 'https://example.com/news/example',
      supportingDocument: 'article.pdf',
    }
    const firstRequest = api.addMediaFinding('assignment-1', finding)
    await vi.runAllTimersAsync()
    await firstRequest
    const secondRequest = api.addMediaFinding('assignment-1', {
      ...finding,
      articleTitle: 'Follow-up investigation',
    })
    await vi.runAllTimersAsync()
    await secondRequest

    const detailRequest = api.get('assignment-1')
    await vi.runAllTimersAsync()
    const assignment = await detailRequest
    expect(assignment.media.map((item) => item.articleTitle)).toEqual([
      'Example investigation',
      'Follow-up investigation',
    ])
  })

  it('normalizes legacy media and removes unsafe source URLs', async () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify([
        {
          id: 'legacy-media-assignment',
          createdAt: '2026-01-01',
          targets: [],
          attempts: [],
          cases: [],
          media: [
            {
              title: 'Legacy title',
              sentiment: 'NEGATIVE',
              publisher: 'Legacy publisher',
              summaryEnglish: 'Legacy summary',
              sourceUrl: 'javascript:alert(1)',
            },
          ],
        },
      ]),
    )

    const detailRequest = api.get('legacy-media-assignment')
    await vi.runAllTimersAsync()
    const assignment = await detailRequest

    expect(assignment.media[0]).toEqual(
      expect.objectContaining({
        id: 'legacy-media-legacy-media-assignment-0',
        articleTitle: 'Legacy title',
        sentiment: 'NEGATIVE',
        sourceUrl: '',
      }),
    )
  })
})
