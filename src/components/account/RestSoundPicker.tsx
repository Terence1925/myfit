import * as React from 'react'
import { Check, Play, Volume2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { REST_SOUNDS, getRestSound, previewRestSound, setRestSound, type RestSoundId } from '@/lib/restSound'

/** Account-page choice of the sound the rest-over alarm makes (phone app). Tapping a row picks it and plays it once. */
export function RestSoundPicker() {
  const [selected, setSelected] = React.useState<RestSoundId>(getRestSound)

  const choose = (id: RestSoundId) => {
    setSelected(id)
    setRestSound(id)
    previewRestSound(id)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Volume2 className="h-5 w-5 text-primary" /> Rest alarm sound
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 font-body text-sm">
        <p className="mb-3 text-muted-foreground">Tap a sound to hear it and choose it. It plays when your rest is over.</p>
        <div role="radiogroup" aria-label="Rest alarm sound" className="space-y-2">
          {REST_SOUNDS.map((s) => {
            const on = s.id === selected
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => choose(s.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                  on ? 'border-primary/60 bg-primary/10' : 'border-border bg-secondary/40 hover:bg-secondary/70',
                )}
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', on ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                  {on ? <Check className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{s.label}</span>
                  <span className="block text-xs text-muted-foreground">{s.hint}</span>
                </span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
