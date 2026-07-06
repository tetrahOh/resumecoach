alter table public.coaching_sessions add column if not exists documents jsonb not null default '{}'::jsonb;

create or replace function public.enforce_career_profile_limit()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if (select count(*) from public.career_profiles where user_id=new.user_id) >= 3 then
    raise exception 'You can create up to three career profiles.';
  end if;
  return new;
end;
$$;

drop trigger if exists career_profile_limit on public.career_profiles;
create trigger career_profile_limit before insert on public.career_profiles
for each row execute procedure public.enforce_career_profile_limit();

notify pgrst, 'reload schema';
