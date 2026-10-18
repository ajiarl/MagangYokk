import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, BookOpen, AlertTriangle, Sparkles, ShieldAlert, Scale } from "lucide-react"

export const metadata: Metadata = {
  title: "Syarat & Ketentuan Layanan",
  description: "Syarat dan Ketentuan Penggunaan Platform MagangYokk bagi mahasiswa dan pencari magang.",
  alternates: {
    canonical: "/terms",
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] antialiased selection:bg-[#5e6ad2]/30 selection:text-white">
      {/* Header */}
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
            <span className="w-2 h-2 rounded-full bg-[#5e6ad2]" />
            <span className="text-[11px] font-mono text-[#8a8f98]">Ketentuan Resmi</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="space-y-3 mb-10 pb-8 border-b border-white/[0.06]">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 text-[#5e6ad2] text-xs font-mono">
            <Scale className="w-3.5 h-3.5" />
            <span>Perjanjian Pengguna</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Syarat & Ketentuan Layanan
          </h1>
          <p className="text-sm text-[#8a8f98] leading-relaxed max-w-2xl">
            Selamat datang di MagangYokk. Harap membaca ketentuan ini secara seksama sebelum menggunakan fitur kurasi
            lowongan, analisis profil, atau pembuatan surat lamaran berbasis AI.
          </p>
          <div className="pt-2 text-[11px] font-mono text-[#62666d]">
            Pembaruan Terakhir: 1 Maret 2025 • Berlaku untuk Seluruh Pengunjung dan Pengguna
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-[#d0d6e0]">
          {/* Bagian 1 */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-[#5e6ad2]/10 text-[#5e6ad2]">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">1. Penerimaan Ketentuan</h2>
            </div>
            <p className="text-[#8a8f98]">
              Dengan mengakses dan menggunakan situs web MagangYokk, Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat oleh Syarat dan Ketentuan ini serta Kebijakan Privasi kami. Jika Anda tidak menyetujui salah satu poin di sini, mohon untuk tidak melanjutkan penggunaan layanan.
            </p>
          </section>

          {/* Bagian 2 */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">2. Batasan Tanggung Jawab atas Informasi Pihak Ketiga</h2>
            </div>
            <p className="text-[#8a8f98]">
              MagangYokk bertindak sebagai agregator informasi lowongan kerja dan magang dari platform publik eksternal (termasuk LinkedIn dan Indeed).
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[#8a8f98] ml-2">
              <li>Kami tidak menjamin ketersediaan lowongan, keakuratan tenggat waktu, atau kebenaran informasi yang dipublikasikan oleh pihak ketiga.</li>
              <li>Proses lamaran kerja, wawancara, dan keputusan penerimaan sepenuhnya merupakan hubungan antara pelamar dan perusahaan perekrut.</li>
              <li>Waspadai segala bentuk penipuan yang meminta biaya transfer dalam proses seleksi magang. MagangYokk tidak pernah memungut biaya perekrutan.</li>
            </ul>
          </section>

          {/* Bagian 3 */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-indigo-400/10 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">3. Pedoman Etika Penggunaan Kecerdasan Buatan (AI)</h2>
            </div>
            <p className="text-[#8a8f98]">
              Fitur pembuatan surat lamaran (Cover Letter Generator) dan analisis kesenjangan skill disediakan sebagai asisten pembantu, bukan pengganti integritas pribadi Anda:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[#8a8f98] ml-2">
              <li>Draf surat lamaran wajib diperiksa dan disesuaikan kembali dengan fakta kualifikasi asli Anda sebelum dikirimkan ke perusahaan.</li>
              <li>Pengguna dilarang mengklaim pengalaman kerja fiktif atau keahlian palsu yang diusulkan oleh model generatif.</li>
              <li>Pengguna bertanggung jawab penuh atas segala isi materi dan dokumen yang diserahkan kepada rekruter.</li>
            </ul>
          </section>

          {/* Bagian 4 */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-rose-400/10 text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">4. Ketertiban & Batasan Kuota Akses</h2>
            </div>
            <p className="text-[#8a8f98]">
              Untuk menjaga ketersediaan layanan bersama, kami menerapkan batasan laju permintaan (rate limiting) secara ketat:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[#8a8f98] ml-2">
              <li>Dilarang melakukan serangan penolakan layanan (Denial of Service), flooding request, atau penetrasi otomatis terhadap endpoint API kami.</li>
              <li>Dilarang mengunggah file berbahaya, skrip injeksi, atau berkas selain format PDF standar yang sah.</li>
              <li>Kami berhak memblokir alamat IP yang terbukti menyalahgunakan kuota API pihak ketiga atau merusak integritas basis data.</li>
            </ul>
          </section>

          {/* Bagian 5 */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400">
                <Scale className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">5. Pembaruan dan Yurisdiksi Hukum</h2>
            </div>
            <p className="text-[#8a8f98]">
              Syarat & Ketentuan ini tunduk dan ditafsirkan berdasarkan hukum Republik Indonesia. Setiap perselisihan yang timbul akan diupayakan diselesaikan melalui musyawarah untuk mufakat terlebih dahulu sebelum menempuh jalur hukum formal.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
