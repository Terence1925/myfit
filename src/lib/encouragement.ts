// Short, plain messages for the Today card. Picks are steady for a given day (no flicker on every re-render).

export type DayPart = 'morning' | 'afternoon' | 'evening'

export function dayPart(now: Date = new Date()): DayPart {
  const h = now.getHours()
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
}

/** "Good morning, Terence". */
export function greeting(name: string | undefined, now: Date = new Date()): string {
  const word = { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' }[dayPart(now)]
  return name ? `${word}, ${name}` : word
}

/** Shown on the Today card when there is nothing left this week. */
export function allDoneMessage(): string {
  return 'All workouts done this week.'
}
