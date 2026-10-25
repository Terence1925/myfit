// Run with: npm run test:deletion-email
// Checks the "your account was deleted" email (sample data, nothing is sent).
import { buildBrevoRequest, buildDeletionEmail } from '../supabase/functions/delete-account/index'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

const mail = buildDeletionEmail('Alex', 'alex@example.com')
check('subject', mail.subject, 'Your MyFit account has been deleted')
check('greets by name', mail.text.startsWith('Hi Alex,'), true)
check('names the account email', mail.text.includes('(alex@example.com)'), true)
check('says it was deleted as asked', mail.text.includes('has been deleted, as you asked'), true)
check('says what was removed', mail.text.includes('programs, workout history, food log and body measurements'), true)
check('warns that a Google Play subscription is not cancelled', mail.text.includes('does not cancel a paid subscription') && mail.text.includes('Google Play'), true)
check('tells them to reply if it was not them', mail.text.includes('If you did not ask for this, reply'), true)
check('paragraphs are separated by a blank line', mail.text.split('\n\n').length, 5)
check('html has one paragraph each', (mail.html.match(/<p /g) ?? []).length, 5)

check('no name falls back to "there"', buildDeletionEmail(undefined, 'a@b.co').text.startsWith('Hi there,'), true)
check('blank name falls back to "there"', buildDeletionEmail('   ', 'a@b.co').text.startsWith('Hi there,'), true)

const nasty = buildDeletionEmail('<b>Al</b> & "co"', 'x@y.zz')
check('a name cannot add html', nasty.html.includes('<b>Al</b>'), false)
check('and is shown as text', nasty.html.includes('&lt;b&gt;Al&lt;/b&gt; &amp; &quot;co&quot;'), true)

const req = buildBrevoRequest('help@example.com', 'help@example.com', 'alex@example.com', 'Alex', mail)
check('request goes to the member only', req.to, [{ email: 'alex@example.com', name: 'Alex' }])
check('request is from the MyFit sender', req.sender, { name: 'MyFit', email: 'help@example.com' })
check('replies go to support', req.replyTo, { email: 'help@example.com' })
check('request carries the subject and both versions of the text', [req.subject, req.textContent === mail.text, req.htmlContent === mail.html], [mail.subject, true, true])
check('no name leaves the name out', buildBrevoRequest('a@b.co', 'a@b.co', 'x@y.zz', undefined, mail).to, [{ email: 'x@y.zz' }])

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: the account-deleted email says what was removed, warns about Google Play, and cannot be tampered with by a name.')
