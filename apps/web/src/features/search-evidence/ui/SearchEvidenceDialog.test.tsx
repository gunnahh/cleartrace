import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Theme } from '@radix-ui/themes'
import type { Assignment } from '../../assignments/model'
import { SearchEvidenceDialog } from './SearchEvidenceDialog'

const mocks = vi.hoisted(() => ({ addSearchEvidence: vi.fn() }))

vi.mock('../../../lib/api', () => ({
  api: { addSearchEvidence: mocks.addSearchEvidence },
  assignmentKeys: {
    detail: (id: string) => ['assignments', 'detail', id],
    report: (id: string) => ['assignments', 'detail', id, 'report'],
  },
}))

const assignment = {
  id: 'assignment-1',
  status: 'IN_PROGRESS',
  categories: ['LITIGATION', 'MEDIA_NEGATIVE'],
  targets: [
    {
      id: 'subject-1',
      targetType: 'SUBJECT_COMPANY',
      nameEnglish: 'Example Co., Ltd.',
      nameThai: 'บริษัท ตัวอย่าง จำกัด',
    },
  ],
  attempts: [],
} as unknown as Assignment

afterEach(() => {
  cleanup()
  mocks.addSearchEvidence.mockReset()
})

describe('SearchEvidenceDialog', () => {
  it('saves record-found evidence for the subject company with translated notes', async () => {
    mocks.addSearchEvidence.mockResolvedValue({
      id: 'attempt-1',
      category: 'LITIGATION',
      result: 'RECORD_FOUND',
    })
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    renderDialog(onOpenChange)

    expect(screen.getByRole('combobox', { name: /Checked party/ })).toHaveTextContent(
      'Example Co., Ltd.',
    )
    await user.type(screen.getByLabelText(/Search source/), 'Court archive')
    await user.type(screen.getByLabelText(/Search query/), 'Example Co., Ltd.')
    await user.type(screen.getByLabelText(/Source URL/), 'https://example.com/court/case-1')
    await user.upload(
      screen.getByLabelText(/Screenshots or source documents/),
      new File(['court record'], 'court-case.pdf', { type: 'application/pdf' }),
    )
    await user.type(screen.getByLabelText(/Notes in original language/), 'หมายเหตุ')
    await user.type(screen.getByLabelText(/English translation/), 'Translated note')
    await user.click(screen.getByRole('button', { name: 'Save evidence' }))

    await waitFor(() => expect(mocks.addSearchEvidence).toHaveBeenCalledOnce())
    expect(mocks.addSearchEvidence).toHaveBeenCalledWith(
      assignment.id,
      expect.objectContaining({
        targetId: 'subject-1',
        category: 'LITIGATION',
        result: 'RECORD_FOUND',
        evidence: ['court-case.pdf'],
        notesOriginal: 'หมายเหตุ',
        translationEnglish: 'Translated note',
      }),
    )
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('shows validation instead of silently ignoring an incomplete submission', async () => {
    const user = userEvent.setup()
    renderDialog(vi.fn())

    await user.click(screen.getByRole('button', { name: 'Save evidence' }))

    expect(await screen.findByText('Review the highlighted fields.')).toBeInTheDocument()
    expect(screen.getByText('Source name is required')).toBeInTheDocument()
    expect(mocks.addSearchEvidence).not.toHaveBeenCalled()
  })

  it('can change a select option inside the modal', async () => {
    const user = userEvent.setup()
    renderDialog(vi.fn())

    await user.click(screen.getByRole('combobox', { name: 'Result' }))
    await user.click(await screen.findByRole('option', { name: 'No result found' }))

    expect(screen.getByRole('combobox', { name: 'Result' })).toHaveTextContent('No result found')
    expect(screen.getByLabelText(/Result-page URL/)).toBeInTheDocument()
  })
})

function renderDialog(onOpenChange: (open: boolean) => void) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme>
        <SearchEvidenceDialog
          assignment={assignment}
          preset={{ targetId: 'subject-1', category: 'LITIGATION', result: 'RECORD_FOUND' }}
          onOpenChange={onOpenChange}
        />
      </Theme>
    </QueryClientProvider>,
  )
}
