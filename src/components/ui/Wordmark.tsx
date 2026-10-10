import { cn } from '@/lib/utils'

/** "MyFit": black on a light screen, the logo's lime on a dark screen. Pass the size, e.g. "text-2xl". */
export function Wordmark({ className = 'text-2xl' }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-brand font-medium leading-none tracking-tight text-black dark:text-[hsl(var(--primary))]',
        className,
      )}
    >
      MyFit
    </span>
  )
}
