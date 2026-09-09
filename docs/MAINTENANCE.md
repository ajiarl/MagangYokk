# MagangYokk Maintenance & Runbook Guide

Dokumentasi operasional harian, troubleshooting, monitoring, dan checklist berkala untuk web app MagangYokk.

---

## 1. Arsitektur & Komponen Kritis

```
GitHub Actions (Cloud Radar) ──[REST API]──▶ Supabase PostgreSQL ◀──[Prisma & SSR]── Next.js App (Feed)
                                                    ▲
                                                    └─── [Server Action] ── /api/cover-letter (Groq Qwen 3.8)
```

- **Database:** Supabase PostgreSQL (Project ID: `bcverqvmibfzapllxvue`)
- **Web App:** Next.js 16 (React Server Components + Server Actions)
- **Scraper:** Python `jobspy` di GitHub Actions cron (09:00 & 18:00 WIB)
- **LLM Engine:** Groq API (`qwen/qwen3.8-27b`)

---

## 2. Checklist Pemeliharaan Berkala (Maintenance Routine)

### Mingguan (Weekly)
1. **Periksa GitHub Actions Runs:**
   Buka `https://github.com/ajiarl/MagangYokk/actions` atau jalankan via CLI:
   ```bash
   gh run list --workflow=radar.yml --limit 5
   ```
   Pastikan statusnya centang hijau (`completed / success`).
2. **Cek Kuota Database Supabase:**
   - Free-tier Supabase memiliki batas kuota disk 500 MB.
   - Tabel `jobs` menyimpan rata-rata 50-100 baris per minggu (~2 MB). Aman untuk 1-2 tahun ke depan tanpa hard-delete.

### Bulanan (Monthly)
1. **Pruning Job Kedaluwarsa (Optional):**
   Lowongan di atas 45 hari dapat di-archive atau ditandai lewat SQL di Supabase SQL Editor:
   ```sql
   update public.jobs 
   set expires_at = now() 
   where scraped_at < now() - interval '45 days';
   ```
2. **Review Groq API Usage:**
   Cek dashboard Groq Cloud (`console.groq.com`) untuk melihat token usage model `qwen/qwen3.8-27b`.

---

## 3. Checklist Keamanan (Security Hardening)

| Area | Status | Catatan & Mitigasi |
|---|---|---|
| **Kredensial Git** | Aman | `.env` dan `.env.local` ter-ignore di `.gitignore`. Tidak ada hardcoded secret di commit history. |
| **Akses Database** | Aman | Row Level Security (RLS) aktif. `service_role` hanya dieksekusi di server Next.js (tidak terekspos ke browser client). |
| **LLM Anti-Hallucination** | Aktif | System prompt `/api/cover-letter` diproteksi guardrail ketat berbasis profil nyata Aji. |
| **Input Sanitization** | Terkendali | Job description eksternal dipotong maksimal 3.000 karakter sebelum disimpan ke database. |

---

## 4. Troubleshooting & Gotchas Umum

### A. Scraper GitHub Actions Gagal (Exit 1)
- **Gejala:** GitHub Actions merah dengan error `Could not find column in schema cache`.
- **Penyebab:** Kolom di payload `scripts/radar.py` tidak sesuai dengan skema tabel Supabase.
- **Solusi:** Selalu sesuaikan dictionary payload dengan kolom resmi di `docs/magangyokk-schema.sql`.

### B. Next.js Connection Pooler Error
- **Gejala:** Prisma error `Can't reach database server at aws-0-ap-southeast-1.pooler.supabase.com:6543`.
- **Penyebab:** Connection pooler transaction mode butuh parameter pgbouncer.
- **Solusi:** Pastikan `DATABASE_URL` menggunakan port 6543 dengan query string `?pgbouncer=true`.
