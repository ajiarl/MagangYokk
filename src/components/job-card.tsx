"use client"

import { useState, useTransition } from "react"
import { Job, ApplicationStatus } from "@/lib/types"
import { Sparkles, MapPin, Building2, FileText, ArrowUpRight, Target } from "lucide-react"
import { updateJobStatus } from "@/app/actions"

interface JobCardProps {
  job: Job & { applicationNotes?: string | null }
  initialStatus?: ApplicationStatus | null
  initialNotes?: string | null
  onStatusChange?: (status: ApplicationStatus) => void
  onOpenCoverLetter?: (job: Job) => void
  onOpenGap?: (job: Job) => void
  onOpenNotes?: (job: Job & { applicationNotes?: string | null }) => void
}

export function JobCard({
  job,
  initialStatus,
  initialNotes = null,
  onStatusChange,
  onOpenCoverLetter,
  onOpenGap,
  onOpenNotes
}: JobCardProps) {
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus | null>(initialStatus || null)
  const [isPending, startTransition] = useTransition()

  const score = job.score ? Number(job.score).toFixed(1) : null
  const hasNotes = Boolean(initialNotes || job.applicationNotes)

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

  return (
    <div className="group relative rounded-xl bg-[#0b0c0d] border border-white/[0.06] hover:border-white/[0.14] transition-all duration-150 flex flex-col justify-between p-4.5 hover:bg-[#0f1011]">
      {/* Top bar: Title, Company, Score */}
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 pr-2">
            <h4 className="font-medium text-[13px] text-[#f7f8f8] group-hover:text-white transition-colors leading-snug line-clamp-1">
              {job.title}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-[#8a8f98]">
              <Building2 className="w-3 h-3 text-[#8a8f98]" />
              <span className="font-normal text-[11px]">{job.company}</span>
            </div>
          </div>

          {score && (
            <div className="shrink-0 flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded text-[11px] font-mono text-[#d0d6e0]">
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
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Magang
                </span>
              )
            }
            return (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Freshgrad
              </span>
            )
          })()}

          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-mono border ${
            job.is_remote
              ? "bg-white/[0.04] text-[#d0d6e0] border-white/[0.08]"
              : "bg-transparent text-[#8a8f98] border-white/[0.05]"
          }`}>
            <MapPin className="w-2.5 h-2.5" />
            {job.is_remote ? "Remote" : job.location || "On-site"}
          </span>

          {job.is_paid !== null && (
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
              job.is_paid
                ? "bg-white/[0.04] text-[#d0d6e0] border-white/[0.08]"
                : "bg-transparent text-[#8a8f98] border-white/[0.05]"
            }`}>
              {job.is_paid ? "Paid" : "Unpaid"}
            </span>
          )}

          <span className="text-[10px] uppercase font-mono tracking-wider text-[#8a8f98] ml-auto">
            {job.source}
          </span>
        </div>

        {/* Snippet Description */}
        {job.description && (
          <p className="text-[11px] text-[#8a8f98] leading-relaxed line-clamp-2 font-normal">
            {job.description}
          </p>
        )}

        {/* Matched Tech Chips */}
        {job.score_breakdown && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(job.score_breakdown).map(([skill, matched]) =>
              matched ? (
                <span
                  key={skill}
                  className="bg-white/[0.02] text-[#8a8f98] border border-white/[0.05] text-[9px] px-1.5 py-0.2 rounded font-mono"
                >
                  {skill.replace("_", " ")}
                </span>
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Footer: Status select & Actions */}
      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between gap-2">
        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={currentStatus || ""}
            onChange={(e) => {
              const val = e.target.value as ApplicationStatus
              if (val) handleStatusChange(val)
            }}
            disabled={isPending}
            className="h-9 sm:h-8 appearance-none bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-[11px] font-mono text-[#d0d6e0] rounded-lg px-2.5 pr-6 cursor-pointer focus:outline-none focus:border-white/[0.2] transition-colors touch-manipulation"
          >
            <option value="" disabled className="bg-[#0b0c0d] text-[#8a8f98]">Status...</option>
            <option value="saved" className="bg-[#0b0c0d]">Disimpan</option>
            <option value="applied" className="bg-[#0b0c0d]">Sudah Dilamar</option>
            <option value="interview" className="bg-[#0b0c0d]">Interview</option>
            <option value="offered" className="bg-[#0b0c0d]">Penawaran</option>
            <option value="rejected" className="bg-[#0b0c0d]">Ditolak</option>
          </select>
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#8a8f98] text-[9px]">
            ▾
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Gap Analysis Button */}
          <button
            type="button"
            onClick={() => onOpenGap?.(job)}
            className="h-9 w-9 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-lg text-[#8a8f98] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors touch-manipulation active:scale-95"
            title="Analisis Kecocokan CV"
          >
            <Target className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Notes Button */}
          <button
            type="button"
            onClick={() => onOpenNotes?.(job)}
            className={`h-9 w-9 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-lg transition-colors relative touch-manipulation active:scale-95 ${
              hasNotes
                ? "text-[#d0d6e0] bg-white/[0.08]"
                : "text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-white/[0.04]"
            }`}
            title={hasNotes ? "Catatan" : "Tambah Catatan"}
          >
            <FileText className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            {hasNotes && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
            )}
          </button>

          {/* External Link */}
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="h-9 w-9 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-lg text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-white/[0.04] transition-colors touch-manipulation active:scale-95"
            title="Buka Lowongan Asli"
          >
            <ArrowUpRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </a>

          {/* Cover Letter Drafter Button */}
          <button
            type="button"
            onClick={() => onOpenCoverLetter?.(job)}
            className="h-9 sm:h-8 inline-flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-[#f7f8f8] text-[11px] font-mono px-3 rounded-lg transition-all active:scale-95 touch-manipulation"
          >
            <Sparkles className="w-3 h-3 text-[#8a8f98]" />
            <span>Cover Letter</span>
          </button>
        </div>
      </div>
    </div>
  )
}
