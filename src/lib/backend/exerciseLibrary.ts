import type { Equipment, FocusArea } from '../types'

export interface LibraryExercise {
  name: string
  equipment: Equipment[]
  muscle: FocusArea[]
  compound: boolean
  lowImpactSafe?: ('knee' | 'shoulder' | 'lower-back')[]
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
  { name: 'Barbell Bench Press', equipment: ['full-gym', 'barbells-racks'], muscle: ['chest'], compound: true },
  { name: 'Dumbbell Bench Press', equipment: ['full-gym', 'dumbbells-only'], muscle: ['chest'], compound: true },
  { name: 'Incline Dumbbell Press', equipment: ['full-gym', 'dumbbells-only'], muscle: ['chest'], compound: true },
  { name: 'Machine Chest Press', equipment: ['full-gym', 'machines-only'], muscle: ['chest'], compound: true },
  { name: 'Push-Up', equipment: ['home-workout', 'calisthenics', 'full-gym'], muscle: ['chest'], compound: true, lowImpactSafe: ['knee', 'lower-back'] },
  { name: 'Cable Chest Fly', equipment: ['full-gym', 'machines-only'], muscle: ['chest'], compound: false },
  { name: 'Resistance Band Chest Press', equipment: ['resistance-bands', 'home-workout'], muscle: ['chest'], compound: false },

  // Back
  { name: 'Deadlift', equipment: ['full-gym', 'barbells-racks'], muscle: ['back', 'full-body'], compound: true, lowImpactSafe: [] },
  { name: 'Barbell Row', equipment: ['full-gym', 'barbells-racks'], muscle: ['back'], compound: true },
  { name: 'Pull-Up', equipment: ['full-gym', 'calisthenics', 'home-workout'], muscle: ['back'], compound: true },
  { name: 'Lat Pulldown', equipment: ['full-gym', 'machines-only'], muscle: ['back'], compound: true },
  { name: 'Dumbbell Row', equipment: ['full-gym', 'dumbbells-only'], muscle: ['back'], compound: true, lowImpactSafe: ['lower-back'] },
  { name: 'Seated Cable Row', equipment: ['full-gym', 'machines-only'], muscle: ['back'], compound: true },
  { name: 'Resistance Band Row', equipment: ['resistance-bands', 'home-workout'], muscle: ['back'], compound: false },
  { name: 'Inverted Row', equipment: ['calisthenics', 'home-workout'], muscle: ['back'], compound: true },

  // Shoulders
  { name: 'Overhead Barbell Press', equipment: ['full-gym', 'barbells-racks'], muscle: ['shoulders'], compound: true },
  { name: 'Seated Dumbbell Shoulder Press', equipment: ['full-gym', 'dumbbells-only'], muscle: ['shoulders'], compound: true, lowImpactSafe: ['lower-back'] },
  { name: 'Machine Shoulder Press', equipment: ['full-gym', 'machines-only'], muscle: ['shoulders'], compound: true, lowImpactSafe: ['shoulder'] },
  { name: 'Lateral Raise', equipment: ['full-gym', 'dumbbells-only'], muscle: ['shoulders'], compound: false },
  { name: 'Band Face Pull', equipment: ['resistance-bands', 'home-workout', 'full-gym'], muscle: ['shoulders'], compound: false, lowImpactSafe: ['shoulder'] },
  { name: 'Pike Push-Up', equipment: ['calisthenics', 'home-workout'], muscle: ['shoulders'], compound: true },

  // Arms
  { name: 'Barbell Curl', equipment: ['full-gym', 'barbells-racks'], muscle: ['arms'], compound: false },
  { name: 'Dumbbell Curl', equipment: ['full-gym', 'dumbbells-only'], muscle: ['arms'], compound: false },
  { name: 'Close-Grip Bench Press', equipment: ['full-gym', 'barbells-racks'], muscle: ['arms'], compound: true },
  { name: 'Triceps Rope Pushdown', equipment: ['full-gym', 'machines-only'], muscle: ['arms'], compound: false },
  { name: 'Dip', equipment: ['full-gym', 'calisthenics'], muscle: ['arms'], compound: true },
  { name: 'Band Curl', equipment: ['resistance-bands', 'home-workout'], muscle: ['arms'], compound: false },
  { name: 'Diamond Push-Up', equipment: ['calisthenics', 'home-workout'], muscle: ['arms'], compound: true },

