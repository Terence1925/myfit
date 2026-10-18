import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CalendarClock, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProgramViewDialog } from './ProgramViewDialog'
import { cn } from '@/lib/utils'
import { goalLabelOf } from '@/lib/goalLabel'
import type { Profile, WorkoutProgram } from '@/lib/types'

function daysRemaining(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function ProgramsTab({ programList, people }: { programList: WorkoutProgram[]; people: Profile[] }) {
  const [filter, setFilter] = React.useState('all')
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const [viewing, setViewing] = React.useState<WorkoutProgram | null>(null)

  const findName = (userId: string) => people.find((p) => p.id === userId)?.displayName ?? 'Unknown user'
  const filtered = filter === 'all' ? programList : programList.filter((p) => p.userId === filter)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Filter by client</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Clients</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((p, i) => {
          const remaining = daysRemaining(p.expiresAt)
          const expired = remaining <= 0
          const isOpen = expanded === p.id
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card>
                <button
                  className="w-full text-left"
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                >
                  <CardContent className="p-5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-body font-bold">{p.programName}</span>
                        <Badge variant="outline">{findName(p.userId)}</Badge>
                        <Badge variant={expired ? 'danger' : remaining >= 14 ? 'default' : 'warning'} className="gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {expired ? 'Expired' : `${remaining}d left`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{p.programData.tagline}</p>
                    </div>
                    <ChevronDown className={cn('h-5 w-5 shrink-0 transition-transform text-muted-foreground', isOpen && 'rotate-180')} />
                  </CardContent>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <CardContent className="pt-0 px-5 pb-5 space-y-4 border-t border-border/60 mt-1">
                        <p className="text-sm text-muted-foreground font-body pt-4">{p.programData.overview}</p>

                        <Button size="sm" className="gap-1.5" onClick={() => setViewing(p)}>
                          <Eye className="h-4 w-4" /> View full program, PDF and email
                        </Button>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="default">{goalLabelOf(p.answers)}</Badge>
                          <Badge variant="outline">{p.answers.equipment.replace(/-/g, ' ')}</Badge>
                          <Badge variant="outline">{p.answers.trainingDays} days/wk</Badge>
                          <Badge variant="outline">{p.answers.experience} experience</Badge>
                          <Badge variant="cyan">Recovery {p.recoveryScore}/100</Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {p.programData.days.map((d) => (
                            <div key={d.day} className="rounded-lg border border-border p-3">
                              <div className="text-xs font-bold text-primary">Day {d.day}</div>
                              <div className="text-sm font-semibold">{d.name}</div>
                              <div className="text-xs text-muted-foreground capitalize">{d.focus}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No programs found.</p>}
      </div>

      <ProgramViewDialog
        program={viewing}
        client={viewing ? people.find((x) => x.id === viewing.userId) : undefined}
        onClose={() => setViewing(null)}
      />
    </div>
  )
}
