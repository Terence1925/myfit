import type { SlotSpec, TemplateProgram } from './programTemplates'

// The dumbbell-only reference programs, by level and training days. Same format as programTemplates.ts:
// "Name sets x reps", "10/leg" is done on each side, and a line with no sets and reps gets them from the goal.
// Not every level has every number of days; a missing one uses the next level down (see dumbbellKeyFor).

export const DUMBBELL_TEMPLATES: Record<string, TemplateProgram> = {
  'beginner-3': {
    label: 'Full Body',
    days: [
      {
        name: 'Full Body A',
        exercises: [
          'Goblet Squat 3x12',
          'Dumbbell Bench Press 3x10',
          'One-Arm Dumbbell Row 3x10',
          'Seated Dumbbell Shoulder Press 3x12',
          'Dumbbell Curl 2x12',
          'Overhead Dumbbell Tricep Extension 2x12',
          'Plank 3x30 sec',
        ],
      },
      {
        name: 'Full Body B',
        exercises: [
          'Dumbbell Romanian Deadlift 3x12',
          'Incline Dumbbell Press 3x10',
          'Chest Supported Dumbbell Row 3x10',
          'Dumbbell Lateral Raise 3x15',
          'Hammer Curl 2x12',
          'Dumbbell Skull Crusher 2x12',
          'Leg Raise 3x15',
        ],
      },
      {
        name: 'Full Body C',
        exercises: [
          'Reverse Dumbbell Lunge 3x10/leg',
          'Dumbbell Floor Press 3x10',
          'Renegade Row 3x10',
          'Arnold Press 3x12',
          'Dumbbell Curl 2x12',
          'Close-Grip Dumbbell Press 2x12',
          'Bicycle Crunch 3x20',
        ],
      },
    ],
  },
  'beginner-4': {
    label: 'Upper/Lower',
    days: [
      {
        name: 'Upper A',
        exercises: ['Dumbbell Bench Press 3x10', 'One-Arm Row 3x10', 'Shoulder Press 3x12', 'Lateral Raise 3x15', 'Curl 2x12', 'Tricep Extension 2x12'],
      },
      {
        name: 'Lower A',
        exercises: ['Goblet Squat 3x12', 'Dumbbell Romanian Deadlift 3x12', 'Walking Lunge 3x12', 'Standing Calf Raise 4x15', 'Crunch 3x20'],
      },
      {
        name: 'Upper B',
        exercises: ['Incline Dumbbell Press 3x10', 'Chest Supported Row 3x10', 'Arnold Press 3x12', 'Rear Delt Fly 3x15', 'Hammer Curl 2x12', 'Skull Crusher 2x12'],
      },
      {
        name: 'Lower B',
        exercises: ['Bulgarian Split Squat 3x10', 'Dumbbell Step Up 3x10', 'Stiff Leg Deadlift 3x10', 'Calf Raise 4x15', 'Leg Raise 3x15'],
      },
    ],
  },
  'beginner-5': {
    label: 'one muscle group a day',
    days: [
      {
        name: 'Chest Day',
        exercises: ['Dumbbell Bench Press 3x10', 'Incline Dumbbell Press 3x10', 'Dumbbell Fly 3x12', 'Push-Up 3xFailure'],
      },
      {
        name: 'Back Day',
        exercises: ['One Arm Row 3x10', 'Chest Supported Row 3x10', 'Renegade Row 3x10', 'Rear Delt Fly 3x15'],
      },
      {
        name: 'Leg Day',
        exercises: ['Goblet Squat 3x12', 'Romanian Deadlift 3x12', 'Reverse Lunge 3x12', 'Calf Raise 4x15'],
      },
      {
        name: 'Shoulder Day',
        exercises: ['Shoulder Press 3x12', 'Arnold Press 3x12', 'Lateral Raise 3x15', 'Rear Delt Fly 3x15'],
      },
      {
        name: 'Arms & Abs',
        exercises: ['Dumbbell Curl 3x12', 'Hammer Curl 3x12', 'Skull Crusher 3x12', 'Overhead Extension 3x12', 'Plank 3x45 sec', 'Leg Raise 3x15'],
      },
    ],
  },
  'beginner-6': {
    label: 'Push/Pull/Legs, twice through the week',
    days: [
      { name: 'Push Day A', exercises: ['Bench Press', 'Incline Press', 'Shoulder Press', 'Lateral Raise', 'Skull Crusher'] },
      { name: 'Pull Day A', exercises: ['One Arm Row', 'Chest Supported Row', 'Renegade Row', 'Curl', 'Hammer Curl'] },
      { name: 'Leg Day A', exercises: ['Goblet Squat', 'Romanian Deadlift', 'Walking Lunge', 'Calf Raise'] },
      { name: 'Push Day B', exercises: ['Floor Press', 'Dumbbell Fly', 'Arnold Press', 'Lateral Raise', 'Overhead Extension'] },
      { name: 'Pull Day B', exercises: ['Row', 'Rear Delt Fly', 'Renegade Row', 'Curl', 'Hammer Curl'] },
      { name: 'Leg Day B', exercises: ['Bulgarian Split Squat', 'Step Up', 'Stiff Leg Deadlift', 'Calf Raise'] },
    ],
  },

  'intermediate-4': {
    label: 'Upper/Lower, power and hypertrophy',
    days: [
      {
        name: 'Upper Power',
        exercises: ['Dumbbell Bench Press 4x6', 'One Arm Row 4x8', 'Shoulder Press 4x8', 'Lateral Raise 4x15', 'Curl 3x12', 'Skull Crusher 3x12'],
      },
      {
        name: 'Lower Power',
        exercises: ['Goblet Squat 4x8', 'Dumbbell Romanian Deadlift 4x8', 'Walking Lunge 4x10', 'Calf Raise 5x15'],
      },
      {
        name: 'Upper Hypertrophy',
        exercises: ['Incline Press 4x10', 'Chest Supported Row 4x10', 'Arnold Press 4x12', 'Rear Delt Fly 4x15', 'Hammer Curl 3x12', 'Extension 3x12'],
      },
      {
        name: 'Lower Hypertrophy',
        exercises: ['Bulgarian Split Squat 4x10', 'Step Up 4x10', 'Romanian Deadlift 4x12', 'Calf Raise 5x20'],
      },
    ],
  },
  'intermediate-6': {
    label: 'Push/Pull/Legs, A and B days',
    days: [
      {
        name: 'Push Day A',
        exercises: ['Bench Press 4x6', 'Incline Press 4x8', 'Fly 3x12', 'Shoulder Press 4x8', 'Lateral Raise 4x15', 'Skull Crusher 4x12'],
      },
      {
        name: 'Pull Day A',
        exercises: ['One Arm Row 4x8', 'Chest Supported Row 4x10', 'Renegade Row 3x12', 'Curl 4x12', 'Hammer Curl 4x12'],
      },
      { name: 'Leg Day A', exercises: ['Goblet Squat 4x8', 'Romanian Deadlift 4x10', 'Walking Lunge 4x10', 'Calf Raise 5x15'] },
      {
        name: 'Push Day B',
        exercises: ['Incline Press 4x10', 'Floor Press 4x10', 'Fly 4x12', 'Arnold Press 4x10', 'Lateral Raise 4x15'],
      },
      {
        name: 'Pull Day B',
        exercises: ['Chest Supported Row 4x10', 'One Arm Row 4x10', 'Rear Delt Fly 4x15', 'Curl 4x12', 'Hammer Curl 4x12'],
      },
      {
        name: 'Leg Day B',
        exercises: ['Bulgarian Split Squat 4x10', 'Step Up 4x10', 'Stiff Leg Deadlift 4x10', 'Calf Raise 5x20'],
      },
    ],
  },

  'advanced-6': {
    label: 'Push/Pull/Legs, high volume',
    days: [
      {
        name: 'Push Day A',
        exercises: ['Dumbbell Bench Press 5x5', 'Incline Dumbbell Press 5x8', 'Dumbbell Fly 4x12', 'Shoulder Press 5x8', 'Lateral Raise 6x15', 'Skull Crusher 4x12'],
      },
      {
        name: 'Pull Day A',
        exercises: ['Heavy One Arm Row 5x8', 'Chest Supported Row 5x10', 'Renegade Row 4x12', 'Curl 4x12', 'Hammer Curl 4x12'],
      },
      { name: 'Leg Day A', exercises: ['Heavy Goblet Squat 5x8', 'Romanian Deadlift 5x8', 'Walking Lunge 5x10', 'Calf Raise 6x20'] },
      {
        name: 'Push Day B',
        exercises: ['Incline Press 5x8', 'Floor Press 5x10', 'Fly 5x12', 'Arnold Press 5x10', 'Lateral Raise 6x15'],
      },
      {
        name: 'Pull Day B',
        exercises: ['Row 5x10', 'Rear Delt Fly 5x15', 'Renegade Row 5x12', 'Curl 5x12', 'Hammer Curl 5x12'],
      },
      {
        name: 'Leg Day B',
        exercises: ['Bulgarian Split Squat 5x10', 'Step Up 5x10', 'Stiff Leg Deadlift 5x10', 'Calf Raise 6x20'],
      },
    ],
  },
}

