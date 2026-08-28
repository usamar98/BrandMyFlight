update public.flight_placements
set
  price_cents = 2000,
  updated_at = now()
where slug = 'small-position-d';

alter table public.flight_placements
  drop constraint if exists flight_placements_price_cents_check;

alter table public.flight_placements
  add constraint flight_placements_price_cents_check
  check (price_cents between 2000 and 25000);

-- Preserve completed low-value checkout records for correct Stripe refunds,
-- while preventing new reservations below the standard $20 campaign floor.
alter table public.flight_sponsorships
  drop constraint if exists flight_sponsorships_amount_cents_check;

alter table public.flight_sponsorships
  add constraint flight_sponsorships_amount_cents_check
  check (
    amount_cents between 2000 and 500000
    or (
      amount_cents between 100 and 1999
      and status in ('paid', 'outbid', 'refunded', 'expired')
    )
  );
