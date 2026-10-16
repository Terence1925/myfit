import type { LibraryExercise } from './exerciseLibrary'

// Moves in the home (bodyweight) program that the library did not have yet. None has an animation, so they are only
// offered by the home program (homeProgram.ts) and show a YouTube video instead.
export const HOME_NEW_EXERCISES: LibraryExercise[] = [
  { name: 'Jumping Jacks', equipment: ['calisthenics'], muscle: ['full-body'], compound: false, lowImpactSafe: [], subgroup: 'cardio' },
  { name: 'High Knees', equipment: ['calisthenics'], muscle: ['full-body'], compound: false, lowImpactSafe: [], subgroup: 'cardio' },
  { name: 'Superman Pull', equipment: ['calisthenics'], muscle: ['back'], compound: false, lowImpactSafe: ['knee', 'shoulder'], subgroup: 'back-extension' },
  { name: 'Bird Dog Raise', equipment: ['calisthenics'], muscle: ['core', 'back'], compound: false, lowImpactSafe: ['lower-back'], subgroup: 'anti-rotation' },
  { name: 'Wall Walk', equipment: ['calisthenics'], muscle: ['shoulders'], compound: true, lowImpactSafe: ['knee', 'lower-back'], subgroup: 'press' },
]
