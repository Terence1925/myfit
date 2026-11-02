import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** YYYY-MM-DD in the person's own time zone. */
export function toDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const fromDayKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] // the week starts on Monday, like the Home screen

/**
 * A day picker in the app's own style (replaces the phone's built-in date dialog): the month with arrows, round day
 * buttons, today ringed in the theme colour and the chosen day filled with it. Days after `max` cannot be chosen.
 */
export function CalendarPicker({
  open,
  onClose,
  value,
  onChange,
  max,
  title = 'Pick a day',
}: {
  open: boolean
  onClose: () => void
  /** The chosen day, as YYYY-MM-DD */
  value: string
  onChange: (day: string) => void
  /** The last day that can be chosen, as YYYY-MM-DD */
  max?: string
  title?: string
}) {
  const todayKey = toDayKey(new Date())
  const [month, setMonth] = React.useState(() => {
    const d = fromDayKey(value)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  // Open on the month of the chosen day
  React.useEffect(() => {
    if (!open) return
    const d = fromDayKey(value)
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1))
    // only when it opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const year = month.getFullYear()
  const m = month.getMonth()
  const daysInMonth = new Date(year, m + 1, 0).getDate()
  const lead = (new Date(year, m, 1).getDay() + 6) % 7 // blanks before the 1st (Monday first)
  const cells: (number | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const lastKey = max ?? '9999-12-31'
  const nextDisabled = toDayKey(new Date(year, m + 1, 1)) > lastKey

  const pick = (day: number) => {
    onChange(toDayKey(new Date(year, m, day)))
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-4 shadow-glow-lg"
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setMonth(new Date(year, m - 1, 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-secondary"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="font-display text-xl tracking-wide" aria-live="polite">
                {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <button
                type="button"
                aria-label="Next month"
                disabled={nextDisabled}
                onClick={() => setMonth(new Date(year, m + 1, 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-secondary disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {WEEKDAYS.map((w, i) => (
                <div key={i} className="py-1.5">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={`b${i}`} />
                const key = toDayKey(new Date(year, m, day))
                const selected = key === value
                const isToday = key === todayKey
                const disabled = key > lastKey
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-current={isToday ? 'date' : undefined}
                    aria-label={new Date(year, m, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    onClick={() => pick(day)}
                    className={cn(
                      'mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors',
                      selected
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : isToday
                          ? 'border-2 border-primary text-primary hover:bg-primary/10'
                          : 'text-foreground hover:bg-secondary',
                      disabled && 'pointer-events-none text-muted-foreground/40',
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <button
                type="button"
                disabled={todayKey > lastKey}
                onClick={() => {
                  onChange(todayKey)
                  onClose()
                }}
                className="min-h-[44px] rounded-full px-4 text-sm font-bold text-primary hover:bg-primary/10 disabled:opacity-40"
              >
                Today
              </button>
              <button type="button" onClick={onClose} className="min-h-[44px] rounded-full px-4 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground">
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
