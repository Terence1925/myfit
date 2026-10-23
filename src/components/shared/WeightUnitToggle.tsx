import { cn } from '@/lib/utils'
import { useWeightUnit, type WeightUnit } from '@/lib/weightUnit'

/** A two-button switch between pounds and kilograms. The choice applies to every weight in the app. */
export function WeightUnitToggle({ className }: { className?: string }) {
  const [unit, setUnit] = useWeightUnit()
  const options: [WeightUnit, string][] = [
    ['lbs', 'lb'],
    ['kg', 'kg'],
  ]
  return (
    <div className={cn('inline-flex rounded-lg border border-border p-0.5', className)} role="group" aria-label="Weight unit">
      {options.map(([id, label]) => (
        <button
          key={id}
          onClick={() => setUnit(id)}
          aria-pressed={unit === id}
          className={cn(
            'min-h-[36px] min-w-[44px] rounded-md px-3 text-sm font-semibold transition-colors',
            unit === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
