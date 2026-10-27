// Supabase Edge Function: welcome-email
// Deploy: paste this file into the dashboard (Edge Functions > Create a new function > name it welcome-email), then Deploy.
// Secrets used (already set for delete-account): BREVO_API_KEY, EMAIL_FROM.
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
//
// Sends a welcome email to the signed-in member, once. The "sent" mark lives in the account's own user metadata, so
// calling this again does nothing. Accounts older than 7 days are only marked, never emailed, so existing members do
// not get a welcome they did not expect.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'content-type': 'application/json' } })

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function buildWelcomeEmail(name: string | null | undefined) {
  const who = (name ?? '').trim() || 'there'
  const paragraphs = [
    `Hi ${who},`,
    'Welcome to MyFit. Your 12-week program is built around your goal, your equipment and your schedule, and each week it tells you what to lift.',
    'Day 1 is free, and so is the food log with barcode scanning. Go Pro whenever you want the full program.',
    'Questions? Just reply to this email.',
    'The MyFit team',
  ]
  return {
    subject: 'Welcome to MyFit',
    text: paragraphs.join('\n\n'),
    html: paragraphs
      .map((p) => `<p style="margin:0 0 14px;font:15px/1.5 Arial,sans-serif;color:#1a1a1a">${escapeHtml(p)}</p>`)
      .join(''),
  }
}

export function buildBrevoRequest(from: string, replyTo: string, to: string, name: string | null | undefined, mail: { subject: string; text: string; html: string }) {
  const recipient: { email: string; name?: string } = { email: to }
  if ((name ?? '').trim()) recipient.name = (name ?? '').trim()
  return {
    sender: { name: 'MyFit', email: from },
    to: [recipient],
    replyTo: { email: replyTo },
    subject: mail.subject,
    textContent: mail.text,
    htmlContent: mail.html,
  }
}

// `Deno` only exists on the server; the tests import this file in Node to check the email text.
if (typeof Deno !== 'undefined') {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

    try {
      // Loaded here, not at the top, so the email text can be tested on a normal computer.
      const { createClient } = await import('npm:@supabase/supabase-js@2')
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) return json({ error: 'Not authenticated.' }, 401)

      const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      })
      const {
        data: { user },
        error: authError,
      } = await caller.auth.getUser()
      if (authError || !user || !user.email) return json({ error: 'Not authenticated.' }, 401)

      if (user.user_metadata?.welcome_sent) return json({ sent: false, reason: 'already sent' })

      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      const markSent = () =>
        admin.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, welcome_sent: true } })

      // Only brand-new accounts get the welcome. Older accounts are marked so they are never asked again.
      const ageMs = Date.now() - new Date(user.created_at).getTime()
      if (ageMs > WEEK_MS) {
        await markSent()
        return json({ sent: false, reason: 'account is not new' })
      }

      const apiKey = Deno.env.get('BREVO_API_KEY')
      const from = Deno.env.get('EMAIL_FROM')
      if (!apiKey || !from) return json({ sent: false, reason: 'email not configured' })

      const name = user.user_metadata?.display_name as string | undefined
      const mail = buildWelcomeEmail(name)
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(buildBrevoRequest(from, from, user.email, name, mail)),
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) return json({ sent: false, reason: 'send failed' })

      await markSent()
      return json({ sent: true })
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 400)
    }
  })
}
