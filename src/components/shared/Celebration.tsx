import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Medal, PartyPopper, Trophy } from 'lucide-react'
import type { CelebrationDetail } from '@/lib/feedback'

// A short burst of confetti with a message, shown when a workout is finished or a personal record is set.
// Mounted once in App; anything calls `celebrate()` from lib/feedback.ts. It never blocks taps (pointer-events: none).

const COLORS = ['#b5f13b', '#f97316', '#2dd4bf', '#facc15', '#a78bfa', '#f472b6']
const PIECES = 36

// Spread and fall are decided once, so the burst looks the same on every render
const pieces = Array.from({ length: PIECES }, (_, i) => {
  const angle = (i / PIECES) * Math.PI * 2
  const power = 120 + ((i * 53) % 140)
  return {
    id: i,
    x: Math.cos(angle) * power,
    up: Math.sin(angle) * power * 0.9 - 80,
    rotate: (i * 97) % 540,
    color: COLORS[i % COLORS.length],
    size: 6 + ((i * 7) % 7),
    delay: (i % 6) * 0.015,
  }
})

export function Celebration() {
  const [detail, setDetail] = React.useState<CelebrationDetail | null>(null)
  const [round, setRound] = React.useState(0)

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const onCelebrate = (e: Event) => {
      setDetail((e as CustomEvent<CelebrationDetail>).detail)
      setRound((r) => r + 1)
      clearTimeout(timer)
      timer = setTimeout(() => setDetail(null), 2800)
    }
    window.addEventListener('myfit:celebrate', onCelebrate)
    return () => {
      window.removeEventListener('myfit:celebrate', onCelebrate)
      clearTimeout(timer)
    }
  }, [])

  const record = detail?.kind === 'record'
  const Icon = record ? Trophy : detail?.kind === 'badge' ? Medal : PartyPopper

  return (
    <AnimatePresence>
      {detail && (
        <motion.div
          key={round}
          className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          role="status"
          aria-live="polite"
        >
          {pieces.map((p) => (
            <motion.span
              key={p.id}
              className="absolute rounded-[2px]"
              style={{ width: p.size, height: p.size * 1.6, backgroundColor: p.color }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
              animate={{ x: p.x, y: [0, p.up, p.up + 320], opacity: [1, 1, 0], rotate: p.rotate, scale: 1 }}
              transition={{ duration: 1.7, delay: p.delay, ease: 'easeOut', times: [0, 0.35, 1] }}
            />
          ))}
          <motion.div
            className="mx-6 max-w-sm rounded-3xl border border-primary/40 bg-card/95 px-8 py-7 text-center shadow-glow-lg backdrop-blur"
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
          >
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              {detail.emoji ? <span className="text-4xl leading-none">{detail.emoji}</span> : <Icon className="h-8 w-8" />}
            </div>
            <div className="font-display text-3xl tracking-wide text-foreground">{detail.title}</div>
            {detail.subtitle && <div className="mt-1 font-body text-sm text-muted-foreground">{detail.subtitle}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
