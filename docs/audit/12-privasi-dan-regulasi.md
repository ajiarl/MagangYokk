# LAPORAN AUDIT REKAYASA PERANGKAT LUNAK: BAGIAN XII - PRIVASI DAN REGULASI
**Proyek:** MagangYokk (Job Aggregator & Application Tracker)  
**Tolok Ukur Standar:** Panduan.txt (Seksi 28, Baris 1025-1074), UU No. 27 Tahun 2022 (UU PDP), GDPR, & Permenkominfo No. 5/2020  
**Peran:** Data Privacy Officer (DPO) & Regulatory Compliance Counsel  
**Status Audit:** Final (Documented for Repository Artifact)

---

## 0. AUTONOMOUS SKILLS LOADED & JUSTIFIKASI METODOLOGI

Dalam melaksanakan audit kepatuhan hukum, tata kelola privasi data, dan hak subjek data ini, sistem secara otonom memindai katalog kapabilitas internal dan memuat dua skill spesialis:

1. **`skill://aif-security-checklist` (Regulatory Data Protection & PII Audit Standards)**
   - *Justifikasi Metodologi:* Digunakan untuk menelusuri pengumpulan, transmisi, penyimpanan, dan pembuangan Data Pribadi (Personally Identifiable Information / PII), mengevaluasi mekanisme *Explicit Consent*, audit pencegahan kebocoran data pelamar pada log server, dan kepatuhan terhadap prinsip *Data Minimization*.
2. **`skill://security-review` (Data Protection, Secrets Exposure & Supply Chain Compliance)**
   - *Justifikasi Metodologi:* Mengevaluasi kepatuhan enkripsi data saat transit (TLS/HTTPS), audit kebijakan retensi data (*Data Retention*), dan verifikasi pemrosesan pihak ketiga (*Third-Party AI Processors*).
3. **Kerangka Hukum UU Pelindungan Data Pribadi (UU PDP No. 27/2022) & GDPR**
   - *Justifikasi Metodologi:* Menguji kepatuhan terhadap Pasal 4 (Kategori Data), Pasal 20-22 (Dasar Pemrosesan & Persetujuan Sah), Pasal 8-9 (Hak Menghapus / Right to Erasure), dan Pasal 56 (Transfer Data Lintas Batas / Cross-Border Data Transfer).

---

## 1. THE FOUR PRIVACY & REGULATORY AUDIT PILLARS

### PILAR 1: Kepatuhan UU PDP No. 27/2022 & Dasar Pemrosesan Data (Panduan.txt Seksi 44)

#### A. Identifikasi Kategori Data Pribadi yang Dikumpulkan
Sistem MagangYokk mengumpulkan dan memproses dua kategori data pribadi menurut Pasal 4 UU PDP:
1. **Data Pribadi yang Bersifat Umum (Pasal 4 Ayat 3):**
   - Nama lengkap (`profile.full_name`)
   - Tautan portofolio dan profil GitHub (`portfolio_url`, `github_url`)
   - Keahlian teknis dan peran yang diminati (`skills`, `preferred_roles`)
   - Catatan interaksi pelamaran magang (`applications.notes`)
2. **Data Pribadi yang Berpotensi Bersifat Spesifik (Pasal 4 Ayat 2):**
   - Berkas resume CV PDF yang diunggah (`src/app/api/resume/upload`) dan diekstrak ke `profiles.bio` umumnya memuat data pribadi sensitif mahasiswa: tempat & tanggal lahir, nomor telepon seluler/WhatsApp, alamat domisili lengkap, data pendidikan formal, IPK/transkrip, serta riwayat organisasi.

#### B. Evaluasi Persetujuan Pengguna (Explicit Consent - Severity: P0)
- **Klausul UU PDP:**
  - *Pasal 20 Ayat (1):* Pengendali Data Pribadi wajib memiliki dasar pemrosesan data pribadi.
  - *Pasal 22 Ayat (1):* Persetujuan pemrosesan data pribadi harus dilakukan melalui persetujuan tertulis atau terekam secara eksplisit untuk tujuan tertentu.
