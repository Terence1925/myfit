import { taglishOn } from './locale'

// Short, warm messages. Filipino people get a Taglish mix ("Kaya mo 'yan!"), everyone else plain English.
// Picks are steady for a given day (no flicker on every re-render) but change from day to day.

const pick = <T,>(list: T[], seed: number): T => list[Math.abs(seed) % list.length]
const daySeed = (now: Date) => now.getFullYear() * 400 + now.getMonth() * 31 + now.getDate()

export type DayPart = 'morning' | 'afternoon' | 'evening'

export function dayPart(now: Date = new Date()): DayPart {
  const h = now.getHours()
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
}

/** "Good morning, Terence" / "Magandang umaga, Terence". */
export function greeting(name: string | undefined, now: Date = new Date(), taglish = taglishOn()): string {
  const part = dayPart(now)
  const word = taglish
    ? { morning: 'Magandang umaga', afternoon: 'Magandang hapon', evening: 'Magandang gabi' }[part]
    : { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' }[part]
  return name ? `${word}, ${name}` : word
}

/** The line under the greeting. */
export function pepTalk(now: Date = new Date(), taglish = taglishOn()): string {
  const en = ['Small steps add up. Ready when you are.', 'Show up today. Your future self says thanks.', 'One workout at a time.', 'Consistency beats perfect.']
  const tl = ["Kaya mo 'yan! Simulan na natin.", 'Isang workout lang, malaking tulong na.', 'Konting sipag, malayo ang mararating.', 'Tuloy-tuloy lang, bawat araw ay panalo.']
  return pick(taglish ? tl : en, daySeed(now))
}

/** Shown on the Today card when there is nothing left this week. */
export function allDoneMessage(taglish = taglishOn()): string {
  return taglish ? 'Tapos na lahat ngayong linggo. Ang galing!' : 'Everything done this week. Amazing!'
}
