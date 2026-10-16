import type { Exercise, FocusArea, IntakeAnswers, ProgramDay } from '../types'
import { normalizeEquipment } from '../discipline'
import { EXERCISES, injuryAllows, type LibraryExercise } from './exerciseLibrary'

// The home (bodyweight / calisthenics) programs, for men and women. One layout for each number of training days.
// Your level sets the number of sets and how hard to make each move (see LEVELS below). Each line is "Name sets x reps":
// "12/leg" is done on each side, and "30 sec" is a time. Moves with no animation yet show a YouTube video instead.

interface HomeDay {
  name: string
  exercises: string[]
}

export const HOME_TEMPLATES: Record<number, { label: string; days: HomeDay[] }> = {
  3: {
    label: 'Full Body',
    days: [
      {
        name: 'Full Body A',
        exercises: ['Bodyweight Squats 3x15', 'Push-Ups 3x10', 'Glute Bridges 3x15', 'Reverse Lunges 3x12/leg', 'Plank 3x30 sec', 'Jumping Jacks 3x30 sec'],
      },
      {
        name: 'Full Body B',
        exercises: ['Bulgarian Split Squat 3x12/leg', 'Pike Push-Ups 3x10', 'Superman Hold 3x30 sec', 'Step-Ups 3x15/leg', 'Mountain Climbers 3x20', 'Bicycle Crunches 3x20'],
      },
      {
        name: 'Full Body C',
        exercises: ['Jump Squats 3x15', 'Incline Push-Ups 3x12', 'Glute Bridges 3x20', 'Wall Sit 3x45 sec', 'Leg Raises 3x15', 'Plank 3x45 sec'],
      },
    ],
  },
  4: {
    label: 'Upper/Lower',
    days: [
      { name: 'Upper A', exercises: ['Push-Ups 4x10', 'Pike Push-Ups 4x10', 'Chair Dips 3x15', 'Superman Hold 4x30 sec', 'Plank 3x45 sec'] },
      { name: 'Lower A', exercises: ['Squat 4x15', 'Reverse Lunge 4x12', 'Glute Bridge 4x15', 'Calf Raise 4x20', 'Wall Sit 3x60 sec'] },
      { name: 'Upper B', exercises: ['Incline Push-Up 4x12', 'Shoulder Taps 4x20', 'Chair Dips 4x15', 'Superman Pulls 4x15', 'Side Plank 3x30 sec'] },
      {
        name: 'Lower B',
        exercises: ['Bulgarian Split Squat 4x12', 'Jump Squat 4x15', 'Single Leg Glute Bridge 4x12', 'Calf Raise 4x20', 'Leg Raises 4x15'],
      },
    ],
  },
  5: {
    label: 'one focus a day',
    days: [
      { name: 'Chest & Triceps', exercises: ['Push-Ups 4x12', 'Incline Push-Ups 4x15', 'Chair Dips 4x15', 'Diamond Push-Ups 3x10'] },
      { name: 'Legs', exercises: ['Squat 4x20', 'Reverse Lunge 4x15', 'Bulgarian Split Squat 4x12', 'Wall Sit 3x60 sec'] },
      { name: 'Back & Core', exercises: ['Superman Hold 4x30 sec', 'Superman Pull 4x15', 'Bird Dog 4x15', 'Plank 4x45 sec', 'Leg Raise 4x15'] },
      { name: 'Shoulders', exercises: ['Pike Push-Up 4x10', 'Shoulder Taps 4x20', 'Arm Circles 4x30 sec', 'Wall Walk 3x8'] },
      {
        name: 'Full Body Conditioning',
        exercises: ['Jump Squats 4x15', 'Burpees 4x10', 'Mountain Climbers 4x30', 'High Knees 4x30 sec', 'Plank 4x60 sec'],
      },
    ],
  },
  6: {
    label: 'Push/Pull/Legs, twice through the week',
    days: [
      { name: 'Push Day A', exercises: ['Push-Ups 4x12', 'Decline Push-Ups 4x10', 'Chair Dips 4x15', 'Pike Push-Ups 4x10'] },
      { name: 'Pull Day A', exercises: ['Superman Hold 4x30 sec', 'Superman Pulls 4x15', 'Reverse Snow Angels 4x15', 'Bird Dog 4x15'] },
      { name: 'Leg Day A', exercises: ['Squat 4x20', 'Bulgarian Split Squat 4x12', 'Glute Bridge 4x20', 'Calf Raise 4x25'] },
      { name: 'Push Day B', exercises: ['Diamond Push-Ups 4x10', 'Incline Push-Ups 4x15', 'Chair Dips 4x15', 'Pike Push-Ups 4x12'] },
      { name: 'Pull Day B', exercises: ['Superman Hold 4x45 sec', 'Reverse Snow Angels 4x20', 'Bird Dog 4x20', 'Plank 4x60 sec'] },
      { name: 'Leg Day B', exercises: ['Jump Squats 4x15', 'Walking Lunges 4x20', 'Single Leg Glute Bridge 4x15', 'Calf Raise 4x25'] },
    ],
  },
}

