// Run with: npm run test:applink
// Checks the link that takes a person from the password-reset page back into the phone app, signed in.
import { openAppLink, refreshTokenFromAppLink } from '../src/lib/appLink'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

check('token is read from the app link', refreshTokenFromAppLink('myfit://open?rt=abc123xyz789'), 'abc123xyz789')
check('token with dashes and dots is kept', refreshTokenFromAppLink('myfit://open?rt=a-b_c.d1234'), 'a-b_c.d1234')
check('no token gives null', refreshTokenFromAppLink('myfit://open'), null)
check('too short a token is refused', refreshTokenFromAppLink('myfit://open?rt=abc'), null)
check('odd characters are refused', refreshTokenFromAppLink('myfit://open?rt=abc<script>123'), null)
check('another scheme is refused', refreshTokenFromAppLink('https://open/?rt=abc123xyz789'), null)
check('another host is refused', refreshTokenFromAppLink('myfit://evil?rt=abc123xyz789'), null)
check('garbage is refused', refreshTokenFromAppLink('not a link'), null)

const withToken = openAppLink('abc123xyz789', 'https://getmyfit.vercel.app/')
check('the link is pinned to the MyFit package', withToken.includes(';package=com.myfit.app;'), true)
check('the link carries the token', withToken.startsWith('intent://open?rt=abc123xyz789#Intent;scheme=myfit;'), true)
check('the link falls back to the website', withToken.includes('S.browser_fallback_url=https%3A%2F%2Fgetmyfit.vercel.app%2F;end'), true)
check('without a token it just opens the app', openAppLink(null, 'https://x.test/').startsWith('intent://open#Intent;scheme=myfit;'), true)
check('a token with odd characters is encoded', openAppLink('a&b', 'https://x.test/').includes('?rt=a%26b#'), true)

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: the open-the-app link carries the login token safely, and only a valid myfit link signs the app in.')
