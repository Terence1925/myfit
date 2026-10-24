// Supabase Edge Function: food-search
// Deploy: supabase functions deploy food-search   (or paste this file in the dashboard's function editor)
// Secrets: USDA_API_KEY (free, from https://fdc.nal.usda.gov/api-key-signup; set in the Supabase dashboard ->
// Edge Functions -> Secrets). Open Food Facts needs no key. SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and
// SUPABASE_ANON_KEY are provided automatically.
//
// Searches two free, worldwide food databases for the Food tab:
//   - USDA FoodData Central: plain foods, cooked dishes and US brands
//   - Open Food Facts: packaged foods from around the world (data under the ODbL licence, credited in the app)
// The key never leaves this server. Searching by name and looking up a scanned barcode are free for every signed-in member.
// Body: { query: string } or { barcode: string }. Returns { foods: [...] } in the app's food shape (a barcode gives one
// food, or none). If one database is down the other still answers.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'content-type': 'application/json' } })

export interface Food {
  id: string
  name: string
  serving: string
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  amount?: number
  unit?: 'g' | 'ml'
  source: 'usda' | 'openfoodfacts'
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** "CHICKEN BREAST, ROASTED" -> "Chicken breast, roasted". Mixed-case names are left alone. */
export function tidyName(raw: string): string {
  const name = raw.replace(/\s+/g, ' ').trim()
  if (name !== name.toUpperCase()) return name
  const lower = name.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/** "GIANT EAGLE" -> "Giant Eagle" (brand names read better in title case). */
function tidyBrand(raw: string): string {
  const b = raw.replace(/\s+/g, ' ').trim()
  return b === b.toUpperCase() || b === b.toLowerCase() ? b.toLowerCase().replace(/(^|[\s&(-])([a-z])/g, (_m, pre, c) => pre + c.toUpperCase()) : b
}

// ---- USDA FoodData Central ----

interface UsdaNutrient {
  nutrientId?: number
  nutrientNumber?: string
  value?: number
}

// Energy is nutrient 1008 (208); Foundation foods may only carry the Atwater figures 2047 / 2048
function usdaValue(list: UsdaNutrient[], ids: number[], numbers: string[]): number | null {
  for (const id of ids) {
    const hit = list.find((n) => n.nutrientId === id && typeof n.value === 'number')
    if (hit) return hit.value as number
  }
  for (const num of numbers) {
    const hit = list.find((n) => n.nutrientNumber === num && typeof n.value === 'number')
    if (hit) return hit.value as number
  }
  return null
}

// deno-lint-ignore no-explicit-any
export function parseUsda(data: any): Food[] {
  const foods: Food[] = []
  for (const f of data?.foods ?? []) {
    const list: UsdaNutrient[] = f.foodNutrients ?? []
    const kcal = usdaValue(list, [1008, 2047, 2048], ['208', '957', '958'])
    const protein = usdaValue(list, [1003], ['203'])
    const carbs = usdaValue(list, [1005], ['205'])
    const fat = usdaValue(list, [1004], ['204'])
    if (kcal === null || !f.description) continue
    // A spice listed per 1 g shows "0 kcal" and helps nobody
    if (Number(f.servingSize) > 0 && Number(f.servingSize) < 3) continue
    // USDA search numbers are per 100 g. A branded food that states its own serving is scaled to that serving.
    const servingSize = Number(f.servingSize)
    const servingUnit = String(f.servingSizeUnit ?? '').toLowerCase()
    const scalable = servingSize > 0 && servingSize <= 1000 && (servingUnit === 'g' || servingUnit === 'ml' || servingUnit === 'grm' || servingUnit === 'mlt')
    const unit: 'g' | 'ml' = servingUnit.startsWith('ml') ? 'ml' : 'g'
    const amount = scalable ? servingSize : 100
    const k = amount / 100
    const brand = f.brandName || f.brandOwner
    const base = tidyName(String(f.description))
    foods.push({
      id: `usda-${f.fdcId}`,
      name: brand ? `${base} (${tidyBrand(String(brand))})` : base,
      serving: `${round1(amount)} ${unit}`,
      kcal: Math.round(kcal * k),
      proteinG: round1((protein ?? 0) * k),
      carbsG: round1((carbs ?? 0) * k),
      fatG: round1((fat ?? 0) * k),
      amount,
      unit,
      source: 'usda',
    })
  }
  return foods
}

async function usdaSearch(key: string, query: string, dataType: string, pageSize: number): Promise<Food[]> {
  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search')
  url.searchParams.set('query', query)
  url.searchParams.set('pageSize', String(pageSize))
  url.searchParams.set('dataType', dataType)
  const res = await fetch(url, { headers: { 'X-Api-Key': key }, signal: AbortSignal.timeout(7000) })
  if (!res.ok) throw new Error(`USDA ${res.status}`)
  return parseUsda(await res.json())
}

async function searchUsda(query: string): Promise<Food[]> {
  const key = Deno.env.get('USDA_API_KEY')
  if (!key) return []
  // Plain foods and cooked dishes first, then a few packaged brands (searched separately, or the brands would crowd out the plain foods)
  const [plain, branded] = await Promise.all([
    usdaSearch(key, query, 'Foundation,SR Legacy,Survey (FNDDS)', 8),
    usdaSearch(key, query, 'Branded', 4).catch(() => [] as Food[]),
  ])
  return [...plain, ...branded]
}

// ---- Open Food Facts ----

// deno-lint-ignore no-explicit-any
export function parseOff(data: any): Food[] {
  const foods: Food[] = []
  for (const p of data?.products ?? []) {
    const n = p.nutriments ?? {}
    const kcal = Number(n['energy-kcal_100g'])
    const name = String(p.product_name ?? '').trim()
    if (!name || !Number.isFinite(kcal)) continue
    const per100 = (key: string) => (Number.isFinite(Number(n[key])) ? Number(n[key]) : 0)
    const serving = Number(p.serving_quantity)
    const scalable = serving > 0 && serving <= 1000
    const unit: 'g' | 'ml' = /\b(ml|cl)\b/i.test(String(p.serving_size ?? '')) ? 'ml' : 'g'
    const amount = scalable ? serving : 100
    const k = amount / 100
    const brand = String(p.brands ?? '').split(',')[0].trim()
    foods.push({
      id: `off-${p.code}`,
      name: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${tidyName(name)} (${brand})` : tidyName(name),
      serving: `${round1(amount)} ${unit}`,
      kcal: Math.round(kcal * k),
      proteinG: round1(per100('proteins_100g') * k),
      carbsG: round1(per100('carbohydrates_100g') * k),
      fatG: round1(per100('fat_100g') * k),
      amount,
      unit,
      source: 'openfoodfacts',
    })
  }
  return foods
}

async function searchOff(query: string): Promise<Food[]> {
  const url = new URL('https://world.openfoodfacts.org/cgi/search.pl')
  url.searchParams.set('search_terms', query)
  url.searchParams.set('search_simple', '1')
  url.searchParams.set('action', 'process')
  url.searchParams.set('json', '1')
  url.searchParams.set('page_size', '10')
  url.searchParams.set('fields', 'code,product_name,brands,nutriments,serving_size,serving_quantity')
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MyFit/1.0 (https://getmyfit.vercel.app)' },
    signal: AbortSignal.timeout(7000),
  })
  if (!res.ok) throw new Error(`OpenFoodFacts ${res.status}`)
  return parseOff(await res.json())
}

// ---- Barcode ----

/** Digits only, 8 to 14 long (EAN-8, UPC-A, EAN-13, ITF-14). Anything else is not a barcode. */
export function normalizeBarcode(raw: unknown): string | null {
  const digits = String(raw ?? '').replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 14 ? digits : null
}

// deno-lint-ignore no-explicit-any
export function parseOffProduct(data: any): Food[] {
  if (data?.status !== 1 || !data.product) return []
  return parseOff({ products: [{ code: data.code, ...data.product }] })
}

/** USDA finds a branded food by its barcode, but also returns near matches: keep only the exact one (a leading 0 does not count). */
// deno-lint-ignore no-explicit-any
export function parseUsdaBarcode(data: any, code: string): Food[] {
  const bare = (v: unknown) => String(v ?? '').replace(/^0+/, '')
  // deno-lint-ignore no-explicit-any
  const exact = (data?.foods ?? []).filter((f: any) => bare(f.gtinUpc) === bare(code))
  return parseUsda({ foods: exact })
}

async function barcodeOff(code: string): Promise<Food[]> {
  const url = new URL(`https://world.openfoodfacts.org/api/v2/product/${code}.json`)
  url.searchParams.set('fields', 'code,product_name,brands,nutriments,serving_size,serving_quantity')
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MyFit/1.0 (https://getmyfit.vercel.app)' },
    signal: AbortSignal.timeout(7000),
  })
  // An unknown barcode is answered with 404 and { status: 0 }
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`OpenFoodFacts ${res.status}`)
  return parseOffProduct(await res.json())
}

async function barcodeUsda(code: string): Promise<Food[]> {
  const key = Deno.env.get('USDA_API_KEY')
  if (!key) return []
  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search')
  url.searchParams.set('query', code)
  url.searchParams.set('pageSize', '5')
  url.searchParams.set('dataType', 'Branded')
  const res = await fetch(url, { headers: { 'X-Api-Key': key }, signal: AbortSignal.timeout(7000) })
  if (!res.ok) throw new Error(`USDA ${res.status}`)
  return parseUsdaBarcode(await res.json(), code)
}

/** The product behind a barcode: Open Food Facts first (worldwide, many Philippine products), then USDA brands. */
async function lookupBarcode(code: string): Promise<Food[]> {
  const [off, usda] = await Promise.allSettled([barcodeOff(code), barcodeUsda(code)])
  if (off.status === 'rejected' && usda.status === 'rejected') {
    throw new Error('The food databases are not responding. Please try again.')
  }
  const fromOff = off.status === 'fulfilled' ? off.value : []
  if (fromOff.length > 0) return fromOff.slice(0, 1)
  return (usda.status === 'fulfilled' ? usda.value : []).slice(0, 1)
}

// ---- merge ----

/** USDA first (plain foods), then packaged foods; the same name and serving is listed once. */
export function mergeFoods(usda: Food[], off: Food[]): Food[] {
  const seen = new Set<string>()
  const out: Food[] = []
  for (const f of [...usda.slice(0, 12), ...off.slice(0, 6)]) {
    const key = `${f.name.toLowerCase()}|${f.serving}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(f)
  }
  return out
}

// Same search again within ten minutes: answered from memory, which keeps the daily allowance for new searches.
const cache = new Map<string, { at: number; foods: Food[] }>()
const CACHE_MS = 10 * 60 * 1000

async function search(query: string): Promise<Food[]> {
  const key = query.toLowerCase()
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.foods
  const [usda, off] = await Promise.allSettled([searchUsda(query), searchOff(query)])
  if (usda.status === 'rejected' && off.status === 'rejected') {
    throw new Error('The food databases are not responding. Please try again.')
  }
  const foods = mergeFoods(usda.status === 'fulfilled' ? usda.value : [], off.status === 'fulfilled' ? off.value : [])
  // Only remember a complete answer, so a one-off failure is retried next time
  if (usda.status === 'fulfilled' && off.status === 'fulfilled') {
    if (cache.size > 200) cache.clear()
    cache.set(key, { at: Date.now(), foods })
  }
  return foods
}

// `Deno` only exists on the server; the tests import this file in Node to check the functions above.
if (typeof Deno !== 'undefined') {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

    try {
      const { createClient } = await import('npm:@supabase/supabase-js@2')
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) return json({ error: 'Not authenticated.' }, 401)
      const supabaseAsCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      })
      const {
        data: { user },
        error: authError,
      } = await supabaseAsCaller.auth.getUser()
      if (authError || !user) return json({ error: 'Not authenticated.' }, 401)

      const body = await req.json().catch(() => ({}))
      // A scanned barcode: the one product, or none
      if (body.barcode !== undefined) {
        const code = normalizeBarcode(body.barcode)
        return json({ foods: code ? await lookupBarcode(code) : [] })
      }
      const query = String(body.query ?? '').trim().slice(0, 60)
      if (query.length < 2) return json({ foods: [] })

      return json({ foods: await search(query) })
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 400)
    }
  })
}
