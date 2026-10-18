# LAPORAN AUDIT REKAYASA PERANGKAT LUNAK: BAGIAN III - ARSITEKTUR DAN TEKNOLOGI
**Proyek:** MagangYokk (Job Aggregator & Application Tracker)  
**Tolok Ukur Standar:** Panduan.txt (Seksi 9-12, Baris 263-428) & Standar Arsitektur Full-Stack Modern  
**Peran:** Principal System Architect & Full-Stack Engineering Auditor  
**Status Audit:** Final (Documented for Repository Artifact)

---

## 0. AUTONOMOUS SKILLS LOADED & JUSTIFIKASI METODOLOGI

Dalam melaksanakan audit arsitektur sistem dan database ini, sistem secara otonom memindai katalog kapabilitas internal dan memuat dua skill spesialis:

1. **`skill://technology-stack-blueprint-generator` (Full-Stack Blueprint & Dependency Auditor)**
   - *Justifikasi Metodologi:* Digunakan untuk membedah tumpukan dependensi runtime vs build-time, memverifikasi konsistensi ORM vs Data API Client, dan mengidentifikasi anomali dependensi semu (*Phantom Dependencies*) yang membebani footprint aplikasi.
2. **`skill://next-best-practices` (Next.js 16 Architecture & RSC Boundary Rules)**
   - *Justifikasi Metodologi:* Digunakan untuk mengevaluasi batasan hidrasi (React Server Components vs Client Leaf Components), arsitektur mutasi data (Server Actions vs Route Handlers), penanganan cache (`revalidate = 0`), serta pola sinkronisasi server state vs client state.
3. **Database Relational Engineering (PostgreSQL & Supabase Internals)**
   - *Justifikasi Metodologi:* Evaluasi file DDL schema, foreign key cascade strategies, integritas constraint, utilisasi B-tree index, deteksi potensi Unbounded Full Table Scan, dan audit konkurensi mutasi data.

---

## 1. THE FOUR SYSTEM ARCHITECTURE AUDIT PILLARS

### PILAR 1: Pemilihan Stack & Kesesuaian Teknologi (Panduan.txt Seksi 9)

Sesuai prinsip `Panduan.txt` Baris 286: *"Yang terpenting adalah kesesuaian teknologi dengan kebutuhan dan kapasitas pengembang."*

#### A. Evaluasi Kesesuaian Ekosistem untuk Solo Developer
- **Tumpukan Utama:** Next.js 16.3.4 (App Router + Turbopack), React 19.2.4, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL via PostgREST), dan Groq API (Llama 3.3 70B).
- **Penilaian Kesesuaian:**
  - *Sangat Efisien:* Menggabungkan frontend dan backend dalam satu deployment monolit modular di Vercel memangkas biaya pemeliharaan infrastruktur (*zero operational cost* untuk solo dev).
  - *Server-Side AI Gateway:* Pemrosesan AI Groq diisolasi di Route Handlers server (`/api/cover-letter` dan `/api/resume/analyze-gap`), menjamin `GROQ_API_KEY` tidak pernah bocor ke browser.

#### B. Audit "Phantom Dependency" & Tech Debt: Kasus Prisma 7
- **Fakta di Repositori:**
  - `package.json` menyertakan: `"prisma": "^7.4.0"`, `"@prisma/adapter-pg": "^7.4.0"`, `"pg": "^8.13.3"`.
  - Terdapat file konfigurasi `prisma.config.ts`, skema `prisma/schema.prisma`, dan build artifact `generated/prisma/client`.
  - Berkas `src/lib/prisma.ts` menginisialisasi singleton `PrismaClient` dengan PgBouncer port 6543 pooler adapter.
  - Terdapat dokumentasi khusus di `AGENTS.md` mengenai aturan PgBouncer dan aturan driver adapter Prisma 7.
- **Temuan Kritis (Phantom Dependency):**
  - **Zero Execution in Production:** Pencarian menyeluruh pada seluruh direktori `src/` menunjukkan bahwa **tidak ada satu pun file runtime (`page.tsx`, `actions.ts`, atau `/api/**`) yang mengimpor atau mengeksekusi query via `prisma`**.
  - Seluruh interaksi database di seluruh aplikasi menggunakan client resmi Supabase (`@supabase/supabase-js`) via `src/lib/supabase.ts`.
  - *Dampak Rekayasa:* Prisma 7, adapter pg, dan generator kodenya adalah **Dead Weight (Beban Semu)**. Dependensi ini menambah waktu `npm install`, memperbesar ukuran `node_modules` hingga puluhan megabyte, dan menambah kompleksitas kognitif tanpa memberikan nilai fungsi riil pada runtime produksi.

