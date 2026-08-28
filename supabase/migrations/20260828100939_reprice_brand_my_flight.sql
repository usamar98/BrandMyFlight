-- Lower the active BrandMyFlight campaign prices while preserving historical
-- sponsorship amounts and Stripe transaction records.

update public.flight_placements
set
  price_cents = case slug
    when 'presenting-sponsor' then 25000
    when 'premium-position-a' then 12000
    when 'premium-position-b' then 12000
    when 'medium-position-a' then 6000
    when 'medium-position-b' then 6000
    when 'medium-position-c' then 6000
    when 'small-position-a' then 2000
    when 'small-position-b' then 2000
    when 'small-position-c' then 2000
    when 'small-position-d' then 2000
    else price_cents
  end,
  updated_at = now()
where slug in (
  'presenting-sponsor',
  'premium-position-a',
  'premium-position-b',
  'medium-position-a',
  'medium-position-b',
  'medium-position-c',
  'small-position-a',
  'small-position-b',
  'small-position-c',
  'small-position-d'
);
