import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A circle that fills as you get closer to a goal (like a smartwatch ring). The centre shows "done/goal", or a check
 * once the goal is reached.
 */
export function ProgressRing({
  value,
  goal,
  size = 72,
  stroke = 8,
  className,
  label,
}: {
  value: number
  goal: number
  size?: number
  stroke?: number
  className?: string
  label?: string
}) {
  const safeGoal = Math.max(1, goal)
  const fraction = Math.min(1, Math.max(0, value / safeGoal))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const complete = value >= safeGoal

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }} role="img" aria-label={label ?? `${value} of ${safeGoal}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-border" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - fraction) }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {complete ? (
          <Check className="h-7 w-7 text-primary" strokeWidth={3} />
        ) : (
          <span className="font-display text-xl leading-none">
            {value}
            <span className="text-muted-foreground">/{safeGoal}</span>
          </span>
        )}
      </div>
      {complete && <div className="pointer-events-none absolute inset-0 rounded-full shadow-glow" />}
    </div>
  )
}
