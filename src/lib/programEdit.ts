import type { Exercise, ProgramData } from './types'

/** The program with one exercise replaced (the day number and the position in that day pick which). */
export function withExercise(data: ProgramData, dayNumber: number, index: number, exercise: Exercise): ProgramData {
  return {
    ...data,
    days: data.days.map((d) => (d.day === dayNumber ? { ...d, exercises: d.exercises.map((e, i) => (i === index ? exercise : e)) } : d)),
  }
}
