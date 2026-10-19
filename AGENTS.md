# AGENTS.md — MagangYokk

Platform web pencari magang untuk mahasiswa IT Indonesia. Scrape lowongan dari LinkedIn & Indeed, filter + scoring otomatis berdasarkan tech stack, tracking status lamaran, dan generate cover letter via Groq API.

## Stack

- **Framework:** Next.js 16 (App Router, React Server Components)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + Shadcn/UI
- **Database & Backend:** Supabase (PostgreSQL) via `@supabase/supabase-js` — 4 tabel: `jobs`, `seen_jobs`, `profiles`, `applications`
- **AI:** Groq API — Llama 3.3 70B (cover letter generator & resume gap analysis)
- **Package manager:** npm (gunakan npm, bukan pnpm atau yarn)
- **Deploy target:** Vercel

## Struktur Project

```
src/
  app/          # Next.js App Router pages & layouts
  lib/
    supabase.ts # Server-side Supabase client (service_role, server-only)
    rate-limit.ts # Sliding-window rate limiter per IP
    types.ts    # TypeScript types (Job, Profile, Application, dll)
docs/
  PRD-MagangYokk.md      # Product Requirements Document v0.2
  magangyokk-schema.sql  # SQL schema Supabase v1.1
  seed.sql               # Seed data bootstrap (profil default Aji)
```

## Setup

```bash
npm install
```

Salin template `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Isi variabel di dalam `.env.local` dengan kredensial proyek Supabase & Groq Anda:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...          # server-only, JANGAN expose ke client
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GROQ_API_KEY=...
INTERNAL_ACTION_SECRET=...             # opsional, untuk guard header x-action-secret
```

## Development

```bash
npm run dev     # start dev server di localhost:3000
npm run build   # production build
npm run lint    # ESLint
```

## Arsitektur Akses Data & Batas Keamanan (Phase 1 Single-User MVP)

**STATUS ARSITEKTUR:** Platform saat ini berstatus **Phase 1 Single-User MVP** untuk pengoperasian mandiri solo-developer (Aji Arlando).

**PENTING:** Semua Supabase query menggunakan `@supabase/supabase-js` dan wajib dijalankan di **server-side** (Server Components, Server Actions, Route Handlers).

- Gunakan `import { supabase } from '@/lib/supabase'`
- `src/lib/supabase.ts` dilindungi oleh `import 'server-only'` — **JANGAN import** di Client Components (`'use client'`)
- `SUPABASE_SERVICE_ROLE_KEY` bypass RLS — ini adalah keputusan desain pragmatis yang disengaja untuk Phase 1 tanpa auth UI publik. Dilindungi oleh:
  1. Module `server-only`
  2. Validasi Origin/Referer guard & `isRequestAuthorized()` di `src/app/actions.ts`
  3. Pseudonimisasi audit log SHA-256 (`src/lib/audit-trail.ts`) sesuai kepatuhan UU PDP No. 27/2022
- Client Components hanya boleh memanggil Server Actions (`src/app/actions.ts`) atau Route Handlers (`src/app/api/`)

### Invarian untuk AI Agent & Roadmap Migrasi Phase 2:
- **DILARANG** mengekspos `SUPABASE_SERVICE_ROLE_KEY` ke client bundle atau membuat Supabase client di Client Component.
- **DILARANG** melakukan hard-delete pada tabel `jobs` (gunakan soft-expire via `expires_at`).
- **Prasyarat Phase 2 (Multi-User Publik):** Sebelum pendaftaran publik dibuka, sistem wajib direfaktorisasi menggunakan `@supabase/ssr` berbasis cookie session HTTP-Only, mengganti `supabase` service_role di Server Actions dengan scoped user client, dan mengaktifkan RLS berbasis `auth.uid() = profile_id`.
## Database Schema

4 tabel di Supabase public schema:

| Tabel | Deskripsi |
|---|---|
| `jobs` | Lowongan hasil scraping. Field utama: `title`, `company`, `url` (unique), `score`, `is_remote`, `source` |
| `seen_jobs` | Dedup tracker scraper. Primary key: `url` |
| `profiles` | Profil user + preferensi scoring. Phase 1: 1 baris hardcoded (Aji) |
| `applications` | Tracking status lamaran per job. Enum: `saved/applied/interview/offered/rejected` |

Relasi: `applications.job_id → jobs.id` (NO ACTION / NO CASCADE), `applications.profile_id → profiles.id` (CASCADE)

RLS aktif di semua tabel. Server-side via service_role bypass RLS.

## Conventions

- **UI/UX Standard (WAJIB):** Setiap kali menyentuh UI, merancang komponen, atau mengubah styling, WAJIB membaca dan menerapkan prinsip dari skill `design:taste-skill`, `design:ui-ux-pro-max`, dan `design:impeccable` (tersedia dalam bundle `design:ui-ux-mastery`). Dilarang menggunakan styling template AI default, layout simetris membosankan tanpa ritme, atau komponen tanpa state interaktif (hover, active, empty, error). Zero em-dash (`—`) di seluruh antarmuka.
- **Naming:** camelCase untuk variabel/fungsi, PascalCase untuk komponen dan types
- **Server Components** (default) untuk semua halaman yang fetch data
- **Client Components** (`'use client'`) hanya kalau butuh interaktivitas (state, event handler)
- **Route Handlers** di `src/app/api/` untuk endpoint yang dipanggil dari client (misal generate cover letter)
- Error handling: gunakan `try/catch` di semua async server functions, return typed error object
- Semua teks UI: Bahasa Indonesia

## Fitur MVP (Phase 1)

1. **Job Feed** — daftar lowongan hasil scraping, sortir by score
2. **Filter** — by remote/onsite, tech stack, sumber
3. **Status Tracking** — Kanban per lowongan (saved → applied → interview → offered/rejected)
4. **Cover Letter Generator** — via Groq API (Route Handler di `src/app/api/cover-letter/`)
5. **Telegram Alert** — scraper Python push notif ke Telegram (di luar Next.js app)

## Hal yang JANGAN Dilakukan

- Jangan hard-delete baris dari tabel `jobs` — gunakan `expires_at` untuk soft-expire
- Jangan import server-only lib di Client Components
- Jangan commit `.env`, `.env.local` — sudah di `.gitignore`
- Jangan pakai `pnpm` atau `yarn` — project ini pakai `npm`

## Known Issues & Pitfalls

- **Supabase Port 5432 Direct Blocked:** Supabase free tier sering memblokir direct port 5432. Gunakan Supabase JS client atau Connection Pooler port 6543 / pooler domain.
- **npm v10.9.3 peer-resolver issue:** Hindari install package besar sekaligus jika muncul error `edgesOut`.
