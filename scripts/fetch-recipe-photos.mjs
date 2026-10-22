// Fetches cookbook photos from a free stock-photo site (Pixabay or Pexels: both free to use in apps).
//
//   node scripts/fetch-recipe-photos.mjs search <folder>       downloads a few small candidate photos per recipe into <folder>
//   node scripts/fetch-recipe-photos.mjs pick <picks.json>      downloads the chosen photo for each recipe into public/recipes
//
// Needs a free API key in a file that is never committed: .env.pixabay (PIXABAY_API_KEY=your key) or .env.pexels (PEXELS_API_KEY=your key).
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

function readKey(file, name) {
  const f = path.join(ROOT, file)
  const raw = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''
  const line = raw.split(String.fromCharCode(10)).map((l) => l.trim()).find((l) => l.startsWith(name + '='))
  const key = line ? line.slice(name.length + 1).trim() : ''
  return key && !/paste|your|here/i.test(key) ? key : null
}

const PIXABAY = readKey('.env.pixabay', 'PIXABAY_API_KEY')
const PEXELS = readKey('.env.pexels', 'PEXELS_API_KEY')
const SITE = PIXABAY ? 'pixabay' : PEXELS ? 'pexels' : null
if (!SITE) {
  console.error('No photo-site key found. Put it in .env.pixabay as PIXABAY_API_KEY=your key (or .env.pexels as PEXELS_API_KEY=your key).')
  process.exit(1)
}

// What to search for each recipe (English works best)
const QUERIES = {
  'cookie-dough-protein-bites': 'cookie dough bites',
  'fluffy-protein-pancakes': 'pancakes blueberries',
  'protein-ice-cream': 'chocolate ice cream',
  'cottage-cheese-strawberry-ice-cream': 'strawberry ice cream',
  'choc-pb-protein-mug-brownie': 'chocolate mug cake',
  'berry-cheesecake-protein-cups': 'cheesecake cup berries',
  'chocolate-chia-protein-pudding': 'chia pudding chocolate',
  'banana-bread-protein-muffins': 'banana muffins',
  'yogurt-berry-bark': 'frozen yogurt bark berries',
  'protein-french-toast': 'french toast strawberries',
  'mango-protein-smoothie-bowl': 'mango smoothie bowl',
  'peanut-butter-protein-cookies': 'peanut butter cookies',
  'veggie-egg-white-omelette': 'vegetable omelette',
  'berry-overnight-oats': 'overnight oats berries jar',
  'avocado-egg-toast': 'avocado egg toast',
  'healthy-tapsilog': 'filipino breakfast beef rice egg',
  'sweet-potato-egg-hash': 'sweet potato hash egg',
  'tuna-egg-pandesal': 'tuna sandwich bread roll',
  'yogurt-berry-parfait': 'yogurt parfait granola berries',
  'chicken-tinola': 'chicken soup ginger',
  'lean-chicken-adobo': 'chicken adobo',
  'sinigang-na-hipon': 'sinigang shrimp soup',
  'grilled-chicken-rice-bowl': 'grilled chicken rice bowl',
  'teriyaki-salmon-bowl': 'salmon rice bowl',
  'beef-and-broccoli': 'beef and broccoli',
  'turkey-meatballs-cauli-rice': 'meatballs tomato sauce',
  'bangus-sisig-lite': 'sisig',
  'pinakbet-with-shrimp': 'pinakbet vegetables',
  'tofu-veggie-stir-fry': 'tofu vegetable stir fry',
  'chicken-fajita-bowl': 'chicken fajita bowl',
  'tuna-poke-bowl': 'poke bowl tuna',
  'lemon-garlic-chicken-and-veg': 'roasted chicken vegetables sheet pan',
  'egg-fried-cauliflower-rice': 'cauliflower fried rice',
  'chicken-caesar-wrap': 'chicken caesar wrap',
  'chicken-afritada-light': 'chicken stew tomato potato',
  'baked-fish-sweet-potato': 'baked fish sweet potato green beans',
  'beef-mushroom-lettuce-wraps': 'lettuce wraps beef',
  'choco-banana-protein-shake': 'chocolate banana smoothie',
  'chicken-salad-lettuce-cups': 'chicken salad lettuce cups',
  'tuna-cucumber-boats': 'tuna cucumber',
  'hummus-veggie-box': 'hummus vegetables',
  'cottage-cheese-berry-bowl': 'cottage cheese berries bowl',
  'eggs-and-edamame': 'boiled eggs edamame',
}

