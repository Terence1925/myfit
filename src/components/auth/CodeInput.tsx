import { cn } from '@/lib/utils'

interface CodeInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  length?: number
}

/**
 * Six boxes for a one-time code. A real, invisible input sits on top of the boxes, so tapping anywhere on
 * them focuses the input and the phone shows the number pad. Screen readers and tests use the input itself.
 */
export function CodeInput({ id, value, onChange, disabled, autoFocus, length = 6 }: CodeInputProps) {
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')
  const activeIndex = Math.min(value.length, length - 1)

  return (
    <div className="relative">
      <div className="grid grid-cols-6 gap-2" aria-hidden="true">
        {digits.map((digit, i) => (
          <div
            key={i}
            className={cn(
              'flex h-14 items-center justify-center rounded-xl border bg-card text-xl font-medium text-foreground transition-colors',
              i === activeIndex && !disabled ? 'border-primary ring-2 ring-primary/20' : 'border-input',
            )}
          >
            {digit}
          </div>
        ))}
      </div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        aria-label="6-digit code"
        maxLength={length}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        required
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
    </div>
  )
}
