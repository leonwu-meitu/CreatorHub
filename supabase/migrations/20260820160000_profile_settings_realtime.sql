-- Keep the Team directory synchronized when a Creator updates their profile.
do $$
begin
  alter publication supabase_realtime add table public.creator_profile_settings;
exception
  when duplicate_object then null;
end
$$;
