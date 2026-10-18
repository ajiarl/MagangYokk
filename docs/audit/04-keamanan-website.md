# LAPORAN AUDIT REKAYASA PERANGKAT LUNAK: BAGIAN IV - KEAMANAN WEBSITE
**Proyek:** MagangYokk (Job Aggregator & Application Tracker)  
**Tolok Ukur Standar:** Panduan.txt (Seksi 13-16, Baris 429-524), OWASP Top 10 (2021/2025), & NIST SP 800-63B  
**Peran:** Senior Application Security Engineer & Lead Pentester (OSCP / CISSP)  
**Status Audit:** Final (Documented for Repository Artifact)

---

## 0. AUTONOMOUS SKILLS LOADED & JUSTIFIKASI METODOLOGI

Dalam melaksanakan audit keamanan aplikasi web, autentikasi, dan evaluasi permukaan serangan ini, sistem secara otonom memindai katalog kapabilitas internal dan memuat dua skill spesialis:

1. **`skill://security-review` (Static Application Security Testing / SAST & Threat Modeling)**
   - *Justifikasi Metodologi:* Digunakan untuk menelusuri aliran data tak terpercaya (*taint analysis*), memeriksa validasi input pengguna, mengidentifikasi celah injeksi (SQLi, XSS, SSRF), mengaudit keamanan file upload, dan mendeteksi eksposur rahasia (*secrets leakage*).
2. **`skill://supabase-audit-rls` (PostgreSQL Row Level Security & Access Control Testing)**
   - *Justifikasi Metodologi:* Digunakan untuk mengevaluasi ketahanan tabel database Supabase terhadap *Bypass Vectors* (Unauthenticated Access, Cross-User Access/BOLA, Overly Permissive Policies, dan dampak pemanggilan universal `service_role`).
3. **OWASP Top 10:2025 & ASVS 5.0 Framework**
   - *Justifikasi Metodologi:* Mengklasifikasikan temuan berdasarkan taksonomi resmi: A01 Broken Access Control, A02 Security Misconfiguration, A05 Injection, dan A07 Authentication Failures.

---

## 1. THE FOUR SECURITY AUDIT PILLARS

### PILAR 1: Authentication & Broken Access Control / BOLA (Panduan.txt Seksi 13 & 14)

#### A. Audit Server Actions (`src/app/actions.ts`)
- **Fakta di Kode:**
  Server Actions `updateJobStatus(jobId, status)` dan `updateApplicationNotes(jobId, notes)` diekspor langsung sebagai Server Actions Next.js:
  ```ts
  // src/app/actions.ts
  export async function updateJobStatus(jobId: string, status: ApplicationStatus) {
    const { data: profile } = await supabase.from("profiles").select("id").limit(1).single()
    const payload = { job_id: jobId, profile_id: profile.id, status: status, ... }
    await supabase.from("applications").upsert(payload, { onConflict: "job_id,profile_id" })
  }
  ```
- **Temuan Celah Keamanan (Broken Access Control & BOLA - Severity: P0):**
  1. **Unauthenticated Public Invocation:**
     Di Next.js App Router, setiap Server Action secara otomatis menghasilkan endpoint publik HTTP POST (dapat dipanggil via `fetch` dari mana saja tanpa browser session). Kedua action di atas **sama sekali tidak memeriksa sesi login, cookie auth, atau token API**. Siapa pun di internet dapat menembak request POST ke endpoint action ini untuk memanipulasi status dan catatan lamaran.
  2. **Broken Object Level Authorization (BOLA / IDOR):**
     Query `supabase.from("profiles").select("id").limit(1).single()` mengasumsikan database hanya berisi 1 profil. Jika Phase 2 menambahkan profil pengguna lain, `limit(1)` akan mengambil profil secara acak (non-deterministik), memungkinkan penyerang menimpa (*overwrite*) data lamaran milik pengguna lain.

#### B. Audit Supabase RLS & Dampak Pemanggilan Universal `service_role`
- **Fakta di DDL (`docs/magangyokk-schema.sql`):**
  Tabel `jobs`, `profiles`, dan `applications` telah memiliki perintah `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` beserta kebijakan pemisahan data (`auth.uid() = user_id`).
