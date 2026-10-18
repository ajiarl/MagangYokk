# LAPORAN AUDIT REKAYASA PERANGKAT LUNAK: BAGIAN I - PERENCANAAN DAN ANALISIS
**Proyek:** MagangYokk (Job Aggregator & Application Tracker)  
**Tolok Ukur Standar:** Panduan.txt (Seksi 1-4, Baris 20-139) & Rekayasa Kebutuhan Perangkat Lunak Profesional  
**Peran:** Principal Product Architect & Software Requirements Engineer  
**Status Audit:** Final (Documented for Repository Artifact)

---

## 0. AUTONOMOUS SKILLS LOADED & JUSTIFIKASI METODOLOGI

Dalam melaksanakan audit ini, sistem secara otonom memindai katalog kapabilitas internal dan memuat dua skill inti perencanaan produk:

1. **`skill://create-prd` (The 8-Section Requirements Engineering Standard)**
   - *Justifikasi Metodologi:* Digunakan untuk mengevaluasi kelengkapan taksonomi kebutuhan sistem (Problem Framing, SMART Success Metrics/OKRs, Value Proposition Curve, dan Release Planning Boundary). Memastikan bahwa setiap klaim fungsional memiliki instrumen pengukur keberhasilan yang nyata, bukan asumsi kualitatif.
2. **`skill://user-story-mapping` (Jeff Patton 2D Story Mapping Framework)**
   - *Justifikasi Metodologi:* Digunakan untuk memetakan alur naratif horizontal pengguna (*Backbone*: Discovery -> Evaluation -> Drafting -> Tracking) terhadap irisan rilis vertikal (*Release Slices*). Metodologi ini memungkinkan deteksi presisi antara kebutuhan inti MVP (*Walking Skeleton*) melawan pembengkakan cakupan dini (*Scope Creep*).

---

## 1. THE FOUR FOUNDATIONAL PILLARS AUDIT

### PILAR 1: Tujuan, Problem Statement & Nilai Tambah (Panduan.txt Seksi 1)

#### A. Evaluasi Problem Statement & Diferensiasi Pasar
- **Klaim PRD:** Mahasiswa IT/SI Indonesia kesulitan menyaring lowongan magang relevan karena platform umum (LinkedIn/Indeed/JobStreet) terlalu generik, tidak memiliki scoring tech stack otomatis, dan tidak terintegrasi dengan alat bantu lamaran (cover letter generator dan kanban tracking).
- **Fakta Implementasi:**
  - *Diferensiasi Terwujud:* Pipeline scraping (`scripts/radar.py`) berhasil melakukan pra-filter lokasi (Palembang/Remote/Paid) dan scoring berbasis stack pengguna (`score` 0-10). Di sisi frontend, `JobFeedClient` menyediakan klasifikasi otomatis *Magang* vs *Freshgrad* via `src/lib/job-utils.ts`.
  - *Diferensiasi Terdistorsi:* Meskipun scraper menghasilkan `score_breakdown` (JSON berisi kecocokan per teknologi), UI kartu lowongan (`src/components/job-card.tsx:61-65`) hanya menampilkan angka tunggal tanpa visualisasi breakdown atau color coding (Hijau >= 7, Kuning 5-6.9, Abu-abu < 5). Nilai tambah "mengetahui alasan kecocokan sebelum membuang waktu melamar" menjadi tereduksi.

