import type { ProgramData, ProgramDay } from './types'

// Programs saved by older versions of the app can be missing fields that newer screens read (a list of notes, the warm-up).
// Everything that loads a saved program passes it through here first, so a missing field becomes an empty list or text instead
// of crashing the screen.

const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
const text = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)

function dayWithDefaults(d: Partial<ProgramDay> | null | undefined, i: number): ProgramDay {
  return {
    day: typeof d?.day === 'number' ? d.day : i + 1,
    name: text(d?.name, `Day ${i + 1}`),
    focus: text(d?.focus),
    duration: text(d?.duration),
    exercises: list<ProgramDay['exercises'][number]>(d?.exercises).map((e) => ({
      ...e,
      name: text(e?.name, 'Exercise'),
      sets: typeof e?.sets === 'number' ? e.sets : 3,
      reps: text(e?.reps != null ? String(e.reps) : '', '10'),
      rest: text(e?.rest),
      notes: text(e?.notes),
    })),
  }
}

export function programDataWithDefaults(d: Partial<ProgramData> | null | undefined): ProgramData {
  const src = d ?? {}
  return {
    ...src,
    programName: text(src.programName, 'Your program'),
    tagline: text(src.tagline),
    overview: text(src.overview),
    personalizationNotes: list<string>(src.personalizationNotes),
    weeklyVolume: text(src.weeklyVolume),
    progressionStrategy: text(src.progressionStrategy),
    nutritionTips: list<string>(src.nutritionTips),
    recoveryAdvice: list<string>(src.recoveryAdvice),
    warmup: list<string>(src.warmup),
    cooldown: list<string>(src.cooldown),
    days: list<Partial<ProgramDay>>(src.days).map(dayWithDefaults),
  }
}
