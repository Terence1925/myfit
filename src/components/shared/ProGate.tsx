import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function ProGate({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const navigate = useNavigate()
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/30 shadow-glow">
          <Crown className="h-9 w-9 text-primary" />
        </div>
        <h2 className="font-display text-4xl tracking-wide text-gradient-gold">{title}</h2>
        <p className="mt-3 max-w-md font-body text-muted-foreground">{description}</p>
        <Button size="lg" className="mt-6 gap-2" onClick={() => navigate('/pricing')}>
          <Crown className="h-4 w-4" /> Upgrade to Pro
        </Button>
      </motion.div>
    </div>
  )
}