#### B. Pengujian Validitas Metrik Keberhasilan (Success Metrics)
| Metrik PRD | Target Kuantitatif | Instrumen Pengukur di Codebase | Status Validitas |
|:---|:---|:---|:---:|
| **Scraper Pull Rate** | >= 20 lowongan relevan/hari | Hanya output `sys.stdout` di GitHub Actions workflow (`.github/workflows/radar.yml`). Tidak ada counter agregasi database harian. | **Tidak Valid (Uninstrumented)** |
| **Match Score Accuracy** | <= 20% lowongan ditandai "salah skor" | PRD menyebut *"tracked via simple log/spreadsheet"*. Di dalam UI aplikasi sama sekali tidak ada tombol/mekanisme feedback "Laporkan Salah Skor". | **Tidak Valid (Manual/Out-of-band)** |
| **Cover Letter Latency** | < 10 detik per draft | Groq API via Llama 3.3 70B berjalan rata-rata 1.5-3.5 detik, namun tidak ada APM/telemetri latency tracking di endpoint `/api/cover-letter`. | **Asumsi Tak Teruji di Telemetri** |
| **Dedup Reliability** | Zero duplicate alert | Tabel `seen_jobs` dan unique constraint pada kolom `jobs.url` (`magangyokk-schema.sql:35, 54`) memblokir duplikasi URL pada level database. | **Valid (Enforced by Schema)** |
| **Job Feed Performance** | LCP < 2.0 detik | Menggunakan Next.js 16 Server Components (`src/app/page.tsx:revalidate = 0`), namun tidak ada integrasi `@vercel/speed-insights` atau Web Vitals listener. | **Asumsi Tak Teruji di Runtime** |
| **Search Time** | Waktu pencarian < 5 menit | Tidak ada user session tracking atau event analytics (PostHog/GA) untuk mengukur durasi sesi pengguna. | **Klaim Kualitatif** |

---

### PILAR 2: Analisis Kebutuhan Fungsional & Non-Fungsional (Panduan.txt Seksi 2)

#### A. Pemetaan Kebutuhan Fungsional (Functional Requirements)
```
[Discovery]           [Evaluation]           [Preparation]          [Tracking]
Job Feed & Filter  ->  Score Breakdown    ->  Cover Letter Gen   ->  Kanban Board
  (FR-01 s/d 04)        (FR-05 s/d 06)         (FR-07 s/d 08)         (FR-09 s/d 11)
```

| ID FR | Deskripsi Kebutuhan Fungsional | Spesifikasi PRD | Realitas Codebase | Status |
|:---|:---|:---|:---|:---:|
| **FR-01** | Feed Lowongan Teragregasi | Menampilkan judul, perusahaan, lokasi, score, remote, sumber | Diimplementasikan di `src/app/page.tsx` & `src/components/job-card.tsx`. | **Implemented** |
| **FR-02** | Multi-select Tech Stack Filter | Filter multi-select untuk Next.js, React, Laravel, Supabase, dll. | `selectedTech` di `job-feed-client.tsx:37` hanya mendukung *single-value toggle* (`string \| null`). | **Partially Implemented** |
| **FR-03** | Minimum Score Filter | Slider/input filter ambang batas skor minimum | Tidak ada kontrol filter score minimum pada UI. Hanya ada search query teks dan filter status. | **Missing in Code** |
| **FR-04** | Paginasi / Infinite Scroll | Menangani volume lowongan besar tanpa membebani DOM | `src/app/page.tsx:13` membatasi hardcoded `.limit(100)` dan me-render seluruh array sekaligus tanpa pagination. | **Partially Implemented** |
| **FR-05** | Visualisasi Match Score | Warna badge dinamis: Hijau (>= 7), Kuning (5-6.9), Abu (< 5) | `job-card.tsx:61` hanya merender badge monokromatik netral: `bg-white/[0.04] border-white/[0.08] text-[#d0d6e0]`. | **Missing in Code** |
| **FR-06** | Score Breakdown Tooltip/Modal | Tooltip/expand menampilkan kecocokan per keyword | Data `score_breakdown` diambil dari Supabase tapi tidak pernah di-render pada card. | **Missing in Code** |
| **FR-07** | AI Cover Letter Generator | Groq API prompt anti-halusinasi berbasis profil & lowongan | Endpoint `/api/cover-letter` & `CoverLetterModal` terpasang dengan pemilihan bahasa ID/EN. | **Implemented** |
| **FR-08** | In-Platform Draft Editor | Pengguna dapat mengedit draft cover letter langsung di platform | Modal hanya menampilkan `<div>` read-only (`cover-letter-modal.tsx:135`). Pengguna tidak bisa mengedit sebelum menyalin. | **Partially Implemented** |
| **FR-09** | Kanban Status Board | 5 Kolom: Disimpan -> Dilamar -> Interview -> Tawaran -> Ditolak | `src/components/kanban-board.tsx` mendukung 5 kolom lengkap. | **Implemented** |
| **FR-10** | Drag & Drop Application Tracker | Perpindahan status kartu antar kolom via drag & drop | HTML5 Drag & Drop dengan state optimis diimplementasikan di `kanban-board.tsx:84-145`. | **Implemented** |
| **FR-11** | Automated Telegram Alert | Notifikasi lowongan baru via cron ke channel/grup Telegram | `scripts/telegram_alert.py` bergantung pada path Windows lokal (`C:/Users/acer/...`). Workflow GitHub Actions (`radar.yml`) tidak menjalankan script ini. | **Partially Implemented (Broken in CI)** |

