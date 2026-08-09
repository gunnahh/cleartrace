import { z } from 'zod'

export const legalTargetRoles = [
  'PLAINTIFF',
  'DEFENDANT',
  'DEBTOR',
  'CREDITOR',
  'APPELLANT',
  'APPELLEE',
  'OTHER',
] as const

export const legalCaseClassifications = [
  'CIVIL',
  'CRIMINAL',
  'BANKRUPTCY',
  'REHABILITATION',
  'ADMINISTRATIVE',
  'OTHER',
] as const

export const courtLevels = ['FIRST_INSTANCE', 'APPEAL', 'SUPREME', 'SPECIALIZED', 'OTHER'] as const

export const verdictStatuses = [
  'PENDING',
  'INTERIM',
  'FINAL',
  'APPEALED',
  'CLOSED',
  'UNKNOWN',
] as const

export const legalResearchCategories = ['LITIGATION', 'BANKRUPTCY'] as const
export type LegalResearchCategory = (typeof legalResearchCategories)[number]

const requiredText = (message: string) => z.string().trim().min(1, message)
const isoDate = (message: string) =>
  requiredText(message).regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
const documentName = requiredText('Attach the original source document').refine(
  (value) => /\.(png|jpe?g|pdf)$/i.test(value),
  'Select a PNG, JPG, or PDF document',
)
const httpUrl = z
  .string()
  .trim()
  .url('Enter a valid source URL')
  .refine(isHttpUrl, 'Source URL must use HTTP or HTTPS')

export const legalCaseFormSchema = z.object({
  researchCheckKey: requiredText('Select the legal check this case belongs to'),
  caseNumber: requiredText('Case number is required'),
  classification: z.enum(legalCaseClassifications),
  courtLevel: z.enum(courtLevels),
  courtName: requiredText('Court name is required'),
  originatingCourt: z.string().trim(),
  registrationDate: isoDate('Registration date is required'),
  targetRole: z.enum(legalTargetRoles),
  plaintiffs: requiredText('Add at least one plaintiff or appellant'),
  defendants: requiredText('Add at least one defendant or appellee'),
  caseBackground: requiredText('Case background is required'),
  petition: requiredText('Petition or claim summary is required'),
  verdictDate: z.union([
    z.literal(''),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date'),
  ]),
  verdictStatus: z.enum(verdictStatuses),
  verdictOutcome: requiredText('Verdict outcome is required'),
  relatedCases: z.string().trim(),
  sourceUrl: httpUrl,
  originalSourceDocument: documentName,
  englishTranslatedDocument: z
    .string()
    .trim()
    .refine(
      (value) => !value || /\.(png|jpe?g|pdf)$/i.test(value),
      'Select a PNG, JPG, or PDF document',
    ),
})

export type LegalCaseInput = z.infer<typeof legalCaseFormSchema>

export type LegalCase = LegalCaseInput & {
  id: string
  targetId: string
  category: LegalResearchCategory
  createdAt: string
}

export const legalCaseDefaults: LegalCaseInput = {
  researchCheckKey: '',
  caseNumber: '',
  classification: 'CIVIL',
  courtLevel: 'FIRST_INSTANCE',
  courtName: '',
  originatingCourt: '',
  registrationDate: '',
  targetRole: 'DEFENDANT',
  plaintiffs: '',
  defendants: '',
  caseBackground: '',
  petition: '',
  verdictDate: '',
  verdictStatus: 'PENDING',
  verdictOutcome: '',
  relatedCases: '',
  sourceUrl: '',
  originalSourceDocument: '',
  englishTranslatedDocument: '',
}

export function legalCaseLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase())
}

export function createResearchCheckKey(targetId: string, category: LegalResearchCategory) {
  return `${targetId}:${category}`
}

export function isHttpUrl(value: string) {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
