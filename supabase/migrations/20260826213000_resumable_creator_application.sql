-- Allow a Creator to resume or correct their own pending/declined application.
-- Identity is based on auth.uid(); contact numbers and social links are not
-- treated as unique application identifiers.

create or replace function public.submit_my_creator_application(
  new_application_data jsonb
)
returns public.creator_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.creator_applications;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if new_application_data is null or jsonb_typeof(new_application_data) <> 'object' then
    raise exception 'A valid application is required';
  end if;

  -- Prevent two browser tabs from creating applications for the same account
  -- at the same time.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));

  select application.*
  into saved
  from public.creator_applications application
  where creator_id = auth.uid()
  order by submitted_at desc
  limit 1
  for update;

  if found then
    if saved.status = 'accepted' then
      raise exception 'CREATOR_APPLICATION_ALREADY_ACCEPTED'
        using errcode = 'P0001';
    end if;

    update public.creator_applications
    set application_data = new_application_data,
        status = 'in_review',
        decline_reason = null,
        submitted_at = now(),
        reviewed_at = null,
        reviewed_by = null,
        updated_at = now()
    where id = saved.id
    returning * into saved;
  else
    insert into public.creator_applications (creator_id, application_data)
    values (auth.uid(), new_application_data)
    returning * into saved;
  end if;

  return saved;
end;
$$;

revoke all on function public.submit_my_creator_application(jsonb) from public;
grant execute on function public.submit_my_creator_application(jsonb) to authenticated;
