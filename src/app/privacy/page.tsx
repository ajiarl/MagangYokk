import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, Lock, Cpu, Database, Eye, FileText, UserCheck, HelpCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Kebijakan Privasi | MagangYokk",
  description: "Kebijakan Privasi MagangYokk sesuai Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022).",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] antialiased selection:bg-[#5e6ad2]/30 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08090a]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#8a8f98] hover:text-[#f7f8f8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-[#8a8f98]">UU PDP Terverifikasi</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="space-y-3 mb-10 pb-8 border-b border-white/[0.06]">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 text-[#5e6ad2] text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kepatuhan Regulasi Indonesia</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Kebijakan Privasi & Perlindungan Data
          </h1>
          <p className="text-sm text-[#8a8f98] leading-relaxed max-w-2xl">
            MagangYokk berkomitmen melindungi privasi mahasiswa dan pencari magang. Kebijakan ini disusun berdasarkan
            Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
          </p>
          <div className="pt-2 text-[11px] font-mono text-[#62666d]">
            Pembaruan Terakhir: 1 Maret 2025 • Berlaku Efektif untuk Seluruh Pengguna
          </div>
        </div>

        {/* 8 Articles */}
        <div className="space-y-8 text-sm leading-relaxed text-[#d0d6e0]">
          {/* Pasal 1 */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-[#5e6ad2]/10 text-[#5e6ad2]">
                <UserCheck className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">1. Identitas Pengendali Data Pribadi</h2>
            </div>
            <p className="text-[#8a8f98]">
              Pengendali Data Pribadi untuk platform ini adalah tim pengembang MagangYokk (&ldquo;kami&rdquo;), beralamat operasional di Jakarta, Indonesia. Kami bertindak sebagai Pengendali Data Pribadi yang menentukan tujuan dan melakukan kendali pemrosesan data sesuai ketentuan Pasal 20 UU PDP.
            </p>
          </section>

          {/* Pasal 2 */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-indigo-400/10 text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">2. Jenis Data Pribadi yang Diproses</h2>
            </div>
            <p className="text-[#8a8f98]">
              Kami hanya memproses data spesifik yang Anda serahkan secara sadar saat mengunggah resume (CV) atau mengonfigurasi profil:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[#8a8f98] ml-2">
              <li>Identitas Umum: Nama lengkap, alamat email, tautan portofolio, dan profil GitHub.</li>
              <li>Riwayat Akademik dan Karir: Nama universitas/sekolah, jurusan, tahun kelulusan, dan pengalaman proyek.</li>
              <li>Keahlian Teknis (Skills): Bahasa pemrograman, framework, database, dan tools yang diekstrak dari dokumen PDF.</li>
              <li>Catatan Lamaran: Status tahapan rekrutmen dan catatan pribadi yang Anda simpan di papan pelacak.</li>
            </ul>
          </section>

          {/* Pasal 3 */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400">
                <Eye className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">3. Tujuan dan Dasar Hukum Pemrosesan Data</h2>
            </div>
            <p className="text-[#8a8f98]">
              Data pribadi Anda diproses secara sah berdasarkan persetujuan eksplisit Anda (Pasal 22 UU PDP) untuk tujuan:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[#8a8f98] ml-2">
              <li>Menghitung kecocokan skor keahlian Anda dengan persyaratan lowongan magang (Match Score).</li>
              <li>Melakukan audit kesenjangan keahlian (Gap Analysis) untuk memberikan rekomendasi pembelajaran.</li>
              <li>Menghasilkan draf surat lamaran personal (Cover Letter) yang relevan dengan posisi yang dituju.</li>
              <li>Mempertahankan status pelacakan lamaran kerja Anda secara privat.</li>
            </ul>
          </section>

          {/* Pasal 4 */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400">
                <Cpu className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">4. Pemrosesan Kecerdasan Buatan (AI) & Transfer Data Lintas Batas</h2>
            </div>
            <p className="text-[#8a8f98]">
              Sesuai Pasal 56 UU PDP mengenai transfer data ke luar wilayah Indonesia:
            </p>
            <div className="space-y-2 text-xs text-[#8a8f98]">
              <p>
                Platform kami memanfaatkan antarmuka pemrograman aplikasi (API) pihak ketiga, yaitu Groq Cloud Inc. (berlokasi di Amerika Serikat), untuk menjalankan model bahasa besar Llama 3.3 70B secara aman.
              </p>
              <p>
                Kutipan teks kualifikasi Anda hanya dikirimkan secara sementara sebagai input prompt inferensi (zero data retention policy dari provider AI) dan <strong className="text-white">tidak pernah digunakan</strong> untuk melatih model publik kecerdasan buatan.
              </p>
            </div>
          </section>

          {/* Pasal 5 */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-cyan-400/10 text-cyan-400">
                <Database className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">5. Masa Retensi dan Penyimpanan Data</h2>
            </div>
            <p className="text-[#8a8f98]">
              Data profil dan ringkasan resume disimpan dalam klaster basis data terenkripsi PostgreSQL di Supabase. Kami menyimpan data selama akun Anda aktif atau sampai Anda meminta penghapusan profil secara menyeluruh. Dokumen fisik PDF yang Anda unggah diproses langsung di memori server dan tidak disimpan sebagai berkas biner permanen di storage server.
            </p>
          </section>

          {/* Pasal 6 */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-purple-400/10 text-purple-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">6. Hak Subjek Data Pribadi (Pemilik Data)</h2>
            </div>
            <p className="text-[#8a8f98]">
              Berdasarkan Bab IV UU PDP, Anda memiliki hak-hak yang dilindungi hukum:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[#8a8f98] ml-2">
              <li>Hak Mendapatkan Informasi: Mengetahui kejelasan identitas pengendali dan tujuan penggunaan data.</li>
              <li>Hak Akses dan Pembaruan: Memperbarui atau melengkapi profil keahlian Anda sewaktu-waktu.</li>
              <li>Hak Penghapusan (Right to be Forgotten): Meminta penghapusan permanen atas riwayat resume dan catatan lamaran Anda.</li>
              <li>Hak Menarik Persetujuan: Membatalkan persetujuan pemrosesan AI kapan saja melalui antarmuka sistem.</li>
            </ul>
          </section>

          {/* Pasal 7 */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-rose-400/10 text-rose-400">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">7. Keamanan Informasi dan Integritas Dokumen</h2>
            </div>
            <p className="text-[#8a8f98]">
              Kami menerapkan standar keamanan teknis berlapis guna mencegah kebocoran data:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[#8a8f98] ml-2">
              <li>Enkripsi data dalam transmisi menggunakan protokol Transport Layer Security (TLS 1.3 / HTTPS).</li>
              <li>Validasi Magic Bytes (%PDF) pada level biner untuk menolak dokumen mencurigakan atau berbahaya.</li>
              <li>Isolasi server-side execution dengan proteksi token internal dan pemblokiran akses browser langsung ke basis data.</li>
              <li>Rate limiting per alamat IP guna mencegah serangan brute force dan scraping data pengguna.</li>
            </ul>
          </section>

          {/* Pasal 8 */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-blue-400/10 text-blue-400">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">8. Saluran Kontak & Pengaduan Privasi</h2>
            </div>
            <p className="text-[#8a8f98]">
              Jika Anda memiliki pertanyaan mengenai pemrosesan data pribadi, ingin menjalankan hak subjek data, atau hendak menyampaikan pengaduan terkait privasi, hubungi kami melalui surel resmi pengembang di:
            </p>
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs text-[#5e6ad2]">
              privacy@magangyokk.id
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
