import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="print:hidden border-t border-border/60 mt-16">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 py-6 text-xs text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} MyFit. All rights reserved.</span>
        <div className="flex flex-wrap items-center justify-center gap-x-2">
          <Link to="/terms" className="px-2 py-3.5 hover:text-primary transition-colors">Terms</Link>
          <Link to="/privacy" className="px-2 py-3.5 hover:text-primary transition-colors">Privacy</Link>
          <Link to="/refund-policy" className="px-2 py-3.5 hover:text-primary transition-colors">Refund policy</Link>
          <Link to="/delete-account" className="px-2 py-3.5 hover:text-primary transition-colors">Delete account</Link>
        </div>
      </div>
    </footer>
  )
}
