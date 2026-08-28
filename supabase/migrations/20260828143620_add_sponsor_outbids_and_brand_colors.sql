-- Add the public visual metadata and payment history needed for sponsor
-- takeovers. The browser still has no direct table access; trusted server
-- code owns every quote, checkout reservation, promotion, and refund record.

alter table public.flight_sponsorships
  add column brand_color text not null default '#c8ff25',
  add column supersedes_sponsorship_id uuid references public.flight_sponsorships(id) on delete restrict,
  add column stripe_refund_id text unique,
  add column refunded_at timestamptz;

alter table public.flight_sponsorships
  add constraint flight_sponsorships_brand_color_check
  check (brand_color ~ '^#[0-9a-fA-F]{6}$');

-- Backfill the two reversible live demo sponsors from their official public
-- SVG artwork so the upgraded fleet is immediately representative.
update public.flight_sponsorships
set brand_color = case project_url
  when 'https://www.hirevate.com/' then '#111827'
  when 'https://www.editingapp.live/' then '#52e0a1'
  else brand_color
end
where project_url in ('https://www.hirevate.com/', 'https://www.editingapp.live/');

alter table public.flight_sponsorships
  drop constraint if exists desk_sponsorships_status_check,
  drop constraint if exists flight_sponsorships_amount_cents_check;

alter table public.flight_sponsorships
  add constraint flight_sponsorships_status_check
    check (status in ('pending', 'paid', 'expired', 'refunded', 'outbid')),
  add constraint flight_sponsorships_amount_cents_check
    check (amount_cents between 2000 and 500000);

drop index if exists public.flight_sponsorships_one_active_per_position;

create unique index flight_sponsorships_one_paid_per_position
  on public.flight_sponsorships (placement_slug)
  where status = 'paid';

create unique index flight_sponsorships_one_pending_per_position
  on public.flight_sponsorships (placement_slug)
  where status = 'pending';

create index flight_sponsorships_supersedes_idx
  on public.flight_sponsorships (supersedes_sponsorship_id)
  where supersedes_sponsorship_id is not null;

-- A paid challenger replaces the prior sponsor atomically. The Stripe refund
-- is created first with an idempotency key; this function then records the
-- accepted refund and swaps the visible sponsor in one database transaction.
create or replace function public.promote_flight_sponsorship(
  p_session_id text,
  p_payment_intent_id text default null,
  p_refund_id text default null
)
returns table (promoted_placement_slug text, superseded_sponsorship_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_sponsorship public.flight_sponsorships%rowtype;
  previous_sponsorship public.flight_sponsorships%rowtype;
begin
  select sponsorship.*
  into new_sponsorship
  from public.flight_sponsorships as sponsorship
  where sponsorship.stripe_checkout_session_id = p_session_id
  for update;

  if not found then
    raise exception 'Sponsorship checkout session was not found.';
  end if;

  if new_sponsorship.status = 'paid' then
    return query select new_sponsorship.placement_slug, new_sponsorship.supersedes_sponsorship_id;
    return;
  end if;

  if new_sponsorship.status <> 'pending' then
    raise exception 'Sponsorship checkout session is not pending.';
  end if;

  if new_sponsorship.supersedes_sponsorship_id is not null then
    select sponsorship.*
    into previous_sponsorship
    from public.flight_sponsorships as sponsorship
    where sponsorship.id = new_sponsorship.supersedes_sponsorship_id
      and sponsorship.placement_slug = new_sponsorship.placement_slug
    for update;

    if not found or previous_sponsorship.status <> 'paid' then
      raise exception 'The sponsor being outbid is no longer the active sponsor.';
    end if;

    update public.flight_sponsorships
    set
      status = case when p_refund_id is null then 'outbid' else 'refunded' end,
      stripe_refund_id = p_refund_id,
      refunded_at = case when p_refund_id is null then null else now() end,
      updated_at = now()
    where id = previous_sponsorship.id;
  end if;

  update public.flight_sponsorships
  set
    status = 'paid',
    stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
    paid_at = coalesce(paid_at, now()),
    updated_at = now()
  where id = new_sponsorship.id;

  update public.flight_placements
  set status = 'sold', reservation_expires_at = null, updated_at = now()
  where slug = new_sponsorship.placement_slug;

  return query select new_sponsorship.placement_slug, new_sponsorship.supersedes_sponsorship_id;
end;
$$;

revoke all on function public.promote_flight_sponsorship(text, text, text) from public, anon, authenticated;
grant execute on function public.promote_flight_sponsorship(text, text, text) to service_role;
