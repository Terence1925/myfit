// Supabase Edge Function: food-search
// Deploy: supabase functions deploy food-search
// Secrets required: FATSECRET_CLIENT_ID, FATSECRET_CLIENT_SECRET (set in the Supabase dashboard -> Edge Functions ->
// Secrets), plus SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY (auto-provided).
//
// Searches the FatSecret food database for the Food tab. The FatSecret keys never leave this server. Only a
// signed-in person with Pro (or an admin) can use it, because the free FatSecret plan allows a limited number of
// searches per day for the whole app. Body: { query: string }. Returns { foods: [...] } in the app's food shape.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'content-type': 'application/json' } })

// FatSecret access tokens last about a day; reuse one between calls on the same server instance.
let cachedToken: { value: string; expiresAt: number } | null = null

async function getFatSecretToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value
  const id = Deno.env.get('FATSECRET_CLIENT_ID')
  const secret = Deno.env.get('FATSECRET_CLIENT_SECRET')
  if (!id || !secret) throw new Error('Online food search is not set up yet.')
  const res = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials&scope=basic',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.access_token) throw new Error('Could not sign in to the food database.')
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000 }
  return cachedToken.value
}

interface Food {
  id: string
  name: string
  serving: string
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  amount?: number
  unit?: 'g' | 'ml'
  source: 'fatsecret'
}

// FatSecret describes each food like: "Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0.00g | Protein: 31.02g"
function parseDescription(desc: string): Pick<Food, 'serving' | 'kcal' | 'proteinG' | 'carbsG' | 'fatG' | 'amount' | 'unit'> | null {
  const m = desc.match(/^Per (.+?) - Calories: ([\d.]+)kcal \| Fat: ([\d.]+)g \| Carbs: ([\d.]+)g \| Protein: ([\d.]+)g/i)
  if (!m) return null
  const serving = m[1].trim()
  const exact = serving.match(/^(\d+(?:\.\d+)?)\s*(g|ml)$/i)
  return {
    serving: exact ? `${exact[1]} ${exact[2].toLowerCase()}` : serving,
    kcal: Math.round(Number(m[2])),
    fatG: Number(m[3]),
    carbsG: Number(m[4]),
    proteinG: Number(m[5]),
    ...(exact ? { amount: Number(exact[1]), unit: exact[2].toLowerCase() as 'g' | 'ml' } : {}),
  }
}

async function searchFatSecret(query: string): Promise<Food[]> {
  const token = await getFatSecretToken()
  const url = new URL('https://platform.fatsecret.com/rest/foods/search/v1')
  url.searchParams.set('search_expression', query)
  url.searchParams.set('max_results', '20')
  url.searchParams.set('format', 'json')
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const data = await res.json().catch(() => ({}))
  if (data.error) {
    // Code 21 means the server's address isn't on the key's allowed list (see the FatSecret dashboard).
    throw new Error(`The food database refused the request (${data.error.code}): ${data.error.message}`)
  }
  if (!res.ok) throw new Error('The food database is not responding. Please try again.')
  const raw = data.foods?.food
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  const foods: Food[] = []
  for (const f of list) {
    const parsed = parseDescription(String(f.food_description ?? ''))
    if (!parsed) continue
    foods.push({
      id: `fs-${f.food_id}`,
      name: f.brand_name ? `${f.food_name} (${f.brand_name})` : String(f.food_name),
      ...parsed,
      source: 'fatsecret',
    })
  }
  return foods
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
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

    // Pro (active and not lapsed) or admin only
    const [{ data: profile }, { data: roleRow }] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('subscription_tier, subscription_status, subscription_renews_at')
        .eq('id', user.id)
        .maybeSingle(),
      supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle(),
    ])
    const lapsed = profile?.subscription_renews_at && new Date(profile.subscription_renews_at).getTime() < Date.now()
    const pro = profile?.subscription_tier === 'pro' && profile?.subscription_status === 'active' && !lapsed
    if (!pro && !roleRow) return json({ error: 'Searching the full food database is a Pro feature.' }, 403)

    const body = await req.json().catch(() => ({}))
    const query = String(body.query ?? '').trim().slice(0, 60)
    if (query.length < 2) return json({ foods: [] })

    return json({ foods: await searchFatSecret(query) })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 400)
  }
})