- **Temuan Celah Keamanan (RLS Completely Dormant - Severity: P1):**
  - Berkas `src/lib/supabase.ts` menginisialisasi client menggunakan:
    `createClient(supabaseUrl, supabaseServiceKey)` dengan `SUPABASE_SERVICE_ROLE_KEY`.
  - Kunci `service_role` secara inheren melakukan **Bypass 100% terhadap seluruh Row Level Security policies** di PostgreSQL.
  - *Dampak:* Seluruh RLS policies yang dirancang di file SQL berstatus **tidak aktif (dormant)** dalam eksekusi aplikasi web. Beban otorisasi sepenuhnya bertumpu pada kode aplikasi Next.js. Karena kode aplikasi belum mengimplementasikan otorisasi, sistem saat ini beroperasi dengan model *Full Trust / Superuser Access*.

---

### PILAR 2: Input Sanitization, Injection & File Upload Security (Panduan.txt Seksi 15)

#### A. Uji SQL Injection (SQLi)
- **Status: Optimal (Lolos Audit).**
  Seluruh interaksi database dilakukan melalui Supabase PostgREST Query Builder (`.from("jobs").select("*").eq("id", jobId)`). PostgREST memanfaatkan PostgreSQL parameterized queries di layer database engine. Tidak ditemukan penggunaan string concatenation mentah atau `raw query` SQL di codebase.

#### B. Uji Cross-Site Scripting (XSS)
- **Status React Output Encoding: Aman.**
  Aplikasi tidak menggunakan `dangerouslySetInnerHTML` atau properti `innerHTML`. React 19 secara otomatis melakukan konteks-encoding terhadap seluruh string dinamis (`{job.title}`, `{job.description}`, `{coverLetterDraft}`).
- **Temuan Celah: Potensi DOM XSS via Malicious Protocol Scheme (Severity: P2):**
  Pada `src/components/job-card.tsx:184` dan `src/components/kanban-board.tsx`:
  `<a href={job.url} target="_blank" rel="noreferrer">`
  Data `job.url` berasal dari scraper eksternal yang mengekstrak tautan dari situs pihak ketiga. Jika database memuat lowongan dengan tautan skema berbahaya (misal: `javascript:alert(document.cookie)`), mengeklik tautan tersebut akan memicu eksekusi kode JavaScript di peramban pengguna.
  - *Mitigasi:* Tambahkan sanitasi URL: pastikan `job.url` wajib diawali dengan `http://` atau `https://` sebelum di-render ke atribut `href`.

#### C. Audit Endpoint Upload Resume (`/api/resume/upload`)
- **Kondisi Pasca-Hardening:**
  - Telah dilindungi dengan limit ukuran 10 MB (HTTP 413) untuk mencegah alokasi heap berlebih (Memory-DoS).
  - Validasi MIME-type (`application/pdf`) dan ekstensi `.pdf`.
  - Verifikasi magic bytes 4-byte `%PDF` pada buffer biner sebelum diserahkan ke parser `pdfParse`.
- **Temuan Sisa (Residual Risks - Severity: P2):**
  1. **Null-Byte Injection (`\0`):** File PDF buatan penyerang dapat menyuntikkan karakter null byte ke dalam stream teks. Jika teks hasil ekstraksi langsung dikirim ke PostgreSQL `text` column tanpa pembersihan `text.replace(/\0/g, '')`, PostgreSQL akan melempar exception: *invalid byte sequence for encoding "UTF8": 0x00*.
  2. **Polyglot & PDF-JS Exploits:** `pdf-parse-fork` menggunakan mesin parsing internal yang rentan terhadap *PDF decompression bombs* (FlateDecode streams yang mengembang eksponensial di RAM).

---

### PILAR 3: Secrets Leakage & Client Bundle Exposure (Panduan.txt Seksi 16)

#### A. Audit Pemisahan Kunci Lingkungan (Environment Variables)
- **Status: Optimal.**
  - Variabel rahasia sensitif: `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, dan `DATABASE_URL` tidak diberi awalan `NEXT_PUBLIC_`. Next.js secara otomatis mengecualikan variabel tanpa awalan tersebut dari bundle client.
  - Hanya `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` yang terekspos ke publik (sesuai spesifikasi arsitektur Supabase).

#### B. Ketiadaan Build-Time Guard `server-only` (Severity: P1)
- Pada berkas `src/lib/supabase.ts` baris 10-11 tertulis komentar:
  `// Server-side only client — menggunakan service_role key`
  `// JANGAN import file ini di client component`
