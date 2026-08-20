-- Reliable self-service Creator profile updates and VIP codes for qualified posts.

alter table public.submission_rewards
  add column if not exists vip_code text;

-- Seed a Creator's editable profile from their latest application so the first
-- visit to Profile contains the social links and contact details they provided.
insert into public.creator_profile_settings (
  creator_id,
  display_name,
  contact_email,
  niches,
  tiktok_url,
  instagram_url,
  threads_url,
  whatsapp,
  updated_at
)
select distinct on (application.creator_id)
  application.creator_id,
  coalesce(application.application_data ->> 'name', ''),
  coalesce(application.application_data ->> 'email', profile.email, ''),
  coalesce(application.application_data ->> 'category', ''),
  nullif(application.application_data ->> 'tiktokUrl', ''),
  nullif(application.application_data ->> 'instagramUrl', ''),
  nullif(application.application_data ->> 'threadsUrl', ''),
  nullif(application.application_data ->> 'whatsapp', ''),
  now()
from public.creator_applications application
left join public.profiles profile on profile.id = application.creator_id
where application.status = 'accepted'
order by application.creator_id, application.submitted_at desc
on conflict (creator_id) do update set
  display_name = coalesce(nullif(public.creator_profile_settings.display_name, ''), excluded.display_name),
  contact_email = coalesce(nullif(public.creator_profile_settings.contact_email, ''), excluded.contact_email),
  niches = coalesce(nullif(public.creator_profile_settings.niches, ''), excluded.niches),
  tiktok_url = coalesce(nullif(public.creator_profile_settings.tiktok_url, ''), excluded.tiktok_url),
  instagram_url = coalesce(nullif(public.creator_profile_settings.instagram_url, ''), excluded.instagram_url),
  threads_url = coalesce(nullif(public.creator_profile_settings.threads_url, ''), excluded.threads_url),
  whatsapp = coalesce(nullif(public.creator_profile_settings.whatsapp, ''), excluded.whatsapp);

-- The function always writes to auth.uid(); callers cannot write another
-- Creator's profile. SECURITY DEFINER avoids fragile first-save upserts while
-- preserving the ownership boundary.
create or replace function public.save_my_creator_profile(
  profile_display_name text,
  profile_contact_email text,
  profile_niches text,
  profile_tiktok_url text default null,
  profile_instagram_url text default null,
  profile_threads_url text default null,
  profile_whatsapp text default null
)
returns public.creator_profile_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.creator_profile_settings;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  insert into public.creator_profile_settings (
    creator_id,
    display_name,
    contact_email,
    niches,
    tiktok_url,
    instagram_url,
    threads_url,
    whatsapp,
    updated_at
  ) values (
    auth.uid(),
    trim(profile_display_name),
    trim(profile_contact_email),
    profile_niches,
    nullif(trim(profile_tiktok_url), ''),
    nullif(trim(profile_instagram_url), ''),
    nullif(trim(profile_threads_url), ''),
    nullif(trim(profile_whatsapp), ''),
    now()
  )
  on conflict (creator_id) do update set
    display_name = excluded.display_name,
    contact_email = excluded.contact_email,
    niches = excluded.niches,
    tiktok_url = excluded.tiktok_url,
    instagram_url = excluded.instagram_url,
    threads_url = excluded.threads_url,
    whatsapp = excluded.whatsapp,
    updated_at = excluded.updated_at
  returning * into saved;

  return saved;
end;
$$;

revoke all on function public.save_my_creator_profile(text,text,text,text,text,text,text) from public;
grant execute on function public.save_my_creator_profile(text,text,text,text,text,text,text) to authenticated;
