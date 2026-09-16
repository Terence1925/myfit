import * as React from 'react'
import { ExternalLink, Loader2, SearchX } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { findExerciseVideoId, searchUrl } from '@/lib/youtube'

export function ExerciseDemoDialog({
  exerciseName,
  open,
  onClose,
}: {
  exerciseName: string
  open: boolean
  onClose: () => void
}) {
  const [videoId, setVideoId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setVideoId(null)
    findExerciseVideoId(exerciseName).then((id) => {
      if (!cancelled) {
        setVideoId(id)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [open, exerciseName])

  return (
    <Dialog open={open} onClose={onClose} title={`${exerciseName} — Form Demo`}>
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black flex items-center justify-center">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : videoId ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={`${exerciseName} form demo`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <SearchX className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Couldn't load a video preview here — open the search on YouTube instead.
            </p>
            <Button onClick={() => window.open(searchUrl(exerciseName), '_blank', 'noopener,noreferrer')} className="gap-2">
              <ExternalLink className="h-4 w-4" /> Search on YouTube
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  )
}
