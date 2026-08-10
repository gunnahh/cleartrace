import { z } from 'zod'

export const mediaResearchCategories = ['MEDIA_POSITIVE_NEUTRAL', 'MEDIA_NEGATIVE'] as const
export const mediaSentiments = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'] as const

export type MediaResearchCategory = (typeof mediaResearchCategories)[number]
export type MediaSentiment = (typeof mediaSentiments)[number]

const requiredText = (message: string) => z.string().trim().min(1, message)
const sourceUrl = requiredText('Source URL is required')
  .url('Enter a valid source URL')
  .refine(isHttpUrl, 'Source URL must use HTTP or HTTPS')
const documentName = requiredText('Attach a supporting screenshot or document').refine(
  (value) => /\.(png|jpe?g|pdf)$/i.test(value),
  'Select a PNG, JPG, or PDF document',
)

export const mediaFindingFormSchema = z
  .object({
    researchCheckKey: requiredText('Select the media check this finding belongs to'),
    articleTitle: requiredText('Article title is required'),
    publisher: requiredText('Publisher is required'),
    publishedAt: requiredText('Publication date is required').regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Enter a valid publication date',
    ),
    sentiment: z.enum(mediaSentiments),
    summaryOriginal: requiredText('Original-language summary is required'),
    summaryEnglish: requiredText('English summary is required'),
    sourceUrl,
    supportingDocument: documentName,
  })
  .superRefine((value, context) => {
    if (value.researchCheckKey.endsWith(':MEDIA_NEGATIVE') && value.sentiment !== 'NEGATIVE')
      context.addIssue({
        code: 'custom',
        path: ['sentiment'],
        message: 'Negative-media checks require negative sentiment',
      })
    if (
      value.researchCheckKey.endsWith(':MEDIA_POSITIVE_NEUTRAL') &&
      value.sentiment === 'NEGATIVE'
    )
      context.addIssue({
        code: 'custom',
        path: ['sentiment'],
        message: 'Positive/neutral media checks cannot use negative sentiment',
      })
  })

export type MediaFindingInput = z.infer<typeof mediaFindingFormSchema>

export type MediaFinding = MediaFindingInput & {
  id: string
  targetId: string
  category: MediaResearchCategory
  createdAt: string
}

export const mediaFindingDefaults: MediaFindingInput = {
  researchCheckKey: '',
  articleTitle: '',
  publisher: '',
  publishedAt: '',
  sentiment: 'NEUTRAL',
  summaryOriginal: '',
  summaryEnglish: '',
  sourceUrl: '',
  supportingDocument: '',
}

export function createMediaResearchCheckKey(targetId: string, category: MediaResearchCategory) {
  return `${targetId}:${category}`
}

export function mediaFindingLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase())
}

export function isMediaResearchCategory(value: string): value is MediaResearchCategory {
  return mediaResearchCategories.some((category) => category === value)
}

function isHttpUrl(value: string) {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
