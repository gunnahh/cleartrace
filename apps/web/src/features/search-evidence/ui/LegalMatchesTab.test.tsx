import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Theme } from '@radix-ui/themes'
import type { Assignment } from '../../assignments/model'
import { LegalMatchesTab } from './LegalMatchesTab'

afterEach(cleanup)

describe('LegalMatchesTab', () => {
  it('keeps the subject company visible and can start its evidence form', async () => {
    const onAddEvidence = vi.fn()
    const user = userEvent.setup()
    const assignment = {
      status: 'IN_PROGRESS',
      categories: ['LITIGATION'],
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

    render(
      <Theme>
        <LegalMatchesTab assignment={assignment} onAddEvidence={onAddEvidence} />
      </Theme>,
    )

    expect(screen.getByRole('heading', { name: 'Example Co., Ltd.' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add evidence' }))
    expect(onAddEvidence).toHaveBeenCalledWith({
      targetId: 'subject-1',
      category: 'LITIGATION',
    })
  })
})
