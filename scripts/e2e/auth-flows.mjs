// Run with: npm run test:auth
// Tests sign up, sign in, sign out, forgot password (6-digit code) and "email me a sign-in link" in a real (headless Chrome) browser.
// It starts the app by itself in demo mode (no real accounts, no real emails). In demo mode the email code is always 123456.
// Needs Google Chrome installed (see harness.mjs).
import { spawn, execSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { launch, sleep } from './harness.mjs'

const ROOT = path.resolve(import.meta.dirname, '..', '..')
const PORT = 5191
const APP = `http://localhost:${PORT}`
const OUT = path.join(os.tmpdir(), 'myfit-e2e')
const DEMO_CODE = '123456'

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  cwd: ROOT,
  shell: true,
  stdio: 'ignore',
  env: { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '', VITE_YOUTUBE_API_KEY: '' },
})
const stopServer = () => {
  try {
    if (process.platform === 'win32') execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: 'ignore' })
    else server.kill('SIGTERM')
  } catch {
    /* already stopped */
  }
}

let b
const results = []
const check = async (name, fn) => {
  b.setPhase(name)
  let ok = true
  let note = ''
  try {
    const r = await fn()
    if (r === false) ok = false
    else if (typeof r === 'string') { ok = false; note = r }
  } catch (e) {
    ok = false
    note = String(e.message || e).slice(0, 160)
  }
  results.push({ name, ok, note })
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? '  -> ' + note : ''))
}