/** Which dumbbell program a person gets: their level and days, or the next level down when that level has none. */
export function dumbbellKeyFor(experience: string, trainingDays: number): string | null {
  const order = experience === '0-1' ? ['beginner'] : experience === '5+' ? ['advanced', 'intermediate', 'beginner'] : ['intermediate', 'beginner']
  for (const level of order) {
    const key = `${level}-${trainingDays}`
    if (DUMBBELL_TEMPLATES[key]) return key
  }
  return null
}

const spec = (muscle: SlotSpec['muscle'], subgroup: string | undefined, picks: string[]): SlotSpec => ({ muscle, subgroup, picks })

const SQUAT = ['Goblet Squat', 'Dumbbell Squat']
const ROW = ['Dumbbell Row', 'Chest-Supported Row']
const BENCH = ['Dumbbell Bench Press', 'Decline Dumbbell Press', 'Incline Dumbbell Press', 'Push-Up']
const PRESS = ['Dumbbell Shoulder Press', 'Arnold Press']
const CURL = ['Dumbbell Curl', 'Alternating Dumbbell Curl', 'Incline Dumbbell Curl']
const TRICEPS = ['Overhead Dumbbell Extension', 'Dumbbell Skull Crusher', 'Tricep Kickback']
const CALF = ['Dumbbell Standing Calf Raise', 'Standing Calf Raise']

