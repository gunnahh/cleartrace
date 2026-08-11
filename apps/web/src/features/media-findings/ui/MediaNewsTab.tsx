import { useState } from 'react'
import { Button, Card, Heading, Text } from '@radix-ui/themes'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Newspaper, Plus } from 'lucide-react'
import type { MediaFinding } from '../../../entities/media-finding'
import { api, assignmentKeys } from '../../../lib/api'
import type { Assignment } from '../../assignments/model'
import { getMediaCheckMatches, hasConfiguredMediaCategory } from '../model/media-checks'
import { MediaFindingDialog } from './MediaFindingDialog'
import { MediaFindingList } from './MediaFindingList'

export function MediaNewsTab({ assignment }: { assignment: Assignment }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFinding, setEditingFinding] = useState<MediaFinding | null>(null)
  const [announcement, setAnnouncement] = useState('')
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
    if (window.confirm(`Delete media finding “${finding.articleTitle}”?`))
      deleteMutation.mutate(finding.id)
  }

  return (
    <>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
      <Card className="panel media-panel">
        <div className="sectionhead">
          <div>
            <Heading size="4">Media news</Heading>
            <Text size="2" color="gray">
              Structured findings linked to recorded media searches.
            </Text>
          </div>
          {canEdit && mediaCategoryConfigured && (
            <div className="actions">
              {mediaChecks.length > 0 && (
                <Button onClick={openFindingForm}>
                  <Plus />
                  Add media
                </Button>
              )}
            </div>
          )}
        </div>

        {!mediaCategoryConfigured && assignment.media.length === 0 ? (
          <div className="research-empty">
            <Newspaper aria-hidden="true" />
            <Heading size="4">No media checks configured</Heading>
            <Text color="gray">
              This assignment does not include positive/neutral or negative media research.
            </Text>
          </div>
        ) : mediaChecks.length === 0 && assignment.media.length === 0 ? (
          <div className="research-empty">
            <Newspaper aria-hidden="true" />
            <Heading size="4">Record a media match first</Heading>
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
    </>
  )
}
