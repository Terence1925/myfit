import type { FoodItem } from '@/lib/types'
import { EXTRA_FOODS } from './extraFoods'
import { MORE_FOODS, SEARCH_KEYWORDS } from './moreFoods'

// Common foods in the Philippines, with typical numbers for ONE serving. These are honest estimates (recipes
// and brands vary), so the Food tab labels them "approx." [name, serving, kcal, protein g, carbs g, fat g]
type Row = [string, string, number, number, number, number]

const ROWS: Row[] = [
  // Rice, bread, breakfast
  ['Steamed white rice', '1 cup', 205, 4, 45, 0.4],
  ['Garlic fried rice (sinangag)', '1 cup', 290, 5, 46, 9],
  ['Brown rice', '1 cup', 215, 5, 45, 2],
  ['Pandesal', '1 piece', 105, 3.4, 19, 1.6],
  ['White bread', '1 slice', 80, 2.5, 15, 1],
  ['Oatmeal, cooked', '1 cup', 160, 6, 28, 3],
  ['Boiled egg', '1 large', 78, 6, 0.6, 5],
  ['Fried egg', '1 large', 90, 6, 0.4, 7],
  ['Scrambled egg', '1 egg', 100, 6, 1, 8],
  ['Egg whites', '3 whites', 51, 11, 0.7, 0.2],
  ['Tapsilog (tapa, rice, egg)', '1 plate', 650, 30, 70, 25],
  ['Longsilog (longganisa, rice, egg)', '1 plate', 720, 24, 72, 36],
  ['Tocilog (tocino, rice, egg)', '1 plate', 700, 24, 85, 28],
  ['Bangsilog (daing na bangus, rice, egg)', '1 plate', 640, 35, 68, 23],
  ['Hotsilog (hotdog, rice, egg)', '1 plate', 680, 22, 72, 32],
  ['Longganisa', '1 piece', 160, 8, 5, 12],
  ['Tocino', '3 pieces (100 g)', 250, 15, 20, 12],
  ['Beef tapa', '100 g', 220, 25, 8, 9],
  ['Daing na bangus', '1 piece', 280, 30, 0, 17],
  ['Hotdog', '1 piece', 140, 5, 3, 12],
  ['Corned beef (canned)', '100 g', 210, 14, 2, 16],
  ['Luncheon meat (Spam type)', '2 slices', 180, 7, 2, 16],
  ['Sardines in tomato sauce', '1 can', 200, 20, 8, 10],
  ['Tuna in water (canned)', '1 can', 120, 26, 0, 1],
  ['Tuna in oil (canned)', '1 can', 250, 25, 0, 16],

  // Ulam: meat and poultry
  ['Chicken adobo', '1 serving', 280, 26, 3, 18],
  ['Pork adobo', '1 serving', 370, 24, 4, 29],
  ['Chicken tinola', '1 bowl', 220, 24, 8, 10],
  ['Sinigang na baboy', '1 bowl', 330, 22, 12, 21],
  ['Sinigang na hipon', '1 bowl', 160, 20, 10, 4],
  ['Nilagang baka', '1 bowl', 310, 28, 14, 15],
  ['Bulalo', '1 bowl', 420, 30, 10, 29],
  ['Kare-kare', '1 serving', 480, 28, 14, 36],
  ['Pork sisig', '1 serving', 490, 26, 5, 41],
  ['Lechon kawali', '100 g', 420, 22, 0, 37],
  ['Lechon baboy (roast pork)', '100 g', 330, 25, 0, 25],
  ['Bistek tagalog', '1 serving', 310, 28, 8, 19],
  ['Beef caldereta', '1 serving', 390, 27, 12, 26],
  ['Pork menudo', '1 serving', 340, 20, 15, 23],
  ['Chicken afritada', '1 serving', 300, 24, 12, 18],
  ['Pork barbecue', '1 stick', 175, 11, 9, 10],
  ['Chicken inasal', '1 piece', 330, 35, 3, 20],
  ['Fried chicken', '1 piece', 300, 22, 10, 19],
  ['Grilled liempo', '100 g', 380, 17, 0, 34],
  ['Dinuguan', '1 serving', 280, 18, 6, 20],
  ['Lumpiang shanghai', '3 pieces', 210, 8, 15, 13],
  ['Fresh lumpia', '1 piece', 150, 5, 20, 6],

  // Ulam: fish and vegetables
  ['Fried tilapia', '1 medium', 200, 28, 0, 9],
  ['Pritong galunggong', '1 piece', 160, 18, 0, 10],
  ['Escabeche (sweet and sour fish)', '1 serving', 280, 25, 12, 15],
  ['Kinilaw', '1 serving', 130, 20, 4, 3],
  ['Pinakbet', '1 cup', 120, 5, 14, 5],
  ['Ginisang munggo', '1 bowl', 220, 12, 30, 6],
  ['Chopsuey', '1 cup', 150, 8, 12, 8],
  ['Laing', '1/2 cup', 210, 5, 8, 18],
  ['Ginataang kalabasa at sitaw', '1 cup', 180, 6, 14, 11],
  ['Tortang talong', '1 piece', 170, 8, 7, 12],
  ['Adobong kangkong', '1 cup', 110, 4, 7, 8],
  ['Steamed mixed vegetables', '1 cup', 60, 3, 12, 0.3],
  ['Green salad', '1 bowl', 35, 2, 7, 0.3],

  // Noodles and soups
  ['Pancit canton', '1 cup', 330, 10, 47, 11],
  ['Pancit bihon', '1 cup', 250, 10, 33, 8],
  ['Filipino-style spaghetti', '1 cup', 360, 13, 50, 12],
  ['Lugaw', '1 bowl', 200, 5, 38, 3],
  ['Arroz caldo', '1 bowl', 250, 12, 36, 6],
  ['Goto', '1 bowl', 280, 13, 36, 9],
  ['Mami (chicken or beef)', '1 bowl', 330, 17, 45, 8],
  ['Instant pancit canton', '1 pack', 270, 6, 37, 11],
  ['Cup noodles', '1 cup', 300, 6, 40, 13],

  // Snacks and sweets
  ['Turon', '1 piece', 230, 2, 38, 8],
  ['Banana cue', '1 stick', 250, 1, 45, 8],
  ['Kamote cue', '1 stick', 220, 1, 42, 6],
  ['Puto', '1 piece', 100, 2, 20, 1.5],
  ['Kutsinta', '1 piece', 70, 0.5, 16, 0.1],
  ['Bibingka', '1 piece', 230, 5, 35, 8],
  ['Suman', '1 piece', 160, 2, 32, 3],
  ['Halo-halo', '1 glass', 350, 6, 65, 8],
  ['Taho', '1 cup', 140, 6, 25, 2],
  ['Balut', '1 egg', 190, 14, 1, 14],
  ['Chicharon (pork rinds)', '30 g', 160, 17, 0, 10],
  ['Peanuts', '30 g', 170, 7, 5, 14],
  ['Skyflakes crackers', '1 pack', 110, 2, 17, 3.5],
  ['Potato chips', '1 small pack', 210, 2, 23, 12],
  ['Ice cream', '1 scoop', 200, 3, 24, 11],
  ['Leche flan', '1 slice', 150, 4, 20, 6],
  ['Maja blanca', '1 piece', 120, 1, 22, 3],
  ['Ginataang bilo-bilo', '1 bowl', 330, 3, 60, 9],

  // Drinks
  ['3-in-1 coffee', '1 sachet', 80, 1, 16, 1.5],
  ['Black coffee', '1 cup', 2, 0.3, 0, 0],
  ['Milk tea with pearls', '500 ml', 380, 2, 75, 7],
  ['Soft drink', '1 can (330 ml)', 140, 0, 35, 0],
  ['Buko juice', '1 glass', 60, 1, 14, 0.5],
  ['Fresh milk', '1 cup', 150, 8, 12, 8],
  ['Orange juice', '1 glass', 110, 2, 26, 0.4],
  ['Sago at gulaman', '1 glass', 150, 0, 38, 0],
  ['Beer', '1 bottle (330 ml)', 140, 1, 11, 0],

  // Fruit
  ['Banana (lakatan)', '1 medium', 105, 1.3, 27, 0.4],
  ['Saba banana', '1 piece', 110, 1, 28, 0.2],
  ['Ripe mango', '1 cup', 100, 1.4, 25, 0.6],
  ['Papaya', '1 cup', 60, 1, 15, 0.4],
  ['Pineapple', '1 cup', 80, 0.9, 21, 0.2],
  ['Apple', '1 medium', 95, 0.5, 25, 0.3],
  ['Watermelon', '1 cup', 46, 1, 12, 0.2],
  ['Avocado', '1/2 fruit', 160, 2, 9, 15],

  // Gym staples
  ['Chicken breast, cooked', '100 g', 165, 31, 0, 3.6],
  ['Chicken thigh, skinless, cooked', '100 g', 209, 26, 0, 11],
  ['Beef sirloin, cooked', '100 g', 230, 27, 0, 13],
  ['Pork loin, cooked', '100 g', 242, 27, 0, 14],
  ['Salmon, cooked', '100 g', 206, 22, 0, 12],
  ['Shrimp, cooked', '100 g', 99, 24, 0.2, 0.3],
  ['Whey protein', '1 scoop (30 g)', 120, 24, 3, 1.5],
  ['Greek yogurt, plain', '170 g', 100, 17, 6, 0.7],
  ['Tokwa (firm tofu)', '100 g', 145, 16, 3, 9],
  ['Peanut butter', '1 tbsp', 95, 4, 3, 8],
  ['Rolled oats, dry', '1/2 cup', 150, 5, 27, 2.5],
  ['Cheese slice', '1 slice', 70, 4, 1, 6],
  ['Kamote (sweet potato), boiled', '1 medium', 110, 2, 26, 0.2],
  ['Boiled corn', '1 ear', 125, 4, 28, 1.5],

  // Fast food
  ['Burger (small, fast food)', '1 piece', 250, 12, 28, 10],
  ['French fries (small)', '1 small', 230, 3, 30, 11],
  ['Pizza, thin crust', '1 slice', 240, 10, 28, 10],
]

