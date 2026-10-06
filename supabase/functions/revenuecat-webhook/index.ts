// Supabase Edge Function: revenuecat-webhook
// Deploy: supabase functions deploy revenuecat-webhook --no-verify-jwt
// (--no-verify-jwt is required: RevenueCat calls this endpoint directly, with no Supabase auth token)
//
// After deploying, copy its URL into the RevenueCat dashboard -> Project Settings -> Integrations ->
// Webhooks -> add this URL, and set an "Authorization header value" there (any long random string) —
// copy that same string into the REVENUECAT_WEBHOOK_SECRET function secret below, so we can verify
// the call actually came from RevenueCat.
//
// Secrets required: REVENUECAT_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'npm:@supabase/supabase-js@2'

const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')!
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const PRO_ENTITLEMENT_ID = 'pro'

function periodFromProductId(productId: string): 'monthly' | 'yearly' {
  return productId.includes('year') ? 'yearly' : 'monthly'
}

async function activatePro(userId: string, productId: string, expirationMs: number | null) {
  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_tier: 'pro',
      subscription_status: 'active',
      subscription_period: periodFromProductId(productId),
      subscription_renews_at: expirationMs ? new Date(expirationMs).toISOString() : null,
    })
    .eq('id', userId)

  await supabaseAdmin.from('activity_log').insert({
    user_id: userId,
    action: 'subscribed_pro',
    metadata: { productId, source: 'google_play' },
  })
}

async function deactivatePro(userId: string) {
  await supabaseAdmin.from('profiles').update({ subscription_status: 'canceled' }).eq('id', userId)
  await supabaseAdmin.from('activity_log').insert({
    user_id: userId,
    action: 'canceled_subscription',
    metadata: { source: 'google_play' },
  })
}

Deno.serve(async (req) => {
  // Fail closed: if the secret was never configured, an attacker could otherwise match the literal
  // string "Bearer undefined" and grant themselves Pro.
  if (!webhookSecret) return new Response('Webhook not configured', { status: 500 })

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${webhookSecret}` && auth !== webhookSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const event = body.event

    const userId: string | undefined = event.app_user_id
    const productId: string | undefined = event.product_id
    const entitlements: string[] = event.entitlement_ids ?? []
    if (!userId) return new Response(JSON.stringify({ received: true }), { headers: { 'content-type': 'application/json' } })

    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
      case 'UNCANCELLATION':
        if (productId && entitlements.includes(PRO_ENTITLEMENT_ID)) {
          await activatePro(userId, productId, event.expiration_at_ms ?? null)
        }
        break

      case 'EXPIRATION':
        await deactivatePro(userId)
        break

      // CANCELLATION only means auto-renew was turned off — user keeps access until
      // expiration_at_ms, which arrives later as an EXPIRATION event. Nothing to do here.
      // BILLING_ISSUE: RevenueCat/Google handle retry + grace period automatically.
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'content-type': 'application/json' } })
  } catch (err) {
    console.error('revenuecat-webhook handler error:', err)
    return new Response('Webhook handler error', { status: 500 })
  }
})
