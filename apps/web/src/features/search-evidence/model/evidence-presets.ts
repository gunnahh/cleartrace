import type { SearchCategory, SearchEvidencePreset } from '../../../entities/search-attempt'
import type { Assignment } from '../../assignments/model'

export function preferredLegalEvidencePreset(assignment: Assignment): SearchEvidencePreset {
  const category = assignment.categories.find(
    (item): item is Extract<SearchCategory, 'LITIGATION' | 'BANKRUPTCY'> =>
      item === 'LITIGATION' || item === 'BANKRUPTCY',
  )
  return {
    targetId: assignment.targets[0]?.id,
    category: category ?? 'LITIGATION',
    result: 'RECORD_FOUND',
  }
}
