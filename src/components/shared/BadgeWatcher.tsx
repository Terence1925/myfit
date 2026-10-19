import * as React from 'react'
import { useAuth } from '@/context/AuthContext'
import { earnedIds, newlyEarned } from '@/lib/badges'
import { loadSeenBadges, saveSeenBadges } from '@/lib/badgeStore'
import { celebrate } from '@/lib/feedback'
import { loadProgressData } from '@/lib/progressData'

/**
 * Lives in the app shell and watches for new badges after a workout or a meal is saved. A new badge gets its own
 * celebration (a few seconds after the workout one, so the two do not cover each other).
 */
export function BadgeWatcher() {
  const { profile } = useAuth()
  const userId = profile?.id

  React.useEffect(() => {
    if (!userId) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const check = async () => {
      try {
        const data = await loadProgressData(userId)
        if (cancelled) return
        const seen = loadSeenBadges(userId)
        if (seen === null) {
          // First check on this phone: remember what is already earned, without celebrating old workouts
          saveSeenBadges(userId, earnedIds(data.stats))
          return
        }
        const fresh = newlyEarned(seen, data.stats)
        if (fresh.length === 0) return
        saveSeenBadges(userId, [...seen, ...fresh.map((b) => b.id)])
        window.dispatchEvent(new Event('myfit:badges-changed'))
        const first = fresh[0]
        timer = setTimeout(
          () =>
            celebrate({
              title: 'Badge unlocked!',
              subtitle: fresh.length > 1 ? `${first.title} and ${fresh.length - 1} more` : first.title,
              kind: 'badge',
              emoji: first.emoji,
            }),
          3200,
        )
      } catch {
        /* badges are a bonus: never get in the way */
      }
    }

    void check()
    window.addEventListener('myfit:session-saved', check)
    window.addEventListener('myfit:food-saved', check)
    return () => {
      cancelled = true
      clearTimeout(timer)
      window.removeEventListener('myfit:session-saved', check)
      window.removeEventListener('myfit:food-saved', check)
    }
  }, [userId])

  return null
}
