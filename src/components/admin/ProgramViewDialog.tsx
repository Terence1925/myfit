import * as React from 'react'
import { Check, Copy, FileDown, Loader2, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { exportProgramPdf } from '@/lib/exportProgramPdf'
import { programToText } from '@/lib/programText'
import { GOAL_LABELS } from '@/lib/tdee'
import type { Profile, WorkoutProgram } from '@/lib/types'

/** Admin support tool: read a client's whole program, save it as a PDF, copy it as text, or start an email to them. */
export function ProgramViewDialog({
  program,
  client,
  onClose,
}: {
  program: WorkoutProgram | null
  client: Profile | undefined
  onClose: () => void
}) {
  const [busy, setBusy] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setBusy(false)
    setCopied(false)
    setError(null)
  }, [program?.id])

  if (!program) return null
  const { programData: p, nutrition: n } = program
  const name = client?.displayName ?? 'Client'

  const downloadPdf = async () => {
    setBusy(true)
    setError(null)
    try {
      await exportProgramPdf(program)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (!/cancel|dismiss/i.test(msg)) setError('Could not create the PDF. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(programToText(program, name))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Could not copy. Select the text yourself instead.')
    }
  }

  const emailDraft = () => {
    if (!client?.email) return
    const subject = encodeURIComponent(`Your MyFit workout program: ${p.programName}`)
    const body = encodeURIComponent(
      `Hi ${name},\n\nHere is your MyFit workout program, as you asked. The PDF is attached.\n\nIf anything is unclear, just reply to this email.\n\nThe MyFit team`,
    )
    window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`
  }

  return (
    <Dialog open onClose={onClose} title={p.programName} className="max-w-3xl">
      <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{name}</Badge>
          {client?.email && <span className="text-xs text-muted-foreground">{client.email}</span>}
          <Badge>{GOAL_LABELS[program.answers.goal]}</Badge>
          <span className="text-xs text-muted-foreground">{p.days.length} days a week</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="gap-1.5" onClick={downloadPdf} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Download PDF
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={copyText}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy as text'}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={emailDraft} disabled={!client?.email}>
            <Mail className="h-4 w-4" /> Email draft
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Email draft opens your mail app addressed to the client. Download the PDF first, then attach it. To print, open the
          PDF and print it.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}

        {p.overview && <p className="font-body text-sm text-muted-foreground">{p.overview}</p>}

        {p.days.map((day) => (
          <div key={day.day} className="rounded-xl border border-border p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Day {day.day}</div>
            <div className="font-body font-bold">{day.name}</div>
            <div className="text-xs text-muted-foreground">
              {day.duration} · {day.focus}
            </div>
            <ol className="mt-3 space-y-2">
              {day.exercises.map((ex, i) => {
                const mindBody = ex.format === 'yoga' || ex.format === 'pilates'
                const timed = /sec|min|pumps/.test(ex.reps)
                return (
                  <li key={`${ex.name}-${i}`} className="text-sm">
                    <span className="font-semibold">
                      {i + 1}. {ex.name}
                    </span>
                    <span className="text-muted-foreground">
                      {' '}
                      — {mindBody ? '' : `${ex.sets} sets × `}
                      {ex.reps}
                      {timed ? '' : ' reps'}
                      {ex.eachSide ? ' each side' : ''}
                      {mindBody ? '' : `, rest ${ex.rest}`}
                    </span>
                    {ex.notes && <div className="text-xs text-muted-foreground">{ex.notes}</div>}
                  </li>
                )
              })}
            </ol>
          </div>
        ))}

        <div className="rounded-xl border border-border p-4 text-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nutrition targets</div>
          <p className="mt-1">
            {n.calorieTarget} kcal a day · Protein {n.proteinG} g · Carbs {n.carbsG} g · Fat {n.fatG} g
          </p>
        </div>
      </div>
    </Dialog>
  )
}
