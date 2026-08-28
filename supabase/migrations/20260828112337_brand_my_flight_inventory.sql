-- Convert the original desk campaign into BrandMyFlight without deleting any
-- historical sponsorship records. Stripe remains the system that owns receipt
-- emails; Supabase stores only public brand data and payment identifiers.

alter table public.desk_placements rename to flight_placements;
alter table public.desk_sponsorships rename to flight_sponsorships;

alter index if exists public.desk_sponsorships_one_active_per_placement
  rename to flight_sponsorships_one_active_per_position;
alter index if exists public.desk_sponsorships_status_idx
  rename to flight_sponsorships_status_idx;
alter index if exists public.desk_sponsorships_expires_at_idx
  rename to flight_sponsorships_expires_at_idx;

alter table public.flight_placements
  drop constraint if exists desk_placements_position_index_check;
alter table public.flight_placements
  drop constraint if exists desk_placements_price_cents_check;

-- Retain any legacy desk rows for payment history while moving them outside
-- the active 1-10 Sponsor Pass range. The application only reads known flight
-- slugs, so these records remain archived and invisible.
update public.flight_placements
set
  position_index = position_index + 20,
  updated_at = now()
where slug in (
  'laptop-sticker',
  'coffee-mug',
  'led-display',
  'desk-mat',
  'wall-poster',
  'livestream-background',
  'monitor-wallpaper'
);

alter table public.flight_placements
  add constraint flight_placements_position_index_check
  check (position_index between 1 and 30);

alter table public.flight_placements
  add constraint flight_placements_price_cents_check
  check (price_cents between 1000 and 40000);

insert into public.flight_placements (slug, name, price_cents, position_index)
values
  ('presenting-sponsor', 'Presenting sponsor', 40000, 1),
  ('premium-position-a', 'Premium position A', 25000, 2),
  ('premium-position-b', 'Premium position B', 25000, 3),
  ('medium-position-a', 'Medium position A', 12000, 4),
  ('medium-position-b', 'Medium position B', 12000, 5),
  ('medium-position-c', 'Medium position C', 12000, 6),
  ('small-position-a', 'Small position A', 6000, 7),
  ('small-position-b', 'Small position B', 6000, 8),
  ('small-position-c', 'Small position C', 6000, 9),
  ('small-position-d', 'Small position D', 6000, 10)
on conflict (slug) do update
set
  name = excluded.name,
  price_cents = excluded.price_cents,
  position_index = excluded.position_index,
  updated_at = now();

alter table public.flight_placements enable row level security;
alter table public.flight_sponsorships enable row level security;

-- The browser does not query sponsorship inventory. Trusted Next.js server
-- code uses the service-role key and exposes only the fields required by UI.
revoke all on table public.flight_placements from anon, authenticated;
revoke all on table public.flight_sponsorships from anon, authenticated;
grant select, insert, update, delete on table public.flight_placements to service_role;
grant select, insert, update, delete on table public.flight_sponsorships to service_role;
