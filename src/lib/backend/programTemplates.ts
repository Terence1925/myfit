// The reference programs the strength generator follows: one for each level and number of training days.
// Each exercise is written as "Name sets x reps". A line with no sets and reps gets them from the goal.
// These are the owner's programs; the generator swaps an exercise only when the person's equipment, injury or
// the available animations make the named one impossible (see buildTemplateDays in programGenerator.ts).

export type TemplateLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'

export interface TemplateDay {
  name: string
  exercises: string[]
}

export interface TemplateProgram {
  /** Short description of the split, used in the program overview. */
  label: string
  days: TemplateDay[]
}

export const PROGRAM_TEMPLATES: Record<string, TemplateProgram> = {
  'beginner-3': {
    label: 'Full Body',
    days: [
      {
        name: 'Full Body A',
        exercises: [
          'Barbell Squat 3x8-10',
          'Bench Press 3x8-10',
          'Lat Pulldown 3x10-12',
          'Dumbbell Shoulder Press 2x10-12',
          'Dumbbell Curl 2x12',
          'Tricep Pushdown 2x12',
          'Plank 3x30 sec',
        ],
      },
      {
        name: 'Full Body B',
        exercises: [
          'Romanian Deadlift 3x8-10',
          'Incline Dumbbell Press 3x8-10',
          'Seated Cable Row 3x10-12',
          'Lateral Raise 2x15',
          'Hammer Curl 2x12',
          'Overhead Tricep Extension 2x12',
          'Hanging Leg Raise 3x10',
        ],
      },
      {
        name: 'Full Body C',
        exercises: [
          'Leg Press 3x10',
          'Chest Press Machine 3x10',
          'Assisted Pull-Up 3x8',
          'Rear Delt Fly 2x15',
          'EZ Bar Curl 2x12',
          'Rope Pushdown 2x12',
          'Cable Crunch 3x15',
        ],
      },
    ],
  },
  'beginner-4': {
    label: 'Upper/Lower',
    days: [
      {
        name: 'Upper A',
        exercises: [
          'Bench Press 3x8',
          'Lat Pulldown 3x10',
          'Seated Row 3x10',
          'Shoulder Press 3x10',
          'Dumbbell Curl 2x12',
          'Pushdown 2x12',
        ],
      },
      {
        name: 'Lower A',
        exercises: ['Squat 3x8', 'Leg Press 3x10', 'Leg Curl 3x12', 'Leg Extension 3x12', 'Calf Raise 3x15', 'Crunch 3x20'],
      },
      {
        name: 'Upper B',
        exercises: [
          'Incline Dumbbell Press 3x10',
          'Pull-Up Assisted 3x8',
          'Machine Row 3x10',
          'Lateral Raise 3x15',
          'Hammer Curl 2x12',
          'Skull Crusher 2x12',
        ],
      },
      {
        name: 'Lower B',
        exercises: [
          'Romanian Deadlift 3x8',
          'Bulgarian Split Squat 3x10',
          'Leg Curl 3x12',
          'Leg Extension 3x12',
          'Calf Raise 3x15',
          'Hanging Leg Raise 3x12',
        ],
      },
    ],
  },
  'beginner-5': {
    label: 'one muscle group a day',
    days: [
      {
        name: 'Chest Day',
        exercises: ['Bench Press 3x8', 'Incline Dumbbell Press 3x10', 'Chest Fly 3x12', 'Push-Up 3xFailure'],
      },
      {
        name: 'Back Day',
        exercises: ['Lat Pulldown 3x10', 'Seated Row 3x10', 'Dumbbell Row 3x10', 'Face Pull 3x15'],
      },
      {
        name: 'Leg Day',
        exercises: ['Squat 3x8', 'Leg Press 3x10', 'Leg Curl 3x12', 'Calf Raise 4x15'],
      },
      {
        name: 'Shoulder Day',
        exercises: ['Shoulder Press 3x10', 'Lateral Raise 3x15', 'Rear Delt Fly 3x15', 'Face Pull 3x15'],
      },
      {
        name: 'Arms & Abs',
        exercises: ['Barbell Curl 3x10', 'Hammer Curl 3x12', 'Pushdown 3x10', 'Overhead Extension 3x12', 'Cable Crunch 3x15', 'Leg Raise 3x15'],
      },
    ],
  },
  'beginner-6': {
    label: 'Push/Pull/Legs, twice through the week',
    days: [
      { name: 'Push Day', exercises: ['Bench Press', 'Incline Press', 'Shoulder Press', 'Lateral Raise', 'Pushdown'] },
      { name: 'Pull Day', exercises: ['Lat Pulldown', 'Seated Row', 'Dumbbell Row', 'Barbell Curl', 'Hammer Curl'] },
      { name: 'Leg Day', exercises: ['Squat', 'Leg Press', 'Leg Curl', 'Calf Raise', 'Leg Raise'] },
      { name: 'Push Day II', exercises: ['Bench Press', 'Incline Press', 'Shoulder Press', 'Lateral Raise', 'Pushdown'] },
      { name: 'Pull Day II', exercises: ['Lat Pulldown', 'Seated Row', 'Dumbbell Row', 'Barbell Curl', 'Hammer Curl'] },
      { name: 'Leg Day II', exercises: ['Squat', 'Leg Press', 'Leg Curl', 'Calf Raise', 'Leg Raise'] },
    ],
  },

  'intermediate-3': {
    label: 'Full Body',
    days: [
      {
        name: 'Full Body A',
        exercises: ['Squat 4x6', 'Bench Press 4x6', 'Row 4x8', 'Shoulder Press 3x10', 'Curl 3x12', 'Pushdown 3x12'],
      },
      {
        name: 'Full Body B',
        exercises: ['Deadlift 4x5', 'Incline Press 4x8', 'Pull-Up 4x8', 'Lateral Raise 4x15', 'Hammer Curl 3x12', 'Skull Crusher 3x12'],
      },
      {
        name: 'Full Body C',
        exercises: ['Front Squat 4x8', 'Chest Fly 4x12', 'Seated Row 4x10', 'Face Pull 4x15', 'Hanging Leg Raise 4x12', 'Cable Crunch 4x15'],
      },
    ],
  },
  'intermediate-4': {
    label: 'Upper/Lower, power and muscle building',
    days: [
      {
        name: 'Upper Power',
        exercises: ['Bench Press 4x5', 'Barbell Row 4x5', 'Pull-Up 4x6', 'Shoulder Press 4x6', 'Curl 3x10', 'Pushdown 3x10'],
      },
      { name: 'Lower Power', exercises: ['Squat 4x5', 'Deadlift 3x5', 'Leg Press 3x10', 'Calf Raise 4x15'] },
      {
        name: 'Upper Muscle',
        exercises: ['Incline Press 4x10', 'Lat Pulldown 4x12', 'Cable Row 4x12', 'Lateral Raise 4x15', 'Hammer Curl 3x12', 'Skull Crusher 3x12'],
      },
      {
        name: 'Lower Muscle',
        exercises: ['Hack Squat 4x10', 'Romanian Deadlift 4x10', 'Leg Extension 4x12', 'Leg Curl 4x12', 'Calf Raise 4x15'],
      },
    ],
  },
  'intermediate-5': {
    label: 'body-part split with an upper pump day',
    days: [
      {
        name: 'Chest & Triceps',
        exercises: ['Bench Press 4x6', 'Incline Press 4x8', 'Chest Fly 4x12', 'Pushdown 4x12', 'Skull Crusher 4x12'],
      },
      {
        name: 'Back & Biceps',
        exercises: ['Pull-Up 4x8', 'Row 4x8', 'Pulldown 4x10', 'Curl 3x12', 'Hammer Curl 3x12'],
      },
      { name: 'Leg Day', exercises: ['Squat 4x6', 'RDL 4x8', 'Leg Press 4x10', 'Leg Curl 4x12', 'Calf Raise 5x15'] },
      { name: 'Shoulder Day', exercises: ['OHP 4x6', 'Lateral Raise 4x15', 'Rear Delt Fly 4x15', 'Face Pull 4x15'] },
      {
        name: 'Upper Pump',
        exercises: ['Incline Press', 'Machine Row', 'Pull-Up', 'Lateral Raise', 'Curl', 'Pushdown'],
      },
    ],
  },
  'intermediate-6': {
    label: 'Push/Pull/Legs, A and B days',
    days: [
      {
        name: 'Push Day A',
        exercises: ['Bench Press 4x6', 'Incline Press 4x8', 'Fly 3x12', 'OHP 4x8', 'Lateral Raise 4x15', 'Pushdown 4x12'],
      },
      {
        name: 'Pull Day A',
        exercises: ['Pull-Up 4x8', 'Barbell Row 4x8', 'Pulldown 4x10', 'Face Pull 3x15', 'Curl 3x12', 'Hammer Curl 3x12'],
      },
      { name: 'Leg Day A', exercises: ['Squat 4x6', 'RDL 4x8', 'Leg Press 3x12', 'Leg Curl 3x12', 'Calf Raise 5x15'] },
      {
        name: 'Push Day B',
        exercises: ['Incline Bench 4x8', 'Dumbbell Press 4x10', 'Fly 4x12', 'Arnold Press 4x10', 'Lateral Raise 4x15', 'Skull Crusher 4x12'],
      },
      {
        name: 'Pull Day B',
        exercises: ['Deadlift 3x5', 'Chest Supported Row 4x10', 'Pull-Up 4x8', 'Face Pull 4x15', 'Preacher Curl 4x12', 'Cable Curl 4x12'],
      },
      {
        name: 'Leg Day B',
        exercises: ['Front Squat 4x8', 'Bulgarian Split Squat 4x10', 'Leg Extension 4x15', 'Leg Curl 4x15', 'Standing Calf Raise 5x20'],
      },
    ],
  },

  'advanced-6': {
    label: 'Push/Pull/Legs, high volume',
    days: [
      {
        name: 'Push Day A',
        exercises: ['Bench Press 5x5', 'Incline Press 4x8', 'Machine Press 4x10', 'OHP 4x8', 'Lateral Raise 5x15', 'Pushdown 4x12', 'Overhead Extension 4x12'],
      },
      {
        name: 'Pull Day A',
        exercises: ['Weighted Pull-Up 5x5', 'Barbell Row 5x8', 'Lat Pulldown 4x10', 'Face Pull 5x15', 'Barbell Curl 4x10', 'Hammer Curl 4x10'],
      },
      { name: 'Leg Day A', exercises: ['Squat 5x5', 'RDL 5x8', 'Leg Press 4x12', 'Leg Curl 4x12', 'Calf Raise 6x15'] },
      {
        name: 'Push Day B',
        exercises: ['Incline Bench 5x8', 'Dumbbell Press 4x10', 'Fly 5x12', 'Arnold Press 4x10', 'Lateral Raise 6x15', 'Close Grip Bench 4x8'],
      },
      {
        name: 'Pull Day B',
        exercises: ['Deadlift 4x5', 'T-Bar Row 4x8', 'Pull-Up 4x10', 'Cable Row 4x12', 'Preacher Curl 4x12', 'Cable Curl 4x12'],
      },
      {
        name: 'Leg Day B',
        exercises: ['Front Squat 4x8', 'Hack Squat 4x10', 'Leg Extension 5x15', 'Leg Curl 5x15', 'Calf Raise 6x20'],
      },
    ],
  },

  // Bodybuilding / competition prep. Not offered in the intake yet (the wizard has no "elite" level); kept here so it is
  // one line to switch on. "Triceps 8 sets" and "Biceps 8 sets" are written as two exercises of 4 sets.
  'elite-6': {
    label: 'Push/Pull/Legs, power then volume',
    days: [
      {
        name: 'Push Power',
        exercises: ['Bench Press 5x3', 'OHP 5x5', 'Incline Press 4x6', 'Lateral Raise 5x15', 'Pushdown 5x12'],
      },
      { name: 'Pull Power', exercises: ['Weighted Pull-Up 5x3', 'Barbell Row 5x5', 'Deadlift 3x3', 'Curl 4x10'] },
      { name: 'Leg Power', exercises: ['Squat 5x3', 'Front Squat 4x5', 'RDL 4x6', 'Calf Raise 6x15'] },
      {
        name: 'Push Volume',
        exercises: ['Incline Smith Press 5x12', 'Machine Press 5x12', 'Fly 5x15', 'Lateral Raise 8x15', 'Pushdown 4x12', 'Skull Crusher 4x12'],
      },
      {
        name: 'Pull Volume',
        exercises: ['Pulldown 5x12', 'Row 5x12', 'Pull-Up 5x10', 'Face Pull 5x15', 'Curl 4x10', 'Hammer Curl 4x12'],
      },
      {
        name: 'Leg Volume',
        exercises: ['Hack Squat 5x12', 'Leg Press 5x15', 'Leg Extension 5x15', 'Leg Curl 5x15', 'Standing Calf Raise 4x20', 'Seated Calf Raise 4x20'],
      },
    ],
  },
}

