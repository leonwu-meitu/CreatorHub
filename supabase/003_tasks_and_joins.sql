-- CreatorHub milestone 3: durable tasks and Creator task joins.
create extension if not exists pgcrypto;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  product text not null check (product in ('Meitu','BeautyCam','Wink')),
  reference_link text,
  tutorial_link text,
  deadline timestamptz not null,
  status text not null default 'active' check (status in ('draft','active','closed')),
  task_data jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creator_campaign_joins (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (campaign_id, creator_id)
);

alter table public.campaigns enable row level security;
alter table public.creator_campaign_joins enable row level security;
grant select, insert, update, delete on public.campaigns to authenticated;
grant select, insert, delete on public.creator_campaign_joins to authenticated;

drop policy if exists "campaigns: signed in can read active" on public.campaigns;
create policy "campaigns: signed in can read active" on public.campaigns
  for select to authenticated using (status = 'active' or public.is_team());
drop policy if exists "campaigns: team manages" on public.campaigns;
create policy "campaigns: team manages" on public.campaigns
  for all to authenticated using (public.is_team()) with check (public.is_team());

drop policy if exists "campaign joins: read own or team" on public.creator_campaign_joins;
create policy "campaign joins: read own or team" on public.creator_campaign_joins
  for select to authenticated using (creator_id = auth.uid() or public.is_team());
drop policy if exists "campaign joins: creator joins own" on public.creator_campaign_joins;
create policy "campaign joins: creator joins own" on public.creator_campaign_joins
  for insert to authenticated with check (creator_id = auth.uid());
drop policy if exists "campaign joins: creator leaves own or team manages" on public.creator_campaign_joins;
create policy "campaign joins: creator leaves own or team manages" on public.creator_campaign_joins
  for delete to authenticated using (creator_id = auth.uid() or public.is_team());
