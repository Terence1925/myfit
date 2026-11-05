// Run with: npm run test:entry-date
// A weight entry saved for "Nov 5" must read Nov 5 on a phone anywhere, including the Americas (west of UTC).
process.env.TZ = 'America/New_York'
import { entryDate } from '../src/lib/entryDate'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

const saved = new Date('2026-11-05').toISOString() // what the Progress page stores for the picked day
// The mistake this guards against: reading that moment in New York time gives the day before.
const wrongInNewYork = new Date(saved).toLocaleDateString('en-US')
if (wrongInNewYork === '11/4/2026') {
  check('Nov 5 reads as Nov 5 in New York', entryDate(saved, 'en-US'), '11/5/2026')
} else {
  console.log('Note: this machine does not switch to New York time, so only the plain checks ran.')
}
check('Nov 5 reads as Nov 5 (any time zone)', entryDate(saved, 'en-US'), '11/5/2026')
check('the first of the year stays the first', entryDate('2027-01-01T00:00:00.000Z', 'en-US'), '1/1/2027')
check('a database timestamp with an offset works too', entryDate('2026-11-05T00:00:00+00:00', 'en-US'), '11/5/2026')

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: a weight entry keeps the day that was picked, also on phones west of UTC.')
