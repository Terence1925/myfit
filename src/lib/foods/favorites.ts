import type { FoodItem } from '@/lib/types'

// Starred foods live on the person's own device (like the theme choice). A starred food keeps its numbers, so it
// still works if it was something they added themselves.
const KEY = 'myfit_food_favs'
const MAX = 60

export function loadFavorites(): FoodItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as FoodItem[]) : []
  } catch {
    return []
  }
}

function save(list: FoodItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {
    // storage full or blocked: starring just won't stick
  }
}

const same = (a: FoodItem, b: FoodItem) => a.name === b.name && a.serving === b.serving

export function isFavorite(food: FoodItem): boolean {
  return loadFavorites().some((f) => same(f, food))
}

/** Adds or removes the star and returns the new list. */
export function toggleFavorite(food: FoodItem): FoodItem[] {
  const list = loadFavorites()
  const next = list.some((f) => same(f, food)) ? list.filter((f) => !same(f, food)) : [food, ...list]
  save(next)
  return next
}
