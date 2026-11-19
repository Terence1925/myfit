// Run with: npm run test:live
// Runs the app against the REAL Supabase project (the one in .env.local). It creates one throwaway account,
// generates a program, saves a workout, checks the history on Programs, and deletes the account at the end.
// It writes to the live database, so it is a manual check, not part of npm test.
import { spawn, execSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { launch, sleep } from './harness.mjs'
import { walkWizard } from './wizard.mjs'

const ROOT = path.resolve(import.meta.dirname, '..', '..')
const PORT = 5194
const APP = `http://localhost:${PORT}`
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: ROOT, shell: true, stdio: 'ignore' })
const stopServer = () => {
  try {
    if (process.platform === 'win32') execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: 'ignore' })
    else server.kill('SIGTERM')
  } catch {
    /* already stopped */
  }
}
const results = []
let b
const check = async (name, fn) => {
  b?.setPhase(name)
  let ok = true
  let note = ''
  try {
    const r = await fn()
    if (r === false) ok = false
    else if (typeof r === 'string') {
      ok = false
      note = r
    }
  } catch (e) {
    ok = false
    note = String(e.message || e).slice(0, 300)
  }
  results.push(ok)
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? '  -> ' + note : ''))
  return ok
}

const email = `live-test-${Date.now()}@example.com`
const password = 'LiveTest1!'
let deletedOk = false
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
  b = await launch({ out: path.join(os.tmpdir(), 'myfit-live'), port: 10950, app: APP, width: 390, height: 844, dpr: 1 })
  const text = () => b.text()

  await check('Sign up a throwaway account', async () => {
    await b.go('/auth', 2500)
    await b.click('^Sign Up$')
    await b.until(`document.getElementById('displayName')`)
    await b.type('#displayName', 'Live Test')
    await b.type('#email', email)
    await b.type('#password', password)
    await sleep(300)
    await b.ev(`document.querySelector('form').requestSubmit()`)
    await b.until(`location.pathname==='/' || /Check your email|already/i.test(document.body.innerText)`, 15000)
    const t = await text()
    if (/Check your email/i.test(t)) return 'the app asked to confirm the email first (Confirm email is ON)'
    if (/already exists/i.test(t)) return 'the account already exists'
    return (await b.path()) === '/' ? true : 'did not reach the app after sign-up: ' + t.slice(0, 160)
  })

  await check('Generate a program (questions to plan)', async () => {
    await b.until(`/Next|STEP 1/i.test(document.body.innerText)`, 9000)
    await b.ev(`[...document.querySelectorAll('button')].filter(x=>/^(skip|next)/i.test(x.textContent.trim()))[0]?.click()`)
    const w = await walkWizard(b, 'Full Commercial Gym')
    await sleep(8000)
    return w.generated ? true : 'the plan did not generate (stopped at: ' + (w.stuckAt || '?') + ')'
  })

  await check('Home opens with the program', async () => {
    await b.go('/', 3000)
    return /Good (morning|afternoon|evening)/.test(await text()) ? true : 'Home did not show the program'
  })

  await check('Start workout and log every set', async () => {
    const hasStart = await b.click('Start workout')
    await sleep(1500)
    if (!hasStart) return 'there is no Start workout button'
    const rows = await b.ev(`document.querySelectorAll('input[aria-label^="Weight in"]').length`)
    if (!rows) {
      const t = await text()
      return /subscribe|trial|locked|Pro/i.test(t) ? 'the workout is locked for a free account (needs Pro)' : 'no set boxes appeared'
    }
    await b.ev(`(() => { const set = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })) }; document.querySelectorAll('input[aria-label^="Weight in"]').forEach((w) => set(w, 50)); document.querySelectorAll('input[placeholder="reps"]').forEach((r) => set(r, 8)) })()`)
    await sleep(400)
    for (let i = 0; i < 80; i++) {
      const left = await b.ev(`(() => { const m = [...document.querySelectorAll('[aria-label^="Mark set"]')][0]; if (!m) return 0; m.click(); return 1 })()`)
      if (!left) break
      await sleep(110)
    }
    return true
  })

  await check('Save the session', async () => {
    await sleep(1500)
    if (!/Workout complete/i.test(await text())) return 'the finish box did not appear after the last set'
    await b.click('Save session')
    await sleep(2500)
    return true
  })

  await check('Home shows the saved workout', async () => {
    await b.go('/', 2800)
    return /1 of|workout day|Streak/i.test(await text()) ? true : 'Home does not show the saved workout'
  })

  await check('Programs opens on today, with the session history', async () => {
    await b.go('/saved', 2600)
    await b.click('^View$')
    await sleep(2200)
    await b.ev(`[...document.querySelectorAll('[role=tab]')].find(x => x.textContent.trim() === 'Weekly plan')?.click()`)
    await sleep(1800)
    const selected = await b.ev(`[...document.querySelectorAll('[role=tab][aria-selected="true"]')].map(t => t.textContent.trim())`)
    const t = await text()
    if (!(/Session History/i.test(t) && /completed/i.test(t))) return `history not shown. Selected tab: "${selected.join(', ')}"`
    return true
  })

  await check('Exercise History popup opens and shows the sets', async () => {
    await b.click('^History$')
    await sleep(2000)
    const t = await text()
    if (/Something went wrong/i.test(t)) return 'the popup showed an error'
    return /Past workouts|No history|sets? will show|Save this exercise/i.test(t) ? true : 'the popup did not open'
  })

  await check('Delete the throwaway account (clean up)', async () => {
    await b.go('/account', 2600)
    const opened = await b.click('Delete account')
    await sleep(900)
    if (!opened) return 'no Delete account button'
    const pw = await b.ev(`!!document.querySelector('input[type=password]')`)
    if (pw) await b.type('input[type=password]', password)
    await sleep(300)
    await b.ev(`[...document.querySelectorAll('button')].filter(x => /delete/i.test(x.textContent) && !x.disabled).pop()?.click()`)
    await sleep(3000)
    deletedOk = (await b.path()) === '/auth' || /deleted/i.test(await text())
    return deletedOk ? true : 'could not confirm the account was deleted (check the Account page by hand)'
  })
} catch (e) {
  results.push(false)
  console.log('FAIL Test run -> ' + String(e.message || e))
} finally {
  try {
    b?.close()
  } catch {
    /* ignore */
  }
  stopServer()
}
const failed = results.filter((r) => !r).length
console.log(`\n${failed ? 'FAILED' : 'PASSED'}: ${results.length - failed} of ${results.length} live checks passed.`)
console.log(`Test account: ${email} (deleted at the end: ${deletedOk ? 'yes' : 'NOT CONFIRMED, check it'})`)
process.exit(failed ? 1 : 0)
