// Run with: npm run test:block
// Checks the 12-week block: which week a program is in, when the deload week and the end come, and the wording.
import { BLOCK_DAYS, BLOCK_NOTE, BLOCK_WEEKS, COMPLETE_NOTE, DELOAD_ADVICE, TOTAL_WEEKS, blockEndsAt, blockStatus } from '../src/lib/programBlock'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

const start = new Date(2026, 0, 5, 12, 0, 0)
const after = (days: number, hours = 0) => new Date(start.getTime() + days * 86400000 + hours * 3600000)
const at = (days: number, hours = 0) => {
  const s = blockStatus(start, after(days, hours))
  return [s.week, s.phase, s.label]
}

check('constants', [BLOCK_WEEKS, TOTAL_WEEKS, BLOCK_DAYS], [12, 13, 91])
check('day 0 is week 1', at(0), [1, 'training', 'Week 1 of 12'])
check('day 6 is still week 1', at(6, 23), [1, 'training', 'Week 1 of 12'])
check('day 7 is week 2', at(7), [2, 'training', 'Week 2 of 12'])
check('week 11 is training', at(70), [11, 'training', 'Week 11 of 12'])
check('week 12 is the final week', at(77), [12, 'final', 'Final week'])
check('end of week 12 is still final', at(83, 23), [12, 'final', 'Final week'])
check('week 13 is the deload', at(84), [13, 'deload', 'Deload week'])
check('last hour of the program is still deload', at(90, 23), [13, 'deload', 'Deload week'])
check('exactly 91 days later it is complete', at(91), [13, 'complete', 'Complete'])
check('long after: complete', at(400), [13, 'complete', 'Complete'])
check('a clock set before the start is week 1', at(-3), [1, 'training', 'Week 1 of 12'])

check('days left at the start', blockStatus(start, after(0)).daysLeft, 91)
check('days left in the deload week', blockStatus(start, after(88)).daysLeft, 3)
check('days left once complete', blockStatus(start, after(120)).daysLeft, 0)
check('complete flag', [blockStatus(start, after(90)).complete, blockStatus(start, after(91)).complete], [false, true])
check('ends 13 weeks after the start', blockEndsAt(start).getTime() - start.getTime(), 91 * 86400000)
check('accepts a stored ISO date', blockStatus(start.toISOString(), after(14)).week, 3)

// The wording says what the owner asked for: 12 weeks, a deload, a new program
check('note mentions 12 weeks, a deload and a new program', /12 weeks/.test(BLOCK_NOTE) && /deload/i.test(BLOCK_NOTE) && /new program/i.test(BLOCK_NOTE), true)
check('deload advice names 40-60% and half the sets', /40-60%/.test(DELOAD_ADVICE) && /half the sets/.test(DELOAD_ADVICE), true)
check('complete note asks for a new program', /new program/i.test(COMPLETE_NOTE), true)

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: the 12-week block moves from training to the final week, the deload week and then complete on the right days.')
