// Supabase Edge Function: create-checkout-session
// Deploy: supabase functions deploy create-checkout-session
// Secrets required (supabase secrets set ...):
//   PAYMONGO_SECRET_KEY, SITE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (service role, not the anon key)
//   SUPABASE_ANON_KEY (auto-provided by Supabase — no need to set it manually)
//
// Caller must send its own session in the Authorization header (supabase.functions.invoke does
// this automatically). The user is identified from that verified JWT, NOT from a client-supplied
// field — otherwise a signed-in user could pass someone else's id and buy Pro onto their account.
//
// POST body: { period: "monthly" | "yearly" }
// Returns: { url: string }  -- redirect the browser to this PayMongo Checkout URL
//
// This is a pay-per-period checkout, not a true auto-recurring subscription: PayMongo's hosted
// Checkout Session only supports one-time payments. On success, the webhook activates Pro for
// one period; the customer pays again from /pricing to renew. Keep MONTHLY_PRICE / YEARLY_PRICE
// in sync with src/lib/billing.ts.

import { createClient } from 'npm:@supabase/supabase-js@2'

const SITE_URL = Deno.env.get('SITE_URL')!
// Wildcard is intentional and safe here: this function requires a verified JWT (see below), which
// a malicious page can't forge without already having the victim's session — CORS wouldn't add a
// real security boundary on top of that. It also has to allow the native Android app's WebView
// origin (which isn't SITE_URL) and localhost during dev, neither of which a fixed origin covers.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PAYMONGO_SECRET_KEY = Deno.env.get('PAYMONGO_SECRET_KEY')!
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

// Centavos, matching src/lib/billing.ts's MONTHLY_PRICE / YEARLY_PRICE.
const AMOUNTS = { monthly: 39_999, yearly: 399_900 }
const LABELS = { monthly: 'FORGEFIT Pro — Monthly', yearly: 'FORGEFIT Pro — Yearly' }

function paymongoAuthHeader(): string {
  return `Basic ${btoa(`${PAYMONGO_SECRET_KEY}:`)}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Not authenticated.')

    const supabaseAsCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: authError,
    } = await supabaseAsCaller.auth.getUser()
    if (authError || !user) throw new Error('Not authenticated.')
    const userId = user.id

    const { period } = await req.json()
    if (period !== 'monthly' && period !== 'yearly') {
      throw new Error('A valid period ("monthly" | "yearly") is required.')
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, display_name')
      .eq('id', userId)
      .single()
    if (profileError || !profile) throw new Error('Profile not found.')

    const res = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        Authorization: paymongoAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [
              {
                name: LABELS[period as 'monthly' | 'yearly'],
                amount: AMOUNTS[period as 'monthly' | 'yearly'],
                currency: 'PHP',
                quantity: 1,
              },
            ],
            payment_method_types: ['card', 'gcash', 'paymaya'],
            success_url: `${SITE_URL}/account?checkout=success`,
            cancel_url: `${SITE_URL}/pricing`,
            customer_email: profile.email,
            description: `FORGEFIT Pro (${period})`,
            metadata: { supabase_user_id: userId, period },
          },
        },
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      throw new Error(json?.errors?.[0]?.detail ?? 'PayMongo checkout session creation failed.')
    }

    return new Response(JSON.stringify({ url: json.data.attributes.checkout_url }), {
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    })
  }
})
