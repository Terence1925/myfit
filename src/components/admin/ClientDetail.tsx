import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { actionIcon, actionLabel, timeAgo } from './shared'
import { ProgramViewDialog } from './ProgramViewDialog'
import { GOAL_LABELS } from '@/lib/tdee'
import type { ActivityLogEntry, Profile, WorkoutProgram } from '@/lib/types'

export function ClientDetail({
  client,
  clientPrograms,
  clientActivity,
  onBack,
  onMakeAdmin,
}: {
  client: Profile
  clientPrograms: WorkoutProgram[]
  clientActivity: ActivityLogEntry[]
  onBack: () => void
  onMakeAdmin: () => void
}) {
  const [viewing, setViewing] = React.useState<WorkoutProgram | null>(null)
  return (
    <div className="space-y-6">
      <ProgramViewDialog program={viewing} client={client} onClose={() => setViewing(null)} />
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> Back to Clients
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-wide">{client.displayName}</h2>
          <p className="text-sm text-muted-foreground">{client.email}</p>
        </div>
        <Button variant="outline" className="gap-1.5" onClick={onMakeAdmin}>
          <ShieldCheck className="h-4 w-4" /> Make Admin
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-body font-bold mb-3 text-sm uppercase tracking-widest text-muted-foreground">
            Body & Lifestyle
          </h3>
          <div className="flex flex-wrap gap-2">
            {client.sex && <Badge variant="outline">{client.sex}</Badge>}
            {client.age && <Badge variant="outline">{client.age} yrs</Badge>}
            {client.weightKg && <Badge variant="outline">{client.weightKg} kg</Badge>}
            {client.heightCm && <Badge variant="outline">{client.heightCm} cm</Badge>}
            {client.activityLevel && <Badge variant="outline">{client.activityLevel}</Badge>}
            {client.sleepHours && <Badge variant="outline">{client.sleepHours} sleep</Badge>}
            {client.sleepQuality && <Badge variant="outline">{client.sleepQuality} quality</Badge>}
            {client.stressLevel && <Badge variant="outline">{client.stressLevel} stress</Badge>}
            {client.goal && <Badge variant="default">{GOAL_LABELS[client.goal]}</Badge>}
            {client.recoveryScore !== undefined && <Badge variant="cyan">Recovery {client.recoveryScore}/100</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-body font-bold mb-3 text-sm uppercase tracking-widest text-muted-foreground">
            Macro Targets
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">BMR</div>
              <div className="font-display text-2xl">{client.bmr ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">TDEE</div>
              <div className="font-display text-2xl">{client.tdee ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Target</div>
              <div className="font-display text-2xl text-gradient-gold">{client.calorieTarget ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Protein</div>
              <div className="font-display text-2xl">{client.proteinG ?? '—'}g</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-body font-bold mb-3 text-sm uppercase tracking-widest text-muted-foreground">
            Generated Programs ({clientPrograms.length})
          </h3>
          <div className="space-y-2">
            {clientPrograms.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span className="font-semibold">{p.programName}</span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setViewing(p)}>
                    <Eye className="h-4 w-4" /> View
                  </Button>
                </span>
              </div>
            ))}
            {clientPrograms.length === 0 && (
              <p className="text-sm text-muted-foreground">No programs generated yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-body font-bold mb-3 text-sm uppercase tracking-widest text-muted-foreground">
            Activity Log
          </h3>
          <div className="space-y-3">
            {clientActivity.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 text-sm"
              >
                {actionIcon(a.action)}
                <span className="flex-1 font-body">{actionLabel(a.action)}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
              </motion.div>
            ))}
            {clientActivity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
