-- A small profile picture (a square JPEG of about 256px, stored as a data URL) on the member's own profile row.
-- Members can already update their own row (profiles_update_own_or_admin); the subscription columns stay protected by
-- protect_subscription_columns, which does not touch this one.
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles drop constraint if exists profiles_avatar_url_size;
alter table public.profiles add constraint profiles_avatar_url_size check (avatar_url is null or length(avatar_url) <= 200000);