- **Kelemahan Arsitektural:**
  Peringatan hanya berupa komentar teks manusia. Jika di masa depan seorang pengembang tidak sengaja mengimpor `supabase` ke dalam Client Component (`'use client'`), compiler Next.js tidak akan memblokirnya saat build.
  - *Mitigasi:* Pasang package `server-only` dan letakkan deklarasi `import 'server-only'` di baris paling atas `src/lib/supabase.ts`. Compiler bundler Next.js akan langsung menggagalkan build jika file ini tersentuh oleh pohon Client Component.

---

### PILAR 4: Rate Limiting, HTTP Security Headers & DoS (Panduan.txt Seksi 16)

#### A. Ketiadaan Rate Limiting pada Endpoint AI (Denial of Wallet - Severity: P0)
- **Fakta di Endpoint:**
  - `POST /api/cover-letter` (memanggil Groq API Llama 3.3 70B).
  - `POST /api/resume/analyze-gap` (memanggil Groq API Llama 3.3 70B).
  - `POST /api/resume/upload` (menjalankan komputasi parsing PDF biner).
- **Temuan Celah Kritis:**
  **Ketiga endpoint ini bersifat publik tanpa autentikasi dan tanpa rate limiting.**
  Penyerang dapat menjalankan skrip loop sederhana untuk menembakkan ribuan request per menit.
  - *Dampak:* Kuota harian gratis Groq API (500.000 token/hari) akan habis dalam hitungan menit, menyebabkan layanan lumpuh total bagi pengguna asli (*Denial of Service* dan *Denial of Wallet* jika menggunakan API berbayar).
  - *Mitigasi:* Integrasikan rate limiter berbasis Redis/Upstash (misal: `@upstash/ratelimit`) dengan batasan maksimal 5 request cover letter/menit per IP.

#### B. Ketiadaan HTTP Security Headers di `next.config.ts` (Severity: P1)
- **Fakta di Kode:**
  Berkas `next.config.ts` saat ini kosong melompong:
  ```ts
  const nextConfig: NextConfig = {};
  export default nextConfig;
  ```
- **Daftar Header Keamanan yang Hilang (OWASP A02 Security Misconfiguration):**
  1. **Content-Security-Policy (CSP):** Tidak ada pembatasan domain sumber skrip, koneksi, atau media.
  2. **X-Frame-Options: DENY / SAMEORIGIN:** Absen. Website rentan terhadap serangan **Clickjacking** (antarmuka dapat di-embed ke dalam tag `<iframe>` transparan di situs phishing untuk menjebak klik pengguna).
  3. **X-Content-Type-Options: nosniff:** Absen. Memungkinkan peramban melakukan MIME-sniffing terhadap berkas statis.
  4. **Strict-Transport-Security (HSTS):** Absen. Tidak memaksa komunikasi transit menggunakan protokol HTTPS yang aman.
  5. **Referrer-Policy: strict-origin-when-cross-origin:** Absen. Berisiko membocorkan path URL internal saat pengguna membuka link lowongan eksternal.
  6. **Permissions-Policy:** Absen. Fitur sensitif peramban (kamera, mikrofon, geolokasi) tidak dimatikan secara eksplisit.

---

## 2. MATRIKS CELAH KEAMANAN & THREAT VECTORS

