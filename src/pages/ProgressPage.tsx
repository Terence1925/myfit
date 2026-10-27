import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { Trash2, TrendingDown, TrendingUp, Plus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ProGate } from '@/components/shared/ProGate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { WeightChart } from '@/components/progress/WeightChart'
import { metrics } from '@/lib/backend/api'
import { hasProAccess } from '@/lib/billing'
import { kgToLbs, lbsToKg } from '@/lib/tdee'
import { cn } from '@/lib/utils'
import { useWeightUnit } from '@/lib/weightUnit'
import type { BodyMetricEntry } from '@/lib/types'

export default function ProgressPage() {
  const { profile, role } = useAuth()
  const [unit, setUnit] = useWeightUnit()
  const [entries, setEntries] = React.useState<BodyMetricEntry[]>([])
  const [loaded, setLoaded] = React.useState(false)
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [weight, setWeight] = React.useState('')
  const [bodyFat, setBodyFat] = React.useState('')
  const [notes, setNotes] = React.useState('')

  const refresh = React.useCallback(async () => {
    if (!profile) return
    setEntries(await metrics.listForUser(profile.id))
    setLoaded(true)
  }, [profile])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  if (!profile) return null

  if (!hasProAccess(profile, role)) {
    return (
      <ProGate
        title="PROGRESS TRACKING"
        description="Log your weight and body metrics over time, see your trend charted, and track exactly how your program is working. Upgrade to Pro to unlock it."
      />
    )
  }

  if (!loaded) {
    return (
      <div className="container max-w-3xl space-y-4 py-8 sm:py-12" aria-busy="true">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const w = Number(weight)
    if (!w || w <= 0) return
    const weightKg = unit === 'lbs' ? lbsToKg(w) : w
    await metrics.log(profile.id, {
      date: new Date(date).toISOString(),
      weightKg: Math.round(weightKg * 10) / 10,
      bodyFatPercent: bodyFat ? Number(bodyFat) : undefined,
      notes: notes || undefined,
    })
    setWeight('')
    setBodyFat('')
    setNotes('')
    refresh()
  }

  const displayValue = (kg: number) => (unit === 'lbs' ? kgToLbs(kg) : kg)
  const points = entries.map((e) => ({ date: e.date, value: Math.round(displayValue(e.weightKg) * 10) / 10 }))

  const first = entries[0]
  const last = entries[entries.length - 1]
  const delta = first && last ? displayValue(last.weightKg) - displayValue(first.weightKg) : 0
  const goodDirection =
    profile.goal === 'lose-weight' ? delta < 0 : profile.goal === 'build-muscle' ? delta > 0 : null

  return (
    <div className="container py-8 sm:py-12 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl tracking-wide">Progress</h1>
        <div className="inline-flex rounded-lg border border-border p-1">
          {(['lbs', 'kg'] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={cn(
                'min-h-[44px] rounded-md px-5 text-sm font-semibold transition-colors sm:min-h-0 sm:px-4 sm:py-1.5',
                unit === u ? 'bg-gold-gradient text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {u.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {entries.length >= 2 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Weight trend</CardTitle>
            <Badge variant={goodDirection === null ? 'outline' : goodDirection ? 'success' : 'danger'} className="gap-1">
              {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {delta > 0 ? '+' : ''}
              {delta.toFixed(1)} {unit} since start
            </Badge>
          </CardHeader>
          <CardContent>
            <WeightChart points={points} unitLabel={unit} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Log an entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="weight">Weight ({unit})</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1.5"
                placeholder={unit === 'lbs' ? '175' : '79'}
                required
              />
            </div>
            <div>
              <Label htmlFor="bodyFat">Body Fat % (optional)</Label>
              <Input
                id="bodyFat"
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                className="mt-1.5"
                placeholder="18.5"
              />
            </div>
            <Button type="submit" className="gap-1.5">
              <Plus className="h-4 w-4" /> Log entry
            </Button>
            <div className="col-span-2 sm:col-span-4">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5"
                placeholder="Feeling strong, slept well..."
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...entries].reverse().map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
            >
              <div>
                <span className="font-semibold">{displayValue(e.weightKg).toFixed(1)} {unit}</span>
                {e.bodyFatPercent && <span className="text-muted-foreground ml-2">{e.bodyFatPercent}% BF</span>}
                {e.notes && <p className="text-xs text-muted-foreground mt-0.5">{e.notes}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</span>
                <button
                  onClick={async () => {
                    await metrics.delete(e.id, profile.id)
                    refresh()
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
          {entries.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm font-semibold">Log your first weight above to start your chart.</p>
              <p className="mt-1 text-xs text-muted-foreground">Weigh yourself once a week, at the same time of day, for the clearest trend.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
