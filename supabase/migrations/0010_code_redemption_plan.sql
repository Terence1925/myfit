-- Records which plan (monthly / yearly) a customer bought with a discount code.
-- Set by revenuecat-webhook at the same moment as subscribed_at.

alter table public.code_redemptions
  add column if not exists plan text check (plan in ('monthly', 'yearly'));
