import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="print:hidden border-t border-border/60 mt-16">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 py-6 text-xs text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} FORGEFIT. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link to="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link>
        </div>
      </div>
    </footer>
  )
}
