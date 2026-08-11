import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import * as Tabs from '@radix-ui/react-tabs'
import { Badge, Button, Card, Heading, Progress, Spinner, Text } from '@radix-ui/themes'
import { ArrowLeft } from 'lucide-react'
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
    <div className="page">
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
      <Button asChild variant="ghost">
        <Link to="/assignments" search={{ q: '', status: 'ALL' }}>
          <ArrowLeft />
          Assignments
        </Link>
      </Button>
      <div className="pagehead">
        <div>
          <Text size="2" color="gray">
            {assignment.referenceId}
          </Text>
          <Heading size="7">{assignment.nameEnglish}</Heading>
          <Text color="gray">{assignment.nameThai}</Text>
        </div>
        <div className="actions">
          <Badge size="2" color={assignmentStatusColor(assignment.status)}>
            {formatAssignmentStatus(assignment.status)}
          </Badge>
          <Badge size="2" color="green" variant="soft">
            Auto saved
          </Badge>
          <Button asChild>
            <Link to="/assignments/$assignmentId/report" params={{ assignmentId }}>
              Preview report
            </Link>
          </Button>
        </div>
      </div>
      <Card className="progresscard">
        <div className="row">
          <strong>Research completion</strong>
          <span>
            {progress.complete} of {progress.total} required searches · {progress.percent}%
          </span>
        </div>
        <Progress value={progress.percent} />
      </Card>

      <Tabs.Root
        className="tabs"
        value={activeTab}
        onValueChange={(value) => onTabChange(value as AssignmentWorkspaceTab)}
      >
        <Tabs.List aria-label="Assignment research sections">
          <Tabs.Trigger value="parties">Checked parties</Tabs.Trigger>
          <Tabs.Trigger value="legal">Legal matches</Tabs.Trigger>
          <Tabs.Trigger value="cases">Case details</Tabs.Trigger>
          <Tabs.Trigger value="media">Media news</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="parties">
          <CheckedPartiesTab
            assignment={assignment}
            onAddEvidence={openEvidence}
            onEditEvidence={editEvidence}
            onDeleteEvidence={(attempt) => {
              if (window.confirm(`Delete search evidence “${attempt.sourceName}”?`))
                deleteEvidence.mutate(attempt.id)
            }}
          />
        </Tabs.Content>
        <Tabs.Content value="legal">
          <LegalMatchesTab
            assignment={assignment}
            onAddEvidence={openEvidence}
            onEditEvidence={editEvidence}
            onDeleteEvidence={(attempt) => {
              if (window.confirm(`Delete search evidence “${attempt.sourceName}”?`))
                deleteEvidence.mutate(attempt.id)
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
    </div>
  )
}
