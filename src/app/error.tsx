"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("MagangYokk App Router Error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex flex-col items-center justify-center p-6 antialiased">
      <div className="w-full max-w-md bg-[#0c0d0e] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Terjadi Kendala Memuat Data
          </h2>
          <p className="text-xs text-[#8a8f98] leading-relaxed">
            Kami mengalami kendala saat memuat data lowongan magang atau menghubungkan ke server. Silakan coba kembali beberapa saat lagi.
          </p>
        </div>

        <div className="p-3 bg-[#08090a] border border-white/[0.05] rounded-lg">
          <p className="font-mono text-[11px] text-[#8a8f98] truncate">
            ID Insiden: {error.digest || "ERR_SSR_FAILURE"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto h-9 px-4 inline-flex items-center justify-center gap-2 bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-xs font-medium rounded-lg transition-colors touch-manipulation active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto h-9 px-4 inline-flex items-center justify-center gap-2 border border-white/[0.08] hover:bg-white/[0.04] text-[#d0d6e0] text-xs font-medium rounded-lg transition-colors touch-manipulation active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
