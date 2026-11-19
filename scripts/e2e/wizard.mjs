// Walks the sign-up questions (any equipment) and generates the program. Returns the list of steps seen.
export const FILL = (pickCard) => `(() => {
  const setVal = (el, v) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const heading = (document.querySelector('h2')?.textContent || '')
  const nums = [...document.querySelectorAll('input[type=number]')]
  for (const el of nums) {
    const key = (el.id + ' ' + heading).toLowerCase()
    const v = /feet/.test(el.id) ? 5 : /inch/.test(el.id) ? 10 : /weight/.test(key) ? 170 : /age/.test(key) ? 30 : null
    if (v !== null) setVal(el, v)
  }
  if (nums.length === 2 && !nums.some((n) => n.id)) { setVal(nums[0], 5); setVal(nums[1], 10) }
  const next = () => [...document.querySelectorAll('button')].find((b) => /^(next|generate)/i.test(b.textContent.trim()))
  const area = document.querySelector('h2')?.closest('div.space-y-6') || document
  for (const g of document.querySelectorAll('[role=group][aria-label]')) {
    if (/weight unit/i.test(g.getAttribute('aria-label'))) continue
    const b = g.querySelectorAll('button')[1] || g.querySelector('button'); b && b.click()
  }
  const sections = [...document.querySelectorAll('section')]
  for (const sec of sections) {
    const cards = [...sec.querySelectorAll('button')]
    ;(cards[1] || cards[0])?.click()
  }
  if (!sections.length && next().disabled) {
    const cards = [...area.querySelectorAll('button')].filter((b) => !/^(back|next|generate)/i.test(b.textContent.trim()) && !b.closest('[role=group]'))
    const labelled = cards.filter((b) => b.textContent.trim().length > 0)
    const want = ${JSON.stringify(pickCard ?? '')}
    const pick = want ? labelled.find((b) => new RegExp(want, 'i').test(b.textContent)) : null
    ;(pick || labelled[1] || labelled[0])?.click()
  }
  return { disabled: next().disabled, text: next().textContent.trim() }
})()`

// equipment: text of the card to pick on the first question (e.g. 'Dumbbells', 'Yoga')
export async function walkWizard(b, equipment = 'Full Commercial Gym') {
  const steps = []
  let firstStep = true
  for (let i = 0; i < 16; i++) {
    await b.sleep(900)
    const title = await b.ev(`document.querySelector('h2')?.textContent || ''`)
    await b.ev(FILL(firstStep ? equipment : ''))
    firstStep = false
    await b.sleep(500)
    const st = await b.ev(`(() => { const x = [...document.querySelectorAll('button')].find((b) => /^(next|generate)/i.test(b.textContent.trim())); return x ? { disabled: x.disabled, text: x.textContent.trim() } : null })()`)
    steps.push({ title, st })
    if (!st) break
    if (/generate/i.test(st.text)) {
      await b.ev(`[...document.querySelectorAll('button')].find((b) => /^generate/i.test(b.textContent.trim())).click()`)
      return { steps, generated: true }
    }
    if (st.disabled) return { steps, generated: false, stuckAt: title }
    await b.ev(`[...document.querySelectorAll('button')].find((b) => /^next/i.test(b.textContent.trim())).click()`)
  }
  return { steps, generated: false }
}
