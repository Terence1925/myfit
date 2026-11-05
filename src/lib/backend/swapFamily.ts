import type { LibraryExercise } from './exerciseLibrary'

/**
 * The kind of movement an exercise is, so Swap only offers something that feels like the same exercise
 * (a row for a row, a curl for a curl). The library's own `subgroup` tags come from several sources and say the same
 * thing in different words ("pull-up" and "vertical-pull", "row" and "horizontal-pull"), and a few are wrong
 * (a calf raise tagged "press"), so the name is read first and the tag only after that.
 */
export function swapFamily(ex: LibraryExercise): string {
  const name = ex.name.toLowerCase()
  const muscle = ex.muscle[0]
  const tag = ex.subgroup ?? ''

  // Legs and glutes share a few movements (hinges, squats and lunges), so they are named by the movement
  if (/calf/.test(name)) return 'calf'
  if (/leg curl|hamstring curl|hamstring walkout|nordic/.test(name)) return 'hamstring-curl'
  if (/leg extension|wall sit|sissy/.test(name)) return 'quad-extension'
  if (/adduct/.test(name)) return 'hip-adduction'
  if (/abduct|clamshell|hydrant|lateral walk|side-lying leg|side kick|standing side leg|rear kick/.test(name)) return 'hip-abduction'
  if (/romanian|stiff.leg|deadlift|good morning|pull-through|hip hinge/.test(name) || tag === 'hinge') return 'hinge'
  if (/squat|lunge|leg press|step-up|split squat|curtsy|thruster/.test(name) || tag === 'quad-compound') return 'squat-lunge'
  if (/hip thrust|glute bridge|frog pump|bridge|pelvic curl|hip lift/.test(name) || tag === 'hip-thrust') return 'bridge'
  if (/kickback|donkey kick|kick/.test(name) || tag === 'kickback') return 'kickback'
  if (/hyperextension|back extension|reverse hyper|superman/.test(name) || tag === 'back-extension') return 'back-extension'

  // Shoulders
  if (muscle === 'shoulders' || muscle === 'back') {
    if (/face pull|rear|reverse fly|reverse pec|pull-apart|external rotation|y-t-w|snow angel|wall slide/.test(name)) return 'rear-delt'
    if (/front raise/.test(name)) return 'front-delt'
    if (/lateral raise|arm circle/.test(name)) return 'lateral-delt'
    if (/upright row/.test(name)) return 'upright-row'
    if (/shrug/.test(name)) return 'shrug'
  }

  // Back pulls
  if (/pull-up|chin-up|pulldown|pull-down|lat pull/.test(name) || tag === 'vertical-pull' || tag === 'pull-up' || tag === 'pulldown') return 'vertical-pull'
  if (/\brow\b/.test(name) || tag === 'horizontal-pull' || tag === 'row') return 'row'

  // Presses and flies
  if (muscle === 'chest') {
    if (/fly|crossover|pec deck/.test(name) || tag === 'fly') return 'chest-fly'
    if (/pullover/.test(name)) return 'pullover'
    return 'chest-press'
  }
  if (muscle === 'shoulders') {
    if (/press|pike|arnold|landmine/.test(name) || tag === 'press') return 'shoulder-press'
    return `shoulders:${tag || 'other'}`
  }

  // Arms: the muscle is in the tag
  if (muscle === 'arms') return `arms:${tag || (/curl/.test(name) ? 'biceps' : /extension|pushdown|dip|kickback|skull|press/.test(name) ? 'triceps' : 'other')}`

  // Core
  if (muscle === 'core') {
    if (['flexion', 'crunch', 'rectus-abdominis', 'abs', 'abdominals'].includes(tag) || /crunch|sit-up|leg raise|v-up|jackknife/.test(name)) return 'core-crunch'
    if (['rotation', 'twist'].includes(tag) || /twist|woodchop/.test(name)) return 'core-twist'
    if (['obliques', 'lateral-core'].includes(tag) || /side bend|side plank/.test(name)) return 'core-side'
    if (tag === 'anti-rotation' || /pallof/.test(name)) return 'core-anti-rotation'
    return 'core-plank'
  }

  return `${muscle}:${tag || 'other'}`
}

/** What the screens say when Swap has nothing similar to offer. */
export const NO_SWAP_MESSAGE = 'No similar exercise is available for your equipment. Tap Custom to add your own.'

/**
 * When nothing in the same family fits (the equipment or an injury rules the rest out), these are close enough to offer.
 * Anything not listed gets no swap: a message is better than an exercise that has nothing to do with the original.
 */
export const RELATED_FAMILIES: Record<string, string[]> = {
  'quad-extension': ['squat-lunge'],
  'squat-lunge': ['quad-extension'],
  'bridge': ['hinge', 'kickback'],
  'hinge': ['hamstring-curl', 'bridge'],
  'hamstring-curl': ['hinge', 'bridge'],
  'back-extension': ['bridge', 'hinge'],
  'core-plank': ['core-anti-rotation', 'core-side', 'core-crunch'],
  'core-crunch': ['core-twist', 'core-side', 'core-plank'],
  'core-anti-rotation': ['core-plank', 'core-side'],
  'kickback': ['hip-abduction'],
  'hip-abduction': ['kickback'],
  'row': ['vertical-pull'],
  'vertical-pull': ['row'],
  'chest-fly': ['chest-press'],
  'rear-delt': ['lateral-delt'],
  'lateral-delt': ['rear-delt', 'front-delt'],
  'front-delt': ['lateral-delt'],
  'core-twist': ['core-side'],
  'core-side': ['core-twist'],
}
