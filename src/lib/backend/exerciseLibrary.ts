import type { Equipment, FocusArea, InjuryLimitation } from '../types'
import { normalizeEquipment } from '../discipline'
import { MIND_BODY_EXERCISES } from './mindBodyLibrary'
import { STRENGTH_EXTRAS } from './strengthExtras'
import { REPO_EXERCISES } from './repoExercises'
import { HOME_NEW_EXERCISES } from './homeExercises'
import { DUMBBELL_NEW_EXERCISES, DUMBBELL_YOUTUBE } from './dumbbellExercises'
import { BAND_YOUTUBE } from './bandExercises'
import {
  COMMON_GYM_NAMES,
  COMMON_GYM_RENAMED,
  COMMON_GYM_YOUTUBE,
  COMMON_GYM_YOUTUBE_RENAMED,
  REPLACED_BY_COMMON,
  REPLACED_BY_COMMON_YOUTUBE,
} from './commonGym'
import { ANIMATED_DEMOS, ANIMATED_ONLY_STRENGTH, SHOW_ANIMATED_DEMOS } from '../animatedDemos'

export interface LibraryExercise {
  name: string
  equipment: Equipment[]
  muscle: FocusArea[]
  compound: boolean
  lowImpactSafe?: ('knee' | 'shoulder' | 'lower-back')[]
  /** Isometric hold (e.g. Plank) — programmed by time instead of a rep range. */
  holdBased?: boolean
  /**
   * Finer-grained target than `muscle` (e.g. 'biceps' vs 'triceps' within 'arms') — used only to
   * keep a Swap within the same specific movement, since e.g. "arms" alone would let a triceps
   * exercise like Dip get swapped for a biceps one like Barbell Curl, which don't feel related
   * at all even though they share the broader muscle-group label.
   */
  subgroup?: string

  // ---- Yoga and Pilates only (all optional; strength exercises leave these out) ----
  /** Where this fits in a session, so a class can be ordered warm-up first and cool-down last. */
  phases?: MindBodyPhase[]
  /** How it's timed: 'hold' = held for seconds, 'flow' = moved through for a minute or so,
   * 'restore' = a long, relaxed hold, 'final' = the closing rest, 'reps' = counted repetitions. */
  timing?: 'hold' | 'flow' | 'restore' | 'final' | 'reps'
  /** Overrides the usual reps, e.g. The Hundred is always "100 pumps". */
  fixedReps?: string
  /** Done on both sides, one after the other. */
  eachSide?: boolean
  /** Intermediate moves are left out of beginner programs. */
  level?: 'beginner' | 'intermediate'
  /** Short how-to shown on the exercise card. */
  cue?: string
}

export type MindBodyPhase =
  | 'warmup'
  | 'flow'
  | 'standing'
  | 'balance'
  | 'hips'
  | 'core'
  | 'upper'
  | 'backbend'
  | 'fold'
  | 'twist'
  | 'cooldown'
  | 'lower'
  | 'back'
  | 'stretch'

const ANY_STRENGTH_EQUIPMENT: Equipment[] = ['full-gym', 'dumbbells-only', 'home-workout', 'calisthenics', 'resistance-bands']

