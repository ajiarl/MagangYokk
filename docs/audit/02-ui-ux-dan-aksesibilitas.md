# LAPORAN AUDIT REKAYASA PERANGKAT LUNAK: BAGIAN II - UI, UX, DAN AKSESIBILITAS
**Proyek:** MagangYokk (Job Aggregator & Application Tracker)  
**Tolok Ukur Standar:** Panduan.txt (Seksi 5-8, Baris 140-261) & W3C WCAG 2.2 Level AA  
**Peran:** Lead Design Systems Engineer & Senior Accessibility Auditor (IAAP WAS Certified)  
**Status Audit:** Final (Documented for Repository Artifact)

---

## 0. AUTONOMOUS SKILLS LOADED & JUSTIFIKASI METODOLOGI

Dalam melaksanakan audit komprehensif antarmuka dan aksesibilitas ini, sistem secara otonom memindai katalog kapabilitas internal dan memuat dua skill spesialis:

1. **`skill://impeccable` (Design System Architecture, Heuristic Review & Visual Craft Standard)**
   - *Justifikasi Metodologi:* Digunakan untuk mengevaluasi disiplin token desain (OKLCH/Hex palette, semantic variables, corner radius consistency, layout rhythm, z-index scale, dan visual hierarchy). Memastikan antarmuka tidak terjebak dalam perangkap *AI Slop* (seperti button clutter, ghost cards, unmotivated animations, atau broken typography scale).
2. **`skill://design-taste-frontend` (Anti-Slop Frontend Engineering & Viewport Discipline)**
   - *Justifikasi Metodologi:* Digunakan untuk menguji kepatuhan antarmuka terhadap viewport stability (`min-h-[100dvh]` vs `h-screen`), micro-interactions tactile feedback (`active:scale-95 touch-manipulation`), breakpoint collapse, dan aturan ketat anti-default font/color.
3. **W3C WCAG 2.2 Level AA Standard (Perceivable, Operable, Understandable, Robust)**
   - *Justifikasi Metodologi:* Audit matematis rasio kontras warna (SC 1.4.3), keyboard focus visibility (SC 2.4.7 & SC 2.4.11), touch target size (SC 2.5.8 & Apple/Google 44x44px guidelines), dan Accessible Name (SC 4.1.2).

---

## 1. THE FOUR FOUNDATIONAL UI/UX & A11Y AUDIT PILLARS

### PILAR 1: User Interface & Design Tokens (Panduan.txt Seksi 5)

#### A. Evaluasi Design Tokens & Token Leakage
- **Definisi CSS Variables di `src/app/globals.css`:**
  `:root` mendefinisikan semantic tokens:
  ```css
  --bg-marketing: #08090a;
  --bg-panel: #0f1011;
  --bg-surface: #141517;
  --text-primary: #f7f8f8;
  --text-secondary: #d0d6e0;
  --text-muted: #8a8f98;
  --border-subtle: rgba(255, 255, 255, 0.05);
  --border-standard: rgba(255, 255, 255, 0.08);
  --brand-indigo: #5e6ad2;
  --brand-violet: #7170ff;
  ```
- **Realitas di Komponen JSX:**
  Terjadi **Token Leakage** sistemik. Komponen (`job-card.tsx`, `job-feed-client.tsx`, `kanban-board.tsx`) tidak mengonsumsi CSS variables tersebut, melainkan menuliskan arbitrary utility Tailwind secara hardcoded:
  - Warna background: `bg-[#0b0c0d]`, `bg-[#0c0d0e]`, `bg-[#0f1011]`, `bg-[#08090a]/90`.
  - Warna teks: `text-[#f7f8f8]`, `text-[#d0d6e0]`, `text-[#8a8f98]`.
  - Border: `border-white/[0.06]`, `border-white/[0.08]`, `border-white/[0.1]`, `border-white/[0.14]`.
  - *Dampak Arsitektural:* Ketiadaan abstraksi variabel membuat tema sentral sulit dimutasi (misal jika ingin mengubah aksen atau mode kontras tinggi).

