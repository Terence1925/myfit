import * as React from 'react'
import { cn } from '@/lib/utils'

// An inline scroll wheel for picking a time (hour, minute, AM/PM), like the iPhone alarm picker.
// The value is "HH:MM" in 24-hour time, the same as the rest of the reminder settings.

const ITEM = 40 // height of one row, in px. The wheel shows three rows: one above, the picked one, one below.
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const PERIODS = ['AM', 'PM']

function splitTime(value: string): { hour: number; minute: number; pm: boolean } {
  const [h, m] = value.split(':').map(Number)
  return { hour: (h % 12 || 12) - 1, minute: m, pm: h >= 12 }
}

function joinTime(hourIndex: number, minute: number, pm: boolean): string {
  const h24 = (hourIndex + 1) % 12 + (pm ? 12 : 0)
  return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function Column({
  items,
  index,
  disabled,
  onPick,
  label,
}: {
  items: string[]
  index: number
  disabled: boolean
  onPick: (i: number) => void
  label: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const timer = React.useRef<number | undefined>(undefined)

  // Keep the wheel on the picked row when the value changes from outside (e.g. the first load)
  React.useEffect(() => {
    const el = ref.current
    if (el && Math.round(el.scrollTop / ITEM) !== index) el.scrollTop = index * ITEM
  }, [index])

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      onScroll={() => {
        const el = ref.current
        if (!el || disabled) return
        window.clearTimeout(timer.current)
        // Wait until the wheel stops moving, then take the row that is in the middle
        timer.current = window.setTimeout(() => {
          const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM)))
          if (i !== index) onPick(i)
        }, 140)
      }}
      className={cn(
        'relative h-[120px] w-20 snap-y snap-mandatory overflow-y-auto overscroll-contain',
        disabled && 'pointer-events-none opacity-50',
      )}
      style={{ scrollbarWidth: 'none' }}
    >
      <div style={{ height: ITEM }} />
      {items.map((text, i) => (
        <div
          key={text}
          role="option"
          aria-selected={i === index}
          onClick={() => {
            ref.current?.scrollTo({ top: i * ITEM, behavior: 'smooth' })
            onPick(i)
          }}
          className={cn(
            'flex snap-center items-center justify-center font-body text-2xl font-normal transition-colors',
            i === index ? 'text-foreground' : 'text-muted-foreground/50',
          )}
          style={{ height: ITEM }}
        >
          {text}
        </div>
      ))}
      <div style={{ height: ITEM }} />
    </div>
  )
}

export function TimeWheel({
  value,
  disabled = false,
  onChange,
}: {
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  const { hour, minute, pm } = splitTime(value)
  return (
    <div className="relative flex items-center justify-center gap-2 rounded-3xl bg-secondary/40 px-4 py-2">
      {/* The highlight pill behind the picked row */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 rounded-full border border-primary/40 bg-primary/15" style={{ top: ITEM + 8 + 2, height: ITEM - 4 }} />
      <Column items={HOURS} index={hour} disabled={disabled} label="Hour" onPick={(i) => onChange(joinTime(i, minute, pm))} />
      <Column items={MINUTES} index={minute} disabled={disabled} label="Minute" onPick={(i) => onChange(joinTime(hour, i, pm))} />
      <Column items={PERIODS} index={pm ? 1 : 0} disabled={disabled} label="AM or PM" onPick={(i) => onChange(joinTime(hour, minute, i === 1))} />
    </div>
  )
}
