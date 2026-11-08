// Run with: npm run test:store-name
// The price lines must name the one store the person uses: Google Play on Android, the App Store on iPhone and iPad.
import { storeName } from '../src/lib/platform'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}
const as = (userAgent: string, platform = '', maxTouchPoints = 0) =>
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent, platform, maxTouchPoints }, configurable: true })

as('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36')
check('Android phone browser', storeName(), 'Google Play')
as('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1', 'iPhone', 5)
check('iPhone browser', storeName(), 'the App Store')
as('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15', 'MacIntel', 5)
check('iPad reporting itself as a Mac', storeName(), 'the App Store')
as('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15', 'MacIntel', 0)
check('a real Mac', storeName(), 'Google Play or the App Store')
as('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', 'Win32', 0)
check('a Windows computer', storeName(), 'Google Play or the App Store')

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: the store named is the one on the person\'s device (Google Play on Android, the App Store on iPhone and iPad).')
