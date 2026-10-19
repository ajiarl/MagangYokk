"use client"

import { useState, useTransition, useMemo } from "react"
import { Job, ApplicationStatus } from "@/lib/types"
import { JobCard } from "@/components/job-card"
import { KanbanBoard } from "@/components/kanban-board"
import { StatusFilter } from "@/components/status-filter"
import { ResumeUploadModal } from "@/components/resume-upload-modal"
import { NotesDrawerModal } from "@/components/notes-drawer-modal"
import { GapAnalysisModal } from "@/components/gap-analysis-modal"
import { CoverLetterModal } from "@/components/cover-letter-modal"
import { getJobEduCategory, formatRelativeTime } from "@/lib/job-utils"
import {
  Search,
  RefreshCw,
  LayoutGrid,
  Upload,
  Kanban
} from "lucide-react"
import { updateJobStatus } from "@/app/actions"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"

interface JobFeedClientProps {
  initialJobs: (Job & { applicationStatus?: ApplicationStatus | null; applicationNotes?: string | null })[]
  latestScrapedAt?: string | null
}

const TECH_TAGS = ["Next.js", "React", "TypeScript", "Laravel", "Supabase", "MySQL", "PHP"]

type EducationTarget = "all" | "intern" | "freshgrad"
type ViewMode = "feed" | "kanban"