---

### PILAR 2: Frontend Architecture & Rendering Strategy (Panduan.txt Seksi 10)

#### A. Evaluasi Strategi Rendering: RSC vs Client Boundary
- **Komposisi Rendering:**
  - `src/app/page.tsx` bertindak sebagai **React Server Component (RSC)**. Halaman ini melakukan data fetching paralel (`Promise.all`) untuk mengambil 100 lowongan (`getJobsWithApplications`) dan profil pengguna (`getProfile`).
  - Halaman dikonfigurasi dengan `export const revalidate = 0` (Dynamic SSR), memastikan data yang disajikan selalu sinkron dengan hasil scraping terbaru dari Supabase.
  - Data yang telah diambil di-pass sebagai props ke `JobFeedClient` (`initialJobs={jobsWithApps}`).
- **Pemisahan Tanggung Jawab (Separation of Concerns):**
  - Pola ini optimal: Server memikul beban query database dan initial HTML rendering, sedangkan browser hanya menangani interaktivitas filter, tab status, dan modal drawer.

#### B. Deteksi State Drift pada Server Action Revalidation
- **Mekanisme Mutasi di `JobFeedClient`:**
  ```tsx
  // job-feed-client.tsx
  const [jobs, setJobs] = useState(initialJobs)
  
  function handleStatusChange(jobId, newStatus) {
    setJobs(prev => prev.map(...)) // Optimistic UI
    startTransition(async () => {
      await updateJobStatus(jobId, newStatus) // Server Action
    })
  }
  ```
- **Masalah Arsitektural (State Drift):**
  - Di dalam `updateJobStatus` (`src/app/actions.ts:39`), server memanggil `revalidatePath("/")`.
  - Panggilan `revalidatePath` memicu re-render server pada `src/app/page.tsx` di latar belakang dan mengirimkan payload Flight baru berisi `initialJobs` terkini ke client.
  - **Namun**, `JobFeedClient` menginisialisasi local state via `useState(initialJobs)` **tanpa mekanisme sinkronisasi props ke state** (ketiadaan sinkronisasi id/version atau state management berbasis URL search params).
  - Jika terjadi perubahan data di server (misalnya scraper menambahkan lowongan baru saat pengguna membuka tab), data baru tersebut tidak akan terefleksikan di UI client kecuali pengguna melakukan reload halaman secara manual.

---

### PILAR 3: Backend Architecture & Data Mutation (Panduan.txt Seksi 11)

#### A. Arsitektur Komunikasi: Route Handlers vs Server Actions
Sistem membagi saluran komunikasi backend dengan sangat baik:
1. **Server Actions (`src/app/actions.ts`):** Digunakan untuk mutasi status cepat (`updateJobStatus`) dan pencatatan (`updateApplicationNotes`). Menghilangkan kebutuhan boilerplate endpoint API manual.
2. **Route Handlers (`src/app/api/**`):** Digunakan untuk beban kerja non-CRUD:
   - `/api/cover-letter`: Panggilan LLM Groq dengan durasi 1-3 detik.
   - `/api/resume/upload`: Penanganan payload biner multipart/form-data.
   - `/api/resume/analyze-gap`: Deep analytical audit CV vs Job.

#### B. Integritas Transaksi & Latensi Non-Atomik
Pada Server Actions `updateJobStatus` dan `updateApplicationNotes`:
```ts
// src/app/actions.ts
const { data: profile } = await supabase.from("profiles").select("id").limit(1).single()
const { error } = await supabase.from("applications").upsert({
  job_id: jobId,
  profile_id: profile.id,
  status: status,
  updated_at: new Date().toISOString()
}, { onConflict: "job_id,profile_id" })
```
- **Kelemahan Arsitektural:**
  1. **Dual Network Roundtrip:** Setiap kali pengguna menggeser kartu di Kanban atau memilih status, server Next.js melakukan **2 kali panggilan jaringan berurutan** ke Supabase: (1) SELECT profile_id, (2) UPSERT application.
  2. **Non-Atomic Phase 2 Risk:** Pengambilan `profiles.limit(1).single()` bersifat non-deterministik jika sistem dibuka ke multi-user pada Phase 2. Kegagalan menentukan user context secara atomik berisiko meng-overwrite data pelamar lain.
  3. **Solusi Rekayasa:** Buat stored procedure / database function di PostgreSQL (`fn_update_job_status(p_job_id, p_status, p_notes)`) atau gunakan join query langsung agar mutasi berjalan dalam 1 roundtrip atomik.

---

### PILAR 4: Database Design, Schema & Indexing (Panduan.txt Seksi 12)

