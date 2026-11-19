// Tiny headless-Chrome test harness (CDP, no dependencies) used by the end-to-end checks in this folder. It needs Google Chrome installed.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function launch({ out, port = 9611, app = 'http://localhost:5181', width = 375, height = 812, dark = false, dpr = 2 }) {
  fs.mkdirSync(out, { recursive: true })
  const profile = path.resolve(path.dirname(out), `chrome-profile-${port}`)
  fs.rmSync(profile, { recursive: true, force: true })
  const chrome = spawn(
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`, '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank'],
    { stdio: 'ignore' },
  )
  let wsUrl
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
      wsUrl = tabs.find((t) => t.type === 'page')?.webSocketDebuggerUrl
    } catch {
      /* not up yet */
    }
    if (!wsUrl) await sleep(500)
  }
  if (!wsUrl) throw new Error('Chrome did not start')
  const ws = new WebSocket(wsUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const pending = new Map()
  const errors = []
  let phase = 'start'
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) return pending.get(m.id)(m)
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      const t = m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 220)
      errors.push({ phase, kind: 'console.error', text: t })
    }
    if (m.method === 'Runtime.exceptionThrown') errors.push({ phase, kind: 'exception', text: (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 220) })
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push({ phase, kind: 'log', text: (m.params.entry.text + ' ' + (m.params.entry.url ?? '')).slice(0, 220) })
  }
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const i = ++id
      pending.set(i, (m) => (m.error ? rej(new Error(method + ' ' + JSON.stringify(m.error))) : res(m.result)))
      ws.send(JSON.stringify({ id: i, method, params }))
    })
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile: true })
  if (dark) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] })

  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('JS: ' + JSON.stringify(r.exceptionDetails).slice(0, 300))
    return r.result.value
  }
  const api = {
    app, errors, send, ev, sleep,
    setPhase: (p) => (phase = p),
    shot: async (name) => {
      const r = await send('Page.captureScreenshot', { format: 'png' })
      fs.writeFileSync(path.join(out, name), Buffer.from(r.data, 'base64'))
    },
    go: async (p, wait = 1800) => {
      await send('Page.navigate', { url: app + p })
      await sleep(wait)
    },
    text: () => ev('document.body.innerText'),
    path: () => ev('location.pathname'),
    // wait until the expression is truthy
    until: async (expr, ms = 6000) => {
      const t0 = Date.now()
      while (Date.now() - t0 < ms) {
        try {
          const v = await ev(`!!(${expr})`)
          if (v) return true
        } catch {
          /* page still loading */
        }
        await sleep(150)
      }
      return false
    },
    // click the first visible, enabled element (button, link, tab, switch) whose text or aria-label matches
    click: async (re, { nth = 0, last = false } = {}) => {
      const r = await ev(`(() => { const re = new RegExp(${JSON.stringify(re)}, 'i'); const els = [...document.querySelectorAll('button,a,[role=tab],[role=switch],[role=button],label')].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && !e.disabled && re.test(((e.getAttribute('aria-label') || '') + ' ' + e.textContent.trim()).trim()) }); const el = ${last ? 'els[els.length - 1]' : `els[${nth}]`}; if (!el) return 'none'; el.scrollIntoView({block:'center'}); el.click(); return 'ok' })()`)
      return r === 'ok'
    },
    // type into an input found by selector (works with React-controlled inputs)
    type: async (sel, value) =>
      ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement; Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, ${JSON.stringify(String(value))}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true })()`),
    close: () => {
      try { ws.close() } catch { /* already closed */ }
      chrome.kill()
    },
  }
  return api
}

// pass/fail bookkeeping
export function suite(name, b) {
  const results = []
  return {
    results,
    async test(label, fn) {
      b.setPhase(label)
      try {
        const r = await fn()
        if (r === false) throw new Error('returned false')
        results.push({ label, ok: true })
        console.log('  PASS', label)
      } catch (e) {
        results.push({ label, ok: false, why: String(e.message ?? e).slice(0, 300) })
        console.log('  FAIL', label, '->', String(e.message ?? e).slice(0, 300))
        try { await b.shot('FAIL-' + label.replace(/\W+/g, '_').slice(0, 40) + '.png') } catch { /* ignore */ }
      }
    },
    summary() {
      const bad = results.filter((r) => !r.ok)
      console.log(`\n${name}: ${results.length - bad.length}/${results.length} passed`)
      return bad.length
    },
  }
}
export const expect = (cond, msg) => {
  if (!cond) throw new Error(msg)
}
