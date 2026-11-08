import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { useSubscribeSheet } from '@/context/SubscribeSheetContext'
import { useAuth } from '@/context/AuthContext'
import { hasSubscribedBefore } from '@/lib/billing'

/** A locked page: the page behind is blurred, with a small lock. Tapping the lock opens the plan sheet. */
export function ProGate({ description }: { title?: string; description?: string }) {
  const { openSubscribe } = useSubscribeSheet()
  const { profile } = useAuth()
  // The line under the lock says what the tap does: a trial for a new member, a subscription for someone whose trial or subscription ended
  const line = hasSubscribedBefore(profile) ? 'Tap the lock to subscribe and unlock your progress.' : 'Tap the lock to start your 7-day free trial.'
  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      <div aria-hidden="true" className="container pointer-events-none select-none space-y-4 py-10 blur-md">
        <div className="h-10 w-56 rounded-xl bg-primary/40" />
        <div className="h-40 rounded-2xl bg-primary/25" />
        <div className="h-40 rounded-2xl bg-muted" />
        <div className="h-24 rounded-2xl bg-primary/25" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/30 px-6 text-center backdrop-blur-md">
        <motion.button
          type="button"
          onClick={openSubscribe}
          aria-label="Unlock with a subscription"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-gradient shadow-glow-lg"
        >
          <Lock className="h-5 w-5 text-primary-foreground" />
        </motion.button>
        <p className="mt-3 max-w-xs font-body text-xs text-muted-foreground">{description ? `${description} ` : ""}{line}</p>
      </div>
    </div>
  )
}
