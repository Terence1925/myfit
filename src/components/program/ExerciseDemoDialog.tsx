import * as React from 'react'
import { ExternalLink, Loader2, SearchX } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ANIMATED_DEMOS, SHOW_ANIMATED_DEMOS, YOUTUBE_NEXT_TO_ANIMATION } from '@/lib/animatedDemos'
import { demoTitle, embedUrl, findExerciseVideoId, searchUrl, videoFor, watchUrl } from '@/lib/youtube'
import type { ExerciseVideo } from '@/lib/exerciseVideos'
import { cn } from '@/lib/utils'

type Mode = 'animated' | 'youtube'
type Model = 'female' | 'male'

function Pills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { id: T; label: string }[]
}) {
  return (
    <div className="inline-flex gap-1 rounded-xl border border-border bg-secondary/40 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'rounded-lg px-3 py-1 text-xs font-semibold transition-colors',
            value === o.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Step-by-step instructions, form cues and common mistakes that come with an animation. */
function HowTo({
  steps,
  cues,
  mistakes,
  breathing,
}: {
  steps: string[]
  cues: string[]
  mistakes: string[]
  breathing: string
}) {
  if (!steps.length && !cues.length && !mistakes.length) return null
  return (
    <div className="mt-4 space-y-4 text-sm">
      {steps.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">How to do it</div>
          <ol className="list-decimal space-y-1 pl-5 text-foreground/90">
            {steps.map((st) => (
              <li key={st}>{st}</li>
            ))}
          </ol>
        </div>
      )}
      {cues.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Form cues</div>
          <div className="flex flex-wrap gap-2">
            {cues.map((c) => (
              <span key={c} className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-semibold">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
      {mistakes.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-destructive">Avoid</div>
          <ul className="list-disc space-y-1 pl-5 text-foreground/90">
            {mistakes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      {breathing && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Breathing: </span>
          {breathing}
        </p>
      )}
    </div>
  )
}

/**
 * Plays a demonstration of the exercise inside the app: a short animation with how-to text (when one exists for the
 * exercise), and/or a real person from YouTube. Yoga, Pilates and band exercises use YouTube only.
 */
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
  const animated = SHOW_ANIMATED_DEMOS ? ANIMATED_DEMOS[exerciseName] : undefined
  // A "Real person" tab only exists when there is a reviewed YouTube video and it is switched on (see animatedDemos.ts)
  const hasReal = !!picked && YOUTUBE_NEXT_TO_ANIMATION
  // No hand-picked video yet: fall back to a live YouTube lookup, then to a search link (only when there is no animation)
  const [live, setLive] = React.useState<ExerciseVideo | null>(null)
  const [looking, setLooking] = React.useState(false)
  const [mode, setMode] = React.useState<Mode>(animated ? 'animated' : 'youtube')
  const [model, setModel] = React.useState<Model>('female')

  React.useEffect(() => {
    setMode(animated ? 'animated' : 'youtube')
  }, [exerciseName, open, animated])

  React.useEffect(() => {
    setLive(null)
    if (!open || picked || animated) return
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
  }, [open, exerciseName, picked, animated])
  const video = picked ?? live

  const showAnimated = !!animated && (mode === 'animated' || !hasReal)
  const animatedSrc = animated ? (animated[model] ?? animated.male ?? animated.female) : undefined
  const bothModels = !!animated?.male && !!animated?.female

  return (
    <Dialog open={open} onClose={onClose} title={demoTitle(exerciseName)}>
      <div className="max-h-[75vh] overflow-y-auto">
        {animated && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            {hasReal ? (
              <Pills<Mode>
                value={mode}
                onChange={setMode}
                options={[
                  { id: 'animated', label: 'Animation' },
                  { id: 'youtube', label: 'Real person' },
                ]}
              />
            ) : (
              <span />
            )}
            {showAnimated && bothModels && (
              <Pills<Model>
                value={model}
                onChange={setModel}
                options={[
                  { id: 'female', label: 'Female' },
                  { id: 'male', label: 'Male' },
                ]}
              />
            )}
          </div>
        )}

        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black flex items-center justify-center">
          {showAnimated && animatedSrc ? (
            <video
              key={animatedSrc}
              className="h-full w-full object-contain"
              src={animatedSrc}
              poster={animated?.thumb}
              autoPlay
              loop
              muted
              playsInline
              controls
            />
          ) : looking ? (
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

        {showAnimated && animated ? (
          <>
            <p className="mt-3 text-xs text-muted-foreground">
              {hasReal ? 'Animated demo. Switch to "Real person" to see a YouTube video.' : 'Animated demo.'}
            </p>
            <HowTo steps={animated.steps} cues={animated.cues} mistakes={animated.mistakes} breathing={animated.breathing} />
          </>
        ) : (
          video &&
          picked && (
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
          )
        )}
      </div>
    </Dialog>
  )
}
