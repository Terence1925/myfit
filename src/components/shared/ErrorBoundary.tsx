import * as React from 'react'

/**
 * Catches a crash while a screen is drawing. Without it, one broken screen empties the whole app and the person is left
 * looking at a black or white page. This shows a short message instead, with the technical detail underneath so a
 * screenshot of it tells us what went wrong.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Screen crashed:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
        <h1 className="font-display text-4xl tracking-wide">SOMETHING WENT WRONG</h1>
        <p className="max-w-sm font-body text-sm text-muted-foreground">
          The app hit a problem while loading this screen. Your data is safe. Tap Try again, and if it keeps happening, send us a
          screenshot of this page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="min-h-[48px] rounded-xl bg-primary px-6 font-body font-bold text-primary-foreground"
        >
          Try again
        </button>
        <pre className="max-h-40 w-full max-w-sm overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-card p-3 text-left text-[11px] text-muted-foreground">
          {String(error.stack || error.message || error).slice(0, 700)}
        </pre>
      </div>
    )
  }
}
