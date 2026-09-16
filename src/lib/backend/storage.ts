const PREFIX = 'forgefit_'

export function readAll<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

export function writeAll<T>(key: string, items: T[]): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(items))
}

export function readOne<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeOne<T>(key: string, value: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export function removeKey(key: string): void {
  localStorage.removeItem(PREFIX + key)
}

export function uid(): string {
  return crypto.randomUUID()
}
