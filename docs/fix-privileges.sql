-- ============================================================
-- FIX PRIVILEGES (Jalankan sekali di Supabase SQL Editor)
-- Memberikan hak akses tabel ke role Supabase Data API
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;

-- Berikan akses penuh ke service_role (untuk background scraper & Next.js backend)
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

-- Agar ke depan tabel baru otomatis dapat permission yang sama
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on routines to service_role;

-- Izin baca tabel jobs untuk publik/anon jika dibutuhkan
grant select on public.jobs to anon, authenticated;