/** Dumbbell template names (lowercase, letters and digits only) -> what to use. */
export const DUMBBELL_SLOT_SPECS: Record<string, SlotSpec> = {
  // Legs
  'goblet squat': spec('legs', 'quad-compound', SQUAT),
  'heavy goblet squat': spec('legs', 'quad-compound', SQUAT),
  'dumbbell romanian deadlift': spec('legs', 'hinge', ['Romanian Deadlift', 'Dumbbell Stiff Leg Deadlift']),
  'romanian deadlift': spec('legs', 'hinge', ['Romanian Deadlift', 'Dumbbell Stiff Leg Deadlift']),
  'stiff leg deadlift': spec('legs', 'hinge', ['Dumbbell Stiff Leg Deadlift', 'Romanian Deadlift']),
  'reverse dumbbell lunge': spec('legs', 'quad-compound', ['Dumbbell Reverse Lunge', 'Dumbbell Lunge']),
  'reverse lunge': spec('legs', 'quad-compound', ['Dumbbell Reverse Lunge', 'Dumbbell Lunge']),
  'walking lunge': spec('legs', 'quad-compound', ['Walking Lunge', 'Dumbbell Lunge']),
  'bulgarian split squat': spec('legs', 'quad-compound', ['Bulgarian Split Squat', 'Goblet Squat']),
  'dumbbell step up': spec('legs', 'quad-compound', ['Dumbbell Step-Up', 'Step-Up']),
  'step up': spec('legs', 'quad-compound', ['Dumbbell Step-Up', 'Step-Up']),
  'standing calf raise': spec('legs', 'calf', CALF),
  'calf raise': spec('legs', 'calf', CALF),
  // Chest
  'dumbbell bench press': spec('chest', 'press', BENCH),
  'bench press': spec('chest', 'press', BENCH),
  'incline dumbbell press': spec('chest', 'press', ['Incline Dumbbell Press', 'Decline Dumbbell Press']),
  'incline press': spec('chest', 'press', ['Incline Dumbbell Press', 'Decline Dumbbell Press']),
  'dumbbell floor press': spec('chest', 'press', ['Dumbbell Floor Press', 'Decline Dumbbell Press']),
  'floor press': spec('chest', 'press', ['Dumbbell Floor Press', 'Decline Dumbbell Press']),
  'dumbbell fly': spec('chest', 'fly', ['Dumbbell Fly', 'Incline Dumbbell Fly']),
  fly: spec('chest', 'fly', ['Dumbbell Fly', 'Incline Dumbbell Fly']),
  'push up': spec('chest', 'press', ['Push-Up']),
  // Back
  'one arm dumbbell row': spec('back', 'horizontal-pull', ROW),
  'one arm row': spec('back', 'horizontal-pull', ROW),
  'heavy one arm row': spec('back', 'horizontal-pull', ROW),
  row: spec('back', 'horizontal-pull', ROW),
  'chest supported dumbbell row': spec('back', 'horizontal-pull', ['Chest-Supported Row', 'Dumbbell Row']),
  'chest supported row': spec('back', 'horizontal-pull', ['Chest-Supported Row', 'Dumbbell Row']),
  'renegade row': spec('back', 'horizontal-pull', ['Renegade Row', 'Dumbbell Row']),
  // Shoulders
  'seated dumbbell shoulder press': spec('shoulders', 'press', PRESS),
  'shoulder press': spec('shoulders', 'press', PRESS),
  'arnold press': spec('shoulders', 'press', ['Arnold Press', 'Dumbbell Shoulder Press']),
  'dumbbell lateral raise': spec('shoulders', 'lateral', ['Dumbbell Lateral Raise']),
  'lateral raise': spec('shoulders', 'lateral', ['Dumbbell Lateral Raise']),
  'rear delt fly': spec('shoulders', 'rear', ['Rear Delt Fly']),
  // Arms
  'dumbbell curl': spec('arms', 'biceps', CURL),
  curl: spec('arms', 'biceps', CURL),
  'hammer curl': spec('arms', 'biceps', ['Hammer Curl', 'Dumbbell Curl']),
  'overhead dumbbell tricep extension': spec('arms', 'triceps', TRICEPS),
  'overhead extension': spec('arms', 'triceps', TRICEPS),
  'tricep extension': spec('arms', 'triceps', TRICEPS),
  extension: spec('arms', 'triceps', TRICEPS),
  'dumbbell skull crusher': spec('arms', 'triceps', ['Dumbbell Skull Crusher', 'Overhead Dumbbell Extension']),
  'skull crusher': spec('arms', 'triceps', ['Dumbbell Skull Crusher', 'Overhead Dumbbell Extension']),
  'close grip dumbbell press': spec('arms', 'triceps', ['Dumbbell Close-Grip Press', 'Dumbbell Skull Crusher']),
  // Core
  plank: spec('core', 'anti-extension', ['Plank']),
  'leg raise': spec('core', 'flexion', ['Lying Leg Raise', 'Leg Raise']),
  'bicycle crunch': spec('core', 'flexion', ['Bicycle Crunch']),
  crunch: spec('core', 'flexion', ['Crunch', 'Reverse Crunch']),
}