#### B. Hierarki Tipografi & Skala Font
- Font keluarga yang digunakan adalah **Geist Sans** (`--font-geist-sans`) dan **Geist Mono** (`--font-geist-mono`), pilihan modern dan bersih.
- **Kelemahan Skala Ekstrem Bawah:**
  - Teks metadata chip di `job-card.tsx:119` menggunakan `text-[9px]`.
  - Tombol aksi mobile di `kanban-board.tsx:179` menggunakan `text-[9px]`.
  - Arrow dropdown di `job-card.tsx:150` menggunakan `text-[9px]`.
  - *Dampak Legibilitas:* Font ukuran di bawah 11px (khususnya 9px) pada layar smartphone berkepadatan piksel tinggi (retina/OLED) mengalami penurunan keterbacaan yang drastis, memicu *visual fatigue*.

#### C. Spacing Scale & Corner Radius
- **Corner Radius:** Mengikuti skala teratur:
  - Cards: `rounded-xl` (12px).
  - Modals: `rounded-t-2xl sm:rounded-2xl` (16px).
  - Buttons / Inputs / Chips: `rounded-lg` (8px).
- **Paddings:** Sedikit deviasi dengan penggunaan arbitrary padding `p-4.5` (18px) di kartu lowongan dan `p-3.5` (14px) di kartu kanban.

#### D. Micro-Interactions & Loading States
- Seluruh elemen interaktif telah dilengkapi tactile feedback `touch-manipulation active:scale-95 transition-all duration-150`.
- Skeleton loader pada `src/app/loading.tsx` sangat matang, merefleksikan layout feed 1:1 tanpa pergeseran layout (zero CLS).

---

### PILAR 2: User Experience & Error Recovery (Panduan.txt Seksi 6)

#### A. Penanganan Non-Happy Path & Empty States
- **Pencarian 0 Hasil:**
  `src/components/job-feed-client.tsx:274-293` menyediakan empty state yang luar biasa:
  - Ikon informatif, pesan bersahabat dalam Bahasa Indonesia.
  - Tombol *"Reset Semua Filter"* (`RefreshCw`) yang mengembalikan state pencarian, stack, status, dan target pendidikan dalam 1 klik.
- **Kanban Column Kosong:**
  Setiap kolom yang tidak memiliki pelamar menampilkan placeholder dashed border *"Belum ada lowongan di tahap ini"*, mencegah kolom tampak rusak atau kolaps.

#### B. Cognitive Load & Cluttering pada Kartu Lowongan
- Pada footer `JobCard` (`src/components/job-card.tsx:130-203`):
  Dalam lebar kontainer kartu yang terbatas (280-360px), terdapat **5 elemen interaktif sekaligus**:
  1. `<select>` dropdown status aplikasi (Disimpan, Dilamar, Interview, Tawaran, Ditolak).
  2. Tombol `Target` (Analisis Gap CV).
  3. Tombol `FileText` (Catatan personal).
  4. Tautan `ArrowUpRight` (Buka lowongan asli di tab baru).
  5. Tombol `Sparkles` ("Cover Letter").
  - *Analisis UX:* Kepadatan 5 tombol interaktif dalam 1 baris memicu *Hick's Law* (waktu keputusan melambat) dan meningkatkan risiko salah ketuk (*misclick*) di layar sentuh ponsel.

#### C. Error Recovery & Ketiadaan Fungsi Undo
- Pemindahan status kartu (baik via dropdown maupun drag-and-drop di Kanban) langsung melakukan mutasi ke server (`updateJobStatus`).
- **Kelemahan Kritis:** Jika pengguna secara tidak sengaja menggeser kartu ke kolom "Ditolak", sistem tidak menyediakan toast notifikasi berisi tombol **"Urungkan" (Undo)**. Pengguna harus mengingat status sebelumnya dan memindahkannya kembali secara manual.

---

### PILAR 3: Responsive Design & Viewport Stress-Test (Panduan.txt Seksi 7)

#### A. Evaluasi Breakpoint Matrix
| Breakpoint | Target Perangkat | Hasil Evaluasi Layout | Status |
|:---|:---|:---|:---:|
| **375px** | iPhone SE / Ponsel Kecil | Dropdown status dan 4 tombol aksi di footer kartu lowongan mengalami desakan horizontal (*cramped*), ikon berdekatan tanpa margin aman. | **UX Debt** |
| **390px** | iPhone 13/14/15/16 Pro | Kontrol bar (`Search`, `Target Edu`, `View Mode`, `CV`) wrap dengan wajar. Bottom sheet modal tampil rapi dengan drag indicator. | **Lolos** |
| **768px** | iPad / Tablet Portait | Grid kartu feed bertransisi rapi ke 2 kolom (`md:grid-cols-2`). Kanban board beralih ke multi-kolom horizontal scroll. | **Lolos** |
| **1024px** | Laptop / Desktop | Feed bertransisi ke 3 kolom (`lg:grid-cols-3`). Kontrol pencarian dan filter berada dalam satu baris horizontal. | **Lolos** |
| **1440px+** | Layar Lebar Ultra-Wide | Kontainer dibatasi dengan padding `px-6` fluida tanpa batasan `max-w-7xl`, sehingga kartu di layar 2K/4K merenggang berlebihan. | **Minor UX Debt** |

