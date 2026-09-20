-- SECURITY FIX: profiles_update_own_or_admin (0001_init.sql) lets any signed-in user update
-- their own profile row with no column restriction. Because subscription_tier,
-- subscription_status, subscription_renews_at, etc. are plain columns on that same row, any
-- user could grant themselves free Pro forever with a single client-side call:
--   supabase.from('profiles').update({ subscription_tier: 'pro', subscription_status: 'active' })
--     .eq('id', myOwnId)
-- completely bypassing PayMongo and RevenueCat. This trigger reverts those columns to their
-- prior value on any UPDATE that isn't performed by the service role (used by the
-- create-checkout-session / paymongo-webhook / revenuecat-webhook edge functions) or an admin.
-- Ordinary profile self-editing (display_name, sex, age, weight, sleep, goal, etc.) is untouched.

create or replace function public.protect_subscription_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;

  new.subscription_tier := old.subscription_tier;
  new.subscription_status := old.subscription_status;
  new.subscription_period := old.subscription_period;
  new.subscription_renews_at := old.subscription_renews_at;
  new.subscription_started_at := old.subscription_started_at;
  new.stripe_customer_id := old.stripe_customer_id;
  new.stripe_subscription_id := old.stripe_subscription_id;

  return new;
end;
$$;

drop trigger if exists protect_subscription_columns_trigger on public.profiles;
create trigger protect_subscription_columns_trigger
  before update on public.profiles
  for each row execute function public.protect_subscription_columns();
