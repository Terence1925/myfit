import * as React from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { isPro } from '@/lib/billing'
import type { Profile } from '@/lib/types'

/**
 * Deleting a member can't be undone, so it takes two deliberate steps:
 *  1. read what will be lost and press "Yes, I want to delete this member"
 *  2. type the member's email to prove it, then press the red button
 */
export function DeleteMemberDialog({
  client,
  open,
  onClose,
  onConfirm,
}: {
  client: Profile
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [step, setStep] = React.useState<1 | 2>(1)
  const [typed, setTyped] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Start again at step 1 every time the dialog is opened
  React.useEffect(() => {
    if (open) {
      setStep(1)
      setTyped('')
      setBusy(false)
      setError(null)
    }
  }, [open])

  const matches = typed.trim().toLowerCase() === client.email.trim().toLowerCase()
  const close = () => {
    if (!busy) onClose()
  }

  const confirm = async () => {
    if (!matches || busy) return
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this member. Please try again.')
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={close} title={step === 1 ? `Delete ${client.displayName}?` : 'Final check'} className="max-w-lg">
      {step === 1 ? (
        <div className="space-y-4">
          <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="space-y-2">
              <p className="font-semibold text-foreground">This cannot be undone.</p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{client.displayName}</span> ({client.email}) will lose their login
                and everything saved under it: their programs, workout history, progress, food log and profile.
              </p>
            </div>
          </div>
          {isPro(client) && (
            <p className="rounded-xl border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
              This member has a <span className="font-semibold text-foreground">Pro subscription</span>. Deleting the account does{' '}
              <span className="font-semibold text-foreground">not</span> cancel it in Google Play. They would keep being billed until
              they cancel there themselves.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              Cancel, keep this member
            </Button>
            <Button variant="destructive" onClick={() => setStep(2)}>
              Yes, I want to delete this member
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To be sure, type this member's email below. The delete button stays off until it matches exactly.
          </p>
          <p className="rounded-lg bg-secondary/60 px-3 py-2 font-mono text-sm text-foreground">{client.email}</p>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type the email here"
            autoFocus
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void confirm()
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStep(1)} disabled={busy}>
              Go back
            </Button>
            <Button variant="destructive" className="gap-1.5" disabled={!matches || busy} onClick={() => void confirm()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete permanently
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
