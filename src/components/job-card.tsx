"use client"

import { useState, useTransition } from "react"
import { Job, ApplicationStatus } from "@/lib/types"
import { ExternalLink, Sparkles, Building2, FileText, Check, Copy, Loader2, X, MapPin, ArrowUpRight } from "lucide-react"
import { updateJobStatus } from "@/app/actions"

interface JobCardProps {
  job: Job
  initialStatus?: ApplicationStatus | null
  onStatusChange?: (status: ApplicationStatus) => void
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; dot: string; text: string }> = {
  saved: { label: "Saved", dot: "bg-zinc-400", text: "text-zinc-300" },
  applied: { label: "Applied", dot: "bg-blue-400", text: "text-blue-300" },
  interview: { label: "Interview", dot: "bg-purple-400", text: "text-purple-300" },
  offered: { label: "Offered 🎉", dot: "bg-emerald-400", text: "text-emerald-300" },
  rejected: { label: "Rejected", dot: "bg-rose-400", text: "text-rose-400" }
}

export function JobCard({ job, initialStatus, onStatusChange }: JobCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [lang, setLang] = useState<"id" | "en">("id")

  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus | null>(initialStatus || null)
  const [isPending, startTransition] = useTransition()

  const score = job.score ? Number(job.score).toFixed(1) : null

  async function handleStatusChange(newStatus: ApplicationStatus) {
    setCurrentStatus(newStatus)
    if (onStatusChange) {
      onStatusChange(newStatus)
    } else {
      startTransition(async () => {
        const res = await updateJobStatus(job.id, newStatus)
        if (!res.success) alert("Gagal update status: " + res.error)
      })
    }
  }

  async function handleGenerate(selectedLang: "id" | "en") {
    setLoading(true)
    setLang(selectedLang)
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, lang: selectedLang })
      })
      const data = await res.json()
      if (data.draft) {
        setDraft(data.draft)
        if (!currentStatus) setCurrentStatus("saved")
      } else {
        alert(data.error || "Gagal generate cover letter")
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!draft) return
    navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="group relative rounded-xl bg-[#0f1011] border border-white/[0.06] hover:border-white/[0.14] transition-all duration-200 flex flex-col justify-between p-5 hover:bg-[#141517]/90 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5">
        
        {/* Top bar: Title, Company, Score */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 pr-2">
              <h4 className="font-medium text-sm text-[#f7f8f8] group-hover:text-white transition-colors leading-snug line-clamp-1">
                {job.title}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-[#8a8f98]">
                <Building2 className="w-3.5 h-3.5 text-[#62666d]" />
                <span className="font-normal">{job.company}</span>
              </div>
            </div>

            {score && (
              <div className="shrink-0 flex items-center gap-1 bg-[#5e6ad2]/10 border border-[#5e6ad2]/25 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium text-[#7170ff]">
                <Sparkles className="w-3 h-3" />
                <span>{score}</span>
              </div>
            )}
          </div>

          {/* Badges: Location, Source, & Edu Target */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {/* Edu Target Tag */}
            {(() => {
              const text = `${job.title} ${job.description || ""}`.toLowerCase()
              const isIntern = text.includes("intern") || text.includes("magang") || text.includes("pkl") || text.includes("mahasiswa")
              const isGrad = text.includes("fresh graduate") || text.includes("sarjana") || text.includes("s1") || text.includes("d3")
              
              if (isIntern && !isGrad) {
                return (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono border bg-emerald-500/10 text-emerald-300 border-emerald-500/25">
                    Magang Mahasiswa
                  </span>
                )
              }
              return (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono border bg-amber-500/10 text-amber-300 border-amber-500/25">
                  Fresh Graduate / Wisuda
                </span>
              )
            })()}

            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-mono border ${
              job.is_remote
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-white/[0.03] text-[#8a8f98] border-white/[0.06]"
            }`}>
              <MapPin className="w-2.5 h-2.5" />
              {job.is_remote ? "Remote" : job.location || "On-site"}
            </span>

            {job.is_paid !== null && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono border ${
                job.is_paid
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-white/[0.02] text-[#62666d] border-white/[0.05]"
              }`}>
                {job.is_paid ? "Paid" : "Unpaid"}
              </span>
            )}

            <span className="text-[10px] uppercase font-mono tracking-wider text-[#62666d] ml-auto">
              {job.source}
            </span>
          </div>

          {/* Snippet Description */}
          {job.description && (
            <p className="text-xs text-[#8a8f98] leading-relaxed line-clamp-2 font-normal pt-1">
              {job.description}
            </p>
          )}

          {/* Matched Tech Chips */}
          {job.score_breakdown && (
            <div className="flex flex-wrap gap-1 pt-1.5">
              {Object.entries(job.score_breakdown).map(([skill, matched]) =>
                matched ? (
                  <span
                    key={skill}
                    className="bg-white/[0.03] text-[#d0d6e0] border border-white/[0.06] text-[10px] px-2 py-0.5 rounded font-mono"
                  >
                    {skill.replace("_", " ")}
                  </span>
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Footer: Status select & Actions */}
        <div className="mt-5 pt-3.5 border-t border-white/[0.05] flex items-center justify-between gap-2">
          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={currentStatus || ""}
              onChange={(e) => {
                const val = e.target.value as ApplicationStatus
                if (val) handleStatusChange(val)
              }}
              disabled={isPending}
              className="appearance-none bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs text-[#d0d6e0] rounded-md px-2.5 py-1.5 pr-6 cursor-pointer focus:outline-none focus:border-[#5e6ad2] transition-colors"
            >
              <option value="" disabled className="bg-[#0f1011] text-[#8a8f98]">Status...</option>
              <option value="saved" className="bg-[#0f1011]">Saved</option>
              <option value="applied" className="bg-[#0f1011]">Applied</option>
              <option value="interview" className="bg-[#0f1011]">Interview</option>
              <option value="offered" className="bg-[#0f1011]">Offered 🎉</option>
              <option value="rejected" className="bg-[#0f1011]">Rejected</option>
            </select>
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#62666d] text-[10px]">
              ▾
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-md text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-white/[0.05] transition-colors"
              title="Buka Lowongan Asli"
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <button
              onClick={() => {
                setIsOpen(true)
                if (!draft) handleGenerate("id")
              }}
              className="inline-flex items-center gap-1.5 bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-xs font-medium px-3 py-1.5 rounded-md transition-all shadow-sm active:scale-[0.98]"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cover Letter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up Modal: Linear Dark Style */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f1011] rounded-2xl border border-white/[0.1] shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm text-[#f7f8f8]">Cover Letter Drafter</h3>
                <p className="text-xs text-[#8a8f98] mt-0.5">{job.title} — {job.company}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Switcher */}
            <div className="px-5 py-2.5 bg-[#08090a] border-b border-white/[0.05] flex items-center justify-between text-xs">
              <span className="text-[#8a8f98] text-[11px]">Bahasa Draft:</span>
              <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.06]">
                <button
                  disabled={loading}
                  onClick={() => handleGenerate("id")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    lang === "id"
                      ? "bg-[#5e6ad2] text-white shadow-sm"
                      : "text-[#8a8f98] hover:text-[#d0d6e0]"
                  }`}
                >
                  Bahasa Indonesia
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleGenerate("en")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
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
            <div className="p-5 flex-1 overflow-y-auto">
              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#7170ff]" />
                  <p className="text-xs text-[#8a8f98]">Menyusun draf autentik berbasis profil kamu...</p>
                </div>
              ) : draft ? (
                <div className="bg-[#08090a] p-5 rounded-xl border border-white/[0.06] text-xs font-mono leading-relaxed whitespace-pre-wrap text-[#d0d6e0] selection:bg-[#5e6ad2]/30">
                  {draft}
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-[#8a8f98]">
                  Pilih bahasa di atas untuk memuat draf surat.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-5 border-t border-white/[0.06] bg-[#0c0d0e] flex items-center justify-between">
              <span className="text-[11px] text-[#62666d] font-mono">
                Auto-saved to applications
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={!draft || loading}
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-[#d0d6e0] font-medium px-3.5 py-1.5 rounded-md transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Tersalin!" : "Salin Surat"}</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-[#5e6ad2] hover:bg-[#7170ff] text-white text-xs font-medium px-4 py-1.5 rounded-md transition-colors"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
