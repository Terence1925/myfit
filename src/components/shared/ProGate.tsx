import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { useSubscribeSheet } from '@/context/SubscribeSheetContext'
import { Button } from '@/components/ui/button'

/** A locked page: the page behind is blurred, with a lock icon, the title, a short line and one Subscribe button. */
export function ProGate({ title, description }: { title: string; description: string }) {
  const { openSubscribe } = useSubscribeSheet()
  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      <div aria-hidden="true" className="container pointer-events-none select-none space-y-4 py-10 blur-md">
        <div className="h-10 w-56 rounded-xl bg-muted" />
        <div className="h-40 rounded-2xl bg-card" />
        <div className="h-40 rounded-2xl bg-card" />
        <div className="h-24 rounded-2xl bg-card" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-gradient shadow-glow-lg">
            <Lock className="h-9 w-9 text-primary-foreground" />
          </div>
          <h2 className="mt-4 font-display text-3xl tracking-wide text-foreground">{title}</h2>
          <p className="mt-2 max-w-xs font-body text-xs text-muted-foreground">{description}</p>
          <Button size="lg" className="mt-5" onClick={openSubscribe}>
            Subscribe
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
