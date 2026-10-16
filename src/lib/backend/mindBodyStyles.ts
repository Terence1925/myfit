import type { MindBodyStyleId, TrainingDays } from '../types'

// Yoga and Pilates are chosen by goal and session length, not by lifting level and 3-6 days. Each style is one session
// (the poses and moves listed here, in this order); the person picks how many days a week to do it.

export interface MindBodyStyle {
  id: MindBodyStyleId
  discipline: 'yoga' | 'pilates'
  label: string
  /** One line shown when choosing. */
  blurb: string
  /** How long a session takes. */
  minutes: [number, number]
  /** Library names, in session order. */
  poses: string[]
  /** How often this style is usually done, shown as advice. */
  recommended: string
  /** Experience this style assumes (decides hold times and which moves are easier or harder). */
  experience: '0-1' | '2-3'
}

export const MIND_BODY_STYLES: MindBodyStyle[] = [
  {
    id: 'yoga-beginner',
    discipline: 'yoga',
    label: 'Beginner Yoga',
    blurb: 'Gentle basics: standing, bending, stretching and resting.',
    minutes: [15, 30],
    poses: ['Mountain Pose', "Child's Pose", 'Cat-Cow', 'Downward-Facing Dog', 'Cobra Pose', 'Seated Forward Fold', 'Savasana'],
    recommended: '2-3 times a week',
    experience: '0-1',
  },
  {
    id: 'yoga-flexibility',
    discipline: 'yoga',
    label: 'Flexibility Yoga',
    blurb: 'Long, deep stretches for hips and hamstrings.',
    minutes: [30, 45],
    poses: ['Downward-Facing Dog', 'Pyramid Pose', 'Pigeon Pose', 'Standing Forward Fold', 'Butterfly Stretch', 'Seated Split Progression', 'Savasana'],
    recommended: '4-6 times a week',
    experience: '2-3',
  },
  {
    id: 'yoga-stress-relief',
    discipline: 'yoga',
    label: 'Stress Relief Yoga',
    blurb: 'Slow, calming poses to unwind. Fine to do every day.',
    minutes: [15, 20],
    poses: ["Child's Pose", 'Cat-Cow', 'Seated Twist', 'Legs-Up-the-Wall', 'Savasana'],
    recommended: 'every day',
    experience: '0-1',
  },
  {
    id: 'yoga-weight-loss',
    discipline: 'yoga',
    label: 'Weight Loss Yoga',
    blurb: 'Flowing, strong poses that keep you moving.',
    minutes: [30, 45],
    poses: ['Sun Salutation A', 'Warrior I', 'Warrior II', 'Chair Pose', 'Plank Pose', 'Boat Pose', 'Savasana'],
    recommended: '3-5 times a week',
    experience: '2-3',
  },
  {
    id: 'yoga-morning',
    discipline: 'yoga',
    label: 'Morning Yoga',
    blurb: 'A short flow to wake your body up.',
    minutes: [15, 20],
    poses: ['Sun Salutation A', 'Cobra Pose', 'Warrior I', 'Warrior II', 'Savasana'],
    recommended: '3-5 times a week',
    experience: '2-3',
  },
  {
    id: 'yoga-bedtime',
    discipline: 'yoga',
    label: 'Bedtime Yoga',
    blurb: 'Soft stretches and a twist to help you sleep.',
    minutes: [15, 20],
    poses: ["Child's Pose", 'Butterfly Stretch', 'Reclined Twist', 'Legs-Up-the-Wall', 'Savasana'],
    recommended: 'every day',
    experience: '0-1',
  },
  {
    id: 'pilates-beginner',
    discipline: 'pilates',
    label: 'Beginner Pilates',
    blurb: 'Core basics, taken slowly.',
    minutes: [20, 30],
    poses: ['The Hundred', 'Roll-Up', 'Single Leg Stretch', 'Double Leg Stretch', 'Spine Stretch Forward', 'Swan Prep', 'Pilates Plank'],
    recommended: '2-3 times a week',
    experience: '0-1',
  },
  {
    id: 'pilates-core',
    discipline: 'pilates',
    label: 'Core Strength Pilates',
    blurb: 'A harder core session.',
    minutes: [25, 35],
    poses: ['The Hundred', 'Pilates Teaser', 'Criss-Cross', 'Single Leg Circles', 'Roll Over', 'Pilates Plank'],
    recommended: '3-4 times a week',
    experience: '2-3',
  },
  {
    id: 'pilates-full-body',
    discipline: 'pilates',
    label: 'Full Body Pilates',
    blurb: 'Core, legs, back and arms in one session.',
    minutes: [25, 35],
    poses: ['Roll-Up', 'Single Leg Stretch', 'Side Kicks (Front and Back)', 'Swan Prep', 'Pilates Teaser', 'Pilates Plank'],
    recommended: '3-4 times a week',
    experience: '2-3',
  },
  {
    id: 'pilates-weight-loss',
    discipline: 'pilates',
    label: 'Pilates for Weight Loss',
    blurb: 'A faster, more active session.',
    minutes: [25, 35],
    poses: ['Roll-Up', 'Pilates Teaser', 'Pilates Mountain Climber', 'Pilates Plank', 'Side Kicks (Front and Back)', 'Criss-Cross'],
    recommended: '4-5 times a week',
    experience: '2-3',
  },
  {
    id: 'pilates-flexibility',
    discipline: 'pilates',
    label: 'Flexibility Pilates',
    blurb: 'Stretching and spine mobility.',
    minutes: [20, 30],
    poses: ['Spine Stretch Forward', 'Saw', 'Mermaid Stretch', 'Swan Prep', 'Pilates Side Bend'],
    recommended: '3-4 times a week',
    experience: '2-3',
  },
]

export const MIND_BODY_STYLE_BY_ID = new Map(MIND_BODY_STYLES.map((s) => [s.id, s]))

export function stylesFor(discipline: 'yoga' | 'pilates'): MindBodyStyle[] {
  return MIND_BODY_STYLES.filter((s) => s.discipline === discipline)
}

/** How many days a week can be chosen. */
export const MIND_BODY_DAY_OPTIONS: Record<'yoga' | 'pilates', TrainingDays[]> = {
  yoga: [2, 3, 5, 7],
  pilates: [2, 3, 4, 5, 6],
}

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** The days of the week for a plan: 2 = Tue/Fri, 3 = Mon/Wed/Fri, 4 = Mon/Tue/Thu/Fri, 5 = Mon-Fri, 6 = Mon-Sat, 7 = every day. */
export function weekdaysFor(days: number): string[] {
  const pick = (idx: number[]) => idx.map((i) => WEEK[i])
  if (days === 2) return pick([1, 4])
  if (days === 3) return pick([0, 2, 4])
  if (days === 4) return pick([0, 1, 3, 4])
  if (days === 5) return pick([0, 1, 2, 3, 4])
  if (days === 6) return pick([0, 1, 2, 3, 4, 5])
  return [...WEEK]
}