- **Fakta di `src/components/resume-upload-modal.tsx`:**
  Modal unggah resume PDF hanya menyediakan kotak *drag-and-drop*:
  `"Klik untuk pilih file resume PDF. Maksimal 10 MB. Teks akan diekstrak otomatis."`
- **Pelanggaran Regulasi Kritis:**
  1. **Nol Persetujuan Tertulis (Zero Explicit Consent):** Tidak ada *checkbox* atau pernyataan persetujuan pemrosesan data pribadi sebelum berkas CV diunggah dan disimpan ke server Supabase.
  2. **Ketiadaan Pemberitahuan Tujuan (Notice of Purpose):** Pengguna tidak diberikan penjelasan eksplisit mengenai untuk apa saja data resume mereka diproses, disimpan, dan diekstraksi.

---

### PILAR 2: Transparansi Pihak Ketiga & Transfer Data Lintas Batas (Panduan.txt Seksi 44)

#### A. Transfer Data Lintas Batas ke Pihak Ketiga (Groq Inc. / USA) (Severity: P0)
- **Klausul UU PDP:**
  *Pasal 56 Ayat (1-4):* Pengendali Data Pribadi yang melakukan transfer Data Pribadi ke luar wilayah hukum Indonesia wajib memastikan negara tujuan memiliki tingkat pelindungan data yang setara, ATAU memiliki jaminan hukum yang mengikat, ATAU **wajib mendapatkan persetujuan dari Subjek Data Pribadi**.
- **Fakta Alur Data di Backend:**
  Di `/api/resume/analyze-gap/route.ts` dan `/api/cover-letter/route.ts`:
  Teks riwayat hidup kandidat (`profile.bio`), daftar keahlian, dan nama lengkap dikirimkan secara langsung melalui API HTTP ke endpoint:
  `https://api.groq.com/openai/v1/chat/completions` (Server berlokasi di Amerika Serikat).
- **Pelanggaran Regulasi Kritis:**
  Aplikasi **tidak pernah memberitahu pengguna bahwa data resume mereka ditransfer ke pihak ketiga di luar yurisdiksi Republik Indonesia (Groq Cloud / Meta Llama di AS)** untuk analisis AI. Ketiadaan klausul persetujuan transfer data lintas batas ini melanggar Pasal 56 UU PDP dan Pasal 44-49 GDPR.

---

### PILAR 3: Hak Subjek Data (Hak Menghapus & Menarik Kembali Data) (Panduan.txt Seksi 45)

#### A. Pemenuhan Hak Menghapus (Right to be Forgotten - Severity: P1)
- **Klausul UU PDP:**
  *Pasal 8:* Subjek Data Pribadi berhak mengakhiri pemrosesan, menghapus, dan/atau memusnahkan Data Pribadi tentang dirinya sesuai dengan ketentuan peraturan perundang-undangan.
- **Fakta di Antarmuka Pengguna (UI):**
  Pemeriksaan seluruh komponen antarmuka (`job-feed-client.tsx`, `job-card.tsx`, `kanban-board.tsx`, dan seluruh modals):
  1. **Tidak ada tombol Hapus CV:** Sekali resume diunggah, teks tersebut tersimpan permanen di `profiles.bio` tanpa ada tombol "Hapus Resume Saya" di UI.
  2. **Tidak ada tombol Hapus Draf Cover Letter:** Draf surat lamaran yang pernah dibuat tersimpan permanen di `applications.cover_letter_draft` tanpa opsi pembersihan.
  3. **Tidak ada fitur Hapus Lamaran:** Di papan Kanban, pengguna hanya dapat memindahkan status (misal ke "Ditolak"), tetapi tidak dapat menghapus record lamaran dari database.
  4. **Tidak ada Self-Serve Account/Profile Deletion:** Pengguna tidak dapat menghapus profil mereka sendiri dari sistem.

---

### PILAR 4: Dokumen Kebijakan Privasi & Syarat Ketentuan (Panduan.txt Seksi 46)

