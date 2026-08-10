import type { MediaResearchCategory } from '../../../entities/media-finding'
import type { SearchEvidencePreset } from '../../../entities/search-attempt'
import type { Assignment } from '../../assignments/model'

export function preferredMediaEvidencePreset(assignment: Assignment): SearchEvidencePreset {
  const category = assignment.categories.find(
    (item): item is MediaResearchCategory =>
      item === 'MEDIA_POSITIVE_NEUTRAL' || item === 'MEDIA_NEGATIVE',
  )
  return {
    targetId: assignment.targets[0]?.id,
    category: category ?? 'MEDIA_POSITIVE_NEUTRAL',
    result: 'RECORD_FOUND',
  }
}
