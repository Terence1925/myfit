// The three-screen welcome tour is shown once per person on this phone (before their first program). `?tour=1` on the
// home page shows it again (the Account page has a "Take the tour again" button).
const key = (userId: string) => `myfit_tour_seen_${userId}`

export function tourSeen(userId: string): boolean {
  try {
    return localStorage.getItem(key(userId)) === '1'
  } catch {
    return true
  }
}

export function markTourSeen(userId: string): void {
  try {
    localStorage.setItem(key(userId), '1')
  } catch {
    /* nothing to do */
  }
}
