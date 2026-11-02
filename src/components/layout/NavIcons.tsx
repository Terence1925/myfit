import type { SVGProps } from 'react'

/** The Progress tab icon: three solid bars (medium, tall, short). Takes its colour from the text colour like the other icons. */
export function ProgressBarsIcon({ strokeWidth: _strokeWidth, ...props }: SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="3" y="10" width="5" height="11" rx="1.6" />
      <rect x="9.5" y="3" width="5" height="18" rx="1.6" />
      <rect x="16" y="13" width="5" height="8" rx="1.6" />
    </svg>
  )
}
