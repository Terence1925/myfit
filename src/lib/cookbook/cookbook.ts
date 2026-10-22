// The cookbook: healthy recipes with a photo, ingredients, steps and numbers per serving. The numbers are worked out from the
// ingredients (grams x what is in 100 g, see ingredients.ts), so a recipe's calories and macros always match its ingredients.
import type { FoodItem } from '../types'
import { INGREDIENTS } from './ingredients'
import { RECIPE_DATA } from './recipeData'
import { PHOTO_CREDITS, PHOTO_IDS } from './recipePhotos'

export type RecipeCategory = 'dessert' | 'breakfast' | 'main' | 'snack'

export const CATEGORY_LABELS: Record<RecipeCategory, string> = {
  dessert: 'Protein desserts',
  breakfast: 'Breakfast',
  main: 'Lunch & dinner',
  snack: 'Snacks & shakes',
}

export type IngredientLine = [key: string, grams: number, label: string]

/** A recipe as written by hand: everything except the numbers, which are worked out. */
export interface RecipeSource {
  id: string
  title: string
  category: RecipeCategory
  /** One enticing line under the title. */
  blurb: string
  minutes: number
  servings: number
  /** What one serving is, e.g. "2 bites". */
  serves: string
  /** Extra tags (Filipino, Vegetarian, No bake...). "High protein", "Low carb" and the like are added from the numbers. */
  tags: string[]
  ingredients: IngredientLine[]
  steps: string[]
}

export interface Recipe extends RecipeSource {
  /** Per serving, rounded. */
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  /** The photo, when there is one (a file in /recipes). */
  photo?: string
  /** Who took the photo. */
  photoCredit?: { name: string; url: string; source: string }
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Per-serving numbers for a recipe's ingredients. */
export function nutritionOf(src: Pick<RecipeSource, 'ingredients' | 'servings'>) {
  let kcal = 0
  let p = 0
  let c = 0
  let f = 0
  for (const [key, grams] of src.ingredients) {
    const per = INGREDIENTS[key]
    if (!per) throw new Error(`Unknown ingredient "${key}"`)
    kcal += (per[0] * grams) / 100
    p += (per[1] * grams) / 100
    c += (per[2] * grams) / 100
    f += (per[3] * grams) / 100
  }
  const n = Math.max(1, src.servings)
  return { kcal: Math.round(kcal / n), proteinG: round1(p / n), carbsG: round1(c / n), fatG: round1(f / n) }
}

/** The tags a person can filter by: the ones written by hand, plus the ones the numbers earn. */
function tagsFor(src: RecipeSource, n: ReturnType<typeof nutritionOf>): string[] {
  const tags = new Set(src.tags)
  if (n.proteinG >= 25 || (n.proteinG >= 15 && (n.proteinG * 4) / n.kcal >= 0.25)) tags.add('High protein')
  if (n.kcal < 400) tags.add('Under 400 kcal')
  if (src.minutes <= 20) tags.add('Under 20 min')
  if (n.carbsG <= 20) tags.add('Low carb')
  return [...tags]
}

export const RECIPES: Recipe[] = RECIPE_DATA.map((src) => {
  const n = nutritionOf(src)
  return { ...src, ...n, tags: tagsFor(src, n), ...(PHOTO_IDS.has(src.id) ? { photo: `/recipes/${src.id}.jpg`, photoCredit: PHOTO_CREDITS[src.id] } : {}) }
})

export const FILTER_TAGS = ['High protein', 'Under 400 kcal', 'Under 20 min', 'Filipino', 'Vegetarian', 'Low carb'] as const

export function filterRecipes(
  list: Recipe[],
  opts: { category?: RecipeCategory | 'all'; tags?: string[]; query?: string },
): Recipe[] {
  const q = (opts.query ?? '').trim().toLowerCase()
  return list.filter((r) => {
    if (opts.category && opts.category !== 'all' && r.category !== opts.category) return false
    if (opts.tags?.some((t) => !r.tags.includes(t))) return false
    if (q && !(r.title.toLowerCase().includes(q) || r.blurb.toLowerCase().includes(q) || r.ingredients.some(([, , label]) => label.toLowerCase().includes(q)))) return false
    return true
  })
}

/** A recipe as one food, so it can be logged like anything else. */
export function recipeToFood(r: Recipe): FoodItem {
  return {
    id: `recipe-${r.id}`,
    name: r.title,
    serving: r.serves,
    kcal: r.kcal,
    proteinG: r.proteinG,
    carbsG: r.carbsG,
    fatG: r.fatG,
    note: `From the cookbook · ${r.minutes} min`,
    source: 'custom',
  }
}
