import type { Equipment, FocusArea } from '../types'
import type { LibraryExercise } from './exerciseLibrary'

// More strength exercises, added so every muscle has real choice for every kind of equipment. Without
// them a person with only bands (or dumbbells, or a shoulder injury) could end up with one option for a
// whole muscle group, which makes a "focus area" almost meaningless.
//
// `safe` lists the injuries a move is generally gentle enough for. It is conservative: with an injury
// selected, a move is only offered if it is tagged safe for it.

type Joint = 'knee' | 'shoulder' | 'lower-back'
const ALL: Joint[] = ['knee', 'shoulder', 'lower-back']

const GYM: Equipment = 'full-gym'
const DB: Equipment = 'dumbbells-only'
const HOME: Equipment = 'home-workout'
const CAL: Equipment = 'calisthenics'
const BAND: Equipment = 'resistance-bands'

// Movements that need nothing but your body (and floor space).
const BODYWEIGHT: Equipment[] = [HOME, CAL, BAND, DB]
const GYM_DB: Equipment[] = [GYM, DB]
const BAND_HOME: Equipment[] = [BAND, HOME]

type Row = [
  name: string,
  equipment: Equipment[],
  muscle: FocusArea[],
  compound: boolean,
  safe: Joint[],
  subgroup: string,
  hold?: boolean,
]