export function JobFeedClient({ initialJobs, latestScrapedAt }: JobFeedClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("feed")
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTech, setSelectedTech] = useState<string[]>([])
  const [eduTarget, setEduTarget] = useState<EducationTarget>("all")
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)
  const [coverLetterJob, setCoverLetterJob] = useState<Job | null>(null)
  const [activeGapJob, setActiveGapJob] = useState<Job | null>(null)
  const [activeNotesJob, setActiveNotesJob] = useState<(Job & { applicationNotes?: string | null }) | null>(null)

  const { user, applications, openAuthModal, setLocalApplication } = useAuth()
  const jobs = useMemo(() => {
    return initialJobs.map((j) => {
      const userApp = applications[j.id]
      return {
        ...j,
        applicationStatus: userApp ? userApp.status : null,
        applicationNotes: userApp ? userApp.notes : null,
      }
    })
  }, [initialJobs, applications])
  const [, startTransition] = useTransition()

  function handleTechToggle(tech: string) {
    setSelectedTech((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    )
  }

  function handleStatusChange(jobId: string, newStatus: ApplicationStatus) {
    if (!user) {
      openAuthModal("Masuk terlebih dahulu untuk menyimpan status lamaran.")
      return
    }

    const previousStatus = applications[jobId]?.status ?? null
    setLocalApplication(jobId, newStatus)

    startTransition(async () => {
      const res = await updateJobStatus(jobId, newStatus)
      if (!res.success) {
        toast.error("Gagal update status: " + res.error)
        setLocalApplication(jobId, previousStatus)
      }
    })
  }

  function handleNotesChange(jobId: string, newNotes: string) {
    if (!user) {
      openAuthModal("Masuk terlebih dahulu untuk menambahkan catatan lamaran.")
      return
    }

    const currentStatus = applications[jobId]?.status ?? "saved"
    setLocalApplication(jobId, currentStatus, newNotes)
  }

  function handleOpenCoverLetter(job: Job) {
    if (!user) {
      openAuthModal("Masuk terlebih dahulu untuk membuat cover letter otomatis via AI.")
      return
    }
    setCoverLetterJob(job)
  }

  function handleOpenGap(job: Job) {
    if (!user) {
      openAuthModal("Masuk terlebih dahulu untuk menganalisis kecocokan resume.")
      return
    }
    setActiveGapJob(job)
  }

  function handleOpenNotes(job: Job & { applicationNotes?: string | null }) {
    if (!user) {
      openAuthModal("Masuk terlebih dahulu untuk menambahkan catatan lamaran.")
      return
    }
    setActiveNotesJob(job)
  }

  function handleOpenResumeUpload() {
    if (!user) {
      openAuthModal("Masuk terlebih dahulu untuk mengunggah resume.")
      return
    }
    setIsResumeModalOpen(true)
  }

  // Hitung counter untuk kategori pendidikan
  const internCount = jobs.filter((j) => getJobEduCategory(j) === "intern").length
  const freshgradCount = jobs.filter((j) => getJobEduCategory(j) === "freshgrad").length

  // Counter Tab Status
  const counts: Record<string, number> = {
    all: jobs.length,
    saved: 0,
    applied: 0,
    interview: 0,
    offered: 0,
    rejected: 0
  }

  jobs.forEach((job) => {
    if (job.applicationStatus && counts[job.applicationStatus] !== undefined) {
      counts[job.applicationStatus]++
    }
  })

  // Multi-layer filter: Status + Search query + Tech pill + Education Target
  const filteredJobs = jobs.filter((job) => {
    // 1. Status Filter (Hanya berlaku di Feed Mode)
    if (viewMode === "feed" && filter !== "all" && job.applicationStatus !== filter) return false

    // 2. Search Filter (Title / Company)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = job.title.toLowerCase().includes(q)
      const matchCompany = job.company.toLowerCase().includes(q)
      if (!matchTitle && !matchCompany) return false
    }

    // 3. Tech Stack Filter
    if (selectedTech.length > 0) {
      const matchesAll = selectedTech.every((tech) => {
        const t = tech.toLowerCase()
        const inDesc = job.description?.toLowerCase().includes(t)
        const inTitle = job.title.toLowerCase().includes(t)
        const inBreakdown =
          job.score_breakdown &&
          Object.entries(job.score_breakdown).some(
            ([k, val]) => Boolean(val) && k.toLowerCase().includes(t)
          )
        return inDesc || inTitle || inBreakdown
      })
      if (!matchesAll) return false
    }

    // 4. Education / Graduation Target Filter
    if (eduTarget !== "all") {
      const cat = getJobEduCategory(job)
      if (cat !== eduTarget) return false
    }

    return true
  })

  return (
    <div className="space-y-4">
      {/* Integrated Unified Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
        {/* Search Input (Frameless & Fast) */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8f98]" />
          <input
            type="text"
            placeholder="Filter posisi atau perusahaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-[#0c0d0e] border border-white/[0.08] focus:border-white/[0.2] text-xs text-[#f7f8f8] placeholder-[#8a8f98] rounded-lg pl-8.5 pr-3 py-2 transition-all font-mono touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-1 focus-visible:ring-offset-[#08090a]"
          />
        </div>

        {/* Action Controls & Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Target Edu (Subtle Segmented) */}
          <div className="inline-flex rounded-lg border border-white/[0.08] p-0.5 bg-white/[0.02]">
            <button
              onClick={() => setEduTarget("all")}
              className={`px-2.5 py-1 text-[11px] rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-1 focus-visible:ring-offset-[#08090a] ${
                eduTarget === "all"
                  ? "bg-white/[0.1] text-white font-medium"
                  : "text-[#8a8f98] hover:text-[#d0d6e0]"
              }`}
            >
              Semua ({jobs.length})
            </button>
            <button
              onClick={() => setEduTarget("intern")}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-1 focus-visible:ring-offset-[#08090a] ${
                eduTarget === "intern"
                  ? "bg-emerald-500/20 text-emerald-300 font-medium"
                  : "text-[#8a8f98] hover:text-[#d0d6e0]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Magang ({internCount})
            </button>
            <button
              onClick={() => setEduTarget("freshgrad")}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-1 focus-visible:ring-offset-[#08090a] ${
                eduTarget === "freshgrad"
                  ? "bg-amber-500/20 text-amber-300 font-medium"
                  : "text-[#8a8f98] hover:text-[#d0d6e0]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Fresh Grad ({freshgradCount})
            </button>
          </div>

          <div className="w-[1px] h-4 bg-white/[0.08] mx-0.5" />

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-white/[0.08] p-0.5 bg-white/[0.02]">
            <button
              onClick={() => setViewMode("feed")}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-1 focus-visible:ring-offset-[#08090a] ${
                viewMode === "feed"
                  ? "bg-white/[0.1] text-white font-medium"
                  : "text-[#8a8f98] hover:text-[#d0d6e0]"
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              Feed
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-1 focus-visible:ring-offset-[#08090a] ${
                viewMode === "kanban"
                  ? "bg-white/[0.1] text-white font-medium"
                  : "text-[#8a8f98] hover:text-[#d0d6e0]"
              }`}
            >
              <Kanban className="w-3 h-3" />
              Board
            </button>
          </div>

          <div className="w-[1px] h-4 bg-white/[0.08] mx-0.5" />

          {/* CV Sync */}
          <button
            type="button"
            onClick={handleOpenResumeUpload}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-lg border border-white/[0.08] hover:border-white/[0.2] bg-white/[0.02] hover:bg-white/[0.06] text-[#d0d6e0] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090a]"
          >
            <Upload className="w-3 h-3 text-[#8a8f98]" />
            <span>CV</span>
          </button>
        </div>
      </div>
      {/* Mobile Scraper Sync Badge */}
      {latestScrapedAt && (
        <div className="sm:hidden flex items-center gap-1.5 text-[10.5px] font-mono text-[#8a8f98] pb-0.5 px-0.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span suppressHydrationWarning>Sinkronisasi: {formatRelativeTime(latestScrapedAt)}</span>
        </div>
      )}

      {/* Tech Stack Horizontal Filter Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
        <span className="text-[#8a8f98] shrink-0 mr-1">Stack:</span>
        {TECH_TAGS.map((tech) => {
          const isSelected = selectedTech.includes(tech)
          return (
            <button
              key={tech}
              onClick={() => handleTechToggle(tech)}
              className={`px-2 py-0.5 rounded transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-1 focus-visible:ring-offset-[#08090a] ${
                isSelected
                  ? "bg-white/[0.12] text-white border border-white/[0.2]"
                  : "text-[#8a8f98] hover:text-white bg-transparent hover:bg-white/[0.04]"
              }`}
            >
              {tech}
            </button>
          )
        })}
        {selectedTech.length > 0 && (
          <button
            onClick={() => setSelectedTech([])}
            className="text-[10px] text-rose-400 hover:text-rose-300 ml-1 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2] rounded shrink-0"
          >
            Reset Stack{selectedTech.length > 1 ? ` (${selectedTech.length})` : ""}
          </button>
        )}
      </div>

      {/* Tampilan View: Kanban Board vs Feed Cards */}
      {viewMode === "kanban" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#8a8f98] px-1 font-mono">
            <span>Tarik dan geser kartu ke kolom yang diinginkan untuk update status otomatis</span>
            <span>Total {filteredJobs.length} loker terpantau</span>
          </div>
          <KanbanBoard
            jobs={filteredJobs}
            onStatusChange={handleStatusChange}
            onNotesChange={handleNotesChange}
          />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Tab Filter Status (Khusus Feed View) */}
          <StatusFilter
            currentFilter={filter}
            counts={counts}
            onFilterChange={setFilter}
          />

          {/* Feed Grid */}
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16 sm:py-20 border border-dashed border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-3 bg-[#0f1011]/40">
              <p className="text-sm font-medium text-[#d0d6e0]">Tidak ada lowongan yang cocok</p>
              <p className="text-xs text-[#8a8f98] max-w-sm mx-auto">
                Coba ganti filter target posisi (Magang Mahasiswa / Fresh Graduate) atau bersihkan kata kunci pencarian.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedTech([])
                  setEduTarget("all")
                  setFilter("all")
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-white transition-all active:scale-95 touch-manipulation cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#8a8f98]" />
                <span>Reset Semua Filter</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  initialStatus={job.applicationStatus}
                  initialNotes={job.applicationNotes}
                  onStatusChange={(status) => handleStatusChange(job.id, status)}
                  onOpenCoverLetter={handleOpenCoverLetter}
                  onOpenGap={handleOpenGap}
                  onOpenNotes={handleOpenNotes}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Upload CV PDF */}
      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
      />

      {/* Modal Gap Analysis */}
      {activeGapJob && (
        <GapAnalysisModal
          jobId={activeGapJob.id}
          jobTitle={activeGapJob.title}
          company={activeGapJob.company}
          isOpen={!!activeGapJob}
          onClose={() => setActiveGapJob(null)}
        />
      )}

      {/* Modal Edit Notes */}
      {activeNotesJob && (
        <NotesDrawerModal
          jobId={activeNotesJob.id}
          jobTitle={activeNotesJob.title}
          company={activeNotesJob.company}
          initialNotes={activeNotesJob.applicationNotes || null}
          isOpen={!!activeNotesJob}
          onClose={() => setActiveNotesJob(null)}
          onSaveNotes={(savedNotes) => {
            handleNotesChange(activeNotesJob.id, savedNotes)
            setActiveNotesJob(null)
          }}
        />
      )}

      {/* Cover Letter Drafter Modal (Hybrid Bottom-Sheet) */}
      <CoverLetterModal
        key={coverLetterJob?.id}
        job={coverLetterJob}
        isOpen={Boolean(coverLetterJob)}
        onClose={() => setCoverLetterJob(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