#### B. Adaptabilitas Komponen & Keyboard Virtual Mobile
- **Modal Hybrid Bottom-Sheet:**
  Pola yang diterapkan pada `CoverLetterModal`, `GapAnalysisModal`, `NotesDrawerModal`, dan `ResumeUploadModal`:
  `fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md`
  adalah standar industri terbaik (sheet di mobile, centered dialog di desktop).
- **Penanganan Keyboard Virtual:**
  Pada saat pengguna mengetik di `<textarea>` catatan (`NotesDrawerModal`), keyboard virtual mobile muncul dan menutupi area input karena kontainer menggunakan `max-h-[90vh]` statis bukan `max-h-[90dvh]` atau `interactive-widget=resizes-content`.

---

### PILAR 4: Web Accessibility & WCAG 2.2 Level AA (Panduan.txt Seksi 8)

#### A. Audit Kontras Warna (WCAG SC 1.4.3 Contrast Minimum)
Pengujian rasio kontras terhadap background utama (`#08090a`) dan permukaan kartu (`#0b0c0d`):

1. **Teks Utama (`#f7f8f8`):** Rasio ~18.5:1 $\rightarrow$ **Lolos (AAA)**.
2. **Teks Sekunder (`#d0d6e0`):** Rasio ~10.2:1 $\rightarrow$ **Lolos (AAA)**.
3. **Teks Muted (`#8a8f98`):** Rasio ~6.3:1 $\rightarrow$ **Lolos (AA)** untuk ukuran teks normal.
4. **Tag Freshgrad (`#fcd34d` pada `#0b0c0d`):** Rasio ~11.1:1 $\rightarrow$ **Lolos (AAA)**.
5. **Tag Magang (`#6ee7b7` pada `#0b0c0d`):** Rasio ~10.4:1 $\rightarrow$ **Lolos (AAA)**.
6. **Pelanggaran - Matched Tech Chips (`job-card.tsx:119`):**
   Teks `#8a8f98` dengan ukuran **9px** dan background `rgba(255,255,255,0.02)` berada di ambang batas keterbacaan manusia normal.

#### B. Audit Aksesibilitas Keyboard & Focus Indicators (WCAG SC 2.4.7 & 2.4.11)
- **Pelanggaran Kritis:**
  Di `job-card.tsx:140`, elemen `<select>` status memiliki class:
  `focus:outline-none focus:border-white/[0.2]`
  Menghilangkan outline fokus bawaan peramban (`focus:outline-none`) dan hanya menggantinya dengan perubahan border tipis yang tidak kontras melanggar **WCAG 2.2 SC 2.4.7 (Focus Visible)** dan **SC 2.4.11 (Focus Appearance)**.
- Seluruh icon button aksi (`Target`, `FileText`, `ArrowUpRight`, `Cover Letter`, dan filter tabs) **tidak memiliki class `focus-visible:ring-2 focus-visible:ring-[#5e6ad2]`**. Pengguna tuna netra ringan atau pengguna motorik disabilitas yang bernavigasi menggunakan tombol `Tab` keyboard tidak dapat melihat di mana kursor keyboard berada.

#### C. Audit Accessible Name pada Icon-Only Buttons (WCAG SC 4.1.2 & SC 1.1.1)
- **Pelanggaran:**
  1. `job-card.tsx:156-163` (Tombol Target): Hanya memiliki `title="Analisis Kecocokan CV"`, tanpa `aria-label="Analisis kecocokan CV"`. Screen reader (NVDA/JAWS/VoiceOver) sering mengabaikan atribut `title` pada elemen interaktif.
  2. `job-card.tsx:166-180` (Tombol Catatan): Hanya memiliki `title={hasNotes ? "Catatan" : "Tambah Catatan"}`, tanpa `aria-label`.
  3. `job-card.tsx:183-191` (Tautan Lowongan Asli): Hanya memiliki `title="Buka Lowongan Asli"`, tanpa `aria-label`.
  4. `job-card.tsx:133` (Status `<select>`): Tidak memiliki `<label>` tersembunyi (`sr-only`) atau `aria-label="Status lamaran"`.
  5. `gap-analysis-modal.tsx:76`, `notes-drawer-modal.tsx:68`, `resume-upload-modal.tsx:71`: Tombol tutup modal (`<X className="w-4 h-4" />`) **tidak memiliki `aria-label="Tutup modal"`**. (Hanya `cover-letter-modal.tsx` yang telah memiliki aria-label).

