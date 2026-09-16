import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { actionIcon, actionLabel, timeAgo } from './shared'
import type { ActivityLogEntry, Profile } from '@/lib/types'

export function ActivityTab({ log, people }: { log: ActivityLogEntry[]; people: Profile[] }) {
  const findName = (userId: string) => people.find((p) => p.id === userId)?.displayName ?? 'Unknown user'

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-1">
          {log.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.6) }}
              className="flex items-center gap-3 border-b border-border/60 py-3 text-sm last:border-0"
            >
              {actionIcon(a.action)}
              <span className="flex-1 font-body">
                <span className="font-semibold">{findName(a.userId)}</span> {actionLabel(a.action)}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">{timeAgo(a.createdAt)}</span>
            </motion.div>
          ))}
          {log.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No activity recorded yet.</p>}
        </div>
      </CardContent>
    </Card>
  )
}
