import * as React from 'react'
import { motion } from 'framer-motion'
import { Lock, ShieldCheck, ShieldOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { roles } from '@/lib/backend/api'
import type { Profile } from '@/lib/types'

// Must match supabase/migrations/0006_protect_owner_admin_role.sql — the database is the real
// enforcement; this just avoids showing a Demote button that would fail with a confusing error.
const OWNER_EMAIL = 'ttagayona1985@gmail.com'

export function AdminsTab({
  admins,
  clients,
  onRoleChange,
}: {
  admins: Profile[]
  clients: Profile[]
  onRoleChange: () => void
}) {
  const [demoteError, setDemoteError] = React.useState<string | null>(null)
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-2xl tracking-wide mb-4">Admin Team</h3>
        {demoteError && (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {demoteError}
          </div>
        )}
        <div className="space-y-3">
          {admins.map((a, i) => {
            const isOwnerRow = a.email === OWNER_EMAIL
            const canDemote = !isOwnerRow
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-body font-bold">{a.displayName}</div>
                        <div className="text-xs text-muted-foreground">{a.email}</div>
                      </div>
                    </div>
                    {canDemote ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={async () => {
                          setDemoteError(null)
                          try {
                            await roles.demote(a.id)
                            onRoleChange()
                          } catch (err) {
                            setDemoteError(err instanceof Error ? err.message : 'Failed to demote.')
                          }
                        }}
                      >
                        <ShieldOff className="h-3.5 w-3.5" /> Demote
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" /> Owner — protected
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="font-display text-2xl tracking-wide mb-4">Promote a Client</h3>
        <div className="space-y-3">
          {clients.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-body font-bold">{c.displayName}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={async () => {
                      await roles.promote(c.id)
                      onRoleChange()
                    }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> Make Admin
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {clients.length === 0 && <p className="text-sm text-muted-foreground">No clients to promote.</p>}
        </div>
      </div>
    </div>
  )
}