#### A. Ketiadaan Dokumen Hukum (Privacy Policy & Terms of Service) (Severity: P0)
- **Fakta di Repositori:**
  1. Halaman `/privacy` atau `src/app/privacy/page.tsx`: **TIDAK ADA (HTTP 404)**.
  2. Halaman `/terms` atau `src/app/terms/page.tsx`: **TIDAK ADA (HTTP 404)**.
  3. Footer Website: Berkas `src/app/page.tsx` hanya merender `<header>` dan `<main>`, **sama sekali tidak memiliki elemen `<footer>`** yang memuat tautan Kebijakan Privasi, Syarat Ketentuan, kontak pengembang, atau informasi perlindungan data.
- **Konsekuensi Hukum:**
  Menyajikan layanan berbasis web yang mengumpulkan data pribadi di wilayah hukum Indonesia tanpa dokumen Kebijakan Privasi yang sah melanggar ketentuan Pasal 39 UU ITE, Permenkominfo No. 20/2016, dan UU PDP No. 27/2022.

#### B. Kebijakan Retensi Data & Pendaftaran PSE Lingkup Privat
- **Retensi Data:**
  Tabel `jobs` memiliki kolom `expires_at`, dan `docs/MAINTENANCE.md` menyebutkan query arsip 45 hari. Namun, belum ada otomatisasi pemusnahan data pribadi (*automatic data purging*) untuk data resume yang sudah tidak digunakan oleh pelamar.
- **Kewajiban PSE Lingkup Privat (Permenkominfo No. 5/2020):**
  Untuk Phase 1 (alat bantu pribadi Aji), pendaftaran PSE tidak diwajibkan. Namun, ketika platform dibuka untuk pendaftaran publik mahasiswa (Phase 2), MagangYokk wajib mendaftarkan sistemnya sebagai **Penyelenggara Sistem Elektronik (PSE) Lingkup Privat** di Kementerian Komunikasi dan Informatika sebelum mengumpulkan data masyarakat umum.

---

## 2. MATRIKS EVALUASI KEPATUHAN REGULASI & PRIVASI DATA

| Pilar / Klausul | Kondisi Riil di Kode | Pelanggaran Regulasi / Risiko Hukum | Tingkat Severity | Rekomendasi Pemenuhan Hukum & Kode |
|:---|:---|:---|:---:|:---|
| **Pilar 1 (Consent)** | `ResumeUploadModal.tsx` upload file tanpa checkbox persetujuan. | Pelanggaran Pasal 20 & 22 UU PDP (Pemrosesan data tanpa persetujuan eksplisit). | **P0 (Kritis)** | Tambahkan checkbox persetujuan eksplisit: *"Saya menyetujui pemrosesan data CV saya sesuai Kebijakan Privasi"*. |
| **Pilar 2 (Cross-Border)**| `/api/resume/analyze-gap` transfer teks CV ke Groq Cloud di USA tanpa izin. | Pelanggaran Pasal 56 UU PDP & Chapter V GDPR (Transfer data internasional tanpa transparansi). | **P0 (Kritis)** | Berikan transparansi: cantumkan klausul bahwa data dianonimisasi dan diproses via Groq API di AS. |
| **Pilar 4 (Legal Docs)**| Tidak ada route `/privacy` dan `/terms`; ketiadaan footer situs. | Pelanggaran standar transparansi digital UU PDP & UU ITE (Ketiadaan Privacy Policy). | **P0 (Kritis)** | Terbitkan halaman `/privacy` dan `/terms`, lalu pasang tautan permanen di footer beranda. |
| **Pilar 3 (Erasure)** | Ketiadaan tombol hapus CV, draf surat, atau catatan di antarmuka. | Pelanggaran Pasal 8 UU PDP (Hak Subjek Data untuk menghapus/memusnahkan data pribadi). | **P1 (Tinggi)** | Tambahkan tombol *"Hapus CV"* di modal resume dan aksi *"Hapus Lamaran"* di kartu kanban. |
| **Pilar 4 (Retention)**| Lowongan lama dan riwayat CV tersimpan tanpa jadwal pemusnahan otomatis. | Potensi pelanggaran Pasal 43 UU PDP (Data disimpan melampaui masa retensi yang wajar). | **P1 (Tinggi)** | Jadwalkan pg_cron Supabase untuk otomatis mengosongkan teks resume yang tidak diakses > 6 bulan. |
| **Pilar 4 (PSE)** | Proyek belum terdaftar di Kominfo sebagai PSE Lingkup Privat. | Risiko pemblokiran domain saat dibuka ke publik pada Phase 2 (Permenkominfo 5/2020). | **P2 (Sedang)** | Siapkan pendaftaran PSE Kominfo saat persiapan peluncuran Phase 2 publik. |

