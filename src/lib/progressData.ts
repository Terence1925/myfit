import { foodLog, programs, sessions } from '@/lib/backend/api'
import { computeBadgeStats, type BadgeStats } from '@/lib/badges'
import type { WorkoutSession } from '@/lib/types'

/** Everything the badges and the weekly recap are worked out from. */
export interface ProgressData {
  sessions: WorkoutSession[]
  foodDates: string[]
  stats: BadgeStats
  /** Workout days a week in the person's newest program (3 when there is none). */
  plannedDays: number
}

export async function loadProgressData(userId: string): Promise<ProgressData> {
  const [saved, foodDates, list] = await Promise.all([
    sessions.listForUser(userId),
    foodLog.listLoggedDates(userId).catch(() => [] as string[]),
    programs.listForUser(userId).catch(() => []),
  ])
  const plannedByProgram: Record<string, number> = {}
  for (const p of list) plannedByProgram[p.id] = p.programData.days.length
  const plannedDays = list[0]?.programData.days.length ?? 3
  return { sessions: saved, foodDates, stats: computeBadgeStats(saved, foodDates, plannedByProgram, plannedDays), plannedDays }
}
