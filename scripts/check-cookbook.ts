// Run with: npm run test:cookbook
// Checks the cookbook: every recipe is complete, its numbers add up from its ingredients, and the tags and filters are honest.
import fs from 'node:fs'
import path from 'node:path'
import { INGREDIENTS } from '../src/lib/cookbook/ingredients'
import { CATEGORY_LABELS, RECIPES, filterRecipes, nutritionOf, recipeToFood } from '../src/lib/cookbook/cookbook'
import { RECIPE_DATA } from '../src/lib/cookbook/recipeData'

const problems: string[] = []
const check = (label: string, ok: boolean, detail = '') => {
  if (!ok) problems.push(`${label}${detail ? ': ' + detail : ''}`)
}

const MEAT_FISH = new Set(['chicken-breast', 'chicken-thigh', 'beef-sirloin', 'ground-beef-lean', 'ground-turkey', 'salmon', 'tuna-canned', 'bangus', 'tilapia', 'shrimp', 'chicken-broth', 'fish-sauce'])

const ids = new Set<string>()
for (const r of RECIPE_DATA) {
  check(`${r.id}: unique id`, !ids.has(r.id))
  ids.add(r.id)
  check(`${r.id}: id is lowercase with dashes`, /^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.id))
  check(`${r.id}: has a title and a blurb`, r.title.length >= 5 && r.blurb.length >= 20)
  check(`${r.id}: at least 2 ingredients`, r.ingredients.length >= 2)
  check(`${r.id}: at least 2 steps, each a real sentence`, r.steps.length >= 2 && r.steps.every((s) => s.length >= 15))
  check(`${r.id}: sensible time and servings`, r.minutes >= 2 && r.minutes <= 90 && r.servings >= 1 && r.servings <= 12)
  for (const [key, grams, label] of r.ingredients) {
    check(`${r.id}: ingredient "${key}" is known`, !!INGREDIENTS[key])
    check(`${r.id}: ingredient "${key}" has an amount and a label`, grams > 0 && grams <= 1500 && label.length >= 3)
  }
  const veg = r.tags.includes('Vegetarian')
  if (veg) check(`${r.id}: Vegetarian has no meat or fish`, !r.ingredients.some(([k]) => MEAT_FISH.has(k)))
}

for (const r of RECIPES) {
  const n = nutritionOf(r)
  check(`${r.id}: numbers match the ingredients`, n.kcal === r.kcal && n.proteinG === r.proteinG)
  check(`${r.id}: calories are sensible`, r.kcal >= 80 && r.kcal <= 800, String(r.kcal))
  // The four numbers must roughly agree (4 kcal per g of protein and carbs, 9 per g of fat; fiber and rounding explain the gap)
  const fromMacros = r.proteinG * 4 + r.carbsG * 4 + r.fatG * 9
  check(`${r.id}: calories agree with the macros`, Math.abs(fromMacros - r.kcal) / r.kcal <= 0.2, `${r.kcal} vs ${Math.round(fromMacros)}`)
  check(`${r.id}: High protein tag is earned`, !r.tags.includes('High protein') || r.proteinG >= 15)
  check(`${r.id}: Under 400 kcal tag is true`, !r.tags.includes('Under 400 kcal') || r.kcal < 400)
  check(`${r.id}: Low carb tag is true`, !r.tags.includes('Low carb') || r.carbsG <= 20)
}

// The cookbook is rich enough, and the desserts are the star
for (const c of Object.keys(CATEGORY_LABELS)) check(`category ${c} has recipes`, RECIPES.filter((r) => r.category === c).length >= 5)
check('at least 10 protein desserts', RECIPES.filter((r) => r.category === 'dessert').length >= 10)
check('the named desserts are there', ['cookie-dough-protein-bites', 'fluffy-protein-pancakes', 'protein-ice-cream'].every((id) => RECIPES.some((r) => r.id === id)))
check('at least 8 Filipino recipes', RECIPES.filter((r) => r.tags.includes('Filipino')).length >= 8)
check('at least 10 vegetarian recipes', RECIPES.filter((r) => r.tags.includes('Vegetarian')).length >= 10)
check('at least 20 high-protein recipes', RECIPES.filter((r) => r.tags.includes('High protein')).length >= 20)

// Photos: every recipe has one, it is a real file that is not too big, and its photographer is credited
for (const r of RECIPES) {
  check(`${r.id}: has a photo`, !!r.photo)
  const file = path.join(process.cwd(), 'public', 'recipes', `${r.id}.jpg`)
  const ok = fs.existsSync(file)
  check(`${r.id}: photo file exists`, ok)
  if (ok) check(`${r.id}: photo is under 300 KB`, fs.statSync(file).size < 300 * 1024, `${Math.round(fs.statSync(file).size / 1024)} KB`)
  check(`${r.id}: photo is credited`, !!r.photoCredit?.name && /^https:\/\//.test(r.photoCredit?.url ?? ''))
}

// Filtering and logging
check('category filter', filterRecipes(RECIPES, { category: 'dessert' }).every((r) => r.category === 'dessert'))
check('tag filters combine', filterRecipes(RECIPES, { tags: ['Filipino', 'High protein'] }).every((r) => r.tags.includes('Filipino') && r.tags.includes('High protein')))
check('search by title', filterRecipes(RECIPES, { query: 'pancake' }).some((r) => r.id === 'fluffy-protein-pancakes'))
check('search by ingredient', filterRecipes(RECIPES, { query: 'salmon' }).some((r) => r.id === 'teriyaki-salmon-bowl'))
check('search with no match', filterRecipes(RECIPES, { query: 'zzzzz' }).length === 0)
const food = recipeToFood(RECIPES[0])
check('a recipe can be logged as a food', food.name === RECIPES[0].title && food.kcal === RECIPES[0].kcal && food.proteinG === RECIPES[0].proteinG && food.serving === RECIPES[0].serves)

if (problems.length) {
  console.log('FAILED')
  for (const p of problems.slice(0, 30)) console.log(' - ' + p)
  process.exit(1)
}
console.log(`PASSED: ${RECIPES.length} recipes, each complete, with numbers that add up from its ingredients and honest tags.`)