#### B. Evaluasi Non-Functional Requirements (NFR)
1. **Security & Data Isolation:**
   - *Klaim:* Row Level Security (RLS) menjaga isolasi data pelamar.
   - *Fakta:* `src/lib/supabase.ts` menggunakan `SUPABASE_SERVICE_ROLE_KEY` secara universal pada Server Components dan Server Actions, melewati seluruh RLS policies di database. Untuk Phase 1 (single-user internal) hal ini dapat diterima, namun deklarasi NFR pada PRD yang mengklaim kesiapan multi-tenant RLS adalah **asumsi belum teruji**.
   - *API Protection:* Tidak ada mekanisme *rate limiting* (seperti Upstash Redis) pada endpoint publik `/api/cover-letter` dan `/api/resume/analyze-gap`, menyisakan risiko eksploitasi kuota Groq API.
2. **Crash Resilience & Availability:**
   - Penambahan `src/app/error.tsx` berhasil menutup kerentanan SSR crash screen. Namun, ketiadaan automated health check atau alerting pada scraper GitHub Actions menyebabkan kegagalan pipeline scraping tidak dapat dideteksi secara proaktif.

---

### PILAR 3: User Persona & Usability Heuristics (Panduan.txt Seksi 3)

#### A. Keselarasan Alur Kerja terhadap Persona Utama
- **Profil:** Aji Arlando (Mahasiswa Sistem Informasi tingkat akhir, fokus Web Development).
- **Tujuan Kritis:** Melamar magang sebanyak mungkin dengan kualitas relevansi tinggi dalam waktu sesingkat-singkatnya.
- **Evaluasi Alur:** Alur dari *Discovery* (melihat daftar) -> *Drafting* (Cover Letter) -> *Tracking* (Kanban) sudah memangkas friksi repetitif. Namun, ketidakmampuan mengedit draft di dalam modal memaksa pengguna melakukan paste ke text editor eksternal sebelum mengirim ke HRD, menciptakan *unnecessary cognitive step*.

#### B. Audit 10 Usability Heuristics Nielsen Norman Group (NNG)
1. **Visibility of System Status (Skor: 3/5):**
   - Kartu lowongan dan modal cover letter menyediakan status loading yang jelas (`Loader2`, transition states).
   - *Kelemahan:* Header aplikasi tidak menampilkan informasi kapan scraper terakhir kali berjalan (`last_synced_at`). Pengguna tidak tahu apakah data lowongan merupakan data hari ini atau data usang.
2. **Match Between System and Real World (Skor: 5/5):**
   - Terminologi menggunakan konvensi dunia kerja mahasiswa Indonesia (*Magang*, *Freshgrad*, *On-site*, *Remote*, *Uang Saku/Paid*).
3. **User Control and Freedom (Skor: 2/5):**
   - Pengguna dapat memindahkan status di Kanban.
   - *Kelemahan Kritis:* **Tidak ada fitur Undo**. Jika pengguna tidak sengaja menggeser kartu ke kolom "Ditolak", tidak ada tombol batalkan atau riwayat perubahan status.
