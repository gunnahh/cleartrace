import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Theme } from '@radix-ui/themes'
import type { Assignment } from '../../assignments/model'
import { CaseDetailsTab } from './CaseDetailsTab'

const mocks = vi.hoisted(() => ({ addLegalCase: vi.fn() }))

vi.mock('../../../lib/api', () => ({
  api: { addLegalCase: mocks.addLegalCase },
  assignmentKeys: {
    detail: (id: string) => ['assignments', 'detail', id],
    report: (id: string) => ['assignments', 'detail', id, 'report'],
  },
}))

const assignment = {
  id: 'assignment-1',
  status: 'IN_PROGRESS',
  targets: [
    {
      id: 'target-1',
      targetType: 'DIRECTOR',
      nameEnglish: 'Narin Sample',
      nameThai: 'นรินทร์ ตัวอย่าง',
    },
  ],
  attempts: [],
  cases: [],
} as unknown as Assignment

afterEach(() => {
  cleanup()
  mocks.addLegalCase.mockReset()
})

describe('CaseDetailsTab', () => {
  it('guides the researcher to record a legal match before adding a case', async () => {
    const onReviewLegalMatches = vi.fn()
    const user = userEvent.setup()

    renderTab(assignment, onReviewLegalMatches)

    expect(screen.getByRole('heading', { name: 'Record a legal match first' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add legal evidence' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Review legal matches' }))
    expect(onReviewLegalMatches).toHaveBeenCalledOnce()
  })

  it('submits a complete structured legal case linked to the recorded match', async () => {
    mocks.addLegalCase.mockResolvedValue({ id: 'case-1' })
    const user = userEvent.setup()
    const matchedAssignment = {
      ...assignment,
      attempts: [
        {
          id: 'attempt-1',
          targetId: 'target-1',
          category: 'LITIGATION',
          result: 'RECORD_FOUND',
          sourceName: 'Court records',
          sourceUrl: 'https://example.com/search-result',
          resultPageUrl: '',
          searchQuery: 'Narin Sample',
          searchLanguage: 'EN',
          searchedAt: '2026-08-01',
          reason: '',
          evidence: ['match.pdf'],
        },
      ],
    } as Assignment

    renderTab(matchedAssignment, vi.fn())
    expect(screen.queryByRole('button', { name: 'Add evidence' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add first case' }))

    expect(screen.getByRole('dialog', { name: 'Add legal case' })).toBeInTheDocument()
    await user.type(screen.getByLabelText(/Case number/), 'CIV-123/2026')
    await user.type(screen.getByLabelText(/Court name/), 'Bangkok Civil Court')
    fireEvent.change(screen.getByLabelText(/Registration date/), {
      target: { value: '2026-08-01' },
    })
    await user.type(screen.getByLabelText(/Plaintiffs \/ appellants/), 'Example Trading Co., Ltd.')
    await user.type(screen.getByLabelText(/Defendants \/ appellees/), 'Narin Sample')
    await user.type(
      screen.getByLabelText(/Case background/),
      'A fictional contractual dispute used for testing.',
    )
    await user.type(screen.getByLabelText(/Petition \/ claim/), 'Payment and legal costs.')
    await user.type(screen.getByLabelText(/Verdict outcome/), 'Proceedings are pending.')
    await user.type(screen.getByLabelText(/Source URL/), 'https://example.com/cases/CIV-123-2026')
    await user.upload(
      screen.getByLabelText(/Original source document/),
      new File(['court record'], 'court-record.pdf', { type: 'application/pdf' }),
    )
    await user.click(screen.getByRole('button', { name: 'Save legal case' }))

    await waitFor(() => expect(mocks.addLegalCase).toHaveBeenCalledOnce())
    expect(mocks.addLegalCase).toHaveBeenCalledWith(
      assignment.id,
      expect.objectContaining({
        researchCheckKey: 'target-1:LITIGATION',
        caseNumber: 'CIV-123/2026',
        courtName: 'Bangkok Civil Court',
        originalSourceDocument: 'court-record.pdf',
      }),
    )
  })
})

function renderTab(item: Assignment, onReviewLegalMatches = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme>
        <CaseDetailsTab assignment={item} onReviewLegalMatches={onReviewLegalMatches} />
      </Theme>
    </QueryClientProvider>,
  )
}
