-- CreatorHub milestone 5: durable Creator profile settings.
-- Run once in Supabase Dashboard → SQL Editor → New query.

create table if not exists public.creator_profile_settings (
  creator_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null default '',
  contact_email text not null default '',
  niches text not null default '',
  tiktok_url text,
  instagram_url text,
  threads_url text,
  whatsapp text,
  avatar_key text,
  avatar_name text,
  updated_at timestamptz not null default now()
);

alter table public.creator_profile_settings enable row level security;
grant select, insert, update on public.creator_profile_settings to authenticated;

drop policy if exists "creator settings: read own or team" on public.creator_profile_settings;
create policy "creator settings: read own or team" on public.creator_profile_settings
  for select to authenticated using (creator_id = auth.uid() or public.is_team());
drop policy if exists "creator settings: creator manages own" on public.creator_profile_settings;
create policy "creator settings: creator manages own" on public.creator_profile_settings
  for insert to authenticated with check (creator_id = auth.uid());
drop policy if exists "creator settings: creator updates own or team" on public.creator_profile_settings;
create policy "creator settings: creator updates own or team" on public.creator_profile_settings
  for update to authenticated using (creator_id = auth.uid() or public.is_team())
  with check (creator_id = auth.uid() or public.is_team());