4. **Consistency and Standards (Skor: 4/5):**
   - Mengikuti Linear-style design system dengan dark aesthetic (`#08090a`, `#0c0d0e`).
5. **Error Prevention (Skor: 4/5):**
   - Backend upload PDF kini terlindungi dengan verifikasi magic bytes `%PDF` dan limit 10 MB. Server actions memiliki rollback state bila gagal update database.
6. **Recognition Rather than Recall (Skor: 3/5):**
   - Tech tag disajikan di atas bar pencarian. Namun, filter tag bersifat eksklusif tunggal, menyulitkan mahasiswa yang menguasai kombinasi stack (misal: "Next.js" DAN "TypeScript").
7. **Flexibility and Efficiency of Use (Skor: 2/5):**
   - Tidak ada batch action (misal: "Tandai 3 lowongan sebagai Disimpan sekaligus").
8. **Aesthetic and Minimalist Design (Skor: 5/5):**
   - Bersih, tipografi monospaced untuk metadata, kontras visual tajam, zero em-dash pada seluruh antarmuka.
9. **Help Users Recognize, Diagnose, and Recover from Errors (Skor: 4/5):**
   - Boundary `src/app/error.tsx` dan response API menggunakan Bahasa Indonesia yang ramah pengguna.
10. **Help and Documentation (Skor: 1/5):**
    - Tidak ada panduan atau tooltip yang menjelaskan bagaimana angka "Match Score" dihitung, atau bagaimana preferensi profil diatur.

---

### PILAR 4: Scope & MVP Boundary (Panduan.txt Seksi 4)

Sesuai prinsip `Panduan.txt` Baris 49: *"Jangan membangun fitur hanya karena teknologi tersebut menarik. Bangun karena fitur itu menyelesaikan kebutuhan pengguna."*

#### A. Deteksi Scope Creep (Fitur Terlalu Dini Dibangun)
Codebase memuat sejumlah fitur yang **tidak pernah direncanakan di PRD MVP Phase 1**:
1. **Resume PDF Parsing & Upload (`/api/resume/upload` + `ResumeUploadModal`):**
   - *Analisis:* PRD Seksi 7.2 (F6) secara tegas menetapkan: *"Phase 1: hardcoded config, Phase 2: editable UI"*. Membangun parser PDF biner (`pdf-parse-fork`) pada Phase 1 memperkenalkan kerentanan memori, risiko file injection, dan dependensi biner yang belum esensial.
2. **AI Skill Gap Analysis Modal (`/api/resume/analyze-gap` + `GapAnalysisModal`):**
   - *Analisis:* Menggunakan model LLM `llama-3.3-70b-versatile` untuk melakukan deep audit CV vs deskripsi pekerjaan. Fitur ini bernilai tinggi namun berada di luar batasan MVP, mengonsumsi token API ekstra sementara fitur deterministik dasar (Score Breakdown Tooltip) justru terbengkalai.
3. **Application Notes Drawer (`NotesDrawerModal` + `updateApplicationNotes`):**
   - *Analisis:* Fitur pencatatan personal per aplikasi merupakan kebutuhan sekunder yang menambah kompleksitas interaksi sebelum validasi rilis utama tercapai.

#### B. Deteksi Missing Core (Fitur Vital yang Dijanjikan Namun Belum Selesai)
1. Multi-select tech filter (terpotong menjadi single-select).
2. Filter ambang batas skor minimum (absen di UI).
3. Visualisasi indikator warna skor (absen di UI card).
4. Tooltip/modal rincian kecocokan stack (absen di UI card).
5. In-modal draft editor untuk cover letter (hanya read-only preview).
6. Automasi alert Telegram di Cloud CI (terputus di GitHub Actions).

---

## 2. MATRIKS GAP ANALYSIS KOMPREHENSIF

