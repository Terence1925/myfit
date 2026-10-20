// Which badges this person has already seen on this phone. A badge that is not in the list yet is "new": the app
// celebrates it once and adds it. The first time (no list at all) everything already earned is added quietly, so someone
// who updates the app is not hit with a pile of celebrations for old workouts.
const key = (userId: string) => `myfit_badges_seen_${userId}`

/** `null` = never checked on this phone. */
export function loadSeenBadges(userId: string): string[] | null {
  try {
    const raw = localStorage.getItem(key(userId))
    if (!raw) return null
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : null
  } catch {
    return null
  }
}

export function saveSeenBadges(userId: string, ids: string[]): void {
  try {
    localStorage.setItem(key(userId), JSON.stringify(ids))
  } catch {
    /* nothing to do */
  }
}

// Badges earned since the person last opened the Badges window (shown with a "New" tag, no pop-up).
const newKey = (userId: string) => `myfit_badges_new_${userId}`

export function loadNewBadges(userId: string): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(newKey(userId)) ?? '[]')
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function addNewBadges(userId: string, ids: string[]): void {
  try {
    localStorage.setItem(newKey(userId), JSON.stringify([...new Set([...loadNewBadges(userId), ...ids])]))
  } catch {
    /* nothing to do */
  }
}

export function clearNewBadges(userId: string): void {
  try {
    localStorage.removeItem(newKey(userId))
  } catch {
    /* nothing to do */
  }
}
