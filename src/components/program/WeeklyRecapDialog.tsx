import * as React from 'react'
import { CalendarCheck, Dumbbell, Flame, Loader2, Share2, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { renderRecapCard, shareImage } from '@/lib/shareCard'
import type { Recap } from '@/lib/weeklyRecap'

/** The weekly recap: a card to read, and a button that shares it as a picture. */
export function WeeklyRecapDialog({ open, onClose, recap, isCurrentWeek }: { open: boolean; onClose: () => void; recap: Recap; isCurrentWeek: boolean }) {
  const [sharing, setSharing] = React.useState(false)
  const [note, setNote] = React.useState<string | null>(null)

  const share = async () => {
    setSharing(true)
    setNote(null)
    try {
      const blob = await renderRecapCard(recap)
      const result = await shareImage(blob, 'myfit-weekly-recap.png', 'My week on MyFit')
      if (result === 'saved') setNote('Picture saved. Share it from your downloads.')
    } catch (err) {
      if (!/cancel|abort|dismiss/i.test(err instanceof Error ? `${err.name} ${err.message}` : '')) setNote('Could not share. Please try again.')
    } finally {
      setSharing(false)
    }
  }

  const tiles = [
    { icon: <Dumbbell className="h-4 w-4" />, value: recap.workouts > recap.planned ? `${recap.workouts}` : `${recap.workouts}/${recap.planned}`, label: 'workouts' },
    { icon: <CalendarCheck className="h-4 w-4" />, value: `${recap.sets}`, label: 'sets done' },
    { icon: <Utensils className="h-4 w-4" />, value: `${recap.foodDays}`, label: 'days of food' },
    { icon: <Flame className="h-4 w-4" />, value: `${recap.streakWeeks}`, label: recap.streakWeeks === 1 ? 'week streak' : 'weeks streak' },
  ]

  return (
    <Dialog open={open} onClose={onClose} title={isCurrentWeek ? 'Your week so far' : 'Your last week'} className="max-w-md">
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-background p-5">
          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">My week</div>
            <div className="font-display text-4xl tracking-wide">{recap.label}</div>
            <p className="mt-2 font-body text-base font-bold leading-snug">{recap.headline}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {tiles.map((t) => (
                <div key={t.label} className="rounded-2xl bg-secondary/60 px-3 py-3">
                  <div className="flex items-center gap-2 font-display text-3xl leading-none text-primary">
                    {t.icon}
                    {t.value}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{t.label}</div>
                </div>
              ))}
            </div>
            {(recap.records > 0 || recap.avgKcal > 0) && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {recap.records > 0 && <span>🏆 {recap.records} new {recap.records === 1 ? 'record' : 'records'}</span>}
                {recap.avgKcal > 0 && <span>🍽️ about {recap.avgKcal} kcal a day</span>}
              </div>
            )}
            <p className="mt-3 font-body text-sm text-muted-foreground">{recap.note}</p>
          </div>
        </div>
        <Button className="w-full gap-2" size="lg" onClick={() => void share()} disabled={sharing}>
          {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />} Share my week
        </Button>
        {note && <p className="text-center text-xs text-muted-foreground">{note}</p>}
      </div>
    </Dialog>
  )
}
