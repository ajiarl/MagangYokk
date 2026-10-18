"use client"

import { useState } from "react"
import { Job, ApplicationStatus } from "@/lib/types"
import { Sparkles, MapPin, Building2, ExternalLink, Calendar, GripVertical, FileText, Target } from "lucide-react"
import { NotesDrawerModal } from "@/components/notes-drawer-modal"
import { GapAnalysisModal } from "@/components/gap-analysis-modal"

interface KanbanBoardProps {
  jobs: (Job & { applicationStatus?: ApplicationStatus | null; applicationNotes?: string | null })[]
  onStatusChange: (jobId: string, newStatus: ApplicationStatus) => void
  onNotesChange?: (jobId: string, notes: string) => void
}

interface ColumnConfig {
  id: ApplicationStatus
  title: string
  color: string
  badgeBg: string
  borderHover: string
}

const COLUMNS: ColumnConfig[] = [
  {
    id: "saved",
    title: "Disimpan",
    color: "text-[#8a8f98]",
    badgeBg: "bg-white/[0.04] text-[#d0d6e0] border-white/[0.08]",
    borderHover: "hover:border-white/20"
  },
  {
    id: "applied",
    title: "Sudah Dilamar",
    color: "text-[#d0d6e0]",
    badgeBg: "bg-white/[0.06] text-[#d0d6e0] border-white/[0.1]",
    borderHover: "hover:border-white/25"
  },
  {
    id: "interview",
    title: "Interview",
    color: "text-amber-300",
    badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    borderHover: "hover:border-amber-500/30"
  },
  {
    id: "offered",
    title: "Penawaran",
    color: "text-emerald-300",
    badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    borderHover: "hover:border-emerald-500/30"
  },
  {
    id: "rejected",
    title: "Ditolak",
    color: "text-rose-300",
    badgeBg: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    borderHover: "hover:border-rose-500/30"
  }
]

