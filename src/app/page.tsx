import { supabase } from "@/lib/supabase"
import { Job, ApplicationStatus } from "@/lib/types"
import { JobFeedClient } from "@/components/job-feed-client"
import { Sparkles, Briefcase } from "lucide-react"

export const revalidate = 0 // Server render fresh data

async function getJobsWithApplications(): Promise<(Job & { applicationStatus?: ApplicationStatus | null })[]> {
  // 1. Ambil jobs terbaru
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("*")
    .order("score", { ascending: false, nullsFirst: false })
    .order("scraped_at", { ascending: false })
    .limit(100)

  if (jobsError || !jobs) {
    console.error("Gagal fetch jobs:", jobsError)
    return []
  }

  // 2. Ambil data tracking applications untuk di-merge
  const { data: applications } = await supabase
    .from("applications")
    .select("job_id, status")

  const appMap = new Map<string, ApplicationStatus>()
  if (applications) {
    applications.forEach((app) => {
      appMap.set(app.job_id, app.status as ApplicationStatus)
    })
  }

  return jobs.map((job) => ({
    ...job,
    applicationStatus: appMap.get(job.id) || null
  }))
}

async function getProfile() {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, skills, score_threshold")
    .limit(1)
    .single()

  return data
}

export default async function Home() {
  const [jobsWithApps, profile] = await Promise.all([
    getJobsWithApplications(),
    getProfile()
  ])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">MagangYokk</span>
              <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
                MVP v0.2
              </span>
            </div>
          </div>

          {profile && (
            <div className="text-right text-xs">
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                {profile.full_name}
              </div>
              <div className="text-[11px] text-zinc-500">
                Min. Match: {profile.score_threshold}/10
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Banner Status Radar */}
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                Radar Magang Otomatis Aktif
              </p>
              <p className="text-emerald-700 dark:text-emerald-400">
                Scoring otomatis via stack utama kamu (Next.js, React, TypeScript, Laravel, Supabase, MySQL).
              </p>
            </div>
          </div>
          <div className="text-right font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {jobsWithApps.length} Lowongan
          </div>
        </div>

        {/* Client-side Feed dengan Status Tabs & Actions */}
        <JobFeedClient initialJobs={jobsWithApps} />
      </main>
    </div>
  )
}
