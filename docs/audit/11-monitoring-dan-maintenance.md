# LAPORAN AUDIT REKAYASA PERANGKAT LUNAK: BAGIAN XI - MONITORING DAN MAINTENANCE
**Proyek:** MagangYokk (Job Aggregator & Application Tracker)  
**Tolok Ukur Standar:** Panduan.txt (Seksi 26-27, Baris 978-1024) & Standar Observabilitas Sistem Modern (OpenTelemetry / SRE)  
**Peran:** Senior Site Reliability Engineer & Monitoring Lead  
**Status Audit:** Final (Documented for Repository Artifact)

---

## 0. AUTONOMOUS SKILLS LOADED & JUSTIFIKASI METODOLOGI

Dalam melaksanakan audit sistem observabilitas, penanganan insiden, dan rencana pemeliharaan operasional ini, sistem secara otonom memindai katalog kapabilitas internal dan memuat dua skill spesialis:

1. **`skill://monitoring-expert` (Observability Architecture, Telemetry & Health Probing)**
   - *Justifikasi Metodologi:* Mengevaluasi arsitektur "Tiga Pilar Observabilitas" (Logs, Metrics, Traces), implementasi *Structured Logging* (JSON format), perancangan *health check probes* sintetis, dan eliminasi *blind spots* operasional pada serverless runtime.
2. **`skill://dependabot` (Supply Chain Security & Automated Dependency Hygiene)**
   - *Justifikasi Metodologi:* Menilai kesiapan pembaruan patch keamanan otomatis via GitHub Dependabot, audit kerentanan CVE pada pohon dependensi npm (`npm audit`), dan strategi mitigasi dependensi transitif berisiko tinggi.
3. **Google SRE Incident Response & Error Budget Governance**
   - *Justifikasi Metodologi:* Audit kesiapan deteksi insiden proaktif (*Error Tracking*), penanganan kebocoran data pada log (*log sanitization*), dan prosedur rotasi kredensial (*secrets rotation*).

---

## 1. THE FOUR MONITORING & MAINTENANCE AUDIT PILLARS

### PILAR 1: Logging Architecture & Structured Telemetry (Panduan.txt Seksi 40)

#### A. Evaluasi Pemanggilan `console.error` di Seluruh Endpoint
- **Fakta di Codebase:**
  Pencarian logging pada Route Handlers dan Server Actions:
  - `src/app/actions.ts:35, 42, 72, 79` -> `console.error("Gagal update status...", error)`
  - `src/app/api/cover-letter/route.ts:138, 167` -> `console.error("Groq API Error:", errText)`
  - `src/app/api/resume/analyze-gap/route.ts:111, 145` -> `console.error("Groq API error:", errText)`
  - `src/app/api/resume/upload/route.ts:78` -> `console.error("Resume upload error:", err)`
- **Temuan Celah Observabilitas (Unstructured Raw String Logs - Severity: P1):**
  1. *Ketiadaan Format Terstruktur:* Seluruh log dicetak sebagai string teks bebas (*unstructured raw text*).
  2. *Ketiadaan Konteks Metadata:* Log tidak memuat `timestamp`, `requestId` / `traceId`, `userId`, `clientIp`, atau durasi latensi `latencyMs`.
  3. *Dampak Operasional:* Pada platform hosting seperti Vercel Logs atau Datadog, log teks mentah tidak dapat difilter secara analitis (misal: "tampilkan seluruh error dengan status 502 dalam 1 jam terakhir"). Pencarian error bergantung pada full-text search lambat.

#### B. Risiko Kebocoran Data Pribadi (PII) pada Log Serverless (Severity: P1)
- **Fakta di `src/app/api/resume/analyze-gap/route.ts:133`:**
  ```ts
  console.error("Failed to parse AI output:", content, parseErr)
  ```
- **Bahaya Kebocoran Data Sensitif:**
  Variabel `content` memuat teks mentah respon LLM Groq yang mencerminkan profil kandidat: ringkasan CV, pengalaman kerja, nomor kontak/portfolio, dan analisis kelemahan kandidat.
  - *Dampak:* Data pribadi sensitif pelamar (PII) tercetak ke stdout dan tersimpan di log serverless Vercel, berpotensi melanggar privasi pengguna dan standar kepatuhan data.

---

### PILAR 2: Error Monitoring & Incident Notification (Panduan.txt Seksi 41)

#### A. Ketiadaan Real-Time Error Tracking SDK (Severity: P0)
- **Fakta di `package.json`:**
  Aplikasi **tidak memasang SDK Error Tracking apa pun** (tidak ada `@sentry/nextjs`, LogRocket, atau Highlight.io).