try {
  let up = false
  for (let i = 0; i < 60 && !up; i++) {
    try { up = (await fetch(APP)).ok } catch { /* starting */ }
    if (!up) await sleep(500)
  }
  if (!up) throw new Error('The app did not start')
  b = await launch({ out: OUT, port: 10800, app: APP, width: 390, height: 844, dpr: 1 })

  const stamp = Date.now()
  const email = `auth-${stamp}@example.com`
  const OLD = 'OldPass1!'
  const NEW = 'NewPass1!'
  const text = () => b.text()
  const path_ = () => b.path()
  const submit = () => b.ev(`document.querySelector('form').requestSubmit()`)
  const signedOut = async () => { await b.ev(`localStorage.removeItem('myfit_session')`); await b.go('/auth', 1500) }
  const openSignUp = async () => { await b.go('/auth', 1800); await b.click('^Sign Up$'); await b.until(`document.getElementById('displayName')`) }

  // ---------------- sign up ----------------
  await check('Sign up: an empty form is blocked', async () => {
    await openSignUp(); await submit(); await sleep(500)
    return (await path_()) === '/auth' ? true : 'the empty form went through'
  })
  await check('Sign up: a missing name is blocked', async () => {
    await b.type('#email', email); await b.type('#password', OLD); await sleep(200); await submit(); await sleep(500)
    return (await path_()) === '/auth' ? true : 'sign up worked without a name'
  })
  await check('Sign up: a too-short password is blocked', async () => {
    await b.type('#displayName', 'Auth Tester'); await b.type('#password', 'abc'); await sleep(200); await submit(); await sleep(500)
    return (await path_()) === '/auth' && /at least 6/i.test(await text()) ? true : 'a 3-character password was accepted or gave no message'
  })
  await check('Sign up: the show/hide password button works', async () => {
    await b.ev(`document.querySelector('button[aria-label="Show password"]')?.click()`); await sleep(300)
    const shown = await b.ev(`document.getElementById('password').type === 'text'`)
    await b.ev(`document.querySelector('button[aria-label="Hide password"]')?.click()`); await sleep(300)
    const hidden = await b.ev(`document.getElementById('password').type === 'password'`)
    return shown && hidden ? true : 'the eye button did not toggle'
  })
  await check('Sign up: a valid account is created and opens the app', async () => {
    await b.type('#password', OLD); await sleep(200); await submit()
    return (await b.until(`location.pathname === '/'`, 9000)) ? true : 'did not reach the app'
  })
  await check('Sign up: still signed in after a reload', async () => {
    await b.go('/', 2200)
    return (await path_()) === '/' ? true : 'sent back to sign in after a reload'
  })
  await check('Sign out from the Account page returns to sign in', async () => {
    await b.go('/account', 2200); await b.click('^Sign out'); await sleep(1500)
    return /Sign In/.test(await text()) ? true : 'no sign-in screen after sign out'
  })
  await check('A signed-out visitor is sent to sign in from a private page', async () => {
    await b.go('/food', 2000)
    return (await path_()) === '/auth' ? true : 'the food page opened without signing in'
  })
  await check('Sign up: the same email twice is refused with a clear message', async () => {
    await openSignUp(); await b.type('#displayName', 'Again'); await b.type('#email', email); await b.type('#password', OLD); await sleep(200); await submit(); await sleep(1200)
    return /already exists/i.test(await text()) ? true : 'no "already exists" message'
  })

  // ---------------- sign in ----------------
  await check('Sign in: a wrong password is refused', async () => {
    await signedOut(); await b.type('#email', email); await b.type('#password', 'WrongPass1!'); await sleep(200); await submit(); await sleep(1200)
    return /Invalid email or password/i.test(await text()) ? true : 'no error for a wrong password'
  })
  await check('Sign in: an unknown email is refused with the same message', async () => {
    await b.type('#email', `nobody-${stamp}@example.com`); await b.type('#password', OLD); await sleep(200); await submit(); await sleep(1200)
    return /Invalid email or password/i.test(await text()) ? true : 'no error for an unknown email'
  })
  await check('Sign in: the right email and password open the app', async () => {
    await b.type('#email', email); await b.type('#password', OLD); await sleep(200); await submit()
    return (await b.until(`location.pathname === '/'`, 9000)) ? true : 'could not sign in'
  })

  // ---------------- forgot password (6-digit code) ----------------
  await check('Forgot password: asks for a 6-digit code, not a link', async () => {
    await signedOut(); await b.click('Forgot password'); await sleep(600)
    const t = await text()
    return /6-digit code/i.test(t) && /Send Code/i.test(t) && !/reset link/i.test(t) ? true : 'wrong wording on the forgot-password page'
  })
  await check('Forgot password: Send Code opens the code and new-password form', async () => {
    await b.type('#forgotEmail', email); await b.click('^Send Code'); await sleep(1200)
    return /Enter your code/i.test(await text()) && (await b.ev(`!!document.getElementById('resetCode') && !!document.getElementById('newPassword') && !!document.getElementById('confirmNewPassword')`)) ? true : 'the form is missing'
  })
  await check('Forgot password: two different passwords are refused', async () => {
    await b.type('#resetCode', DEMO_CODE); await b.type('#newPassword', NEW); await b.type('#confirmNewPassword', 'Other123!'); await sleep(200)
    await b.click('^Reset password'); await sleep(600)
    return /do not match/i.test(await text()) ? true : 'no mismatch message'
  })
  await check('Forgot password: a wrong code is refused', async () => {
    await b.type('#resetCode', '000000'); await b.type('#newPassword', NEW); await b.type('#confirmNewPassword', NEW); await sleep(200)
    await b.click('^Reset password'); await sleep(900)
    return /not right|expired/i.test(await text()) ? true : 'no wrong-code message'
  })
  await check('Forgot password: Send a new code confirms', async () => {
    await b.click('Send a new code'); await sleep(900)
    return /new code is on its way/i.test(await text()) ? true : 'no confirmation'
  })
  await check('Forgot password: the right code and matching passwords sign you in', async () => {
    await b.type('#resetCode', DEMO_CODE); await b.type('#newPassword', NEW); await b.type('#confirmNewPassword', NEW); await sleep(200)
    await b.click('^Reset password'); await sleep(2500)
    return (await path_()) === '/' ? true : 'not signed in after the reset'
  })
  await check('Forgot password: the old password stops working and the new one works', async () => {
    await signedOut(); await b.type('#email', email); await b.type('#password', OLD); await sleep(200); await submit(); await sleep(1200)
    if (!/Invalid email or password/i.test(await text())) return 'the old password still works'
    await b.type('#password', NEW); await sleep(200); await submit()
    return (await b.until(`location.pathname === '/'`, 9000)) ? true : 'the new password did not work'
  })

  // ---------------- email me a sign-in code instead ----------------
  await check('Sign-in code: the button opens the email screen', async () => {
    await signedOut(); await b.click('Email me a sign-in code'); await sleep(700)
    return /Sign in with a code/i.test(await text()) && (await b.ev(`!!document.getElementById('linkEmail')`)) ? true : 'the email screen did not open'
  })
  await check('Sign-in code: sending moves to the code screen', async () => {
    await b.type('#linkEmail', email); await b.click('^Email me a code'); await sleep(1200)
    return /Check your email/i.test(await text()) && (await b.ev(`!!document.getElementById('signInCode')`)) ? true : 'no code screen'
  })
  await check('Sign-in code: a wrong code is refused', async () => {
    await b.type('#signInCode', '000000'); await sleep(200); await submit(); await sleep(1000)
    return /not right|expired/i.test(await text()) ? true : 'no wrong-code message'
  })
  await check('Sign-in code: the right code signs you in without a password', async () => {
    await b.type('#signInCode', DEMO_CODE); await sleep(200); await submit()
    return (await b.until(`location.pathname === '/'`, 9000)) ? true : 'did not sign in with the code'
  })
  await check('Sign-in code: "Send a new code" goes back to the email step', async () => {
    await signedOut(); await b.click('Email me a sign-in code'); await sleep(600)
    await b.type('#linkEmail', email); await b.click('^Email me a code'); await sleep(1000)
    await b.click('Send a new code'); await sleep(600)
    return (await b.ev(`!!document.getElementById('linkEmail')`)) ? true : 'did not return to the email step'
  })
  await check('Sign-in code: Back to sign in works', async () => {
    await b.click('Back to sign in'); await sleep(600)
    return (await b.ev(`!!document.getElementById('password')`)) ? true : 'did not return to sign in'
  })

  const errs = b.errors.filter((e) => !/favicon|DevTools|\[vite\]/i.test(e.text))
  results.push({ name: 'No browser errors during the whole run', ok: errs.length === 0, note: errs[0]?.text.slice(0, 120) ?? '' })
  console.log((errs.length === 0 ? 'PASS ' : 'FAIL ') + 'No browser errors during the whole run' + (errs[0] ? '  -> ' + errs[0].text.slice(0, 120) : ''))
} catch (e) {
  results.push({ name: 'Test run', ok: false, note: String(e.message || e) })
  console.log('FAIL Test run -> ' + String(e.message || e))
} finally {
  try { b?.close() } catch { /* ignore */ }
  stopServer()
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${failed.length ? 'FAILED' : 'PASSED'}: ${results.length - failed.length} of ${results.length} sign-in checks passed.`)
process.exit(failed.length ? 1 : 0)