const ROWS: Row[] = [
  // ---- Chest ----
  ['Dumbbell Floor Press', GYM_DB, ['chest', 'arms'], true, ALL, 'press'],
  ['Dumbbell Fly', GYM_DB, ['chest'], false, ['knee', 'lower-back'], 'fly'],
  ['Incline Dumbbell Fly', GYM_DB, ['chest'], false, ['knee', 'lower-back'], 'fly'],
  ['Dumbbell Squeeze Press', GYM_DB, ['chest', 'arms'], false, ALL, 'press'],
  ['Dumbbell Pullover', GYM_DB, ['chest', 'back'], true, ['knee'], 'pullover'],
  ['Pec Deck Machine', [GYM], ['chest'], false, ['knee', 'lower-back'], 'fly'],
  ['Cable Crossover', [GYM], ['chest'], false, ['knee', 'lower-back'], 'fly'],
  ['Incline Barbell Bench Press', [GYM], ['chest', 'shoulders'], true, ['knee', 'lower-back'], 'press'],
  ['Smith Machine Bench Press', [GYM], ['chest'], true, ['knee', 'lower-back'], 'press'],
  ['Decline Push-Up', [...BODYWEIGHT, GYM], ['chest', 'shoulders'], true, ['knee'], 'press'],
  ['Incline Push-Up', [...BODYWEIGHT, GYM], ['chest'], true, ['knee', 'lower-back'], 'press'],
  ['Knee Push-Up', BODYWEIGHT, ['chest'], true, ['lower-back'], 'press'],
  ['Wide Push-Up', [...BODYWEIGHT, GYM], ['chest'], true, ['knee', 'lower-back'], 'press'],
  ['Hindu Push-Up', BODYWEIGHT, ['chest', 'shoulders'], true, ['knee'], 'press'],
  ['Archer Push-Up', BODYWEIGHT, ['chest'], true, ['knee'], 'press'],
  ['Chest Dip', [CAL, GYM], ['chest', 'arms'], true, ['knee', 'lower-back'], 'press'],
  ['Band Chest Fly', BAND_HOME, ['chest'], false, ['knee', 'lower-back'], 'fly'],
  ['Band Incline Press', BAND_HOME, ['chest', 'shoulders'], false, ['knee', 'lower-back'], 'press'],
  ['Banded Push-Up', [BAND], ['chest', 'arms'], true, ['knee', 'lower-back'], 'press'],
  ['Band Low-to-High Fly', [BAND], ['chest', 'shoulders'], false, ['knee', 'lower-back'], 'fly'],

  // ---- Back ----
  ['Chest-Supported Dumbbell Row', GYM_DB, ['back'], true, ALL, 'horizontal-pull'],
  ['Dumbbell Reverse Fly', GYM_DB, ['back', 'shoulders'], false, ['knee', 'lower-back'], 'rear'],
  ['Dumbbell Shrug', GYM_DB, ['back', 'shoulders'], false, ['knee', 'lower-back'], 'shrug'],
  ['Renegade Row', GYM_DB, ['back', 'core'], true, ['knee'], 'horizontal-pull'],
  ['Single-Arm Cable Row', [GYM], ['back'], true, ['knee', 'lower-back'], 'horizontal-pull'],
  ['Straight-Arm Pulldown', [GYM], ['back'], false, ['knee', 'lower-back'], 'vertical-pull'],
  ['T-Bar Row', [GYM], ['back'], true, ['knee'], 'horizontal-pull'],
  ['Chest-Supported Machine Row', [GYM], ['back'], true, ALL, 'horizontal-pull'],
  ['Assisted Pull-Up Machine', [GYM], ['back'], true, ['knee', 'lower-back'], 'vertical-pull'],
  ['Cable Face Pull', [GYM], ['shoulders', 'back'], false, ALL, 'rear'],
  ['Chin-Up', [CAL, HOME, GYM], ['back', 'arms'], true, ['knee', 'lower-back'], 'vertical-pull'],
  ['Back Extension (45 Degree)', [GYM], ['back', 'glutes'], false, ['knee', 'shoulder'], 'back-extension'],
  ['Superman', BODYWEIGHT, ['back', 'glutes'], false, ['knee', 'shoulder'], 'back-extension'],
  ['Prone Y-T-W Raise', BODYWEIGHT, ['back', 'shoulders'], false, ['knee', 'lower-back'], 'rear'],
  ['Reverse Snow Angel', BODYWEIGHT, ['back', 'shoulders'], false, ['knee', 'lower-back'], 'rear'],
  ['Band Pull-Apart', [...BAND_HOME, GYM, DB], ['back', 'shoulders'], false, ALL, 'rear'],
  ['Band Lat Pulldown', BAND_HOME, ['back'], true, ['knee', 'lower-back'], 'vertical-pull'],
  ['Band Straight-Arm Pulldown', BAND_HOME, ['back'], false, ['knee', 'lower-back'], 'vertical-pull'],
  ['Band Single-Arm Row', BAND_HOME, ['back'], true, ['knee', 'lower-back'], 'horizontal-pull'],
  ['Band Bent-Over Row', [BAND], ['back'], true, ['knee'], 'horizontal-pull'],

  // ---- Shoulders ----
  ['Arnold Press', GYM_DB, ['shoulders'], true, ['knee', 'lower-back'], 'press'],
  ['Standing Dumbbell Shoulder Press', GYM_DB, ['shoulders'], true, ['knee'], 'press'],
  ['Dumbbell Front Raise', GYM_DB, ['shoulders'], false, ['knee', 'lower-back'], 'front'],
  ['Cable Lateral Raise', [GYM], ['shoulders'], false, ['knee', 'lower-back'], 'lateral'],
  ['Machine Lateral Raise', [GYM], ['shoulders'], false, ['knee', 'lower-back'], 'lateral'],
  ['Reverse Pec Deck', [GYM], ['shoulders', 'back'], false, ['knee', 'lower-back'], 'rear'],
  ['Landmine Press', [GYM], ['shoulders', 'chest'], true, ['knee', 'shoulder'], 'press'],
  ['Elevated Pike Push-Up', BODYWEIGHT, ['shoulders'], true, ['knee', 'lower-back'], 'press'],
  ['Plank Shoulder Taps', [...BODYWEIGHT, GYM], ['shoulders', 'core'], false, ['knee', 'lower-back'], 'stability'],
  ['Wall Slide', [...BODYWEIGHT, GYM], ['shoulders'], false, ALL, 'rear'],
  ['Arm Circles', [...BODYWEIGHT, GYM], ['shoulders'], false, ['knee', 'lower-back'], 'lateral'],
  ['Dumbbell External Rotation', GYM_DB, ['shoulders'], false, ALL, 'rear'],
  ['Band External Rotation', [...BAND_HOME, GYM], ['shoulders'], false, ALL, 'rear'],
  ['Band Overhead Press', BAND_HOME, ['shoulders'], true, ['knee', 'lower-back'], 'press'],
  ['Band Lateral Raise', BAND_HOME, ['shoulders'], false, ['knee', 'lower-back'], 'lateral'],
  ['Band Front Raise', BAND_HOME, ['shoulders'], false, ['knee', 'lower-back'], 'front'],
  ['Band Reverse Fly', BAND_HOME, ['shoulders', 'back'], false, ['knee', 'lower-back'], 'rear'],

  // ---- Arms ----
  ['Hammer Curl', GYM_DB, ['arms'], false, ALL, 'biceps'],
  ['Incline Dumbbell Curl', GYM_DB, ['arms'], false, ['knee', 'lower-back'], 'biceps'],
  ['Concentration Curl', GYM_DB, ['arms'], false, ALL, 'biceps'],
  ['Preacher Curl', [GYM], ['arms'], false, ALL, 'biceps'],
  ['Cable Curl', [GYM], ['arms'], false, ALL, 'biceps'],
  ['Overhead Dumbbell Triceps Extension', GYM_DB, ['arms'], false, ['knee', 'lower-back'], 'triceps'],
  ['Dumbbell Skull Crusher', GYM_DB, ['arms'], false, ['knee', 'lower-back'], 'triceps'],
  ['Dumbbell Triceps Kickback', GYM_DB, ['arms'], false, ['knee', 'shoulder'], 'triceps'],
  ['Overhead Cable Triceps Extension', [GYM], ['arms'], false, ['knee', 'lower-back'], 'triceps'],
  ['Bench Dip', [...BODYWEIGHT, GYM], ['arms'], true, ['knee', 'lower-back'], 'triceps'],
  ['Close-Grip Push-Up', [...BODYWEIGHT, GYM], ['arms', 'chest'], true, ['knee', 'lower-back'], 'triceps'],
  ['Bodyweight Triceps Extension', [HOME, CAL], ['arms'], false, ['knee', 'lower-back'], 'triceps'],
  ['Underhand Inverted Row', [CAL, HOME], ['arms', 'back'], true, ['knee', 'lower-back'], 'biceps'],
  ['Isometric Towel Curl', [CAL, HOME], ['arms'], false, ALL, 'biceps'],
  ['Band Hammer Curl', BAND_HOME, ['arms'], false, ALL, 'biceps'],
  ['Band Triceps Pushdown', BAND_HOME, ['arms'], false, ALL, 'triceps'],
  ['Band Overhead Triceps Extension', BAND_HOME, ['arms'], false, ['knee', 'lower-back'], 'triceps'],
  ['Band Triceps Kickback', BAND_HOME, ['arms'], false, ['knee', 'shoulder'], 'triceps'],
  ['Band Reverse Curl', BAND_HOME, ['arms'], false, ALL, 'biceps'],

  // ---- Legs ----
  ['Dumbbell Step-Up', GYM_DB, ['legs', 'glutes'], true, ['shoulder', 'lower-back'], 'quad-compound'],
  ['Step-Up', [...BODYWEIGHT, GYM], ['legs', 'glutes'], true, ['shoulder', 'lower-back'], 'quad-compound'],
  ['Dumbbell Reverse Lunge', GYM_DB, ['legs', 'glutes'], true, ['shoulder', 'lower-back'], 'quad-compound'],
  ['Reverse Lunge', [...BODYWEIGHT, GYM], ['legs', 'glutes'], true, ['shoulder', 'lower-back'], 'quad-compound'],
  ['Lateral Lunge', [...BODYWEIGHT, GYM], ['legs', 'glutes'], true, ['shoulder', 'lower-back'], 'quad-compound'],
  ['Dumbbell Sumo Squat', GYM_DB, ['legs', 'glutes'], true, ['shoulder', 'lower-back'], 'quad-compound'],
  ['Sumo Squat', [...BODYWEIGHT, GYM], ['legs', 'glutes'], true, ['shoulder', 'lower-back'], 'quad-compound'],
  ['Dumbbell Calf Raise', GYM_DB, ['legs'], false, ALL, 'calf'],
  ['Standing Calf Raise', [...BODYWEIGHT, GYM], ['legs'], false, ALL, 'calf'],
  ['Seated Calf Raise', [GYM], ['legs'], false, ALL, 'calf'],
  ['Single-Leg Dumbbell Romanian Deadlift', GYM_DB, ['legs', 'glutes', 'back'], true, ['knee', 'shoulder'], 'hinge'],
  ['Single-Leg Romanian Deadlift', BODYWEIGHT, ['legs', 'glutes'], true, ['knee', 'shoulder'], 'hinge'],
  ['Hamstring Walkout', BODYWEIGHT, ['legs'], false, ['shoulder'], 'hamstring-isolation'],
  ['Wall Sit', [...BODYWEIGHT, GYM], ['legs'], false, ['shoulder', 'lower-back'], 'quad-isolation', true],
  ['Jump Squat', BODYWEIGHT, ['legs', 'glutes'], true, [], 'quad-compound'],
  ['Band Lunge', [BAND], ['legs', 'glutes'], true, ['shoulder', 'lower-back'], 'quad-compound'],
  ['Band Leg Curl', [BAND], ['legs'], false, ALL, 'hamstring-isolation'],
  ['Band Leg Extension', [BAND], ['legs'], false, ['shoulder', 'lower-back'], 'quad-isolation'],
  ['Band Romanian Deadlift', [BAND], ['legs', 'glutes', 'back'], true, ['knee', 'shoulder'], 'hinge'],
  ['Band Calf Raise', [BAND], ['legs'], false, ALL, 'calf'],
  ['Hip Adduction Machine', [GYM], ['legs'], false, ALL, 'adduction'],
  ['Hack Squat', [GYM], ['legs'], true, ['shoulder', 'lower-back'], 'quad-compound'],

  // ---- Glutes ----
  ['Glute Bridge', [...BODYWEIGHT, GYM], ['glutes'], false, ALL, 'hip-thrust'],
  ['Single-Leg Glute Bridge', [...BODYWEIGHT, GYM], ['glutes'], false, ['shoulder', 'lower-back'], 'hip-thrust'],
  ['Elevated Glute Bridge (Couch Hip Thrust)', [...BODYWEIGHT, GYM], ['glutes'], true, ALL, 'hip-thrust'],
  ['Frog Pump', [...BODYWEIGHT, GYM], ['glutes'], false, ['shoulder', 'lower-back'], 'hip-thrust'],
  ['Dumbbell Glute Bridge', GYM_DB, ['glutes'], true, ALL, 'hip-thrust'],
  ['Donkey Kick', [...BODYWEIGHT, GYM], ['glutes'], false, ['lower-back'], 'kickback'],
  ['Fire Hydrant', [...BODYWEIGHT, GYM], ['glutes'], false, ['lower-back'], 'abduction'],
  ['Curtsy Lunge', [...BODYWEIGHT, GYM], ['glutes', 'legs'], true, ['shoulder', 'lower-back'], 'quad-compound'],
  ['Dumbbell Curtsy Lunge', GYM_DB, ['glutes', 'legs'], true, ['shoulder', 'lower-back'], 'quad-compound'],
  ['Side-Lying Hip Abduction', [...BODYWEIGHT, GYM], ['glutes'], false, ALL, 'abduction'],
  ['Banded Clamshell', BAND_HOME, ['glutes'], false, ALL, 'abduction'],
  ['Banded Lateral Walk', [...BAND_HOME, GYM], ['glutes', 'legs'], false, ['shoulder', 'lower-back'], 'abduction'],
  ['Band Hip Thrust', BAND_HOME, ['glutes'], true, ALL, 'hip-thrust'],
  ['Band Kickback', BAND_HOME, ['glutes'], false, ['shoulder', 'lower-back'], 'kickback'],
  ['Band Pull-Through', BAND_HOME, ['glutes', 'legs'], true, ['knee', 'shoulder'], 'hinge'],
  ['Hip Abduction Machine', [GYM], ['glutes'], false, ALL, 'abduction'],
  ['Smith Machine Hip Thrust', [GYM], ['glutes'], true, ['knee'], 'hip-thrust'],
  ['Cable Pull-Through', [GYM], ['glutes', 'legs', 'back'], true, ['knee', 'shoulder'], 'hinge'],

  // ---- Core ----
  ['Bicycle Crunch', [GYM, DB, HOME, CAL, BAND], ['core'], false, ['knee', 'shoulder'], 'flexion'],
  ['Russian Twist', [GYM, DB, HOME, CAL, BAND], ['core'], false, ['knee', 'shoulder'], 'rotation'],
  ['Lying Leg Raise', [GYM, DB, HOME, CAL, BAND], ['core'], false, ['knee', 'shoulder'], 'flexion'],
  ['Reverse Crunch', [GYM, DB, HOME, CAL, BAND], ['core'], false, ALL, 'flexion'],
  ['Flutter Kicks', [GYM, DB, HOME, CAL, BAND], ['core'], false, ['knee', 'shoulder'], 'flexion'],
  ['Elbow Side Plank', [GYM, DB, HOME, CAL, BAND], ['core'], false, ['knee', 'lower-back'], 'lateral-core', true],
  ['Hollow Body Hold', [HOME, CAL, BAND], ['core'], false, ['knee', 'shoulder'], 'anti-extension', true],
  ['Dumbbell Side Bend', GYM_DB, ['core'], false, ['knee', 'shoulder'], 'lateral-core'],
  ['Cable Crunch', [GYM], ['core'], false, ['knee', 'shoulder'], 'flexion'],
  ['Decline Sit-Up', [GYM], ['core'], false, ['knee', 'shoulder'], 'flexion'],
  ["Captain's Chair Leg Raise", [GYM], ['core'], false, ['knee', 'lower-back'], 'flexion'],
  ['Band Woodchopper', BAND_HOME, ['core'], false, ['knee', 'shoulder'], 'rotation'],
  ['Band Crunch', [BAND], ['core'], false, ALL, 'flexion'],

  // ---- Full body / conditioning ----
  ['Bear Crawl', BODYWEIGHT, ['full-body', 'shoulders', 'core'], true, ['lower-back'], 'crawl'],
  ['Inchworm', [...BODYWEIGHT, GYM], ['full-body', 'core'], true, ['knee'], 'crawl'],
  ['Squat to Overhead Reach', [...BODYWEIGHT, GYM], ['full-body'], true, ['shoulder', 'lower-back'], 'flow'],
  ['Step Jacks', [...BODYWEIGHT, GYM], ['full-body'], true, ALL, 'cardio'],
  ['Dumbbell Thruster', GYM_DB, ['full-body', 'legs', 'shoulders'], true, [], 'thruster'],
  ['Band Squat to Row', [BAND], ['full-body', 'legs', 'back'], true, [], 'thruster'],
  ['Sled Push', [GYM], ['full-body', 'legs'], true, ['shoulder'], 'push'],
  ['Battle Rope Waves', [GYM], ['full-body', 'shoulders'], true, ['knee', 'lower-back'], 'cardio'],
]

export const STRENGTH_EXTRAS: LibraryExercise[] = ROWS.map(([name, equipment, muscle, compound, safe, subgroup, hold]) => ({
  name,
  equipment: [...new Set(equipment)],
  muscle,
  compound,
  lowImpactSafe: safe,
  subgroup,
  ...(hold ? { holdBased: true } : {}),
}))
