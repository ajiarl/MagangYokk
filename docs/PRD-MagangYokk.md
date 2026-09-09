# PRD — MagangYokk
**Product Requirements Document**
Version: 1.0 · Status: Implemented (Ready for Deploy) · Author: Aji Arlando · Date: 2026-09-09

---

## 1. Executive Summary

**Problem Statement:**
Mahasiswa IT/Sistem Informasi Indonesia kesulitan mencari lowongan magang yang relevan secara efisien — platform yang ada terlalu generik, tidak menyaring berdasarkan tech stack, dan tidak membantu proses melamar (cover letter, tracking status).

**Proposed Solution:**
MagangYokk adalah platform web untuk mahasiswa developer Indonesia yang mengagregasi, menyaring, dan menilai otomatis lowongan magang dari berbagai sumber, dilengkapi Kanban tracking status lamaran dan AI Cover Letter Generator via Groq API (Llama 3.1 70B).

**Success Criteria (MVP Phase 1):**
- Scraper berhasil pull ≥ 20 lowongan relevan per hari dari LinkedIn & Indeed
- Match Score accuracy: dari log harian, ≤ 20% lowongan ditandai manual sebagai "salah skor" oleh Aji (tracked via simple log/spreadsheet)
- Cover Letter Generator menghasilkan draft dalam < 10 detik
- Zero false-positive alert (lowongan duplikat tidak muncul dua kali)
- Page load time < 2 detik (LCP) untuk halaman Job Feed utama

---

## 2. Contacts

| Name | Role | Catatan |
|---|---|---|
| Aji Arlando | Product Owner + Developer | Solo dev, mahasiswa SI UIN Raden Fatah PLG |
| Sena (Hermes) | AI PA + Technical Advisor | PRD, arsitektur, review |

---

## 3. Background

**Konteks:**
Aji sedang aktif mencari magang sebagai web developer. Pencarian manual di LinkedIn, Glints, dan Indeed memakan waktu dan banyak noise — banyak lowongan tidak relevan dengan stack yang dikuasai (Laravel, Next.js, TypeScript, Supabase). Tidak ada platform yang secara otomatis menilai kecocokan lowongan dengan profil developer spesifik.

**Mengapa sekarang?**
- Script scraper awal (`internship_radar.py`) sudah berjalan dan terbukti bisa pull data relevan.
- Groq API tersedia gratis (500k token/hari) dan OpenAI-compatible — zero setup cost untuk MVP.
- Momentum: profil LinkedIn baru rapi, waktu yang tepat untuk aktif apply.

**Peluang tambahan:**
Jika dibuka ke publik (Phase 2), platform ini bisa menjadi portofolio flagship sekaligus produk yang menjawab pain point nyata mahasiswa IT Indonesia.

---

## 4. Objective

**Tujuan Utama:**
Membantu Aji (dan nantinya mahasiswa developer Indonesia) menemukan dan melamar magang yang relevan secara lebih cepat dan terorganisir.

**Mengapa ini penting:**
- Mengurangi waktu pencarian magang dari ~1 jam/hari menjadi < 5 menit review
- Meningkatkan kualitas lamaran dengan cover letter yang dipersonalisasi otomatis
- Membangun portofolio project yang punya real use case dan (nantinya) real users

**Key Results (SMART):**
- **KR1:** Dalam 30 hari pertama *setelah MVP selesai di-deploy*, minimal 5 lowongan magang dilamar melalui platform
- **KR2:** Cover letter yang dihasilkan dipakai (tanpa banyak edit) di ≥ 70% lamaran
- **KR3:** Tidak ada downtime scraper > 1 jam tanpa notifikasi alert
- **KR4 (Phase 2):** Minimal 10 user aktif dalam 60 hari setelah launch publik

---

## 5. Market Segment

**Target Utama (MVP Phase 1):**
- Aji Arlando — mahasiswa SI semester akhir, stack: Laravel/Next.js/TypeScript/Supabase
- Solo user, internal tool

**Target Sekunder (Phase 2 — Publik):**
- Mahasiswa IT/Informatika/Sistem Informasi semester 5–8 di Indonesia
- Sedang aktif mencari magang atau kerja pertama
- Familiar dengan tech stack modern (tidak harus jago, tapi paham ekosistem web dev)
- Lokasi prioritas: Remote (nasional) atau kota-kota besar (Jakarta, Palembang, Bandung, Surabaya)

**Constraints:**
- Tidak menyasar non-tech (marketing, desain murni, dll) di MVP
- Tidak menyasar senior developer / karir berpengalaman

---

## 6. Value Proposition

**Jobs/Needs yang Diselesaikan:**
1. "Saya mau tau lowongan magang yang cocok sama stack saya tanpa cari manual tiap hari"
2. "Saya mau tau seberapa cocok saya dengan lowongan ini sebelum membuang waktu apply"
3. "Saya mau nulis cover letter yang bagus tapi cepat, tanpa mulai dari nol tiap kali"
4. "Saya mau tau sudah apply ke mana aja dan statusnya gimana"

