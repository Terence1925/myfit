// Supabase Edge Function: delete-account
// Deploy: supabase functions deploy delete-account
// Secrets required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY (all auto-provided)
// Optional secrets for the "your account was deleted" email: BREVO_API_KEY, EMAIL_FROM (see below)
//
// Required for Google Play compliance: an app that supports account creation must also offer
// in-app account + data deletion. Deleting the auth.users row cascades (see the `on delete
// cascade` foreign keys in migrations 0001/0002) through profiles, user_roles, workout_programs,
// activity_log, body_metrics, and workout_sessions — every table with this user's data.
//
// Only a service-role client can call auth.admin.deleteUser, so this can't be done from the
// client directly. The caller is identified from their own verified JWT — nobody can delete an
// account other than their own via this endpoint.

// Wildcard is intentional: this endpoint requires a verified JWT (below), so CORS adds no real
// security boundary on top of that, and it must allow the native app's WebView origin plus
// localhost during dev — neither of which a fixed SITE_URL origin would cover.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Must match supabase/migrations/0006_protect_owner_admin_role.sql. The owner's account can't
// self-delete here — losing that account would mean losing admin access entirely, with no other
// account protected from being demoted by whoever's left. If the owner genuinely wants to close
// the whole app down, that's a deliberate action to take directly in the Supabase dashboard.
const OWNER_EMAIL = 'ttagayona1985@gmail.com'

// ---- The "your account was deleted" email ----
// Sent with Brevo (brevo.com), which can send from a single verified address with no domain needed.
// Secrets: BREVO_API_KEY, and EMAIL_FROM, the sender address verified in Brevo (for example joinmyfit@gmail.com).
// Optional: SUPPORT_EMAIL, where replies go (default: the same as EMAIL_FROM).
// Without the two required secrets the email is skipped and the deletion still goes through.
// Only regular members get it: admin accounts (and the owner, who cannot delete their account here at all) never do.

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function buildDeletionEmail(name: string | null | undefined, email: string) {
  const who = (name ?? '').trim() || 'there'
  const paragraphs = [
    `Hi ${who},`,
    `Your MyFit account (${email}) has been deleted, as you asked. Your programs, workout history, food log and body measurements have been permanently removed.`,
    'Deleting your account does not cancel a paid subscription. If you subscribed through Google Play, cancel it in the Google Play app (Menu, then Subscriptions) so you are not charged again.',
    'If you did not ask for this, reply to this email right away.',
    'The MyFit team',
  ]
  return {
    subject: 'Your MyFit account has been deleted',
    text: paragraphs.join('\n\n'),
    html: paragraphs.map((p) => `<p style="margin:0 0 14px;font:15px/1.5 Arial,sans-serif;color:#1a1a1a">${escapeHtml(p)}</p>`).join(''),
  }
}

/** The request Brevo expects (https://developers.brevo.com/reference/sendtransacemail). */
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

/** Sends the email. Never throws: the account is already deleted, so a mail problem is only logged. */
export async function sendDeletionEmail(to: string | undefined, name: string | null | undefined): Promise<void> {
  try {
    const apiKey = Deno.env.get('BREVO_API_KEY')
    const from = Deno.env.get('EMAIL_FROM')
    if (!to || !apiKey || !from) {
      console.log('Deletion email skipped: no address, or BREVO_API_KEY / EMAIL_FROM are not set.')
      return
    }
    const replyTo = Deno.env.get('SUPPORT_EMAIL') || from
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(buildBrevoRequest(from, replyTo, to, name, buildDeletionEmail(name, to))),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) console.error('Deletion email failed:', res.status, await res.text())
  } catch (err) {
    console.error('Deletion email failed:', err instanceof Error ? err.message : err)
  }
}

// `Deno` only exists on the server; the tests import this file in Node to check the email text.
if (typeof Deno !== 'undefined') {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

    try {
      const { createClient } = await import('npm:@supabase/supabase-js@2')
      const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
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

      if (user.email === OWNER_EMAIL) {
        throw new Error('The owner account cannot be deleted from the app. Contact support if you need this done.')
      }

      // Read these before the account is gone. Admins are not emailed.
      const memberEmail = user.email
      const memberName = user.user_metadata?.display_name as string | undefined
      const { data: adminRow } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle()

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      if (deleteError) throw new Error(deleteError.message)

      if (!adminRow) await sendDeletionEmail(memberEmail, memberName)

      return new Response(JSON.stringify({ deleted: true }), {
        headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      })
    }
  })
}
