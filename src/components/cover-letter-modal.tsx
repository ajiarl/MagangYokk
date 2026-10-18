"use client"

import { useState, useEffect, useCallback } from "react"
import { Job, ApplicationStatus } from "@/lib/types"
import { X, Loader2, Copy, Check, RotateCcw } from "lucide-react"

export interface CoverLetterModalProps {
  job: (Job & { applicationStatus?: ApplicationStatus | null }) | null
  isOpen: boolean
  onClose: () => void
  onStatusChange?: (jobId: string, status: ApplicationStatus) => void
}

export function CoverLetterModal({
  job,
  isOpen,
  onClose,
  onStatusChange
}: CoverLetterModalProps) {
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [lang, setLang] = useState<"id" | "en">("id")

  const generateCoverLetter = useCallback(
    async (targetJob: Job, selectedLang: "id" | "en", regenerate = false) => {
      setLoading(true)
      setDraft(null)
      setCopied(false)
      setLang(selectedLang)
      try {
        const res = await fetch("/api/cover-letter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: targetJob.id, lang: selectedLang, regenerate })
        })
        const data = (await res.json()) as { draft?: string; error?: string }
        if (data.draft) {
          setDraft(data.draft)
          if (!("applicationStatus" in targetJob && targetJob.applicationStatus) && onStatusChange) {
            onStatusChange(targetJob.id, "saved")
          }
        } else {
          alert(data.error || "Gagal generate cover letter")
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        alert("Error: " + message)
      } finally {
        setLoading(false)
      }
    },
    [onStatusChange]
  )

  useEffect(() => {
    let ignore = false
    if (!isOpen || !job) {
      return
    }

    fetch("/api/cover-letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, lang: "id" })
    })
      .then((res) => res.json())
      .then((data: { draft?: string; error?: string }) => {
        if (ignore) return
        if (data.draft) {
          setDraft(data.draft)
          if (!("applicationStatus" in job && job.applicationStatus) && onStatusChange) {
            onStatusChange(job.id, "saved")
          }
        } else {
          alert(data.error || "Gagal generate cover letter")
        }
      })
      .catch((err: unknown) => {
        if (ignore) return
        const message = err instanceof Error ? err.message : String(err)
        alert("Error: " + message)
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [isOpen, job, onStatusChange])

  function handleCopy() {
    if (!draft) return
    navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen || !job) {
    return null
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[85dvh] sm:max-h-[85dvh] bg-[#0c0d0e] border-t sm:border border-white/[0.1] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        {/* Mobile Drag Handle Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-semibold text-sm text-white">Cover Letter Drafter</h3>
            <p className="text-xs text-[#8a8f98] mt-0.5 line-clamp-1">
              {job.title} • {job.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-lg text-[#8a8f98] hover:text-white hover:bg-white/[0.05] transition-colors touch-manipulation active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
            aria-label="Tutup modal cover letter"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language Switcher */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#08090a] border-b border-white/[0.05] flex items-center justify-between text-xs shrink-0">
          <span className="text-[#8a8f98] text-[11px] font-mono">Bahasa Draft:</span>
          <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.06]">
            <button
              disabled={loading}
              onClick={() => generateCoverLetter(job, "id")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all touch-manipulation active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-1 focus-visible:ring-offset-[#08090a] ${
                lang === "id"
                  ? "bg-[#5e6ad2] text-white shadow-sm"
                  : "text-[#8a8f98] hover:text-[#d0d6e0]"
              }`}
            >
              Bahasa Indonesia
            </button>
            <button
              disabled={loading}
              onClick={() => generateCoverLetter(job, "en")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all touch-manipulation active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-1 focus-visible:ring-offset-[#08090a] ${
                lang === "en"
                  ? "bg-[#5e6ad2] text-white shadow-sm"
                  : "text-[#8a8f98] hover:text-[#d0d6e0]"
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Text Preview Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#7170ff]" />
              <p className="text-xs text-[#8a8f98]">Menyusun draf autentik berbasis profil kamu...</p>
            </div>
          ) : draft ? (
            <div className="bg-[#08090a] p-4 sm:p-5 rounded-xl border border-white/[0.06] text-xs font-mono leading-relaxed whitespace-pre-wrap text-[#d0d6e0] selection:bg-[#5e6ad2]/30">
              {draft}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-[#8a8f98]">
              Pilih bahasa di atas untuk memuat draf surat.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-white/[0.06] bg-[#08090a] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#8a8f98] font-mono hidden sm:inline">
            Otomatis tersimpan ke status lamaran
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              disabled={!draft || loading}
              onClick={() => generateCoverLetter(job, lang, true)}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-[#d0d6e0] font-medium rounded-lg transition-colors touch-manipulation active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
              title="Buat ulang draf baru dengan AI (bypass cache)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Buat Ulang</span>
            </button>
            <button
              disabled={!draft || loading}
              onClick={handleCopy}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-[#d0d6e0] font-medium rounded-lg transition-colors touch-manipulation active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Tersalin!" : "Salin Surat"}</span>
            </button>
            <button
              onClick={onClose}
              className="h-9 px-4 inline-flex items-center bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-xs font-medium rounded-lg transition-colors touch-manipulation active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
