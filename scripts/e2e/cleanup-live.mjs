// Deletes throwaway test accounts on the REAL backend, using the app's own Delete account button.
// Run with: node scripts/e2e/cleanup-live.mjs <email> [<email> ...]   (all must use the test password)
import { spawn, execSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { launch, sleep } from './harness.mjs'

const ROOT = path.resolve(import.meta.dirname, '..', '..')
const PORT = 5196
const APP = `http://localhost:${PORT}`
const PASSWORD = 'LiveTest1!'
const emails = process.argv.slice(2)
if (!emails.length) {
  console.log('Give at least one test email.')
  process.exit(1)
}
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: ROOT, shell: true, stdio: 'ignore' })
const stopServer = () => {
  try {
    if (process.platform === 'win32') execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: 'ignore' })
    else server.kill('SIGTERM')
  } catch {
    /* already stopped */
  }
}
let allGone = true
try {
  let up = false
  for (let i = 0; i < 60 && !up; i++) {
    try {
      up = (await fetch(APP)).ok
    } catch {
      /* starting */
    }
    if (!up) await sleep(500)
  }
  if (!up) throw new Error('The app did not start')
  for (const email of emails) {
    const b = await launch({ out: path.join(os.tmpdir(), 'myfit-cleanup'), port: 10970 + emails.indexOf(email), app: APP, width: 390, height: 844, dpr: 1 })
    try {
      await b.go('/auth', 2500)
      await b.type('#email', email)
      await b.type('#password', PASSWORD)
      await sleep(300)
      await b.ev(`document.querySelector('form').requestSubmit()`)
      const inApp = await b.until(`location.pathname === '/'`, 10000)
      if (!inApp) {
        console.log(`SKIP ${email}: could not sign in (already deleted, or the password differs)`)
        continue
      }
      await b.go('/account', 2600)
      const opened = await b.click('Delete account')
      await sleep(900)
      if (!opened) throw new Error('no Delete account button')
      await b.type('input[aria-label="Your password"]', PASSWORD)
      await sleep(300)
      await b.click('Permanently delete')
      await sleep(4000)
      const path_ = await b.path()
      const gone = path_ === '/auth' || path_ === '/account-deleted'
      if (!gone) allGone = false
      console.log((gone ? 'DELETED ' : 'NOT CONFIRMED ') + email + ' (now at ' + path_ + ')')
    } catch (e) {
      allGone = false
      console.log('FAILED ' + email + ': ' + String(e.message || e).slice(0, 200))
    } finally {
      b.close()
    }
  }
} finally {
  stopServer()
}
console.log(allGone ? 'All listed accounts are deleted.' : 'Some accounts still need checking by hand.')
process.exit(allGone ? 0 : 1)
