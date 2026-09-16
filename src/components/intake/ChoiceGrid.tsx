import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChoiceOption<T extends string = string> {
  value: T
  label: string
  description?: string
  icon?: ReactNode
}

export function ChoiceGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: ChoiceOption<T>[]
  value: T | undefined
  onChange: (v: T) => void
  columns?: 1 | 2 | 3
}) {
  const colClass = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
  return (
    <div className={cn('grid gap-3', colClass)}>
      {options.map((opt, i) => {
        const active = value === opt.value
        return (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200',
              'hover:border-primary/50 hover:bg-primary/5',
              active
                ? 'border-primary bg-primary/10 shadow-glow'
                : 'border-border bg-card/40',
            )}
          >
            {opt.icon && <div className="text-primary shrink-0">{opt.icon}</div>}
            <div className="flex-1">
              <div className={cn('font-body font-semibold', active ? 'text-primary' : 'text-foreground')}>
                {opt.label}
              </div>
              {opt.description && (
                <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
              )}
            </div>
            {active && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-gradient"
              >
                <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
              </motion.div>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

export function MultiChoiceGrid<T extends string>({
  options,
  values,
  onChange,
  columns = 2,
}: {
  options: ChoiceOption<T>[]
  values: T[]
  onChange: (v: T[]) => void
  columns?: 1 | 2 | 3
}) {
  const toggle = (v: T) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v))
    else onChange([...values, v])
  }
  const colClass = columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
  return (
    <div className={cn('grid gap-3', colClass)}>
      {options.map((opt, i) => {
        const active = values.includes(opt.value)
        return (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200',
              'hover:border-primary/50 hover:bg-primary/5',
              active ? 'border-primary bg-primary/10 shadow-glow' : 'border-border bg-card/40',
            )}
          >
            <div className="flex-1">
              <div className={cn('font-body font-semibold', active ? 'text-primary' : 'text-foreground')}>
                {opt.label}
              </div>
            </div>
            <div
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                active ? 'border-primary bg-gold-gradient' : 'border-border',
              )}
            >
              {active && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