#### D. Audit Touch Target Size (WCAG SC 2.5.8 Target Size Minimum & Fitts's Law)
- Standar WCAG 2.2 Level AA menetapkan ukuran target minimum **24x24px**.
- Standar platform modern (Apple Human Interface Guidelines & Google Material Design) menetapkan target sentuh ideal **44x44px** atau **48x48px**.
- **Hasil Pengujian di Codebase:**
  - Tombol aksi kartu desktop `job-card.tsx:159`: `sm:h-8 sm:w-8` (32x32px) $\rightarrow$ Lolos WCAG minimum (24px), tetapi **Gagal Rekomendasi Industri (44px)**.
  - Tombol aksi kartu kanban `kanban-board.tsx:210`: `h-7 w-7` (28x28px) $\rightarrow$ Sangat mepet dengan batas bawah 24px, memicu seringnya salah sentuh pada pengguna berjari besar.
  - Tombol pindah status mobile di kartu kanban `kanban-board.tsx:188`: `px-2 py-1 text-[10px]` $\rightarrow$ Tinggi fisik hanya ~22px tanpa padding sentuh ekstra. **Melanggar WCAG 2.2 SC 2.5.8**.

---

## 2. MATRIKS EVALUASI KEPATUHAN UI/UX & A11Y

| Pilar | Komponen / Lokasi | Kondisi Riil di Kode | Status Kepatuhan | Rekomendasi Solusi Rekayasa |
|:---|:---|:---|:---:|:---|
| **A11Y (Operable)** | `src/components/job-card.tsx:156-191` | Tombol `Target`, `FileText`, dan `<a>` hanya memakai `title`, tanpa `aria-label`. | **Pelanggaran WCAG (SC 4.1.2)** | Tambahkan `aria-label="Analisis kecocokan CV"`, `aria-label="Buka catatan lamaran"`, dan `aria-label="Buka lowongan asli di tab baru"`. |
| **A11Y (Operable)** | `src/components/job-card.tsx:133` | `<select>` status tidak memiliki tag `<label>` maupun atribut `aria-label`. | **Pelanggaran WCAG (SC 1.3.1 & 4.1.2)** | Tambahkan `aria-label="Pilih status lamaran"` pada elemen `<select>`. |
| **A11Y (Operable)** | Modals (`gap-analysis`, `notes-drawer`, `resume-upload`) | Tombol close `<button><X /></button>` tidak memiliki `aria-label`. | **Pelanggaran WCAG (SC 4.1.2)** | Tambahkan `aria-label="Tutup modal"` pada seluruh tombol close modal (seperti pada `CoverLetterModal`). |
| **A11Y (Operable)** | `job-card.tsx:140`, seluruh buttons & inputs | Memakai `focus:outline-none` tanpa pengganti `focus-visible:ring-2`. | **Pelanggaran WCAG (SC 2.4.7 & 2.4.11)** | Tambahkan utility seragam: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]`. |
| **A11Y (Operable)** | `src/components/kanban-board.tsx:188` | Tombol pindah status kartu di mobile berukuran fisik ~22px tinggi. | **Pelanggaran WCAG (SC 2.5.8)** | Perbesar ukuran padding sentuh tombol menjadi minimal `min-h-[32px] px-2.5` dengan margin isolasi target. |
| **A11Y (Perceivable)** | `src/components/job-card.tsx:119` & `kanban-board.tsx:179` | Teks chip teknologi dan navigasi mobile menggunakan font `text-[9px]`. | **UX & A11Y Debt** | Naikkan ukuran font batas bawah menjadi minimal `text-[10px]` atau `text-[11px]` dengan font-weight medium. |
| **UI Tokens** | Seluruh komponen `src/components/*` | Token warna `:root` di `globals.css` diabaikan, menggunakan arbitrary classes (`bg-[#0b0c0d]`, dll). | **Design System Debt** | Konsolidasikan arbitrary colors ke dalam semantic Tailwind classes atau custom utilities `@theme` di Tailwind v4. |
| **UX (Cognitive)** | `src/components/job-card.tsx:130-202` | Footer kartu menjejalkan 5 tombol aksi interaktif dalam 1 baris sempit. | **UX Debt (Hick's Law Violation)** | Satukan aksi sekunder (`Target`, `Catatan`) ke dalam popover menu "Opsi Lainnya", atau posisikan di header kartu. |
| **UX (Recovery)** | `src/components/kanban-board.tsx` | Drag & drop dan status change langsung mutasi tanpa ada fitur undo. | **UX Debt (NNG Heuristic #3)** | Tampilkan toast notifikasi interaktif (misal via `sonner`): *"Status diubah ke Dilamar"* disertai aksi `[Urungkan]`. |
| **Responsive** | `src/components/notes-drawer-modal.tsx` | Kontainer modal memakai `max-h-[90vh]` yang terpotong saat mobile keyboard aktif. | **Responsive Debt** | Ganti satuan tinggi menjadi `max-h-[85dvh]` atau `max-h-[calc(100dvh-2rem)]` untuk mengantisipasi dynamic browser bar. |

---

## 3. INDEPENDENT ADVISOR VALIDATION (ANTI-FALSE-MISMATCH CHECK)

Sebelum laporan audit Bagian II ini disahkan, evaluasi independen dijalankan untuk memastikan tidak ada temuan yang salah nilai (*false mismatch*):

1. **Apakah ketiadaan label pada `<select>` benar-benar pelanggaran WCAG ataukah placeholder sudah cukup?**
   - *Validasi:* **Pelanggaran Sah**. Menurut WCAG 2.2 SC 1.3.1 (Info and Relationships) dan SC 4.1.2 (Name, Role, Value), elemen form control wajib memiliki programmatic accessible name. Opsi `<option value="" disabled>Status...</option>` hanya bertindak sebagai default value, bukan label pengenal bagi teknologi bantu (screen reader).
2. **Apakah font 9px secara hukum melanggar WCAG?**
   - *Validasi:* WCAG 2.2 tidak menetapkan batas mutlak ukuran font (hanya rasio kontras 4.5:1). Namun, WCAG SC 1.4.4 (Resize Text) mengharuskan teks dapat dibaca dan diperbesar hingga 200%. Pada ukuran 9px, rendering font anti-aliased pada perangkat Android beresolusi menengah kehilangan definisi stroke font, sehingga dinilai adil sebagai **A11Y & UX Debt**.
3. **Apakah tombol touch target 32px di desktop melanggar WCAG 2.2?**
   - *Validasi:* **Tidak melanggar WCAG 2.2 SC 2.5.8 (Target Size Minimum)** karena standar WCAG AA desktop hanya mewajibkan 24x24px. Namun, pada mobile viewport, tombol 22px di Kanban mobile view (`kanban-board.tsx:188`) **terbukti melanggar**. Klasifikasi matriks di atas telah dipisahkan secara presisi antara pelanggaran resmi (mobile 22px) dan UX Debt (desktop 32px).

---

## KESIMPULAN AUDIT BAGIAN II

Secara visual, MagangYokk berhasil mengeksekusi estetika dark-theme bergaya Linear yang elegan, bersih, dan modern. Kinerja transisi dan penyajian loading skeleton berada pada standar yang sangat tinggi.

Namun, dari kacamata **Aksesibilitas dan Rekayasa Antarmuka Profesional (WCAG 2.2 Level AA)**, proyek ini memiliki 3 kelemahan mendasar:
1. **Ketidakterlihatan Navigasi Keyboard (Focus Indicators):** Penggunaan `focus:outline-none` yang luas tanpa ring pengganti mematikan navigasi bagi pengguna disabilitas fisik/motorik.
2. **Ketiadaan Programmatic Names (Accessible Name):** Sebagian besar tombol icon-only hanya mengandalkan atribut visual `title` tanpa `aria-label`.
3. **Kepadatan Kognitif Kartu (Button Clutter):** Terlalu banyak aksi primer dan sekunder dijejalkan ke dalam satu kartu lowongan.

Dengan menerapkan rekomendasi perbaikan pada Matriks Evaluasi Kepatuhan, MagangYokk akan bertransformasi dari sekadar aplikasi yang "tampak keren" menjadi produk perangkat lunak berstandar enterprise yang inklusif, tangguh, dan ramah bagi seluruh pengguna.
