import { useState } from 'react'
import { Button, Card, Heading, Text } from '@radix-ui/themes'
import { Newspaper, Plus } from 'lucide-react'
import type { SearchEvidencePreset } from '../../../entities/search-attempt'
import type { Assignment } from '../../assignments/model'
import { getMediaCheckMatches, hasConfiguredMediaCategory } from '../model/media-checks'
import { preferredMediaEvidencePreset } from '../model/media-evidence-preset'
import { MediaFindingDialog } from './MediaFindingDialog'
import { MediaFindingList } from './MediaFindingList'

export function MediaNewsTab({
  assignment,
  onAddEvidence,
}: {
  assignment: Assignment
  onAddEvidence: (preset: SearchEvidencePreset) => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const mediaChecks = getMediaCheckMatches(assignment.attempts)
  const positiveNeutral = assignment.media.filter((finding) => finding.sentiment !== 'NEGATIVE')
  const negative = assignment.media.filter((finding) => finding.sentiment === 'NEGATIVE')
  const canEdit = assignment.status !== 'SUBMITTED'
  const mediaCategoryConfigured = hasConfiguredMediaCategory(assignment)

  const openFindingForm = () => {
    setAnnouncement('')
    setDialogOpen(true)
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
          {canEdit && mediaChecks.length > 0 && (
            <Button onClick={openFindingForm}>
              <Plus />
              Add media finding
            </Button>
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
            {canEdit && (
              <Button onClick={() => onAddEvidence(preferredMediaEvidencePreset(assignment))}>
                <Plus />
                Add media evidence
              </Button>
            )}
          </div>
        ) : (
          <div className="media-sections">
            <MediaFindingList
              title="Positive & neutral news"
              findings={positiveNeutral}
              assignment={assignment}
            />
            <MediaFindingList
              title="Negative news"
              findings={negative}
              assignment={assignment}
              negative
            />
          </div>
        )}
      </Card>

      {dialogOpen && (
        <MediaFindingDialog
          assignment={assignment}
          mediaChecks={mediaChecks}
          onOpenChange={setDialogOpen}
          onSaved={() => setAnnouncement('Media finding saved.')}
        />
      )}
    </>
  )
}
