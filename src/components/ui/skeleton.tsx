import { cn } from '@/lib/utils'

/** A soft pulsing block shown while content loads, so the screen never flashes blank. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-secondary/70', className)} aria-hidden="true" />
}
