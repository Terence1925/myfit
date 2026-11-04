import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Exercise } from '@/lib/types'

/** Reps as a number ("10"), a range ("8-12") or a time ("30 sec", "1 min"). */
const REPS_OK = /^(\d{1,3}(\s*-\s*\d{1,3})?|\d{1,3}\s*(sec|min))$/i

/**
 * A form for the person's own exercise: its name, sets and reps. It takes the place of the exercise it was opened from,
 * and keeps that exercise's rest time. Opened again on an exercise they typed in, it is the same form to change it.
 */
export function CustomExerciseDialog({
  open,
  onClose,
  current,
  onSave,
}: {
  open: boolean
  onClose: () => void
  /** The exercise being replaced */
  current: Exercise | null
  onSave: (exercise: Exercise) => Promise<void>
}) {
  const [name, setName] = React.useState('')
  const [sets, setSets] = React.useState('3')
  const [reps, setReps] = React.useState('10')
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  // Start from what they typed before, or empty for one of ours
  React.useEffect(() => {
    if (!open) return
    setError(null)
    setSaving(false)
    if (current?.custom) {
      setName(current.name)
      setSets(String(current.sets))
      setReps(current.reps)
    } else {
      setName('')
      setSets('3')
      setReps('10')
    }
    // only when it opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanName = name.trim().replace(/\s+/g, ' ')
    const n = Number(sets)
    const cleanReps = reps.trim()
    if (!cleanName) return setError('Type the name of the exercise.')
    if (!Number.isInteger(n) || n < 1 || n > 10) return setError('Sets should be a number from 1 to 10.')
    if (!REPS_OK.test(cleanReps)) return setError('Reps should be a number like 10, a range like 8-12, or a time like 30 sec.')
    setSaving(true)
    try {
      await onSave({
        name: cleanName,
        sets: n,
        reps: cleanReps,
        rest: current?.rest || '60-90 sec',
        notes: 'Your own exercise.',
        custom: true,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save it. Please try again.')
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Your own exercise" className="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {current ? (
            <>
              This takes the place of <span className="font-semibold text-foreground">{current.name}</span>.
            </>
          ) : (
            'Type the exercise you want to do.'
          )}
        </p>
        <div>
          <Label htmlFor="custom-name">Exercise</Label>
          <Input id="custom-name" value={name} maxLength={60} autoFocus onChange={(e) => setName(e.target.value)} placeholder="e.g. Cable Crunch" className="mt-1.5" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="custom-sets">Sets</Label>
            <Input id="custom-sets" inputMode="numeric" value={sets} maxLength={2} onChange={(e) => setSets(e.target.value.replace(/\D/g, ''))} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="custom-reps">Reps</Label>
            <Input id="custom-reps" value={reps} maxLength={10} onChange={(e) => setReps(e.target.value)} placeholder="10 or 8-12" className="mt-1.5" />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Use this exercise'}
          </Button>
          <Button type="button" variant="ghost" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
