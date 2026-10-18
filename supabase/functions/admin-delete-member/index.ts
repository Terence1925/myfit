// Supabase Edge Function: admin-delete-member
// Deploy: supabase functions deploy admin-delete-member
// Secrets required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY (all auto-provided)
//
// Lets an admin permanently delete another member from the Admin page. Deleting the auth.users row
// cascades (see the `on delete cascade` foreign keys in migrations 0001/0002) through profiles,
// user_roles, workout_programs, activity_log, body_metrics, workout_sessions and food_logs.
//
// POST body: { userId: string }  -- the member to delete.
//
// Safety rules, all enforced here on the server (the Admin screen's two-step confirmation is only
// a convenience, never the protection):
//   - the caller is identified from their own verified JWT and must hold the admin role
//   - nobody can delete themselves through this endpoint (that is delete-account)
//   - an admin cannot be deleted: remove their admin rights first, then delete them
//   - the owner account can never be deleted
// The deletion is recorded in the calling admin's activity log (the member's own log goes with them).
//
// This is a separate function from delete-account on purpose: delete-account deletes whoever is
// calling it, so it must never be pointed at someone else.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

// Must match supabase/migrations/0006_protect_owner_admin_role.sql and delete-account.
const OWNER_EMAIL = 'ttagayona1985@gmail.com'

function fail(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return fail('Not authenticated.', 401)

    const supabaseAsCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: authError,
    } = await supabaseAsCaller.auth.getUser()
    if (authError || !user) return fail('Not authenticated.', 401)

    const { data: callerAdmin } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
    if (!callerAdmin) return fail('Only an admin can delete members.', 403)

    const body = await req.json().catch(() => ({}))
    const targetId: unknown = body?.userId
    if (typeof targetId !== 'string' || targetId.length === 0) return fail('Say which member to delete.')
    if (targetId === user.id) return fail('You cannot delete your own account here.')

    const { data: target, error: targetError } = await supabaseAdmin.auth.admin.getUserById(targetId)
    if (targetError || !target?.user) return fail('That member no longer exists.', 404)
    if (target.user.email === OWNER_EMAIL) return fail('The owner account cannot be deleted.', 403)

    const { data: targetAdmin } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', targetId)
      .eq('role', 'admin')
      .maybeSingle()
    if (targetAdmin) return fail('This member is an admin. Remove their admin rights first, then delete them.', 403)

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetId)
    if (deleteError) return fail(deleteError.message, 500)

    await supabaseAdmin.from('activity_log').insert({
      user_id: user.id,
      action: 'deleted_member',
      metadata: { email: target.user.email, name: target.user.user_metadata?.display_name },
    })

    return new Response(JSON.stringify({ deleted: true }), {
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    })
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Unknown error', 500)
  }
})
