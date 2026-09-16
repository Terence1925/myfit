import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Users, ShieldCheck, Dumbbell, Activity, Crown, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { actionIcon, actionLabel, timeAgo } from './shared'
import { isPro, PRO_PRICES } from '@/lib/billing'
import type { ActivityLogEntry, Profile, WorkoutProgram } from '@/lib/types'

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 shrink-0">{icon}</div>
        <div>
          <div className="font-display text-3xl tracking-wide">{value}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminOverviewTab({
  clients,
  admins,
  programList,
  activityList,
}: {
  clients: Profile[]
  admins: Profile[]
  programList: WorkoutProgram[]
  activityList: ActivityLogEntry[]
}) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const activityLast7d = activityList.filter((a) => new Date(a.createdAt).getTime() > weekAgo).length
  const recentSignups = [...clients, ...admins]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
  const recentActivity = activityList.slice(0, 10)
  const findName = (userId: string) =>
    [...clients, ...admins].find((p) => p.id === userId)?.displayName ?? 'Unknown user'

  const allPeople = [...clients, ...admins]
  const subscribers = allPeople.filter((p) => isPro(p))
  const mrr = subscribers.reduce((sum, p) => {
    if (p.subscriptionPeriod === 'monthly') return sum + PRO_PRICES.monthly.price
    if (p.subscriptionPeriod === 'yearly') return sum + PRO_PRICES.yearly.price / 12
    return sum
  }, 0)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-5 w-5 text-primary" />} label="Clients" value={clients.length} />
        <StatCard icon={<ShieldCheck className="h-5 w-5 text-primary" />} label="Admins" value={admins.length} />
        <StatCard icon={<Dumbbell className="h-5 w-5 text-primary" />} label="Active Programs" value={programList.length} />
        <StatCard icon={<Activity className="h-5 w-5 text-primary" />} label="7-Day Activity" value={activityLast7d} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Crown className="h-5 w-5 text-primary" />} label="Pro Subscribers" value={subscribers.length} />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          label="Est. MRR"
          value={`₱${mrr.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-xl tracking-wide mb-4">Recent Signups</h3>
            <div className="space-y-3">
              {recentSignups.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-body font-semibold">{p.displayName}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(p.createdAt)}</span>
                </motion.div>
              ))}
              {recentSignups.length === 0 && (
                <p className="text-sm text-muted-foreground">No signups yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-xl tracking-wide mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 text-sm"
                >
                  {actionIcon(a.action)}
                  <span className="flex-1 font-body">
                    <span className="font-semibold">{findName(a.userId)}</span> {actionLabel(a.action)}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(a.createdAt)}</span>
                </motion.div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
