import type { Equipment, FocusArea, InjuryLimitation } from '../types'

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
}

const ANY_EQUIPMENT: Equipment[] = [
  'full-gym',
  'barbells-racks',
  'dumbbells-only',
  'machines-only',
  'home-workout',
  'calisthenics',
  'resistance-bands',
]

export const EXERCISES: LibraryExercise[] = [
  // Chest
  { name: 'Barbell Bench Press', equipment: ['full-gym', 'barbells-racks'], muscle: ['chest'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },
  { name: 'Dumbbell Bench Press', equipment: ['full-gym', 'dumbbells-only'], muscle: ['chest'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },
  { name: 'Incline Dumbbell Press', equipment: ['full-gym', 'dumbbells-only'], muscle: ['chest'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },
  { name: 'Machine Chest Press', equipment: ['full-gym', 'machines-only'], muscle: ['chest'], compound: true, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'press' },
  { name: 'Push-Up', equipment: ['home-workout', 'calisthenics', 'full-gym'], muscle: ['chest'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },
  { name: 'Cable Chest Fly', equipment: ['full-gym', 'machines-only'], muscle: ['chest'], compound: false, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'fly' },
  { name: 'Resistance Band Chest Press', equipment: ['resistance-bands', 'home-workout'], muscle: ['chest'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'press' },

  // Back
  { name: 'Deadlift', equipment: ['full-gym', 'barbells-racks'], muscle: ['back', 'full-body'], compound: true, lowImpactSafe: [], subgroup: 'hinge' },
  { name: 'Barbell Row', equipment: ['full-gym', 'barbells-racks'], muscle: ['back'], compound: true, lowImpactSafe: ['knee'], subgroup: 'horizontal-pull' },
  { name: 'Pull-Up', equipment: ['full-gym', 'calisthenics', 'home-workout'], muscle: ['back'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'vertical-pull' },
  { name: 'Lat Pulldown', equipment: ['full-gym', 'machines-only'], muscle: ['back'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'vertical-pull' },
  { name: 'Dumbbell Row', equipment: ['full-gym', 'dumbbells-only'], muscle: ['back'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'horizontal-pull' },
  { name: 'Seated Cable Row', equipment: ['full-gym', 'machines-only'], muscle: ['back'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'horizontal-pull' },
  { name: 'Resistance Band Row', equipment: ['resistance-bands', 'home-workout'], muscle: ['back'], compound: false, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'horizontal-pull' },
  { name: 'Inverted Row', equipment: ['calisthenics', 'home-workout'], muscle: ['back'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'horizontal-pull' },

  // Shoulders
  { name: 'Overhead Barbell Press', equipment: ['full-gym', 'barbells-racks'], muscle: ['shoulders'], compound: true, lowImpactSafe: ['knee'], subgroup: 'press' },
  { name: 'Seated Dumbbell Shoulder Press', equipment: ['full-gym', 'dumbbells-only'], muscle: ['shoulders'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },
  { name: 'Machine Shoulder Press', equipment: ['full-gym', 'machines-only'], muscle: ['shoulders'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },
  { name: 'Lateral Raise', equipment: ['full-gym', 'dumbbells-only'], muscle: ['shoulders'], compound: false, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'lateral' },
  { name: 'Band Face Pull', equipment: ['resistance-bands', 'home-workout', 'full-gym'], muscle: ['shoulders'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'rear' },
  { name: 'Pike Push-Up', equipment: ['calisthenics', 'home-workout'], muscle: ['shoulders'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },

  // Arms
  { name: 'Barbell Curl', equipment: ['full-gym', 'barbells-racks'], muscle: ['arms'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'biceps' },
  { name: 'Dumbbell Curl', equipment: ['full-gym', 'dumbbells-only'], muscle: ['arms'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'biceps' },
  { name: 'Close-Grip Bench Press', equipment: ['full-gym', 'barbells-racks'], muscle: ['arms'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'triceps' },
  { name: 'Triceps Rope Pushdown', equipment: ['full-gym', 'machines-only'], muscle: ['arms'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'triceps' },
  { name: 'Dip', equipment: ['full-gym', 'calisthenics'], muscle: ['arms'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'triceps' },
  { name: 'Band Curl', equipment: ['resistance-bands', 'home-workout'], muscle: ['arms'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'biceps' },
  { name: 'Diamond Push-Up', equipment: ['calisthenics', 'home-workout'], muscle: ['arms'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'triceps' },

  // Legs
  { name: 'Barbell Back Squat', equipment: ['full-gym', 'barbells-racks'], muscle: ['legs'], compound: true, lowImpactSafe: [], subgroup: 'quad-compound' },
  { name: 'Front Squat', equipment: ['full-gym', 'barbells-racks'], muscle: ['legs'], compound: true, lowImpactSafe: [], subgroup: 'quad-compound' },
  { name: 'Leg Press', equipment: ['full-gym', 'machines-only'], muscle: ['legs'], compound: true, lowImpactSafe: ['lower-back'], subgroup: 'quad-compound' },
  { name: 'Goblet Squat', equipment: ['full-gym', 'dumbbells-only', 'home-workout'], muscle: ['legs'], compound: true, lowImpactSafe: ['lower-back'], subgroup: 'quad-compound' },
  { name: 'Walking Lunge', equipment: ['full-gym', 'dumbbells-only', 'home-workout', 'calisthenics'], muscle: ['legs'], compound: true, lowImpactSafe: ['shoulder', 'lower-back'], subgroup: 'quad-compound' },
  { name: 'Leg Extension', equipment: ['full-gym', 'machines-only'], muscle: ['legs'], compound: false, lowImpactSafe: ['lower-back'], subgroup: 'quad-isolation' },
  { name: 'Leg Curl', equipment: ['full-gym', 'machines-only'], muscle: ['legs'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'hamstring-isolation' },
  { name: 'Bodyweight Squat', equipment: ['calisthenics', 'home-workout'], muscle: ['legs'], compound: true, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'quad-compound' },
  { name: 'Bulgarian Split Squat', equipment: ['full-gym', 'dumbbells-only', 'home-workout'], muscle: ['legs', 'glutes'], compound: true, lowImpactSafe: ['shoulder', 'lower-back'], subgroup: 'quad-compound' },
  { name: 'Band Squat', equipment: ['resistance-bands', 'home-workout'], muscle: ['legs'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'quad-compound' },

  // Glutes
  { name: 'Barbell Hip Thrust', equipment: ['full-gym', 'barbells-racks'], muscle: ['glutes'], compound: true, lowImpactSafe: ['knee'], subgroup: 'hip-thrust' },
  { name: 'Dumbbell Hip Thrust', equipment: ['full-gym', 'dumbbells-only', 'home-workout'], muscle: ['glutes'], compound: true, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'hip-thrust' },
  { name: 'Cable Glute Kickback', equipment: ['full-gym', 'machines-only'], muscle: ['glutes'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'kickback' },
  { name: 'Band Glute Bridge', equipment: ['resistance-bands', 'home-workout', 'calisthenics'], muscle: ['glutes'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'hip-thrust' },
  { name: 'Romanian Deadlift', equipment: ['full-gym', 'barbells-racks', 'dumbbells-only'], muscle: ['glutes', 'back'], compound: true, lowImpactSafe: ['knee', 'shoulder'], subgroup: 'hinge' },

  // Core
  { name: 'Hanging Leg Raise', equipment: ['full-gym', 'calisthenics'], muscle: ['core'], compound: false, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'flexion' },
  { name: 'Cable Woodchopper', equipment: ['full-gym', 'machines-only'], muscle: ['core'], compound: false, lowImpactSafe: ['knee', 'shoulder'], subgroup: 'rotation' },
  { name: 'Plank', equipment: ANY_EQUIPMENT, muscle: ['core'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], holdBased: true, subgroup: 'anti-extension' },
  { name: 'Dead Bug', equipment: ANY_EQUIPMENT, muscle: ['core'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'anti-extension' },
  { name: 'Band Pallof Press', equipment: ['resistance-bands', 'home-workout'], muscle: ['core'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'], subgroup: 'anti-rotation' },
  { name: 'Ab Wheel Rollout', equipment: ['home-workout', 'calisthenics', 'full-gym'], muscle: ['core'], compound: false, lowImpactSafe: [], subgroup: 'anti-extension' },

  // Full body / conditioning
  { name: 'Kettlebell Swing', equipment: ['full-gym', 'dumbbells-only', 'home-workout'], muscle: ['full-body'], compound: true, lowImpactSafe: ['knee'] },
  { name: 'Burpee', equipment: ['calisthenics', 'home-workout', 'full-gym'], muscle: ['full-body'], compound: true, lowImpactSafe: [] },
  { name: 'Farmer\'s Carry', equipment: ['full-gym', 'dumbbells-only'], muscle: ['full-body'], compound: true, lowImpactSafe: ['knee'] },
  { name: 'Mountain Climber', equipment: ANY_EQUIPMENT, muscle: ['full-body', 'core'], compound: true, lowImpactSafe: ['knee', 'lower-back'] },
]

export function poolFor(muscle: FocusArea, equipment: Equipment, injuries: InjuryLimitation): LibraryExercise[] {
  return EXERCISES.filter((ex) => {
    if (!ex.muscle.includes(muscle)) return false
    if (!ex.equipment.includes(equipment)) return false
    if (injuries === 'none') return true

    // Fail-safe: an exercise must be explicitly annotated as fine for the reported injury to
    // pass — an unannotated exercise is treated as unverified, not automatically safe.
    const safeFor = ex.lowImpactSafe ?? []
    if (injuries === 'other') {
      // We don't know which joint "Other" refers to, so specific knee/shoulder/lower-back tags
      // don't apply either way. Only exclude the handful of exercises flagged unsafe for *any*
      // injury (heavy axial-load or ballistic movements like Deadlift, Back Squat, Burpee).
      return safeFor.length > 0
    }
    return safeFor.includes(injuries)
  })
}
