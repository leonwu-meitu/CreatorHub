-- Prevent a Creator from claiming an email that already belongs to another
-- CreatorHub account or editable Creator profile. The trigger protects every
-- database write, including writes that bypass the website's form.

create or replace function public.guard_creator_contact_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(btrim(new.contact_email));
begin
  if normalized_email = '' then
    return new;
  end if;

  -- Serialize simultaneous attempts to claim the same normalized email.
  perform pg_advisory_xact_lock(hashtextextended(normalized_email, 0));

  if exists (
    select 1
    from public.creator_profile_settings settings
    where settings.creator_id <> new.creator_id
      and lower(btrim(settings.contact_email)) = normalized_email
  ) or exists (
    select 1
    from public.profiles profile
    where profile.id <> new.creator_id
      and lower(btrim(profile.email)) = normalized_email
  ) then
    raise exception 'CREATOR_EMAIL_ALREADY_REGISTERED'
      using errcode = '23505',
            constraint = 'creator_contact_email_unique';
  end if;

  new.contact_email := btrim(new.contact_email);
  return new;
end;
$$;

revoke all on function public.guard_creator_contact_email() from public;

drop trigger if exists guard_creator_contact_email
  on public.creator_profile_settings;
create trigger guard_creator_contact_email
  before insert or update of contact_email
  on public.creator_profile_settings
  for each row execute function public.guard_creator_contact_email();
