import { supabase } from "@/lib/supabase"
import { Job, ApplicationStatus } from "@/lib/types"
import { JobFeedClient } from "@/components/job-feed-client"
import { Sparkles, Terminal } from "lucide-react"

export const revalidate = 0

async function getJobsWithApplications(): Promise<(Job & { applicationStatus?: ApplicationStatus | null; applicationNotes?: string | null })[]> {
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("*")
    .order("score", { ascending: false, nullsFirst: false })
    .order("scraped_at", { ascending: false })
    .limit(100)

  if (jobsError || !jobs) return []

  const { data: applications } = await supabase
    .from("applications")
    .select("job_id, status, notes")

  const appMap = new Map<string, { status: ApplicationStatus; notes: string | null }>()
  if (applications) {
    applications.forEach((app) => {
      appMap.set(app.job_id, {
        status: app.status as ApplicationStatus,
        notes: app.notes || null
      })
    })
  }

  return jobs.map((job) => {
    const userApp = appMap.get(job.id)
    return {
      ...job,
      applicationStatus: userApp?.status || null,
      applicationNotes: userApp?.notes || null
    }
  })
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
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] antialiased selection:bg-[#5e6ad2]/30 selection:text-white">
      {/* Header Sticky Linear Style */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08090a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#5e6ad2] flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <Terminal className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-sm tracking-tight text-[#f7f8f8]">MagangYokk</span>
              <span className="text-[10px] font-mono text-[#62666d]">radar.v0.2</span>
            </div>
          </div>

          {profile && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-medium text-[#d0d6e0]">{profile.full_name}</div>
                <div className="text-[10px] font-mono text-[#62666d]">
                  Threshold: {profile.score_threshold}.0+
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xs font-mono font-medium text-[#7170ff]">
                A
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-5 py-8 space-y-6">
        {/* Subtle Ambient Banner */}
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-r from-[#0f1011] via-[#141517] to-[#0f1011] p-5 shadow-sm">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Radar Active
                </span>
                <span className="text-xs text-[#8a8f98]">LinkedIn Scraper Daemon</span>
              </div>
              <p className="text-xs text-[#d0d6e0] max-w-xl leading-relaxed">
                Menyaring lowongan magang web development secara otomatis berdasarkan kecocokan stack: Next.js, React, TypeScript, Laravel, dan Supabase.
              </p>
            </div>

            <div className="flex items-baseline gap-2 shrink-0">
              <span className="text-2xl font-mono font-bold text-[#f7f8f8]">{jobsWithApps.length}</span>
              <span className="text-xs text-[#8a8f98] font-mono">lowongan terindeks</span>
            </div>
          </div>
        </div>

        {/* Client Search, Filters, Tabs & Grid */}
        <JobFeedClient initialJobs={jobsWithApps} />
      </main>
    </div>
  )
}
