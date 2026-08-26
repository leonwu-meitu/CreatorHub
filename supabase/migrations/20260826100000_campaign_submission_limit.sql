-- Enforce the CreatorHub rule: one creator may submit at most three
-- non-draft posts for the same campaign. The advisory transaction lock
-- keeps concurrent requests from bypassing the count check.

create or replace function public.guard_campaign_submission_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_post_count integer;
begin
  if new.status = 'draft' then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and old.status <> 'draft'
    and old.campaign_id = new.campaign_id
    and old.creator_id = new.creator_id then
    return new;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(new.creator_id::text || ':' || new.campaign_id::text, 0)
  );

  select count(*)
  into existing_post_count
  from public.campaign_submissions submission
  where submission.creator_id = new.creator_id
    and submission.campaign_id = new.campaign_id
    and submission.status <> 'draft'
    and submission.id <> new.id;

  if existing_post_count >= 3 then
    raise exception 'CAMPAIGN_SUBMISSION_LIMIT_REACHED'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_campaign_submission_limit() from public;

drop trigger if exists enforce_campaign_submission_limit on public.campaign_submissions;
create trigger enforce_campaign_submission_limit
before insert or update of status, campaign_id, creator_id
on public.campaign_submissions
for each row
execute function public.guard_campaign_submission_limit();