| Aspek Perencanaan | Klaim PRD | Fakta Codebase | Tingkat Kesenjangan | Analisis Resiko Rekayasa |
|:---|:---|:---|:---:|:---|
| **Tech Filtering** | Multi-select filter teknologi | `JobFeedClient` hanya mengizinkan 1 tag aktif (`selectedTech: string \| null`) | **Selisih (Under-implemented)** | Pengguna tidak dapat mencari kombinasi lowongan stack terpadu (misal: Laravel + Vue). Efisiensi pencarian terdegradasi. |
| **Score Filtering** | Filter by min score | Tidak ada filter score pada UI feed | **Hilang (Missing Core)** | Pengguna terpaksa melakukan scanning visual manual terhadap nilai skor lowongan yang rendah. |
| **Score Explainability** | Match Score Breakdown (0-10) & Badge warna dinamis | Data JSON di Supabase diabaikan oleh `JobCard`; badge warna hanya netral monokrom | **Hilang (Missing Core)** | Kehilangan diferensiasi utama vs LinkedIn; skor tampak seperti "angka gaib" tanpa transparansi alasan. |
| **Drafting Workflow** | User dapat mengedit draft langsung di platform | Modal cover letter hanya merender teks dalam tag `<div>` statis | **Selisih (Under-implemented)** | Friksi alur kerja: pengguna harus menyalin draft mentah lalu mengedit di aplikasi pihak ketiga. |
| **Alert Notification** | Telegram push notification real-time saat lowongan lolos filter | `telegram_alert.py` memakai hardcoded path Windows (`C:/Users/acer/...`) dan tidak di-run oleh `.github/workflows/radar.yml` | **Selisih (Broken in Automation)** | Notifikasi cloud tidak berjalan otomatis saat scraper dieksekusi di GitHub Actions serverless runner. |
| **Resume & Gap Analysis** | Hardcoded profile config (F6 Phase 1) | Tersedia upload PDF CV, parser biner, dan secondary LLM gap analyzer | **Selisih (Scope Creep)** | Meningkatkan kompleksitas pemeliharaan, attack surface DoS upload, dan konsumsi token API sebelum core feed tervalidasi. |
| **Performance NFR** | Page load LCP < 2.0 detik | SSR tanpa instrumentasi metrics (Web Vitals / APM) | **Selisih (Unverified Assumption)** | Potensi degradasi kecepatan di jaringan riil tanpa terdeteksi oleh pengembang. |
| **Tenant Isolation NFR** | RLS menjaga privasi profil dan lamaran | Server menggunakan `service_role` untuk seluruh operasi (RLS bypass) | **Sesuai (Phase 1 Solo User)** | Dapat diterima untuk Phase 1, namun menjadi **Critical Security Debt** jika migrasi ke Phase 2 tanpa refactoring akses data. |

---

## 3. MATRIKS REKOMENDASI PENYELARASAN SCOPE (ACTIONABLE ROADMAP)

Untuk mengembalikan fokus rekayasa pada standar MVP yang ramping, tangguh, dan sesuai tolok ukur `Panduan.txt`:

