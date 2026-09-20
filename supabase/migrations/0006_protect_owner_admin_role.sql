-- Protects the account owner's admin role from being removed or altered by any other admin.
-- Without this, RLS treats every admin as an equal peer (roles_delete_admin_only /
-- roles_update_admin_only just check "is this caller an admin", not "is the target protected"),
-- so any admin — including one the owner promoted themselves — could demote the owner, or even
-- demote every admin down to zero with nobody left able to promote anyone back.
--
-- The owner can still demote themselves if they genuinely want to (auth.uid() = old.user_id is
-- allowed through) — this only blocks *other* admins from touching the owner's row. Depends on
-- profiles.email (added in 0005_add_profiles_email.sql) being populated.

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

  if old.role = 'admin' and target_email = 'ttagayona1985@gmail.com' and auth.uid() <> old.user_id then
    raise exception 'Cannot modify or remove the owner''s admin access.';
  end if;

  -- DELETE triggers must return OLD; UPDATE triggers must return NEW to let the update through
  -- (returning OLD there would silently discard every legitimate change to the row, not just
  -- the protected one).
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_owner_admin_role_delete on public.user_roles;
create trigger protect_owner_admin_role_delete
  before delete on public.user_roles
  for each row execute function public.protect_owner_admin_role();

drop trigger if exists protect_owner_admin_role_update on public.user_roles;
create trigger protect_owner_admin_role_update
  before update on public.user_roles
  for each row execute function public.protect_owner_admin_role();
