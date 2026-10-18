-- ============================================================
-- SEED DATA MAGANGYOKK (Disaster Recovery & Initial Bootstrap)
-- ============================================================

-- 1. Seed Profil Default (Aji Arlando)
insert into public.profiles (
  id,
  full_name,
  skills,
  preferred_roles,
  location_pref,
  allow_remote,
  require_paid,
  score_threshold,
  bio,
  portfolio_url,
  github_url
) values (
  '00000000-0000-0000-0000-000000000001',
  'Aji Arlando',
  array['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'Supabase'],
  array['Frontend Engineer Intern', 'Fullstack Developer Intern', 'Software Engineer Intern'],
  'Jakarta',
  true,
  false,
  6.5,
  'Mahasiswa Teknik Informatika tingkat akhir dengan spesialisasi pengembangan web modern menggunakan Next.js, TypeScript, dan Tailwind CSS. Berpengalaman membangun web aggregator dan integrasi API AI.',
  'https://github.com/aji',
  'https://github.com/aji'
) on conflict (id) do nothing;

-- 2. Seed Contoh Lowongan (Dummy Job untuk verifikasi pipeline feed)
insert into public.jobs (
  id,
  title,
  company,
  location,
  is_remote,
  is_paid,
  description,
  url,
  source,
  score,
  score_breakdown
) values (
  '00000000-0000-0000-0000-000000000002',
  'Frontend Developer Intern',
  'Tech Nusantara Inovasi',
  'Jakarta Selatan / Remote',
  true,
  true,
  'Kami mencari mahasiswa antusias untuk bergabung sebagai Frontend Developer Intern. Kualifikasi: Menguasai Next.js, React, TypeScript, dan Tailwind CSS. Mampu bekerja sama dalam tim agile dan integrasi RESTful/GraphQL API.',
  'https://linkedin.com/jobs/view/tech-nusantara-frontend-intern',
  'linkedin',
  9.25,
  '{"next.js": true, "react": true, "typescript": true, "tailwind": true, "remote": true}'::jsonb
) on conflict (url) do nothing;