export function KanbanBoard({ jobs, onStatusChange, onNotesChange }: KanbanBoardProps) {
  const [activeMobileCol, setActiveMobileCol] = useState<ApplicationStatus>("saved")
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<ApplicationStatus | null>(null)
  const [activeNotesJob, setActiveNotesJob] = useState<(Job & { applicationNotes?: string | null }) | null>(null)
  const [activeGapJob, setActiveGapJob] = useState<Job | null>(null)

  function handleDragStart(e: React.DragEvent, jobId: string) {
    e.dataTransfer.setData("text/plain", jobId)
    setDraggedJobId(jobId)
  }

  function handleDragOver(e: React.DragEvent, colId: ApplicationStatus) {
    e.preventDefault()
    if (dragOverCol !== colId) {
      setDragOverCol(colId)
    }
  }

  function handleDragLeave() {
    setDragOverCol(null)
  }

  function handleDrop(e: React.DragEvent, targetColId: ApplicationStatus) {
    e.preventDefault()
    const jobId = e.dataTransfer.getData("text/plain") || draggedJobId
    setDragOverCol(null)
    setDraggedJobId(null)

    if (jobId) {
      const job = jobs.find((j) => j.id === jobId)
      if (job && job.applicationStatus !== targetColId) {
        onStatusChange(jobId, targetColId)
      }
    }
  }

  function renderColumn(col: ColumnConfig) {
    const colJobs = jobs.filter((j) => (j.applicationStatus || "saved") === col.id)
    const isOver = dragOverCol === col.id

    return (
      <div
        key={col.id}
        onDragOver={(e) => handleDragOver(e, col.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, col.id)}
        className={`flex-1 rounded-xl bg-[#0c0d0e] border transition-all duration-150 flex flex-col min-h-[480px] md:min-h-[580px] p-3 ${
          isOver
            ? "border-[#5e6ad2] bg-[#141517] ring-1 ring-[#5e6ad2]/30"
            : "border-white/[0.06]"
        }`}
      >
        {/* Column Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] px-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-xs font-semibold tracking-wide ${col.color}`}>
              {col.title}
            </h3>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${col.badgeBg}`}>
              {colJobs.length}
            </span>
          </div>
        </div>

        {/* Drop Zone Area & Cards List */}
        <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[680px] pr-0.5">
          {colJobs.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center border border-dashed border-white/[0.05] rounded-lg p-4 text-center">
              <p className="text-[11px] text-[#8a8f98]">Belum ada lowongan di tahap ini</p>
            </div>
          ) : (
            colJobs.map((job) => {
              const score = job.score ? Number(job.score).toFixed(1) : null
              const isDraggingThis = draggedJobId === job.id

              return (
                <div
                  key={job.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, job.id)}
                  className={`group relative rounded-lg bg-[#0f1011] border border-white/[0.06] p-3.5 space-y-2.5 transition-all duration-150 cursor-grab active:cursor-grabbing hover:bg-[#141517] touch-manipulation ${
                    col.borderHover
                  } ${isDraggingThis ? "opacity-40 scale-95" : "shadow-sm hover:shadow-md"}`}
                >
                  {/* Drag Handle & Score */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-[#8a8f98] opacity-50 group-hover:opacity-100 shrink-0" />
                      <h4 className="text-xs font-medium text-[#f7f8f8] group-hover:text-white line-clamp-1">
                        {job.title}
                      </h4>
                    </div>

                    {score && (
                      <div className="shrink-0 flex items-center gap-0.5 text-[10px] font-mono font-medium text-[#7170ff] bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 px-1.5 py-0.5 rounded-md">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{score}</span>
                      </div>
                    )}
                  </div>

                  {/* Company & Location */}
                  <div className="space-y-1 pl-5 text-[11px] text-[#8a8f98]">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-[#8a8f98] shrink-0" />
                      <span className="truncate">{job.company}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[#8a8f98] shrink-0" />
                      <span className="truncate">
                        {job.is_remote ? "Remote" : job.location || "Indonesia"}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Status Move Buttons */}
                  <div className="md:hidden pt-2 border-t border-white/[0.04] flex items-center gap-1 overflow-x-auto scrollbar-none">
                    <span className="text-[9px] font-mono text-[#8a8f98] shrink-0">Pindah:</span>
                    {COLUMNS.filter((c) => c.id !== col.id).map((targetCol) => (
                      <button
                        key={targetCol.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onStatusChange(job.id, targetCol.id)
                        }}
                        className="text-[10px] font-mono px-2 py-1 rounded border border-white/[0.08] text-[#8a8f98] hover:text-white hover:bg-white/[0.08] transition-colors whitespace-nowrap active:scale-95 touch-manipulation"
                      >
                        → {targetCol.title}
                      </button>
                    ))}
                  </div>

                  {/* Footer card: Date / Notes / Direct Link */}
                  <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-[#8a8f98] pl-5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {job.scraped_at ? new Date(job.scraped_at).toLocaleDateString("id-ID", { month: "short", day: "numeric" }) : "Aktif"}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Gap Analysis trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveGapJob(job)
                        }}
                        className="h-7 w-7 inline-flex items-center justify-center rounded text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors touch-manipulation active:scale-95"
                        title="Analisis Kecocokan CV"
                      >
                        <Target className="w-3.5 h-3.5" />
                      </button>

                      {/* Notes trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveNotesJob(job)
                        }}
                        className={`h-7 w-7 inline-flex items-center justify-center rounded transition-colors relative touch-manipulation active:scale-95 ${
                          job.applicationNotes
                            ? "text-[#5e6ad2] bg-[#5e6ad2]/15 hover:bg-[#5e6ad2]/25"
                            : "text-[#8a8f98] hover:text-white hover:bg-white/[0.05]"
                        }`}
                        title={job.applicationNotes ? "Lihat Catatan" : "Tambah Catatan"}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {job.applicationNotes && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#5e6ad2]" />
                        )}
                      </button>

                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 px-2 inline-flex items-center justify-center rounded text-[#8a8f98] hover:text-[#5e6ad2] gap-0.5 transition-colors touch-manipulation active:scale-95"
                        title="Buka lowongan asli"
                      >
                        <span>Lamar</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-6">
      {/* Mobile Column Segmented Tabs */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none">
        {COLUMNS.map((col) => {
          const count = jobs.filter((j) => (j.applicationStatus || "saved") === col.id).length
          const isActive = activeMobileCol === col.id
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setActiveMobileCol(col.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all shrink-0 touch-manipulation active:scale-95 ${
                isActive
                  ? "bg-white/[0.1] text-white border-white/[0.2] shadow-sm"
                  : "text-[#8a8f98] bg-[#0c0d0e] border-white/[0.06] hover:bg-white/[0.04]"
              }`}
            >
              <span>{col.title}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${col.badgeBg}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mobile Single Column View */}
      <div className="md:hidden">
        {renderColumn(COLUMNS.find((c) => c.id === activeMobileCol) || COLUMNS[0])}
      </div>

      {/* Desktop Multi-column Kanban View */}
      <div className="hidden md:block overflow-x-auto scrollbar-thin">
        <div className="flex gap-4 min-w-[1050px] items-start">
          {COLUMNS.map((col) => renderColumn(col))}
        </div>
      </div>

      {/* Modal Gap Analysis for Kanban Card */}
      {activeGapJob && (
        <GapAnalysisModal
          jobId={activeGapJob.id}
          jobTitle={activeGapJob.title}
          company={activeGapJob.company}
          isOpen={!!activeGapJob}
          onClose={() => setActiveGapJob(null)}
        />
      )}

      {/* Modal Edit Notes for Kanban Card */}
      {activeNotesJob && (
        <NotesDrawerModal
          jobId={activeNotesJob.id}
          jobTitle={activeNotesJob.title}
          company={activeNotesJob.company}
          initialNotes={activeNotesJob.applicationNotes || null}
          isOpen={!!activeNotesJob}
          onClose={() => setActiveNotesJob(null)}
          onSaveNotes={(savedNotes) => {
            if (onNotesChange) onNotesChange(activeNotesJob.id, savedNotes)
            setActiveNotesJob(null)
          }}
        />
      )}
    </div>
  )
}
