import { BatteryMedium, Moon, Brain, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { getRecoveryTier } from '@/lib/tdee'
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
  const tier = getRecoveryTier(recoveryScore)

  return (
    <div className="space-y-8">
      <Card className="border-primary/20">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-glow">
                <BatteryMedium className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Recovery Score
                </div>
                <div className="font-display text-4xl tracking-wide text-gradient-gold">{recoveryScore}/100</div>
              </div>
            </div>
            <Badge variant={TIER_BADGE[tier.tier]} className="text-sm px-4 py-1.5">
              {tier.tier} Tier
            </Badge>
          </div>
          <Progress value={recoveryScore} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <Moon className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Sleep</div>
              <div className="font-body font-semibold capitalize">
                {answers.sleepHours} hrs &middot; {answers.sleepQuality}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <Brain className="h-5 w-5 text-accent shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Stress Level</div>
              <div className="font-body font-semibold capitalize">{answers.stressLevel.replace('-', ' ')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Target Effort</div>
              <div className="font-body font-semibold">{tier.targetRIR}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Recovery Shaped Your Training</CardTitle>
        </CardHeader>
        <CardContent className="text-sm font-body text-muted-foreground space-y-2">
          <p>{tier.volumeAdjustment}</p>
          <p>{tier.extraRest ? 'An extra recovery day was added to your weekly split.' : 'Full training frequency was preserved — no extra rest days required.'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Recovery Advice</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {advice.map((a, i) => (
              <li key={i} className="flex gap-2 text-sm font-body text-foreground/90">
                <span className="text-primary shrink-0">•</span> {a}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