/** Candidate photos for a search: [{ id, small, large, name, url, page }] */
async function candidates(query, perPage = 6) {
  if (SITE === 'pixabay') {
    const get = async (extra) => {
      const url = `https://pixabay.com/api/?key=${PIXABAY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=${perPage}${extra}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Pixabay said ${res.status} for "${query}"`)
      return (await res.json()).hits
    }
    let hits = await get('&category=food')
    if (hits.length < 3) hits = await get('')
    return hits.map((h) => ({
      id: h.id,
      small: h.webformatURL.replace('_640', '_340'),
      name: h.user,
      url: `https://pixabay.com/users/${h.user}-${h.user_id}/`,
      page: h.pageURL,
    }))
  }
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
  const res = await fetch(url, { headers: { Authorization: PEXELS } })
  if (!res.ok) throw new Error(`Pexels said ${res.status} for "${query}"`)
  return (await res.json()).photos.map((p) => ({ id: p.id, small: p.src.medium, name: p.photographer, url: p.photographer_url, page: p.url }))
}

/** The final picture for a chosen photo, about 900 px wide. */
async function finalUrl(c) {
  if (SITE === 'pixabay') {
    // Pixabay picture addresses expire after 24 hours, so ask again for a fresh one
    const res = await fetch(`https://pixabay.com/api/?key=${PIXABAY}&id=${c.id}`)
    if (!res.ok) throw new Error(`Pixabay said ${res.status} for photo ${c.id}`)
    const hit = (await res.json()).hits[0]
    if (!hit) throw new Error(`Pixabay has no photo ${c.id}`)
    return hit.largeImageURL
  }
  return `https://images.pexels.com/photos/${c.id}/pexels-photo-${c.id}.jpeg?auto=compress&cs=tinysrgb&w=900&h=675&fit=crop`
}

async function download(url, file) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not download ${url} (${res.status})`)
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
}

const [mode, arg] = process.argv.slice(2)

if (mode === 'search') {
  const dir = path.resolve(arg || 'photo-candidates')
  fs.mkdirSync(dir, { recursive: true })
  const out = {}
  // Extra arguments like  id="search words"  search again for just those recipes with different words
  const redo = Object.fromEntries(process.argv.slice(4).map((a) => [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)]))
  const todo = Object.keys(redo).length ? Object.entries(redo) : Object.entries(QUERIES)
  for (const [id, query] of todo) {
    const photos = await candidates(query)
    out[id] = []
    for (const [i, p] of photos.entries()) {
      await download(p.small, path.join(dir, `${id}__${i + 1}.jpg`))
      out[id].push({ n: i + 1, ...p })
    }
    console.log(`${id}: ${photos.length} candidates`)
    await new Promise((r) => setTimeout(r, 700))
  }
  fs.writeFileSync(path.join(dir, 'candidates.json'), JSON.stringify(out, null, 2))
  console.log('Done. Candidates are in', dir)
} else if (mode === 'pick') {
  // picks.json: { candidates: "<path to candidates.json>", picks: { "<recipe id>": <candidate number> } }
  const spec = JSON.parse(fs.readFileSync(path.resolve(arg), 'utf8'))
  // spec.candidates is one file or a list of files; a pick is a number (the first file) or [file index, number]
  const files = [].concat(spec.candidates).map((f) => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8')))
  const outDir = path.join(ROOT, 'public', 'recipes')
  fs.mkdirSync(outDir, { recursive: true })
  const credits = {}
  for (const [id, pick] of Object.entries(spec.picks)) {
    const [fi, n] = Array.isArray(pick) ? pick : [0, pick]
    const c = files[fi]?.[id]?.find((x) => x.n === n)
    if (!c) throw new Error(`No candidate ${n} for ${id}`)
    // 800 px wide is plenty for a phone and keeps each photo small
    await download(await finalUrl(c), path.join(outDir, `${id}.jpg`))
    credits[id] = { name: c.name, url: c.url, source: SITE === 'pixabay' ? 'Pixabay' : 'Pexels' }
    console.log(`${id}: saved`)
  }
  const ids = Object.keys(credits).sort()
  const body = `// Which recipes have a photo (a file at /recipes/<id>.jpg in the public folder), and who took it. Written by scripts/fetch-recipe-photos.mjs.
// Photos are from free stock-photo sites (Pixabay, Pexels), free to use in apps.
export const PHOTO_IDS: ReadonlySet<string> = new Set<string>(${JSON.stringify(ids, null, 2)})

export const PHOTO_CREDITS: Record<string, { name: string; url: string; source: string }> = ${JSON.stringify(credits, null, 2)}
`
  fs.writeFileSync(path.join(ROOT, 'src', 'lib', 'cookbook', 'recipePhotos.ts'), body)
  console.log(`Wrote ${ids.length} photos and src/lib/cookbook/recipePhotos.ts`)
} else {
  console.log('Usage: node scripts/fetch-recipe-photos.mjs search <folder> | pick <picks.json>')
}
