-- CreatorHub production completion.
-- Run after 001, 003, 004, and 005 in Supabase SQL Editor.
-- This migration is idempotent and also restores creator_applications when the
-- earlier 002 migration was not available.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists can_access_creator boolean not null default false;

update public.profiles
set can_access_creator = true
where role::text = 'creator' and application_status = 'accepted';

create or replace function public.has_creator_access(target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = target_user and can_access_creator = true
  );
$$;

revoke all on function public.has_creator_access(uuid) from public;
grant execute on function public.has_creator_access(uuid) to authenticated;

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

create index if not exists creator_applications_creator_id_idx
  on public.creator_applications(creator_id);
create index if not exists creator_applications_status_idx
  on public.creator_applications(status);

create table if not exists public.app_expansion_requests (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  current_apps text[] not null default '{}',
  requested_apps text[] not null default '{}',
  reason text not null,
  status text not null default 'in_review'
    check (status in ('in_review','accepted','declined')),
  decline_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.streak_requests (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  completed_tasks integer not null default 0 check (completed_tasks >= 0),
  selected_app text not null check (selected_app in ('Meitu','BeautyCam','Wink')),
  status text not null default 'in_review'
    check (status in ('in_review','approved','declined')),
  vip_code text,
  start_task_count integer not null default 0 check (start_task_count >= 0),
  started_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_forms (
  id uuid primary key default gen_random_uuid(),
  product text not null check (product in ('Meitu','BeautyCam','Wink')),
  month date not null,
  url text not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique (product, month)
);

create index if not exists app_expansion_requests_creator_id_idx on public.app_expansion_requests(creator_id);
create index if not exists app_expansion_requests_status_idx on public.app_expansion_requests(status);
create index if not exists streak_requests_creator_id_idx on public.streak_requests(creator_id);
create index if not exists streak_requests_status_idx on public.streak_requests(status);
create index if not exists payment_forms_month_idx on public.payment_forms(month desc);

create or replace function public.has_product_access(target_product text, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.has_creator_access(target_user) and (
    exists (
      select 1 from public.creator_applications application
      where application.creator_id = target_user
        and application.status = 'accepted'
        and target_product = any(
          string_to_array(
            coalesce(nullif(application.application_data ->> 'interestedApps', ''), application.application_data ->> 'product', ''),
            ','
          )
        )
    )
    or exists (
      select 1 from public.app_expansion_requests request
      where request.creator_id = target_user
        and request.status = 'accepted'
        and target_product = any(request.requested_apps)
    )
  );
$$;

revoke all on function public.has_product_access(text, uuid) from public;
grant execute on function public.has_product_access(text, uuid) to authenticated;

insert into public.payment_forms (product, month, url)
values
  ('Meitu', date_trunc('month', now())::date, 'https://titan-h5.meitu.com/app/starlight/kol-collection/index.html#/?p=TWVpdHU6NDA2'),
  ('BeautyCam', date_trunc('month', now())::date, 'https://titan-h5.meitu.com/app/starlight/kol-collection/index.html#/?p=QmVhdXR5Q2FtOjQwOA=='),
  ('Wink', date_trunc('month', now())::date, 'https://titan-h5.meitu.com/app/starlight/kol-collection/index.html#/?p=V2luazo0MTA=')
on conflict (product, month) do nothing;

alter table public.creator_applications enable row level security;
alter table public.app_expansion_requests enable row level security;
alter table public.streak_requests enable row level security;
alter table public.payment_forms enable row level security;

grant select, insert, update on public.creator_applications to authenticated;
grant select, insert, update on public.app_expansion_requests to authenticated;
grant select, insert, update on public.streak_requests to authenticated;
grant select, insert, update, delete on public.payment_forms to authenticated;

drop policy if exists "applications: read own or team" on public.creator_applications;
create policy "applications: read own or team" on public.creator_applications
  for select to authenticated using (creator_id = auth.uid() or public.is_team());
drop policy if exists "applications: creator creates own" on public.creator_applications;
create policy "applications: creator creates own" on public.creator_applications
  for insert to authenticated with check (creator_id = auth.uid() and status = 'in_review');
drop policy if exists "applications: team reviews" on public.creator_applications;
create policy "applications: team reviews" on public.creator_applications
  for update to authenticated using (public.is_team()) with check (public.is_team());

drop policy if exists "campaigns: signed in can read active" on public.campaigns;
create policy "campaigns: accepted creators or team read" on public.campaigns
  for select to authenticated
  using (public.is_team() or (status = 'active' and public.has_product_access(product)));

drop policy if exists "campaign joins: creator joins own" on public.creator_campaign_joins;
create policy "campaign joins: accepted creator joins own" on public.creator_campaign_joins
  for insert to authenticated
  with check (
    creator_id = auth.uid()
    and (public.is_team() or exists (
      select 1 from public.campaigns campaign
      where campaign.id = creator_campaign_joins.campaign_id
        and campaign.status = 'active'
        and public.has_product_access(campaign.product)
    ))
  );

drop policy if exists "submissions: creator creates own" on public.campaign_submissions;
create policy "submissions: accepted creator creates safe record" on public.campaign_submissions
  for insert to authenticated
  with check (
    creator_id = auth.uid()
    and public.has_creator_access()
    and status in ('draft','in_review')
    and verified_views is null
    and total_engagement is null
    and engagement_rate is null
    and recommendation is null
    and confidence is null
    and qualification_reason is null
    and exists (
      select 1 from public.creator_campaign_joins joined
      where joined.campaign_id = campaign_submissions.campaign_id
        and joined.creator_id = auth.uid()
    )
  );

drop policy if exists "submissions: creator deletes own draft or team manages" on public.campaign_submissions;
create policy "submissions: creator deletes own draft or team manages" on public.campaign_submissions
  for delete to authenticated
  using ((creator_id = auth.uid() and status = 'draft') or public.is_team());

drop policy if exists "app requests: read own or team" on public.app_expansion_requests;
create policy "app requests: read own or team" on public.app_expansion_requests
  for select to authenticated using (creator_id = auth.uid() or public.is_team());
drop policy if exists "app requests: creator creates own" on public.app_expansion_requests;
create policy "app requests: creator creates own" on public.app_expansion_requests
  for insert to authenticated with check (creator_id = auth.uid() and status = 'in_review' and public.has_creator_access());
drop policy if exists "app requests: team reviews" on public.app_expansion_requests;
create policy "app requests: team reviews" on public.app_expansion_requests
  for update to authenticated using (public.is_team()) with check (public.is_team());

drop policy if exists "streaks: read own or team" on public.streak_requests;
create policy "streaks: read own or team" on public.streak_requests
  for select to authenticated using (creator_id = auth.uid() or public.is_team());
drop policy if exists "streaks: creator creates own" on public.streak_requests;
create policy "streaks: creator creates own" on public.streak_requests
  for insert to authenticated with check (creator_id = auth.uid() and status = 'in_review' and public.has_creator_access());
drop policy if exists "streaks: team reviews" on public.streak_requests;
create policy "streaks: team reviews" on public.streak_requests
  for update to authenticated using (public.is_team()) with check (public.is_team());

drop policy if exists "payment forms: authenticated reads" on public.payment_forms;
create policy "payment forms: authenticated reads" on public.payment_forms
  for select to authenticated using (true);
drop policy if exists "payment forms: team manages" on public.payment_forms;
create policy "payment forms: team manages" on public.payment_forms
  for all to authenticated using (public.is_team()) with check (public.is_team());

-- A creator may save and submit their own record, but cannot approve it or
-- change extracted analytics. Team members retain full moderation access.
create or replace function public.guard_creator_submission_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if public.is_team() then
    return new;
  end if;
  if old.creator_id <> auth.uid() or new.creator_id <> auth.uid() then
    raise exception 'Creators may only update their own submissions';
  end if;
  if old.status not in ('draft','in_review') or new.status not in ('draft','in_review') then
    raise exception 'Submission decisions are managed by the Team';
  end if;
  if new.verified_views is distinct from old.verified_views
     or new.total_engagement is distinct from old.total_engagement
     or new.engagement_rate is distinct from old.engagement_rate
     or new.analytics_status is distinct from old.analytics_status
     or new.recommendation is distinct from old.recommendation
     or new.confidence is distinct from old.confidence
     or new.qualification_reason is distinct from old.qualification_reason then
    raise exception 'Verified analytics are managed by the Team';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_creator_submission_update on public.campaign_submissions;
create trigger guard_creator_submission_update
  before update on public.campaign_submissions
  for each row execute function public.guard_creator_submission_update();

-- Storage: public avatars and private analytics evidence. Files are always
-- stored inside a folder named after the authenticated user id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('creator-avatars','creator-avatars',true,2097152,array['image/jpeg','image/png','image/webp']),
  ('submission-evidence','submission-evidence',false,8388608,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars: owner uploads" on storage.objects;
create policy "avatars: owner uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'creator-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars: owner updates" on storage.objects;
create policy "avatars: owner updates" on storage.objects
  for update to authenticated
  using (bucket_id = 'creator-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'creator-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars: owner deletes" on storage.objects;
create policy "avatars: owner deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'creator-avatars' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_team()));

drop policy if exists "evidence: owner uploads" on storage.objects;
create policy "evidence: owner uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'submission-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "evidence: owner or team reads" on storage.objects;
create policy "evidence: owner or team reads" on storage.objects
  for select to authenticated
  using (bucket_id = 'submission-evidence' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_team()));
drop policy if exists "evidence: owner or team deletes" on storage.objects;
create policy "evidence: owner or team deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'submission-evidence' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_team()));

-- Keep profile access in sync with application decisions.
create or replace function public.sync_application_access()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set application_status = new.status,
      can_access_creator = (new.status = 'accepted')
  where id = new.creator_id;
  return new;
end;
$$;

drop trigger if exists sync_application_access on public.creator_applications;
create trigger sync_application_access
  after insert or update of status on public.creator_applications
  for each row execute function public.sync_application_access();

-- Enable realtime refreshes for portal records. The duplicate_object handler
-- keeps this safe when a table was already added to the publication.
do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'profiles','creator_applications','creator_profile_settings','campaigns',
    'creator_campaign_joins','campaign_submissions','submission_rewards',
    'app_expansion_requests','streak_requests','payment_forms'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', relation_name);
    exception when duplicate_object then
      null;
    end;
  end loop;
end $$;
