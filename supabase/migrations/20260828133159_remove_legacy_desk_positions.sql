-- Remove the seven SponsorMyDesk inventory rows that were intentionally kept
-- during the BrandMyFlight rename. Abort instead of deleting historical data
-- if any environment still has sponsorships attached to those positions.
do $$
begin
  if exists (
    select 1
    from public.flight_sponsorships
    where placement_slug in (
      'laptop-sticker',
      'monitor-wallpaper',
      'desk-mat',
      'coffee-mug',
      'wall-poster',
      'led-display',
      'livestream-background'
    )
  ) then
    raise exception 'Legacy desk positions still have sponsorship records';
  end if;
end
$$;

delete from public.flight_placements
where slug in (
  'laptop-sticker',
  'monitor-wallpaper',
  'desk-mat',
  'coffee-mug',
  'wall-poster',
  'led-display',
  'livestream-background'
);

alter table public.flight_placements
  drop constraint if exists flight_placements_position_index_check;
alter table public.flight_placements
  add constraint flight_placements_position_index_check
  check (position_index between 1 and 10);

alter table public.flight_placements
  drop constraint if exists flight_placements_price_cents_check;
alter table public.flight_placements
  add constraint flight_placements_price_cents_check
  check (price_cents between 2000 and 25000);

alter table public.flight_sponsorships
  drop constraint if exists desk_sponsorships_amount_cents_check;
alter table public.flight_sponsorships
  add constraint flight_sponsorships_amount_cents_check
  check (amount_cents between 2000 and 25000);
