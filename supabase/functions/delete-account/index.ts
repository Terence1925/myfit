// Supabase Edge Function: delete-account
// Deploy: supabase functions deploy delete-account
// Secrets required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY (all auto-provided)
//
// Required for Google Play compliance: an app that supports account creation must also offer
// in-app account + data deletion. Deleting the auth.users row cascades (see the `on delete
// cascade` foreign keys in migrations 0001/0002) through profiles, user_roles, workout_programs,
// activity_log, body_metrics, and workout_sessions — every table with this user's data.
//
// Only a service-role client can call auth.admin.deleteUser, so this can't be done from the
// client directly. The caller is identified from their own verified JWT — nobody can delete an
// account other than their own via this endpoint.

import { createClient } from 'npm:@supabase/supabase-js@2'

// Wildcard is intentional: this endpoint requires a verified JWT (below), so CORS adds no real
// security boundary on top of that, and it must allow the native app's WebView origin plus
// localhost during dev — neither of which a fixed SITE_URL origin would cover.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

// Must match supabase/migrations/0006_protect_owner_admin_role.sql. The owner's account can't
// self-delete here — losing that account would mean losing admin access entirely, with no other
// account protected from being demoted by whoever's left. If the owner genuinely wants to close
// the whole app down, that's a deliberate action to take directly in the Supabase dashboard.
const OWNER_EMAIL = 'ttagayona1985@gmail.com'

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

    if (user.email === OWNER_EMAIL) {
      throw new Error('The owner account cannot be deleted from the app. Contact support if you need this done.')
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteError) throw new Error(deleteError.message)

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