const STRENGTH_EXERCISES: LibraryExercise[] = [
  // Chest
  { name: 'Barbell Bench Press', equipment: ['full-gym'], muscle: ['chest'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },
  { name: 'Dumbbell Bench Press', equipment: ['full-gym', 'dumbbells-only'], muscle: ['chest'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },
  { name: 'Incline Dumbbell Press', equipment: ['full-gym', 'dumbbells-only'], muscle: ['chest'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },
  { name: 'Machine Chest Press', equipment: ['full-gym'], muscle: ['chest'], compound: true, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'press' },
  { name: 'Push-Up', equipment: ['home-workout', 'calisthenics', 'full-gym', 'dumbbells-only', 'resistance-bands'], muscle: ['chest'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },
  { name: 'Cable Chest Fly', equipment: ['full-gym'], muscle: ['chest'], compound: false, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'fly' },
  { name: 'Resistance Band Chest Press', equipment: ['resistance-bands', 'home-workout'], muscle: ['chest'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'press' },

  // Back
  { name: 'Deadlift', equipment: ['full-gym'], muscle: ['legs', 'back'], compound: true, lowImpactSafe: [], subgroup: 'hinge' },
  { name: 'Barbell Row', equipment: ['full-gym'], muscle: ['back'], compound: true, lowImpactSafe: ['knee'], subgroup: 'horizontal-pull' },
  { name: 'Pull-Up', equipment: ['full-gym', 'calisthenics', 'home-workout'], muscle: ['back'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'vertical-pull' },
  { name: 'Lat Pulldown', equipment: ['full-gym'], muscle: ['back'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'vertical-pull' },
  { name: 'Dumbbell Row', equipment: ['full-gym', 'dumbbells-only'], muscle: ['back'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'horizontal-pull' },
  { name: 'Seated Cable Row', equipment: ['full-gym'], muscle: ['back'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'horizontal-pull' },
  { name: 'Resistance Band Row', equipment: ['resistance-bands', 'home-workout'], muscle: ['back'], compound: false, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'horizontal-pull' },
  { name: 'Inverted Row', equipment: ['calisthenics', 'home-workout'], muscle: ['back'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'horizontal-pull' },

  // Shoulders
  { name: 'Overhead Barbell Press', equipment: ['full-gym'], muscle: ['shoulders'], compound: true, lowImpactSafe: ['knee'], subgroup: 'press' },
  { name: 'Seated Dumbbell Shoulder Press', equipment: ['full-gym', 'dumbbells-only'], muscle: ['shoulders'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },
  { name: 'Machine Shoulder Press', equipment: ['full-gym'], muscle: ['shoulders'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },
  { name: 'Lateral Raise', equipment: ['full-gym', 'dumbbells-only'], muscle: ['shoulders'], compound: false, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'lateral' },
  { name: 'Band Face Pull', equipment: ['resistance-bands', 'home-workout', 'full-gym'], muscle: ['shoulders'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'rear' },
  { name: 'Pike Push-Up', equipment: ['calisthenics', 'home-workout', 'dumbbells-only', 'resistance-bands'], muscle: ['shoulders'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },

  // Arms
  { name: 'Barbell Curl', equipment: ['full-gym'], muscle: ['arms'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'biceps' },
  { name: 'Dumbbell Curl', equipment: ['full-gym', 'dumbbells-only'], muscle: ['arms'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'biceps' },
  { name: 'Close-Grip Bench Press', equipment: ['full-gym'], muscle: ['arms'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'triceps' },
  { name: 'Triceps Rope Pushdown', equipment: ['full-gym'], muscle: ['arms'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'triceps' },
  { name: 'Dip', equipment: ['full-gym', 'calisthenics'], muscle: ['arms'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'triceps' },
  { name: 'Band Curl', equipment: ['resistance-bands', 'home-workout'], muscle: ['arms'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'biceps' },
  { name: 'Diamond Push-Up', equipment: ['calisthenics', 'home-workout', 'dumbbells-only', 'resistance-bands'], muscle: ['arms'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'triceps' },

  // Legs
  { name: 'Barbell Back Squat', equipment: ['full-gym'], muscle: ['legs'], compound: true, lowImpactSafe: [], subgroup: 'quad-compound' },
  { name: 'Front Squat', equipment: ['full-gym'], muscle: ['legs'], compound: true, lowImpactSafe: [], subgroup: 'quad-compound' },
  { name: 'Leg Press', equipment: ['full-gym'], muscle: ['legs'], compound: true, lowImpactSafe: ['lower-back'], subgroup: 'quad-compound' },
  { name: 'Goblet Squat', equipment: ['full-gym', 'dumbbells-only', 'home-workout'], muscle: ['legs'], compound: true, lowImpactSafe: ['lower-back'], subgroup: 'quad-compound' },
  { name: 'Walking Lunge', equipment: ['full-gym', 'dumbbells-only', 'home-workout', 'calisthenics', 'resistance-bands'], muscle: ['legs'], compound: true, lowImpactSafe: ['shoulder', 'lower-back'], subgroup: 'quad-compound' },
  { name: 'Leg Extension', equipment: ['full-gym'], muscle: ['legs'], compound: false, lowImpactSafe: ['lower-back'], subgroup: 'quad-isolation' },
  { name: 'Leg Curl', equipment: ['full-gym'], muscle: ['legs'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'hamstring-isolation' },
  { name: 'Bodyweight Squat', equipment: ['calisthenics', 'home-workout', 'dumbbells-only', 'resistance-bands'], muscle: ['legs'], compound: true, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'quad-compound' },
  { name: 'Bulgarian Split Squat', equipment: ['full-gym', 'dumbbells-only', 'home-workout', 'calisthenics', 'resistance-bands'], muscle: ['legs', 'glutes'], compound: true, lowImpactSafe: ['shoulder', 'lower-back'], subgroup: 'quad-compound' },
  { name: 'Band Squat', equipment: ['resistance-bands', 'home-workout'], muscle: ['legs'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'quad-compound' },

  // Glutes
  { name: 'Barbell Hip Thrust', equipment: ['full-gym'], muscle: ['glutes'], compound: true, lowImpactSafe: ['knee'], subgroup: 'hip-thrust' },
  { name: 'Dumbbell Hip Thrust', equipment: ['full-gym', 'dumbbells-only', 'home-workout'], muscle: ['glutes'], compound: true, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'hip-thrust' },
  { name: 'Cable Glute Kickback', equipment: ['full-gym'], muscle: ['glutes'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'kickback' },
  { name: 'Band Glute Bridge', equipment: ['resistance-bands', 'home-workout', 'calisthenics', 'full-gym', 'dumbbells-only'], muscle: ['glutes'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'hip-thrust' },
  { name: 'Romanian Deadlift', equipment: ['full-gym', 'dumbbells-only'], muscle: ['glutes', 'back'], compound: true, lowImpactSafe: ['knee', 'shoulder'], subgroup: 'hinge' },

  // Core
  { name: 'Hanging Leg Raise', equipment: ['full-gym', 'calisthenics'], muscle: ['core'], compound: false, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'flexion' },
  { name: 'Cable Woodchopper', equipment: ['full-gym'], muscle: ['core'], compound: false, lowImpactSafe: ['knee', 'shoulder'], subgroup: 'rotation' },
  { name: 'Plank', equipment: ANY_STRENGTH_EQUIPMENT, muscle: ['core'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], holdBased: true, subgroup: 'anti-extension' },
  { name: 'Dead Bug', equipment: ANY_STRENGTH_EQUIPMENT, muscle: ['core'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'anti-extension' },
  { name: 'Band Pallof Press', equipment: ['resistance-bands', 'home-workout'], muscle: ['core'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'anti-rotation' },
  { name: 'Ab Wheel Rollout', equipment: ['home-workout', 'calisthenics', 'full-gym'], muscle: ['core'], compound: false, lowImpactSafe: [], subgroup: 'anti-extension' },

  // Full body / conditioning
  { name: 'Kettlebell Swing', equipment: ['full-gym', 'dumbbells-only', 'home-workout'], muscle: ['full-body'], compound: true, lowImpactSafe: ['knee'] },
  { name: 'Burpee', equipment: ['calisthenics', 'home-workout', 'full-gym'], muscle: ['full-body'], compound: true, lowImpactSafe: [] },
  { name: 'Farmer\'s Carry', equipment: ['full-gym', 'dumbbells-only'], muscle: ['full-body'], compound: true, lowImpactSafe: ['knee'] },
  { name: 'Mountain Climber', equipment: ANY_STRENGTH_EQUIPMENT, muscle: ['full-body', 'core'], compound: true, lowImpactSafe: ['knee', 'lower-back'] },
]

export const EXERCISES: LibraryExercise[] = [
  ...STRENGTH_EXERCISES,
  ...STRENGTH_EXTRAS,
  ...REPO_EXERCISES,
  ...COMMON_GYM_RENAMED,
  ...COMMON_GYM_YOUTUBE_RENAMED,
  ...HOME_NEW_EXERCISES,
  ...DUMBBELL_NEW_EXERCISES,
  ...MIND_BODY_EXERCISES,
]

/**
 * Whether an exercise suits the person's equipment and injury. Fail-safe: with an injury, an exercise
 * must be explicitly annotated as fine for it, so an unannotated one counts as unverified, not safe.
 */
export function isAllowed(ex: LibraryExercise, equipment: Equipment, injuries: InjuryLimitation): boolean {
  if (!ex.equipment.includes(normalizeEquipment(equipment))) return false
  // Strength exercises are only offered when they have an animation (yoga and Pilates use YouTube instead)
  const mindBody = ex.equipment.includes('yoga') || ex.equipment.includes('pilates')
  // (On the Full Gym plan a few list exercises have no animation yet and show the YouTube video we saved)
  const eq = normalizeEquipment(equipment)
  const youtubeOnly =
    (eq === 'full-gym' && COMMON_GYM_YOUTUBE.has(ex.name)) ||
    (eq === 'dumbbells-only' && DUMBBELL_YOUTUBE.has(ex.name)) ||
    (eq === 'resistance-bands' && BAND_YOUTUBE.has(ex.name))
  if (ANIMATED_ONLY_STRENGTH && SHOW_ANIMATED_DEMOS && !mindBody && !ANIMATED_DEMOS[ex.name] && !youtubeOnly) return false
  // The Full Gym plan only offers the common gym exercises (the owner's list, see commonGym.ts)
  if (!mindBody && (REPLACED_BY_COMMON.has(ex.name) || REPLACED_BY_COMMON_YOUTUBE.has(ex.name))) return false
  if (!mindBody && normalizeEquipment(equipment) === 'full-gym' && !COMMON_GYM_NAMES.has(ex.name) && !COMMON_GYM_YOUTUBE.has(ex.name)) return false
  return injuryAllows(ex, injuries)
}

/** Does this exercise suit someone with this limitation? (Equipment and animation are checked elsewhere.) */
export function injuryAllows(ex: LibraryExercise, injuries: InjuryLimitation): boolean {
  if (injuries === 'none') return true
  const safeFor = ex.lowImpactSafe ?? []
  if (injuries === 'other') {
    // We don't know which joint "Other" refers to, so specific knee/shoulder/lower-back tags
    // don't apply either way. Only exclude the handful of exercises flagged unsafe for *any*
    // injury (heavy axial-load or ballistic movements like Deadlift, Back Squat, Burpee).
    return safeFor.length > 0
  }
  return safeFor.includes(injuries)
}

export function poolFor(muscle: FocusArea, equipment: Equipment, injuries: InjuryLimitation): LibraryExercise[] {
  return EXERCISES.filter((ex) => ex.muscle.includes(muscle) && isAllowed(ex, equipment, injuries))
}
