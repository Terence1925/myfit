import * as React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Medal } from 'lucide-react'
import { foodLog } from '@/lib/backend/api'
import { BADGES, isEarned } from '@/lib/badges'
import { clearNewBadges, loadNewBadges } from '@/lib/badgeStore'
import { loadProgressData, type ProgressData } from '@/lib/progressData'
import { buildRecap, recapRange, dateKey } from '@/lib/weeklyRecap'
import type { FoodLogEntry } from '@/lib/types'
import { BadgesDialog } from './BadgesDialog'
import { WeeklyRecapDialog } from './WeeklyRecapDialog'

/** Two tiles under the Today card: the weekly recap and the badges. Each opens a window. */
export function ProgressTiles({ userId }: { userId: string }) {
  const [data, setData] = React.useState<ProgressData | null>(null)
  const [weekFood, setWeekFood] = React.useState<FoodLogEntry[]>([])
  const [open, setOpen] = React.useState<'recap' | 'badges' | null>(null)
  const [newIds, setNewIds] = React.useState<string[]>(() => loadNewBadges(userId))
  const range = React.useMemo(() => recapRange(new Date()), [])

  const refresh = React.useCallback(async () => {
    const [d, food] = await Promise.all([
      loadProgressData(userId),
      foodLog.listForRange(userId, dateKey(range.start), dateKey(range.end)).catch(() => [] as FoodLogEntry[]),
    ])
    setData(d)
    setWeekFood(food)
    setNewIds(loadNewBadges(userId))
  }, [userId, range])

  React.useEffect(() => {
    void refresh()
    const events = ['myfit:session-saved', 'myfit:food-saved', 'myfit:badges-changed']
    events.forEach((e) => window.addEventListener(e, refresh))
    return () => events.forEach((e) => window.removeEventListener(e, refresh))
  }, [refresh])

  if (!data) return null
  const recap = buildRecap(data.sessions, weekFood, range, data.plannedDays)
  const earned = BADGES.filter((b) => isEarned(b, data.stats))
  const latest = earned.slice(-3).reverse()

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          onClick={() => setOpen('recap')}
          whileTap={{ scale: 0.97 }}
          className="flex flex-col items-start rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-colors hover:border-primary/40"
        >
          <span className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-widest text-primary">
            {range.current ? 'This week' : 'Last week'}
          </span>
          <span className="mt-2 font-display text-2xl leading-tight tracking-wide">WEEKLY RECAP</span>
          <span className="mt-1 text-xs text-muted-foreground">
            {recap.workouts} {recap.workouts === 1 ? 'workout' : 'workouts'} · {recap.foodDays} food {recap.foodDays === 1 ? 'day' : 'days'}
          </span>
          <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-primary">
            View <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => {
            setOpen('badges')
          }}
          whileTap={{ scale: 0.97 }}
          className="flex flex-col items-start rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-colors hover:border-primary/40"
        >
          <span className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-widest text-primary">
            Badges {newIds.length > 0 ? <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">New</span> : <Medal className="h-3.5 w-3.5" />}
          </span>
          <span className="mt-2 font-display text-2xl leading-tight tracking-wide">
            {earned.length} OF {BADGES.length}
          </span>
          <span className="mt-1 flex h-6 items-center gap-1 text-lg">
            {latest.length > 0 ? latest.map((b) => <span key={b.id}>{b.emoji}</span>) : <span className="text-xs text-muted-foreground">Finish a workout to earn your first</span>}
          </span>
          <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-primary">
            See all <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </motion.button>
      </div>

      <WeeklyRecapDialog open={open === 'recap'} onClose={() => setOpen(null)} recap={recap} isCurrentWeek={range.current} />
      <BadgesDialog
        open={open === 'badges'}
        onClose={() => {
          setOpen(null)
          // seen now: the "New" tags go away
          clearNewBadges(userId)
          setNewIds([])
        }}
        stats={data.stats}
        newIds={newIds}
      />
    </>
  )
}
