// Supabase Edge Function: create-checkout-session
// Deploy: supabase functions deploy create-checkout-session
// Secrets required (supabase secrets set ...):
//   STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY, SITE_URL,
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (service role, not the anon key)
//
// POST body: { userId: string, period: "monthly" | "yearly" }
// Returns: { url: string }  -- redirect the browser to this Stripe Checkout URL

import Stripe from 'npm:stripe@17.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-11-20.acacia' })
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const PRICE_IDS = {
  monthly: Deno.env.get('STRIPE_PRICE_MONTHLY')!,
  yearly: Deno.env.get('STRIPE_PRICE_YEARLY')!,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const { userId, period } = await req.json()
    if (!userId || (period !== 'monthly' && period !== 'yearly')) {
      throw new Error('userId and a valid period ("monthly" | "yearly") are required.')
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, display_name, stripe_customer_id')
      .eq('id', userId)
      .single()
    if (profileError || !profile) throw new Error('Profile not found.')

    let customerId = profile.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.display_name,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
      await supabaseAdmin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: PRICE_IDS[period as 'monthly' | 'yearly'], quantity: 1 }],
      success_url: `${Deno.env.get('SITE_URL')}/account?checkout=success`,
      cancel_url: `${Deno.env.get('SITE_URL')}/pricing`,
      metadata: { supabase_user_id: userId, period },
      subscription_data: { metadata: { supabase_user_id: userId, period } },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    })
  }
})
