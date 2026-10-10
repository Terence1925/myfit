import { cn } from '@/lib/utils'

/** The app logo (public/logo.png). Pass the size and corner rounding, e.g. "h-9 w-9 rounded-lg". */
export function Logo({ className = 'h-9 w-9 rounded-lg' }: { className?: string }) {
  return <img src="/logo.png" alt="MyFit" className={cn('object-cover', className)} draggable={false} />
}
