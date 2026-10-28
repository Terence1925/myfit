import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Beef, Flame, TrendingDown, TrendingUp, Wheat, Droplet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { NutritionPlan } from '@/lib/types'

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {icon}
          <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
        </div>
        <div className="font-display text-3xl tracking-wide text-gradient-gold">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  )
}

function MacroBar({
  icon,
  label,
  grams,
  kcal,
  totalKcal,
  colorClass,
}: {
  icon: ReactNode
  label: string
  grams: number
  kcal: number
  totalKcal: number
  colorClass: string
}) {
  const pct = Math.round((kcal / totalKcal) * 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-body font-semibold text-foreground">
          {icon} {label}
        </div>
        <div className="text-sm text-muted-foreground">
          {grams}g &middot; {kcal} kcal &middot; {pct}%
        </div>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full ${colorClass}`}
        />
      </div>
    </div>
  )
}

export function NutritionTab({ nutrition, tips }: { nutrition: NutritionPlan; tips: string[] }) {
  const proteinKcal = nutrition.proteinG * 4
  const carbsKcal = nutrition.carbsG * 4
  const fatKcal = nutrition.fatG * 9

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-2xl tracking-wide mb-4">Calorie blueprint</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Flame className="h-4 w-4" />} label="At rest" value={`${nutrition.bmr}`} sub="kcal your body burns" />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Maintenance" value={`${nutrition.tdee}`} sub="kcal to keep your weight" />
          <StatCard
            icon={<Flame className="h-4 w-4" />}
            label="Target"
            value={`${nutrition.calorieTarget}`}
            sub="kcal/day goal"
          />
          <StatCard
            icon={nutrition.weeklyShiftKcal < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            label="Weekly shift"
            value={`${nutrition.weeklyShiftKcal > 0 ? '+' : ''}${nutrition.weeklyShiftKcal}`}
            sub="kcal vs. maintenance"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Protein, carbs and fat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <MacroBar
            icon={<Beef className="h-4 w-4 text-red-600 dark:text-red-400" />}
            label="Protein"
            grams={nutrition.proteinG}
            kcal={proteinKcal}
            totalKcal={nutrition.calorieTarget}
            colorClass="bg-red-500"
          />
          <MacroBar
            icon={<Wheat className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
            label="Carbs"
            grams={nutrition.carbsG}
            kcal={carbsKcal}
            totalKcal={nutrition.calorieTarget}
            colorClass="bg-gold-gradient"
          />
          <MacroBar
            icon={<Droplet className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
            label="Fat"
            grams={nutrition.fatG}
            kcal={fatKcal}
            totalKcal={nutrition.calorieTarget}
            colorClass="bg-cyan-500"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How we work this out</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm font-body text-muted-foreground">
          <p>At rest: the calories your body burns just staying alive, worked out from your weight, height, age and sex.</p>
          <p>Maintenance: your at-rest calories plus what you burn moving around. Eat this much and your weight stays the same.</p>
          <p>Your calorie target is your maintenance, adjusted for your goal and how well you recover.</p>
          <p>Your calories split into 40% carbs, 30% protein and 30% fat.</p>
          <p>Protein stays between 1.6 and 2.4 g per kg of body weight; carbs and fat adjust to fit.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nutrition tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {tips.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm font-body text-foreground/90">
                <span className="text-primary shrink-0">•</span> {t}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
