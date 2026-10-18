import type { FocusArea } from '../types'
import type { LibraryExercise } from './exerciseLibrary'

// Which half of the body a day trains, so a focus area is only ever added where it belongs: glute and leg work never
// on an upper-body day, chest, back, shoulder and arm work never on a lower-body day.
const UPPER_MUSCLES: FocusArea[] = ['chest', 'back', 'shoulders']
const LOWER_MUSCLES: FocusArea[] = ['legs', 'glutes']

type DayLike = { muscles: FocusArea[]; name?: string }

// A day called "Pull Day" or "Upper Power" is an upper-body day even if one lift on it (a deadlift) also touches the glutes
const UPPER_NAME = /^(push|pull|upper|chest|back|shoulder|arm)/i
const LOWER_NAME = /^(leg|lower|glute)/i

/** Only upper body (no legs or glutes). Full body days are neither upper-only nor lower-only. */
export const isUpperOnly = (d: DayLike) =>
  (d.muscles.some((m) => UPPER_MUSCLES.includes(m)) && !d.muscles.some((m) => LOWER_MUSCLES.includes(m))) ||
  (!!d.name && UPPER_NAME.test(d.name))

/** Only lower body (no chest, back or shoulders). */
export const isLowerOnly = (d: DayLike) =>
  (d.muscles.some((m) => LOWER_MUSCLES.includes(m)) && !d.muscles.some((m) => UPPER_MUSCLES.includes(m))) ||
  (!!d.name && LOWER_NAME.test(d.name))

/** Can a focus muscle be added to this day without training it on the wrong half of the body? */
export function fitsDay(focus: FocusArea, day: DayLike): boolean {
  if (LOWER_MUSCLES.includes(focus)) return !isUpperOnly(day)
  if (UPPER_MUSCLES.includes(focus) || focus === 'arms') return !isLowerOnly(day)
  return true
}

export type DayKind = 'push' | 'pull' | 'mixed'

/** Can this exercise sit on a day of this kind? (Used for arms, where biceps and triceps are opposites.) */
export function armFitsDay(e: LibraryExercise, kind: DayKind): boolean {
  if (kind === 'mixed') return true
  const triceps = e.subgroup === 'triceps'
  const pullArm = e.subgroup === 'biceps' || e.subgroup === 'forearms'
  if (kind === 'push') return !pullArm && e.muscle[0] !== 'back'
  return !triceps && e.muscle[0] !== 'chest' && e.muscle[0] !== 'shoulders'
}

/** Keeps a "backup" exercise (one that only touches the muscle as a side effect) from crossing sides: no row on a push day, no push-up on a pull day. */
export function sideFitsDay(e: LibraryExercise, kind: DayKind): boolean {
  if (kind === 'push') return e.muscle[0] !== 'back'
  if (kind === 'pull') return e.muscle[0] !== 'chest'
  return true
}
