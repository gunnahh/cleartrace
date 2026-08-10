import { z } from 'zod'

export const searchCategories = [
  'LITIGATION',
  'BANKRUPTCY',
  'MEDIA_POSITIVE_NEUTRAL',
  'MEDIA_NEGATIVE',
] as const

export const searchResults = ['RECORD_FOUND', 'NO_RESULT', 'SOURCE_UNAVAILABLE'] as const
export const searchLanguages = ['EN', 'TH', 'OTHER'] as const

export type SearchCategory = (typeof searchCategories)[number]
export type SearchResult = (typeof searchResults)[number]
export type SearchLanguage = (typeof searchLanguages)[number]

const requiredText = (message: string) => z.string().trim().min(1, message)
const optionalHttpUrl = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => !value || isHttpUrl(value), `${label} must use HTTP or HTTPS`)
const evidenceFileName = requiredText('Select an evidence file').refine(
  (value) => /\.(png|jpe?g|pdf)$/i.test(value),
  'Select a PNG, JPG, or PDF file',
)

export const searchEvidenceSchema = z
  .object({
    targetId: requiredText('Select a checked party'),
    category: z.enum(searchCategories),
    sourceName: requiredText('Source name is required'),
    sourceUrl: optionalHttpUrl('Source URL'),
    resultPageUrl: optionalHttpUrl('Result-page URL'),
    searchQuery: requiredText('Search query is required'),
    searchLanguage: z.enum(searchLanguages),
    searchedAt: requiredText('Search date is required').regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Enter a valid search date',
    ),
    result: z.enum(searchResults),
    reason: z.string().trim(),
    evidence: z.array(evidenceFileName),
    notesOriginal: z.string().trim(),
    translationEnglish: z.string().trim(),
  })
  .superRefine((value, context) => {
    if (value.result === 'NO_RESULT' && !value.resultPageUrl)
      context.addIssue({
        code: 'custom',
        path: ['resultPageUrl'],
        message: 'Result-page URL is required for a no-result search',
      })

    if (value.result === 'RECORD_FOUND' && !value.sourceUrl)
      context.addIssue({
        code: 'custom',
        path: ['sourceUrl'],
        message: 'Source URL is required for a record found',
      })

    if (value.result === 'SOURCE_UNAVAILABLE' && !value.reason)
      context.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'Explain why the source was unavailable',
      })

    if (value.evidence.length === 0)
      context.addIssue({
        code: 'custom',
        path: ['evidence'],
        message:
          value.result === 'NO_RESULT'
            ? 'Upload a screenshot showing the search query and no-result message.'
            : value.result === 'SOURCE_UNAVAILABLE'
              ? 'Upload a screenshot showing the unavailable page.'
              : 'Upload a screenshot or source document.',
      })
  })

export type SearchEvidenceInput = z.infer<typeof searchEvidenceSchema>

export type SearchAttempt = SearchEvidenceInput & {
  id: string
  createdAt: string
}

export type SearchEvidencePreset = Partial<
  Pick<SearchEvidenceInput, 'targetId' | 'category' | 'result' | 'searchLanguage'>
>

export function createSearchEvidenceDefaults(
  preset: SearchEvidencePreset = {},
): SearchEvidenceInput {
  return {
    targetId: preset.targetId ?? '',
    category: preset.category ?? 'LITIGATION',
    sourceName: '',
    sourceUrl: '',
    resultPageUrl: '',
    searchQuery: '',
    searchLanguage: preset.searchLanguage ?? 'EN',
    searchedAt: new Date().toISOString().slice(0, 10),
    result: preset.result ?? 'NO_RESULT',
    reason: '',
    evidence: [],
    notesOriginal: '',
    translationEnglish: '',
  }
}

export function searchCategoryLabel(category: SearchCategory) {
  return category
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase())
}

function isHttpUrl(value: string) {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