#### A. Evaluasi DDL Schema (`docs/magangyokk-schema.sql`)
1. **Primary Key Strategy:** Seluruh tabel (`jobs`, `profiles`, `applications`) menggunakan `uuid default gen_random_uuid()`. Sangat tepat untuk skalabilitas terdistribusi dan integrasi Supabase Auth.
2. **Tabel `seen_jobs`:** Menggunakan kolom `url` sebagai Primary Key bertipe teks. Efisien untuk deduplikasi scraper instan tanpa perlu lookup ID surrogate.
3. **Foreign Key Safety:**
   `applications.job_id` merujuk ke `jobs(id)` dengan relasi default (NO ACTION). Ini mencegah penghapusan data lamaran dan draft surat secara tidak sengaja jika baris lowongan dihapus. Lowongan wajib menggunakan `expires_at` (soft expiration).
4. **Sintaksis DDL Cacat (Syntax Error pada RLS Script):**
   Pada berkas `docs/magangyokk-schema.sql` baris 154-155:
   ```sql
   152: grant select on public.jobs to anon, authenticated;
   153: 
   154: create policy "jobs_read_all"
   155: create policy "profiles_read_own"
   156:   on public.profiles for select
   ```
   Terdapat baris yatim `create policy "jobs_read_all"` tanpa klausa tabel/aksi pada baris 154, tepat sebelum policy profiles. **Jika file SQL ini dijalankan di SQL Editor Supabase, eksekusi akan gagal dengan syntax error**.

#### B. Audit Query: Bahaya Unbounded Full Table Scan pada `applications`
Di dalam `src/app/page.tsx:17-29`:
```ts
const { data: applications } = await supabase
  .from("applications")
  .select("job_id, status, notes")
```
- **Temuan Kritis:**
  - Query di atas mengambil seluruh baris pada tabel `applications` **tanpa klausa WHERE, tanpa filter user, dan tanpa batasan LIMIT**.
  - Ketika data aplikasi pelamar bertambah ratusan atau ribuan baris, query ini melakukan **Full Table Scan (FTS)** dan mentransfer seluruh database lamaran ke memori Node.js pada setiap render halaman beranda.
  - **Solusi Rekayasa:**
    Lakukan relasi nested join langsung pada query lowongan:
    ```ts
    const { data: jobs } = await supabase
      .from("jobs")
      .select("*, applications(status, notes)")
      .order("score", { ascending: false, nullsFirst: false })
      .limit(100)
    ```
    Atau batasi query applications hanya untuk ID lowongan yang diambil:
    `.from("applications").select("job_id, status, notes").in("job_id", jobs.map(j => j.id))`.

#### C. Ketiadaan Composite Index untuk Homepage Feed
- **Kondisi Query Feed:**
  `src/app/page.tsx:11-12`:
  `.order("score", { ascending: false, nullsFirst: false }).order("scraped_at", { ascending: false })`
- **Kondisi Indexing di `magangyokk-schema.sql`:**
  - `jobs_score_idx` pada `score desc`
  - `jobs_scraped_at_idx` pada `scraped_at desc`
- **Analisis Performa:**
  Kedua indeks tersebut berdiri terpisah (single-column B-tree). Ketika PostgreSQL mengeksekusi multi-column sorting (score DESC, lalu scraped_at DESC), Postgres harus memilih salah satu indeks dan melakukan *in-memory sort* (Sort Node) untuk kolom kedua.
  - **Solusi Rekayasa:** Tambahkan composite index:
    `create index jobs_score_scraped_composite_idx on public.jobs (score desc nulls last, scraped_at desc);`

---

## 2. MATRIKS EVALUASI ARSITEKTUR & TEKNOLOGI

