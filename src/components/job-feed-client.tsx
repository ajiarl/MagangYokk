"use client"

import { useState, useTransition } from "react"
import { Job, ApplicationStatus } from "@/lib/types"
import { JobCard } from "@/components/job-card"
import { StatusFilter } from "@/components/status-filter"
import { Search, SlidersHorizontal } from "lucide-react"
import { updateJobStatus } from "@/app/actions"

interface JobFeedClientProps {
  initialJobs: (Job & { applicationStatus?: ApplicationStatus | null })[]
}

const TECH_TAGS = ["Next.js", "React", "TypeScript", "Laravel", "Supabase", "MySQL", "PHP"]

export function JobFeedClient({ initialJobs }: JobFeedClientProps) {
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTech, setSelectedTech] = useState<string | null>(null)

  const [jobs, setJobs] = useState(initialJobs)
  const [, startTransition] = useTransition()

  function handleStatusChange(jobId: string, newStatus: ApplicationStatus) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, applicationStatus: newStatus } : j
      )
    )

    startTransition(async () => {
      const res = await updateJobStatus(jobId, newStatus)
      if (!res.success) {
        alert("Gagal update status: " + res.error)
        setJobs(initialJobs)
      }
    })
  }

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

  // Multi-layer filter: Status + Search query + Tech pill
  const filteredJobs = jobs.filter((job) => {
    // 1. Status Filter
    if (filter !== "all" && job.applicationStatus !== filter) return false

    // 2. Search Filter (Title / Company)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = job.title.toLowerCase().includes(q)
      const matchCompany = job.company.toLowerCase().includes(q)
      if (!matchTitle && !matchCompany) return false
    }

    // 3. Tech Stack Filter
    if (selectedTech) {
      const t = selectedTech.toLowerCase()
      const inDesc = job.description?.toLowerCase().includes(t)
      const inTitle = job.title.toLowerCase().includes(t)
      const inBreakdown = job.score_breakdown && Object.keys(job.score_breakdown).some((k) => k.includes(t))
      if (!inDesc && !inTitle && !inBreakdown) return false
    }

    return true
  })

  return (
    <div className="space-y-5">
      {/* Controls Bar: Search & Tech Chips */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-[#0f1011] rounded-xl border border-white/[0.06]">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#62666d]" />
          <input
            type="text"
            placeholder="Cari posisi atau perusahaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#08090a] border border-white/[0.06] focus:border-[#5e6ad2] text-xs text-[#f7f8f8] placeholder-[#62666d] rounded-lg pl-9 pr-3 py-2 outline-none transition-colors"
          />
        </div>

        {/* Tech Quick Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-[11px] text-[#62666d] font-mono shrink-0 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> Filter:
          </span>
          {TECH_TAGS.map((tech) => {
            const isSelected = selectedTech === tech
            return (
              <button
                key={tech}
                onClick={() => setSelectedTech(isSelected ? null : tech)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-md transition-all border shrink-0 ${
                  isSelected
                    ? "bg-[#5e6ad2] text-white border-[#5e6ad2]"
                    : "bg-white/[0.02] text-[#8a8f98] hover:text-[#d0d6e0] border-white/[0.06] hover:bg-white/[0.05]"
                }`}
              >
                {tech}
              </button>
            )
          })}
          {selectedTech && (
            <button
              onClick={() => setSelectedTech(null)}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-mono px-1.5 py-0.5 underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Tab Filter Status */}
      <StatusFilter
        currentFilter={filter}
        counts={counts}
        onFilterChange={setFilter}
      />

      {/* Feed Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/[0.08] rounded-2xl p-8 space-y-2 bg-[#0f1011]/40">
          <p className="text-sm font-medium text-[#d0d6e0]">Tidak ada lowongan yang cocok</p>
          <p className="text-xs text-[#8a8f98] max-w-sm mx-auto">
            Coba bersihkan kata kunci pencarian atau ganti filter status untuk melihat lowongan lain.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              initialStatus={job.applicationStatus}
              onStatusChange={(status) => handleStatusChange(job.id, status)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
