import type { Equipment, FocusArea } from '../types'
import type { LibraryExercise } from './exerciseLibrary'
import { strengthPool } from './programGenerator'

/** The body parts the exercise dictionary is grouped by, in the order they are listed. */
export const BODY_PARTS: { id: FocusArea; label: string }[] = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'legs', label: 'Legs' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'core', label: 'Core' },
  { id: 'full-body', label: 'Full body' },
]

/** Narrow the list of exercises by what the person has. */
export const EQUIPMENT_FILTERS: { id: Equipment | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'full-gym', label: 'Gym' },
  { id: 'dumbbells-only', label: 'Dumbbells' },
  { id: 'calisthenics', label: 'Bodyweight' },
  { id: 'resistance-bands', label: 'Bands' },
]

/** Every exercise for a body part, A to Z. The same exercises a generated plan can use (each has a demo; no yoga or Pilates poses). */
export function dictionaryFor(part: FocusArea): LibraryExercise[] {
  return strengthPool(part, 'custom', 'none').sort((a, b) => a.name.localeCompare(b.name))
}

/** Does this exercise suit the chosen equipment filter? Bodyweight also covers the home-workout moves. */
export function matchesEquipment(ex: LibraryExercise, filter: Equipment | 'all'): boolean {
  if (filter === 'all') return true
  if (filter === 'calisthenics') return ex.equipment.includes('calisthenics') || ex.equipment.includes('home-workout')
  return ex.equipment.includes(filter)
}