| Pilar | Komponen / Berkas | Kondisi Riil di Kode | Status Arsitektur | Rekomendasi Solusi Rekayasa |
|:---|:---|:---|:---:|:---|
| **Tech Stack** | `package.json`, `prisma/`, `src/lib/prisma.ts` | Prisma 7, adapter pg, dan binary client terpasang penuh tetapi 0% digunakan di kode produksi. | **Tech Debt (Phantom Dependency)** | Tentukan pilihan: migrasikan akses data sepenuhnya ke Prisma 7, ATAU hapus Prisma dan dependensi `@prisma/*` untuk membersihkan 50MB+ dead weight. |
| **Frontend Strategy** | `src/app/page.tsx` & `src/components/job-feed-client.tsx` | SSR RSC me-render halaman awal, namun client `useState(initialJobs)` tidak merespon background Server Action revalidation. | **Arsitektur Kurang Optimal (State Drift)** | Pertahankan filter state di URL Search Parameters (`useSearchParams`), sehingga navigasi dan revalidasi server terkoordinasi secara alami. |
| **Backend Mutation** | `src/app/actions.ts:7-45` | Server action melakukan 2 network roundtrips terpisah (SELECT profile -> UPSERT application). | **Arsitektur Rapuh (Non-Atomic Latency)** | Satukan ke dalam satu PostgreSQL RPC function atomik, atau pass `profile_id` dari session server tanpa perlu SELECT berulang. |
| **Database Query** | `src/app/page.tsx:17-29` | `supabase.from("applications").select("job_id, status, notes")` dijalankan tanpa WHERE / LIMIT. | **Arsitektur Rapuh (Unbounded Full Table Scan)** | Ubah menjadi Supabase nested join: `.from("jobs").select("*, applications(status, notes)")` agar database yang melakukan join terindeks. |
| **Database Schema** | `docs/magangyokk-schema.sql:154` | Baris sintaksis yatim `create policy "jobs_read_all"` tanpa isi sebelum policy profiles. | **Tech Debt (DDL Syntax Error)** | Hapus baris 154 pada file SQL untuk memastikan schema dapat dieksekusi clean di database baru. |
| **Database Index** | `docs/magangyokk-schema.sql:44-45` | Hanya ada index single-column `jobs_score_idx` dan `jobs_scraped_at_idx`. | **Optimasi Index (Missing Composite Index)** | Buat index komposit `(score desc nulls last, scraped_at desc)` untuk mengeliminasi in-memory sorting pada feed beranda. |
| **API Boundary** | `src/app/api/cover-letter` & `/analyze-gap` | Route handlers terisolasi di server dengan timeout guard dan validasi runtime yang ketat. | **Optimal (Production Grade)** | Pertahankan pola isolasi server-side Route Handlers untuk panggilan AI LLM. |

---

## 3. INDEPENDENT ADVISOR VALIDATION (ANTI-FALSE-MISMATCH CHECK)

Sebelum laporan audit Bagian III ini disahkan, evaluasi independen dijalankan untuk memastikan validitas temuan arsitektural:

1. **Apakah benar Prisma sama sekali tidak digunakan di runtime?**
   - *Validasi:* **100% Terverifikasi**. Seluruh folder `src/app/**` dan `src/components/**` hanya mengimpor `supabase` dari `@/lib/supabase`. Satu-satunya kemunculan kata `prisma` di dalam `src/` adalah berkas deklarasi dirinya sendiri di `src/lib/prisma.ts`. Tidak ada pemanggilan model `prisma.job` atau `prisma.application`. Temuan Phantom Dependency adalah **Fakta Kode Absolut**.
2. **Apakah query `applications` tanpa WHERE benar-benar berbahaya pada Phase 1?**
   - *Validasi:* Pada Phase 1 (data uji < 50 baris), query ini belum menimbulkan latency yang terasa di browser. Namun, secara rekayasa perangkat lunak, pola `select()` tanpa batas pada tabel transaksi adalah **Anti-Pattern Klasik**. Membiarkan pola ini lolos audit akan menjadi malapetaka saat tabel membesar. Klasifikasi sebagai *Arsitektur Rapuh* adalah tepat dan proporsional.
3. **Apakah syntax error di `docs/magangyokk-schema.sql` baris 154 mempengaruhi aplikasi berjalan?**
   - *Validasi:* Database Supabase live sudah dibuat sebelumnya secara manual sehingga aplikasi web saat ini tetap berjalan normal. Namun, dokumen DDL adalah *Single Source of Truth* untuk disaster recovery dan migrasi staging. Skrip DDL yang korup merusak reproduksibilitas infrastruktur (*Infrastructure as Code*).

---

## KESIMPULAN AUDIT BAGIAN III

Arsitektur MagangYokk menunjukkan pemilihan fondasi yang cerdas untuk seorang solo developer: Next.js 16 App Router + Supabase + Groq API memberikan rasio kecepatan pengembangan berbanding performa yang sangat tinggi.

Namun, sistem ini memiliki dua paradoks teknis yang harus diselesaikan:
1. **Paradoks ORM ganda:** Menyiapkan konfigurasi kompleks Prisma 7 PgBouncer tetapi menjalankan seluruh aplikasi menggunakan Supabase JS client.
2. **Paradoks Data Fetching:** Menggunakan Next.js 16 RSC mutakhir di frontend, namun melakukan *unbounded Full Table Scan* pada tabel aplikasi di backend database.

Mengeliminasi dependensi semu Prisma dan mengonversi query beranda menjadi nested join PostgreSQL terindeks akan memangkas latency, merapikan codebase, dan memperkuat kesiapan sistem menuju fase publik.