  // Legs
  { name: 'Barbell Back Squat', equipment: ['full-gym', 'barbells-racks'], muscle: ['legs'], compound: true, lowImpactSafe: [] },
  { name: 'Front Squat', equipment: ['full-gym', 'barbells-racks'], muscle: ['legs'], compound: true },
  { name: 'Leg Press', equipment: ['full-gym', 'machines-only'], muscle: ['legs'], compound: true, lowImpactSafe: ['lower-back'] },
  { name: 'Goblet Squat', equipment: ['full-gym', 'dumbbells-only', 'home-workout'], muscle: ['legs'], compound: true, lowImpactSafe: ['lower-back'] },
  { name: 'Walking Lunge', equipment: ['full-gym', 'dumbbells-only', 'home-workout', 'calisthenics'], muscle: ['legs'], compound: true },
  { name: 'Leg Extension', equipment: ['full-gym', 'machines-only'], muscle: ['legs'], compound: false, lowImpactSafe: ['lower-back'] },
  { name: 'Leg Curl', equipment: ['full-gym', 'machines-only'], muscle: ['legs'], compound: false },
  { name: 'Bodyweight Squat', equipment: ['calisthenics', 'home-workout'], muscle: ['legs'], compound: true, lowImpactSafe: ['knee', 'lower-back'] },
  { name: 'Bulgarian Split Squat', equipment: ['full-gym', 'dumbbells-only', 'home-workout'], muscle: ['legs', 'glutes'], compound: true },
  { name: 'Band Squat', equipment: ['resistance-bands', 'home-workout'], muscle: ['legs'], compound: true, lowImpactSafe: ['knee'] },

  // Glutes
  { name: 'Barbell Hip Thrust', equipment: ['full-gym', 'barbells-racks'], muscle: ['glutes'], compound: true, lowImpactSafe: ['knee'] },
  { name: 'Dumbbell Hip Thrust', equipment: ['full-gym', 'dumbbells-only', 'home-workout'], muscle: ['glutes'], compound: true },
  { name: 'Cable Glute Kickback', equipment: ['full-gym', 'machines-only'], muscle: ['glutes'], compound: false },
  { name: 'Band Glute Bridge', equipment: ['resistance-bands', 'home-workout', 'calisthenics'], muscle: ['glutes'], compound: false, lowImpactSafe: ['knee', 'lower-back'] },
  { name: 'Romanian Deadlift', equipment: ['full-gym', 'barbells-racks', 'dumbbells-only'], muscle: ['glutes', 'back'], compound: true },

  // Core
  { name: 'Hanging Leg Raise', equipment: ['full-gym', 'calisthenics'], muscle: ['core'], compound: false },
  { name: 'Cable Woodchopper', equipment: ['full-gym', 'machines-only'], muscle: ['core'], compound: false },
  { name: 'Plank', equipment: ANY_EQUIPMENT, muscle: ['core'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'] },
  { name: 'Dead Bug', equipment: ANY_EQUIPMENT, muscle: ['core'], compound: false, lowImpactSafe: ['knee', 'shoulder', 'lower-back'] },
  { name: 'Band Pallof Press', equipment: ['resistance-bands', 'home-workout'], muscle: ['core'], compound: false, lowImpactSafe: ['lower-back'] },
  { name: 'Ab Wheel Rollout', equipment: ['home-workout', 'calisthenics', 'full-gym'], muscle: ['core'], compound: false },

  // Full body / conditioning
  { name: 'Kettlebell Swing', equipment: ['full-gym', 'dumbbells-only', 'home-workout'], muscle: ['full-body'], compound: true },
  { name: 'Burpee', equipment: ['calisthenics', 'home-workout', 'full-gym'], muscle: ['full-body'], compound: true },
  { name: 'Farmer\'s Carry', equipment: ['full-gym', 'dumbbells-only'], muscle: ['full-body'], compound: true },
  { name: 'Mountain Climber', equipment: ANY_EQUIPMENT, muscle: ['full-body', 'core'], compound: true },
]

export function poolFor(muscle: FocusArea, equipment: Equipment, injuries: string): LibraryExercise[] {
  return EXERCISES.filter((ex) => {
    if (!ex.muscle.includes(muscle)) return false
    if (!ex.equipment.includes(equipment)) return false
    if (injuries !== 'none' && ex.lowImpactSafe !== undefined) {
      return ex.lowImpactSafe.includes(injuries as 'knee' | 'shoulder' | 'lower-back')
    }
    if (injuries !== 'none' && ex.lowImpactSafe === undefined) {
      return true
    }
    return true
  })
}
