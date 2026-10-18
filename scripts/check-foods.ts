// Run with: npm run test:foods
// Checks the Everyday / Filipino split, the neutral plates, the new searches and the ounce conversion.
import { FILIPINO_FOODS, searchFoods } from '../src/lib/foods/filipinoFoods'
import { FOOD_CATEGORIES, foodsInCategory } from '../src/lib/foods/categories'
import { isFilipinoPlate, PLATES } from '../src/lib/foods/plates'
import { fromBase, isFilipinoFood, matchesRegion, regionFirst, toBase } from '../src/lib/foods/region'

const problems: string[] = []
const check = (label: string, ok: boolean, detail = '') => {
  if (!ok) problems.push(`${label}${detail ? ': ' + detail : ''}`)
}

// Dishes that must be Filipino, and everyday foods that must not be
for (const n of ['Chicken adobo', 'Kare-kare', 'Pandesal', 'Jollibee Chickenjoy, 1 piece', 'Halo-halo', 'Dilis (dried anchovies), fried', 'Tapsilog (tapa, rice, egg)'])
  check(`${n} is Filipino`, isFilipinoFood({ name: n }))
for (const n of ['Steamed white rice', 'Chicken breast, cooked', 'Salmon, cooked', 'Pizza, pepperoni', 'Burger (small, fast food)', 'Fried tilapia', 'Corned beef (canned)', 'Kamote (sweet potato), boiled', 'Beef tacos', "McDonald's Big Mac", 'Bagel, plain'])
  check(`${n} is everyday`, !isFilipinoFood({ name: n }))

// Every food belongs to exactly one of the two lists, and "All" shows everything
const fil = FILIPINO_FOODS.filter(isFilipinoFood).length
check('all foods are counted', fil + FILIPINO_FOODS.filter((f) => !isFilipinoFood(f)).length === FILIPINO_FOODS.length)
check('Everyday has plenty', FILIPINO_FOODS.length - fil >= 180, String(FILIPINO_FOODS.length - fil))
check('Filipino has plenty', fil >= 120, String(fil))

// Each region still has a useful set of groups
const groups = (region: 'everyday' | 'filipino') =>
  FOOD_CATEGORIES.filter((c) => foodsInCategory(c.id).some((f) => matchesRegion(isFilipinoFood(f), region))).map((c) => c.id)
for (const id of ['beef', 'pork', 'chicken', 'seafood', 'vegetables', 'fruit', 'drinks', 'snacks', 'fast-food', 'rice-breakfast', 'pantry'] as const)
  check(`Everyday has a "${id}" group`, groups('everyday').includes(id))
for (const id of ['beef', 'pork', 'chicken', 'seafood', 'soups-noodles'] as const) check(`Filipino has a "${id}" group`, groups('filipino').includes(id))

// Plates: both regions have plenty, the ids are unique and none is lost to a typo in a food name
check('34 plates resolve', PLATES.length === 34, String(PLATES.length))
check('Everyday plates >= 15', PLATES.filter((p) => !isFilipinoPlate(p)).length >= 15)
check('Filipino plates >= 14', PLATES.filter(isFilipinoPlate).length >= 14)
check('plate ids unique', new Set(PLATES.map((p) => p.id)).size === PLATES.length)
check('Burger and fries is everyday', PLATES.some((p) => p.name === 'Burger and fries' && !isFilipinoPlate(p)))
check('Chicken adobo plate is Filipino', PLATES.some((p) => p.name === 'Chicken adobo with rice' && isFilipinoPlate(p)))

// Searches people would type
for (const q of ['dilis', 'omelette', 'toast', 'coke', 'bagel', 'cereal', 'steak', 'pasta', 'sushi', 'burger', 'chicken breast', 'egg', 'adobo'])
  check(`search "${q}" finds something`, searchFoods(q).length > 0)

// Region order: the chosen region first, nothing removed
const eggs = searchFoods('chicken', 60)
const everyday = regionFirst(eggs, 'everyday')
check('search keeps every result', everyday.length === eggs.length)
check('Everyday search puts everyday first', !isFilipinoFood(everyday[0]))
check('Filipino search puts Filipino first', isFilipinoFood(regionFirst(eggs, 'filipino')[0]))

// Ounces: 100 g is about 3.5 oz; 250 ml is about 8.5 fl oz; converting back returns the same number
const oz = fromBase(100, 'g', 'imperial')
check('100 g in oz', Math.abs(oz - 3.527) < 0.01, String(oz))
check('250 ml in fl oz', Math.abs(fromBase(250, 'ml', 'imperial') - 8.454) < 0.01)
check('oz round trip', Math.abs(toBase(oz, 'g', 'imperial') - 100) < 1e-9)
check('metric is unchanged', toBase(150, 'g', 'metric') === 150 && fromBase(150, 'ml', 'metric') === 150)

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log(`PASSED: ${FILIPINO_FOODS.length - fil} everyday + ${fil} Filipino foods, ${PLATES.length} plates, searches and ounces all work.`)
