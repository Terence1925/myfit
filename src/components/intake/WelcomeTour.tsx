import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Flame, PlayCircle, Sparkles, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SLIDES = [
  {
    icon: Sparkles,
    title: 'A plan made for you',
    text: 'Answer a few quick questions about your goal, your equipment and your schedule. MyFit builds your weekly plan in about two minutes.',
  },
  {
    icon: PlayCircle,
    title: 'Train with confidence',
    text: 'Every exercise has an animation and a real-person video. Tick off your sets, and the rest timer keeps you on pace.',
  },
  {
    icon: Flame,
    title: 'Stay on track',
    text: 'Log your food and keep your weekly streak. Reminders help you show up.',
  },
] as const

/** Three short screens shown once, before the first plan is built. */
export function WelcomeTour({ onDone }: { onDone: () => void }) {
  const [step, setStep] = React.useState(0)
  const [dir, setDir] = React.useState(1)
  const slide = SLIDES[step]
  const last = step === SLIDES.length - 1
  const Icon = slide.icon

  const next = () => {
    if (last) onDone()
    else {
      setDir(1)
      setStep((s) => s + 1)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-label="Welcome to MyFit"
    >
      <div className="relative flex items-center justify-between px-5 pt-[calc(1rem+env(safe-area-inset-top))]">
        <span className="font-brand text-2xl font-medium">MyFit</span>
        {!last && (
          <button onClick={onDone} className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            Skip
          </button>
        )}
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-8 flex h-40 w-40 items-center justify-center rounded-[2.5rem] bg-primary/15">
              <div className="absolute inset-3 rounded-[2rem] border border-primary/30" />
              <Icon className="h-20 w-20 text-primary" strokeWidth={1.5} />
              {step === 2 && <Utensils className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl bg-card p-2.5 text-primary shadow-card" />}
            </div>
            <h1 className="font-display text-5xl tracking-wide">{slide.title}</h1>
            <p className="mt-3 max-w-sm font-body text-base text-muted-foreground">{slide.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="mb-5 flex justify-center gap-2" aria-label={`Step ${step + 1} of ${SLIDES.length}`}>
          {SLIDES.map((_, i) => (
            <span key={i} className={cn('h-2 rounded-full transition-all duration-300', i === step ? 'w-8 bg-primary' : 'w-2 bg-border')} />
          ))}
        </div>
        <Button size="lg" className="w-full gap-1.5" onClick={next}>
          {last ? "Let's build my plan" : 'Next'} <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  )
}
