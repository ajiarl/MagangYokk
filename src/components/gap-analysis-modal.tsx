"use client"

import { useState } from "react"
import { X, Sparkles, AlertCircle, CheckCircle2, TrendingUp, Lightbulb, Loader2, Target } from "lucide-react"

interface GapAnalysisData {
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  keyStrengths: string[]
  growthAdvice: string
  verdict: string
}

interface GapAnalysisModalProps {
  jobId: string
  jobTitle: string
  company: string
  isOpen: boolean
  onClose: () => void
}

export function GapAnalysisModal({
  jobId,
  jobTitle,
  company,
  isOpen,
  onClose
}: GapAnalysisModalProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<GapAnalysisData | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/resume/analyze-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || "Gagal memproses analisis.")
      }
      setData(result.analysis)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] bg-[#0c0d0e] border-t sm:border border-white/[0.1] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-white/[0.06] flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
              <Target className="w-3.5 h-3.5" />
              <span>Analisis Kecocokan CV & Skill Gap</span>
            </div>
            <h3 className="text-sm font-semibold text-white line-clamp-1">{jobTitle}</h3>
            <p className="text-xs text-[#8a8f98]">{company}</p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-lg text-[#8a8f98] hover:text-white hover:bg-white/[0.05] transition-colors touch-manipulation active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 pr-2">
          {!data && !loading && (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-xs text-[#8a8f98] max-w-sm mx-auto">
                Bandingkan profil & riwayat keahlianmu dengan kualifikasi lowongan ini secara objektif dan jujur.
              </p>
              <button
                onClick={handleAnalyze}
                className="h-9 px-4 inline-flex items-center justify-center rounded-xl text-xs font-mono font-medium bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow-sm active:scale-95 touch-manipulation"
              >
                Mulai Analisis Kecocokan
              </button>
            </div>
          )}

          {loading && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
              <p className="text-xs text-[#8a8f98] font-mono">
                Membedah deskripsi loker vs profil kandidat...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {data && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Score Bar & Verdict */}
              <div className="p-4 rounded-xl bg-[#141517] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-[#8a8f98]">Skor Kecocokan Riil</div>
                  <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-1">
                    <span>{data.matchScore}</span>
                    <span className="text-xs text-[#8a8f98]">/100</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {data.verdict}
                  </span>
                </div>
              </div>

              {/* Matched Skills */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Skill yang Cocok ({data.matchedSkills?.length || 0}):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.matchedSkills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills / Gap */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Skill yang Belum Tercantum / Perlu Dipelajari:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.missingSkills && data.missingSkills.length > 0 ? (
                    data.missingSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#8a8f98] italic font-mono">
                      Tidak ada kesenjangan skill kritikal. Kualifikasimu sangat lengkap!
                    </span>
                  )}
                </div>
              </div>

              {/* Key Strengths */}
              <div className="p-3.5 rounded-xl bg-[#08090a] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#5e6ad2]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Kelebihan Utamamu untuk Posisi Ini:</span>
                </div>
                <ul className="text-xs text-[#d0d6e0] space-y-1 list-disc list-inside">
                  {data.keyStrengths?.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              {/* Advice */}
              <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/15 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-blue-400">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Saran Persiapan Interview:</span>
                </div>
                <p className="text-xs text-[#d0d6e0] leading-relaxed">
                  {data.growthAdvice}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-white/[0.06] bg-[#08090a] flex items-center justify-between shrink-0 text-[11px] font-mono text-[#8a8f98]">
          <span>Grounded ke Profil Aji di Supabase</span>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 inline-flex items-center justify-center rounded-lg text-xs font-mono text-[#8a8f98] hover:text-white hover:bg-white/[0.05] transition-colors touch-manipulation active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
