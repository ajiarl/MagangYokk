-- ============================================================
-- MagangYokk — Database Schema v1.1
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Changes from v1.0:
--   [FIX] CREATE TYPE ... IF NOT EXISTS is invalid in Postgres.
--         Wrapped in a DO block that checks pg_type first.
--   [FIX] applications.job_id had ON DELETE CASCADE — deleting a
--         job would silently wipe application history (status,
--         cover letter draft). Removed cascade; jobs should be
--         soft-expired via expires_at instead of hard-deleted.
--         If a job row is ever deleted, Postgres will now block
--         it (default NO ACTION) as long as applications
--         reference it — a safety net, not a workaround.
--   [NOTE] RLS policies below assume all Supabase access happens
--         server-side via service_role (Server Components/Server
--         Actions), which bypasses RLS entirely. If any client-
--         side (anon key) reads/writes are planned for Phase 1,
--         say so and policies will need to be added for anon role.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. JOBS
--    Hasil scraping dari LinkedIn, Indeed, dll.
--    Di-insert oleh Python scraper worker.
-- ────────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  company       text not null,
  location      text,
  is_remote     boolean not null default false,
  is_paid       boolean,                          -- null = tidak diketahui
  description   text,
  url           text not null unique,             -- URL asli lowongan (juga dedup key)
  source        text not null,                    -- 'linkedin' | 'indeed' | 'glints'
  score         numeric(4,2),                     -- 0.00–10.00, dihitung scraper
  score_breakdown jsonb,                          -- {"next.js": true, "laravel": true, ...}
  scraped_at    timestamptz not null default now(),
  expires_at    timestamptz,                      -- estimasi kadaluarsa — pakai ini, bukan hard delete
  created_at    timestamptz not null default now()
);

create index if not exists jobs_score_idx       on public.jobs (score desc);
create index if not exists jobs_scraped_at_idx  on public.jobs (scraped_at desc);
create index if not exists jobs_is_remote_idx   on public.jobs (is_remote);
create index if not exists jobs_source_idx      on public.jobs (source);

-- ────────────────────────────────────────────────────────────
-- 2. SEEN_JOBS
--    Dedup tracker — mencegah scraper push lowongan duplikat.
-- ────────────────────────────────────────────────────────────
create table if not exists public.seen_jobs (
  url           text primary key,
  scraped_at    timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 3. PROFILES
--    Preferensi user untuk scoring & cover letter context.
--    Phase 1: 1 baris hardcoded (Aji). Phase 2: linked ke auth.users.
-- ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid,
  full_name       text not null,
  skills          text[] not null default '{}',
  preferred_roles text[] not null default '{}',
  location_pref   text,
  allow_remote    boolean not null default true,
  require_paid    boolean not null default false,
  score_threshold numeric(4,2) not null default 6.5,
  portfolio_url   text,
  github_url      text,
  bio             text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 4. APPLICATIONS
--    Tracking status lamaran per lowongan.
-- ────────────────────────────────────────────────────────────

-- [FIX] CREATE TYPE tidak support IF NOT EXISTS di Postgres
do $$
begin
  if not exists (select 1 from pg_type where typname = 'application_status') then
    create type application_status as enum (
      'saved',
      'applied',
      'interview',
      'offered',
      'rejected'
    );
  end if;
end $$;

create table if not exists public.applications (
  id                  uuid primary key default gen_random_uuid(),
  -- [FIX] NO cascade — jangan hapus riwayat lamaran kalau job di-delete
  job_id              uuid not null references public.jobs(id),
  profile_id          uuid not null references public.profiles(id) on delete cascade,
  status              application_status not null default 'saved',
  cover_letter_draft  text,
  cover_letter_lang   text not null default 'id',
  applied_at          timestamptz,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (job_id, profile_id)
);

create index if not exists applications_status_idx  on public.applications (status);
create index if not exists applications_profile_idx on public.applications (profile_id);
create index if not exists applications_job_idx     on public.applications (job_id);

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

alter table public.jobs enable row level security;
create policy "jobs_read_all"
  on public.jobs for select
  to anon, authenticated
  using (true);
-- jobs: public read (semua bisa lihat), write hanya via service_role (scraper)
alter table public.jobs enable row level security;

-- Grant standard privileges to Data API roles
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

grant select on public.jobs to anon, authenticated;

create policy "jobs_read_all"
create policy "profiles_read_own"
  on public.profiles for select
  to authenticated
  using ( (select auth.uid()) = user_id );
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

alter table public.applications enable row level security;
create policy "applications_read_own"
  on public.applications for select
  to authenticated
  using (
    profile_id in (
      select id from public.profiles where user_id = (select auth.uid())
    )
  );
create policy "applications_insert_own"
  on public.applications for insert
  to authenticated
  with check (
    profile_id in (
      select id from public.profiles where user_id = (select auth.uid())
    )
  );
create policy "applications_update_own"
  on public.applications for update
  to authenticated
  using (
    profile_id in (
      select id from public.profiles where user_id = (select auth.uid())
    )
  )
  with check (
    profile_id in (
      select id from public.profiles where user_id = (select auth.uid())
    )
  );
create policy "applications_delete_own"
  on public.applications for delete
  to authenticated
  using (
    profile_id in (
      select id from public.profiles where user_id = (select auth.uid())
    )
  );

-- ────────────────────────────────────────────────────────────
-- 6. SEED DATA — profil Aji (Phase 1, hardcoded)
--    Update github_url dengan username GitHub kamu yang benar.
-- ────────────────────────────────────────────────────────────
insert into public.profiles (
  full_name,
  skills,
  preferred_roles,
  location_pref,
  allow_remote,
  require_paid,
  score_threshold,
  portfolio_url,
  github_url,
  bio
) values (
  'Aji Arlando',
  array['next.js', 'react', 'typescript', 'laravel', 'php', 'supabase', 'postgresql', 'mysql', 'tailwind css', 'prisma'],
  array['fullstack', 'frontend', 'backend'],
  'Palembang',
  true,
  false,
  6.5,
  'https://ajiarlando.my.id',
  'https://github.com/ajiarlando',  -- ganti dengan username GitHub kamu
  'Mahasiswa Sistem Informasi UIN Raden Fatah Palembang, aktif membangun web app menggunakan Next.js, Laravel, TypeScript, dan Supabase. Tertarik pada fullstack development dan sedang mencari magang remote atau di Palembang.'
) on conflict do nothing;

-- ============================================================
-- Verifikasi:
--   select table_name from information_schema.tables
--   where table_schema = 'public';
-- ============================================================
