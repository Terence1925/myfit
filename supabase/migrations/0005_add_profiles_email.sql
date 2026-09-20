-- BUG FIX: public.profiles never had an email column, in any prior migration.
-- Two real breakages result:
--   1. create-checkout-session's `.select('email, display_name')` names a column that doesn't
--      exist, which PostgREST hard-errors on — every PayMongo checkout attempt would fail.
--   2. AccountPage's "Email:" field renders blank for every user.
-- This adds the column, backfills it from auth.users for existing accounts, and updates the
-- signup trigger so new accounts get it populated going forward.

alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'New Client'), new.email);

  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  return new;
end;
$$;
