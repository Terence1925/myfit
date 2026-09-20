// Supabase Edge Function: paymongo-webhook
// Deploy: supabase functions deploy paymongo-webhook --no-verify-jwt
// (--no-verify-jwt is required: PayMongo calls this endpoint directly, with no Supabase auth token)
//
// After deploying, copy its URL into PayMongo Dashboard -> Developers -> Webhooks -> Add endpoint,
// subscribed to: payment.paid, payment.failed. Then copy the "Signing secret" PayMongo shows you
// into the PAYMONGO_WEBHOOK_SECRET function secret.
//
// Secrets required: PAYMONGO_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// NOTE: PayMongo's webhook payload shape for a Checkout Session's resulting payment isn't fully
// documented publicly. This handler logs the raw payload on first run — check
// `supabase functions logs paymongo-webhook` after a real test payment and adjust the metadata
// extraction below (search for "ADJUST HERE") if the actual shape differs.

import { createClient } from 'npm:@supabase/supabase-js@2'

const webhookSecret = Deno.env.get('PAYMONGO_WEBHOOK_SECRET')!
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const PERIOD_MS = { monthly: 31 * 24 * 60 * 60 * 1000, yearly: 366 * 24 * 60 * 60 * 1000 }

async function verifySignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  if (!signatureHeader) return false
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((kv) => kv.split('=') as [string, string]),
  )
  const timestamp = parts.t
  const candidates = [parts.li, parts.te].filter(Boolean)
  if (!timestamp || candidates.length === 0) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`))
  const digestHex = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return candidates.includes(digestHex)
}

async function activatePro(userId: string, period: 'monthly' | 'yearly') {
  const now = new Date()
  const renewsAt = new Date(now.getTime() + PERIOD_MS[period])

  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_tier: 'pro',
      subscription_status: 'active',
      subscription_period: period,
      subscription_started_at: now.toISOString(),
      subscription_renews_at: renewsAt.toISOString(),
    })
    .eq('id', userId)

  await supabaseAdmin.from('activity_log').insert({
    user_id: userId,
    action: 'subscribed_pro',
    metadata: { period, provider: 'paymongo' },
  })
}

Deno.serve(async (req) => {
  const rawBody = await req.text()
  const signatureHeader = req.headers.get('paymongo-signature')

  if (!(await verifySignature(rawBody, signatureHeader))) {
    return new Response('Invalid signature', { status: 400 })
  }

  const event = JSON.parse(rawBody)
  const eventType = event?.data?.attributes?.type as string | undefined

  console.log('paymongo-webhook received:', eventType, JSON.stringify(event))

  try {
    if (eventType === 'payment.paid') {
      // ADJUST HERE if PayMongo's actual nesting differs from this guess.
      const resource = event.data.attributes.data
      const metadata = resource?.attributes?.metadata ?? {}
      const userId = metadata.supabase_user_id as string | undefined
      const period = metadata.period as 'monthly' | 'yearly' | undefined

      if (userId && (period === 'monthly' || period === 'yearly')) {
        await activatePro(userId, period)
      } else {
        console.error('paymongo-webhook: payment.paid missing supabase_user_id/period metadata', metadata)
      }
    }
  } catch (err) {
    console.error('paymongo-webhook handler error:', err)
    return new Response('Webhook handler error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'content-type': 'application/json' } })
})
