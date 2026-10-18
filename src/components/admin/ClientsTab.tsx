import * as React from 'react'
import { motion } from 'framer-motion'
import { Crown, UserCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClientDetail } from './ClientDetail'
import { auth, roles } from '@/lib/backend/api'
import { isPro } from '@/lib/billing'
import type { ActivityLogEntry, Profile, WorkoutProgram } from '@/lib/types'

export function ClientsTab({
  clients,
  programList,
  activityList,
  onRoleChange,
}: {
  clients: Profile[]
  programList: WorkoutProgram[]
  activityList: ActivityLogEntry[]
  onRoleChange: () => void
}) {
  const [selected, setSelected] = React.useState<Profile | null>(null)

  if (selected) {
    return (
      <ClientDetail
        client={selected}
        clientPrograms={programList.filter((p) => p.userId === selected.id)}
        clientActivity={activityList.filter((a) => a.userId === selected.id)}
        onBack={() => setSelected(null)}
        onMakeAdmin={async () => {
          await roles.promote(selected.id)
          onRoleChange()
          setSelected(null)
        }}
        onDelete={async () => {
          await auth.deleteMember(selected.id)
          onRoleChange()
          setSelected(null)
        }}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map((c, i) => {
        const programCount = programList.filter((p) => p.userId === c.id).length
        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full">
              <CardContent className="p-5 flex flex-col gap-3 h-full">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <UserCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="font-body font-bold truncate">{c.displayName}</div>
                      {isPro(c) && <Crown className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={isPro(c) ? 'default' : 'outline'}>{isPro(c) ? 'Pro' : 'Free'}</Badge>
                  <Badge variant="outline">{programCount} programs</Badge>
                  {c.tdee && <Badge variant="outline">TDEE {c.tdee}</Badge>}
                  {c.calorieTarget && <Badge variant="default">{c.calorieTarget} kcal</Badge>}
                  {c.recoveryScore !== undefined && <Badge variant="cyan">Recovery {c.recoveryScore}</Badge>}
                </div>
                <Button size="sm" variant="outline" className="mt-auto" onClick={() => setSelected(c)}>
                  View Profile
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
      {clients.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No clients yet.</p>}
    </div>
  )
}
