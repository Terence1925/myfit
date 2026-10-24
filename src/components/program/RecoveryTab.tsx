import { BatteryMedium, CalendarCheck, Dumbbell, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getRecoveryTier } from '@/lib/tdee'
import { isMindBody } from '@/lib/discipline'
import { RecoveryLearnMore, RecoveryScale, ScoreBreakdown, tierMeaning } from './RecoveryScoreExplainer'
import type { IntakeAnswers } from '@/lib/types'

const TIER_BADGE: Record<string, 'danger' | 'warning' | 'success' | 'default'> = {
  Poor: 'danger',
  Moderate: 'warning',
  Good: 'success',
  Elite: 'default',
}

export function RecoveryTab({
  recoveryScore,
  answers,
  advice,
}: {
  recoveryScore: number
  answers: IntakeAnswers
  advice: string[]
}) {
  const mindBody = isMindBody(answers.equipment)
  const tier = getRecoveryTier(recoveryScore, mindBody ? 'mind-body' : 'strength')

  const impact = [
    { icon: Dumbbell, label: mindBody ? 'Session length' : 'Training volume', text: tier.volumeAdjustment },
    {
      icon: CalendarCheck,
      label: 'Rest days',
      text: tier.extraRest
        ? 'An extra recovery day was added to your weekly split.'
        : 'Full training frequency was preserved — no extra rest days required.',
    },
    { icon: Zap, label: mindBody ? 'Effort level' : 'Effort per set', text: `Aim for ${tier.targetRIR}.` },
  ]

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <BatteryMedium className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recovery score</div>
                <div className="font-display text-4xl tracking-wide text-gradient-gold">{recoveryScore}/100</div>
              </div>
            </div>
            <Badge variant={TIER_BADGE[tier.tier]} className="px-4 py-1.5 text-sm">
              {tier.tier} Tier
            </Badge>
          </div>
          <RecoveryScale score={recoveryScore} currentTier={tier.tier} />
          <p className="font-body text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">What this means: </span>
            {tierMeaning(tier.tier)}
          </p>
        </CardContent>
      </Card>

      <ScoreBreakdown answers={answers} score={recoveryScore} />

      <section>
        <h3 className="mb-3 font-display text-xl tracking-wide">What this means for your training</h3>
        <Card>
          <CardContent className="divide-y divide-border/60 p-0">
            {impact.map(({ icon: Icon, label, text }) => (
              <div key={label} className="flex gap-3 p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <div className="font-body text-sm font-bold">{label}</div>
                  <p className="font-body text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <RecoveryLearnMore currentTier={tier.tier} mindBody={mindBody} />

      <section>
        <h3 className="mb-3 font-display text-xl tracking-wide">AI Recovery Advice</h3>
        <Card>
          <CardContent className="p-5">
            <ul className="space-y-3">
              {advice.map((a, i) => (
                <li key={i} className="flex gap-2 font-body text-sm text-foreground/90">
                  <span className="shrink-0 text-primary">•</span> {a}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
