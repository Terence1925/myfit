import * as React from 'react'
import { ArrowLeft, Check, ChevronRight, Plus, Search, X } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BODY_PARTS, EQUIPMENT_FILTERS, dictionaryFor, matchesEquipment } from '@/lib/backend/customLibrary'
import { exerciseFromLibrary } from '@/lib/backend/programGenerator'
import type { Equipment, Exercise, FocusArea, IntakeAnswers } from '@/lib/types'

const EQUIPMENT_NAMES: Partial<Record<Equipment, string>> = {
  'full-gym': 'Gym',
  'dumbbells-only': 'Dumbbells',
  'resistance-bands': 'Bands',
  calisthenics: 'Bodyweight',
  'home-workout': 'Bodyweight',
}

/** A short label for what an exercise needs, e.g. "Gym", "Dumbbells", "Bodyweight". */
function equipmentTag(equipment: Equipment[]): string {
  const names: string[] = []
  for (const eq of equipment) {
    const n = EQUIPMENT_NAMES[eq]
    if (n && !names.includes(n)) names.push(n)
  }
  return names.slice(0, 2).join(' · ')
}

/**
 * The exercise dictionary: pick a body part, then an exercise. Tapping an exercise adds it to the day (sets and reps suit
 * the person's goal and can be changed on the day). It stays open so several can be added, and "Type your own" is always
 * at the bottom for anything that is not in the list.
 */
export function ExercisePicker({
  open,
  onClose,
  dayLabel,
  chosen,
  answers,
  onAdd,
  onTypeOwn,
}: {
  open: boolean
  onClose: () => void
  dayLabel: string
  /** Names already on this day */
  chosen: string[]
  answers: Pick<IntakeAnswers, 'goal' | 'experience'>
  onAdd: (exercise: Exercise) => void
  onTypeOwn: () => void
}) {
  const [part, setPart] = React.useState<FocusArea | null>(null)
  const [query, setQuery] = React.useState('')
  const [equip, setEquip] = React.useState<Equipment | 'all'>('all')
  const [added, setAdded] = React.useState(0)

  React.useEffect(() => {
    if (!open) return
    setPart(null)
    setQuery('')
    setEquip('all')
    setAdded(0)
  }, [open])

  const counts = React.useMemo(() => new Map(BODY_PARTS.map((b) => [b.id, dictionaryFor(b.id).length])), [])
  const list = React.useMemo(() => (part ? dictionaryFor(part) : []), [part])
  const q = query.trim().toLowerCase()
  const shown = list.filter((ex) => matchesEquipment(ex, equip) && (!q || ex.name.toLowerCase().includes(q)))
  const partLabel = BODY_PARTS.find((b) => b.id === part)?.label

  return (
    <Dialog open={open} onClose={onClose} title="Exercise library" screen>
      <div className="flex items-center gap-2 border-b border-border px-3 py-3">
        {part ? (
          <button
            type="button"
            onClick={() => {
              setPart(null)
              setQuery('')
            }}
            aria-label="Back to body parts"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <span className="w-2" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-body text-lg font-bold">{partLabel ?? 'Exercise library'}</div>
          <div className="truncate text-xs text-muted-foreground">Adding to {dayLabel}</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!part ? (
          <div className="space-y-2">
            <p className="pb-1 text-sm text-muted-foreground">Pick a body part to see its exercises.</p>
            {BODY_PARTS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setPart(b.id)}
                className="flex min-h-[56px] w-full items-center justify-between rounded-xl border border-border bg-card px-4 text-left transition-colors hover:border-primary/50"
              >
                <span className="font-body text-base font-semibold">{b.label}</span>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  {counts.get(b.id)} exercises <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${partLabel?.toLowerCase()} exercises`}
                aria-label="Search exercises"
                className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-base outline-none focus:ring-2 focus:ring-primary sm:text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Equipment">
              {EQUIPMENT_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={equip === f.id}
                  onClick={() => setEquip(f.id)}
                  className={cn(
                    'min-h-[36px] rounded-full border px-3 text-xs font-semibold transition-colors',
                    equip === f.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/50',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <ul className="space-y-2">
              {shown.map((ex) => {
                const on = chosen.includes(ex.name)
                return (
                  <li key={ex.name}>
                    <button
                      type="button"
                      disabled={on}
                      onClick={() => {
                        onAdd(exerciseFromLibrary(ex, answers, 'Controlled tempo and full range of motion.'))
                        setAdded((n) => n + 1)
                      }}
                      className={cn(
                        'flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border bg-card px-4 text-left transition-colors',
                        on ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/50',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-body text-sm font-semibold">{ex.name}</span>
                        <span className="block text-xs text-muted-foreground">{equipmentTag(ex.equipment)}</span>
                      </span>
                      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', on ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
                        {on ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </span>
                    </button>
                  </li>
                )
              })}
              {shown.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No match. Try another word, or type your own below.</li>}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-border bg-background px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <Button type="button" variant="outline" className="w-full" onClick={onTypeOwn}>
          Can't find it? Type your own
        </Button>
        <Button type="button" className="w-full" onClick={onClose}>
          {added > 0 ? `Done (${added} added)` : 'Done'}
        </Button>
      </div>
    </Dialog>
  )
}
