// Run with: npm run test:welcome-email
// Checks the welcome email text (sample data, nothing is sent).
import { buildWelcomeEmail } from '../supabase/functions/welcome-email/index'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

const mail = buildWelcomeEmail('Alex')
check('subject', mail.subject, 'Welcome to MyFit')
check('greets by name', mail.text.startsWith('Hi Alex,'), true)
check('says the food log is free and the plan stays readable', mail.text.includes('The food log with barcode scanning is free, and your plan stays readable'), true)
check('invites a reply for questions', mail.text.includes('reply to this email'), true)
check('paragraphs are separated by a blank line', mail.text.split('\n\n').length, 5)
check('html has one paragraph each', (mail.html.match(/<p /g) ?? []).length, 5)
check('no name falls back to "there"', buildWelcomeEmail(undefined).text.startsWith('Hi there,'), true)
check('a name cannot add html', buildWelcomeEmail('<b>Al</b>').html.includes('<b>Al</b>'), false)

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: the welcome email greets the member, says the food log is free and the plan stays readable, and cannot be tampered with by a name.')
