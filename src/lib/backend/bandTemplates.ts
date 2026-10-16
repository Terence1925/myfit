import type { SlotSpec, TemplateProgram } from './programTemplates'

// The resistance band reference programs, by level and training days. Same format as the other programs:
// "Name sets x reps", "12/leg" is done on each side, and a line with no sets and reps gets them from the goal.
// Not every level has every number of days; a missing one uses the next level down (see bandKeyFor).

export const BAND_TEMPLATES: Record<string, TemplateProgram> = {
  'beginner-3': {
    label: 'Full Body',
    days: [
      {
        name: 'Full Body A',
        exercises: [
          'Band Squat 3x15',
          'Band Chest Press 3x12',
          'Band Seated Row 3x12',
          'Band Shoulder Press 3x12',
          'Band Bicep Curl 2x15',
          'Band Tricep Pushdown 2x15',
          'Plank 3x30 sec',
        ],
      },
      {
        name: 'Full Body B',
        exercises: [
          'Band Romanian Deadlift 3x15',
          'Band Incline Chest Press 3x12',
          'Single Arm Band Row 3x12',
          'Band Lateral Raise 3x15',
          'Band Hammer Curl 2x15',
          'Overhead Band Tricep Extension 2x15',
          'Leg Raise 3x15',
        ],
      },
      {
        name: 'Full Body C',
        exercises: [
          'Band Reverse Lunge 3x12/leg',
          'Band Push-Up 3x10',
          'Bent Over Band Row 3x12',
          'Band Front Raise 3x15',
          'Band Curl 2x15',
          'Band Kickback 2x15',
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
        exercises: ['Band Chest Press 3x12', 'Band Row 3x12', 'Band Shoulder Press 3x12', 'Band Lateral Raise 3x15', 'Band Curl 2x15', 'Band Pushdown 2x15'],
      },
      {
        name: 'Lower A',
        exercises: ['Band Squat 3x15', 'Band Romanian Deadlift 3x15', 'Band Reverse Lunge 3x12', 'Band Glute Bridge 3x15', 'Calf Raise 4x20'],
      },
      {
        name: 'Upper B',
        exercises: ['Incline Band Press 3x12', 'Single Arm Row 3x12', 'Front Raise 3x15', 'Rear Delt Pull Apart 3x15', 'Hammer Curl 2x15', 'Overhead Extension 2x15'],
      },
      {
        name: 'Lower B',
        exercises: ['Band Deadlift 3x12', 'Bulgarian Split Squat 3x12', 'Band Hip Thrust 3x15', 'Band Leg Curl 3x15', 'Leg Raise 3x15'],
      },
    ],
  },
  'beginner-5': {
    label: 'one muscle group a day',
    days: [
      {
        name: 'Chest Day',
        exercises: ['Band Chest Press 4x12', 'Incline Band Press 4x12', 'Band Fly 4x15', 'Band Push-Up 3xFailure'],
      },
      {
        name: 'Back Day',
        exercises: ['Band Row 4x12', 'Single Arm Row 4x12', 'Straight Arm Pulldown 4x15', 'Band Pull Apart 4x15'],
      },
      {
        name: 'Leg Day',
        exercises: ['Band Squat 4x15', 'Romanian Deadlift 4x15', 'Reverse Lunge 4x12', 'Calf Raise 5x20'],
      },
      {
        name: 'Shoulder Day',
        exercises: ['Shoulder Press 4x12', 'Lateral Raise 4x15', 'Front Raise 4x15', 'Rear Delt Pull Apart 4x15'],
      },
      {
        name: 'Arms & Core',
        exercises: ['Curl 4x15', 'Hammer Curl 4x15', 'Pushdown 4x15', 'Overhead Extension 4x15', 'Crunch 3x25', 'Leg Raise 3x20'],
      },
    ],
  },
  'beginner-6': {
    label: 'Push/Pull/Legs, twice through the week',
    days: [
      { name: 'Push Day A', exercises: ['Chest Press', 'Incline Chest Press', 'Shoulder Press', 'Lateral Raise', 'Pushdown'] },
      { name: 'Pull Day A', exercises: ['Row', 'Single Arm Row', 'Pull Apart', 'Curl', 'Hammer Curl'] },
      { name: 'Leg Day A', exercises: ['Squat', 'Romanian Deadlift', 'Reverse Lunge', 'Glute Bridge', 'Calf Raise'] },
      { name: 'Push Day B', exercises: ['Band Fly', 'Chest Press', 'Arnold Press', 'Front Raise', 'Overhead Extension'] },
      { name: 'Pull Day B', exercises: ['Bent Row', 'Pull Apart', 'Straight Arm Pulldown', 'Curl', 'Hammer Curl'] },
      { name: 'Leg Day B', exercises: ['Deadlift', 'Bulgarian Split Squat', 'Hip Thrust', 'Leg Curl', 'Calf Raise'] },
    ],
  },

  'intermediate-4': {
    label: 'Upper/Lower, power and hypertrophy',
    days: [
      {
        name: 'Upper Power',
        exercises: ['Chest Press 4x10', 'Row 4x10', 'Shoulder Press 4x10', 'Lateral Raise 4x15', 'Curl 3x15', 'Pushdown 3x15'],
      },
      {
        name: 'Lower Power',
        exercises: ['Squat 4x12', 'Deadlift 4x12', 'Split Squat 4x12', 'Hip Thrust 4x15', 'Calf Raise 5x20'],
      },
      {
        name: 'Upper Hypertrophy',
        exercises: ['Incline Press 4x12', 'Single Arm Row 4x12', 'Arnold Press 4x12', 'Pull Apart 4x15', 'Hammer Curl 3x15', 'Extension 3x15'],
      },
      {
        name: 'Lower Hypertrophy',
        exercises: ['Squat 4x15', 'Romanian Deadlift 4x15', 'Walking Lunge 4x12', 'Leg Curl 4x15', 'Glute Bridge 4x20'],
      },
    ],
  },
  'intermediate-6': {
    label: 'Push/Pull/Legs, A and B days',
    days: [
      {
        name: 'Push Day A',
        exercises: ['Band Chest Press 4x10', 'Incline Press 4x12', 'Fly 4x15', 'Shoulder Press 4x12', 'Pushdown 4x15'],
      },
      {
        name: 'Pull Day A',
        exercises: ['Row 4x12', 'Single Arm Row 4x12', 'Pull Apart 4x15', 'Curl 4x15', 'Hammer Curl 4x15'],
      },
      { name: 'Leg Day A', exercises: ['Squat 4x15', 'Romanian Deadlift 4x15', 'Walking Lunge 4x12', 'Hip Thrust 4x15'] },
      {
        name: 'Push Day B',
        exercises: ['Fly 4x15', 'Chest Press 4x12', 'Arnold Press 4x12', 'Front Raise 4x15', 'Extension 4x15'],
      },
      {
        name: 'Pull Day B',
        exercises: ['Bent Row 4x12', 'Pulldown 4x12', 'Rear Delt Pull Apart 4x15', 'Curl 4x15', 'Hammer Curl 4x15'],
      },
      { name: 'Leg Day B', exercises: ['Deadlift 4x12', 'Split Squat 4x12', 'Leg Curl 4x15', 'Calf Raise 5x20'] },
    ],
  },

  'advanced-6': {
    label: 'Push/Pull/Legs, high volume',
    days: [
      {
        name: 'Push Day A',
        exercises: ['Chest Press 5x12', 'Incline Press 5x12', 'Fly 5x15', 'Shoulder Press 5x12', 'Lateral Raise 6x15', 'Pushdown 5x15'],
      },
      {
        name: 'Pull Day A',
        exercises: ['Heavy Row 5x12', 'Single Arm Row 5x12', 'Pulldown 5x12', 'Pull Apart 5x20', 'Curl 5x15', 'Hammer Curl 5x15'],
      },
      { name: 'Leg Day A', exercises: ['Squat 5x15', 'Deadlift 5x12', 'Walking Lunge 5x12', 'Hip Thrust 5x15', 'Calf Raise 6x25'] },
      {
        name: 'Push Day B',
        exercises: ['Fly 5x15', 'Chest Press 5x12', 'Arnold Press 5x12', 'Front Raise 5x20', 'Extension 5x15'],
      },
      {
        name: 'Pull Day B',
        exercises: ['Bent Row 5x12', 'Pulldown 5x12', 'Rear Delt Pull Apart 5x20', 'Curl 5x15', 'Hammer Curl 5x15'],
      },
      {
        name: 'Leg Day B',
        exercises: ['Bulgarian Split Squat 5x12', 'Romanian Deadlift 5x15', 'Leg Curl 5x15', 'Hip Thrust 5x20', 'Calf Raise 6x25'],
      },
    ],
  },
}

/** Which band program a person gets: their level and days, or the next level down when that level has none. */
export function bandKeyFor(experience: string, trainingDays: number): string | null {
  const order = experience === '0-1' ? ['beginner'] : experience === '5+' ? ['advanced', 'intermediate', 'beginner'] : ['intermediate', 'beginner']
  for (const level of order) {
    const key = `${level}-${trainingDays}`
    if (BAND_TEMPLATES[key]) return key
  }
  return null
}

const spec = (muscle: SlotSpec['muscle'], subgroup: string | undefined, picks: string[]): SlotSpec => ({ muscle, subgroup, picks })

const SQUAT = ['Band Squat', 'Bodyweight Squat']
const HINGE = ['Band Pull-Through', 'Single-Leg Romanian Deadlift']
const LUNGE = ['Reverse Lunge']
const SPLIT = ['Bulgarian Split Squat', 'Reverse Lunge']
const BRIDGE = ['Band Glute Bridge', 'Glute Bridge']
const HIP_THRUST = ['Band Hip Thrust', 'Band Glute Bridge']
const LEG_CURL = ['Band Leg Curl', 'Band Standing Leg Curl']
const CALF = ['Band Standing Calf Raise']
const CHEST_PRESS = ['Resistance Band Chest Press', 'Push-Up']
const INCLINE = ['Band Incline Press', 'Incline Push-Up']
const FLY = ['Resistance Band High Fly', 'Band Chest Fly']
const ROW = ['Band Seated Row', 'Resistance Band Row']
const BENT_ROW = ['Resistance Band Row', 'Band Seated Row']
const ONE_ARM_ROW = ['Band Single-Arm Row', 'Resistance Band Row']
const SHOULDER_PRESS = ['Band Overhead Press']
const FRONT_RAISE = ['Band One Arm Front Raise', 'Band Front Raise']
const REAR_DELT = ['Band Reverse Fly', 'Band Bent-Over Rear Lateral Raise']
const CURL = ['Band Curl']
const HAMMER = ['Band Hammer Curl', 'Band Curl']
const PUSHDOWN = ['Band Triceps Pushdown']
const OVERHEAD = ['Band Overhead Triceps Extension', 'Band Triceps Pushdown']

/** Band template names (lowercase, letters and digits only) -> what to use. */
export const BAND_SLOT_SPECS: Record<string, SlotSpec> = {
  // Legs
  'band squat': spec('legs', 'quad-compound', SQUAT),
  squat: spec('legs', 'quad-compound', SQUAT),
  'band romanian deadlift': spec('legs', 'hinge', HINGE),
  'romanian deadlift': spec('legs', 'hinge', HINGE),
  'band deadlift': spec('legs', 'hinge', HINGE),
  deadlift: spec('legs', 'hinge', HINGE),
  'band reverse lunge': spec('legs', 'quad-compound', LUNGE),
  'reverse lunge': spec('legs', 'quad-compound', LUNGE),
  'walking lunge': spec('legs', 'quad-compound', ['Walking Lunge', 'Reverse Lunge']),
  'bulgarian split squat': spec('legs', 'quad-compound', SPLIT),
  'split squat': spec('legs', 'quad-compound', SPLIT),
  'band glute bridge': spec('glutes', 'hip-thrust', BRIDGE),
  'glute bridge': spec('glutes', 'hip-thrust', BRIDGE),
  'band hip thrust': spec('glutes', 'hip-thrust', HIP_THRUST),
  'hip thrust': spec('glutes', 'hip-thrust', HIP_THRUST),
  'band leg curl': spec('legs', 'hamstring-isolation', LEG_CURL),
  'leg curl': spec('legs', 'hamstring-isolation', LEG_CURL),
  'calf raise': spec('legs', 'calf', CALF),
  // Chest
  'band chest press': spec('chest', 'press', CHEST_PRESS),
  'chest press': spec('chest', 'press', CHEST_PRESS),
  'band incline chest press': spec('chest', 'press', INCLINE),
  'incline chest press': spec('chest', 'press', INCLINE),
  'incline band press': spec('chest', 'press', INCLINE),
  'incline press': spec('chest', 'press', INCLINE),
  'band fly': spec('chest', 'fly', FLY),
  fly: spec('chest', 'fly', FLY),
  'band push up': spec('chest', 'press', ['Push-Up']),
  // Back
  'band seated row': spec('back', 'row', ROW),
  'band row': spec('back', 'row', ROW),
  row: spec('back', 'row', ROW),
  'heavy row': spec('back', 'row', ROW),
  'bent over band row': spec('back', 'horizontal-pull', BENT_ROW),
  'bent row': spec('back', 'horizontal-pull', BENT_ROW),
  'single arm band row': spec('back', 'horizontal-pull', ONE_ARM_ROW),
  'single arm row': spec('back', 'horizontal-pull', ONE_ARM_ROW),
  'straight arm pulldown': spec('back', 'vertical-pull', ['Band Straight-Arm Pulldown', 'Band Lat Pulldown']),
  pulldown: spec('back', 'vertical-pull', ['Band Lat Pulldown', 'Band Straight-Arm Pulldown']),
  'band pull apart': spec('back', 'rear', ['Band Pull-Apart']),
  'pull apart': spec('back', 'rear', ['Band Pull-Apart']),
  // Shoulders
  'band shoulder press': spec('shoulders', 'press', SHOULDER_PRESS),
  'shoulder press': spec('shoulders', 'press', SHOULDER_PRESS),
  'arnold press': spec('shoulders', 'press', SHOULDER_PRESS),
  'band lateral raise': spec('shoulders', 'lateral', ['Band Lateral Raise']),
  'lateral raise': spec('shoulders', 'lateral', ['Band Lateral Raise']),
  'band front raise': spec('shoulders', 'front', FRONT_RAISE),
  'front raise': spec('shoulders', 'front', FRONT_RAISE),
  'rear delt pull apart': spec('shoulders', 'rear', REAR_DELT),
  // Arms
  'band bicep curl': spec('arms', 'biceps', CURL),
  'band curl': spec('arms', 'biceps', CURL),
  curl: spec('arms', 'biceps', CURL),
  'band hammer curl': spec('arms', 'biceps', HAMMER),
  'hammer curl': spec('arms', 'biceps', HAMMER),
  'band tricep pushdown': spec('arms', 'triceps', PUSHDOWN),
  'band pushdown': spec('arms', 'triceps', PUSHDOWN),
  pushdown: spec('arms', 'triceps', PUSHDOWN),
  'overhead band tricep extension': spec('arms', 'triceps', OVERHEAD),
  'overhead extension': spec('arms', 'triceps', OVERHEAD),
  extension: spec('arms', 'triceps', OVERHEAD),
  'band kickback': spec('arms', 'triceps', ['Band Triceps Kickback', 'Band Triceps Pushdown']),
  // Core
  plank: spec('core', 'anti-extension', ['Plank', 'Elbow Side Plank']),
  'leg raise': spec('core', 'flexion', ['Lying Leg Raise', 'Leg Raise']),
  'bicycle crunch': spec('core', 'flexion', ['Bicycle Crunch']),
  crunch: spec('core', 'flexion', ['Crunch', 'Band Standing Crunch']),
}