**Gains:**
- Feed lowongan yang sudah tersaring dan dinilai — buka platform, langsung relevan
- Skor kecocokan (0–10) dengan breakdown alasan — bisa prioritas dengan cerdas
- AI Cover Letter Generator via Groq API — draft siap dalam < 10 detik
- Kanban tracking (Saved → Applied → Interview → Rejected) — semua dalam satu tempat
- Notifikasi Telegram real-time saat ada lowongan baru yang lolos filter

**Pains Dihindari:**
- Scroll LinkedIn berjam-jam untuk menemukan 1-2 lowongan relevan
- Menulis cover letter dari nol berulang-ulang
- Lupa sudah apply ke mana dan statusnya apa
- Dapat notifikasi lowongan yang tidak relevan sama sekali

**Keunggulan vs Alternatif:**
| Aspek | LinkedIn/Glints | JobStreet | MagangYokk |
|---|---|---|---|
| Filter by tech stack | Manual | Manual | Otomatis + scored |
| Cover letter helper | Tidak ada | Tidak ada | AI-generated |
| Application tracking | Parsial | Tidak ada | Kanban penuh |
| Notifikasi cerdas | Generic | Generic | Personalisasi profil |
| Sumber agregat | 1 platform | 1 platform | Multi-source |

---

## 7. Solution

### 7.1 User Flow

```
[Scraper Worker]
    ↓ (tiap 09:00 & 18:00 WIB)
Pull jobs dari LinkedIn + Indeed
    ↓
Pre-filter (Remote / Palembang / Luar Kota Paid)
    ↓
Stack Scoring (0–10) vs profil user
    ↓
Dedup via seen_jobs table
    ↓
Push ke Supabase DB → Telegram Alert

[User membuka MagangYokk]
    ↓
Lihat Job Feed → filter by stack/lokasi/score
    ↓
Klik detail lowongan → lihat score breakdown
    ↓
Klik "Generate Cover Letter" → Groq API draft (Next.js Route Handler)
    ↓
Edit draft → salin ke email/portal lamaran
    ↓
Update status di Kanban (Applied/Interview/Rejected)
```

### 7.2 Key Features

#### F1 — Job Feed & Smart Filter
- Daftar lowongan hasil kurasi dengan card per lowongan
- Info: judul, perusahaan, lokasi, remote/onsite, match score, sumber, tanggal
- Filter: tech stack (multi-select), lokasi, remote only, min score
- Sort: score tertinggi, terbaru
- Infinite scroll / pagination

#### F2 — Match Score Breakdown
- Skor 0–10 per lowongan berdasarkan:
  - Stack overlap (misal: "Next.js match ✓, Laravel match ✓, Vue tidak ada")
  - Lokasi preference match
  - Remote/paid status
- Badge color: Hijau (≥7), Kuning (5–6.9), Abu (< 5)
- Tooltip/expand untuk lihat alasan detail

#### F3 — Application Kanban
- Kolom: Saved → Applied → Interview → Offered → Rejected
- Drag & drop atau button update status
- Field: tanggal apply, catatan personal, link job original
- Filter by status

#### F4 — AI Cover Letter Generator
- Trigger: tombol "Generate Cover Letter" di detail lowongan
- Input otomatis: deskripsi lowongan + profil user (nama, stack, porto, pengalaman)
- Backbone: Groq API — Next.js Route Handler call `api.groq.com/openai/v1/chat/completions` langsung
- Model: `llama-3.1-70b-versatile` (free tier, 500k token/hari)
- API key disimpan di Vercel env var `GROQ_API_KEY` — tidak pernah expose ke client
- Output: draft cover letter / cold email dalam Bahasa Indonesia atau Inggris (pilihan)
- Tersimpan di tabel `applications.cover_letter_draft`
- User bisa edit langsung di platform (rich text sederhana)

#### F5 — Telegram Notification
- Alert real-time ke Telegram saat ada lowongan baru yang lolos filter dan score ≥ threshold (default: 6.5)
- Format: nama lowongan, perusahaan, lokasi, score, link apply
- Via Hermes Gateway (sudah aktif)

#### F6 — User Profile (Phase 1: hardcoded config, Phase 2: editable UI)
- Stack list (untuk scoring)
- Preferred location & remote preference
- Porto URL, GitHub URL (untuk context cover letter generator)
- Score threshold untuk alert

### 7.3 Technology

| Layer | Pilihan | Alasan | Status Implementasi |
|---|---|---|---|
| Frontend | Next.js 16 (App Router + Turbopack) | Stack utama Aji, RSC = performa + SEO | Selesai (Next.js 16.3.4) |
| Styling | Tailwind CSS v4 + Linear Dark UI Standard | Bundle Taste + UI/UX Pro Max + Impeccable | Selesai |
| Language | TypeScript | Type safety ketat | Selesai |
| Database | Supabase (PostgreSQL) | Auth ready, server-side client, free tier | Selesai (30 jobs live) |
| ORM | Prisma 7 (@prisma/adapter-pg) | Type-safe queries via Pooler port 6543 | Selesai |
| AI Backbone | Groq API (qwen/qwen3.8-27b) | Anti-halusinasi prompt, fast latency | Selesai (< 2 detik) |
| Scraper | Python JobSpy (LinkedIn) + Camoufox (Jobstreet/Glints) | Cloudflare bypass 100% | Selesai |
| Scraper Infra | GitHub Actions Scheduled Daemon | Auto run 09:00 & 18:00 WIB di server GitHub | Selesai |
| Deployment | Vercel (Web) | Hosting gratis, Next.js native | Siap Deploy (Tinggal Link) |
| Notifikasi | Hermes Gateway → Telegram | Notifikasi loker relevan | Selesai |

