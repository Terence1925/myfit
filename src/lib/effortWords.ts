// How hard to push a set, in plain words. A program's exercise notes keep a short "2 RIR" marker (reps left in reserve),
// so the week plan can change it week by week; what people read says how many reps to stop short of their limit.

const MARK = String.raw`(\d)(?:-(\d)|(\+))? RIR\b(?: on top sets| \([^)]*\))?`

function words(low: string, high?: string, plus?: string): string {
  if (plus) return `${low} or more reps`
  if (high) return `${low} to ${high} reps`
  return `about ${low} ${low === '1' ? 'rep' : 'reps'}`
}

/** Rewrites every RIR marker in a note ("Target 2 RIR.") as plain words ("Stop each set about 2 reps before you cannot do more."). */
export function plainEffort(note: string): string {
  return note
    .replace(new RegExp(`(reps left),\\s*${MARK}`, 'g'), '$1')
    .replace(new RegExp(`Target ${MARK}`, 'g'), (_m, low, high, plus) => `Stop each set ${words(low, high, plus)} before you cannot do more`)
    .replace(new RegExp(MARK, 'g'), (_m, low, high, plus) => `stop each set ${words(low, high, plus)} before you cannot do more`)
}

/** The effort line on the Recovery tab: a marker becomes a plain sentence, and text without one ("a gentle, easy effort") reads "Aim for ...". */
export function effortSentence(target: string): string {
  const out = plainEffort(`Target ${target}`)
  return out === `Target ${target}` ? `Aim for ${target}.` : `${out}.`
}
