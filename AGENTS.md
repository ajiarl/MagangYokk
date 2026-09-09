# AGENTS.md — MagangYokk

Platform web pencari magang untuk mahasiswa IT Indonesia. Scrape lowongan dari LinkedIn & Indeed, filter + scoring otomatis berdasarkan tech stack, tracking status lamaran, dan generate cover letter via Groq API.

## Stack

- **Framework:** Next.js 16 (App Router, React Server Components)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + Shadcn/UI
- **Database:** Supabase (PostgreSQL) — 4 tabel: `jobs`, `seen_jobs`, `profiles`, `applications`
- **ORM:** Prisma 7 (client di `generated/prisma/client`) dengan `@prisma/adapter-pg`
- **AI:** Groq API — Llama 3.1 70B (cover letter generator)
- **Package manager:** npm (gunakan npm, bukan pnpm atau yarn)
- **Deploy target:** Vercel

## Struktur Project

```
src/
  app/          # Next.js App Router pages & layouts
  lib/
    supabase.ts # Server-side Supabase client (service_role, server-only)
    prisma.ts   # Prisma singleton client (pakai PrismaPg adapter)
    types.ts    # TypeScript types (Job, Profile, Application, dll)
docs/
  PRD-MagangYokk.md      # Product Requirements Document v0.2
  magangyokk-schema.sql  # SQL schema Supabase v1.1
prisma/
  schema.prisma          # Prisma schema (mirror dari Supabase)
prisma.config.ts         # Prisma 7 config file
generated/
  prisma/                # Auto-generated Prisma client — JANGAN edit manual
```

## Setup

```bash
npm install
```

Buat `.env.local` di root dengan variabel berikut (lihat `.env.local` yang sudah ada):

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...          # server-only, JANGAN expose ke client
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GROQ_API_KEY=...
DATABASE_URL=...                        # pooler transaction mode (port 6543) + ?pgbouncer=true
```

## Development

```bash
npm run dev     # start dev server di localhost:3000
npm run build   # production build
npm run lint    # ESLint
```

Setelah ubah `prisma/schema.prisma`:
```bash
npx prisma generate   # re-generate client
```

## Arsitektur Akses Data & Prisma 7 Pattern

**PENTING:** Semua Supabase/Prisma query harus di **server-side** (Server Components, Server Actions, Route Handlers).

- Gunakan `import { supabase } from '@/lib/supabase'` atau `import { prisma } from '@/lib/prisma'`
- **JANGAN import** `supabase.ts` atau `prisma.ts` di Client Components (`'use client'`)
- `SUPABASE_SERVICE_ROLE_KEY` bypass RLS — hati-hati, jangan pernah expose ke browser
- Client Components hanya boleh pakai `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Phase 2)

### Prisma 7 Rules:
- `new PrismaClient({ datasources: ... })` sudah dihapus di Prisma 7.
- Wajib menggunakan Driver Adapter via `@prisma/adapter-pg`.
- Pola singleton di `src/lib/prisma.ts`:
  ```ts
  import { PrismaClient } from '../../generated/prisma/client'
  import { PrismaPg } from '@prisma/adapter-pg'

  const connectionString = process.env.DATABASE_URL!
  const adapter = new PrismaPg({ connectionString })
  export const prisma = new PrismaClient({ adapter })
  ```

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
- Jangan edit file di `generated/` — hasil auto-generate Prisma
- Jangan pakai `pnpm` atau `yarn` — project ini pakai `npm`

## Known Issues & Pitfalls

- **Supabase Port 5432 Direct Blocked:** Supabase free tier sering memblokir direct port 5432. Gunakan Supabase JS client atau Connection Pooler port 6543 / pooler domain.
- **Supabase Pooler + PgBouncer Gotcha:** PgBouncer transaction mode (port 6543) tidak support prepared statements. Pastikan connection string menyertakan parameter `?pgbouncer=true` (atau query config tanpa prepared statements) agar query `@prisma/adapter-pg` tidak error acak di runtime.
- **Prisma 7 Config & CLI:** Nama file config resmi adalah `prisma.config.ts` (bukan `prisma7.config.ts`). `datasource.url` di dalam `schema.prisma` sudah tidak dipakai lagi dan dipindah ke config/adapter.
- **npm v10.9.3 peer-resolver issue:** Hindari install package besar sekaligus jika muncul error `edgesOut`.
