import { useState } from 'react'
import { Button, Card, Heading, Text } from '@radix-ui/themes'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Newspaper, Plus } from 'lucide-react'
import type { MediaFinding } from '../../../entities/media-finding'
import { DeleteConfirmationDialog } from '../../../components/DeleteConfirmationDialog'
import { api, assignmentKeys } from '../../../lib/api'
import type { Assignment } from '../../assignments/model'
import { getMediaCheckMatches, hasConfiguredMediaCategory } from '../model/media-checks'
import { MediaFindingDialog } from './MediaFindingDialog'
import { MediaFindingList } from './MediaFindingList'

export function MediaNewsTab({ assignment }: { assignment: Assignment }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFinding, setEditingFinding] = useState<MediaFinding | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [findingToDelete, setFindingToDelete] = useState<MediaFinding | null>(null)
  const queryClient = useQueryClient()
  const mediaChecks = getMediaCheckMatches(assignment.attempts)
  const positiveNeutral = assignment.media.filter((finding) => finding.sentiment !== 'NEGATIVE')
  const negative = assignment.media.filter((finding) => finding.sentiment === 'NEGATIVE')
  const canEdit = assignment.status !== 'SUBMITTED'
  const mediaCategoryConfigured = hasConfiguredMediaCategory(assignment)

  const openFindingForm = () => {
    setAnnouncement('')
    setEditingFinding(null)
    setDialogOpen(true)
  }
  const deleteMutation = useMutation({
    mutationFn: (findingId: string) => api.deleteMediaFinding(assignment.id, findingId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: assignmentKeys.detail(assignment.id),
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: assignmentKeys.report(assignment.id),
          exact: true,
        }),
      ])
      setAnnouncement('Media finding deleted.')
    },
  })
  const editFinding = (finding: MediaFinding) => {
    setEditingFinding(finding)
    setDialogOpen(true)
  }
  const deleteFinding = (finding: MediaFinding) => {
    setFindingToDelete(finding)
  }

  return (
    <>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
      <Card className="panel media-panel premium-media-panel">
        <div className="sectionhead feature-sectionhead media-sectionhead">
          <div className="feature-section-heading">
            <span className="feature-section-heading__icon media-heading__icon" aria-hidden="true">
              <Newspaper size={20} strokeWidth={1.8} />
            </span>
            <div>
              <div className="feature-section-heading__eyebrow">
                Media intelligence
                <span aria-hidden="true">·</span>
                {assignment.media.length} {assignment.media.length === 1 ? 'finding' : 'findings'}
              </div>
              <Heading as="h2" className="feature-section-heading__title" size="5">
                Media news
              </Heading>
              <Text size="2" color="gray">
                Structured findings linked to recorded media searches.
              </Text>
            </div>
          </div>
          {canEdit && mediaCategoryConfigured && mediaChecks.length > 0 && (
            <Button className="feature-section-action" size="3" onClick={openFindingForm}>
              <Plus size={18} aria-hidden="true" />
              Add media
            </Button>
          )}
        </div>

        {!mediaCategoryConfigured && assignment.media.length === 0 ? (
          <div className="research-empty premium-empty-state">
            <span className="premium-empty-state__icon" aria-hidden="true">
              <Newspaper />
            </span>
            <Text className="premium-empty-state__eyebrow">Media intelligence</Text>
            <Heading as="h3" size="5">
              No media checks configured
            </Heading>
            <Text color="gray">
              This assignment does not include positive/neutral or negative media research.
            </Text>
          </div>
        ) : mediaChecks.length === 0 && assignment.media.length === 0 ? (
          <div className="research-empty premium-empty-state">
            <span className="premium-empty-state__icon" aria-hidden="true">
              <Newspaper />
            </span>
            <Text className="premium-empty-state__eyebrow">Media intelligence</Text>
            <Heading as="h3" size="5">
              Record a media match first
            </Heading>
            <Text color="gray">
              Add record-found evidence for a positive/neutral or negative media check before
              creating a structured finding.
            </Text>
          </div>
        ) : (
          <div className="media-sections">
            <MediaFindingList
              title="Positive & neutral news"
              findings={positiveNeutral}
              assignment={assignment}
              canEdit={canEdit}
              onEdit={editFinding}
              onDelete={deleteFinding}
            />
            <MediaFindingList
              title="Negative news"
              findings={negative}
              assignment={assignment}
              negative
              canEdit={canEdit}
              onEdit={editFinding}
              onDelete={deleteFinding}
            />
          </div>
        )}
      </Card>

      {dialogOpen && (
        <MediaFindingDialog
          assignment={assignment}
          mediaChecks={mediaChecks}
          finding={editingFinding}
          onOpenChange={setDialogOpen}
          onSaved={() =>
            setAnnouncement(editingFinding ? 'Media finding updated.' : 'Media finding saved.')
          }
        />
      )}
      <DeleteConfirmationDialog
        open={Boolean(findingToDelete)}
        title="Delete media finding?"
        description={
          findingToDelete ? `This will permanently delete “${findingToDelete.articleTitle}”.` : ''
        }
        pending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setFindingToDelete(null)
        }}
        onConfirm={() => {
          if (findingToDelete) deleteMutation.mutate(findingToDelete.id)
        }}
      />
    </>
  )
}
