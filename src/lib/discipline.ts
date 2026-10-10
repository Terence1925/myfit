import type { Equipment } from './types'

/** What kind of training a program is. Yoga and Pilates are timed / flowing, not sets of reps. */
export type Discipline = 'strength' | 'yoga' | 'pilates'

// Programs saved before "Barbells & Racks" and "Machines Only" were removed still carry those values.
// A full gym covers everything they could do, so treat them as that.
const LEGACY_EQUIPMENT: Record<string, Equipment> = {
  'barbells-racks': 'full-gym',
  'machines-only': 'full-gym',
}

export function normalizeEquipment(equipment: string): Equipment {
  return LEGACY_EQUIPMENT[equipment] ?? (equipment as Equipment)
}

export function disciplineOf(equipment: string): Discipline {
  if (equipment === 'yoga') return 'yoga'
  if (equipment === 'pilates') return 'pilates'
  return 'strength'
}

export function isMindBody(equipment: string): boolean {
  return disciplineOf(equipment) !== 'strength'
}
