import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <div className="container max-w-3xl py-10 sm:py-16">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to MyFit
      </Link>

      <h1 className="font-display text-4xl tracking-wide mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {updated}</p>

      <div className="prose-legal space-y-5 font-body text-sm leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:text-xl [&_h2]:tracking-wide [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </div>
  )
}
