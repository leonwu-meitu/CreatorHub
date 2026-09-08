-- Persist the raw metrics extracted from an analytics screenshot so Team
-- members can verify each value before relying on the calculated rate.
alter table public.campaign_submissions
  add column if not exists analytics_likes integer not null default 0 check (analytics_likes >= 0),
  add column if not exists analytics_comments integer not null default 0 check (analytics_comments >= 0),
  add column if not exists analytics_reposts integer not null default 0 check (analytics_reposts >= 0),
  add column if not exists analytics_shares integer not null default 0 check (analytics_shares >= 0),
  add column if not exists analytics_favorites integer not null default 0 check (analytics_favorites >= 0);

-- Keep raw analytics values Team-managed just like the verified totals.
create or replace function public.guard_creator_raw_analytics_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_team() then
    return new;
  end if;
  if new.analytics_likes is distinct from old.analytics_likes
     or new.analytics_comments is distinct from old.analytics_comments
     or new.analytics_reposts is distinct from old.analytics_reposts
     or new.analytics_shares is distinct from old.analytics_shares
     or new.analytics_favorites is distinct from old.analytics_favorites then
    raise exception 'Extracted analytics are managed by the Team';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_creator_raw_analytics_update on public.campaign_submissions;
create trigger guard_creator_raw_analytics_update
before update of analytics_likes, analytics_comments, analytics_reposts,
  analytics_shares, analytics_favorites
on public.campaign_submissions
for each row execute function public.guard_creator_raw_analytics_update();
