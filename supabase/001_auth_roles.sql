-- CreatorHub milestone 1: profiles, roles, and access control.
-- This project already has these roles: creator and marketing_admin.
-- Run this file once in Supabase Dashboard → SQL Editor → New query.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'creator',
  application_status text not null default 'in_review'
    check (application_status in ('in_review', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

-- Make the migration safe if an earlier profiles table already exists.
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists application_status text;
alter table public.profiles alter column application_status set default 'in_review';
update public.profiles
set application_status = 'in_review'
where application_status is null;
alter table public.profiles alter column application_status set not null;

-- Backfill contact data for profiles created before this migration.
update public.profiles profile
set email = coalesce(profile.email, auth_user.email),
    full_name = coalesce(profile.full_name, nullif(auth_user.raw_user_meta_data ->> 'full_name', ''))
from auth.users auth_user
where profile.id = auth_user.id;

-- Creates a profile automatically for every future email sign-in. New accounts
-- are always regular Creators and start In review.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, application_status)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    'creator',
    'in_review'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

insert into public.profiles (id, email, full_name, role, application_status)
select id, coalesce(email, ''), nullif(raw_user_meta_data ->> 'full_name', ''), 'creator', 'in_review'
from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;

-- marketing_admin is the Team role in this Supabase project. Casting to text
-- keeps this comparison compatible with the existing user_role enum.
create or replace function public.is_team()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role::text = 'marketing_admin'
  );
$$;

revoke all on function public.is_team() from public;
grant execute on function public.is_team() to authenticated;
grant select, update on table public.profiles to authenticated;

drop policy if exists "profiles: read own or team" on public.profiles;
create policy "profiles: read own or team"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_team());

drop policy if exists "profiles: team updates" on public.profiles;
create policy "profiles: team updates"
  on public.profiles for update to authenticated
  using (public.is_team())
  with check (public.is_team());

-- After signing in once, promote an internal account manually:
-- update public.profiles
-- set role = 'marketing_admin', application_status = 'accepted'
-- where email = 'your-team-email@company.com';
