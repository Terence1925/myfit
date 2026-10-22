// The last few things the person searched for, kept on their own device (like starred foods). Shown under the search box so
// a repeat search is one tap.
const KEY = 'myfit_food_recent_searches'
export const MAX_RECENT_SEARCHES = 8

export function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(list) ? list.filter((q): q is string => typeof q === 'string').slice(0, MAX_RECENT_SEARCHES) : []
  } catch {
    return []
  }
}

/** The list with `query` moved to the front: trimmed, no repeats (any capitals), at most 8, ignoring one-letter searches. */
export function withSearch(list: string[], query: string): string[] {
  const q = query.trim().replace(/\s+/g, ' ')
  if (q.length < 2) return list
  return [q, ...list.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT_SEARCHES)
}

function save(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // storage full or blocked: the list just will not be kept
  }
}

export function rememberSearch(query: string): string[] {
  const next = withSearch(loadRecentSearches(), query)
  save(next)
  return next
}

export function forgetSearch(query: string): string[] {
  const next = loadRecentSearches().filter((x) => x !== query)
  save(next)
  return next
}

export function clearSearches(): string[] {
  save([])
  return []
}
