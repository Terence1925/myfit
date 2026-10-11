import * as React from 'react'
import { ExternalLink, Loader2, SearchX } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { demoTitle, embedUrl, findExerciseVideoId, searchUrl, videoFor, watchUrl } from '@/lib/youtube'
import type { ExerciseVideo } from '@/lib/exerciseVideos'

/** Plays a real person demonstrating the exercise, inside the app. */
export function ExerciseDemoDialog({
  exerciseName,
  open,
  onClose,
}: {
  exerciseName: string
  open: boolean
  onClose: () => void
}) {
  const picked = videoFor(exerciseName)
  // No hand-picked video yet: fall back to a live YouTube lookup, then to a search link
  const [live, setLive] = React.useState<ExerciseVideo | null>(null)
  const [looking, setLooking] = React.useState(false)
  React.useEffect(() => {
    setLive(null)
    if (!open || picked) return
    let cancelled = false
    setLooking(true)
    findExerciseVideoId(exerciseName).then((id) => {
      if (cancelled) return
      setLive(id ? { id, channel: 'YouTube', title: exerciseName } : null)
      setLooking(false)
    })
    return () => {
      cancelled = true
    }
  }, [open, exerciseName, picked])
  const video = picked ?? live

  return (
    <Dialog open={open} onClose={onClose} title={demoTitle(exerciseName)}>
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black flex items-center justify-center">
        {looking ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : video ? (
          <iframe
            className="h-full w-full"
            src={embedUrl(video)}
            title={`${exerciseName} form demo`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <SearchX className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              We don't have a video for this one yet. You can look it up on YouTube.
            </p>
            <Button onClick={() => window.open(searchUrl(exerciseName), '_blank', 'noopener,noreferrer')} className="gap-2">
              <ExternalLink className="h-4 w-4" /> Search on YouTube
            </Button>
          </div>
        )}
      </div>
      {video && picked && (
        <p className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Video by <span className="font-semibold text-foreground">{video.channel}</span>
          </span>
          <a
            href={watchUrl(video)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open in YouTube
          </a>
        </p>
      )}
    </Dialog>
  )
}
