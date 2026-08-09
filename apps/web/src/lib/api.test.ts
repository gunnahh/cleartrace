import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './api'
import { legalCaseDefaults, type LegalCaseInput } from '../entities/legal-case'

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
        attempts: [
          {
            id: 'attempt-1',
            targetId: 'target-1',
            category: 'LITIGATION',
            result: 'RECORD_FOUND',
          },
        ],
        cases: [],
      },
    ]),
  )
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
