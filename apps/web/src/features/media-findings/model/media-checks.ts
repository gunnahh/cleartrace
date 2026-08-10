import {
  createMediaResearchCheckKey,
  mediaFindingDefaults,
  mediaFindingLabel,
  type MediaFindingInput,
  type MediaResearchCategory,
} from '../../../entities/media-finding'
import type { SearchAttempt } from '../../../entities/search-attempt'
import type { Assignment } from '../../assignments/model'

export type MediaCheckMatch = {
  key: string
  targetId: string
  category: MediaResearchCategory
  attempts: SearchAttempt[]
}

export function getMediaCheckMatches(attempts: SearchAttempt[]) {
  const matches = new Map<string, MediaCheckMatch>()
  for (const attempt of attempts) {
    if (
      attempt.result !== 'RECORD_FOUND' ||
      (attempt.category !== 'MEDIA_POSITIVE_NEUTRAL' && attempt.category !== 'MEDIA_NEGATIVE')
    )
      continue

    const key = createMediaResearchCheckKey(attempt.targetId, attempt.category)
    const existing = matches.get(key)
    if (existing) existing.attempts.push(attempt)
    else
      matches.set(key, {
        key,
        targetId: attempt.targetId,
        category: attempt.category,
        attempts: [attempt],
      })
  }
  return [...matches.values()]
}

export function mediaCheckLabel(assignment: Assignment, check: MediaCheckMatch) {
  const target = assignment.targets.find((item) => item.id === check.targetId)
  const languages = [...new Set(check.attempts.map((attempt) => attempt.searchLanguage))].join(', ')
  return `${target?.nameEnglish ?? 'Unknown party'} · ${mediaFindingLabel(check.category)} · ${languages}`
}

export function mediaFindingDefaultsForCheck(check?: MediaCheckMatch): MediaFindingInput {
  return {
    ...mediaFindingDefaults,
    researchCheckKey: check?.key ?? '',
    sentiment: check?.category === 'MEDIA_NEGATIVE' ? 'NEGATIVE' : 'NEUTRAL',
  }
}

export function hasConfiguredMediaCategory(assignment: Assignment) {
  return assignment.categories.some(
    (category) => category === 'MEDIA_POSITIVE_NEUTRAL' || category === 'MEDIA_NEGATIVE',
  )
}
