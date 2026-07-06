alter table public.career_profiles add column if not exists job_description text not null default '';
alter table public.career_profiles add column if not exists workspace_data jsonb not null default '{}'::jsonb;
