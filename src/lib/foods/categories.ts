import { FILIPINO_FOODS } from './filipinoFoods'
import type { FoodItem } from '@/lib/types'

export type FoodCategoryId =
  | 'rice-breakfast'
  | 'beef'
  | 'pork'
  | 'chicken'
  | 'seafood'
  | 'vegetables'
  | 'soups-noodles'
  | 'snacks'
  | 'fruit'
  | 'drinks'
  | 'fast-food'
  | 'international'
  | 'pantry'

export const FOOD_CATEGORIES: { id: FoodCategoryId; label: string }[] = [
  { id: 'rice-breakfast', label: 'Rice & breakfast' },
  { id: 'beef', label: 'Beef' },
  { id: 'pork', label: 'Pork' },
  { id: 'chicken', label: 'Chicken' },
  { id: 'seafood', label: 'Fish & seafood' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'soups-noodles', label: 'Soups & noodles' },
  { id: 'snacks', label: 'Snacks & sweets' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'fast-food', label: 'Fast food' },
  { id: 'international', label: 'International' },
  { id: 'pantry', label: 'Protein, dairy & pantry' },
]

// Checked in this order, so the first match wins ("Tuna steak" is seafood, not beef).
const RULES: [FoodCategoryId, RegExp][] = [
  ['fast-food', /^(burger \(small|french fries|pizza|jollibee|mcdonald|kfc|burger king|fish fillet burger|sub sandwich|hotdog sandwich|corn dog|siopao)/i],
  ['international', /siomai|gyoza|hakaw|egg roll|yang chow|sweet and sour|kung pao|orange chicken|chow mein|ramen|sushi|nigiri|sashimi|tempura|katsu|teriyaki|takoyaki|miso|bulgogi|samgyeopsal|kimchi|bibimbap|tteokbokki|kimbap|pad thai|tom yum|green curry|^pho$|banh mi|biryani|butter chicken|naan|hummus|falafel|shawarma|kebab|tacos|burrito|nachos|lasagna|carbonara|caesar|club sandwich|grilled cheese|mac and cheese|fish and chips/i],
  ['rice-breakfast', /silog|champorado|ube cheese pandesal|^(steamed white rice|garlic fried rice|brown rice|pandesal|white bread|oatmeal|boiled egg|fried egg|scrambled egg|egg whites|omelet|quail eggs|salted egg|cornflakes|granola|pancakes|tortilla|rolled oats)/i],
  ['seafood', /isda|prawn|sugpo|tinapa|danggit|dried squid|okoy|fish|bangus|tilapia|galunggong|tuna|sardine|shrimp|salmon|squid|pusit|calamares|mussel|crab|kinilaw|tuyo|escabeche|daing|hipon/i],
  ['pork', /pork|baboy|sisig|lechon (kawali|baboy)|liempo|bacon|^ham|sausage|longganisa|tocino|dinuguan|menudo|humba|crispy pata|embutido|hotdog|chicharon|barbecue|luncheon|giniling|binagoongan|bicol express|bopis/i],
  ['beef', /beef|baka|bistek|kare-kare|caldereta|bulalo|steak|ribeye|tapa|brisket|tenderloin|pares|mechado|salpicao|jerky|roast beef/i],
  ['chicken', /chicken|manok|inasal|nuggets/i],
  ['soups-noodles', /batchoy|lomi|palabok|malabon|sotanghon|pancit|spaghetti|noodle|lugaw|arroz caldo|goto|mami|pasta/i],
  ['snacks', /fishball|kikiam|kwek|isaw|betamax|adidas|banana chips|oreo|fita|chippy|nova |cloud 9|biko|sapin|palitaw|bumbong|cassava cake|pichi|ensaymada|hopia|monay|spanish bread|pan de coco|egg pie|buko pie|polvoron|pastillas|yema|mais con|buko salad|fruit salad|turon|banana cue|kamote cue|puto|kutsinta|bibingka|suman|halo-halo|balut|^peanuts$|skyflakes|chips|ice cream|flan|maja|bilo-bilo|ube|chocolate|taho/i],
  ['fruit', /banana|saba|mango|papaya|pineapple|^apple|watermelon|avocado|orange|grapes|strawberr|guava|lanzones|jackfruit|dragon fruit/i],
  ['vegetables', /ensalada|atchara|ginisang|dinengdeng|bulanglang|lumpiang gulay|langka|pinakbet|munggo|chopsuey|laing|kalabasa|tortang talong|kangkong|vegetable|salad|broccoli|carrot|cabbage|ampalaya|okra|malunggay|spinach|eggplant|tomato|cucumber|sitaw|kamote|corn|potato|cassava/i],
]

// Dishes whose names would otherwise land in the wrong group ("Chicken sisig" contains "sisig", which is pork).
const OVERRIDES: Record<string, FoodCategoryId> = {
  'Chicken sisig': 'chicken',
  'Chicken caldereta': 'chicken',
  'Paksiw na lechon': 'pork',
  Pinapaitan: 'beef',
  Balbacua: 'beef',
  'Lengua estofado': 'beef',
  Morcon: 'beef',
}

export function categoryOf(food: FoodItem): FoodCategoryId {
  if (OVERRIDES[food.name]) return OVERRIDES[food.name]
  if (food.unit === 'ml' && !/oil|soy sauce|evaporated|taho/i.test(food.name)) return 'drinks'
  for (const [id, re] of RULES) if (re.test(food.name)) return id
  return 'pantry'
}

const BY_CATEGORY = new Map<FoodCategoryId, FoodItem[]>()
for (const food of FILIPINO_FOODS) {
  const id = categoryOf(food)
  BY_CATEGORY.set(id, [...(BY_CATEGORY.get(id) ?? []), food])
}

export function foodsInCategory(id: FoodCategoryId): FoodItem[] {
  return (BY_CATEGORY.get(id) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))
}