// What one serving weighs in grams (or measures in ml for drinks). Estimates, like the numbers above.
const AMOUNTS: Record<string, number> = {
  'Steamed white rice': 160, 'Garlic fried rice (sinangag)': 170, 'Brown rice': 195, 'Pandesal': 35, 'White bread': 30,
  'Oatmeal, cooked': 234, 'Boiled egg': 50, 'Fried egg': 46, 'Scrambled egg': 61, 'Egg whites': 99,
  'Tapsilog (tapa, rice, egg)': 450, 'Longsilog (longganisa, rice, egg)': 480, 'Tocilog (tocino, rice, egg)': 480,
  'Bangsilog (daing na bangus, rice, egg)': 480, 'Hotsilog (hotdog, rice, egg)': 460, 'Longganisa': 50, 'Tocino': 100,
  'Beef tapa': 100, 'Daing na bangus': 130, 'Hotdog': 50, 'Corned beef (canned)': 100, 'Luncheon meat (Spam type)': 60,
  'Sardines in tomato sauce': 155, 'Tuna in water (canned)': 155, 'Tuna in oil (canned)': 155,
  'Chicken adobo': 150, 'Pork adobo': 150, 'Chicken tinola': 350, 'Sinigang na baboy': 350, 'Sinigang na hipon': 350,
  'Nilagang baka': 350, 'Bulalo': 400, 'Kare-kare': 250, 'Pork sisig': 150, 'Lechon kawali': 100,
  'Lechon baboy (roast pork)': 100, 'Bistek tagalog': 200, 'Beef caldereta': 200, 'Pork menudo': 200,
  'Chicken afritada': 200, 'Pork barbecue': 70, 'Chicken inasal': 220, 'Fried chicken': 140, 'Grilled liempo': 100,
  'Dinuguan': 200, 'Lumpiang shanghai': 75, 'Fresh lumpia': 100, 'Fried tilapia': 120, 'Pritong galunggong': 80,
  'Escabeche (sweet and sour fish)': 200, 'Kinilaw': 150, 'Pinakbet': 150, 'Ginisang munggo': 300, 'Chopsuey': 150,
  'Laing': 100, 'Ginataang kalabasa at sitaw': 200, 'Tortang talong': 100, 'Adobong kangkong': 130,
  'Steamed mixed vegetables': 150, 'Green salad': 150, 'Pancit canton': 200, 'Pancit bihon': 200,
  'Filipino-style spaghetti': 250, 'Lugaw': 300, 'Arroz caldo': 300, 'Goto': 300, 'Mami (chicken or beef)': 400,
  'Instant pancit canton': 60, 'Cup noodles': 60, 'Turon': 100, 'Banana cue': 130, 'Kamote cue': 120, 'Puto': 40,
  'Kutsinta': 40, 'Bibingka': 100, 'Suman': 80, 'Halo-halo': 350, 'Taho': 240, 'Balut': 70, 'Chicharon (pork rinds)': 30,
  'Peanuts': 30, 'Skyflakes crackers': 25, 'Potato chips': 40, 'Ice cream': 100, 'Leche flan': 100, 'Maja blanca': 100,
  'Ginataang bilo-bilo': 300, '3-in-1 coffee': 20, 'Black coffee': 240, 'Milk tea with pearls': 500,
  'Soft drink': 330, 'Buko juice': 250, 'Fresh milk': 240, 'Orange juice': 250, 'Sago at gulaman': 250, 'Beer': 330,
  'Banana (lakatan)': 118, 'Saba banana': 100, 'Ripe mango': 165, 'Papaya': 145, 'Pineapple': 165, 'Apple': 182,
  'Watermelon': 152, 'Avocado': 100, 'Chicken breast, cooked': 100, 'Chicken thigh, skinless, cooked': 100,
  'Beef sirloin, cooked': 100, 'Pork loin, cooked': 100, 'Salmon, cooked': 100, 'Shrimp, cooked': 100,
  'Whey protein': 30, 'Greek yogurt, plain': 170, 'Tokwa (firm tofu)': 100, 'Peanut butter': 16, 'Rolled oats, dry': 40,
  'Cheese slice': 20, 'Kamote (sweet potato), boiled': 130, 'Boiled corn': 100, 'Burger (small, fast food)': 110,
  'French fries (small)': 70, 'Pizza, thin crust': 100,
}
const LIQUIDS = new Set([
  'Black coffee', 'Milk tea with pearls', 'Soft drink', 'Buko juice', 'Fresh milk', 'Orange juice', 'Sago at gulaman',
  'Beer', 'Taho',
])

