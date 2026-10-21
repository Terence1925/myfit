import { motion } from 'framer-motion'
import { CalendarDays, ListChecks, Sparkles, TrendingUp, Waves } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ProgramData } from '@/lib/types'
import { BlockOverviewCard } from './BlockTimeline'

export function OverviewTab({
  program,
  createdAt,
  onSelectDay,
}: {
  program: ProgramData
  /** When the program was generated: week 1 starts that day. */
  createdAt: string
  onSelectDay: (day: number) => void
}) {
  return (
    <div className="space-y-8">
      <BlockOverviewCard createdAt={createdAt} block={program.trainingBlock} />

      <Card className="border-primary/20 bg-gradient-to-br from-card to-card/40">
        <CardContent className="p-6 sm:p-8">
          <p className="font-body leading-relaxed text-foreground/90">{program.overview}</p>
        </CardContent>
      </Card>

      {program.personalizationNotes?.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Why This Program Is Built For You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {program.personalizationNotes.map((note, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-foreground/90 font-body leading-relaxed">
                  <span className="mt-0.5 text-primary shrink-0">•</span> {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Weekly Volume</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground font-body">{program.weeklyVolume}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Waves className="h-5 w-5 text-accent" />
            </div>
            <CardTitle className="text-lg">Progression</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground font-body">{program.progressionStrategy}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" /> Warm-Up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {program.warmup.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground font-body">
                  <span className="text-primary">•</span> {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-accent" /> Cool-Down
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {program.cooldown.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground font-body">
                  <span className="text-accent">•</span> {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-4 font-display text-2xl tracking-wide">Your Training Days</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {program.days.map((day, i) => (
            <motion.button
              key={day.day}
              onClick={() => onSelectDay(day.day)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="group relative overflow-hidden rounded-xl border border-border bg-card/60 p-5 text-left transition-all hover:border-primary/50 hover:shadow-glow"
            >
              <div className="absolute -right-4 -top-4 font-display text-7xl text-primary/5 group-hover:text-primary/10 transition-colors">
                {day.day}
              </div>
              <div className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <CalendarDays className="h-3.5 w-3.5" /> Day {day.day}
              </div>
              <h4 className="relative mt-2 font-body text-lg font-bold text-foreground">{day.name}</h4>
              <p className="relative mt-1 text-sm text-muted-foreground capitalize">{day.focus}</p>
              <p className="relative mt-3 text-xs text-muted-foreground">
                {day.exercises.length} exercises &middot; {day.duration}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