/** Template name (lowercase, letters and digits only) -> the library exercise that is shown. */
export const HOME_SLOTS: Record<string, string> = {
  'bodyweight squats': 'Bodyweight Squat',
  squat: 'Bodyweight Squat',
  'push ups': 'Push-Up',
  'glute bridges': 'Glute Bridge',
  'glute bridge': 'Glute Bridge',
  'reverse lunges': 'Reverse Lunge',
  'reverse lunge': 'Reverse Lunge',
  plank: 'Plank',
  'jumping jacks': 'Jumping Jacks',
  'bulgarian split squat': 'Bulgarian Split Squat',
  'pike push ups': 'Pike Push-Up',
  'pike push up': 'Pike Push-Up',
  'superman hold': 'Superman',
  'step ups': 'Step-Up',
  'mountain climbers': 'Mountain Climber',
  'bicycle crunches': 'Bicycle Crunch',
  'jump squats': 'Jump Squat',
  'jump squat': 'Jump Squat',
  'incline push ups': 'Incline Push-Up',
  'incline push up': 'Incline Push-Up',
  'wall sit': 'Wall Sit',
  'leg raises': 'Lying Leg Raise',
  'leg raise': 'Lying Leg Raise',
  'chair dips': 'Bench Dip',
  'shoulder taps': 'Plank Shoulder Taps',
  'superman pulls': 'Superman Pull',
  'superman pull': 'Superman Pull',
  'calf raise': 'Standing Calf Raise',
  'single leg glute bridge': 'Single-Leg Glute Bridge',
  'diamond push ups': 'Diamond Push-Up',
  'bird dog': 'Bird Dog Raise',
  'arm circles': 'Arm Circles',
  'wall walk': 'Wall Walk',
  burpees: 'Burpee',
  'high knees': 'High Knees',
  'decline push ups': 'Decline Push-Up',
  'reverse snow angels': 'Reverse Snow Angel',
  'walking lunges': 'Walking Lunge',
  'side plank': 'Elbow Side Plank',
}

/** Every exercise the home program can show (some have only a YouTube video, no animation yet). */
export const HOME_PROGRAM_NAMES = new Set(Object.values(HOME_SLOTS))

const LEVELS = {
  beginner: {
    sets: 2,
    rest: '60-90 sec',
    plan: 'Weeks 1-2: 2 sets. Weeks 3-4: 3 sets. Weeks 5-8: 4 sets.',
  },
  intermediate: {
    sets: 4,
    rest: '60 sec',
    plan: '4 sets, a slow 3-second lowering phase on every rep, and a shorter 60-second rest.',
  },
  advanced: {
    sets: 5,
    rest: '45-60 sec',
    plan: '5 sets. Make each move harder: wear a backpack with weight, add a resistance band, or move to a harder variation.',
  },
} as const

type HomeLevel = keyof typeof LEVELS

export function homeLevelFor(experience: string): HomeLevel {
  return experience === '0-1' ? 'beginner' : experience === '5+' ? 'advanced' : 'intermediate'
}

/** How the owner wants each level explained in the program. */
export function homeProgressionText(level: HomeLevel): string {
  if (level === 'beginner') {
    return 'Beginner progression: weeks 1-2 do 2 sets of each exercise, weeks 3-4 do 3 sets, and weeks 5-8 do 4 sets. Add reps or time once a set feels easy.'
  }
  if (level === 'intermediate') {
    return 'Intermediate progression: 4 sets of each exercise, lower slowly for 3 seconds on every rep, and keep rest to 60 seconds.'
  }
  return 'Advanced progression: 5 sets. Add backpack weight or resistance bands, and move up to harder variations: Push-Up, Decline Push-Up, Archer Push-Up, One-Arm Push-Up. Squat, Jump Squat, Pistol Squat. Glute Bridge, Single-Leg Bridge, Hip Thrust.'
}

