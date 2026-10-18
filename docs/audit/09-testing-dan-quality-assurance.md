# LAPORAN AUDIT REKAYASA PERANGKAT LUNAK: BAGIAN IX - TESTING DAN QUALITY ASSURANCE
**Proyek:** MagangYokk (Job Aggregator & Application Tracker)  
**Tolok Ukur Standar:** Panduan.txt (Seksi 22, Baris 796-861) & Standar Testing Pyramid (Unit, Integration, E2E)  
**Peran:** Lead QA Architect & Test Automation Engineer  
**Status Audit:** Final (Documented for Repository Artifact)

---

## 0. AUTONOMOUS SKILLS LOADED & JUSTIFIKASI METODOLOGI

Dalam melaksanakan audit strategi pengujian, otomatisasi penjaminan mutu, dan evaluasi pipeline CI/CD ini, sistem secara otonom memindai katalog kapabilitas internal dan memuat dua skill spesialis:

1. **`skill://testing-strategy` (Test Pyramid Architecture & Coverage Framework)**
   - *Justifikasi Metodologi:* Digunakan untuk mengevaluasi distribusi pengujian berbasis Testing Pyramid (banyak Unit Test cepat di dasar, Integration Test secukupnya di tengah, dan sedikit E2E Test kritis di puncak), identifikasi *testing anti-patterns*, dan strategi determinasi waktu (*clock injection*).
2. **`skill://vitest` (Vite-Native Test Runner & Mocking Engine Standard)**
   - *Justifikasi Metodologi:* Menilai kesiapan harness unit testing modern yang kompatibel dengan Next.js App Router, ESM TypeScript native, snapshot testing, dan mocking API eksternal via `vi.fn()` / `vi.mock()`.
3. **`skill://playwright` (End-to-End Browser Automation & Regression Harness)**
   - *Justifikasi Metodologi:* Evaluasi kesiapan pengujian alur kritis pengguna (*Happy Path user journeys*: discovery -> filter -> kanban transition -> cover letter generation), uji kompatibilitas lintas peramban (*Chromium, Firefox, WebKit*), dan pengujian aksesibilitas otomatis via `@axe-core/playwright`.

---

## 1. THE FOUR TESTING & QA AUDIT PILLARS

### PILAR 1: Test Pyramid & Unit Test Coverage (Panduan.txt Seksi 32)

