import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="print:hidden border-t border-border/60 mt-6">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-0 sm:gap-3 pt-4 pb-1 sm:py-6 text-xs text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} MyFit. All rights reserved.</span>
        <div className="flex flex-wrap items-center justify-center gap-x-2">
          <Link to="/terms" className="px-1 py-3.5 underline underline-offset-2 hover:text-primary transition-colors">Terms of Service</Link>
          <span aria-hidden="true">&middot;</span>
          <Link to="/privacy" className="px-1 py-3.5 underline underline-offset-2 hover:text-primary transition-colors">Privacy Policy</Link>
          <span aria-hidden="true">&middot;</span>
          <Link to="/refund-policy" className="px-1 py-3.5 underline underline-offset-2 hover:text-primary transition-colors">Refund Policy</Link>
        </div>
      </div>
    </footer>
  )
}
