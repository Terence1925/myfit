/** The sounds offered for the rest-over alarm. The files are in public/sounds (preview) and android res/raw (the alarm itself). */
export const REST_SOUNDS = [
  { id: 'chime', label: 'Chime', hint: 'Two soft rising notes' },
  { id: 'beeps', label: 'Beeps', hint: 'Three quick beeps' },
  { id: 'bell', label: 'Bell', hint: 'A single ringing bell' },
] as const

export type RestSoundId = (typeof REST_SOUNDS)[number]['id']

const KEY = 'myfit_rest_sound'
const DEFAULT: RestSoundId = 'chime'
const isSound = (v: unknown): v is RestSoundId => REST_SOUNDS.some((s) => s.id === v)

export function getRestSound(): RestSoundId {
  try {
    const v = localStorage.getItem(KEY)
    return isSound(v) ? v : DEFAULT
  } catch {
    return DEFAULT
  }
}

export function setRestSound(id: RestSoundId): void {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    // Storage blocked: the choice just won't be remembered.
  }
}

let preview: HTMLAudioElement | null = null

/** Plays a sound once so it can be heard before choosing it (stops any preview already playing). */
export function previewRestSound(id: RestSoundId): void {
  try {
    preview?.pause()
    preview = new Audio(`/sounds/rest_${id}.wav`)
    void preview.play().catch(() => undefined)
  } catch {
    // No audio available: nothing to preview.
  }
}