- **Kondisi Blind Spot Operasional Kritis:**
  1. Jika pengguna mengalami runtime exception di sisi client browser (misal: gagal parsing JSON, error DOM unhandled, atau crash di mobile), **developer tidak pernah mengetahuinya**.
  2. Jika terjadi lonjakan error 500 atau 502 pada panggilan AI di server Vercel, tidak ada sistem yang menangkap *stack trace*, *breadcrumbs*, atau konteks lingkungan pengguna secara real-time.
  3. Pemantauan saat ini bersifat **100% Pasif**: developer baru tahu ada error jika pengguna melapor secara manual.

#### B. Alur Notifikasi Insiden (Alerting Pipeline)
- **Status: Kosong (Zero Alerting).**
  Tidak ada integrasi webhook peringatan insiden ke Slack, Telegram, atau email developer saat terjadi lonjakan *Error Rate* di Vercel atau saat pipeline scraper GitHub Actions mengalami kegagalan.

---

### PILAR 3: Health Check & Dependency Probing (Panduan.txt Seksi 42)

#### A. Ketiadaan Endpoint Health Check Dedicated (`/api/health`) (Severity: P1)
- **Fakta di `src/app/api/`:**
  Hanya ada 3 route: `cover-letter`, `resume/upload`, `resume/analyze-gap`.
  **TIDAK ADA endpoint `/api/health`**.
- **Kebutuhan Pengujian Dependensi Sintetis:**
  1. Layanan monitoring eksternal (seperti UptimeRobot, BetterStack, atau Cronitor) membutuhkan endpoint ringan (*lightweight probe*) yang mengembalikan status `200 OK` dalam hitungan milidetik.
  2. Saat ini, jika uptime monitor mem-ping halaman beranda (`/`), monitor tersebut secara tidak sengaja memicu query database ganda un-cached (`revalidate = 0`), membuang-buang kuota koneksi Supabase.
  3. Proyek tidak memiliki probe aktif yang memverifikasi kesehatan koneksi database (`SELECT 1`) dan ketersediaan gateway Groq API secara terpisah.

---

### PILAR 4: Maintenance Plan, Dependency Hygiene & Secrets Rotation (Panduan.txt Seksi 43)

#### A. Hasil Audit Kerentanan Paket (`npm audit`) (Severity: P0)
Hasil pemindaian keamanan dependensi riil (`npm audit`) menemukan **20 kerentanan keamanan aktif**:
- **2 Critical Severity:**
  - `next 16.3.4`: Remote Code Execution pada `next/og` ImageResponse (GHSA-vcvr-r3jv-pc5j), SSRF pada Image Optimization, dan cache poisoning pada SSG/ISR. (Memerlukan upgrade ke `next >= 16.4.2`).
  - `proxy-addr`: IP spoofing via IPv4-mapped IPv6 trust subnet.
- **16 High Severity:**
  - Kerentanan ReDoS pada `braces` dan `brace-expansion`.
  - Kerentanan DoS pada `deepmerge-ts` dan `mysql2` (dependensi transitif Prisma yang tidak terpakai di runtime).
- **2 Moderate Severity:**
  - `fast-uri` dan `ip-address`.

#### B. Ketiadaan Otomatisasi Dependabot
- Berkas `.github/dependabot.yml` **tidak ada di repositori**.
- Ketiadaan Dependabot menyebabkan patch keamanan CVE di atas tidak diperbarui secara berkala melalui automated Pull Requests.

#### C. Ketiadaan Prosedur Darurat Rotasi Kredensial (Secrets Rotation)
- Dokumen `docs/MAINTENANCE.md` memuat checklist mingguan dan bulanan, tetapi **tidak mendokumentasikan prosedur rotasi rahasia (*Secrets Rotation Runbook*)** jika `SUPABASE_SERVICE_ROLE_KEY` atau `GROQ_API_KEY` terkompromi.

---

## 2. MATRIKS EVALUASI MONITORING & MAINTENANCE

