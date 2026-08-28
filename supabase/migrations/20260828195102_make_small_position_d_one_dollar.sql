alter table public.flight_placements
  drop constraint if exists flight_placements_price_cents_check;

alter table public.flight_placements
  add constraint flight_placements_price_cents_check
  check (price_cents between 100 and 25000);

alter table public.flight_sponsorships
  drop constraint if exists flight_sponsorships_amount_cents_check;

alter table public.flight_sponsorships
  add constraint flight_sponsorships_amount_cents_check
  check (amount_cents between 100 and 500000);

update public.flight_placements
set
  price_cents = 100,
  updated_at = now()
where slug = 'small-position-d'
  and status = 'available';
