import { describe, expect, it } from 'vitest'
import { legalCaseDefaults, legalCaseFormSchema } from './legal-case.schema'

const validCase = {
  ...legalCaseDefaults,
  researchCheckKey: 'target-1:LITIGATION',
  caseNumber: 'CIV-123/2026',
  courtName: 'Bangkok Civil Court',
  registrationDate: '2026-08-01',
  plaintiffs: 'Example Trading Co., Ltd.',
  defendants: 'Siam Example Co., Ltd.',
  caseBackground: 'A fictional contractual dispute used for testing.',
  petition: 'Payment of the disputed amount and costs.',
  verdictOutcome: 'Proceedings are pending.',
  sourceUrl: 'https://example.com/cases/CIV-123-2026',
  originalSourceDocument: 'court-record.pdf',
}

describe('legal case form schema', () => {
  it('accepts a complete structured case with an optional verdict date', () => {
    expect(legalCaseFormSchema.safeParse(validCase).success).toBe(true)
  })

  it('requires the case to be linked to a recorded legal check', () => {
    const result = legalCaseFormSchema.safeParse({ ...validCase, researchCheckKey: '' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Select the legal check this case belongs to')
  })

  it('rejects an invalid source URL', () => {
    expect(legalCaseFormSchema.safeParse({ ...validCase, sourceUrl: 'court portal' }).success).toBe(
      false,
    )
  })

  it('rejects non-HTTP source protocols', () => {
    expect(
      legalCaseFormSchema.safeParse({ ...validCase, sourceUrl: 'javascript:alert(1)' }).success,
    ).toBe(false)
  })
})
