-- ==============================================================================
-- MagangYokk - Phase 2 Multi-User Auth & Auto Profile Migration
-- Run this in: Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Ensure profiles table references auth.users
alter table public.profiles 
  add constraint profiles_user_id_fkey 
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.profiles 
  add constraint profiles_user_id_unique unique (user_id);

-- 2. Trigger function to automatically create profile row when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    user_id,
    full_name,
    skills,
    preferred_roles,
    allow_remote,
    require_paid,
    score_threshold
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    array[]::text[],
    array[]::text[],
    true,
    false,
    6.0
  )
  on conflict do nothing;

  return new;
end;
$$;

-- 3. Trigger binding on auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Enable RLS on all user data tables
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.audit_logs enable row level security;

-- 5. Policies for profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. Policies for applications
create policy "Users can view own applications"
  on public.applications for select
  using (
    profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

create policy "Users can insert own applications"
  on public.applications for insert
  with check (
    profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );

create policy "Users can update own applications"
  on public.applications for update
  using (
    profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  );
