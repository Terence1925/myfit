import type { FoodItem } from '@/lib/types'

// The food list started Filipino. People elsewhere should not have to wade through adobo to find a burger, and
// Filipino users should still find their dishes one tap away. "Everyday" hides Filipino dishes, "Filipino" shows only
// them, "All" shows everything.
export type FoodRegion = 'everyday' | 'filipino' | 'all'

export const REGION_LABELS: Record<FoodRegion, string> = {
  everyday: 'Everyday',
  filipino: 'Filipino',
  all: 'All',
}

// Dish and brand names that only make sense in the Philippines. Plain ingredients that are eaten everywhere
// (tilapia, corned beef, sweet potato, shrimp) are deliberately NOT here, so they stay in "Everyday".
const FILIPINO =
  /adobo|sinigang|tinola|nilaga|bulalo|kare-kare|sisig|lechon|liempo|longganisa|tocino|\btapa\b|tapsilog|bistek|pancit|lumpia|siopao|halo-halo|bangus|galunggong|tuyo|daing|dinuguan|pinakbet|ginataang|ginisang|laing|kinilaw|paksiw|sinangag|garlic fried rice|silog|champorado|pandesal|\bputo\b|bibingka|kakanin|kutsinta|suman|turon|banana cue|kamote cue|\bube\b|leche flan|taho|balut|lugaw|arroz caldo|\bgoto\b|mami|batchoy|bagnet|crispy pata|menudo|afritada|caldereta|mechado|embutido|pochero|tokwa't|ensalada|ensaladang|gising|chopsuey|okoy|isaw|kwek|fishball|kikiam|halaya|\bbiko\b|sapin|polvoron|pastillas|yema|dilis|hopia|ensaymada|monay|spanish bread|pan de coco|egg pie|buko pie|buko salad|tinapa|danggit|jollibee|chickenjoy|yumburger|mang inasal|inasal|greenwich|red ribbon|goldilocks|max's|pares|salpicao|humba|giniling|binagoongan|bicol express|bopis|pastel|palabok|malabon|sotanghon|lomi|escabeche|atchara|dinengdeng|bulanglang|kalabasa|tortang|sago at gulaman|inihaw|skyflakes|chippy|nova |cloud 9|piattos|betamax|adidas|maja|bilo-bilo|palitaw|bumbong|cassava cake|pichi|mais con|filipino|3-in-1|pandan|chicharon|lechon manok|lechon baboy|pork barbecue|sarciado|pinapaitan|balbacua|lengua|morcon|sinampalukan|fita|banana chips|bayabas|lanzones|calamansi|tablea|malunggay|ampalaya|sitaw|saba banana/i

export function isFilipinoFood(food: Pick<FoodItem, 'name'>): boolean {
  return FILIPINO.test(food.name)
}

export function matchesRegion(isFilipino: boolean, region: FoodRegion): boolean {
  if (region === 'all') return true
  return region === 'filipino' ? isFilipino : !isFilipino
}

/** Reorder a list so the chosen region comes first. Nothing is removed (a search should never hide a result). */
export function regionFirst<T extends Pick<FoodItem, 'name'>>(foods: T[], region: FoodRegion): T[] {
  if (region === 'all') return foods
  const want = region === 'filipino'
  return [...foods.filter((f) => isFilipinoFood(f) === want), ...foods.filter((f) => isFilipinoFood(f) !== want)]
}

const REGION_KEY = 'myfit_food_region'
const UNITS_KEY = 'myfit_food_units'

/** Philippines: show everything (Filipino dishes are what people there eat). Everywhere else: everyday foods first. */
export function guessRegion(): FoodRegion {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const lang = (navigator.language || '').toLowerCase()
    if (tz === 'Asia/Manila' || lang === 'en-ph' || lang.startsWith('fil') || lang.startsWith('tl')) return 'all'
  } catch {
    /* fall through */
  }
  return 'everyday'
}

export function loadRegion(): FoodRegion {
  try {
    const v = localStorage.getItem(REGION_KEY)
    if (v === 'everyday' || v === 'filipino' || v === 'all') return v
  } catch {
    /* private mode: just use the guess */
  }
  return guessRegion()
}

export function saveRegion(region: FoodRegion) {
  try {
    localStorage.setItem(REGION_KEY, region)
  } catch {
    /* nothing to do */
  }
}

// ---- grams / ounces ----
export type FoodUnits = 'metric' | 'imperial'

/** Grams per ounce, and millilitres per US fluid ounce. */
export const G_PER_OZ = 28.3495
export const ML_PER_FLOZ = 29.5735

/** The United States (and a few others) think in ounces. Everyone else gets grams until they pick. */
export function guessUnits(): FoodUnits {
  try {
    const lang = (navigator.language || '').toLowerCase()
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    if (lang === 'en-us' || lang === 'en-lr' || lang === 'my-mm' || tz.startsWith('America/New_York') || tz.startsWith('America/Chicago') || tz.startsWith('America/Denver') || tz.startsWith('America/Los_Angeles')) {
      return 'imperial'
    }
  } catch {
    /* fall through */
  }
  return 'metric'
}

export function loadUnits(): FoodUnits {
  try {
    const v = localStorage.getItem(UNITS_KEY)
    if (v === 'metric' || v === 'imperial') return v
  } catch {
    /* use the guess */
  }
  return guessUnits()
}

export function saveUnits(units: FoodUnits) {
  try {
    localStorage.setItem(UNITS_KEY, units)
  } catch {
    /* nothing to do */
  }
}

/** Name of the unit shown to the person for a food measured in g or ml. */
export function unitLabel(base: 'g' | 'ml', units: FoodUnits): string {
  if (units === 'metric') return base
  return base === 'ml' ? 'fl oz' : 'oz'
}

export function toBase(value: number, base: 'g' | 'ml', units: FoodUnits): number {
  if (units === 'metric') return value
  return value * (base === 'ml' ? ML_PER_FLOZ : G_PER_OZ)
}

export function fromBase(value: number, base: 'g' | 'ml', units: FoodUnits): number {
  if (units === 'metric') return value
  return value / (base === 'ml' ? ML_PER_FLOZ : G_PER_OZ)
}
