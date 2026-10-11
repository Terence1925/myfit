import { FILIPINO_FOODS } from './filipinoFoods'
import type { FoodItem } from '@/lib/types'

// Whole plates people actually eat, ready to log in one tap. Each is built from foods in the list, so the numbers
// stay consistent. [plate name, [[food name, how many of its serving], ...]]
const PLATE_DEFS: [string, [string, number][]][] = [
  // Filipino lunch and dinner
  ['Chicken adobo with rice', [['Chicken adobo', 1], ['Steamed white rice', 1]]],
  ['Pork adobo with rice', [['Pork adobo', 1], ['Steamed white rice', 1]]],
  ['Sinigang na baboy with rice', [['Sinigang na baboy', 1], ['Steamed white rice', 1]]],
  ['Chicken tinola with rice', [['Chicken tinola', 1], ['Steamed white rice', 1]]],
  ['Bistek tagalog with rice', [['Bistek tagalog', 1], ['Steamed white rice', 1]]],
  ['Kare-kare with rice', [['Kare-kare', 1], ['Steamed white rice', 1]]],
  ['Lechon kawali with rice', [['Lechon kawali', 1], ['Steamed white rice', 1]]],
  ['Pork sisig with rice', [['Pork sisig', 1], ['Steamed white rice', 1]]],
  ['Chicken inasal with rice', [['Chicken inasal', 1], ['Steamed white rice', 1]]],
  ['Pork barbecue (2 sticks) with rice', [['Pork barbecue', 2], ['Steamed white rice', 1]]],
  ['Fried tilapia with rice', [['Fried tilapia', 1], ['Steamed white rice', 1]]],
  ['Pritong galunggong, pinakbet and rice', [['Pritong galunggong', 2], ['Pinakbet', 1], ['Steamed white rice', 1]]],
  ['Chicken afritada with rice', [['Chicken afritada', 1], ['Steamed white rice', 1]]],
  ['Ginisang munggo with rice', [['Ginisang munggo', 1], ['Steamed white rice', 1]]],

  // Breakfast
  ['Pandesal, egg and coffee', [['Pandesal', 2], ['Fried egg', 2], ['3-in-1 coffee', 1]]],
  ['Oatmeal, banana and egg', [['Oatmeal, cooked', 1], ['Banana (lakatan)', 1], ['Boiled egg', 1]]],

  // Gym plates
  ['Grilled chicken breast (150 g), rice and broccoli', [['Chicken breast, cooked', 1.5], ['Steamed white rice', 1], ['Broccoli, steamed', 1]]],
  ['Beef steak, mashed potato and broccoli', [['Beef steak, sirloin, grilled', 1], ['Mashed potato', 1], ['Broccoli, steamed', 1]]],
  ['Salmon, rice and vegetables', [['Salmon, cooked', 1.5], ['Steamed white rice', 1], ['Steamed mixed vegetables', 1]]],
  ['Tuna, rice and boiled egg', [['Tuna in water (canned)', 1], ['Steamed white rice', 1], ['Boiled egg', 1]]],
]

const BY_NAME = new Map(FILIPINO_FOODS.map((f) => [f.name, f]))

/** One FoodItem per plate, with the totals of everything on it. */
export const PLATES: FoodItem[] = PLATE_DEFS.flatMap(([name, parts], i) => {
  const rows = parts.map(([foodName, count]) => ({ food: BY_NAME.get(foodName), count }))
  if (rows.some((r) => !r.food)) return []
  const sum = (pick: (f: FoodItem) => number) =>
    Math.round(rows.reduce((s, r) => s + pick(r.food as FoodItem) * r.count, 0) * 10) / 10
  return [
    {
      id: `plate-${i}`,
      name,
      serving: '1 plate',
      kcal: Math.round(sum((f) => f.kcal)),
      proteinG: sum((f) => f.proteinG),
      carbsG: sum((f) => f.carbsG),
      fatG: sum((f) => f.fatG),
      note: rows.map((r) => `${r.count === 1 ? '' : `${r.count} × `}${(r.food as FoodItem).name}`).join(' + '),
      source: 'ph' as const,
    },
  ]
})