| Pilar | Endpoint / Berkas | Vektor Ancaman (Threat Vector) | Severity | Dampak OWASP | Rekomendasi Mitigasi Teknis |
|:---|:---|:---|:---:|:---|:---|
| **Pilar 1 (Auth)** | `src/app/actions.ts` | Server Actions publik dapat ditembak tanpa autentikasi session. | **P0 (Kritis)** | A01:2025 Broken Access Control | Pasang verifikasi sesi auth di awal Server Action, atau batasi akses hanya untuk pengguna terotentikasi. |
| **Pilar 4 (DoS)** | `/api/cover-letter` & `/analyze-gap` | Endpoint AI publik tanpa rate limiting; risiko Denial of Wallet / kuota token Groq habis. | **P0 (Kritis)** | A04:2025 Insecure Design / DoS | Pasang rate limiter per IP (Upstash Redis / in-memory sliding window: maks 5 req/menit). |
| **Pilar 1 (BOLA)** | `src/app/actions.ts:9` | `select("id").limit(1)` memicu IDOR/BOLA jika terdapat > 1 profil pengguna. | **P1 (Tinggi)** | A01:2025 Broken Access Control | Gunakan `auth.uid()` atau ID profil eksplisit dari session login, bukan arbitrary single fetch. |
| **Pilar 4 (Headers)** | `next.config.ts` | Ketiadaan Security Headers (X-Frame-Options, CSP, HSTS, nosniff). | **P1 (Tinggi)** | A02:2025 Security Misconfiguration | Konfigurasikan blok `headers()` di `next.config.ts` dengan policy CSP, HSTS, dan X-Frame-Options: DENY. |
| **Pilar 3 (Secrets)** | `src/lib/supabase.ts` | Ketiadaan guard `import 'server-only'` pada file pemegang service_role key. | **P1 (Tinggi)** | A02:2025 Cryptographic / Secret Exposure | Pasang package `server-only` dan letakkan `import 'server-only'` di baris teratas `supabase.ts`. |
| **Pilar 1 (RLS)** | `docs/magangyokk-schema.sql` | Pemanggilan universal `service_role` membypass 100% RLS policies database. | **P1 (Tinggi)** | A01:2025 Broken Access Control | Persiapkan client scoped auth (`createBrowserClient` / `createServerClient` `@supabase/ssr`) untuk Phase 2. |
| **Pilar 2 (XSS)** | `src/components/job-card.tsx:184` | Atribut `href={job.url}` tanpa validasi skema protokol (potensi `javascript:` URI). | **P2 (Sedang)** | A05:2025 Injection (DOM XSS) | Buat utilitas validasi: `const safeUrl = /^https?:\/\//i.test(url) ? url : '#'`. |
| **Pilar 2 (Upload)** | `/api/resume/upload` | Ekstraksi teks PDF berpotensi membawa null byte (`\0`) ke PostgreSQL text column. | **P2 (Sedang)** | A08:2025 Data Integrity Failures | Bersihkan hasil ekstraksi string: `rawText.replace(/\0/g, '')` sebelum dikirim ke database. |

---

## 3. INDEPENDENT ADVISOR VALIDATION (ANTI-FALSE-MISMATCH CHECK)

Sebelum laporan audit Bagian IV ini disahkan, evaluasi independen dijalankan untuk memastikan tidak ada celah yang salah dinilai (*false positive* atau *false severity*):

1. **Apakah ketiadaan autentikasi pada Server Actions benar-benar keparahan P0 untuk aplikasi Phase 1?**
   - *Validasi:* **P0 Sah**. Meskipun Phase 1 berstatus solo-user, aplikasi yang dideploy ke publik di Vercel membuka endpoint Server Action ke seluruh internet. Siapa pun yang menginspeksi network tab peramban dapat mengambil action ID dan mengubah status seluruh lowongan database tanpa izin. Celah ini wajib diklasifikasikan sebagai P0.
2. **Apakah ketiadaan Rate Limiting benar-benar ancaman nyata jika menggunakan free tier?**
   - *Validasi:* **P0 Sah**. Groq free tier memiliki hard limit 500.000 token/hari dan 30 request/menit. Serangan flooding sederhana selama 60 detik akan memicu HTTP 429 dan membekukan seluruh fitur AI aplikasi untuk sisa hari tersebut.
3. **Apakah `service_role` membocorkan rahasia ke publik jika file tidak diimpor ke client?**
   - *Validasi:* Saat ini variabel `SUPABASE_SERVICE_ROLE_KEY` berada di sisi server dan tidak bocor ke client bundle. Namun ketiadaan deklarasi `server-only` dinilai tepat sebagai **P1 (High Technical Debt & Misconfiguration)** karena tidak ada pengaman otomatis di level compiler build.

---

## KESIMPULAN AUDIT BAGIAN IV

Secara fundamental, perimeter pertahanan dasar MagangYokk telah memiliki titik awal yang baik: query database kebal terhadap SQL Injection berkat PostgREST, output tampilan kebal terhadap reflected XSS berkat React JSX encoding, dan endpoint upload PDF telah memiliki pengaman ukuran serta magic bytes.

Namun, dari kacamata **Standar Keamanan Aplikasi Web Industri (OWASP Top 10:2025)**, proyek ini menghadapi **dua risiko eksploitasi terbuka (P0 Critical Vulnerabilities)**:
1. **Broken Access Control pada Server Actions:** Endpoint mutasi data dapat dipanggil oleh siapa pun tanpa autentikasi.
2. **Denial of Wallet / Service pada API AI:** Endpoint panggilan LLM Groq dapat dibanjiri request tanpa batas rate limit.

Mengimplementasikan session guard, rate limiting per-IP, dan Security Headers di `next.config.ts` adalah prasyarat mutlak yang wajib dipenuhi sebelum sistem dibuka untuk deployment produksi publik.
