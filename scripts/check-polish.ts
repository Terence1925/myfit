// Run with: npm run test:polish
// Checks the weekly ring text and the thousands separator.
import { formatLbs } from '../src/lib/lifted'
import { ringText } from '../src/lib/todayPlan'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

check('thousands separator', formatLbs(12400), '12,400')

// ring text
check('ring: none done', ringText(0, 3, 4), { title: '0 of 4 workouts this week', note: '3 more workouts keeps your streak going.' })
check('ring: one to go for the streak', ringText(2, 3, 4).note, '1 more workout keeps your streak going.')
check('ring: streak secured', ringText(3, 3, 4).note, 'Streak secured this week. 1 more for a perfect week.')
check('ring: perfect', ringText(4, 3, 4).note, 'Perfect week! Every workout done.')
check('ring: one planned day', ringText(0, 1, 1).title, '0 of 1 workout this week')

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: the weekly ring text and the thousands separator are right.')
