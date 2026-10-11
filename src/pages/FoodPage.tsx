import * as React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FoodTab } from '@/components/program/FoodTab'
import { useAuth } from '@/context/AuthContext'
import { programs } from '@/lib/backend/api'
import type { NutritionPlan } from '@/lib/types'

/** Food log for everyone: free accounts get the built-in foods; Pro also searches the online database. */
export default function FoodPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [nutrition, setNutrition] = React.useState<NutritionPlan | null>(null)
  const [loaded, setLoaded] = React.useState(false)
  const profileId = profile?.id

  React.useEffect(() => {
    if (!profileId) return
    let cancelled = false
    programs
      .listForUser(profileId)
      .then((list) => {
        if (cancelled) return
        setNutrition(list[0]?.nutrition ?? null)
        setLoaded(true)
      })
      .catch(() => !cancelled && setLoaded(true))
    return () => {
      cancelled = true
    }
  }, [profileId])

  if (!profile || !loaded) return null

  return (
    <div className="container max-w-2xl py-8 sm:py-12">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 font-display text-4xl tracking-wide"
      >
        FOOD LOG
      </motion.h1>
      {nutrition ? (
        <FoodTab nutrition={nutrition} userId={profile.id} />
      ) : (
        <Card>
          <CardContent className="space-y-3 p-6 text-center">
            <div className="font-display text-2xl tracking-wide">SET YOUR DAILY TARGETS FIRST</div>
            <p className="font-body text-sm text-muted-foreground">
              Answer a few quick questions and we'll work out your calories and macros, so your food log has a goal to
              track against.
            </p>
            <Button onClick={() => navigate('/')}>Get started</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
