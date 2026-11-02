import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * A round profile picture. With no photo it is the usual blank person icon: a head and shoulders inside a circle
 * outline (dark on light, light on dark).
 */
export function Avatar({ url, className }: { url?: string; className?: string }) {
  const id = React.useId().replace(/:/g, '')
  if (url) return <img src={url} alt="" className={cn('shrink-0 rounded-full object-cover', className)} />
  return (
    <span aria-hidden="true" className={cn('flex shrink-0 overflow-hidden rounded-full bg-card text-foreground', className)}>
      <svg viewBox="0 0 96 96" className="h-full w-full" fill="currentColor" data-blank-avatar>
        <defs>
          <clipPath id={`clip${id}`}>
            <circle cx="48" cy="48" r="41" />
          </clipPath>
          {/* a small gap between the head and the shoulders */}
          <mask id={`gap${id}`}>
            <rect width="96" height="96" fill="white" />
            <circle cx="48" cy="37" r="19.5" fill="black" />
          </mask>
        </defs>
        <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="5" />
        <g clipPath={`url(#clip${id})`}>
          <path d="M8 98C8 76 24 62 48 62s40 14 40 36z" mask={`url(#gap${id})`} />
        </g>
        <circle cx="48" cy="37" r="15.5" />
      </svg>
    </span>
  )
}
