import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import * as Tabs from '@radix-ui/react-tabs'
import { Badge, Button, Heading, Progress, Spinner, Text } from '@radix-ui/themes'
import {
  ArrowLeft,
  CircleCheck,
  FileText,
  Gavel,
  ListChecks,
  Newspaper,
  Scale,
  UsersRound,
} from 'lucide-react'
import { DeleteConfirmationDialog } from '../../../components/DeleteConfirmationDialog'
import type { SearchAttempt, SearchEvidencePreset } from '../../../entities/search-attempt'
import { api, assignmentKeys } from '../../../lib/api'
import { assignmentStatusColor, completion, formatAssignmentStatus } from '../../assignments/model'
import { CaseDetailsTab } from '../../legal-cases'
import { MediaNewsTab } from '../../media-findings'
import { LegalMatchesTab, SearchEvidenceDialog } from '../../search-evidence'
import type { AssignmentWorkspaceTab } from '../model/assignment-workspace-tab'
import { CheckedPartiesTab } from '../ui/CheckedPartiesTab'

export function AssignmentResearchWorkspace({
  assignmentId,
  activeTab,
  onTabChange,
}: {
  assignmentId: string
  activeTab: AssignmentWorkspaceTab
  onTabChange: (tab: AssignmentWorkspaceTab) => void
}) {
  const assignmentQuery = useQuery({
    queryKey: assignmentKeys.detail(assignmentId),
    queryFn: () => api.get(assignmentId),
  })
  const [evidencePreset, setEvidencePreset] = useState<SearchEvidencePreset | null>(null)
  const [editingAttempt, setEditingAttempt] = useState<SearchAttempt | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [evidenceToDelete, setEvidenceToDelete] = useState<SearchAttempt | null>(null)
  const queryClient = useQueryClient()
  const deleteEvidence = useMutation({
    mutationFn: (attemptId: string) => api.deleteSearchEvidence(assignmentId, attemptId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: assignmentKeys.detail(assignmentId),
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: assignmentKeys.report(assignmentId),
          exact: true,
        }),
      ])
      setAnnouncement('Search evidence deleted.')
    },
  })

  if (assignmentQuery.isPending)
    return (
      <div className="state">
        <Spinner />
        Loading research workspace…
      </div>
    )
  if (assignmentQuery.isError)
    return <div className="state error">Assignment could not be loaded.</div>

  const assignment = assignmentQuery.data
  const progress = completion(assignment)
  const openEvidence = (preset: SearchEvidencePreset) => {
    setAnnouncement('')
    setEditingAttempt(null)
    setEvidencePreset(preset)
  }
  const editEvidence = (attempt: SearchAttempt) => {
    setEditingAttempt(attempt)
    setEvidencePreset({
      targetId: attempt.targetId,
      category: attempt.category,
      result: attempt.result,
      searchLanguage: attempt.searchLanguage,
    })
  }
  const handleEvidenceSaved = (attempt: SearchAttempt) => {
    setAnnouncement(
      `${attempt.result.replaceAll('_', ' ').toLowerCase()} evidence saved for ${attempt.category
        .replaceAll('_', ' ')
        .toLowerCase()}.`,
    )
  }

  return (
    <div className="page assignment-workspace">
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
      <Button className="workspace-back" asChild size="2" variant="ghost">
        <Link to="/assignments" search={{ q: '', status: 'ALL' }}>
          <ArrowLeft size={16} aria-hidden="true" />
          Assignments
        </Link>
      </Button>
      <section className="workspace-hero" aria-labelledby="assignment-title">
        <div className="workspace-hero__header">
          <div className="workspace-hero__identity">
            <div className="workspace-hero__reference">
              <span>Assignment</span>
              <span aria-hidden="true">·</span>
              <strong>{assignment.referenceId}</strong>
            </div>
            <Heading className="workspace-hero__title" id="assignment-title" size="8">
              {assignment.nameEnglish}
            </Heading>
            <Text className="workspace-hero__subtitle" color="gray">
              {assignment.nameThai}
            </Text>
          </div>
          <div className="workspace-hero__actions">
            <div className="workspace-hero__badges">
              <Badge
                className="workspace-hero__status"
                size="2"
                color={assignmentStatusColor(assignment.status)}
              >
                <span className="workspace-hero__status-dot" aria-hidden="true" />
                {formatAssignmentStatus(assignment.status)}
              </Badge>
              <Badge className="workspace-autosave" size="2" color="green" variant="soft">
                <CircleCheck size={14} aria-hidden="true" />
                Auto saved
              </Badge>
            </div>
            <Button className="workspace-preview" asChild size="3">
              <Link to="/assignments/$assignmentId/report" params={{ assignmentId }}>
                <FileText size={17} aria-hidden="true" />
                Preview report
              </Link>
            </Button>
          </div>
        </div>
        <div className="workspace-progress">
          <div className="workspace-progress__header">
            <div className="workspace-progress__label">
              <span className="workspace-progress__icon" aria-hidden="true">
                <ListChecks size={19} strokeWidth={1.8} />
              </span>
              <div>
                <strong>Research completion</strong>
                <span className="workspace-progress__copy">
                  {progress.complete} of {progress.total} required searches completed
                </span>
              </div>
            </div>
            <div className="workspace-progress__value" aria-hidden="true">
              <strong>{progress.percent}%</strong>
              <span>complete</span>
            </div>
          </div>
          <Progress
            className="workspace-progress__bar"
            size="3"
            color={progress.percent === 100 ? 'green' : 'iris'}
            value={progress.percent}
            aria-label="Research completion"
            aria-valuetext={`${progress.complete} of ${progress.total} required searches completed`}
          />
        </div>
      </section>

      <Tabs.Root
        className="tabs workspace-tabs"
        value={activeTab}
        onValueChange={(value) => onTabChange(value as AssignmentWorkspaceTab)}
      >
        <Tabs.List className="workspace-tabs__list" aria-label="Assignment research sections">
          <Tabs.Trigger value="parties">
            <UsersRound size={16} aria-hidden="true" />
            Checked parties
          </Tabs.Trigger>
          <Tabs.Trigger value="legal">
            <Scale size={16} aria-hidden="true" />
            Legal matches
          </Tabs.Trigger>
          <Tabs.Trigger value="cases">
            <Gavel size={16} aria-hidden="true" />
            Case details
          </Tabs.Trigger>
          <Tabs.Trigger value="media">
            <Newspaper size={16} aria-hidden="true" />
            Media news
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="parties">
          <CheckedPartiesTab
            assignment={assignment}
            onAddEvidence={openEvidence}
            onEditEvidence={editEvidence}
            onDeleteEvidence={(attempt) => {
              setEvidenceToDelete(attempt)
            }}
          />
        </Tabs.Content>
        <Tabs.Content value="legal">
          <LegalMatchesTab
            assignment={assignment}
            onAddEvidence={openEvidence}
            onEditEvidence={editEvidence}
            onDeleteEvidence={(attempt) => {
              setEvidenceToDelete(attempt)
            }}
          />
        </Tabs.Content>
        <Tabs.Content value="cases">
          <CaseDetailsTab
            assignment={assignment}
            onReviewLegalMatches={() => onTabChange('legal')}
          />
        </Tabs.Content>
        <Tabs.Content value="media">
          <MediaNewsTab assignment={assignment} />
        </Tabs.Content>
      </Tabs.Root>

      {evidencePreset && (
        <SearchEvidenceDialog
          assignment={assignment}
          preset={evidencePreset}
          attempt={editingAttempt}
          onSaved={handleEvidenceSaved}
          onOpenChange={(open) => {
            if (!open) {
              setEvidencePreset(null)
              setEditingAttempt(null)
            }
          }}
        />
      )}
      <DeleteConfirmationDialog
        open={Boolean(evidenceToDelete)}
        title="Delete search evidence?"
        description={
          evidenceToDelete ? `This will permanently delete “${evidenceToDelete.sourceName}”.` : ''
        }
        pending={deleteEvidence.isPending}
        onOpenChange={(open) => {
          if (!open) setEvidenceToDelete(null)
        }}
        onConfirm={() => {
          if (evidenceToDelete) deleteEvidence.mutate(evidenceToDelete.id)
        }}
      />
    </div>
  )
}
