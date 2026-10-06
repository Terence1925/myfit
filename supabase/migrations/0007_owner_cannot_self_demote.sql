-- The owner's admin role is now fully locked: nobody, including the owner, can demote or alter it
-- through the app. (0006 let the owner demote themselves, which only invites accidents.)
-- If it ever genuinely needs changing, do it deliberately: drop the two protect_owner_admin_role_*
-- triggers in the SQL editor, make the change, and re-create them.

create or replace function public.protect_owner_admin_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_email text;
begin
  select email into target_email from public.profiles where id = old.user_id;

  if old.role = 'admin' and target_email = 'ttagayona1985@gmail.com' then
    raise exception 'Cannot modify or remove the owner''s admin access.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
