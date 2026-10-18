// Run with: npm run test:online-foods
// Checks how the online food search reads USDA and Open Food Facts answers (sample data, no internet needed).
import { mergeFoods, parseOff, parseUsda, tidyName } from '../supabase/functions/food-search/index'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

const nutrients = (kcal: number, p: number, c: number, f: number) => [
  { nutrientId: 1008, nutrientNumber: '208', value: kcal },
  { nutrientId: 1003, nutrientNumber: '203', value: p },
  { nutrientId: 1005, nutrientNumber: '205', value: c },
  { nutrientId: 1004, nutrientNumber: '204', value: f },
]

const usda = parseUsda({
  foods: [
    { fdcId: 1, description: 'Chicken, broilers or fryers, breast, cooked', foodNutrients: nutrients(165, 31, 0, 3.6) },
    { fdcId: 2, description: 'GREEK YOGURT', brandOwner: 'FAGE USA', servingSize: 170, servingSizeUnit: 'g', foodNutrients: nutrients(60, 10, 4, 0) },
    { fdcId: 3, description: 'COLA', brandOwner: 'SOME BRAND', servingSize: 355, servingSizeUnit: 'ml', foodNutrients: nutrients(40, 0, 10.6, 0) },
    // Foundation foods may only have the Atwater energy figure
    { fdcId: 4, description: 'Avocado, raw', foodNutrients: [{ nutrientId: 2047, value: 160 }, { nutrientId: 1003, value: 2 }, { nutrientId: 1005, value: 8.5 }, { nutrientId: 1004, value: 14.7 }] },
    { fdcId: 5, description: 'Pepper', brandOwner: 'SPICE CO', servingSize: 1, servingSizeUnit: 'g', foodNutrients: nutrients(0, 0, 0, 0) },
    { fdcId: 6, description: 'No energy listed', foodNutrients: [{ nutrientId: 1003, value: 5 }] },
  ],
})
check('USDA: keeps 4 usable foods', usda.length, 4)
check('USDA plain food is per 100 g', [usda[0].serving, usda[0].kcal, usda[0].proteinG, usda[0].amount, usda[0].unit], ['100 g', 165, 31, 100, 'g'])
check('USDA brand is scaled to its serving', [usda[1].name, usda[1].serving, usda[1].kcal, usda[1].proteinG, usda[1].carbsG], ['Greek yogurt (Fage Usa)', '170 g', 102, 17, 6.8])
check('USDA drink is in ml', [usda[2].serving, usda[2].unit, usda[2].kcal], ['355 ml', 'ml', 142])
check('USDA Atwater energy is used', usda[3].kcal, 160)
check('USDA ids and source', [usda[0].id, usda[0].source], ['usda-1', 'usda'])

const off = parseOff({
  products: [
    { code: '111', product_name: 'Chocolate bar', brands: 'Acme, Other', serving_quantity: 40, serving_size: '40 g', nutriments: { 'energy-kcal_100g': 500, proteins_100g: 6, carbohydrates_100g: 55, fat_100g: 28 } },
    { code: '222', product_name: 'Orange juice', brands: '', serving_quantity: 250, serving_size: '250 ml', nutriments: { 'energy-kcal_100g': 44, proteins_100g: 0.7, carbohydrates_100g: 10, fat_100g: 0.2 } },
    { code: '333', product_name: 'Plain rice', nutriments: { 'energy-kcal_100g': 130, proteins_100g: 2.7, carbohydrates_100g: 28, fat_100g: 0.3 } },
    { code: '444', product_name: 'No numbers', nutriments: {} },
    { code: '555', product_name: '', nutriments: { 'energy-kcal_100g': 10 } },
  ],
})
check('OFF: keeps 3 usable products', off.length, 3)
check('OFF bar is scaled to its serving', [off[0].name, off[0].serving, off[0].kcal, off[0].carbsG], ['Chocolate bar (Acme)', '40 g', 200, 22])
check('OFF drink is in ml', [off[1].serving, off[1].unit, off[1].kcal], ['250 ml', 'ml', 110])
check('OFF without a serving is per 100 g', [off[2].serving, off[2].kcal], ['100 g', 130])
check('OFF source', off[0].source, 'openfoodfacts')

const merged = mergeFoods([usda[0], usda[0]], [off[0], { ...usda[0], name: usda[0].name.toUpperCase() }])
check('merge lists a repeat once and keeps USDA first', [merged.length, merged[0].source], [2, 'usda'])
check('all caps names are tidied', [tidyName('COCA COLA'), tidyName('Chicken Breast')], ['Coca cola', 'Chicken Breast'])

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: USDA and Open Food Facts answers are read, scaled to a serving and merged correctly.')