### 7.4 Assumptions

- [ ] Groq free tier cukup untuk usage harian (500k token/hari, estimasi ~50 cover letter/hari)
- [ ] JobSpy stabil untuk scrape LinkedIn tanpa hit rate-limit dalam frekuensi 2x/hari
- [ ] Supabase free tier cukup untuk MVP (500MB storage, 50k MAU)
- [ ] User (Aji) akan aktif update status Kanban secara manual
- [ ] Cover letter dalam Bahasa Indonesia lebih diutamakan untuk tahap awal

---

## 8. Release Plan

### Phase 1 — MVP (Status: Selesai & Terverifikasi)
**Checklist Implementasi Nyata:**
- [x] Setup repo Next.js 16.3.4 + Supabase PostgreSQL + Prisma 7 (@prisma/adapter-pg)
- [x] DB Schema: `jobs`, `applications`, `profiles`, `seen_jobs` (terpasang di Supabase live)
- [x] Multi-Source Scraper Cloud & Stealth: LinkedIn via GitHub Actions daemon + Jobstreet Indonesia via Camoufox C++ anti-detect browser (79 loker aktif, 0 dummy data)
- [x] Cloud Automation: GitHub Actions daemon berjalan terjadwal jam 09:00 & 18:00 WIB
- [x] Job Feed halaman utama + multi-filter (Stack, Search, Status, Edu Target Magang vs Wisuda)
- [x] Detail lowongan + match score breakdown real-time
- [x] Application Status Tracking 6-state (Saved → Applied → Interview → Offered → Rejected) dengan optimistic UI update
- [x] Interactive Visual Kanban Board (Drag & Drop) untuk kelola pipeline lamaran kerja secara instan
- [x] Application Notes Drawer: modal pencatatan riwayat kontak HR, jadwal interview, dan gaji tersimpan di Supabase
- [x] Telegram Instant Push Alert: watchdog daemon 30m mengabari Aji via chat Telegram saat ada loker relevan baru (Score >= 6.0)
- [x] Cover Letter Generator via Groq API (`qwen/qwen3.8-27b`) dengan strict anti-hallucination prompt
- [x] Standar UI/UX papan atas: Mengadopsi bundle Taste, UI/UX Pro Max, dan Impeccable
- [x] Maintenance & Security Runbook (`docs/MAINTENANCE.md`)
- [ ] Final Step: Deploy ke Vercel (kapan pun Aji ingin link production live)

**Non-Goals Phase 1:**
- Tidak ada auth user (single-user, config hardcoded)
- Tidak ada payment/premium
- Tidak ada mobile app
- Tidak ada scraping Glints/Kalibrr (next phase)
- Tidak ada public signup

### Phase 2 — Publik (setelah MVP stabil, ~4–6 minggu tambahan)
- Supabase Auth (Google OAuth)
- User Profile editable (stack, preferensi, porto)
- Custom alert threshold per user
- Tambah sumber: Glints, Kalibrr (via Playwright)
- Custom domain
- Onboarding flow untuk user baru

### Phase 3 — Growth (TBD)
- Dashboard analytics (apply rate, interview rate)
- Email notification (alternatif Telegram)
- Referral / share fitur
- Mungkin: matching dua arah (company posting)

---

## Non-Goals (Global)

- Bukan job board umum — fokus magang developer
- Bukan ATS (Applicant Tracking System) untuk perusahaan
- Tidak menjamin keberhasilan lamaran
- Tidak menyimpan data sensitif (KTP, rekening bank, dll)

---

## Risiko Teknis

| Risiko | Probabilitas | Dampak | Mitigasi |
|---|---|---|---|
| LinkedIn blokir scraper | Sedang | Tinggi | Rate limit 2x/hari, user-agent rotation, fallback ke Indeed |
- LinkedIn ToS violation saat scraping | Rendah (internal, 2x/hari) | Tinggi di Phase 2 | Phase 1: low-freq internal only. Phase 2: review ulang opsi API resmi / partnership |
- Groq rate limit habis | Sangat Rendah | Rendah | 500k token/hari >> estimasi usage; monitor via Groq dashboard |
| Supabase RLS config salah → data leak | Rendah | Kritis | Test RLS policy sebelum Phase 2 launch |
| Cover letter kualitas jelek → user tidak pakai | Sedang | Sedang | Iterasi prompt, minta feedback Aji di awal |
| Vercel cold start lambat untuk route scraper trigger | Rendah | Rendah | Scraper tetap di Hermes Cron, bukan di Vercel function |

---

*MagangYokk · PRD v0.1 · Draft for internal review*
