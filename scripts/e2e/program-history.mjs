// Run with: npm run test:history
// Checks that Programs > Weekly plan opens on today's training day, so a saved workout's history is visible.
// Runs in demo mode with its own app server (no real accounts). Needs Google Chrome installed.
import { spawn, execSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { launch, sleep } from './harness.mjs'
import { walkWizard } from './wizard.mjs'

const ROOT = path.resolve(import.meta.dirname, '..', '..')
const PORT = 5192
const APP = `http://localhost:${PORT}`
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  cwd: ROOT, shell: true, stdio: 'ignore',
  env: { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '', VITE_YOUTUBE_API_KEY: '' },
})
const stopServer = () => {
  try { if (process.platform === 'win32') execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: 'ignore' }); else server.kill('SIGTERM') } catch { /* stopped */ }
}

let b
const results = []
const check = async (name, fn) => {
  let ok = true, note = ''
  try { const r = await fn(); if (r === false) ok = false; else if (typeof r === 'string') { ok = false; note = r } } catch (e) { ok = false; note = String(e.message || e).slice(0, 700) }
  results.push(ok)
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? '  -> ' + note : ''))
}

try {
  let up = false
  for (let i = 0; i < 60 && !up; i++) { try { up = (await fetch(APP)).ok } catch { /* starting */ } if (!up) await sleep(500) }
  if (!up) throw new Error('The app did not start')
  b = await launch({ out: path.join(os.tmpdir(), 'myfit-history'), port: 10900, app: APP, width: 390, height: 844, dpr: 1 })

  let dayPicked = null
  // dayPicked is the day trained today; the Weekly plan must open on it
  await check('Create a program (full gym)', async () => {
    await b.go('/auth', 2200); await b.click('^Sign Up$'); await b.until(`document.getElementById('displayName')`)
    await b.type('#displayName', 'History Tester'); await b.type('#email', `hist-${Date.now()}@example.com`); await b.type('#password', 'Passw0rd!'); await sleep(300)
    await b.ev(`document.querySelector('form').requestSubmit()`); await b.until(`location.pathname==='/'`, 9000)
    await b.until(`/Next|STEP 1/i.test(document.body.innerText)`, 8000)
    await b.ev(`[...document.querySelectorAll('button')].filter(x=>/^(skip|next)/i.test(x.textContent.trim()))[0]?.click()`)
    const w = await walkWizard(b, 'Full Commercial Gym'); await sleep(7000)
    return w.generated ? true : 'the program was not generated'
  })

  await check('Save a workout on the day Home says is next', async () => {
    await b.ev(`(() => { const uid = JSON.parse(localStorage.getItem('myfit_session')).userId; const p = JSON.parse(localStorage.getItem('myfit_programs') || '[]').find((x) => x.userId === uid); const days = p.programData.days; dayPicked = days[2] ?? days[0]
      const d = new Date(); d.setHours(18, 0, 0, 0)
      localStorage.setItem('myfit_sessions', JSON.stringify([{ id: 'hist1', userId: uid, programId: p.id, day: dayPicked.day, dayName: dayPicked.name, date: d.toISOString(), exercises: dayPicked.exercises.map((e) => ({ name: e.name, sets: Array.from({ length: e.sets }, (_, si) => ({ setNumber: si + 1, weight: 40, reps: 8, completed: true })) })) }])) })()`)
    dayPicked = await b.ev(`(() => { const uid = JSON.parse(localStorage.getItem('myfit_session')).userId; return JSON.parse(localStorage.getItem('myfit_sessions'))[0].day })()`)
    return dayPicked ? true : 'no session written'
  })

  await check('Programs > Weekly plan opens on the day that was trained', async () => {
    await b.ev(`(() => { const uid = JSON.parse(localStorage.getItem('myfit_session')).userId; const l = JSON.parse(localStorage.getItem('myfit_profiles')); const a = Array.isArray(l) ? l : Object.values(l); const x = a.find(q => q.id === uid); x.subscriptionTier='pro'; x.subscriptionStatus='active'; x.subscriptionRenewsAt=new Date(Date.now()+25*864e5).toISOString(); localStorage.setItem('myfit_profiles', JSON.stringify(Array.isArray(l)?a:Object.fromEntries(Object.entries(l).map(([k,v])=>[k,v.id===x.id?x:v])))) })()`)
    await b.go('/saved', 2400); await b.click('^View$'); await sleep(1500)
    await b.ev(`[...document.querySelectorAll('[role=tab]')].find(x => x.textContent.trim() === 'Weekly plan')?.click()`); await sleep(1500)
    const selected = await b.ev(`[...document.querySelectorAll('[role=tab][aria-selected="true"]')].map(t => t.textContent.trim())`)
    const want = `Day ${dayPicked}`
    return selected.includes(want) ? true : `selected "${selected.join(', ')}", wanted "${want}"`
  })

  await check('The saved session list shows under that day', async () => {
    const t = await b.text()
    return /Session History/i.test(t) && /completed/i.test(t) ? true : 'no session history shown on the opened day'
  })

  const errs = b.errors.filter((e) => !/favicon|DevTools|\[vite\]/i.test(e.text))
  results.push(errs.length === 0)
  console.log((errs.length === 0 ? 'PASS ' : 'FAIL ') + 'No browser errors' + (errs[0] ? '  -> ' + errs[0].text.slice(0, 120) : ''))
} catch (e) {
  results.push(false); console.log('FAIL Test run -> ' + String(e.message || e))
} finally {
  try { b?.close() } catch { /* ignore */ }
  stopServer()
}
const failed = results.filter((r) => !r).length
console.log(`\n${failed ? 'FAILED' : 'PASSED'}: ${results.length - failed} of ${results.length} checks passed.`)
process.exit(failed ? 1 : 0)
