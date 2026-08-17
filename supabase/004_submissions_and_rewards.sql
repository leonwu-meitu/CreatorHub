-- CreatorHub milestone 4: durable Creator submissions and reward decisions.
-- Run once in Supabase Dashboard → SQL Editor → New query.

create table if not exists public.campaign_submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('TikTok','Instagram','Threads')),
  post_url text not null,
  published_at date not null,
  declared_views bigint not null default 0 check (declared_views >= 0),
  verified_views bigint,
  total_engagement bigint,
  engagement_rate numeric(7,4),
  analytics_status text not null default 'pending',
  boost_code text,
  evidence_key text,
  evidence_name text,
  status text not null default 'in_review'
    check (status in ('draft','in_review','qualified','not_qualified')),
  recommendation text,
  confidence integer check (confidence between 0 and 100),
  qualification_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submission_rewards (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.campaign_submissions(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  reward_type text not null,
  amount_idr bigint not null default 0 check (amount_idr >= 0),
  payment_status text not null default 'payment_info_required'
    check (payment_status in ('payment_info_required','approved','in_payment','fully_paid','pay_fail')),
  payment_form_checked boolean not null default false,
  paid_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaign_submissions_campaign_id_idx on public.campaign_submissions(campaign_id);
create index if not exists campaign_submissions_creator_id_idx on public.campaign_submissions(creator_id);
create index if not exists campaign_submissions_status_idx on public.campaign_submissions(status);
create index if not exists submission_rewards_campaign_id_idx on public.submission_rewards(campaign_id);
create index if not exists submission_rewards_creator_id_idx on public.submission_rewards(creator_id);

alter table public.campaign_submissions enable row level security;
alter table public.submission_rewards enable row level security;
grant select, insert, update, delete on public.campaign_submissions to authenticated;
grant select, insert, update, delete on public.submission_rewards to authenticated;

drop policy if exists "submissions: read own or team" on public.campaign_submissions;
create policy "submissions: read own or team" on public.campaign_submissions
  for select to authenticated using (creator_id = auth.uid() or public.is_team());
drop policy if exists "submissions: creator creates own" on public.campaign_submissions;
create policy "submissions: creator creates own" on public.campaign_submissions
  for insert to authenticated with check (creator_id = auth.uid());
drop policy if exists "submissions: creator updates draft or team manages" on public.campaign_submissions;
create policy "submissions: creator updates draft or team manages" on public.campaign_submissions
  for update to authenticated using (creator_id = auth.uid() or public.is_team())
  with check (creator_id = auth.uid() or public.is_team());
drop policy if exists "submissions: creator deletes own draft or team manages" on public.campaign_submissions;
create policy "submissions: creator deletes own draft or team manages" on public.campaign_submissions
  for delete to authenticated using (creator_id = auth.uid() or public.is_team());

drop policy if exists "rewards: read own or team" on public.submission_rewards;
create policy "rewards: read own or team" on public.submission_rewards
  for select to authenticated using (creator_id = auth.uid() or public.is_team());
drop policy if exists "rewards: team manages" on public.submission_rewards;
create policy "rewards: team manages" on public.submission_rewards
  for all to authenticated using (public.is_team()) with check (public.is_team());
