import type { LibraryExercise } from './exerciseLibrary'

// Dumbbell-only plan: exercises the owner's dumbbell program uses that have no animation yet. They are offered on the
// dumbbell plan only, and show the YouTube video we saved.
export const DUMBBELL_YOUTUBE = new Set<string>([
  'Dumbbell Bench Press',
  'Dumbbell Reverse Lunge',
  'Dumbbell Floor Press',
  'Renegade Row',
  'Walking Lunge',
  'Bulgarian Split Squat',
  'Dumbbell Step-Up',
])

/** A calf raise holding dumbbells (the repo has an animation for it). */
export const DUMBBELL_NEW_EXERCISES: LibraryExercise[] = [
  {
    name: 'Dumbbell Standing Calf Raise',
    equipment: ['dumbbells-only'],
    muscle: ['legs'],
    compound: false,
    lowImpactSafe: ['knee', 'shoulder', 'lower-back'],
    subgroup: 'calf',
  },
]
