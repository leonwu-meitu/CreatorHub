-- Keep AI extraction as a draft. Only a Team-confirmed/manual override may
-- populate the engagement rate shown to Creators and in reports.

create or replace function public.calculate_submission_engagement_rate()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if lower(replace(coalesce(new.analytics_status, ''), ' ', '_')) <> 'manual_override' then
    new.engagement_rate := null;
  elsif new.verified_views is null or new.verified_views <= 0
     or new.total_engagement is null or new.total_engagement < 0
     or new.total_engagement > new.verified_views then
    new.engagement_rate := null;
  elsif new.engagement_rate is not null
     and new.engagement_rate >= 0 and new.engagement_rate <= 100
     and new.verified_views is not distinct from old.verified_views
     and new.total_engagement is not distinct from old.total_engagement then
    -- Preserve an explicit Team correction when only the rate was edited.
    return new;
  else
    new.engagement_rate := round((new.total_engagement::numeric / new.verified_views::numeric) * 100, 4);
  end if;
  return new;
end;
$$;

drop trigger if exists calculate_submission_engagement_rate on public.campaign_submissions;
create trigger calculate_submission_engagement_rate
before insert or update of verified_views, total_engagement, analytics_status
on public.campaign_submissions
for each row execute function public.calculate_submission_engagement_rate();

-- Repair rows that previously displayed an AI-derived or impossible rate.
-- The SQL Editor has no auth.uid(), so the normal Creator guard trigger would
-- reject this maintenance update. Disable only the guard triggers for the
-- duration of this transaction; they remain enabled for all application users.
do $$
begin
  if exists (select 1 from pg_trigger where tgrelid = 'public.campaign_submissions'::regclass and tgname = 'guard_creator_submission_update') then
    alter table public.campaign_submissions disable trigger guard_creator_submission_update;
  end if;
  if exists (select 1 from pg_trigger where tgrelid = 'public.campaign_submissions'::regclass and tgname = 'guard_creator_raw_analytics_update') then
    alter table public.campaign_submissions disable trigger guard_creator_raw_analytics_update;
  end if;
end;
$$;

update public.campaign_submissions
set engagement_rate = null
where lower(replace(coalesce(analytics_status, ''), ' ', '_')) <> 'manual_override'
   or verified_views is null
   or verified_views <= 0
   or total_engagement is null
   or total_engagement < 0
   or total_engagement > verified_views
   or engagement_rate < 0
   or engagement_rate > 100;

do $$
begin
  if exists (select 1 from pg_trigger where tgrelid = 'public.campaign_submissions'::regclass and tgname = 'guard_creator_submission_update') then
    alter table public.campaign_submissions enable trigger guard_creator_submission_update;
  end if;
  if exists (select 1 from pg_trigger where tgrelid = 'public.campaign_submissions'::regclass and tgname = 'guard_creator_raw_analytics_update') then
    alter table public.campaign_submissions enable trigger guard_creator_raw_analytics_update;
  end if;
end;
$$;
