-- SponsorMyDesk keeps no account or profile table. Stripe owns receipt emails;
-- Supabase stores only the public brand placement and payment identifiers.

create table public.desk_placements (
  slug text primary key,
  name text not null,
  price_cents integer not null check (price_cents between 10000 and 80000),
  position_index smallint not null unique check (position_index between 1 and 7),
  status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  reservation_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'reserved' and reservation_expires_at is not null)
    or (status <> 'reserved' and reservation_expires_at is null)
  )
);

create table public.desk_sponsorships (
  id uuid primary key default gen_random_uuid(),
  placement_slug text not null references public.desk_placements(slug) on update cascade on delete restrict,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text unique,
  project_name text not null check (char_length(project_name) between 1 and 90),
  project_url text not null check (char_length(project_url) <= 500),
  tagline text not null check (char_length(tagline) <= 180),
  favicon_url text check (favicon_url is null or char_length(favicon_url) <= 500),
  x_handle text check (x_handle is null or x_handle ~ '^@[A-Za-z0-9_]{1,31}$'),
  amount_cents integer not null check (amount_cents between 10000 and 80000),
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired', 'refunded')),
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'paid' and paid_at is not null) or status <> 'paid')
);

create unique index desk_sponsorships_one_active_per_placement
  on public.desk_sponsorships (placement_slug)
  where status in ('pending', 'paid');

create index desk_sponsorships_status_idx on public.desk_sponsorships (status);
create index desk_sponsorships_expires_at_idx on public.desk_sponsorships (expires_at) where status = 'pending';

alter table public.desk_placements enable row level security;
alter table public.desk_sponsorships enable row level security;

-- The browser never talks to these tables directly. All reads and writes happen
-- in trusted Next.js server code with the service-role key.
revoke all on table public.desk_placements from anon, authenticated;
revoke all on table public.desk_sponsorships from anon, authenticated;
grant select, insert, update, delete on table public.desk_placements to service_role;
grant select, insert, update, delete on table public.desk_sponsorships to service_role;

insert into public.desk_placements (slug, name, price_cents, position_index)
values
  ('laptop-sticker', 'Laptop sticker', 10000, 1),
  ('coffee-mug', 'Coffee mug', 20000, 2),
  ('led-display', 'LED display', 35000, 3),
  ('desk-mat', 'Desk mat', 45000, 4),
  ('wall-poster', 'Wall poster', 55000, 5),
  ('livestream-background', 'Livestream background', 65000, 6),
  ('monitor-wallpaper', 'Monitor wallpaper', 80000, 7)
on conflict (slug) do update
set
  name = excluded.name,
  price_cents = excluded.price_cents,
  position_index = excluded.position_index,
  updated_at = now();
