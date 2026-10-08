-- Tracks whether a Pro subscriber is still inside their free trial (set only by revenuecat-webhook
-- from RevenueCat's period_type). Used to hold back PDF export until the first real payment, so a
-- user can't start a trial, export their program, and cancel before ever paying.

alter table public.profiles
  add column if not exists subscription_is_trial boolean not null default false;

-- Same protection as the other subscription columns: users can't edit it themselves.
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
  new.subscription_is_trial := old.subscription_is_trial;
  new.stripe_customer_id := old.stripe_customer_id;
  new.stripe_subscription_id := old.stripe_subscription_id;

  return new;
end;
$$;
