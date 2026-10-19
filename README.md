# MagangYokk

> Platform Agregator Lowongan Magang & Tracking Karir Mahasiswa IT Indonesia.

[![CI Gate](https://img.shields.io/badge/CI_Gate-Passing-emerald?style=flat-square&logo=githubactions)](https://github.com/ajiarl/MagangYokk/actions)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![AI Engine](https://img.shields.io/badge/Groq-Llama_3.3_70B-f55036?style=flat-square)](https://groq.com/)
[![Unit Tests](https://img.shields.io/badge/Vitest-51_Passed-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![E2E Tests](https://img.shields.io/badge/Playwright-4_Passed-45ba4b?style=flat-square&logo=playwright)](https://playwright.dev/)
[![Compliance](https://img.shields.io/badge/UU_PDP-Compliant-blue?style=flat-square)](docs/audit/12-privasi-dan-regulasi.md)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## Daftar Isi
1. [Mengapa MagangYokk](#1-mengapa-magangyokk-problem--solution)
2. [Fitur Unggulan](#2-fitur-unggulan-core-features)
3. [Arsitektur & Aliran Data Sistem](#3-arsitektur--aliran-data-sistem)
4. [Tech Stack & Dependensi](#4-tech-stack--dependensi)
5. [Panduan Instalasi & Local Development](#5-panduan-instalasi--local-development)
6. [Suite Pengujian & Quality Gates](#6-suite-pengujian--quality-gates)
7. [Laporan Penjaminan Mutu & Kesiapan Rilis Phase 1](#7-laporan-penjaminan-mutu--kesiapan-rilis-phase-1)
8. [Keamanan & Batas Arsitektur (Single-User vs Multi-User)](#8-keamanan--batas-arsitektur-single-user-vs-multi-user)
9. [Pembuat & Lisensi](#9-pembuat--lisensi)

---

## 1. Mengapa MagangYokk (Problem & Solution)

### Masalah Nyata Mahasiswa IT
- **Kebisingan Portal Umum:** Platform seperti LinkedIn, Glints, atau Jobstreet sering kali mencantumkan judul "Internship", namun pada rincian kualifikasi mensyaratkan pengalaman kerja 1-2 tahun atau sudah berstatus sarjana (fresh graduate).
- **Ketidakcocokan Tech Stack:** Mahasiswa kesulitan memilah lowongan yang cocok dengan kurikulum praktis dan portofolio mereka (seperti Next.js, React, Laravel, TypeScript, atau Supabase) dari tumpukan ratusan iklan lowongan generik.
- **Kelelahan Administratif:** Proses lamaran magang manual memakan waktu berharga: membuat cover letter berulang dari awal dan mencatat status lamaran di spreadsheet manual yang mudah terlupakan.

### Solusi MagangYokk
- **Kurasi Terfokus & Relevan:** Fokus khusus pada lowongan magang mahasiswa IT di wilayah target (Palembang, Jabodetabek, dan Remote WFH).
- **Klasifikasi Tingkat Pendidikan Deterministik:** Sistem memilah secara otomatis apakah lowongan terbuka untuk mahasiswa aktif (D3/D4/S1) atau fresh graduate melalui analisis teks deskripsi kerja.
- **Scoring Kecocokan Cerdas:** Algoritma deterministik mencocokkan kualifikasi loker dengan profil keahlian pengguna (skala skor 0.0 hingga 10.0).
- **AI Cover Letter Drafter:** Menghasilkan draf surat lamaran bilingual (Bahasa Indonesia & Bahasa Inggris) yang disesuaikan secara instan dalam hitungan detik menggunakan Groq Llama 3.3 70B.
- **Kanban Board Interaktif:** Pelacakan siklus hidup lamaran dengan 6 status terstruktur, didukung optimistik UI, pencatatan catatan personal, dan drawer rincian cepat.

---

## 2. Fitur Unggulan (Core Features)

### 1. Radar Scraping Otomatis & Notifikasi Telegram
- Scraper terjadwal berbasis Python (`scripts/radar.py`) memantau lowongan baru dari berbagai sumber secara berkala.
- Menggunakan browser headless Camoufox dengan proteksi anti-bot detection untuk menjamin kelancaran ekstraksi data loker.
- Mengirimkan push alert instan ke Telegram bot saat menemukan lowongan dengan skor kecocokan >= 6.0.

### 2. Tech Scoring Deterministik & Filter Pendidikan
- Modul `src/lib/job-utils.ts` menghitung skor kecocokan (0.0 s/d 10.0) terhadap profil target secara matematis dan transparan tanpa halusinasi.
- Ekstraksi tag teknologi otomatis: mendeteksi Next.js, React, Laravel, TypeScript, Supabase, Tailwind CSS, Python, Docker, dan lainnya.
- Filter pendidikan 3 mode:
  - **Semua:** Menampilkan seluruh loker terdata.
  - **Khusus Mahasiswa (D3/D4/S1):** Menyaring lowongan yang eksplisit menerima mahasiswa aktif atau program magang kampus.
  - **Fresh Graduate:** Menampilkan lowongan yang ditujukan untuk lulusan baru.

### 3. AI Cover Letter Drafter Berkecepatan Tinggi
- Integrasi Groq Cloud API memanfaatkan model Llama 3.3 70B Versatile dengan latensi inferensi di bawah 2 detik.
- Pilihan bahasa instan: Bahasa Indonesia profesional atau English standar industri teknologi global.
- Dilindungi oleh in-memory sliding window rate limiter (maksimal 3 pembuatan per jendela 10 menit) serta proteksi caching draf.

### 4. Responsive Kanban Application Tracker
- 6 Status Lamaran: **Saved**, **Applied**, **Interview**, **Offered**, **Rejected**, dan tab filter **All**.
- Tampilan adaptif multi-perangkat: antarmuka multi-kolom kanban di layar desktop dan tab terarah yang ramah sentuhan di perangkat mobile.
- Notes Drawer: Pencatatan kontak HR, tautan jadwal wawancara, ekspektasi tunjangan/uang saku, dan tanggal tindak lanjut.

### 5. Arsitektur Enterprise & Kepatuhan Regulasi
- **Kepatuhan Penuh UU PDP No. 27/2022:** Persetujuan pemrosesan data transparan, halaman kebijakan privasi (`/privacy`), syarat & ketentuan (`/terms`), dan telemetri ramah privasi tanpa cookie (Zero PII) via `@vercel/analytics`.
- **Audit Logging Terenkripsi:** Pencatatan mutasi data sensitif pada tabel `audit_logs` dengan pseudonimisasi alamat IP menggunakan algoritma hashing SHA-256.
- **Proteksi Server Actions:** Validasi ketat Origin/Referer guard dan `INTERNAL_ACTION_SECRET` untuk mencegah eksekusi tanpa izin.

---

## 3. Arsitektur & Aliran Data Sistem

MagangYokk mengadopsi pola arsitektur modern Next.js App Router yang memisahkan pemrosesan data sensitif di sisi server dengan interaktivitas responsif di sisi klien.

```
+-------------------------------------------------------------+
|              Client Layer (Desktop & Mobile Browser)        |
|   - Responsive Fluid Canvas     - Visual Drag & Drop Kanban |
|   - Hybrid Bottom-Sheet Modal   - Privacy Analytics Client  |
+------------------------------+------------------------------+
                               | HTTP / HTTPS (JSON)
                               v
+-------------------------------------------------------------+
|            Next.js 16.4.2 Serverless Runtime (Vercel)       |
|  +--------------------------+  +-------------------------+  |
|  |  React Server Components |  |   API Route Handlers    |  |
|  |  - Incremental Static R. |  |   - /api/health         |  |
|  |  - Server Actions Guard  |  |   - /api/cover-letter   |  |
|  |  - Audit Trail Logger    |  |   - /api/resume/upload  |  |
|  +--------------------------+  +-------------------------+  |
+--------------------+---------------------+------------------+
                     |                     |
   PostgREST Queries |                     | Token Inference
                     v                     v
+--------------------------+     +----------------------------+
|   Supabase PostgreSQL   |     |    Groq Cloud AI Engine    |
|  - jobs (indexed)        |     |  - Llama 3.3 70B Versatile |
|  - seen_jobs (dedup)     |     |  - 3x/10m Rate Limited     |
|  - applications (kanban) |     +----------------------------+
|  - audit_logs (SHA-256)  |
+--------------------------+
             ^
             | Scraping Sync (Cron / Daemon)
+------------+------------------------------------------------+
|              Background Scraper Daemon (Python 3.11)        |
|   - Camoufox Stealth Headless Browser (Jobstreet & LinkedIn)|
|   - Telegram Bot Instant Push Alert Daemon                  |
+-------------------------------------------------------------+
```

### Penjelasan Komponen Arsitektur:
1. **Client Layer:** Menggunakan React 19 Client Components secara selektif untuk elemen interaktif seperti kanban drag-and-drop, filter chip, dan form draf AI. Seluruh data awal dimuat via Server Components untuk kecepatan FCP (First Contentful Paint).
2. **Next.js Serverless Layer:** Bertindak sebagai backend-for-frontend. Server Actions mengamankan penulisan status aplikasi dan profil, sementara Route Handlers mengelola inferensi AI dan pengecekan kesehatan server.
3. **Database Layer (Supabase PostgreSQL):** Menyimpan katalog lowongan terindeks, catatan dedup scraper, status lamaran pengguna, dan jejak audit trail yang dipseudonimkan.
4. **AI Engine (Groq Cloud):** Memproses generasi cover letter kontekstual berdasarkan deskripsi lowongan dan profil kandidat dengan latensi sangat rendah.
5. **Scraper Daemon:** Skrip independen yang mengumpulkan lowongan, menyaring duplikasi, menghitung skor awal, dan mengirimkan notifikasi instan ke grup Telegram pengguna.

---

## 4. Tech Stack & Dependensi

| Kategori | Teknologi / Library | Versi | Peran dalam Sistem |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.4.2` | Server-Side Rendering, Server Actions, & Route Handlers |
| **UI Library** | React & React DOM | `19.2.8` | Komponen antarmuka deklaratif dan reaktif |
| **Styling** | Tailwind CSS | `v4.0.0` | Desain utilitas modern tanpa overhead CSS runtime |
| **Komponen** | Shadcn/UI & Lucide React | `^4.21.0` | Fondasi komponen aksesibel dan pustaka ikon |
| **Database** | Supabase (PostgreSQL) | `@supabase/supabase-js ^2.116.0` | Penyimpanan relasional, PostgREST API, dan RLS |
| **AI Inference** | Groq Cloud SDK / REST | Llama 3.3 70B | Pembuatan cover letter dan analisis resume |
| **Pengujian Unit** | Vitest | `^3.2.7` | Framework pengujian unit berbasis ESM super cepat |
| **Pengujian E2E** | Playwright | `^1.64.1` | Pengujian end-to-end otomatis pada browser Chromium |
| **Load Testing** | tsx Runner | `^4.23.15` | Harness pengujian beban konkurensi mandiri |
| **Analitik** | `@vercel/analytics` | `^2.0.1` | Telemetri performa dan pengunjung tanpa cookie (Zero PII) |
| **Parser Dokumen** | `pdf-parse-fork` | `^1.2.0` | Ekstraksi teks dari berkas resume PDF kandidat |
| **Scraper** | Python, Camoufox, BeautifulSoup4 | `3.11+` | Ekstraksi data lowongan cerdas anti-deteksi |

---

## 5. Panduan Instalasi & Local Development

### Prasyarat Sistem
- **Node.js:** Versi 20.x LTS atau lebih tinggi
- **npm:** Versi 10.x atau lebih tinggi (gunakan `npm`, hindari `pnpm` atau `yarn`)
- **Python:** Versi 3.11+ (opsional, jika ingin menjalankan scraper radar lokal)
- **Akun Supabase & Groq Cloud:** Kredensial API aktif

### Langkah Setup

#### 1. Kloning Repositori
```bash
git clone https://github.com/ajiarl/MagangYokk.git
cd MagangYokk
```

#### 2. Instalasi Dependensi Node.js
```bash
npm install
```

#### 3. Konfigurasi Environment Variables
Salin berkas template `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Buka `.env.local` dan sesuaikan nilainya:

```env
# URL Basis Aplikasi
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Konfigurasi Supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Engine Groq Cloud
GROQ_API_KEY=gsk_...

# Keamanan Server Actions & Internal Guard (Opsional)
INTERNAL_ACTION_SECRET=your-random-strong-secret-key
```

> **Catatan Keamanan:** `SUPABASE_SERVICE_ROLE_KEY` dan `INTERNAL_ACTION_SECRET` tidak boleh terekspos ke sisi klien. Berkas `src/lib/supabase.ts` dilindungi oleh modul `server-only`.
#### 4. Inisialisasi Database Supabase
Buka SQL Editor di Dashboard Supabase Anda, lalu jalankan secara berurutan:
1. `docs/magangyokk-schema.sql` (Membuat tabel `jobs`, `seen_jobs`, `profiles`, `applications`, `audit_logs`, indeks performa, dan kebijakan RLS).
2. `docs/seed.sql` (Memasukkan data inisialisasi profil dasar).

#### 5. Menjalankan Server Development
```bash
npm run dev
```
Aplikasi dapat diakses melalui peramban di `http://localhost:3000`.

---

## 6. Suite Pengujian & Quality Gates

MagangYokk menerapkan strategi penjaminan mutu piramida pengujian penuh untuk memastikan reliabilitas dan stabilitas pada setiap komit.

| Pengujian | Perintah | Target & Standar Kelulusan | Status Verifikasi |
| :--- | :--- | :--- | :--- |
| **Unit Testing** | `npm test` | 51 unit & integration test lulus (algoritma scoring, validasi utilitas, audit trail, API health, Server Action job mutation) | ✅ 51 Passed |
| **Type Check** | `npx tsc --noEmit` | Strict mode TypeScript tanpa kesalahan kompilasi | ✅ 0 Errors |
| **Linting** | `npm run lint` | Standar ESLint Next.js 16 bersih tanpa pelanggaran sintaks | ✅ 0 Warnings |
| **Production Build** | `npm run build` | Next.js Turbopack compile sukses dengan rute statis & dinamis valid | ✅ Sukses |
| **E2E Testing** | `npm run test:e2e` | Playwright menguji skenario alur pengguna nyata di peramban Chromium (Beranda, Filter, Cover Letter, Mutasi Feed ke Kanban) | ✅ 4 Passed |
| **Load Testing** | `npm run test:load` | Uji ketahanan konkurensi (50 worker simultan, 409+ RPS, 0% error rate) | ✅ Teruji |

---

## 7. Laporan Penjaminan Mutu & Kesiapan Rilis Phase 1

Repositori ini telah diaudit secara komprehensif melalui 14 modul evaluasi teknis independen yang didokumentasikan pada direktori `docs/audit/`. Berdasarkan evaluasi akhir 60 Butir Master Checklist, aplikasi MagangYokk dinyatakan **Production Ready for Phase 1 (Single-User MVP) — Seluruh 60 Butir Master Checklist Terverifikasi untuk Pengoperasian Mandiri (Solo Developer Operation)**:

> **Batasan Ruang Lingkup Operasional:** Status kesiapan produksi ini secara ketat dievaluasi untuk ruang lingkup operasional Phase 1 internal pengguna tunggal (Aji Arlando). Seluruh mekanisme perlindungan (Origin Guard, rate limiting, hashing jejak audit UU PDP) beroperasi optimal pada parameter arsitektural ini.
| No | Modul Audit | Berkas Rujukan | Ringkasan Verifikasi Teknis |
| :---: | :--- | :--- | :--- |
| **01** | Perencanaan & Analisis | `docs/audit/01-perencanaan-dan-analisis.md` | Validasi target pengguna mahasiswa IT dan spesifikasi kebutuhan PRD. |
| **02** | UI/UX & Aksesibilitas | `docs/audit/02-ui-ux-dan-aksesibilitas.md` | Aksesibilitas WCAG 2.1 AA, rasio kontras warna, dan interaksi responsif mobile. |
| **03** | Arsitektur & Teknologi | `docs/audit/03-arsitektur-dan-teknologi.md` | Pola Server Components, isolasi modul `server-only`, dan modularitas kode. |
| **04** | Keamanan Website | `docs/audit/04-keamanan-website.md` | Mitigasi OWASP Top 10, Origin Guard pada Server Actions, dan sanitasi input. |
| **05** | Performa & Optimasi | `docs/audit/05-performance-dan-optimasi.md` | Optimasi font lokal, Core Web Vitals, dan kompresi bundle produksi. |
| **06** | SEO & Visibilitas | `docs/audit/06-seo-dan-visibilitas.md` | Metadata OpenGraph lengkap, `sitemap.xml`, `robots.txt`, dan manifest PWA. |
| **07** | API & Integrasi | `docs/audit/07-api-dan-integrasi.md` | Endpoint `/api/health`, `/api/cover-letter`, dan kontrak respons JSON terstruktur. |
| **08** | Reliability & Scalability | `docs/audit/08-reliability-dan-scalability.md` | Graceful database degradation dan mekanisme fallback saat basis data offline. |
| **09** | Testing & QA | `docs/audit/09-testing-dan-quality-assurance.md` | Kelulusan suite Vitest dan Playwright E2E pada skenario pengguna kritis. |
| **10** | DevOps & Deployment | `docs/audit/10-devops-hosting-dan-deployment.md` | Konfigurasi CI GitHub Actions, Vercel build pipeline, dan manajemen secret. |
| **11** | Monitoring & Maintenance | `docs/audit/11-monitoring-dan-maintenance.md` | Health check endpoint, observability latensi, dan log jejak terstruktur. |
| **12** | Privasi & Regulasi | `docs/audit/12-privasi-dan-regulasi.md` | Kepatuhan UU PDP No. 27/2022, telemetri Zero PII, dan persetujuan pengguna. |
| **13** | Biaya & AI Governance | `docs/audit/13-biaya-analytics-dan-ai-governance.md` | Efisiensi kuota Groq Cloud AI dan sliding-window rate limiting. |
| **14** | Master Checklist 60 Butir | `docs/audit/14-master-checklist-audit-60-points.md` | Evaluasi 57/57 applicable points lolos (Tingkat Kepatuhan 100.0%). |

---

## 8. Keamanan & Batas Arsitektur (Phase 2 Multi-Tenant SSR)

### Implementasi Autentikasi & Manajemen Sesi Sisi Server
MagangYokk mengadopsi autentikasi multi-tenant modern dengan `@supabase/ssr`:
1. **Standarisasi Cookie Sesi HTTP-Only:** Cookie autentikasi dikelola oleh `@supabase/ssr` secara terstandarisasi (`SameSite=Lax`, `Secure` di production) untuk menjembatani sinkronisasi session antara Server Components dan Browser Client.
2. **Scoped User Context & Anti-BOLA:** Seluruh Server Actions (`src/app/actions.ts`) dan Route Handlers mengekstrak identitas kanonikal melalui `supabase.auth.getUser()`, mengikat mutasi secara eksklusif ke `user.id` pengguna, dan mengeliminasi tebak-tebakan profil `.limit(1)`.
3. **Penyegaran Token Otomatis:** Middleware (`src/middleware.ts`) menyegarkan token JWT pengguna secara non-blocking pada setiap permintaan navigasi.
4. **Enforcement RLS PostgreSQL:** Kebijakan RLS berbasis `auth.uid() = user_id` aktif pada tabel `profiles` dan `applications`.
5. **Pemisahan Cache Publik vs Hidrasi Privat:** Rute beranda `/` di-cache sebagai ISR (`revalidate = 300`) untuk data lowongan publik, sedangkan data pelacakan lamaran pengguna terhidrasi secara terisolasi di sisi browser.
6. **Pseudonimisasi Audit Trail SHA-256:** Kepatuhan terhadap UU PDP No. 27/2022 dengan melakukan hashing alamat IP pengguna pada tabel `audit_logs` tanpa menyimpan PII mentah.
---

## 9. Pembuat & Lisensi

### Pembuat
- **Aji Arlando**  
  Mahasiswa Program Studi Sistem Informasi  
  Universitas Islam Negeri (UIN) Raden Fatah Palembang  
  GitHub: [@ajiarl](https://github.com/ajiarl)

### Lisensi
Proyek ini didistribusikan di bawah lisensi terbuka **MIT License**. Silakan merujuk ke berkas [LICENSE](LICENSE) untuk ketentuan penggunaan dan distribusi secara lengkap.