#### A. Evaluasi Konfigurasi Runner di `package.json`
- **Fakta di `package.json`:**
  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
  ```
- **Temuan Kritis (Zero Test Infrastructure):**
  1. **Ketiadaan Script `"test"`:** Tidak ada runner pengujian yang terdaftar.
  2. **Ketiadaan Test Framework:** Tidak ada `vitest`, `jest`, `@testing-library/react`, atau `@types/jest` di dalam `devDependencies`.
  3. **Total Cakupan Pengujian Otomatis:** **0% (Zero Automated Unit Tests)** di seluruh codebase.

#### B. Audit Cakupan Fungsi Murni (Pure Functions)
Proyek memiliki sejumlah utilitas bisnis penting yang ideal untuk unit testing karena berstatus *pure functions* (tanpa dependensi I/O):
1. **`src/lib/job-utils.ts` (`getJobEduCategory`):**
   - Berisi logika klasifikasi multi-branch: mendeteksi apakah suatu lowongan merupakan *Magang Mahasiswa* (`intern`, `magang`, `pkl`, `student`, `mahasiswa`, `kuliah`) vs *Fresh Graduate* (`fresh graduate`, `freshgrad`, `lulusan`, `sarjana`, `s1`, `d3`, `junior`, `entry`).
   - Logika ini mengatur badge visual di kartu dan counter tab di header.
   - *Status Uji:* **Zero Automated Coverage**. Meskipun fungsi ini bekerja dengan baik, tidak ada suite pengujian `job-utils.test.ts` yang menjaga fungsi ini dari regresi jika ada penambahan kata kunci baru di masa depan.
2. **`src/lib/utils.ts` (`cn` helper):**
   - Menggabungkan `clsx` dan `twMerge`.
   - *Status Uji:* **Zero Automated Coverage**.

---

### PILAR 2: API & Integration Test Harness (Panduan.txt Seksi 33)

#### A. Evaluasi Pengujian pada Route Handlers (`src/app/api/**`)
Aplikasi memiliki 3 endpoint backend kritis yang menangani validasi biner dan gateway AI:
1. **`POST /api/resume/upload`:**
   - Logika kritis: Batas 10 MB (HTTP 413), filter ekstensi & MIME, verifikasi magic bytes 4-byte `%PDF`, ekstraksi teks, dan penanganan error 500.
   - *Status Uji:* **Zero Coverage**. Tidak ada automated test yang memverifikasi penolakan file > 10 MB atau penolakan file executable palsu berekstensi `.pdf`.
2. **`POST /api/cover-letter`:**
   - Logika kritis: Validasi `jobId`, validasi enum `lang` (`id` | `en`), query profil, pemanggilan Groq API, dan sanitasi 502 jika upstream AI gagal.
   - *Status Uji:* **Zero Coverage**.
3. **`POST /api/resume/analyze-gap`:**
   - Logika kritis: Regex JSON fallback parser (`extractJson`), normalisasi batasan skor [0, 100], dan penanganan markdown-wrapped JSON (````json ... ````).
   - *Status Uji:* **Zero Coverage**.

#### B. Evaluasi Pengujian pada Server Actions (`src/app/actions.ts`)
- Fungsi `updateJobStatus` dan `updateApplicationNotes` melakukan mutasi ke Supabase.
- Tidak ada integration harness yang mem-mock Supabase client (`@supabase/supabase-js`) untuk menguji skenario:
  - Sukses update status lamaran (kembalikan `{ success: true }`).
  - Gagal update saat jaringan Supabase terputus (kembalikan `{ success: false, error: string }`).
  - Idempotensi operasi update berulang.

---

### PILAR 3: Component & E2E User Journey Testing (Panduan.txt Seksi 34)

#### A. Ketiadaan Pengujian Alur Kritis Pengguna (Critical User Journeys)
Sesuai prinsip `Panduan.txt` Baris 800: *"Website belum layak produksi hanya karena berhasil berjalan di laptop developer."*
- Alur utama MagangYokk melibatkan interaksi kompleks:
  ```text
  User Buka Beranda (SSR)
         ↓
  Ketik Filter Pencarian (Search Input)
         ↓
  Ganti Tab Edu Target (Magang vs Freshgrad)
         ↓
  Tarik Kartu di Kanban (Drag & Drop ke "Sudah Dilamar")
         ↓
  Klik Tombol "Cover Letter" → Modal Terbuka
         ↓
  Ganti Bahasa (ID / EN) → Klik "Salin Surat"
  ```
- **Kondisi Codebase:** **Nol E2E Test**. Tidak ada Playwright atau Cypress yang mengonfigurasi browser testing. Seluruh verifikasi fungsionalitas antarmuka bergantung pada pengetesan manual ad-hoc oleh pengembang di browser lokal.

#### B. Ketiadaan Regression Test Suite
Sejumlah bug kritis yang telah diperbaiki sebelumnya:
1. Pencegahan memory exhaustion upload via 10 MB guard.
2. Penolakan file non-PDF via magic bytes `%PDF`.
3. Validasi ketat enum bahasa cover letter (`id` | `en`).
4. Eliminasi divergensi heuristik klasifikasi magang antara `job-card` dan `job-feed-client`.
- **Risiko Regresi:** Tanpa automated test suite, setiap perubahan kode di masa depan berpotensi merusak kembali (*regression*) logika-logika pertahanan di atas tanpa terdeteksi sebelum masuk produksi.

---

### PILAR 4: Continuous Integration (CI) Quality Gates (Panduan.txt Seksi 35)

#### A. Evaluasi Pipeline GitHub Actions (`.github/workflows/`)
- **Fakta di Repositori:**
  Hanya ada satu file workflow: `.github/workflows/radar.yml`.
  Workflow ini adalah *scheduled cron daemon* yang menjalankan `python scripts/radar.py` jam 09:00 dan 18:00 WIB.
- **Ketiadaan CI Quality Gates:**
  **TIDAK ADA automated CI workflow untuk Pull Request atau Push!**
  - Tidak ada `tsc --noEmit` di CI untuk memverifikasi type-safety TypeScript.
  - Tidak ada `eslint` di CI untuk mencegah pelanggaran sintaksis atau hook rules.
  - Tidak ada `next build` validation di server CI.
- **Dampak pada Siklus Rilis:**
  Seorang pengembang dapat secara tidak sengaja melakukan push kode yang memuat error tipe TypeScript atau lint error ke branch `main`. GitHub Actions akan tetap hijau (karena tidak ada CI check), dan error baru akan meledak saat Vercel mencoba membangun deployment produksi.

---

## 2. MATRIKS EVALUASI TESTING & QUALITY ASSURANCE

| Tingkat Pengujian | Komponen / Modul | Kondisi Test Saat Ini | Status Kepatuhan | Rekomendasi Test Harness |
|:---|:---|:---|:---:|:---|
| **Unit Testing** | `src/lib/job-utils.ts` | Heuristik klasifikasi Magang vs Freshgrad tidak memiliki test otomatis. | **Zero Coverage (Kritis)** | Pasang Vitest: buat `job-utils.test.ts` menguji 15+ variasi judul dan deskripsi lowongan. |
| **Unit Testing** | `src/lib/utils.ts` | Helper penggabungan kelas Tailwind `cn` belum diuji. | **Zero Coverage (Rendah)** | Buat `utils.test.ts` menguji resolusi konflik kelas Tailwind (`p-2 p-4 -> p-4`). |
| **API Testing** | `src/app/api/resume/upload` | Validasi 10 MB, MIME, dan magic bytes `%PDF` belum memiliki automated test. | **Zero Coverage (Kritis)** | Buat `upload.test.ts` (NextRequest integration) menguji dummy buffer > 10 MB dan file non-PDF. |
| **API Testing** | `src/app/api/cover-letter` | Validasi `jobId`, enum `lang`, dan error handling 502 belum diuji otomatis. | **Zero Coverage (Kritis)** | Buat `cover-letter.test.ts` dengan mock Groq API untuk menguji skenario sukses dan 502 gateway error. |
| **API Testing** | `src/app/api/resume/analyze-gap`| Regex JSON fallback parser (`extractJson`) belum memiliki unit/integration test. | **Zero Coverage (Sedang)** | Buat `analyze-gap.test.ts` menguji parsing JSON mentah, JSON markdown, dan respon cacat. |
| **Integration** | `src/app/actions.ts` | Mutasi `updateJobStatus` dan `updateApplicationNotes` belum diuji secara terisolasi. | **Zero Coverage (Sedang)** | Buat `actions.test.ts` dengan mock Supabase client menguji status rollback dan upsert. |
| **E2E Testing** | Happy Path User Journey | Seluruh alur penelusuran loker, kanban drag-and-drop, dan modal cover letter manual. | **Zero Coverage (Tinggi)** | Pasang Playwright: buat `e2e/job-flow.spec.ts` menjalankan tes otomatis browser headless. |
| **CI Quality Gate**| `.github/workflows/ci.yml` | Tidak ada workflow CI untuk memvalidasi PR atau Push. | **Hilang (Kritis)** | Buat `.github/workflows/ci.yml` yang menjalankan `npm run lint`, `tsc --noEmit`, dan `vitest run`. |

---

## 3. INDEPENDENT ADVISOR VALIDATION (ANTI-FALSE-MISMATCH CHECK)

Sebelum kesimpulan audit Bagian IX ini disahkan, evaluasi independen dijalankan untuk memastikan validitas temuan penjaminan mutu:

1. **Apakah benar sama sekali tidak ada framework testing di `package.json`?**
   - *Validasi:* **100% Terverifikasi**. Berkas `package.json` baris 5-10 hanya memuat script `dev`, `build`, `start`, dan `lint`. Tidak ada paket pengujian seperti `vitest`, `jest`, atau `playwright` di dependencies maupun devDependencies.
2. **Apakah ketiadaan CI workflow merupakan cacat nyata jika pengembang selalu menjalankan lint secara lokal?**
   - *Validasi:* **Cacat Mutlak Rekayasa Perangkat Lunak**. Disiplin lokal pengembang (*developer discipline*) tidak pernah diakui sebagai pengganti *Continuous Integration Quality Gate*. CI menjamin bahwa kode yang masuk ke branch utama telah terisolasi dan lolos verifikasi di lingkungan bersih yang independen dari mesin pengembang.
3. **Apakah fungsi regex di `job-utils.ts` cukup sederhana sehingga tidak perlu diuji?**
   - *Validasi:* Heuristik kata kunci adalah logika yang paling rentan terhadap regresi (*fragile business logic*). Menambahkan satu kata kunci (misal: "trainee") dapat secara tidak sengaja mengubah klasifikasi puluhan lowongan lainnya. Unit testing dengan *test matrix* adalah kewajiban mutlak untuk modul semacam ini.

---

## 4. KESIMPULAN REKAYASA & ACTIONABLE BLUEPRINT

MagangYokk saat ini berada pada kondisi **Zero Automated Test Coverage**. Seluruh jaminan kualitas aplikasi bertumpu pada pengujian manual di laptop pengembang dan verifikasi build Vercel.

### 3 Langkah Praktis Membangun Testing Foundation:
1. **Pasang Vitest untuk Unit & API Testing:**
   ```bash
   npm install -D vitest @vitejs/plugin-react
   ```
   Tambahkan script `"test": "vitest run"` pada `package.json` dan buat berkas `src/lib/job-utils.test.ts`.
2. **Terbitkan GitHub Actions CI Quality Gate (`.github/workflows/ci.yml`):**
   ```yaml
   name: CI Quality Gate
   on: [push, pull_request]
   jobs:
     verify:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 20, cache: 'npm' }
         - run: npm ci
         - run: npx tsc --noEmit
         - run: npm run lint
         - run: npm run test
   ```
3. **Konfigurasikan Playwright untuk Smoke E2E:**
   Buat 1 skenario pengujian E2E dasar yang memvalidasi bahwa halaman utama memuat kartu lowongan dan modal cover letter dapat dibuka tanpa error JavaScript di browser console.
