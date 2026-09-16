// Supabase Edge Function: stripe-webhook
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// (--no-verify-jwt is required: Stripe calls this endpoint directly, with no Supabase auth token)
//
// After deploying, copy its URL into Stripe Dashboard -> Developers -> Webhooks -> Add endpoint,
// subscribed to: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted.
// Then copy the "Signing secret" Stripe shows you into the STRIPE_WEBHOOK_SECRET function secret.
//
// Secrets required: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import Stripe from 'npm:stripe@17.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-11-20.acacia' })
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

async function activatePro(userId: string, period: 'monthly' | 'yearly', subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_tier: 'pro',
      subscription_status: 'active',
      subscription_period: period,
      subscription_started_at: new Date(subscription.start_date * 1000).toISOString(),
      subscription_renews_at: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_subscription_id: subscription.id,
    })
    .eq('id', userId)

  await supabaseAdmin.from('activity_log').insert({
    user_id: userId,
    action: 'subscribed_pro',
    metadata: { period, subscriptionId: subscription.id },
  })
}

async function deactivatePro(userId: string) {
  await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: 'canceled' })
    .eq('id', userId)

  await supabaseAdmin.from('activity_log').insert({
    user_id: userId,
    action: 'canceled_subscription',
    metadata: {},
  })
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret)
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err instanceof Error ? err.message : err}`, {
      status: 400,
    })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const period = session.metadata?.period as 'monthly' | 'yearly' | undefined
        if (userId && period && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          await activatePro(userId, period, subscription)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id
        const period = subscription.metadata?.period as 'monthly' | 'yearly' | undefined
        if (!userId) break
        if (subscription.status === 'active' && period) {
          await activatePro(userId, period, subscription)
        } else if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
          await deactivatePro(userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id
        if (userId) await deactivatePro(userId)
        break
      }
    }
  } catch (err) {
    console.error('stripe-webhook handler error:', err)
    return new Response('Webhook handler error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'content-type': 'application/json' } })
})
