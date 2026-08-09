import { z } from 'zod'

export const assignmentStatusSchema = z.enum([
  'DRAFT',
  'IN_PROGRESS',
  'READY_TO_SUBMIT',
  'SUBMITTED',
])
export const targetTypeSchema = z.enum([
  'COMPANY',
  'DIRECTOR',
  'SHAREHOLDER',
  'PARENT_COMPANY',
  'SUBSIDIARY',
])
export const checkCategorySchema = z.enum([
  'CIVIL',
  'CRIMINAL',
  'BANKRUPTCY',
  'REHABILITATION',
  'MEDIA',
])
export const checkStatusSchema = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'MATCH_FOUND', 'NO_RESULT'])
export const attemptResultSchema = z.enum(['MATCH_FOUND', 'NO_RESULT'])
export const sentimentSchema = z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE'])
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().default(''),
  status: assignmentStatusSchema.optional(),
  sort: z.enum(['createdAt', 'dueDate', 'referenceNumber']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})
export const createAssignmentSchema = z.object({
  dueDate: z.coerce.date(),
  companyProfile: z.object({
    registeredNameTh: z.string().min(1),
    registeredNameEn: z.string().min(1),
    registrationNumber: z.string().min(1),
    registrationDate: z.coerce.date(),
    businessType: z.string().min(1),
    registeredAddress: z.string().min(1),
    sourceReference: z.string().min(1),
  }),
})
export const updateAssignmentSchema = z
  .object({
    dueDate: z.coerce.date().optional(),
    status: assignmentStatusSchema.exclude(['SUBMITTED']).optional(),
  })
  .refine((v) => Object.keys(v).length > 0)
export const companyProfileSchema = createAssignmentSchema.shape.companyProfile
export const targetSchema = z
  .object({
    type: targetTypeSchema,
    nameTh: z.string().default(''),
    nameEn: z.string().default(''),
    identifier: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((v) => v.nameTh || v.nameEn, { message: 'At least one bilingual name is required' })
export const checkSchema = z.object({
  category: checkCategorySchema,
  conclusion: z.string().optional(),
})
export const completeCheckSchema = z.object({
  status: z.enum(['MATCH_FOUND', 'NO_RESULT']),
  conclusion: z.string().min(1),
})
export const searchAttemptSchema = z.object({
  sourceName: z.string().min(1),
  sourceUrl: z.string().url(),
  queryText: z.string().min(1),
  searchedAt: z.coerce.date(),
  result: attemptResultSchema,
})
export const legalCaseSchema = z.object({
  caseType: z.string().min(1),
  caseNumber: z.string().min(1),
  courtName: z.string().min(1),
  plaintiff: z.string().min(1),
  defendant: z.string().min(1),
  filingDate: z.coerce.date(),
  judgmentDate: z.coerce.date().optional(),
  caseStatus: z.string().min(1),
  summary: z.string().min(1),
  sourceUrl: z.string().url(),
})
export const mediaFindingSchema = z.object({
  title: z.string().min(1),
  publisher: z.string().min(1),
  publishedAt: z.coerce.date(),
  sourceUrl: z.string().url(),
  sentiment: sentimentSchema,
  summary: z.string().min(1),
})
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) })
export const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).default({}),
  requestId: z.string(),
})
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>
export type TargetInput = z.infer<typeof targetSchema>
export type SearchAttemptInput = z.infer<typeof searchAttemptSchema>
export type LegalCaseInput = z.infer<typeof legalCaseSchema>
export type MediaFindingInput = z.infer<typeof mediaFindingSchema>
