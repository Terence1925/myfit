// Supabase Edge Function: billing-portal
// Deploy: supabase functions deploy billing-portal
// Secrets required: STRIPE_SECRET_KEY, SITE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// POST body: { userId: string }
// Returns: { url: string } -- redirect the browser here; Stripe's hosted portal lets the
// customer update payment method, switch plans, or cancel. Cancellation is picked up by
// stripe-webhook (customer.subscription.updated / .deleted), which updates Supabase.

import Stripe from 'npm:stripe@17.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-11-20.acacia' })
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const { userId } = await req.json()
    if (!userId) throw new Error('userId is required.')

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()
    if (error || !profile?.stripe_customer_id) {
      throw new Error('No Stripe customer on file for this user.')
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${Deno.env.get('SITE_URL')}/account`,
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