/** Which reference program a person gets: their level, and how many days a week they train. */
export function templateKeyFor(experience: string, trainingDays: number): string | null {
  const level: TemplateLevel = experience === '0-1' ? 'beginner' : experience === '5+' ? 'advanced' : 'intermediate'
  const exact = `${level}-${trainingDays}`
  if (PROGRAM_TEMPLATES[exact]) return exact
  // Advanced lifters who train fewer than 6 days use the intermediate layout for that number of days
  const fallback = `intermediate-${trainingDays}`
  return PROGRAM_TEMPLATES[fallback] ? fallback : null
}

/** How one template line asks for an exercise: what muscle it works, and which library exercises to try, in order. */
export interface SlotSpec {
  muscle: 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'glutes' | 'core'
  subgroup?: string
  picks: string[]
}

const spec = (muscle: SlotSpec['muscle'], subgroup: string | undefined, picks: string[]): SlotSpec => ({ muscle, subgroup, picks })

/** Template names (lowercase, letters and digits only) -> what to use. Library names must match exactly. */
export const SLOT_SPECS: Record<string, SlotSpec> = {
  // Legs
  'barbell squat': spec('legs', 'quad-compound', ['Barbell Squat', 'Goblet Squat', 'Leg Press']),
  squat: spec('legs', 'quad-compound', ['Barbell Squat', 'Goblet Squat', 'Leg Press']),
  'front squat': spec('legs', 'quad-compound', ['Front Squat', 'Barbell Squat', 'Goblet Squat']),
  'hack squat': spec('legs', 'quad-compound', ['Hack Squat', 'Leg Press', 'Goblet Squat']),
  'leg press': spec('legs', 'quad-compound', ['Leg Press', 'Hack Squat', 'Goblet Squat']),
  'bulgarian split squat': spec('legs', 'quad-compound', ['Bulgarian Split Squat', 'Goblet Squat']),
  'leg extension': spec('legs', 'quad-isolation', ['Leg Extension']),
  'leg curl': spec('legs', 'hamstring-isolation', ['Lying Leg Curl', 'Seated Leg Curl']),
  'romanian deadlift': spec('legs', 'hinge', ['Romanian Deadlift', 'Stiff-Leg Deadlift']),
  rdl: spec('legs', 'hinge', ['Romanian Deadlift', 'Stiff-Leg Deadlift']),
  deadlift: spec('legs', 'hinge', ['Deadlift', 'Romanian Deadlift', 'Stiff-Leg Deadlift']),
  'calf raise': spec('legs', 'calf', ['Standing Calf Raise', 'Seated Calf Raise', 'Leg Press Calf Raise']),
  'standing calf raise': spec('legs', 'calf', ['Standing Calf Raise', 'Seated Calf Raise']),
  'seated calf raise': spec('legs', 'calf', ['Seated Calf Raise', 'Standing Calf Raise']),
  // Chest
  'bench press': spec('chest', 'press', ['Barbell Bench Press', 'Chest Press Machine']),
  'chest press machine': spec('chest', 'press', ['Chest Press Machine', 'Barbell Bench Press']),
  'machine press': spec('chest', 'press', ['Chest Press Machine', 'Decline Dumbbell Press']),
  'incline dumbbell press': spec('chest', 'press', ['Incline Dumbbell Press', 'Incline Bench Press']),
  'incline press': spec('chest', 'press', ['Incline Dumbbell Press', 'Incline Bench Press']),
  'incline bench': spec('chest', 'press', ['Incline Bench Press', 'Incline Dumbbell Press']),
  'incline smith press': spec('chest', 'press', ['Incline Bench Press', 'Incline Dumbbell Press']),
  'dumbbell press': spec('chest', 'press', ['Dumbbell Bench Press', 'Decline Dumbbell Press', 'Incline Dumbbell Press']),
  'chest fly': spec('chest', 'fly', ['Cable Fly', 'Pec Deck Fly', 'Dumbbell Fly']),
  fly: spec('chest', 'fly', ['Pec Deck Fly', 'Cable Fly', 'Incline Dumbbell Fly']),
  'push up': spec('chest', 'press', ['Push-Up']),
  // Back
  'lat pulldown': spec('back', 'vertical-pull', ['Lat Pulldown', 'Close-Grip Lat Pulldown']),
  pulldown: spec('back', 'vertical-pull', ['Lat Pulldown', 'Close-Grip Lat Pulldown']),
  'pull up': spec('back', 'vertical-pull', ['Pull-Up', 'Chin-Up', 'Wide-Grip Pull-Up', 'Lat Pulldown']),
  'weighted pull up': spec('back', 'vertical-pull', ['Pull-Up', 'Wide-Grip Pull-Up', 'Chin-Up']),
  'assisted pull up': spec('back', 'vertical-pull', ['Close-Grip Lat Pulldown', 'Lat Pulldown', 'Pull-Up']),
  'pull up assisted': spec('back', 'vertical-pull', ['Close-Grip Lat Pulldown', 'Lat Pulldown', 'Pull-Up']),
  'seated cable row': spec('back', 'horizontal-pull', ['Seated Cable Row', 'Machine Row']),
  'seated row': spec('back', 'horizontal-pull', ['Seated Cable Row', 'Machine Row']),
  'cable row': spec('back', 'horizontal-pull', ['Seated Cable Row', 'Machine Row']),
  'machine row': spec('back', 'horizontal-pull', ['Machine Row', 'Seated Cable Row']),
  row: spec('back', 'horizontal-pull', ['Barbell Row', 'Seated Cable Row', 'Dumbbell Row']),
  'barbell row': spec('back', 'horizontal-pull', ['Barbell Row', 'Chest-Supported Row', 'Dumbbell Row']),
  'dumbbell row': spec('back', 'horizontal-pull', ['Dumbbell Row', 'Chest-Supported Row']),
  'chest supported row': spec('back', 'horizontal-pull', ['Chest-Supported Row', 'Machine Row']),
  't bar row': spec('back', 'horizontal-pull', ['T-Bar Row', 'Machine Row']),
  // Shoulders
  'dumbbell shoulder press': spec('shoulders', 'press', ['Dumbbell Shoulder Press', 'Barbell Overhead Press', 'Arnold Press']),
  'shoulder press': spec('shoulders', 'press', ['Dumbbell Shoulder Press', 'Barbell Overhead Press', 'Arnold Press']),
  ohp: spec('shoulders', 'press', ['Barbell Overhead Press', 'Dumbbell Shoulder Press']),
  'arnold press': spec('shoulders', 'press', ['Arnold Press', 'Dumbbell Shoulder Press']),
  'lateral raise': spec('shoulders', 'lateral', ['Dumbbell Lateral Raise', 'Cable Lateral Raise', 'Machine Lateral Raise']),
  'rear delt fly': spec('shoulders', 'rear', ['Rear Delt Fly', 'Reverse Pec Deck', 'Cable Rear Delt Fly']),
  'face pull': spec('shoulders', 'rear', ['Face Pull', 'Reverse Pec Deck', 'Cable Rear Delt Fly', 'Rear Delt Fly']),
  // Arms
  'dumbbell curl': spec('arms', 'biceps', ['Dumbbell Curl', 'Barbell Curl', 'EZ Bar Curl']),
  curl: spec('arms', 'biceps', ['Dumbbell Curl', 'Barbell Curl', 'EZ Bar Curl']),
  'barbell curl': spec('arms', 'biceps', ['Barbell Curl', 'EZ Bar Curl', 'Dumbbell Curl']),
  'ez bar curl': spec('arms', 'biceps', ['EZ Bar Curl', 'Barbell Curl']),
  'hammer curl': spec('arms', 'biceps', ['Hammer Curl', 'Dumbbell Curl']),
  'preacher curl': spec('arms', 'biceps', ['Preacher Curl', 'Machine Curl']),
  'cable curl': spec('arms', 'biceps', ['Cable Curl', 'Dumbbell Curl']),
  'tricep pushdown': spec('arms', 'triceps', ['Tricep Pushdown', 'Rope Pushdown']),
  pushdown: spec('arms', 'triceps', ['Tricep Pushdown', 'Rope Pushdown']),
  'rope pushdown': spec('arms', 'triceps', ['Rope Pushdown', 'Tricep Pushdown']),
  'overhead tricep extension': spec('arms', 'triceps', ['Overhead Cable Extension', 'Overhead Dumbbell Extension']),
  'overhead extension': spec('arms', 'triceps', ['Overhead Cable Extension', 'Overhead Dumbbell Extension']),
  'skull crusher': spec('arms', 'triceps', ['Skull Crushers', 'Overhead Cable Extension']),
  'close grip bench': spec('arms', 'triceps', ['Close-Grip Bench Press']),
  // Core
  plank: spec('core', 'anti-extension', ['Plank', 'Elbow Side Plank']),
  'hanging leg raise': spec('core', 'flexion', ['Hanging Leg Raise', 'Leg Raise', 'Reverse Crunch']),
  'leg raise': spec('core', 'flexion', ['Leg Raise', 'Hanging Leg Raise', 'Reverse Crunch']),
  'cable crunch': spec('core', 'flexion', ['Cable Crunch', 'Machine Crunch', 'Crunch']),
  crunch: spec('core', 'flexion', ['Crunch', 'Machine Crunch']),
}

export function slotKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** "Barbell Squat 3x8-10" -> name, sets, reps. Reps can be "Failure"; with no sets and reps both are undefined. */
export function parseTemplateLine(line: string): { name: string; sets?: number; reps?: string; seconds?: boolean; eachSide?: boolean } {
  const m = line.match(/^(.*?)\s+(\d+)x(\d+(?:-\d+)?|Failure)(\/leg|\s*sec)?$/)
  if (!m) return { name: line.trim() }
  return { name: m[1].trim(), sets: Number(m[2]), reps: m[3], seconds: !!m[4] && m[4] !== '/leg', eachSide: m[4] === '/leg' }
}
