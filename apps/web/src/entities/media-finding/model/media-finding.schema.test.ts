import { describe, expect, it } from 'vitest'
import { mediaFindingDefaults, mediaFindingFormSchema } from './media-finding.schema'

const validFinding = {
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

describe('mediaFindingFormSchema', () => {
  it('accepts a complete structured finding', () => {
    expect(mediaFindingFormSchema.safeParse(validFinding).success).toBe(true)
  })

  it('requires summaries, an HTTP source, and a supported document', () => {
    const result = mediaFindingFormSchema.safeParse({
      ...validFinding,
      summaryEnglish: '',
      sourceUrl: 'javascript:alert(1)',
      supportingDocument: 'article.exe',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining(['summaryEnglish', 'sourceUrl', 'supportingDocument']),
    )
  })

  it('keeps sentiment aligned with the linked media category', () => {
    expect(
      mediaFindingFormSchema.safeParse({ ...validFinding, sentiment: 'NEUTRAL' }).success,
    ).toBe(false)
    expect(
      mediaFindingFormSchema.safeParse({
        ...validFinding,
        researchCheckKey: 'target-1:MEDIA_POSITIVE_NEUTRAL',
        sentiment: 'NEGATIVE',
      }).success,
    ).toBe(false)
  })
})
