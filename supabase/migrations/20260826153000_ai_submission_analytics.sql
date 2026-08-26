-- Secure AI-assisted screenshot analysis for CreatorHub submissions.
-- Raw screenshots remain in the private submission-evidence bucket and are
-- still deleted after the Team records its final decision.

alter table public.campaign_submissions
  add column if not exists analytics_error text,
  add column if not exists analytics_model text,
  add column if not exists analytics_processed_at timestamptz,
  add column if not exists analytics_attempt_count integer not null default 0
    check (analytics_attempt_count >= 0);

-- The database, rather than the model or browser, owns the final formula.
create or replace function public.calculate_submission_engagement_rate()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if lower(replace(coalesce(new.analytics_status, ''), ' ', '_')) = 'manual_override' then
    return new;
  elsif new.verified_views is null or new.verified_views <= 0 or new.total_engagement is null then
    new.engagement_rate := null;
  else
    -- The existing numeric(7,4) column tops out at 999.9999%. Clamp impossible
    -- outliers so they remain reviewable instead of aborting the submission.
    new.engagement_rate := least(
      round((new.total_engagement::numeric / new.verified_views::numeric) * 100, 4),
      999.9999
    );
  end if;
  return new;
end;
$$;

drop trigger if exists calculate_submission_engagement_rate on public.campaign_submissions;
create trigger calculate_submission_engagement_rate
before insert or update of verified_views, total_engagement
on public.campaign_submissions
for each row execute function public.calculate_submission_engagement_rate();

-- Service-role Edge Functions may write extracted analytics; ordinary Creator
-- sessions remain unable to change verified numbers or final decisions.
create or replace function public.guard_creator_submission_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_team() then
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
     or new.qualification_reason is distinct from old.qualification_reason
     or new.analytics_error is distinct from old.analytics_error
     or new.analytics_model is distinct from old.analytics_model
     or new.analytics_processed_at is distinct from old.analytics_processed_at
     or new.analytics_attempt_count is distinct from old.analytics_attempt_count then
    raise exception 'Verified analytics are managed by the Team';
  end if;
  return new;
end;
$$;

revoke all on function public.calculate_submission_engagement_rate() from public;
grant execute on function public.calculate_submission_engagement_rate() to authenticated, service_role;
