-- Reprice Season 01 to the $10-$300 range while keeping historical
-- sponsorship amounts valid if this migration reaches an active project.

alter table public.desk_placements
  drop constraint if exists desk_placements_price_cents_check;

update public.desk_placements
set
  price_cents = case slug
    when 'laptop-sticker' then 1000
    when 'coffee-mug' then 3500
    when 'led-display' then 7500
    when 'desk-mat' then 12000
    when 'wall-poster' then 17500
    when 'livestream-background' then 22500
    when 'monitor-wallpaper' then 30000
    else price_cents
  end,
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

alter table public.desk_placements
  add constraint desk_placements_price_cents_check
  check (price_cents between 1000 and 30000);

alter table public.desk_sponsorships
  drop constraint if exists desk_sponsorships_amount_cents_check;

alter table public.desk_sponsorships
  add constraint desk_sponsorships_amount_cents_check
  check (amount_cents between 1000 and 80000);
