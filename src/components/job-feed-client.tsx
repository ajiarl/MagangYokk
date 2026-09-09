"use client"

import { useState, useTransition } from "react"
import { Job, ApplicationStatus } from "@/lib/types"
import { JobCard } from "@/components/job-card"
import { StatusFilter } from "@/components/status-filter"
import { Filter } from "lucide-react"
import { updateJobStatus } from "@/app/actions"

interface JobFeedClientProps {
  initialJobs: (Job & { applicationStatus?: ApplicationStatus | null })[]
}

export function JobFeedClient({ initialJobs }: JobFeedClientProps) {
  const [filter, setFilter] = useState<string>("all")
  // State lokal jobs agar counter dan tab langsung reaktif instan (optimistic UI)
  const [jobs, setJobs] = useState(initialJobs)
  const [, startTransition] = useTransition()

  // Handler update status terpusat: update state lokal duluan, lalu trigger Server Action
  function handleStatusChange(jobId: string, newStatus: ApplicationStatus) {
    setJobs((prevJobs) =>
      prevJobs.map((j) =>
        j.id === jobId ? { ...j, applicationStatus: newStatus } : j
      )
    )

    startTransition(async () => {
      const res = await updateJobStatus(jobId, newStatus)
      if (!res.success) {
        alert("Gagal update status: " + res.error)
        // Rollback jika server action gagal
        setJobs(initialJobs)
      }
    })
  }

  // Hitung counter per tab status dari state `jobs` lokal
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

  // Filter jobs berdasarkan tab aktif
  const filteredJobs = jobs.filter((job) => {
    if (filter === "all") return true
    return job.applicationStatus === filter
  })

  return (
    <div className="space-y-4">
      {/* Tab Filter Status */}
      <StatusFilter
        currentFilter={filter}
        counts={counts}
        onFilterChange={setFilter}
      />

      {/* List Feed */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl p-8 space-y-2 bg-white dark:bg-zinc-900/40">
          <Filter className="w-8 h-8 mx-auto text-zinc-400" />
          <h3 className="font-semibold text-sm">Tidak ada lowongan di kategori ini</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {filter === "all"
              ? "Belum ada lowongan baru yang masuk ke database."
              : `Kamu belum menandai lowongan apa pun dengan status "${filter}".`}
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
