import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold font-body transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/30 bg-primary/10 text-primary',
        outline: 'border-border bg-transparent text-muted-foreground',
        success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        warning: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
        danger: 'border-red-500/30 bg-red-500/10 text-red-400',
        cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />
}
