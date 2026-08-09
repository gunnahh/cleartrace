import { describe, expect, it } from 'vitest'
import { validateCheckCompletion, validateFile } from './rules.js'

describe('research check completion', () => {
  it('rejects NO_RESULT without screenshot evidence', () => {
    expect(() =>
      validateCheckCompletion(
        { category: 'BANKRUPTCY', searchAttempts: [], legalCases: [] },
        'NO_RESULT',
      ),
    ).toThrow('Upload a screenshot')
  })
  it('accepts NO_RESULT with a screenshot', () => {
    expect(() =>
      validateCheckCompletion(
        {
          category: 'BANKRUPTCY',
          searchAttempts: [{ result: 'NO_RESULT', evidence: [{ mimeType: 'image/png' }] }],
          legalCases: [],
        },
        'NO_RESULT',
      ),
    ).not.toThrow()
  })
  it('rejects a legal match without structured case data', () => {
    expect(() =>
      validateCheckCompletion(
        { category: 'CIVIL', searchAttempts: [], legalCases: [] },
        'MATCH_FOUND',
      ),
    ).toThrow('structured legal case')
  })
})

describe('upload validation', () => {
  it('checks signatures instead of trusting MIME headers', () => {
    expect(() => validateFile(new Uint8Array([1, 2, 3, 4]), 'image/png', 4, 10)).toThrow(
      'Only valid',
    )
    expect(() =>
      validateFile(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), 'image/png', 4, 10),
    ).not.toThrow()
  })
})