---

## 3. INDEPENDENT ADVISOR VALIDATION (ANTI-FALSE-MISMATCH CHECK)

Sebelum kesimpulan audit Bagian XII ini disahkan, evaluasi independen dijalankan untuk memastikan validitas temuan regulasi:

1. **Apakah UU PDP berlaku untuk proyek yang dibangun oleh solo developer mahasiswa?**
   - *Validasi:* **Berlaku penuh jika memproses data orang lain**. UU PDP Pasal 2 mengecualikan pemrosesan data untuk kepentingan pribadi atau rumah tangga (*personal/household activity*). Selama MagangYokk hanya digunakan oleh Aji untuk CV dirinya sendiri (Phase 1 internal), risiko denda hukum nihil. Namun, **begitu MagangYokk dibuka ke publik di Vercel (Phase 2) dan mahasiswa lain mengunggah CV mereka**, MagangYokk secara hukum berstatus sebagai **Pengendali Data Pribadi** dan terikat sanksi administratif penuh UU PDP. Mengidentifikasi ini sejak dini adalah kewajiban tata kelola rekayasa perangkat lunak.
2. **Apakah ketiadaan Privacy Policy benar-benar P0?**
   - *Validasi:* **Fakta Hukum Digital**. Di Google Play, App Store, Vercel, maupun regulasi Kominfo, merilis aplikasi web publik yang mengumpulkan dokumen resume tanpa Kebijakan Privasi adalah pelanggaran yang dapat menyebabkan pemutusan layanan oleh platform hosting atau laporan pelanggaran data.
3. **Apakah Groq API menyimpan data CV pengguna?**
   - *Validasi:* Kebijakan privasi Groq Cloud menetapkan bahwa data API tidak digunakan untuk melatih model secara default, tetapi data transit tetap melintasi batas negara. Kewajiban Pasal 56 UU PDP adalah pada aspek **Pemberitahuan dan Persetujuan Transfer Internasional**, bukan pada apakah data disimpan permanen di sana.

---

## 4. KESIMPULAN REKAYASA & ACTIONABLE COMPLIANCE BLUEPRINT

MagangYokk mengelola aset data yang sangat berharga sekaligus berisiko tinggi: **dokumen riwayat hidup dan profil karir mahasiswa IT Indonesia**.

### 3 Langkah Praktis Memenuhi Kepatuhan UU PDP Menuju Phase 2:
1. **Terbitkan Halaman Kebijakan Privasi (`src/app/privacy/page.tsx`):**
   Muat klausul resmi yang menjelaskan:
   - Identitas Pengendali Data.
   - Jenis data yang dikumpulkan (Nama, Skills, Teks Resume CV).
   - Tujuan pemrosesan (Scoring kecocokan dan pembuatan draf cover letter).
   - Transparansi pihak ketiga (Penggunaan Groq Cloud Llama di AS).
   - Saluran pengaduan dan hak penghapusan data.
2. **Pasang Checkbox Persetujuan di Modal CV (`ResumeUploadModal.tsx`):**
   Wajibkan pengguna mencentang persetujuan sebelum tombol upload aktif.
3. **Sediakan Fitur Hak Menghapus (Right to Erasure):**
   Sediakan tombol satu klik di modal profil: *"Hapus Riwayat Resume & Catatan Saya"*.