| Komponen / Fitur | Klasifikasi Tindakan | Alasan Rekayasa & Prinsip Panduan | Dampak Arsitektural |
|:---|:---:|:---|:---|
| **Tech Stack Filter** | **Fix & Complete Core** | Memenuhi janji diferensiasi utama mahasiswa developer. Ubah state `selectedTech` menjadi `string[]`. | UI update kecil pada `job-feed-client.tsx`, filter matching `array.every()`. |
| **Score Indicator & Tooltip** | **Fix & Complete Core** | Transparansi sistem (NNG Heuristic #1 & #10). Tampilkan warna dinamis pada skor dan popover `score_breakdown`. | Konsumsi field `score_breakdown` yang sudah ada di model `Job`. |
| **Cover Letter Editor** | **Fix & Complete Core** | Menghilangkan friksi alur kerja pelamaran. Ganti `<div>` preview menjadi controlled `<textarea>` interaktif. | Penambahan state editable `draftText` pada `CoverLetterModal`. |
| **Automasi Telegram Alert** | **Fix & Complete Core** | Menghilangkan ketergantungan path lokal mesin pengembang. Pindahkan state tracker ke Supabase/Redis dan pasang di GitHub Actions. | Update `scripts/telegram_alert.py` dan `.github/workflows/radar.yml`. |
| **AI Gap Analysis Modal** | **Defer to Phase 2** | Fitur bernilai tinggi namun merupakan *Scope Creep* yang membebani fase awal. Non-aktifkan tombol sementara atau posisikan sebagai fitur eksperimental. | Mengurangi beban pemeliharaan dan konsumsi token API harian. |
| **Resume PDF Upload** | **Freeze / Harden Only** | Parser PDF biner sudah diamankan (magic bytes + limit 10 MB). Jangan tambahkan fitur parsing ekstra sampai Phase 2. | Menjaga stabilitas arsitektur saat ini tanpa menambah kompleksitas. |
| **LCP Performance Telemetry** | **Add Lightweight Instrument** | Mengubah asumsi tak teruji menjadi metrik kuantitatif. Pasang `@vercel/speed-insights` pada `layout.tsx`. | Observabilitas performa nyata secara zero-config. |

---

## 4. INDEPENDENT ADVISOR VALIDATION (ANTI-FALSE-MISMATCH CHECK)

Sebelum kesimpulan audit disahkan, evaluasi independen dijalankan untuk memastikan tidak ada kesenjangan yang salah dinilai (*false mismatch*):

1. **Apakah Gap Analysis AI benar-benar Scope Creep ataukah bentuk alternatif dari Score Breakdown?**
   - *Validasi:* **Bukan bentuk alternatif**. Scraper menghitung `score` (0-10) dan `score_breakdown` secara deterministik berbasis regex keyword pencocokan teknologi pada saat ingestion. Sebaliknya, Gap Analysis adalah panggilan LLM sekunder terpisah yang menganalisis isi CV pengguna terhadap lowongan. Kehadiran Gap Analysis tidak menggantikan fakta bahwa `score_breakdown` deterministik milik scraper belum ditampilkan di kartu lowongan. Temuan kesenjangan pada F2 tetap **Valid**.
2. **Apakah ketiadaan Multi-Tenant RLS merupakan pelanggaran arsitektur saat ini?**
   - *Validasi:* **Bukan pelanggaran Phase 1**. AGENTS.md dan PRD secara eksplisit menyatakan Phase 1 adalah aplikasi *single-user* internal (Aji). Penggunaan `service_role` adalah pola arsitektural yang disengaja. Kesenjangan ini diklasifikasikan sebagai *Security Debt untuk Phase 2*, bukan kegagalan MVP saat ini. Temuan dinilai adil dan proporsional.
3. **Apakah Drag & Drop Kanban benar-benar berfungsi?**
   - *Validasi:* Kode `src/components/kanban-board.tsx` mengonfirmasi keberadaan event handlers HTML5 native (`onDragStart`, `onDragOver`, `onDrop`) yang terikat langsung ke Server Actions `updateJobStatus`. Klaim bahwa drag-and-drop telah terimplementasi adalah **100% Terverifikasi**.

---

## KESIMPULAN AUDIT

Fase Perencanaan dan Analisis MagangYokk memiliki fondasi problem-solution fit yang solid untuk target mahasiswa IT Indonesia. Namun, sistem saat ini mengalami **gejala klasik rekayasa tahap awal: *Core Under-delivery coupled with Premature Feature Creep***. 

Fokus pengembangan berikutnya tidak boleh menambah fitur baru, melainkan menyelesaikan *last-mile delivery* pada fitur inti (multi-select filter, visualisasi transparansi skor, in-modal draft editor, dan automasi alert CI) guna mencapai standar rekayasa perangkat lunak yang matang sebelum deployment publik.
