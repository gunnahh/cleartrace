import { describe, expect, it } from 'vitest'
import { createSearchEvidenceDefaults, searchEvidenceSchema } from './search-attempt.schema'

describe('searchEvidenceSchema', () => {
  it('validates a complete record-found search', () => {
    const result = searchEvidenceSchema.safeParse({
      ...createSearchEvidenceDefaults({ result: 'RECORD_FOUND' }),
      targetId: 'target-1',
      sourceName: 'Court archive',
      sourceUrl: 'https://example.com/case',
      searchQuery: 'Example Company',
      evidence: ['case.pdf'],
    })

    expect(result.success).toBe(true)
  })

  it('rejects unsafe URLs and unsupported evidence files', () => {
    const result = searchEvidenceSchema.safeParse({
      ...createSearchEvidenceDefaults({ result: 'RECORD_FOUND' }),
      targetId: 'target-1',
      sourceName: 'Court archive',
      sourceUrl: 'javascript:alert(1)',
      searchQuery: 'Example Company',
      evidence: ['case.exe'],
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining(['sourceUrl', 'evidence']),
    )
  })
})