const BASE_FOODS: FoodItem[] = ROWS.map(([name, serving, kcal, proteinG, carbsG, fatG], i) => ({
  id: `ph-${i}`,
  name,
  serving,
  kcal,
  proteinG,
  carbsG,
  fatG,
  amount: AMOUNTS[name],
  unit: LIQUIDS.has(name) ? ('ml' as const) : ('g' as const),
  source: 'ph' as const,
}))

/** Every built-in food: Filipino dishes first, then plain cuts, produce and drinks. */
export const FILIPINO_FOODS: FoodItem[] = [...BASE_FOODS, ...MORE_FOODS, ...EXTRA_FOODS]

/** Find foods that contain every word typed (in the name or its extra search words). Names that start with the search come first. */
export function searchFoods(query: string, limit = 25): FoodItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const hits = FILIPINO_FOODS.filter((f) => {
    const text = `${f.name} ${SEARCH_KEYWORDS[f.name] ?? ''}`.toLowerCase()
    return words.every((w) => text.includes(w))
  })
  const startsWith = (f: FoodItem) => (f.name.toLowerCase().startsWith(words[0]) ? 0 : 1)
  const inName = (f: FoodItem) => (words.every((w) => f.name.toLowerCase().includes(w)) ? 0 : 1)
  hits.sort((a, b) => startsWith(a) - startsWith(b) || inName(a) - inName(b) || a.name.length - b.name.length)
  return hits.slice(0, limit)
}
