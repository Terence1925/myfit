-- Discount / influencer codes.
--
-- Google Play sets the real price, so a code can't change a price by itself. Each code points at a
-- "Play offer tag" — a discounted offer created once in Google Play Console. When a user enters the
-- code, the app buys that tagged offer instead of the default one. This table is the admin's list of
-- codes plus who used them, so influencer codes can be tracked.
--
-- Users never read these tables directly (that would let them list every code). They call
-- apply_discount_code(), which checks one code at a time.

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and length(code) between 3 and 32),
  label text not null,
  kind text not null default 'campaign' check (kind in ('campaign', 'influencer')),
  owner_name text,
  percent_off integer check (percent_off between 1 and 100),
  offer_tag text not null,
  max_redemptions integer check (max_redemptions > 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create table if not exists public.code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.discount_codes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  -- Set by revenuecat-webhook when the user actually completes a purchase using this code.
  subscribed_at timestamptz,
  unique (code_id, user_id)
);

create index if not exists code_redemptions_code_idx on public.code_redemptions (code_id);

alter table public.discount_codes enable row level security;
alter table public.code_redemptions enable row level security;

drop policy if exists discount_codes_admin_all on public.discount_codes;
create policy discount_codes_admin_all on public.discount_codes
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists code_redemptions_admin_select on public.code_redemptions;
create policy code_redemptions_admin_select on public.code_redemptions
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Checks one code for the signed-in user and, if valid, records that they applied it.
-- Returns nothing for an invalid / expired / used-up code — same answer for all of them, so
-- guessing codes tells an attacker nothing about why one failed.
create or replace function public.apply_discount_code(p_code text)
returns table (code text, label text, percent_off integer, offer_tag text)
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.discount_codes;
  used integer;
begin
  if auth.uid() is null then
    return;
  end if;

  select * into c from public.discount_codes d where d.code = upper(trim(p_code));
  if not found or not c.active then
    return;
  end if;
  if c.expires_at is not null and c.expires_at < now() then
    return;
  end if;

  -- The limit counts completed subscriptions, so people who only tried the code don't use it up.
  if c.max_redemptions is not null then
    select count(*) into used from public.code_redemptions r where r.code_id = c.id and r.subscribed_at is not null;
    if used >= c.max_redemptions then
      return;
    end if;
  end if;

  insert into public.code_redemptions (code_id, user_id) values (c.id, auth.uid())
  on conflict (code_id, user_id) do nothing;

  return query select c.code, c.label, c.percent_off, c.offer_tag;
end;
$$;

revoke all on function public.apply_discount_code(text) from public, anon;
grant execute on function public.apply_discount_code(text) to authenticated;
