-- Count active and total visits without storing names, emails, IP addresses,
-- user agents, accounts, or other personal details. Presence rows are short-lived;
-- the durable record is a single aggregate total.

create table public.site_presence (
  session_id uuid primary key,
  last_seen timestamptz not null default now()
);

create index site_presence_last_seen_idx
  on public.site_presence (last_seen desc);

create table public.site_visitor_metrics (
  singleton boolean primary key default true check (singleton),
  total_visitors bigint not null default 0 check (total_visitors >= 0),
  updated_at timestamptz not null default now()
);

insert into public.site_visitor_metrics (singleton, total_visitors)
values (true, 0)
on conflict (singleton) do nothing;

alter table public.site_presence enable row level security;
alter table public.site_visitor_metrics enable row level security;

revoke all on table public.site_presence from anon, authenticated;
revoke all on table public.site_visitor_metrics from anon, authenticated;
grant select, insert, update, delete on table public.site_presence to service_role;
grant select, insert, update on table public.site_visitor_metrics to service_role;

create or replace function public.record_site_visit(p_session_id uuid)
returns table (live_visitors bigint, total_visitors bigint)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_rows integer;
begin
  delete from public.site_presence
  where last_seen < now() - interval '10 minutes';

  insert into public.site_presence (session_id, last_seen)
  values (p_session_id, now())
  on conflict (session_id) do nothing;

  get diagnostics inserted_rows = row_count;

  if inserted_rows > 0 then
    insert into public.site_visitor_metrics (singleton, total_visitors, updated_at)
    values (true, 1, now())
    on conflict (singleton) do update
    set
      total_visitors = public.site_visitor_metrics.total_visitors + 1,
      updated_at = now();
  else
    update public.site_presence
    set last_seen = now()
    where session_id = p_session_id;
  end if;

  return query
  select
    (
      select count(*)
      from public.site_presence
      where last_seen >= now() - interval '2 minutes'
    )::bigint,
    (
      select metrics.total_visitors
      from public.site_visitor_metrics as metrics
      where metrics.singleton
    )::bigint;
end;
$$;

revoke execute on function public.record_site_visit(uuid) from public, anon, authenticated;
grant execute on function public.record_site_visit(uuid) to service_role;
