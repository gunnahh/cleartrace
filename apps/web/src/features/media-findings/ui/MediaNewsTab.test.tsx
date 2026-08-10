import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Theme } from '@radix-ui/themes'
import type { Assignment } from '../../assignments/model'
import { MediaNewsTab } from './MediaNewsTab'

const mocks = vi.hoisted(() => ({ addMediaFinding: vi.fn() }))

vi.mock('../../../lib/api', () => ({
  api: { addMediaFinding: mocks.addMediaFinding },
  assignmentKeys: {
    detail: (id: string) => ['assignments', 'detail', id],
    report: (id: string) => ['assignments', 'detail', id, 'report'],
  },
}))

const assignment = {
  id: 'assignment-1',
  status: 'IN_PROGRESS',
  categories: ['MEDIA_NEGATIVE'],
  targets: [
    {
      id: 'subject-1',
      targetType: 'SUBJECT_COMPANY',
      nameEnglish: 'Example Co., Ltd.',
      nameThai: 'บริษัท ตัวอย่าง จำกัด',
    },
  ],
  attempts: [],
  media: [],
} as unknown as Assignment

afterEach(() => {
  cleanup()
  mocks.addMediaFinding.mockReset()
})

describe('MediaNewsTab', () => {
  it('opens the evidence prerequisite directly when there is no media match', async () => {
    const onAddEvidence = vi.fn()
    const user = userEvent.setup()
    renderTab(assignment, onAddEvidence)

    expect(screen.getByRole('heading', { name: 'Record a media match first' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add evidence' }))

    expect(onAddEvidence).toHaveBeenCalledWith({
      targetId: 'subject-1',
      category: 'MEDIA_NEGATIVE',
      result: 'RECORD_FOUND',
    })
  })

  it('submits a complete finding linked to a recorded media match', async () => {
    mocks.addMediaFinding.mockResolvedValue({ id: 'finding-1' })
    const user = userEvent.setup()
    const matchedAssignment = {
      ...assignment,
      attempts: [
        {
          id: 'attempt-1',
          targetId: 'subject-1',
          category: 'MEDIA_NEGATIVE',
          result: 'RECORD_FOUND',
          sourceName: 'News archive',
          sourceUrl: 'https://example.com/news/search',
          resultPageUrl: '',
          searchQuery: 'Example Co., Ltd.',
          searchLanguage: 'EN',
          searchedAt: '2026-08-01',
          reason: '',
          evidence: ['search.png'],
          notesOriginal: '',
          translationEnglish: '',
          createdAt: '2026-08-01T00:00:00.000Z',
        },
      ],
    } as Assignment

    const onAddEvidence = vi.fn()
    renderTab(matchedAssignment, onAddEvidence)
    await user.click(screen.getByRole('button', { name: 'Add evidence' }))
    expect(onAddEvidence).toHaveBeenCalledWith({
      targetId: 'subject-1',
      category: 'MEDIA_NEGATIVE',
      result: 'RECORD_FOUND',
    })
    await user.click(screen.getByRole('button', { name: 'Add media finding' }))
    await user.type(screen.getByLabelText(/Article title/), 'Example investigation')
    await user.type(screen.getByLabelText(/Publisher/), 'Example News')
    fireEvent.change(screen.getByLabelText(/Publication date/), {
      target: { value: '2026-08-01' },
    })
    await user.type(screen.getByLabelText(/Original-language summary/), 'สรุปข่าวตัวอย่าง')
    await user.type(screen.getByLabelText(/English summary/), 'An example news summary.')
    await user.type(screen.getByLabelText(/Source URL/), 'https://example.com/news/example')
    await user.upload(
      screen.getByLabelText(/Supporting screenshot or document/),
      new File(['article'], 'article.pdf', { type: 'application/pdf' }),
    )
    await user.click(screen.getByRole('button', { name: 'Save media finding' }))

    await waitFor(() => expect(mocks.addMediaFinding).toHaveBeenCalledOnce())
    expect(mocks.addMediaFinding).toHaveBeenCalledWith(
      assignment.id,
      expect.objectContaining({
        researchCheckKey: 'subject-1:MEDIA_NEGATIVE',
        sentiment: 'NEGATIVE',
        articleTitle: 'Example investigation',
        supportingDocument: 'article.pdf',
      }),
    )
  })
})

function renderTab(item: Assignment, onAddEvidence = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme>
        <MediaNewsTab assignment={item} onAddEvidence={onAddEvidence} />
      </Theme>
    </QueryClientProvider>,
  )
}
