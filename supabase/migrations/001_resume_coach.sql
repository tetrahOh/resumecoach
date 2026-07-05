create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coaching_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_title text,
  company text,
  source_resume text not null,
  job_description text not null,
  analysis jsonb not null default '{}'::jsonb,
  follow_up_answers jsonb not null default '[]'::jsonb,
  positioning text,
  generated_resume text,
  cover_letter text,
  writers_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.career_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_role text,
  resume_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coaching_sessions add column if not exists profile_id uuid references public.career_profiles(id) on delete set null;

alter table public.profiles enable row level security;
alter table public.coaching_sessions enable row level security;
alter table public.career_profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users own coaching sessions" on public.coaching_sessions;
drop policy if exists "Users own career profiles" on public.career_profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid()=id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid()=id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid()=id);
create policy "Users own coaching sessions" on public.coaching_sessions for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Users own career profiles" on public.career_profiles for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,full_name) values(new.id,new.raw_user_meta_data->>'full_name'); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