const LADDER: Record<string, string> = {
  'Push-Up': 'Harder versions: Decline Push-Up, then Archer Push-Up, then One-Arm Push-Up.',
  'Bodyweight Squat': 'Harder versions: Jump Squat, then Pistol Squat.',
  'Glute Bridge': 'Harder versions: Single-Leg Bridge, then Hip Thrust.',
}

function parseLine(line: string): { name: string; sets: number; amount: number; unit: 'reps' | 'sec' | 'leg' } {
  const m = line.match(/^(.*?)\s+(\d+)x(\d+)(\/leg| sec)?$/)
  if (!m) throw new Error(`Cannot read home program line: ${line}`)
  return { name: m[1].trim(), sets: Number(m[2]), amount: Number(m[3]), unit: m[4] === '/leg' ? 'leg' : m[4] ? 'sec' : 'reps' }
}

const key = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export function buildHomeDays(
  answers: IntakeAnswers,
  tier: { targetRIR: string },
  volume: number,
): { days: ProgramDay[]; label: string; key: string } | null {
  if (normalizeEquipment(answers.equipment) !== 'calisthenics') return null
  const template = HOME_TEMPLATES[answers.trainingDays]
  if (!template) return null
  const level = homeLevelFor(answers.experience)
  const { sets: levelSets, rest, plan } = LEVELS[level]
  const byName = new Map(EXERCISES.map((e) => [e.name, e]))
  const homePool = [...HOME_PROGRAM_NAMES].map((n) => byName.get(n)).filter((e): e is LibraryExercise => !!e)

  const days: ProgramDay[] = []
  for (const [i, day] of template.days.entries()) {
    const used = new Set<string>()
    const rows: { ex: LibraryExercise; amount: number; unit: 'reps' | 'sec' | 'leg' }[] = []
    for (const line of day.exercises) {
      const parsed = parseLine(line)
      const libName = HOME_SLOTS[key(parsed.name)]
      let ex = libName ? byName.get(libName) : undefined
      if (!ex) throw new Error(`Home program exercise missing from the library: ${parsed.name}`)
      if (!injuryAllows(ex, answers.injuries)) {
        // An injury rules it out: use another home move for the same muscle (same movement first)
        const wanted = ex
        const options = homePool.filter(
          (e) => e.muscle[0] === wanted.muscle[0] && !used.has(e.name) && injuryAllows(e, answers.injuries),
        )
        ex = options.find((e) => e.subgroup === wanted.subgroup) ?? options[0]
        if (!ex) continue
      }
      if (used.has(ex.name)) continue
      used.add(ex.name)
      rows.push({ ex, amount: parsed.amount, unit: parsed.unit })
    }
    if (rows.length < 3) return null

    const muscles = [...new Set(rows.map((r) => r.ex.muscle[0]))] as FocusArea[]
    const exercises: Exercise[] = rows.map((row, n) => {
      const { ex, amount, unit } = row
      const timed = unit === 'sec'
      const pace = ex.subgroup === 'cardio' || ex.muscle[0] === 'full-body'
      const sets = Math.max(2, levelSets >= 3 && volume < 1 ? Math.round(levelSets * volume) : levelSets)
      const notes: string[] = []
      if (timed) notes.push('Hold steady, keep breathing, and stop the set if your form breaks down.')
      else if (pace) notes.push('Keep a steady, fast pace and good form for every rep.')
      else notes.push(`Controlled tempo and full range of motion, ${tier.targetRIR}.`)
      if (level === 'intermediate' && !timed && !pace) notes.push('Take 3 seconds to lower (slow negative).')
      if (level === 'advanced') {
        notes.push('Add backpack weight, a resistance band or a harder variation.')
        if (LADDER[ex.name]) notes.push(LADDER[ex.name])
      }
      if (level === 'beginner' && n === 0) notes.push(plan)
      if (ex.name === 'Bench Dip') notes.push('Use a sturdy chair or bench.')
      return {
        name: ex.name,
        sets,
        reps: timed ? `${amount} sec` : String(amount),
        rest: timed ? '45-60 sec' : rest,
        notes: notes.join(' '),
        format: 'strength' as const,
        ...(unit === 'leg' ? { eachSide: true } : {}),
      }
    })
    days.push({
      day: i + 1,
      name: day.name,
      focus: muscles.map((m) => m.replace('-', ' ')).join(' / '),
      duration: exercises.length > 5 ? '45-55 min' : '35-45 min',
      exercises,
    })
  }
  return { days, label: template.label, key: `${level}-home-${answers.trainingDays}` }
}
