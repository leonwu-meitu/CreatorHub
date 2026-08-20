S
-- CreatorHub milestone 2: real Creator applications and Team decisions.
-- Run after 001_auth_roles.sql.

create extension if not exists pgcrypto;

create table if not exists public.creator_applications (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'in_review'
    check (status in ('in_review','accepted','declined')),
  decline_reason text,
  application_data jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_applications_creator_id_idx on public.creator_applications(creator_id);
create index if not exists creator_applications_status_idx on public.creator_applications(status);

alter table public.creator_applications enable row level security;
grant select, insert, update on public.creator_applications to authenticated;

drop policy if exists "applications: read own or team" on public.creator_applications;
create policy "applications: read own or team" on public.creator_applications
  for select to authenticated using (creator_id = auth.uid() or public.is_team());
drop policy if exists "applications: creator creates own" on public.creator_applications;
create policy "applications: creator creates own" on public.creator_applications
  for insert to authenticated with check (creator_id = auth.uid() and status = 'in_review');
drop policy if exists "applications: team reviews" on public.creator_applications;
create policy "applications: team reviews" on public.creator_applications
  for update to authenticated using (public.is_team()) with check (public.is_team());
