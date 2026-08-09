import { AppError } from './errors.js'

type CompletionCheck = {
  category: 'CIVIL' | 'CRIMINAL' | 'BANKRUPTCY' | 'REHABILITATION' | 'MEDIA'
  searchAttempts: { result: 'MATCH_FOUND' | 'NO_RESULT'; evidence: { mimeType: string }[] }[]
  legalCases: unknown[]
}

export function validateCheckCompletion(
  check: CompletionCheck,
  requestedStatus: 'MATCH_FOUND' | 'NO_RESULT',
) {
  if (requestedStatus === 'NO_RESULT') {
    const hasScreenshot = check.searchAttempts.some(
      (attempt) =>
        attempt.result === 'NO_RESULT' &&
        attempt.evidence.some((file) => ['image/png', 'image/jpeg'].includes(file.mimeType)),
    )
    if (!hasScreenshot) {
      throw new AppError(
        'NO_RESULT_EVIDENCE_REQUIRED',
        'Upload a screenshot showing the search query and no-result message.',
        422,
        { evidence: ['A PNG or JPEG screenshot is required'] },
      )
    }
  }

  const legalCategory = ['CIVIL', 'CRIMINAL', 'BANKRUPTCY', 'REHABILITATION'].includes(
    check.category,
  )
  if (requestedStatus === 'MATCH_FOUND' && legalCategory && check.legalCases.length === 0) {
    throw new AppError(
      'LEGAL_CASE_REQUIRED',
      'A legal match requires at least one structured legal case',
      422,
      { legalCases: ['Add a legal case before completing this check'] },
    )
  }
}

export function validateFile(header: Uint8Array, mimeType: string, size: number, max: number) {
  if (size > max) throw new AppError('FILE_TOO_LARGE', `File exceeds ${max} bytes`, 413)
  const png = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47
  const jpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
  const pdf = String.fromCharCode(...header.slice(0, 4)) === '%PDF'
  const valid =
    (mimeType === 'image/png' && png) ||
    (mimeType === 'image/jpeg' && jpeg) ||
    (mimeType === 'application/pdf' && pdf)
  if (!valid)
    throw new AppError('INVALID_FILE', 'Only valid PNG, JPEG, or PDF files are allowed', 415)
}
