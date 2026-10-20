// Short, soft sounds made in code (no sound files): a tick when a set is ticked, and little chimes for a finished workout,
// a badge and a record. They are quiet on purpose and can be switched off in Account. Stored in localStorage `myfit_sound`
// ('0' = off). It never throws: a phone or browser that cannot play audio simply stays silent.
export type SoundKind = 'tick' | 'done' | 'badge' | 'record'

export function soundOn(): boolean {
  try {
    return localStorage.getItem('myfit_sound') !== '0'
  } catch {
    return true
  }
}

export function setSoundOn(on: boolean): void {
  try {
    localStorage.setItem('myfit_sound', on ? '1' : '0')
  } catch {
    /* nothing to do */
  }
}

/** Notes (Hz), how long each one rings, and how loud (kept low). */
export const SOUNDS: Record<SoundKind, { notes: number[]; step: number; length: number; gain: number }> = {
  tick: { notes: [880], step: 0, length: 0.09, gain: 0.05 },
  done: { notes: [523.25, 659.25, 783.99], step: 0.11, length: 0.35, gain: 0.07 },
  badge: { notes: [783.99, 1046.5], step: 0.13, length: 0.4, gain: 0.07 },
  record: { notes: [523.25, 659.25, 783.99, 1046.5], step: 0.1, length: 0.4, gain: 0.07 },
}

let ctx: AudioContext | null = null

export function playSound(kind: SoundKind): void {
  if (!soundOn()) return
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    ctx = ctx ?? new AudioCtx()
    if (ctx.state === 'suspended') void ctx.resume()
    const spec = SOUNDS[kind]
    const start = ctx.currentTime + 0.01
    spec.notes.forEach((freq, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      const t = start + i * spec.step
      osc.type = 'sine'
      osc.frequency.value = freq
      // a quick fade in and a smooth fade out, so it never clicks
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(spec.gain, t + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + spec.length)
      osc.connect(gain).connect(ctx!.destination)
      osc.start(t)
      osc.stop(t + spec.length + 0.02)
    })
  } catch {
    /* no audio available */
  }
}
