import { goalLabelOf } from '@/lib/goalLabel'
import type { Exercise, WorkoutProgram } from '@/lib/types'

function exerciseLine(ex: Exercise, i: number): string {
  const mindBody = ex.format === 'yoga' || ex.format === 'pilates'
  const timed = /sec|min|pumps/.test(ex.reps)
  const reps = `${ex.reps}${timed ? '' : ' reps'}`
  const side = ex.eachSide ? ' each side' : ''
  const detail = mindBody
    ? `${reps}${side}${ex.format === 'pilates' && ex.sets > 1 ? `, ${ex.sets} rounds` : ''}`
    : `${ex.sets} sets x ${reps}${side}, rest ${ex.rest}`
  return `${i + 1}. ${ex.name}: ${detail}${ex.notes ? `\n   ${ex.notes}` : ''}`
}

/** The whole program as plain text, to paste into an email or message. */
export function programToText(program: WorkoutProgram, clientName?: string): string {
  const { programData: p, nutrition: n } = program
  const out: string[] = []
  out.push(p.programName.toUpperCase())
  if (clientName) out.push(`Prepared for ${clientName}`)
  out.push(`Goal: ${goalLabelOf(program.answers)}`)
  if (p.tagline) out.push(p.tagline)
  out.push('')
  if (p.overview) out.push(p.overview, '')
  if (p.weeklyVolume) out.push(`Weekly volume: ${p.weeklyVolume}`)
  if (p.progressionStrategy) out.push(`Progression: ${p.progressionStrategy}`)
  out.push('')
  if (p.warmup.length) out.push('WARM-UP', ...p.warmup.map((w) => `- ${w}`), '')
  for (const day of p.days) {
    out.push(`DAY ${day.day}: ${day.name} (${day.duration})`, day.focus, '')
    day.exercises.forEach((ex, i) => out.push(exerciseLine(ex, i)))
    out.push('')
  }
  if (p.cooldown.length) out.push('COOL-DOWN', ...p.cooldown.map((w) => `- ${w}`), '')
  out.push(
    'NUTRITION TARGETS',
    `Calories: ${n.calorieTarget} kcal a day`,
    `Protein: ${n.proteinG} g | Carbs: ${n.carbsG} g | Fat: ${n.fatG} g`,
    '',
  )
  if (p.nutritionTips.length) out.push('NUTRITION TIPS', ...p.nutritionTips.map((t) => `- ${t}`), '')
  if (p.recoveryAdvice.length) out.push('RECOVERY', ...p.recoveryAdvice.map((t) => `- ${t}`), '')
  out.push('Made with MyFit')
  return out.join('\n')
}