| Pilar / Komponen | Kondisi Observabilitas Saat Ini | Blind Spot Operasional | Tingkat Severity | Rekomendasi Rekayasa SRE |
|:---|:---|:---|:---:|:---|
| **Pilar 2 (Error SDK)** | `package.json` tanpa Sentry / APM. | Zero visibility terhadap unhandled exception di client dan server; insiden 500 tidak terpantau. | **P0 (Kritis)** | Pasang `@sentry/nextjs`: aktifkan real-time exception tracking dan alert langsung ke Telegram/email. |
| **Pilar 4 (CVEs)** | `npm audit` menunjukkan 20 kerentanan (2 Critical termasuk Next.js RCE). | Potensi eksploitasi dependensi publik pada server Vercel. | **P0 (Kritis)** | Jalankan upgrade Next.js ke versi patch aman (`npm install next@latest`) dan eliminasi dependensi Prisma yang memicu `mysql2`/`deepmerge-ts`. |
| **Pilar 3 (Health)** | Ketiadaan endpoint `/api/health`. | Tidak dapat dipantau oleh probe uptime sintetis; ping ke beranda membebani database. | **P1 (Tinggi)** | Buat `src/app/api/health/route.ts` yang mengeksekusi ping ringan ke Supabase (`SELECT 1`) dan cek status memori. |
| **Pilar 1 (Logging)** | `console.error` berbasis teks mentah tanpa konteks metadata. | Log serverless tidak dapat di-query, di-filter, atau diagregasi di log management cloud. | **P1 (Tinggi)** | Terapkan utility structured logger (JSON payload: `{ level, timestamp, route, error, latency }`). |
| **Pilar 1 (PII Leak)** | `analyze-gap/route.ts` mencetak respon AI mentah saat parse error. | Data pribadi dan ringkasan resume kandidat bocor dan tersimpan permanen di serverless log. | **P1 (Tinggi)** | Sanitasi log: cetak pesan error dan ID lowongan saja, jangan cetak raw payload `content`. |
| **Pilar 4 (Dependabot)**| Tidak ada `.github/dependabot.yml`. | Pembaruan patch keamanan dependensi bergantung 100% pada pengecekan manual pengembang. | **P1 (Tinggi)** | Buat file `.github/dependabot.yml` dengan jadwal mingguan untuk ekosistem `npm` dan `github-actions`. |
| **Pilar 4 (Runbook)** | `MAINTENANCE.md` tanpa panduan rotasi kredensial darurat. | Keterlambatan penanganan insiden jika kunci API bocor ke pihak luar. | **P2 (Sedang)** | Tambahkan langkah demi langkah rotasi kredensial (Supabase, Groq, Vercel Env) di `MAINTENANCE.md`. |

---

## 3. INDEPENDENT ADVISOR VALIDATION (ANTI-FALSE-MISMATCH CHECK)

Sebelum kesimpulan audit Bagian XI ini disahkan, evaluasi independen dijalankan untuk memastikan validitas temuan teknis:

1. **Apakah temuan `npm audit` 20 kerentanan benar-benar valid pada kode saat ini?**
   - *Validasi:* **Fakta Nyata Terminal**. Eksekusi langsung perintah `npm audit` membuktikan keberadaan 20 kerentanan (2 critical, 16 high, 2 moderate), termasuk advisory resmi Next.js (GHSA-vcvr-r3jv-pc5j). Temuan CVE adalah fakta absolut bukan estimasi.
2. **Apakah ketiadaan Sentry dapat ditoleransi untuk solo developer?**
   - *Validasi:* Untuk proyek hobi lokal bisa diterima, namun untuk aplikasi yang di-deploy ke Vercel dan melayani pengguna publik, **ketiadaan error tracking berarti kebutaan total (*total operational blindness*)**. Sentry tier gratis (5.000 error/bulan) tidak memerlukan biaya dan wajib dipasang untuk memenuhi standar SRE modern.
3. **Apakah pembuatan endpoint `/api/health` benar-benar esensial?**
   - *Validasi:* **Fakta Standar Arsitektur Cloud**. Tanpa `/api/health`, layanan pemantau eksternal gratis (seperti UptimeRobot) terpaksa menembak halaman beranda (`/`). Hal ini memicu SSR query database yang membuang-buang kuota bandwidth 5 GB Supabase. Endpoint health check ringan adalah solusi rekayasa wajib.

---

## 4. KESIMPULAN REKAYASA & ACTIONABLE BLUEPRINT

Kondisi observabilitas MagangYokk saat ini berada pada tahap **Reaktif & Rentan Supply-Chain**: tidak ada pelacakan error otomatis, log belum terstruktur, terdapat 2 CVE critical pada dependensi, dan ketiadaan endpoint health check.

### 3 Tindakan Prioritas Pemeliharaan SRE:
1. **Tambahkan Endpoint Health Check (`src/app/api/health/route.ts`):**
   ```ts
   import { NextResponse } from "next/server"
   import { supabase } from "@/lib/supabase"
   export async function GET() {
     const start = Date.now()
     const { error } = await supabase.from("profiles").select("id").limit(1)
     const dbLatency = Date.now() - start
     if (error) return NextResponse.json({ status: "degraded", database: "error" }, { status: 503 })
     return NextResponse.json({ status: "healthy", dbLatencyMs: dbLatency, timestamp: new Date().toISOString() })
   }
   ```
2. **Aktifkan Dependabot (`.github/dependabot.yml`):**
   Jadwalkan pemindaian mingguan untuk ekosistem `npm` dan `github-actions`.
3. **Upgrade Dependensi Kritis:**
   Jalankan pembaruan Next.js ke versi yang telah menambal celah keamanan RCE (`next@16.4.2+`).
